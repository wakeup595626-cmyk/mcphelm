import assert from 'node:assert/strict';
import { get } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { startPanel } from '../src/panel/server.ts';
import type { AppPaths } from '../src/paths.ts';
import { emptyConfig } from '../src/store.ts';

let dir = '';
let paths: AppPaths;
let handle: Awaited<ReturnType<typeof startPanel>> | null = null;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mcphelm-panel-'));
  paths = {
    cwd: dir,
    home: dir,
    configFile: join(dir, 'config.json'),
    configScope: 'home',
    configDir: dir,
    runDir: join(dir, 'run'),
    logsDir: join(dir, 'logs'),
    binDir: join(dir, 'bin'),
    tmpDir: join(dir, 'tmp'),
    cacheDir: join(dir, 'cache'),
    desktopDir: join(dir, 'desktop'),
  };
});

afterEach(async () => {
  if (handle) await handle.close();
  handle = null;
  rmSync(dir, { recursive: true, force: true });
});

async function boot(config = emptyConfig()) {
  handle = await startPanel({ paths, config, port: 0 });
  const base = 'http://127.0.0.1:' + handle.port;
  return { base, token: handle.token };
}

describe('panel 安全与 API', () => {
  it('不带口令访问 /api/state 会被 401 拒绝', async () => {
    const { base } = await boot();
    const res = await fetch(base + '/api/state');
    assert.equal(res.status, 401);
  });

  it('带口令的合法请求返回 200', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { brand: { name: string } };
    assert.equal(body.brand.name, 'MCPHelm');
  });

  it('/api/state 暴露 Star 与赞助入口，收款码是免口令的同源静态图', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } });
    const body = (await res.json()) as {
      brand: { starUrl: string; repoUrl: string; support: { alipayQr: string } };
      ui: { supportSeen: boolean; supportHintClosed: boolean };
    };
    assert.equal(body.brand.starUrl, body.brand.repoUrl);
    assert.ok(body.brand.starUrl.startsWith('https://github.com/'));
    assert.equal(body.brand.support.alipayQr, 'support/alipay.png');
    assert.equal(body.ui.supportSeen, false);
    assert.equal(body.ui.supportHintClosed, false);
    // 面板里的 <img src> 直接取这张图，静态资源不受口令限制，否则弹窗会显示裂图
    const qr = await fetch(base + '/support/alipay.png');
    assert.equal(qr.status, 200);
    assert.equal(qr.headers.get('content-type'), 'image/png');
    assert.ok((await qr.arrayBuffer()).byteLength > 1000);
  });

  it('/api/ui 记住「看过欢迎弹窗」「关掉支持提示条」，刷新后不再打扰', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/ui', {
      method: 'POST',
      headers: { 'x-mcphelm-token': token, 'content-type': 'application/json' },
      body: JSON.stringify({ supportSeen: true, supportHintClosed: true }),
    });
    assert.equal(res.status, 200);
    const state = await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } });
    const body = (await state.json()) as { ui: { supportSeen: boolean; supportHintClosed: boolean } };
    assert.equal(body.ui.supportSeen, true);
    assert.equal(body.ui.supportHintClosed, true);
    // 语言 / 托盘这些老字段不能被顺带改动
    const keep = (await (
      await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } })
    ).json()) as { ui: { language: string } };
    assert.equal(keep.ui.language, 'zh');
  });

  it('伪造域名 Host 头会被 403 拒绝', async () => {
    const { base, token } = await boot();
    const status = await new Promise<number>((done, reject) => {
      const req = get(base + '/api/state', {
        headers: { 'x-mcphelm-token': token, host: 'evil.example.com' },
      }, (res) => {
        res.resume();
        done(res.statusCode ?? 0);
      });
      req.on('error', reject);
    });
    assert.equal(status, 403);
  });

  it('跨站 Origin 的写请求会被 403 拒绝', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/ui', {
      method: 'POST',
      headers: {
        'x-mcphelm-token': token,
        'content-type': 'application/json',
        origin: 'http://attacker.test',
      },
      body: JSON.stringify({ language: 'en' }),
    });
    assert.equal(res.status, 403);
  });

  it('/api/templates 返回常用服务器模板', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/templates', { headers: { 'x-mcphelm-token': token } });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { templates: unknown[] };
    assert.ok(body.templates.length >= 3);
  });

  it('/api/import/apply 能导入粘贴的 mcpServers 配置', async () => {
    const { base, token } = await boot();
    const config = emptyConfig();
    if (handle) await handle.close();
    handle = await startPanel({ paths, config, port: 0 });
    const res = await fetch('http://127.0.0.1:' + handle.port + '/api/import/apply', {
      method: 'POST',
      headers: { 'x-mcphelm-token': handle.token, 'content-type': 'application/json' },
      body: JSON.stringify({
        pastedText: JSON.stringify({ mcpServers: { demo: { command: 'npx', args: ['-y', 'x'] } } }),
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; outcome: { added: string[] } };
    assert.equal(body.ok, true);
    assert.deepEqual(body.outcome.added, ['demo']);
    assert.equal(config.servers.length, 1);
  });

  it('/api/servers/test 对空命令报错而不是卡死', async () => {
    const { base, token } = await boot();
    const res = await fetch(base + '/api/servers/test', {
      method: 'POST',
      headers: { 'x-mcphelm-token': token, 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'stdio', command: '  ' }),
    });
    assert.equal(res.status, 400);
  });

  it('畸形 URL（/%zz）返回 400，面板不会被带崩', async () => {
    const { base, token } = await boot();
    // 以前 decodeURIComponent 在 try 之外，/%zz 会抛 URIError 变成未处理的
    // Promise 拒绝，桌面版里等于整个应用直接退出。
    const status = await new Promise<number>((done, reject) => {
      const req = get(base + '/%zz', (res) => {
        res.resume();
        done(res.statusCode ?? 0);
      });
      req.on('error', reject);
    });
    assert.equal(status, 400);
    // 关键：面板仍然存活，能继续服务正常请求
    const after = await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } });
    assert.equal(after.status, 200);
  });

  it('保险箱密钥的就绪检查带缓存，轮询不会每次都去读凭据管理器', async () => {
    const config = emptyConfig();
    config.tunnels.push({
      name: 'demo',
      tunnelId: 'tunnel_' + 'a'.repeat(32),
      server: 'demo',
      apiKeyStore: 'keyring',
    });
    const { base, token } = await boot(config);
    const poll = async () => {
      const res = await fetch(base + '/api/state', { headers: { 'x-mcphelm-token': token } });
      assert.equal(res.status, 200);
      return (await res.json()) as { tunnels: Array<{ key: { ready: boolean; envName: string | null } }> };
    };
    const first = await poll(); // 这一次会真的去读一次凭据管理器，并写入缓存
    assert.equal(first.tunnels.length, 1);
    assert.deepEqual(first.tunnels[0]!.key, { ready: false, source: null, envName: null });
    const started = Date.now();
    for (let i = 0; i < 6; i += 1) await poll();
    const elapsed = Date.now() - started;
    // 不缓存的话 6 次要 1.7 秒以上（单次约 300ms），缓存后应接近 0ms
    assert.ok(elapsed < 600, '6 次轮询应命中缓存，实测 ' + elapsed + 'ms');
  });
});
