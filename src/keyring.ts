/**
 * 密钥保险箱（keyring）。
 *
 * 把 runtime key 存进 Windows 凭据管理器（CredMan 通用凭据），而不是明文写进配置文件。
 * 配置里只记录一个标记（apiKeyStore: 'keyring'），启动隧道时再从这里取出来，
 * 通过环境变量传给子进程——密钥全程不落盘、不进命令行参数。
 *
 * 实现说明：读写统一走 Advapi32 的 CredWrite / CredRead / CredDelete（经 PowerShell 内联 P/Invoke）。
 * 早期版本写入用 cmdkey、读取用 WinRT PasswordVault——两者并不互通，会出现“存进去了却读不出来”；
 * 现在读取端能直接读回 cmdkey 写入的同名旧条目（同为 CredMan 通用凭据），无需重新保存密钥。
 * 密钥经 stdin 以 base64 递交给脚本，不经过命令行参数，也不会出现在进程列表里。
 *
 * 非 Windows 平台目前不提供系统级保险箱，调用方会得到 supported=false，
 * 面板会把该选项隐藏并继续推荐环境变量的做法。
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const TARGET_PREFIX = 'mcphelm/tunnel/';
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const PS_TIMEOUT_MS = 20000;

export interface KeyringResult {
  ok: boolean;
  error?: string;
}

/** 当前平台是否支持系统级密钥保险箱 */
export function keyringSupported(): boolean {
  return process.platform === 'win32';
}

function targetName(tunnelName: string): string {
  return TARGET_PREFIX + tunnelName;
}

/** 生成一个与真实密钥无关的本地用户名（CredMan 条目需要一个用户名占位） */
function randomUser(): string {
  const bytes = randomBytes(12);
  let out = '';
  for (const byte of bytes) out += KEY_CHARS[byte % KEY_CHARS.length];
  return 'u_' + out;
}

function toB64(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

/**
 * 把凭据 blob 解码回字符串：优先按 UTF-16LE（Windows 凭据管理器与 cmdkey 的存储惯例），
 * 否则按 UTF-8 兜底；无法解码或内容为空时返回 null。
 */
export function decodeSecretBlob(blob: Buffer): string | null {
  if (blob.length === 0) return null;
  let zerosAtOdd = 0;
  for (let i = 1; i < blob.length; i += 2) {
    if (blob[i] === 0) zerosAtOdd += 1;
  }
  const oddSlots = Math.floor(blob.length / 2);
  let text: string;
  if (oddSlots > 0 && zerosAtOdd / oddSlots >= 0.5) {
    text = blob.toString('utf16le');
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(blob);
    } catch {
      return null;
    }
  }
  const trimmed = text.replace(/\u0000+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

/* ------------------------------------------------------------------ */
/* PowerShell 桥：内联 C# 声明 Advapi32 凭据 API，脚本经 -EncodedCommand
/* 传入；动态数据（目标名、用户名、密钥）经 stdin 以 base64 JSON 传入。 */
/* ------------------------------------------------------------------ */

const CSHARP_SOURCE = [
  'using System;',
  'using System.Runtime.InteropServices;',
  '',
  'public static class McphelmCred',
  '{',
  '    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]',
  '    public struct CREDENTIAL',
  '    {',
  '        public uint Flags;',
  '        public uint Type;',
  '        public IntPtr TargetName;',
  '        public IntPtr Comment;',
  '        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;',
  '        public uint CredentialBlobSize;',
  '        public IntPtr CredentialBlob;',
  '        public uint Persist;',
  '        public uint AttributeCount;',
  '        public IntPtr Attributes;',
  '        public IntPtr TargetAlias;',
  '        public IntPtr UserName;',
  '    }',
  '',
  '    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]',
  '    public static extern bool CredWrite(ref CREDENTIAL cred, uint flags);',
  '',
  '    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]',
  '    public static extern bool CredRead(string target, uint type, uint flags, out IntPtr credPtr);',
  '',
  '    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]',
  '    public static extern bool CredDelete(string target, uint type, uint flags);',
  '',
  '    [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]',
  '    public static extern void CredFree(IntPtr buf);',
  '}',
].join('\n');

const PS_HEAD = [
  "$ErrorActionPreference = 'Stop'",
  "$src = @'",
  CSHARP_SOURCE,
  "'@",
  'Add-Type -TypeDefinition $src -Language CSharp | Out-Null',
  '$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json',
  '$target = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload.target_b64))',
].join('\n');

const PS_SET_BODY = [
  '$user = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload.user_b64))',
  '$blob = [Convert]::FromBase64String($payload.secret_b64)',
  '',
  '# 先清掉同名旧条目（cmdkey 时代可能留下多条），再写入新条目',
  'for ($i = 0; $i -lt 8; $i++) {',
  '  if (-not [McphelmCred]::CredDelete($target, 1, 0)) { break }',
  '}',
  '',
  "$cred = New-Object 'McphelmCred+CREDENTIAL'",
  '$cred.Type = 1',
  '$cred.TargetName = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($target)',
  '$cred.CredentialBlobSize = [uint32]$blob.Length',
  '$blobPtr = [Runtime.InteropServices.Marshal]::AllocCoTaskMem($blob.Length)',
  '[Runtime.InteropServices.Marshal]::Copy($blob, 0, $blobPtr, $blob.Length)',
  '$cred.CredentialBlob = $blobPtr',
  '$cred.Persist = 2',
  '$cred.UserName = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($user)',
  '$ok = [McphelmCred]::CredWrite([ref]$cred, 0)',
  '$err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()',
  '[void][Runtime.InteropServices.Marshal]::FreeCoTaskMem($cred.TargetName)',
  '[void][Runtime.InteropServices.Marshal]::FreeCoTaskMem($blobPtr)',
  '[void][Runtime.InteropServices.Marshal]::FreeCoTaskMem($cred.UserName)',
  "if (-not $ok) { [Console]::Out.Write('ERR:' + $err); exit 1 }",
  "[Console]::Out.Write('OK')",
].join('\n');

const PS_GET_BODY = [
  '$ptr = [IntPtr]::Zero',
  '$ok = [McphelmCred]::CredRead($target, 1, 0, [ref]$ptr)',
  "if (-not $ok) { [Console]::Out.Write('ERR:' + [Runtime.InteropServices.Marshal]::GetLastWin32Error()); exit 3 }",
  'try {',
  "  $cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [Type]'McphelmCred+CREDENTIAL')",
  '  $blob = New-Object byte[] ([int]$cred.CredentialBlobSize)',
  '  if ($cred.CredentialBlobSize -gt 0) { [Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $blob, 0, [int]$cred.CredentialBlobSize) }',
  '  [Console]::Out.Write([Convert]::ToBase64String($blob))',
  '} finally {',
  '  [McphelmCred]::CredFree($ptr)',
  '}',
].join('\n');

const PS_DELETE_BODY = [
  '$removed = 0',
  'for ($i = 0; $i -lt 8; $i++) {',
  '  if (-not [McphelmCred]::CredDelete($target, 1, 0)) { break }',
  '  $removed += 1',
  '}',
  "[Console]::Out.Write('OK:' + $removed)",
].join('\n');

interface PsResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runPowerShell(script: string, payload: string): Promise<PsResult> {
  return new Promise((done) => {
    // -EncodedCommand 用 UTF-16LE base64 传脚本，规避引号与中文带来的转义问题
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const settle = (result: PsResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(result);
    };
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* 进程已退出 */
      }
      settle({ status: -9, stdout, stderr: stderr + '（脚本执行超时）' });
    }, PS_TIMEOUT_MS);
    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (err) => settle({ status: -1, stdout, stderr: err.message }));
    child.on('exit', (code) => settle({ status: code ?? -1, stdout, stderr }));
    if (child.stdin) {
      child.stdin.on('error', () => {
        /* 子进程提前退出时忽略写入失败 */
      });
      child.stdin.write(payload);
      child.stdin.end();
    }
  });
}

function psErrorDetail(result: PsResult): string {
  const match = /ERR:(-?\d+)/.exec(result.stdout);
  const code = match ? match[1] : undefined;
  if (code === '1312') {
    return '错误 1312：当前登录会话不允许写入本机持久凭据，请改用环境变量方式保存密钥';
  }
  if (code !== undefined) return '错误码 ' + code;
  const line = result.stderr
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  return line ? line.slice(0, 200) : '未知错误';
}

/** 把密钥写进 Windows 凭据管理器 */
export async function keyringSet(tunnelName: string, secret: string): Promise<KeyringResult> {
  if (!keyringSupported()) return { ok: false, error: '当前平台不支持系统密钥保险箱' };
  if (!secret) return { ok: false, error: '密钥为空' };
  const payload = JSON.stringify({
    target_b64: toB64(targetName(tunnelName)),
    user_b64: toB64(randomUser()),
    secret_b64: Buffer.from(secret, 'utf16le').toString('base64'),
  });
  const result = await runPowerShell(PS_HEAD + '\n' + PS_SET_BODY, payload);
  if (result.status === 0 && result.stdout.trim() === 'OK') return { ok: true };
  return { ok: false, error: '写入 Windows 凭据管理器失败：' + psErrorDetail(result) };
}

/** 从 Windows 凭据管理器读取密钥；取不到返回 null */
export async function keyringGet(tunnelName: string): Promise<string | null> {
  if (!keyringSupported()) return null;
  const payload = JSON.stringify({ target_b64: toB64(targetName(tunnelName)) });
  const result = await runPowerShell(PS_HEAD + '\n' + PS_GET_BODY, payload);
  if (result.status !== 0) return null;
  const encoded = result.stdout.trim();
  if (!encoded) return null;
  return decodeSecretBlob(Buffer.from(encoded, 'base64'));
}

/** 判断某条隧道的密钥是否已经存在保险箱里（不读出内容） */
export async function keyringHas(tunnelName: string): Promise<boolean> {
  if (!keyringSupported()) return false;
  const payload = JSON.stringify({ target_b64: toB64(targetName(tunnelName)) });
  const result = await runPowerShell(PS_HEAD + '\n' + PS_GET_BODY, payload);
  return result.status === 0;
}

/** 从保险箱删除某条隧道的密钥（条目不存在也算成功，幂等） */
export async function keyringDelete(tunnelName: string): Promise<KeyringResult> {
  if (!keyringSupported()) return { ok: false, error: '当前平台不支持系统密钥保险箱' };
  const payload = JSON.stringify({ target_b64: toB64(targetName(tunnelName)) });
  const result = await runPowerShell(PS_HEAD + '\n' + PS_DELETE_BODY, payload);
  if (result.status === 0) return { ok: true };
  return { ok: false, error: '删除凭据失败：' + psErrorDetail(result) };
}

