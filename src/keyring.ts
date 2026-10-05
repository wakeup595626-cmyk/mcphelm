/**
 * 密钥保险箱（keyring）。
 *
 * 把 runtime key 存进 Windows 凭据管理器（cmdkey），而不是明文写进配置文件。
 * 配置里只记录一个标记（apiKeyStore: 'keyring'），启动隧道时再从这里取出来，
 * 通过环境变量传给子进程——密钥全程不落盘、不进命令行参数。
 *
 * 非 Windows 平台目前不提供系统级保险箱，调用方会得到 supported=false，
 * 面板会把该选项隐藏并继续推荐环境变量的做法。
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const TARGET_PREFIX = 'mcphelm/tunnel/';
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

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

function runCmdkey(args: string[], input?: string): Promise<{ status: number; output: string }> {
  return new Promise((done) => {
    const child = spawn('cmdkey', args, {
      stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('error', (err) => done({ status: -1, output: err.message }));
    child.on('exit', (code) => done({ status: code ?? -1, output: output.trim() }));
    if (input !== undefined && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

/** 生成一个与真实密钥无关的本地用户名（cmdkey 要求三段式，只是个占位） */
function randomUser(): string {
  const bytes = randomBytes(12);
  let out = '';
  for (const byte of bytes) out += KEY_CHARS[byte % KEY_CHARS.length];
  return 'u_' + out;
}

/** 把密钥写进 Windows 凭据管理器 */
export async function keyringSet(tunnelName: string, secret: string): Promise<KeyringResult> {
  if (!keyringSupported()) return { ok: false, error: '当前平台不支持系统密钥保险箱' };
  if (!secret) return { ok: false, error: '密钥为空' };
  // 先删旧条目，避免凭据已存在时写入失败
  await runCmdkey(['/delete:' + targetName(tunnelName)]);
  const result = await runCmdkey(['/generic:' + targetName(tunnelName), '/user:' + randomUser(), '/pass:' + secret]);
  if (result.status !== 0) {
    return { ok: false, error: '写入 Windows 凭据管理器失败：' + (result.output || '未知错误') };
  }
  return { ok: true };
}

/** 从 Windows 凭据管理器读取密钥；取不到返回 null */
export async function keyringGet(tunnelName: string): Promise<string | null> {
  if (!keyringSupported()) return null;
  const script =
    "$ErrorActionPreference='Stop';" +
    "[void][Windows.Security.Credentials.PasswordVault,Windows.Security.Credentials,ContentType=WindowsRuntime];" +
    "$vault=New-Object Windows.Security.Credentials.PasswordVault;" +
    "try{$c=$vault.Retrieve('" + targetName(tunnelName).replace(/'/g, "''") + "','x')}catch{$c=$null};" +
    "if($c -eq $null){try{$c=($vault.FindAllByResource('" + targetName(tunnelName).replace(/'/g, "''") + "')|Select-Object -First 1)}catch{$c=$null}};" +
    "if($c -eq $null){exit 3};" +
    "$c.RetrievePassword();[Console]::Out.Write($c.Password)";
  return new Promise((done) => {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('error', () => done(null));
    child.on('exit', (code) => {
      if (code === 0 && output) done(output);
      else done(null);
    });
  });
}

/** 判断某条隧道的密钥是否已经存在保险箱里（不读出内容） */
export async function keyringHas(tunnelName: string): Promise<boolean> {
  if (!keyringSupported()) return false;
  const result = await runCmdkey(['/list:' + targetName(tunnelName)]);
  return result.status === 0 && !/NONE|没有|未找到/i.test(result.output);
}

/** 从保险箱删除某条隧道的密钥 */
export async function keyringDelete(tunnelName: string): Promise<KeyringResult> {
  if (!keyringSupported()) return { ok: false, error: '当前平台不支持系统密钥保险箱' };
  const result = await runCmdkey(['/delete:' + targetName(tunnelName)]);
  if (result.status !== 0 && !/NONE|没有|未找到/i.test(result.output)) {
    return { ok: false, error: '删除凭据失败：' + (result.output || '未知错误') };
  }
  return { ok: true };
}
