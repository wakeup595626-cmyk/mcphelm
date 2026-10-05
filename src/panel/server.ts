import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../brand.ts';
import { runDoctor } from '../doctor.ts';
import { describeConfigScope, logFileFor } from '../paths.ts';
import type { AppPaths } from '../paths.ts';
import { listStatuses, probeHealth, readLogTail, startTunnel, stopTunnel } from '../runtime.ts';
import { findTunnel, serverTarget } from '../store.ts';
import type { AppConfig, ConfigIssue } from '../store.ts';
import { findRuntime } from '../tunnelclient.ts';
import { bold, cyan, dim, yellow } from '../util.ts';

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
}

export interface PanelHandle {
  url: string;
  port: number;
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

export async function startPanel(opts: PanelOptions): Promise<PanelHandle> {
  const host = opts.host ?? '127.0.0.1';
  const busy = new Set<string>();
  let runtimeCache = { at: 0, path: null as string | null, version: null as string | null };

  function runtimeInfo(): { path: string | null; version: string | null } {
    const now = Date.now();
    if (now - runtimeCache.at > 15000) {
      const info = findRuntime(opts.paths);
      runtimeCache = { at: now, path: info.path, version: info.version };
    }
    return { path: runtimeCache.path, version: runtimeCache.version };
  }

  async function buildState(): Promise<unknown> {
    const runtime = runtimeInfo();
    const statuses = listStatuses(opts.paths, opts.config);
    const tunnels: unknown[] = [];
    for (const status of statuses) {
      const health =
        status.state === 'running' && status.healthAddr ? await probeHealth(status.healthAddr, 1500) : null;
      tunnels.push({
        name: status.name,
        tunnelIdMasked: status.tunnelIdMasked,
        server: status.server,
        target: status.target,
        healthAddr: status.healthAddr,
        status: {
          state: status.state,
          pid: status.pid,
          startedAt: status.startedAt,
          uptimeMs: status.uptimeMs,
        },
        health,
        lastError: status.lastError,
      });
    }
    return {
      brand: { name: BRAND.name, slug: BRAND.slug, version: BRAND.version, repoUrl: BRAND.repoUrl },
      configPath: opts.paths.configFile,
      configExists: opts.paths.configScope !== 'missing',
      configScope: describeConfigScope(opts.paths.configScope),
      home: opts.paths.home,
      runtime: { path: runtime.path, version: runtime.version, found: runtime.path !== null },
      servers: opts.config.servers.map((server) => ({
        name: server.name,
        kind: server.kind,
        target: serverTarget(server),
        description: server.description ?? '',
      })),
      tunnels,
      docs: BRAND.docs,
      panelVersion: BRAND.version,
    };
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = decodeURIComponent(url.pathname);
    const method = req.method ?? 'GET';

    try {
      if (!path.startsWith('/api/')) {
        if (method !== 'GET') {
          sendText(res, 405, 'method not allowed');
          return;
        }
        serveStatic(res, path);
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

      if (method === 'GET' && path === '/api/doctor') {
        const checks = await runDoctor({
          paths: opts.paths,
          config: opts.config,
          configIssues: opts.configIssues ?? [],
          online: url.searchParams.get('online') === '1',
        });
        sendJson(res, 200, { ok: true, checks });
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

      const actionMatch = /^\/api\/tunnels\/([^/]+)\/(start|stop)$/.exec(path);
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
          if (action === 'start') {
            const result = await startTunnel({ paths: opts.paths, config: opts.config, tunnel });
            if (!result.ok) {
              sendJson(res, 400, { ok: false, error: result.error ?? '启动失败' });
              return;
            }
            const state = result.state;
            opts.onLog?.('面板启动了隧道 ' + name + '（PID ' + String(state?.pid ?? '?') + '）');
            sendJson(res, 200, {
              ok: true,
              message:
                '隧道 ' +
                name +
                ' 已启动（PID ' +
                String(state?.pid ?? '?') +
                '，健康端点 ' +
                String(state?.healthAddr ?? '') +
                '）',
              state: 'running',
            });
            return;
          }
          const stopped = await stopTunnel(opts.paths, name);
          opts.onLog?.('面板停止了隧道 ' + name);
          sendJson(res, stopped.ok ? 200 : 400, {
            ok: stopped.ok,
            message: stopped.message,
            state: stopped.ok ? 'stopped' : 'error',
          });
          return;
        } finally {
          busy.delete(name);
        }
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
  const url = 'http://' + host + ':' + actualPort + '/';

  return {
    url,
    port: actualPort,
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
