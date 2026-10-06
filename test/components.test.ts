import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { COMPONENTS, componentCommand, findComponent } from '../src/components.ts';
import { startPanel } from '../src/panel/server.ts';
import type { AppPaths } from '../src/paths.ts';
import { emptyConfig, findServer } from '../src/store.ts';
import type { AppConfig } from '../src/store.ts';

let dir = '';
let paths: AppPaths;
let handle: Awaited<ReturnType<typeof startPanel>> | null = null;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mcphelm-comp-'));
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
    componentsDir: join(dir, 'components'),
    desktopDir: join(dir, 'desktop'),
  };
});

afterEach(async () => {
  if (handle) await handle.close();
  handle = null;
  rmSync(dir, { recursive: true, force: true });
});

async function boot(config: AppConfig) {
  handle = await startPanel({ paths, config, port: 0 });
  return { base: 'http://127.0.0.1:' + handle.port, token: handle.token };
}

describe('组件市场清单', () => {
  it('内置组件全部字段齐全且 id 唯一', () => {
    const ids = new Set<string>();
    for (const c of COMPONENTS) {
      assert.ok(c.id && c.title && c.description, '组件缺基础字段：' + c.id);
      assert.ok(c.source.repo && c.source.license && /^https:\/\//.test(c.source.url), '组件缺来源：' + c.id);
      assert.ok(c.kind === 'stdio' || c.kind === 'http');
      assert.ok(c.runner === 'npx' || c.runner === 'uvx');
      assert.ok(c.package.length > 0, '组件缺包名：' + c.id);
      assert.ok(!ids.has(c.id), '组件 id 重复：' + c.id);
      ids.add(c.id);
    }
  });

  it('findComponent 能找到三件套，找不到返回 undefined', () => {
    assert.ok(findComponent('serena'));
    assert.ok(findComponent('windows-mcp'));
    assert.ok(findComponent('playwright-mcp'));
    assert.equal(findComponent('nonexistent'), undefined);
  });

  it('componentCommand 按 runner 生成正确命令', () => {
    const serena = findComponent('serena')!;
    assert.match(componentCommand(serena, paths), /^uvx /);
    assert.match(componentCommand(serena, paths), /start-mcp-server/);
    const pw = findComponent('playwright-mcp')!;
    assert.match(componentCommand(pw, paths), /^npx -y @playwright\/mcp/);
  });
});

describe('组件市场 API', () => {
  it('GET /api/components 返回清单与安装状态', async () => {
    const { base, token } = await boot(emptyConfig());
    const res = await fetch(base + '/api/components', { headers: { 'x-mcphelm-token': token } });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; components: Array<{ id: string; installed: boolean }> };
    assert.equal(body.ok, true);
    assert.ok(body.components.length >= 3);
    assert.ok(body.components.every((x) => x.installed === false));
  });

  it('安装组件会把命令写进 servers，重复安装返回 409，卸载后移除', async () => {
    const config = emptyConfig();
    const { base, token } = await boot(config);
    const headers = { 'x-mcphelm-token': token, 'content-type': 'application/json' };

    // 安装
    let res = await fetch(base + '/api/components/fetch/install', { method: 'POST', headers });
    assert.equal(res.status, 200);
    const sv = findServer(config, 'fetch');
    assert.ok(sv, '安装后 servers 里应有 fetch');
    assert.match(sv!.command ?? '', /^uvx mcp-server-fetch/);

    // 状态变为已安装
    res = await fetch(base + '/api/components', { headers: { 'x-mcphelm-token': token } });
    const list = (await res.json()) as { components: Array<{ id: string; installed: boolean }> };
    assert.equal(list.components.find((x) => x.id === 'fetch')!.installed, true);

    // 重复安装 → 409
    res = await fetch(base + '/api/components/fetch/install', { method: 'POST', headers });
    assert.equal(res.status, 409);

    // 卸载
    res = await fetch(base + '/api/components/fetch/remove', { method: 'POST', headers });
    assert.equal(res.status, 200);
    assert.equal(findServer(config, 'fetch'), undefined);

    // 再卸载 → 404
    res = await fetch(base + '/api/components/fetch/remove', { method: 'POST', headers });
    assert.equal(res.status, 404);
  });

  it('被隧道占用的组件卸载返回 409', async () => {
    const config = emptyConfig();
    config.servers.push({ name: 'fetch', kind: 'stdio', command: 'uvx mcp-server-fetch' });
    config.tunnels.push({ name: 't1', tunnelId: 'tunnel_' + 'a'.repeat(32), server: 'fetch', apiKey: 'x' });
    const { base, token } = await boot(config);
    const res = await fetch(base + '/api/components/fetch/remove', {
      method: 'POST',
      headers: { 'x-mcphelm-token': token, 'content-type': 'application/json' },
    });
    assert.equal(res.status, 409);
    // 服务器应仍在
    assert.ok(findServer(config, 'fetch'));
  });

  it('安装不存在的组件返回 404', async () => {
    const { base, token } = await boot(emptyConfig());
    const res = await fetch(base + '/api/components/nope/install', {
      method: 'POST',
      headers: { 'x-mcphelm-token': token, 'content-type': 'application/json' },
    });
    assert.equal(res.status, 404);
  });
});
