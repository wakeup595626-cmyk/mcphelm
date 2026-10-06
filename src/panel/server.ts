import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../brand.ts';
import { COMPONENTS, STARS_SNAPSHOT_AT, componentCommand, findComponent, runnerName } from '../components.ts';
import { runDoctor } from '../doctor.ts';
import { mergeServers, parseExternalFile, parsePastedConfig, scanExternalConfigs } from '../importer.ts';
import { keyringDelete, keyringSet, keyringSupported } from '../keyring.ts';
import { pruneLogs } from '../logrotate.ts';
import { readStarsCache, refreshStars, starsCacheFresh } from '../marketstars.ts';
import { describeConfigScope, logFileFor } from '../paths.ts';
import type { AppPaths } from '../paths.ts';
import { listStatuses, probeHealth, readLogTail, readState, startTunnel, stopTunnel } from '../runtime.ts';
import {
  findServer,
  findTunnel,
  isValidName,
  isValidTunnelId,
  resolveApiKeyAsync,
  saveConfig,
  serverTarget,
  validateConfig,
} from '../store.ts';
import type { AppConfig, ConfigIssue, McpServerConfig, ServerKind, TunnelConfig } from '../store.ts';
import { SERVER_TEMPLATES } from '../templates.ts';
import { testHttpEndpoint, testStdioCommand } from '../tester.ts';
import { findRuntime, installRuntime } from '../tunnelclient.ts';
import { bold, cyan, dim, isProcessAlive, nowIso, sleep, yellow } from '../util.ts';
import { extractToken, generatePanelToken } from './paneltoken.ts';

const WEB_DIR = fileURLToPath(new URL('./web/', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export interface PanelOptions {
  paths: AppPaths;
  config: AppConfig;
  configIssues?: ConfigIssue[];
  port: number;
  host?: string;
  onLog?: (line: string) => void;
  /** 桌面版注入的数据目录信息；CLI 面板没有这一项 */
  dataLocation?: {
    dataRoot: string;
    desktopDir: string;
    isDesktop: boolean;
    canMigrate: boolean;
    /** 安装目录不可写时退回到的用户目录位置（会在界面提示） */
    fallback?: boolean;
    chooseFolder?: (defaultPath?: string) => Promise<string | null>;
    migrate?: (newRoot: string) => Promise<string>;
  };
}

export interface PanelHandle {
  url: string;
  port: number;
  /** 本次面板的访问口令（已拼进 url 的 #token，仅本机可见） */
  token: string;
  close: () => Promise<void>;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendText(res: ServerResponse, status: number, body: string, type = 'text/plain; charset=utf-8'): void {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Buffer));
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function serveStatic(res: ServerResponse, urlPath: string): void {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const target = resolve(join(WEB_DIR, relative));
  const root = resolve(WEB_DIR) + sep;
  if (!target.startsWith(root)) {
    sendText(res, 403, 'forbidden');
    return;
  }
  try {
    const body = readFileSync(target);
    res.writeHead(200, {
      'content-type': MIME[extname(target)] ?? 'application/octet-stream',
      'content-length': body.byteLength,
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    sendText(
      res,
      404,
      '面板静态资源未找到：' +
        target +
        '\n如果是从源码直接运行，请先执行 npm run build（会把 src/panel/web 复制到 dist/panel/web）。'
    );
  }
}

/* ------------------------------------------------------------------ 请求体解析 */

function bodyObject(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function bodyString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

const ENV_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface ServerPayload {
  kind: ServerKind;
  command?: string;
  url?: string;
  description?: string;
  headers?: Record<string, string>;
}

function parseServerPayload(
  raw: Record<string, unknown>
): { ok: true; value: ServerPayload } | { ok: false; error: string } {
  const kind = raw.kind === 'stdio' || raw.kind === 'http' ? raw.kind : null;
  if (!kind) return { ok: false, error: '服务器类型必须是 stdio 或 http' };
  const command = bodyString(raw.command);
  const url = bodyString(raw.url);
  const description = bodyString(raw.description);
  if (kind === 'stdio') {
    if (!command) return { ok: false, error: 'stdio 服务器需要填写启动命令（command）' };
    return { ok: true, value: { kind, command, description: description || undefined } };
  }
  if (!url) return { ok: false, error: 'HTTP 服务器需要填写 MCP 端点地址（url）' };
  if (!/^https?:\/\//.test(url)) return { ok: false, error: 'HTTP 端点需要以 http:// 或 https:// 开头' };
  let headers: Record<string, string> | undefined;
  if (raw.headers !== undefined && raw.headers !== null) {
    const obj = bodyObject(raw.headers);
    if (!obj) return { ok: false, error: '请求头格式不对（应为键值对）' };
    headers = {};
    for (const [entryKey, entryValue] of Object.entries(obj)) {
      const text = bodyString(entryValue);
      if (!entryKey.trim() || text === undefined) return { ok: false, error: '请求头格式不对：' + entryKey };
      headers[entryKey.trim()] = text;
    }
    if (Object.keys(headers).length === 0) headers = undefined;
  }
  return { ok: true, value: { kind, url, description: description || undefined, headers } };
}

type TunnelKeyPayload =
  | { mode: 'env'; envName: string }
  | { mode: 'inline'; value?: string }
  | { mode: 'keyring'; value?: string }
  | { mode: 'clear' }
  | { mode: 'keep' };

interface TunnelPayload {
  tunnelId: string;
  server: string;
  healthPort?: number;
  key: TunnelKeyPayload;
}

function parseTunnelPayload(
  raw: Record<string, unknown>,
  config: AppConfig,
  mode: 'create' | 'update'
): { ok: true; value: TunnelPayload } | { ok: false; error: string } {
  const tunnelId = bodyString(raw.tunnelId) ?? '';
  if (!isValidTunnelId(tunnelId)) {
    return { ok: false, error: '隧道 ID 格式不对（应为 tunnel_ 加 32 位小写十六进制）' };
  }
  const server = bodyString(raw.server) ?? '';
  if (!server || !findServer(config, server)) {
    return { ok: false, error: '绑定的 MCP 服务器不存在：' + (server || '（未选择）') };
  }
  let healthPort: number | undefined;
  if (raw.healthPort !== undefined && raw.healthPort !== null && raw.healthPort !== '') {
    const num = Number(raw.healthPort);
    if (!Number.isInteger(num) || num < 1 || num > 65535) {
      return { ok: false, error: '健康端口需要是 1-65535 的整数' };
    }
    healthPort = num;
  }
  const keyModeRaw = bodyString(raw.keyMode) ?? (mode === 'create' ? 'env' : 'keep');
  let key: TunnelKeyPayload;
  if (keyModeRaw === 'env') {
    const envName = bodyString(raw.apiKeyEnv) ?? 'CONTROL_PLANE_API_KEY';
    if (!ENV_NAME_RE.test(envName)) {
      return { ok: false, error: '环境变量名不合法，例如 CONTROL_PLANE_API_KEY' };
    }
    key = { mode: 'env', envName };
  } else if (keyModeRaw === 'keyring') {
    if (!keyringSupported()) {
      return { ok: false, error: '当前平台不支持系统密钥保险箱' };
    }
    const value = bodyString(raw.apiKey);
    // 更新场景允许留空（表示沿用保险箱里已有的密钥），但要求该隧道本来
    // 就是 keyring 模式，否则等于什么都没配却标成了“已入箱”，启动时必失败
    const existing = mode === 'update' ? findTunnel(config, bodyString(raw.name) ?? '') : undefined;
    if (mode === 'update' && !value && (!existing || existing.apiKeyStore !== 'keyring')) {
      return { ok: false, error: '密钥保险箱模式需要粘贴一次 runtime key（该隧道当前保险箱里没有可沿用的密钥）' };
    }
    if (mode === 'create' && !value) {
      return { ok: false, error: '密钥保险箱模式需要粘贴一次 runtime key（只进 Windows 凭据管理器，不写进配置文件）' };
    }
    key = { mode: 'keyring', value: value || undefined };
  } else if (keyModeRaw === 'inline') {
    const value = bodyString(raw.apiKey) ?? '';
    if (mode === 'create' && !value) {
      return { ok: false, error: '直接填写密钥的模式需要填写 runtime key' };
    }
    key = { mode: 'inline', value: value || undefined };
  } else if (keyModeRaw === 'clear') {
    key = { mode: 'clear' };
  } else if (keyModeRaw === 'keep' && mode === 'update') {
    key = { mode: 'keep' };
  } else {
    return { ok: false, error: '密钥来源参数不合法：' + keyModeRaw };
  }
  return { ok: true, value: { tunnelId, server, healthPort, key } };
}

async function applyTunnelKey(tunnel: TunnelConfig, key: TunnelKeyPayload): Promise<{ warning: string | null }> {
  switch (key.mode) {
    case 'env':
      tunnel.apiKeyEnv = key.envName;
      delete tunnel.apiKey;
      delete tunnel.apiKeyStore;
      break;
    case 'inline':
      if (key.value !== undefined) tunnel.apiKey = key.value;
      delete tunnel.apiKeyEnv;
      delete tunnel.apiKeyStore;
      break;
    case 'keyring': {
      if (key.value !== undefined) {
        const stored = await keyringSet(tunnel.name, key.value);
        if (!stored.ok) return { warning: stored.error ?? '密钥写入凭据管理器失败' };
      }
      tunnel.apiKeyStore = 'keyring';
      delete tunnel.apiKeyEnv;
      delete tunnel.apiKey;
      break;
    }
    case 'clear':
      delete tunnel.apiKeyEnv;
      delete tunnel.apiKey;
      delete tunnel.apiKeyStore;
      await keyringDelete(tunnel.name);
      break;
    default:
      break;
  }
  return { warning: null };
}

function openFolder(folderPath: string): void {
  const command =
    process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(command, [folderPath], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
}

/** 统计目录占用字节数；目录不存在或个别文件被占用时尽力而为，不抛异常 */
function folderSizeBytes(dir: string): number {
  try {
    if (!existsSync(dir)) return 0;
    let total = 0;
    for (const entry of readdirSync(dir)) {
      try {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) total += folderSizeBytes(full);
        else total += stat.size;
      } catch {
        // 单文件被占用就跳过
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/** 目录体积带 60 秒缓存：状态轮询频繁时不必反复遍历大量小文件 */
const sizeCache = new Map<string, { at: number; value: number }>();
function folderSizeCached(dir: string): number {
  const now = Date.now();
  const hit = sizeCache.get(dir);
  if (hit && now - hit.at < 60000) return hit.value;
  const value = folderSizeBytes(dir);
  sizeCache.set(dir, { at: now, value });
  return value;
}

/* ------------------------------------------------------------------ 安全校验 */

/** 只允许本机回环地址的 Host 头，挡住 DNS rebinding 之类借域名访问 127.0.0.1 的请求 */
function hostAllowed(req: IncomingMessage, panelPort: number): boolean {
  const host = req.headers.host ?? '';
  const name = host.split(':')[0]?.toLowerCase() ?? '';
  if (name !== '127.0.0.1' && name !== 'localhost' && name !== '::1' && name !== '[::1]') return false;
  const port = host.includes(':') ? Number(host.slice(host.lastIndexOf(':') + 1)) : 80;
  if (host.includes(':') && Number.isFinite(port) && panelPort > 0 && port !== panelPort) return false;
  return true;
}

/** 带 Origin 的请求必须来自本面板自己（同源），否则拒绝写操作 */
function originAllowed(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1';
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ 面板主体 */

interface RuntimeJob {
  kind: 'fetch' | 'import';
  running: boolean;
  startedAt: string;
  finishedAt: string | null;
  ok: boolean | null;
  error: string | null;
  /** 0–100 的真实进度（面板进度条直接用它，不再是空转动画） */
  progress: number | null;
  /** 当前阶段：prepare / download / verify / unpack / install / done / failed */
  stage: string | null;
  lines: string[];
}

export async function startPanel(opts: PanelOptions): Promise<PanelHandle> {
  const host = opts.host ?? '127.0.0.1';
  const busy = new Set<string>();
  const token = opts.config.ui?.token && opts.config.ui.token.length >= 8 ? opts.config.ui.token : generatePanelToken();
  let runtimeCache = { at: 0, path: null as string | null, version: null as string | null, source: 'none' };
  let runtimeJob: RuntimeJob | null = null;

  pruneLogs(opts.paths.logsDir);

  function invalidateRuntimeCache(): void {
    runtimeCache.at = 0;
  }

  function runtimeInfo(): { path: string | null; version: string | null; source: string } {
    const now = Date.now();
    if (now - runtimeCache.at > 15000) {
      const info = findRuntime(opts.paths);
      runtimeCache = { at: now, path: info.path, version: info.version, source: info.source };
    }
    return { path: runtimeCache.path, version: runtimeCache.version, source: runtimeCache.source };
  }

  function startRuntimeJob(
    kind: RuntimeJob['kind'],
    jobOpts: { version?: string; skipVerify?: boolean; zipPath?: string }
  ): boolean {
    if (runtimeJob && runtimeJob.running) return false;
    runtimeJob = {
      kind,
      running: true,
      startedAt: nowIso(),
      finishedAt: null,
      ok: null,
      error: null,
      progress: 0,
      stage: 'prepare',
      lines: [kind === 'fetch' ? '开始下载官方 tunnel-client 运行时 …' : '开始导入本地运行时压缩包 …'],
    };
    const push = (line: string): void => {
      if (!runtimeJob) return;
      runtimeJob.lines.push(line);
      if (runtimeJob.lines.length > 240) runtimeJob.lines.splice(0, runtimeJob.lines.length - 240);
    };
    installRuntime({
      paths: opts.paths,
      version: jobOpts.version,
      skipVerify: jobOpts.skipVerify,
      zipPath: jobOpts.zipPath,
      log: push,
      onProgress: (percent, stage) => {
        if (!runtimeJob) return;
        runtimeJob.progress = Math.max(0, Math.min(100, Math.round(percent)));
        runtimeJob.stage = stage;
      },
    })
      .then((result) => {
        if (!runtimeJob) return;
        runtimeJob.ok = true;
        runtimeJob.progress = 100;
        runtimeJob.stage = 'done';
        push('完成：' + result.path + (result.verified ? '（官方 SHA-256 校验通过）' : '（未校验）'));
        opts.onLog?.('面板下载了官方运行时：' + result.path);
      })
      .catch((err: unknown) => {
        if (!runtimeJob) return;
        runtimeJob.ok = false;
        runtimeJob.stage = 'failed';
        runtimeJob.error = err instanceof Error ? err.message : String(err);
        push('失败：' + runtimeJob.error);
      })
      .finally(() => {
        if (runtimeJob) {
          runtimeJob.running = false;
          runtimeJob.finishedAt = nowIso();
        }
        invalidateRuntimeCache();
      });
    return true;
  }

  async function buildState(): Promise<unknown> {
    const runtime = runtimeInfo();
    const statuses = listStatuses(opts.paths, opts.config);
    const tunnels: unknown[] = [];
    for (const status of statuses) {
      const health =
        status.state === 'running' && status.healthAddr ? await probeHealth(status.healthAddr, 1500) : null;
      const cfg = findTunnel(opts.config, status.name);
      const key = cfg ? await resolveApiKeyAsync(cfg) : { ok: false, error: '隧道配置缺失' };
      tunnels.push({
        name: status.name,
        tunnelIdMasked: status.tunnelIdMasked,
        server: status.server,
        target: status.target,
        healthAddr: status.healthAddr,
        healthPort: cfg?.healthPort ?? opts.config.defaults?.healthPort ?? null,
        status: {
          state: status.state,
          pid: status.pid,
          startedAt: status.startedAt,
          uptimeMs: status.uptimeMs,
        },
        health,
        lastError: status.lastError,
        key: {
          ready: key.ok,
          source: key.ok ? (key.source ?? null) : null,
          envName: cfg?.apiKeyEnv ?? null,
        },
      });
    }
    const usedBy = new Map<string, string[]>();
    for (const tunnel of opts.config.tunnels) {
      const list = usedBy.get(tunnel.server) ?? [];
      list.push(tunnel.name);
      usedBy.set(tunnel.server, list);
    }
    const issues = validateConfig(opts.config);
    const running = statuses.filter((status) => status.state === 'running').length;
    return {
      brand: {
        name: BRAND.name,
        slug: BRAND.slug,
        version: BRAND.version,
        repoUrl: BRAND.repoUrl,
        starUrl: BRAND.starUrl,
        support: { alipayQr: BRAND.support.alipayQr, link: BRAND.support.link },
      },
      configPath: opts.paths.configFile,
      configExists: opts.paths.configScope !== 'missing',
      configScope: describeConfigScope(opts.paths.configScope),
      home: opts.paths.home,
      logsDir: opts.paths.logsDir,
      runtime: { path: runtime.path, version: runtime.version, found: runtime.path !== null, source: runtime.source },
      runtimeJob: runtimeJob
        ? { kind: runtimeJob.kind, running: runtimeJob.running, ok: runtimeJob.ok, error: runtimeJob.error }
        : null,
      dataLocation: opts.dataLocation
        ? {
            isDesktop: opts.dataLocation.isDesktop,
            canMigrate: opts.dataLocation.canMigrate,
            fallback: opts.dataLocation.fallback === true,
            dataRoot: opts.dataLocation.dataRoot,
            desktopDir: opts.dataLocation.desktopDir,
            sizes: {
              dataRoot: folderSizeCached(opts.dataLocation.dataRoot),
              bin: folderSizeCached(opts.paths.binDir),
              logs: folderSizeCached(opts.paths.logsDir),
              cache: folderSizeCached(opts.paths.cacheDir),
              desktop: folderSizeCached(opts.dataLocation.desktopDir),
            },
          }
        : null,
      configIssues: issues,
      security: { keyringSupported: keyringSupported() },
      servers: opts.config.servers.map((server) => ({
        name: server.name,
        kind: server.kind,
        target: serverTarget(server),
        description: server.description ?? '',
        usedBy: usedBy.get(server.name) ?? [],
      })),
      tunnels,
      counts: { servers: opts.config.servers.length, tunnels: statuses.length, running },
      docs: BRAND.docs,
      panelVersion: BRAND.version,
      ui: {
        language: opts.config.ui?.language ?? 'zh',
        minimizeToTray: opts.config.ui?.minimizeToTray ?? false,
        autoLaunch: opts.config.ui?.autoLaunch ?? false,
        supportSeen: opts.config.ui?.supportSeen === true,
        supportHintClosed: opts.config.ui?.supportHintClosed === true,
      },
    };
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = decodeURIComponent(url.pathname);
    const method = req.method ?? 'GET';
    const address = server.address() as AddressInfo | null;
    const panelPort = address && typeof address === 'object' ? address.port : opts.port;

    try {
      if (!hostAllowed(req, panelPort) || !originAllowed(req)) {
        sendText(res, 403, 'forbidden');
        return;
      }

      if (path === '/api/auth-check') {
        const ok = extractToken(url, req.headers as Record<string, unknown>) === token;
        sendJson(res, ok ? 200 : 401, { ok });
        return;
      }

      if (!path.startsWith('/api/')) {
        if (method !== 'GET') {
          sendText(res, 405, 'method not allowed');
          return;
        }
        serveStatic(res, path);
        return;
      }

      // 进入 /api/ 的所有请求都要带本次面板的口令（前端从地址栏 #token 取出后放在请求头里）
      if (extractToken(url, req.headers as Record<string, unknown>) !== token) {
        sendJson(res, 401, { ok: false, error: '面板访问口令无效，请从 MCPHelm 窗口或 CLI 输出的地址重新打开' });
        return;
      }

      if (method === 'GET' && path === '/api/version') {
        sendJson(res, 200, { name: BRAND.name, version: BRAND.version });
        return;
      }

      if (method === 'GET' && path === '/api/state') {
        sendJson(res, 200, await buildState());
        return;
      }

      if (method === 'GET' && path === '/api/config') {
        sendJson(res, 200, {
          ok: true,
          configPath: opts.paths.configFile,
          configScope: describeConfigScope(opts.paths.configScope),
          config: {
            version: opts.config.version,
            defaults: opts.config.defaults ?? {},
            servers: opts.config.servers,
            tunnels: opts.config.tunnels.map((tunnel) => {
              const { apiKey, ...rest } = tunnel;
              return { ...rest, apiKeySet: Boolean(apiKey) };
            }),
          },
        });
        return;
      }

      if (method === 'GET' && path === '/api/doctor') {
        const checks = await runDoctor({
          paths: opts.paths,
          config: opts.config,
          configIssues: validateConfig(opts.config),
          online: url.searchParams.get('online') === '1',
        });
        sendJson(res, 200, { ok: true, checks });
        return;
      }

      if (method === 'GET' && path === '/api/runtime/job') {
        sendJson(res, 200, { ok: true, job: runtimeJob });
        return;
      }

      if (method === 'GET' && path === '/api/logs') {
        sendJson(res, 200, {
          ok: true,
          logsDir: opts.paths.logsDir,
          files: opts.config.tunnels.map((tunnel) => ({
            name: tunnel.name,
            logFile: logFileFor(opts.paths, tunnel.name),
          })),
        });
        return;
      }

      const logMatch = /^\/api\/logs\/([^/]+)$/.exec(path);
      if (method === 'GET' && logMatch) {
        const name = logMatch[1] ?? '';
        const tunnel = findTunnel(opts.config, name);
        if (!tunnel) {
          sendJson(res, 404, { ok: false, error: '未找到隧道：' + name });
          return;
        }
        const requested = Number(url.searchParams.get('lines') ?? '200');
        const lines = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 2000) : 200;
        const logFile = logFileFor(opts.paths, name);
        const tail = readLogTail(logFile, lines);
        sendJson(res, 200, { name, logFile, lines: tail.lines, truncated: tail.truncated });
        return;
      }

      /* ---------------------------------------------------------- 服务器增删改 */

      if (method === 'POST' && path === '/api/servers') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const name = bodyString(body.name) ?? '';
        if (!isValidName(name)) {
          sendJson(res, 400, { ok: false, error: '名称不合法（只允许字母数字与 . _ -，最长 40 字符）' });
          return;
        }
        const parsed = parseServerPayload(body);
        if (!parsed.ok) {
          sendJson(res, 400, { ok: false, error: parsed.error });
          return;
        }
        const existing = findServer(opts.config, name);
        if (existing && body.overwrite !== true) {
          sendJson(res, 409, { ok: false, error: '服务器已存在：' + name });
          return;
        }
        const value = parsed.value;
        const server: McpServerConfig = { name, kind: value.kind, description: value.description };
        if (value.kind === 'stdio') {
          server.command = value.command ?? '';
        } else {
          server.url = value.url ?? '';
          if (value.headers) server.headers = value.headers;
        }
        if (existing) {
          opts.config.servers[opts.config.servers.indexOf(existing)] = server;
        } else {
          opts.config.servers.push(server);
        }
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板保存了 MCP 服务器：' + name);
        sendJson(res, 200, { ok: true, message: '已保存 MCP 服务器：' + name });
        return;
      }

      const serverUpdateMatch = /^\/api\/servers\/([^/]+)\/update$/.exec(path);
      if (method === 'POST' && serverUpdateMatch) {
        const name = serverUpdateMatch[1] ?? '';
        const server = findServer(opts.config, name);
        if (!server) {
          sendJson(res, 404, { ok: false, error: '未找到服务器：' + name });
          return;
        }
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const parsed = parseServerPayload(body);
        if (!parsed.ok) {
          sendJson(res, 400, { ok: false, error: parsed.error });
          return;
        }
        const value = parsed.value;
        const updated: McpServerConfig = { name, kind: value.kind, description: value.description };
        if (value.kind === 'stdio') {
          updated.command = value.command ?? '';
        } else {
          updated.url = value.url ?? '';
          if (value.headers) updated.headers = value.headers;
        }
        opts.config.servers[opts.config.servers.indexOf(server)] = updated;
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板更新了 MCP 服务器：' + name);
        sendJson(res, 200, { ok: true, message: '已更新 MCP 服务器：' + name });
        return;
      }

      const serverRemoveMatch = /^\/api\/servers\/([^/]+)\/remove$/.exec(path);
      if (method === 'POST' && serverRemoveMatch) {
        const name = serverRemoveMatch[1] ?? '';
        const server = findServer(opts.config, name);
        if (!server) {
          sendJson(res, 404, { ok: false, error: '未找到服务器：' + name });
          return;
        }
        const used = opts.config.tunnels.filter((tunnel) => tunnel.server === name).map((tunnel) => tunnel.name);
        if (used.length > 0) {
          sendJson(res, 409, {
            ok: false,
            error: '该服务器正被这些隧道使用：' + used.join('、') + '。请先删除或改绑它们，再删除服务器。',
          });
          return;
        }
        opts.config.servers.splice(opts.config.servers.indexOf(server), 1);
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板删除了 MCP 服务器：' + name);
        sendJson(res, 200, { ok: true, message: '已删除 MCP 服务器：' + name });
        return;
      }

      /* ---------------------------------------------------------- 隧道增删改 */

      if (method === 'POST' && path === '/api/tunnels') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const name = bodyString(body.name) ?? '';
        if (!isValidName(name)) {
          sendJson(res, 400, { ok: false, error: '名称不合法（只允许字母数字与 . _ -，最长 40 字符）' });
          return;
        }
        const parsed = parseTunnelPayload(body, opts.config, 'create');
        if (!parsed.ok) {
          sendJson(res, 400, { ok: false, error: parsed.error });
          return;
        }
        const existing = findTunnel(opts.config, name);
        if (existing && body.overwrite !== true) {
          sendJson(res, 409, {
            ok: false,
            code: 'tunnel_exists',
            error: '隧道已存在：' + name + '（想用现在这份配置覆盖它，再点一次创建按钮就行）',
          });
          return;
        }
        const value = parsed.value;
        const tunnel: TunnelConfig = { name, tunnelId: value.tunnelId, server: value.server };
        if (value.healthPort !== undefined) tunnel.healthPort = value.healthPort;
        // 密钥写保险箱失败不再让创建整个失败：隧道先存下来，把原因作为 warning 交回界面。
        // 之前的写法是直接 400，用户看到「没创建成功」，其实连隧道记录都没保存。
        const keyResult = await applyTunnelKey(tunnel, value.key);
        if (existing) {
          opts.config.tunnels[opts.config.tunnels.indexOf(existing)] = tunnel;
        } else {
          opts.config.tunnels.push(tunnel);
        }
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板保存了隧道：' + name);
        const keyCheck = await resolveApiKeyAsync(tunnel);
        sendJson(res, 200, {
          ok: true,
          message: '已保存隧道：' + name,
          warning: keyResult.warning
            ? '隧道已保存，但 runtime key 没能写进密钥保险箱（' + keyResult.warning + '）。点这张卡片的「编辑」，把密钥来源换成「环境变量」或「直接填写」再保存一次就行。'
            : keyCheck.ok
              ? null
              : '隧道已保存，但还没有可用的 runtime key，启动前请补上（环境变量、密钥保险箱或直接填写）。',
        });
        return;
      }

      const tunnelUpdateMatch = /^\/api\/tunnels\/([^/]+)\/update$/.exec(path);
      if (method === 'POST' && tunnelUpdateMatch) {
        const name = tunnelUpdateMatch[1] ?? '';
        const tunnel = findTunnel(opts.config, name);
        if (!tunnel) {
          sendJson(res, 404, { ok: false, error: '未找到隧道：' + name });
          return;
        }
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const parsed = parseTunnelPayload(body, opts.config, 'update');
        if (!parsed.ok) {
          sendJson(res, 400, { ok: false, error: parsed.error });
          return;
        }
        const value = parsed.value;
        tunnel.tunnelId = value.tunnelId;
        tunnel.server = value.server;
        if (value.healthPort !== undefined) tunnel.healthPort = value.healthPort;
        else delete tunnel.healthPort;
        // 同创建接口：写保险箱失败也照常保存改动，用 warning 告诉用户怎么补救
        const keyResult = await applyTunnelKey(tunnel, value.key);
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板更新了隧道：' + name);
        const keyCheck = await resolveApiKeyAsync(tunnel);
        sendJson(res, 200, {
          ok: true,
          message: '已更新隧道：' + name + '（若正在运行，重启后生效）',
          warning: keyResult.warning
            ? '改动已保存，但 runtime key 没能写进密钥保险箱（' + keyResult.warning + '）。原来的密钥来源保持不变，也可以把它换成「环境变量」或「直接填写」再保存一次。'
            : keyCheck.ok
              ? null
              : '改动已保存，但该隧道当前没有可用的 runtime key，启动前请补上。',
        });
        return;
      }

      const tunnelRemoveMatch = /^\/api\/tunnels\/([^/]+)\/remove$/.exec(path);
      if (method === 'POST' && tunnelRemoveMatch) {
        const name = tunnelRemoveMatch[1] ?? '';
        const tunnel = findTunnel(opts.config, name);
        if (!tunnel) {
          sendJson(res, 404, { ok: false, error: '未找到隧道：' + name });
          return;
        }
        const state = readState(opts.paths, name);
        if (state && isProcessAlive(state.pid)) {
          sendJson(res, 409, { ok: false, error: '隧道 ' + name + ' 正在运行，请先停止再删除。' });
          return;
        }
        opts.config.tunnels.splice(opts.config.tunnels.indexOf(tunnel), 1);
        await keyringDelete(name);
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板删除了隧道：' + name);
        sendJson(res, 200, { ok: true, message: '已删除隧道：' + name });
        return;
      }

      /* ---------------------------------------------------------- 隧道启停 */

      const actionMatch = /^\/api\/tunnels\/([^/]+)\/(start|stop|restart)$/.exec(path);
      if (method === 'POST' && actionMatch) {
        const name = actionMatch[1] ?? '';
        const action = actionMatch[2] ?? '';
        const tunnel = findTunnel(opts.config, name);
        if (!tunnel) {
          sendJson(res, 404, { ok: false, error: '未找到隧道：' + name });
          return;
        }
        if (busy.has(name)) {
          sendJson(res, 409, { ok: false, error: '隧道 ' + name + ' 正在处理上一条指令，请稍候' });
          return;
        }
        busy.add(name);
        try {
          await readBody(req);
          if (action === 'stop') {
            const stopped = await stopTunnel(opts.paths, name);
            opts.onLog?.('面板停止了隧道 ' + name);
            sendJson(res, stopped.ok ? 200 : 400, {
              ok: stopped.ok,
              message: stopped.message,
              state: stopped.ok ? 'stopped' : 'error',
            });
            return;
          }
          if (action === 'restart') {
            const state = readState(opts.paths, name);
            if (state && isProcessAlive(state.pid)) {
              const stopped = await stopTunnel(opts.paths, name);
              if (!stopped.ok) {
                sendJson(res, 400, { ok: false, error: '重启失败（停止阶段）：' + stopped.message });
                return;
              }
            }
          }
          const result = await startTunnel({ paths: opts.paths, config: opts.config, tunnel });
          if (!result.ok) {
            sendJson(res, 400, { ok: false, error: result.error ?? '启动失败' });
            return;
          }
          const state = result.state;
          // 等待健康端点就绪，把"启动中…"变成"已就绪 / 起不来"两种明确结果
          const waitMs = 12000;
          const deadline = Date.now() + waitMs;
          let ready = false;
          let healthAddr = state?.healthAddr ?? '';
          while (Date.now() < deadline) {
            if (healthAddr) {
              try {
                const probe = await probeHealth(healthAddr, 1200);
                if (probe.readyz) {
                  ready = true;
                  break;
                }
              } catch {
                // 还没起来，继续等
              }
            }
            await sleep(600);
          }
          opts.onLog?.(
            (action === 'restart' ? '面板重启了隧道 ' : '面板启动了隧道 ') +
              name +
              '（PID ' +
              String(state?.pid ?? '?') +
              '，' +
              (ready ? '健康检查通过' : '等待就绪超时') +
              '）'
          );
          sendJson(res, 200, {
            ok: true,
            ready,
            message:
              (action === 'restart' ? '隧道 ' + name + ' 已重启' : '隧道 ' + name + ' 已启动') +
              '（PID ' +
              String(state?.pid ?? '?') +
              (ready ? '，健康检查已通过' : '，健康端点 ' + healthAddr + ' 尚未就绪，请稍后在状态里复检') +
              '）',
            state: 'running',
          });
          return;
        } finally {
          busy.delete(name);
        }
      }

      /* ---------------------------------------------------------- 运行时 */

      if (method === 'POST' && path === '/api/runtime/fetch') {
        const body = bodyObject(await readBody(req)) ?? {};
        const runtime = runtimeInfo();
        const force = body.force === true;
        if (runtime.path && !force) {
          sendJson(res, 200, {
            ok: true,
            skipped: true,
            message: '运行时已存在：' + runtime.path + '（如需重新下载，请选择“重新下载”）',
          });
          return;
        }
        const version = bodyString(body.version);
        if (!startRuntimeJob('fetch', { version, skipVerify: body.skipVerify === true })) {
          sendJson(res, 409, { ok: false, error: '已有一个运行时任务在进行中' });
          return;
        }
        sendJson(res, 200, { ok: true, started: true, message: '已开始下载官方运行时' });
        return;
      }

      if (method === 'POST' && path === '/api/runtime/import') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const zipPath = bodyString(body.zipPath);
        if (!zipPath) {
          sendJson(res, 400, { ok: false, error: '请填写压缩包完整路径' });
          return;
        }
        const version = bodyString(body.version);
        if (!startRuntimeJob('import', { version, skipVerify: body.skipVerify === true, zipPath })) {
          sendJson(res, 409, { ok: false, error: '已有一个运行时任务在进行中' });
          return;
        }
        sendJson(res, 200, { ok: true, started: true, message: '已开始导入本地压缩包' });
        return;
      }

      if (method === 'POST' && path === '/api/open') {
        const body = bodyObject(await readBody(req)) ?? {};
        const target = bodyString(body.target) ?? '';
        const map: Record<string, string> = {
          config: opts.paths.configDir,
          logs: opts.paths.logsDir,
          home: opts.paths.home,
          bin: opts.paths.binDir,
        };
        const folder = map[target];
        if (!folder) {
          sendJson(res, 400, { ok: false, error: '未知的打开目标：' + target });
          return;
        }
        openFolder(folder);
        sendJson(res, 200, { ok: true, path: folder });
        return;
      }

      /* ---------------------------------------------------------- 数据目录迁移 */

      if (method === 'POST' && path === '/api/data-location/choose') {
        if (!opts.dataLocation || !opts.dataLocation.canMigrate || !opts.dataLocation.chooseFolder) {
          sendJson(res, 400, { ok: false, error: '当前运行方式不支持迁移数据目录（仅桌面版可用）' });
          return;
        }
        const chosen = await opts.dataLocation.chooseFolder(opts.dataLocation.dataRoot);
        sendJson(res, 200, { ok: true, path: chosen });
        return;
      }

      if (method === 'POST' && path === '/api/data-location/migrate') {
        if (!opts.dataLocation || !opts.dataLocation.canMigrate || !opts.dataLocation.migrate) {
          sendJson(res, 400, { ok: false, error: '当前运行方式不支持迁移数据目录（仅桌面版可用）' });
          return;
        }
        const body = bodyObject(await readBody(req)) ?? {};
        const target = bodyString(body.target) ?? '';
        if (!target) {
          sendJson(res, 400, { ok: false, error: '缺少目标目录' });
          return;
        }
        try {
          const newRoot = await opts.dataLocation.migrate(target);
          sendJson(res, 200, {
            ok: true,
            newRoot,
            needRestart: true,
            message: '数据已复制到新目录，重启 MCPHelm 后生效；原目录保留作为备份，可确认无误后自行删除。',
          });
        } catch (err) {
          sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) });
        }
        return;
      }

      /* ---------------------------------------------------------- 新能力 */

      // 服务器连通性测试（保存前先试一下）
      if (method === 'POST' && path === '/api/servers/test') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const kind = bodyString(body.kind) === 'http' ? 'http' : 'stdio';
        if (kind === 'stdio') {
          const command = bodyString(body.command) ?? '';
          if (!command) {
            sendJson(res, 400, { ok: false, error: '请填写要测试的启动命令' });
            return;
          }
          const result = await testStdioCommand(command);
          sendJson(res, 200, { ok: true, result });
          return;
        }
        const urlRaw = bodyString(body.url) ?? '';
        if (!urlRaw) {
          sendJson(res, 400, { ok: false, error: '请填写要测试的服务地址' });
          return;
        }
        let headers: Record<string, string> | undefined;
        const headerObj = bodyObject(body.headers);
        if (headerObj) {
          headers = {};
          for (const [k, v] of Object.entries(headerObj)) {
            if (typeof v === 'string') headers[k] = v;
          }
        }
        const result = await testHttpEndpoint(urlRaw, headers);
        sendJson(res, 200, { ok: true, result });
        return;
      }

      // 常用服务器模板
      if (method === 'GET' && path === '/api/templates') {
        sendJson(res, 200, { ok: true, templates: SERVER_TEMPLATES });
        return;
      }

      /* ---------------------------------------------------------- 组件市场 */

      // 组件清单 + 安装状态（已装 = servers[] 里已有同名服务器）
      if (method === 'GET' && path === '/api/components') {
        /* 星标：内置快照打底，联网刷新的结果写进数据根缓存（6 小时内复用）。
           刷新是后台任务、不阻塞这次响应，界面上永远有数字可看。 */
        const starsFile = join(opts.paths.cacheDir, 'stars.json');
        const cache = readStarsCache(starsFile);
        const fresh = starsCacheFresh(cache);
        if (!fresh) {
          const repos = [...new Set(COMPONENTS.map((c) => c.source.repo))];
          void refreshStars(repos, starsFile, cache).catch(() => undefined);
        }
        const live = fresh ? cache : null;
        const items = COMPONENTS.map((c) => ({
          id: c.id,
          title: c.title,
          titleEn: c.titleEn,
          description: c.description,
          descriptionEn: c.descriptionEn,
          abilities: c.abilities,
          abilitiesEn: c.abilitiesEn,
          source: c.source,
          kind: c.kind,
          runner: c.runner,
          runnerName: runnerName(c.runner),
          hint: c.hint ?? '',
          hintEn: c.hintEn ?? '',
          stars: live?.repos[c.source.repo] ?? c.stars,
          starsLive: !!live,
          starsSnapshotAt: STARS_SNAPSHOT_AT,
          starsRefreshedAt: live?.at ?? '',
          command: componentCommand(c, opts.paths),
          installed: !!findServer(opts.config, c.id),
        }));
        sendJson(res, 200, { ok: true, components: items });
        return;
      }

      // 安装组件：本质是生成正确的启动命令并写进 config.servers
      const compInstallMatch = /^\/api\/components\/([^/]+)\/install$/.exec(path);
      if (method === 'POST' && compInstallMatch) {
        const id = compInstallMatch[1] ?? '';
        const spec = findComponent(id);
        if (!spec) {
          sendJson(res, 404, { ok: false, error: '未找到组件：' + id });
          return;
        }
        if (findServer(opts.config, id)) {
          sendJson(res, 409, { ok: false, error: '组件已安装（服务器列表里已有 ' + id + '），如需重装请先卸载' });
          return;
        }
        const server: McpServerConfig = {
          name: spec.id,
          kind: spec.kind,
          description: spec.serverDescription ?? spec.description,
        };
        if (spec.kind === 'stdio') server.command = componentCommand(spec, opts.paths);
        opts.config.servers.push(server);
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('组件市场安装了组件：' + spec.title + '（' + id + '）');
        sendJson(res, 200, { ok: true, message: '已安装 ' + spec.title + '，去“服务器”里挂上隧道就能用', server });
        return;
      }

      // 卸载组件：把同名服务器从 config.servers 里移除（被隧道占用时拒绝）
      const compRemoveMatch = /^\/api\/components\/([^/]+)\/remove$/.exec(path);
      if (method === 'POST' && compRemoveMatch) {
        const id = compRemoveMatch[1] ?? '';
        const spec = findComponent(id);
        if (!spec) {
          sendJson(res, 404, { ok: false, error: '未找到组件：' + id });
          return;
        }
        const server = findServer(opts.config, id);
        if (!server) {
          sendJson(res, 404, { ok: false, error: '组件未安装：' + spec.title });
          return;
        }
        const used = opts.config.tunnels.filter((t) => t.server === id).map((t) => t.name);
        if (used.length > 0) {
          sendJson(res, 409, { ok: false, error: '该组件正被这些隧道使用：' + used.join('、') + '。请先删除或改绑隧道，再卸载。' });
          return;
        }
        opts.config.servers.splice(opts.config.servers.indexOf(server), 1);
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('组件市场卸载了组件：' + spec.title + '（' + id + '）');
        sendJson(res, 200, { ok: true, message: '已卸载 ' + spec.title });
        return;
      }

      // 扫描本机已有的 MCP 配置（Claude / Cursor / VS Code）
      if (method === 'GET' && path === '/api/import/scan') {
        const found = scanExternalConfigs();
        sendJson(res, 200, {
          ok: true,
          found: found.map((f) => ({
            source: f.source.label,
            file: f.file,
            error: f.error ?? null,
            servers: f.servers.map((s) => ({
              name: s.name,
              kind: s.kind,
              target: serverTarget(s),
              description: s.description ?? '',
            })),
          })),
        });
        return;
      }

      // 应用导入：names 为空表示全部导入；overwrite 控制重名策略
      if (method === 'POST' && path === '/api/import/apply') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        const sourceFile = bodyString(body.sourceFile);
        const pasted = bodyString(body.pastedText);
        let parsed: { servers: McpServerConfig[]; error?: string };
        if (sourceFile) parsed = parseExternalFile(sourceFile);
        else if (pasted) parsed = parsePastedConfig(pasted);
        else {
          sendJson(res, 400, { ok: false, error: '需要提供 sourceFile 或 pastedText' });
          return;
        }
        if (parsed.error) {
          sendJson(res, 400, { ok: false, error: parsed.error });
          return;
        }
        const names = Array.isArray(body.names) ? body.names.filter((n): n is string => typeof n === 'string') : null;
        const chosen = names ? parsed.servers.filter((s) => names.includes(s.name)) : parsed.servers;
        if (chosen.length === 0) {
          sendJson(res, 400, { ok: false, error: '没有选中任何服务器' });
          return;
        }
        const outcome = mergeServers(opts.config, chosen, { overwrite: body.overwrite === true });
        saveConfig(opts.paths, opts.config);
        opts.onLog?.('面板导入了 MCP 服务器：新增 ' + outcome.added.length + '，覆盖 ' + outcome.replaced.length);
        sendJson(res, 200, { ok: true, outcome });
        return;
      }

      // 配置导出：下载一份脱敏的配置备份（不含任何密钥值），用于备份或迁移
      if (method === 'GET' && path === '/api/config/export') {
        const cfg = opts.config;
        const clean = {
          servers: (cfg.servers ?? []).map((s) => ({
            name: s.name,
            kind: s.kind,
            command: s.command,
            url: s.url,
            headers: s.headers,
            description: s.description,
          })),
          tunnels: (cfg.tunnels ?? []).map((tn) => ({
            name: tn.name,
            tunnelId: tn.tunnelId,
            server: tn.server,
            healthPort: tn.healthPort,
            apiKeyEnv: tn.apiKeyEnv,
            apiKeyStore: tn.apiKeyStore,
          })),
        };
        const json = JSON.stringify(clean, null, 2);
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': 'attachment; filename="mcphelm-config-backup.json"',
        });
        res.end(json);
        return;
      }

      // 界面偏好（语言、托盘、自启动等）
      if (method === 'POST' && path === '/api/ui') {
        const body = bodyObject(await readBody(req));
        if (!body) {
          sendJson(res, 400, { ok: false, error: '请求体需要是 JSON 对象' });
          return;
        }
        opts.config.ui = opts.config.ui ?? {};
        const language = bodyString(body.language);
        if (language === 'zh' || language === 'en') opts.config.ui.language = language;
        if (typeof body.minimizeToTray === 'boolean') opts.config.ui.minimizeToTray = body.minimizeToTray;
        if (typeof body.autoLaunch === 'boolean') opts.config.ui.autoLaunch = body.autoLaunch;
        // 一次性欢迎弹窗 / 概览支持提示条：只记「不再打扰」，不改任何功能行为
        if (typeof body.supportSeen === 'boolean') opts.config.ui.supportSeen = body.supportSeen;
        if (typeof body.supportHintClosed === 'boolean') opts.config.ui.supportHintClosed = body.supportHintClosed;
        const customToken = bodyString(body.token);
        if (customToken !== undefined) {
          if (customToken === '') delete opts.config.ui.token;
          else if (customToken.length < 8) {
            sendJson(res, 400, { ok: false, error: '自定义口令至少 8 位' });
            return;
          } else {
            opts.config.ui.token = customToken;
          }
        }
        saveConfig(opts.paths, opts.config);
        sendJson(res, 200, { ok: true, ui: opts.config.ui, restartHint: customToken !== undefined ? '口令将在面板重启后生效' : null });
        return;
      }

      sendJson(res, 404, { ok: false, error: '未知接口：' + method + ' ' + path });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const server = createServer((req, res) => {
    void handle(req, res);
  });

  await new Promise<void>((ready, fail) => {
    const onError = (err: Error): void => {
      fail(err);
    };
    server.once('error', onError);
    server.listen(opts.port, host, () => {
      server.off('error', onError);
      ready();
    });
  });
  const address = server.address();
  const actualPort = address && typeof address === 'object' ? address.port : opts.port;
  const url = 'http://' + host + ':' + actualPort + '/#token=' + token;

  return {
    url,
    port: actualPort,
    token,
    close: () =>
      new Promise<void>((done) => {
        server.close(() => done());
      }),
  };
}

export function panelBanner(url: string, configFile: string): string {
  return [
    bold(BRAND.name) + ' 本地面板已启动',
    '  ' + cyan(url),
    '  ' + dim('配置文件：' + configFile),
    '  ' + dim('按 Ctrl+C 退出面板（已启动的隧道在后台继续运行）'),
  ].join('\n');
}

export function panelStopHint(): string {
  return yellow('面板已停止');
}

