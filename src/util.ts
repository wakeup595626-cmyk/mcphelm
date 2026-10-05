import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

let colorEnabled = process.stdout.isTTY === true && !process.env.NO_COLOR;

export function setColorEnabled(on: boolean): void {
  colorEnabled = on;
}

function wrap(open: string, close: string): (text: string) => string {
  return (text: string): string => (colorEnabled ? open + text + close : text);
}

export const red = wrap('\u001b[31m', '\u001b[39m');
export const green = wrap('\u001b[32m', '\u001b[39m');
export const yellow = wrap('\u001b[33m', '\u001b[39m');
export const cyan = wrap('\u001b[36m', '\u001b[39m');
export const dim = wrap('\u001b[2m', '\u001b[22m');
export const bold = wrap('\u001b[1m', '\u001b[22m');

export function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

function isWideCode(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0x303e) ||
    (code >= 0x3041 && code <= 0x33ff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0xa000 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1f300 && code <= 0x1f9ff)
  );
}

/** 终端显示宽度：中日韩全角字符按 2 列计算，其余按 1 列。 */
export function visibleWidth(s: string): number {
  let width = 0;
  for (const ch of stripAnsi(s)) {
    width += isWideCode(ch.codePointAt(0) ?? 0) ? 2 : 1;
  }
  return width;
}

export function padEndVisible(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - visibleWidth(s)));
}

export function formatTable(headers: string[], rows: string[][]): string {
  const all = [headers, ...rows];
  const widths: number[] = headers.map((_, i) =>
    Math.max(...all.map((r) => visibleWidth(r[i] ?? '')))
  );
  const render = (r: string[]): string =>
    r.map((c, i) => padEndVisible(c ?? '', widths[i] ?? 0)).join('  ').trimEnd();
  const sep = headers.map((_, i) => '-'.repeat(widths[i] ?? 0));
  return [render(headers), render(sep), ...rows.map(render)].join('\n');
}

export function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ' + (s % 60) + 's';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ' + (m % 60) + 'm';
  const d = Math.floor(h / 24);
  return d + 'd ' + (h % 24) + 'h';
}

export function fmtBytes(n: number): string {
  if (n < 1024) return n + ' B';
  const kb = n / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + ' MB';
  return (mb / 1024).toFixed(2) + ' GB';
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function maskSecret(s: string): string {
  if (!s) return '(empty)';
  if (s.length <= 6) return '***';
  return s.slice(0, 3) + '*** (len ' + s.length + ')';
}

export function shortId(id: string, keep = 12): string {
  if (id.length <= keep + 5) return id;
  return id.slice(0, keep) + '...' + id.slice(-4);
}

export function expandHome(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return join(homedir(), p.slice(2));
  return p;
}

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

export function atomicWriteText(file: string, text: string): void {
  ensureDir(dirname(file));
  const tmp = file + '.tmp-' + randomBytes(4).toString('hex');
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, file);
}

export function atomicWriteJson(file: string, value: unknown): void {
  atomicWriteText(file, JSON.stringify(value, null, 2) + '\n');
}

export function readJsonSafe<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    return e.code === 'EPERM';
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export class LineBuffer {
  private rest = '';

  push(chunk: string): string[] {
    const parts = (this.rest + chunk).split(/\r?\n/);
    this.rest = parts.pop() ?? '';
    return parts;
  }

  flush(): string[] {
    const s = this.rest;
    this.rest = '';
    return s.length > 0 ? [s] : [];
  }
}

export interface KillResult {
  ok: boolean;
  detail?: string;
}

function runTaskkill(pid: number): Promise<{ status: number; output: string }> {
  return new Promise((resolveKill) => {
    const child = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('error', () => resolveKill({ status: -1, output }));
    child.on('exit', (code) => resolveKill({ status: code ?? -1, output: output.trim() }));
  });
}

/**
 * 结束进程（Windows 下连同子进程树）。
 * 返回 ok=false 时带上失败原因，方便上层给用户一句能照做的提示。
 */
export async function killTree(pid: number, timeoutMs = 8000): Promise<KillResult> {
  if (!Number.isFinite(pid) || pid <= 0) return { ok: false, detail: '进程号非法：' + String(pid) };
  if (process.platform === 'win32') {
    const deadline = Date.now() + timeoutMs;
    let detail: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await runTaskkill(pid);
      if (result.status !== 0 && result.output) {
        detail = result.output.split('\n').map((line) => line.trim()).filter(Boolean).join(' ');
      }
      await sleep(300);
      if (!isProcessAlive(pid)) return { ok: true };
      if (Date.now() >= deadline) break;
    }
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // 没有权限时忽略，下面统一判定
    }
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      if (!isProcessAlive(pid)) return { ok: true };
    }
    return { ok: false, detail };
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return { ok: false, detail: '进程 ' + String(pid) + ' 已无法访问' };
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(200);
    if (!isProcessAlive(pid)) return { ok: true };
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // already gone
  }
  await sleep(200);
  return isProcessAlive(pid) ? { ok: false, detail: 'SIGKILL 未能结束进程' } : { ok: true };
}

export async function getFreePort(preferred?: number): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const tryListen = (port: number, allowFallback: boolean): void => {
      const srv = createServer();
      srv.unref();
      srv.on('error', () => {
        if (allowFallback) tryListen(0, false);
        else reject(new Error('no free port available'));
      });
      srv.listen(port, '127.0.0.1', () => {
        const addr = srv.address();
        if (addr && typeof addr === 'object') {
          const p = addr.port;
          srv.close(() => resolvePort(p));
        } else {
          srv.close(() => reject(new Error('no free port available')));
        }
      });
    };
    tryListen(preferred ?? 0, preferred !== undefined);
  });
}

export function openBrowser(url: string): void {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // opening the browser is best effort only
  }
}

export function fileExists(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
