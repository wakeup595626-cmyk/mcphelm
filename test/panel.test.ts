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
});
