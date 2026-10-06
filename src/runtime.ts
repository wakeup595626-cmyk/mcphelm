import { spawn } from 'node:child_process';
import { closeSync, openSync, readSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BRAND } from './brand.ts';
import { rotateLogIfNeeded } from './logrotate.ts';
import { envKey, logFileFor, stateFileFor, stopFileFor } from './paths.ts';
import type { AppPaths } from './paths.ts';
import type { AppConfig, McpServerConfig, TunnelConfig } from './store.ts';
import { findServer, healthPortFor, isValidTunnelId, resolveApiKeyAsync, serverTarget } from './store.ts';
import type { RuntimeInfo } from './tunnelclient.ts';
import { findRuntime, runtimeBinaryName } from './tunnelclient.ts';
import {
  atomicWriteJson,
  ensureDir,
  fileExists,
  getFreePort,
  isProcessAlive,
  killTree,
  maskSecret,
  nowIso,
  readJsonSafe,
  sleep,
} from './util.ts';

/** supervisor.js 与本文件同目录（构建后 dist/ 下结构一致） */
const SUPERVISOR_PATH = fileURLToPath(new URL('./supervisor.js', import.meta.url));

export interface TunnelStateFile {
  name: string;
  /** 守护进程自己的 PID（没有守护时与 pid 相同） */
  supervisorPid?: number;
  pid: number;
  server: string;
  tunnelIdMasked: string;
  healthAddr: string;
  logFile: string;
  runtimePath: string;
  args: string[];
  startedAt: string;
  /** 本进程由谁拉起：supervisor = 自动重启守护；direct = 直接运行 tunnel-client */
  mode?: 'supervisor' | 'direct';
}

export type TunnelState = 'running' | 'stopped' | 'stale' | 'error';

export interface TunnelStatus {
  name: string;
  state: TunnelState;
  pid: number | null;
  startedAt: string | null;
  uptimeMs: number;
  healthAddr: string | null;
  logFile: string;
  server: string;
  tunnelIdMasked: string;
  target: string;
  lastError: string | null;
}

export interface StartOptions {
  paths: AppPaths;
  config: AppConfig;
  tunnel: TunnelConfig;
  runtime?: RuntimeInfo;
  dryRun?: boolean;
}

export interface StartResult {
  ok: boolean;
  state?: TunnelStateFile;
  command?: string[];
  error?: string;
}

export interface StopResult {
  ok: boolean;
  message: string;
}

export interface HealthProbe {
  checkedAt: string;
  /** 本机健康端点自检是否通过：与启动等待流程保持一致，以 readyz 为准 */
  ok: boolean;
  healthz: boolean;
  readyz: boolean;
  error: string | null;
}

export function maskTunnelId(id: string): string {
  if (id.length > 14) return id.slice(0, 11) + '***';
  return maskSecret(id);
}

export function buildRunArgs(tunnel: TunnelConfig, server: McpServerConfig, healthAddr: string): string[] {
  const args: string[] = ['run'];
  args.push('--control-plane.tunnel-id=' + tunnel.tunnelId);
  args.push('--health.listen-addr=' + healthAddr);
  if (server.kind === 'stdio') {
    args.push('--mcp.command=' + (server.command ?? ''));
  } else {
    args.push('--mcp.server-url=' + (server.url ?? ''));
  }
  if (server.headers) {
    for (const [key, value] of Object.entries(server.headers)) {
      args.push('--mcp.extra-headers=' + key + ': ' + value);
    }
  }
  if (tunnel.extraArgs) args.push(...tunnel.extraArgs);
  return args;
}

export function childEnv(apiKey: string | undefined, cacheDir?: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (apiKey) env.CONTROL_PLANE_API_KEY = apiKey;
  if (cacheDir) {
    // 用户的 MCP 服务器常用 npx/uvx/pip 拉起，把这些包管理器的下载缓存
    // 也引到数据根下，避免默认写进 C 盘的 %LOCALAPPDATA%\npm-cache 等位置
    const npmCache = cacheDir + '\\npm';
    env.NPM_CONFIG_CACHE = env.NPM_CONFIG_CACHE ?? npmCache;
    env.npm_config_cache = env.npm_config_cache ?? npmCache;
    env.PIP_CACHE_DIR = env.PIP_CACHE_DIR ?? cacheDir + '\\pip';
    env.UV_CACHE_DIR = env.UV_CACHE_DIR ?? cacheDir + '\\uv';
    env.XDG_CACHE_HOME = env.XDG_CACHE_HOME ?? cacheDir;
  }
  return env;
}

export async function startTunnel(opts: StartOptions): Promise<StartResult> {
  const tunnel = opts.tunnel;
  const server = findServer(opts.config, tunnel.server);
  if (!server) {
    return { ok: false, error: '隧道 ' + tunnel.name + ' 绑定的 MCP 服务器不存在：' + tunnel.server };
  }
  if (!isValidTunnelId(tunnel.tunnelId)) {
    return { ok: false, error: '隧道 ID 格式不对：' + tunnel.tunnelId };
  }
  const key = await resolveApiKeyAsync(tunnel);
  if (!key.ok && !opts.dryRun) return { ok: false, error: key.error ?? 'runtime key 不可用' };

  const runtime = opts.runtime && opts.runtime.path ? opts.runtime : findRuntime(opts.paths);
  if (!runtime.path) {
    if (!opts.dryRun) {
      return { ok: false, error: '找不到 tunnel-client 运行时，请先执行：' + BRAND.bin + ' runtime fetch' };
    }
  }
  const runtimePath = runtime.path ?? runtimeBinaryName() + '（尚未安装）';

  const existing = readState(opts.paths, tunnel.name);
  if (existing && isProcessAlive(existing.pid)) {
    return { ok: false, error: '隧道 ' + tunnel.name + ' 已在运行（PID ' + existing.pid + '）' };
  }

  const preferred = healthPortFor(opts.config, tunnel);
  const port = preferred && preferred > 0 ? await getFreePort(preferred) : await getFreePort();
  const healthAddr = '127.0.0.1:' + port;
  const args = buildRunArgs(tunnel, server, healthAddr);
  const logFile = logFileFor(opts.paths, tunnel.name);
  const command = [runtimePath, ...args];

  if (opts.dryRun) return { ok: true, command };

  ensureDir(opts.paths.logsDir);
  ensureDir(opts.paths.runDir);
  rotateLogIfNeeded(logFile);
  // 每次启动前清掉上一次遗留的停止标记，避免守护进程一睁眼就退出
  rmSync(stopFileFor(opts.paths, tunnel.name), { force: true });
  const header =
    [
      '',
      '===== ' + nowIso() + '  启动隧道 ' + tunnel.name + ' =====',
      '命令：' + command.join(' ') + '（由守护进程托管，崩溃自动重启）',
      'MCP：' + serverTarget(server),
      '健康端点：http://' + healthAddr + '/healthz',
      '',
    ].join('\n') + '\n';

  const fd = openSync(logFile, 'a');
  let pid: number | undefined;
  try {
    writeSync(fd, header);
    // 在桌面版（Electron）里 process.execPath 是 MCPHelm.exe 而不是 node；
    // 加上 ELECTRON_RUN_AS_NODE 才能把它当纯 Node 用来跑守护进程脚本。
    const runAsNode = process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {};
    const child = spawn(process.execPath, [SUPERVISOR_PATH, runtimePath, '--', ...args], {
      cwd: opts.paths.cwd,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', fd, fd],
      env: {
        ...runAsNode,
        ...childEnv(key.value, opts.paths.cacheDir),
        MCPHELM_SUPERVISOR_NAME: tunnel.name,
        MCPHELM_SUPERVISOR_STOP: stopFileFor(opts.paths, tunnel.name),
      },
    });
    pid = child.pid;
    child.unref();
  } finally {
    closeSync(fd);
  }
  if (!pid) return { ok: false, error: '无法启动守护进程（node ' + SUPERVISOR_PATH + '）' };

  const state: TunnelStateFile = {
    name: tunnel.name,
    supervisorPid: pid,
    pid,
    server: server.name,
    tunnelIdMasked: maskTunnelId(tunnel.tunnelId),
    healthAddr,
    logFile,
    runtimePath,
    args,
    startedAt: nowIso(),
    mode: 'supervisor',
  };
  atomicWriteJson(stateFileFor(opts.paths, tunnel.name), state);
  return { ok: true, state, command };
}

export function readState(paths: AppPaths, tunnelName: string): TunnelStateFile | null {
  const raw = readJsonSafe<TunnelStateFile>(stateFileFor(paths, tunnelName));
  if (!raw || typeof raw.pid !== 'number' || !Number.isFinite(raw.pid)) return null;
  return raw;
}

export async function stopTunnel(paths: AppPaths, tunnelName: string): Promise<StopResult> {
  const state = readState(paths, tunnelName);
  const file = stateFileFor(paths, tunnelName);
  if (!state) return { ok: false, message: '没有找到隧道 ' + tunnelName + ' 的运行记录' };
  if (!isProcessAlive(state.pid)) {
    rmSync(file, { force: true });
    rmSync(stopFileFor(paths, tunnelName), { force: true });
    return { ok: true, message: '隧道 ' + tunnelName + ' 的进程已不存在，已清理残留状态' };
  }
  // 先落停止标记：守护进程看到后会主动带整棵树退出，避免 taskkill 打死 supervisor 后它又把隧道拉起来
  if (state.mode === 'supervisor') {
    try {
      writeFileSync(stopFileFor(paths, tunnelName), nowIso() + '\n', 'utf8');
    } catch {
      // 标记写不进去就直接硬杀，下面流程兜底
    }
  }
  await killTree(state.pid);
  await sleep(300);
  if (isProcessAlive(state.pid)) {
    const killed = await killTree(state.pid, 4000);
    await sleep(300);
    if (!killed.ok && isProcessAlive(state.pid)) {
      return {
        ok: false,
        message:
          '进程 ' + state.pid + ' 仍在运行，停止失败' + (killed.detail ? '（' + killed.detail + '）' : '') + '，可手动结束该进程后重试',
      };
    }
  }
  rmSync(file, { force: true });
  rmSync(stopFileFor(paths, tunnelName), { force: true });
  return { ok: true, message: '已停止隧道 ' + tunnelName + '（PID ' + state.pid + '）' };
}

export function tunnelStatus(paths: AppPaths, tunnel: TunnelConfig): TunnelStatus {
  const state = readState(paths, tunnel.name);
  const logFile = logFileFor(paths, tunnel.name);
  const base = {
    name: tunnel.name,
    logFile,
    server: tunnel.server,
    tunnelIdMasked: maskTunnelId(tunnel.tunnelId),
    target: '',
  };
  if (!state) {
    return {
      ...base,
      state: 'stopped',
      pid: null,
      startedAt: null,
      uptimeMs: 0,
      healthAddr: null,
      lastError: null,
    };
  }
  if (!isProcessAlive(state.pid)) {
    return {
      ...base,
      state: 'stale',
      pid: state.pid,
      startedAt: state.startedAt,
      uptimeMs: 0,
      healthAddr: state.healthAddr,
      lastError: '进程 ' + state.pid + ' 已不存在（残留状态，可执行 stop 清理）',
    };
  }
  const started = Date.parse(state.startedAt);
  return {
    ...base,
    state: 'running',
    pid: state.pid,
    startedAt: state.startedAt,
    uptimeMs: Number.isFinite(started) ? Date.now() - started : 0,
    healthAddr: state.healthAddr,
    lastError: null,
  };
}

export function listStatuses(paths: AppPaths, config: AppConfig): TunnelStatus[] {
  return config.tunnels.map((tunnel) => {
    const status = tunnelStatus(paths, tunnel);
    const server = findServer(config, tunnel.server);
    return { ...status, target: server ? serverTarget(server) : '(缺失：' + tunnel.server + ')' };
  });
}

async function probeUrl(url: string, timeoutMs: number): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeHealth(healthAddr: string, timeoutMs = 2500): Promise<HealthProbe> {
  const base = 'http://' + healthAddr;
  const probe: HealthProbe = { checkedAt: nowIso(), ok: false, healthz: false, readyz: false, error: null };
  try {
    probe.healthz = await probeUrl(base + '/healthz', timeoutMs);
  } catch (err) {
    probe.error = err instanceof Error ? err.message : String(err);
  }
  try {
    probe.readyz = await probeUrl(base + '/readyz', timeoutMs);
  } catch (err) {
    if (!probe.error) probe.error = err instanceof Error ? err.message : String(err);
  }
  // readyz 才是「可以接活」的判据（启动等待循环读的也是它），界面统一读 ok 即可
  probe.ok = probe.readyz;
  return probe;
}

export function readLogTail(
  file: string,
  maxLines: number,
  maxBytes = 512 * 1024
): { lines: string[]; truncated: boolean } {
  if (!fileExists(file)) return { lines: [], truncated: false };
  const size = statSync(file).size;
  const start = Math.max(0, size - maxBytes);
  const length = size - start;
  if (length <= 0) return { lines: [], truncated: false };
  const fd = openSync(file, 'r');
  let text = '';
  try {
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, start);
    text = buf.toString('utf8');
  } finally {
    closeSync(fd);
  }
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const truncated = start > 0 || lines.length > maxLines;
  return { lines: lines.slice(-maxLines), truncated };
}

export function followLog(file: string, onLines: (lines: string[]) => void, intervalMs = 400): () => void {
  let offset = fileExists(file) ? statSync(file).size : 0;
  const timer = setInterval(() => {
    try {
      if (!fileExists(file)) return;
      const size = statSync(file).size;
      if (size < offset) offset = 0;
      if (size === offset) return;
      const length = size - offset;
      const buf = Buffer.alloc(length);
      const fd = openSync(file, 'r');
      try {
        readSync(fd, buf, 0, length, offset);
      } finally {
        closeSync(fd);
      }
      offset = size;
      const lines = buf.toString('utf8').split(/\r?\n/);
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
      if (lines.length > 0) onLines(lines);
    } catch {
      // 读取日志失败不影响主流程，下一轮重试
    }
  }, intervalMs);
  return () => clearInterval(timer);
}

export function runtimeEnvHint(): string {
  return (
    '可设置环境变量 ' +
    envKey('TUNNEL_CLIENT') +
    ' 指定运行时路径，或执行 ' +
    BRAND.bin +
    ' runtime fetch 自动下载'
  );
}
