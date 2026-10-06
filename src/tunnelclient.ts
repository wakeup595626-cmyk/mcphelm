import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import {
  chmodSync,
  copyFileSync,
  createReadStream,
  createWriteStream,
  mkdtempSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { BRAND } from './brand.ts';
import { envKey } from './paths.ts';
import type { AppPaths } from './paths.ts';
import { ensureDir, expandHome, fileExists } from './util.ts';

export const GITHUB_REPO = 'openai/tunnel-client';
const RELEASES_API = 'https://api.github.com/repos/' + GITHUB_REPO + '/releases';
/* 网页版 releases/latest 会 302 到 /releases/tag/<版本>，走的是 github.com 而不是 API，
   不占未认证 API 的 60 次/小时额度——共享出口 IP 经常被限流，所以留作兜底。 */
const RELEASES_PAGE = 'https://github.com/' + GITHUB_REPO + '/releases/latest';
const DOWNLOAD_BASE = 'https://github.com/' + GITHUB_REPO + '/releases/download';
const SUMS_FILE = 'SHA256SUMS.txt';
const USER_AGENT = 'mcphelm/' + BRAND.version;

export type RuntimeSource = 'configured' | 'env' | 'home' | 'cwd' | 'path' | 'none';

export interface RuntimeInfo {
  path: string | null;
  version: string | null;
  source: RuntimeSource;
  exists: boolean;
}

export interface InstallResult {
  path: string;
  version: string;
  sha256: string;
  asset: string;
  verified: boolean;
}

export interface InstallOptions {
  paths: AppPaths;
  version?: string;
  zipPath?: string;
  skipVerify?: boolean;
  log?: (line: string) => void;
  /**
   * 真实进度回调：0–100 的百分比 + 当前阶段。
   * 面板拿它画进度条——之前只有 10% 一格的日志，界面看起来就是「卡在 10% 然后突然装完」。
   */
  onProgress?: (percent: number, stage: InstallStage) => void;
}

/** 安装过程对外暴露的阶段，前端按语言翻译成文案 */
export type InstallStage = 'prepare' | 'download' | 'verify' | 'unpack' | 'install' | 'done';

export function runtimeBinaryName(): string {
  return process.platform === 'win32' ? 'tunnel-client-runtime.exe' : 'tunnel-client-runtime';
}

export function platformTag(): string {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'darwin';
  if (process.platform === 'linux') return 'linux';
  throw new Error('不支持的平台：' + process.platform);
}

export function archTag(): string {
  if (process.arch === 'x64') return 'amd64';
  if (process.arch === 'arm64') return 'arm64';
  throw new Error('不支持的架构：' + process.arch);
}

export function runtimeAssetName(version: string): string {
  return 'tunnel-client-runtime-' + version + '-' + platformTag() + '-' + archTag() + '.zip';
}

export function releaseAssetUrl(version: string, fileName: string): string {
  return DOWNLOAD_BASE + '/' + version + '/' + fileName;
}

function runCapture(exe: string, args: string[], timeoutMs: number): { status: number; stdout: string; stderr: string } {
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: timeoutMs, windowsHide: true });
  return {
    status: res.status === null ? -1 : res.status,
    stdout: res.stdout ? String(res.stdout) : '',
    stderr: res.stderr ? String(res.stderr) : '',
  };
}

export function parseVersion(text: string): string | null {
  const m = /(\d+\.\d+\.\d+)/.exec(text);
  return m ? (m[1] ?? null) : null;
}

export function whichBinary(name: string): string | null {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  const res = runCapture(probe, [name], 8000);
  if (res.status !== 0) return null;
  const first = res.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)[0];
  return first ?? null;
}

export function inspectRuntime(file: string, source: RuntimeSource): RuntimeInfo {
  if (!fileExists(file)) return { path: null, version: null, source: 'none', exists: false };
  const res = runCapture(file, ['--version'], 20000);
  const version = parseVersion(res.stdout + ' ' + res.stderr);
  return { path: file, version, source, exists: true };
}

export function findRuntime(paths: AppPaths, configuredPath?: string): RuntimeInfo {
  const name = runtimeBinaryName();
  if (configuredPath) {
    const raw = expandHome(configuredPath);
    const candidate = isAbsolute(raw) ? raw : resolve(paths.cwd, raw);
    const info = inspectRuntime(candidate, 'configured');
    if (info.exists) return info;
  }
  const envPath = process.env[envKey('TUNNEL_CLIENT')];
  if (envPath) {
    const raw = expandHome(envPath);
    const candidate = isAbsolute(raw) ? raw : resolve(paths.cwd, raw);
    const info = inspectRuntime(candidate, 'env');
    if (info.exists) return info;
  }
  const homeCandidate = join(paths.binDir, name);
  if (fileExists(homeCandidate)) return inspectRuntime(homeCandidate, 'home');
  const cwdCandidate = join(paths.cwd, name);
  if (fileExists(cwdCandidate)) return inspectRuntime(cwdCandidate, 'cwd');
  const onPath = whichBinary('tunnel-client-runtime') ?? whichBinary('tunnel-client');
  if (onPath) return inspectRuntime(onPath, 'path');
  return { path: null, version: null, source: 'none', exists: false };
}

export async function fetchLatestVersion(): Promise<string> {
  try {
    return await fetchLatestVersionViaApi();
  } catch (apiErr) {
    const first = apiErr instanceof Error ? apiErr.message : String(apiErr);
    try {
      return await fetchLatestVersionViaWeb();
    } catch (webErr) {
      const second = webErr instanceof Error ? webErr.message : String(webErr);
      throw new Error('查询最新版本失败：API ' + first + '；网页 ' + second);
    }
  }
}

/** 主链路：GitHub API（能拿到最准确的 tag_name） */
async function fetchLatestVersionViaApi(): Promise<string> {
  const res = await fetch(RELEASES_API + '/latest', {
    headers: { 'user-agent': USER_AGENT, accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = (await res.json()) as { tag_name?: string };
  if (!data.tag_name) throw new Error('无法解析最新版本号');
  return data.tag_name;
}

/** 兜底链路：读 releases/latest 的跳转地址或页面内容，不消耗 API 额度 */
async function fetchLatestVersionViaWeb(): Promise<string> {
  const res = await fetch(RELEASES_PAGE, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const fromUrl = parseReleaseTag(res.url ?? '');
  if (fromUrl) return fromUrl;
  const fromBody = parseReleaseTag(await res.text());
  if (fromBody) return fromBody;
  throw new Error('页面里没找到版本号');
}

/** 从 release 链接或页面文本里抠出版本号：…/releases/tag/v0.0.15 → v0.0.15 */
export function parseReleaseTag(text: string): string | null {
  const m = /\/releases\/tag\/(v?[0-9][A-Za-z0-9._-]*)/.exec(text);
  const tag = m?.[1];
  return tag ? tag : null;
}

export async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (received: number, total: number) => void,
  timeoutMs = 300000
): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: ctrl.signal });
  try {
    if (!res.ok || !res.body) throw new Error('下载失败：HTTP ' + res.status + '  ' + url);
    const total = Number(res.headers.get('content-length') ?? '0');
    const ws = createWriteStream(dest);
    const reader = res.body.getReader();
    let received = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        const buf = Buffer.from(chunk.value);
        received += buf.byteLength;
        if (!ws.write(buf)) await once(ws, 'drain');
        if (onProgress) onProgress(received, total);
      }
    } finally {
      await new Promise<void>((done) => {
        ws.end(() => done());
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

export function sha256File(file: string): Promise<string> {
  return new Promise<string>((resolveHash, rejectHash) => {
    const hash = createHash('sha256');
    const rs = createReadStream(file);
    rs.on('error', (err) => rejectHash(err));
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolveHash(hash.digest('hex')));
  });
}

export function parseSha256Sums(text: string, fileName: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    const hash = parts[0] ?? '';
    const name = (parts[parts.length - 1] ?? '').replace(/^[*]/, '');
    if (name === fileName && /^[0-9a-fA-F]{64}$/.test(hash)) return hash.toLowerCase();
  }
  return null;
}

function quoteForPowerShell(value: string): string {
  return "'" + value.split("'").join("''") + "'";
}

function extractionCommands(zipPath: string, destDir: string): string[][] {
  if (process.platform === 'win32') {
    return [
      ['tar', '-xf', zipPath, '-C', destDir],
      [
        'powershell',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Expand-Archive -LiteralPath ' +
          quoteForPowerShell(zipPath) +
          ' -DestinationPath ' +
          quoteForPowerShell(destDir) +
          ' -Force',
      ],
    ];
  }
  if (process.platform === 'darwin') {
    return [
      ['ditto', '-x', '-k', zipPath, destDir],
      ['tar', '-xf', zipPath, '-C', destDir],
    ];
  }
  return [
    ['unzip', '-o', zipPath, '-d', destDir],
    ['tar', '-xf', zipPath, '-C', destDir],
    ['python3', '-m', 'zipfile', '-e', zipPath, destDir],
  ];
}

export function findExtractedBinary(dir: string): string | null {
  const name = runtimeBinaryName();
  const direct = join(dir, name);
  if (fileExists(direct)) return direct;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = join(dir, entry.name, name);
    if (fileExists(nested)) return nested;
  }
  return null;
}

function extractZip(zipPath: string, destDir: string): void {
  ensureDir(destDir);
  const failures: string[] = [];
  for (const cmd of extractionCommands(zipPath, destDir)) {
    const exe = cmd[0] ?? '';
    const res = runCapture(exe, cmd.slice(1), 300000);
    if (res.status === 0 && findExtractedBinary(destDir)) return;
    failures.push(exe + ' 解压失败（exit ' + res.status + '）');
  }
  throw new Error('无法解压 ' + zipPath + '：' + failures.join('；'));
}

export function versionFromZipName(zipPath: string): string | null {
  const m = /v(\d+\.\d+\.\d+)/.exec(basename(zipPath));
  return m ? 'v' + m[1] : null;
}

export async function installRuntime(opts: InstallOptions): Promise<InstallResult> {
  const log = opts.log ?? (() => undefined);
  const report = opts.onProgress ?? (() => undefined);
  ensureDir(opts.paths.binDir);
  report(1, 'prepare');

  let version = opts.version ?? null;
  let asset: string;
  let zipPath: string;
  let stageDir: string;

  // 下载/解压的暂存目录放在数据根下的 tmp\，不占用系统 TEMP（通常在 C 盘）
  ensureDir(opts.paths.tmpDir);
  if (opts.zipPath) {
    const raw = expandHome(opts.zipPath);
    zipPath = isAbsolute(raw) ? raw : resolve(opts.paths.cwd, raw);
    if (!fileExists(zipPath)) throw new Error('找不到压缩包：' + zipPath);
    version = version ?? versionFromZipName(zipPath);
    asset = basename(zipPath);
    stageDir = mkdtempSync(join(opts.paths.tmpDir, 'import-'));
  } else {
    if (!version) {
      log('查询官方最新版本 ...');
      version = await fetchLatestVersion();
      log('最新版本：' + version);
    }
    asset = runtimeAssetName(version);
    stageDir = mkdtempSync(join(opts.paths.tmpDir, 'download-'));
    zipPath = join(stageDir, asset);
    log('下载 ' + asset + ' ...');
    report(5, 'download');
    let lastBucket = -1;
    await downloadFile(releaseAssetUrl(version, asset), zipPath, (received, total) => {
      if (total <= 0) return;
      /* 真实百分比先喂给面板（5%–70% 这一段是下载），日志仍按 10% 一格，避免刷屏 */
      report(5 + Math.round((received / total) * 65), 'download');
      const bucket = Math.floor((received / total) * 10);
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        log('  进度 ' + bucket * 10 + '%');
      }
    });
    report(70, 'download');
  }

  try {
    report(72, 'verify');
    const sha256 = await sha256File(zipPath);
    let verified = false;
    if (version) {
      try {
        const sumsRes = await fetch(releaseAssetUrl(version, SUMS_FILE), {
          headers: { 'user-agent': USER_AGENT },
        });
        const expected = sumsRes.ok ? parseSha256Sums(await sumsRes.text(), asset) : null;
        if (!expected) throw new Error('官方 SHA256SUMS.txt 中没有 ' + asset);
        if (expected !== sha256.toLowerCase()) {
          throw new Error('校验失败：官方 ' + expected + '，本地 ' + sha256);
        }
        verified = true;
        log('SHA-256 校验通过：' + sha256);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (!opts.skipVerify) {
          throw new Error(
            '无法完成官方 SHA-256 校验（' + reason + '）。如已自行确认包来源可信，可加 --skip-verify 跳过。'
          );
        }
        log('警告：跳过官方校验（' + reason + '）');
      }
    } else if (!opts.skipVerify) {
      throw new Error('无法推断压缩包版本，也就无法核对官方 SHA256。可加 --version vX.Y.Z 或 --skip-verify。');
    }

    const unpacked = join(stageDir, 'unpacked');
    log('解压 ...');
    report(86, 'unpack');
    extractZip(zipPath, unpacked);
    const found = findExtractedBinary(unpacked);
    if (!found) throw new Error('压缩包中未找到 ' + runtimeBinaryName());
    const dest = join(opts.paths.binDir, runtimeBinaryName());
    copyFileSync(found, dest);
    if (process.platform !== 'win32') chmodSync(dest, 0o755);
    report(96, 'install');
    const info = inspectRuntime(dest, 'home');
    if (!info.exists) throw new Error('安装后的二进制无法执行：' + dest);
    log('已安装：' + dest + (info.version ? '（版本 ' + info.version + '）' : ''));
    report(100, 'done');
    return { path: dest, version: info.version ?? version ?? 'unknown', sha256, asset, verified };
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }
}
