import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildRunArgs, childEnv, maskTunnelId, readLogTail } from '../src/runtime.ts';
import type { McpServerConfig, TunnelConfig } from '../src/store.ts';

const TUNNEL_ID = 'tunnel_' + '0f'.repeat(16);
const tunnel: TunnelConfig = { name: 'demo', tunnelId: TUNNEL_ID, server: 'demo' };

test('stdio 隧道生成的命令与官方 CLI 参数一致', () => {
  const server: McpServerConfig = { name: 'demo', kind: 'stdio', command: 'npx -y demo-server' };
  assert.deepEqual(buildRunArgs(tunnel, server, '127.0.0.1:8080'), [
    'run',
    '--control-plane.tunnel-id=' + TUNNEL_ID,
    '--health.listen-addr=127.0.0.1:8080',
    '--mcp.command=npx -y demo-server',
  ]);
});

test('HTTP 隧道会带上 extra-headers 与自定义参数', () => {
  const server: McpServerConfig = {
    name: 'web',
    kind: 'http',
    url: 'http://127.0.0.1:3001/mcp',
    headers: { Authorization: 'Bearer t' },
  };
  const withExtra: TunnelConfig = { ...tunnel, extraArgs: ['--log.level=debug'] };
  assert.deepEqual(buildRunArgs(withExtra, server, '127.0.0.1:9000'), [
    'run',
    '--control-plane.tunnel-id=' + TUNNEL_ID,
    '--health.listen-addr=127.0.0.1:9000',
    '--mcp.server-url=http://127.0.0.1:3001/mcp',
    '--mcp.extra-headers=Authorization: Bearer t',
    '--log.level=debug',
  ]);
});

test('命令里不会出现 runtime key', () => {
  const withKey: TunnelConfig = { ...tunnel, apiKey: 'sk-super-secret' };
  const server: McpServerConfig = { name: 'demo', kind: 'stdio', command: 'npx -y demo' };
  const args = buildRunArgs(withKey, server, '127.0.0.1:8080');
  assert.equal(args.join(' ').includes('sk-super-secret'), false);
});

test('maskTunnelId 只暴露前缀', () => {
  assert.equal(maskTunnelId(TUNNEL_ID), TUNNEL_ID.slice(0, 11) + '***');
});

test('readLogTail 返回末尾若干行', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-log-'));
  try {
    const file = join(dir, 'demo.log');
    const lines = Array.from({ length: 100 }, (_, index) => 'line-' + String(index + 1));
    writeFileSync(file, lines.join('\n') + '\n');
    const tail = readLogTail(file, 5);
    assert.deepEqual(tail.lines, lines.slice(-5));
    assert.equal(tail.truncated, true);

    const whole = readLogTail(file, 500);
    assert.equal(whole.lines.length, 100);
    assert.equal(whole.truncated, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readLogTail 对不存在的日志文件保持安静', () => {
  const result = readLogTail(join(tmpdir(), 'mcphelm-not-exists-' + String(Date.now()) + '.log'), 10);
  assert.deepEqual(result.lines, []);
  assert.equal(result.truncated, false);
});

const CACHE_ENV_KEYS = ['NPM_CONFIG_CACHE', 'npm_config_cache', 'PIP_CACHE_DIR', 'UV_CACHE_DIR', 'XDG_CACHE_HOME'];

function withoutCacheEnv<T>(fn: () => T): T {
  const saved = CACHE_ENV_KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of CACHE_ENV_KEYS) delete process.env[key];
  try {
    return fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('childEnv 把 npx/pip/uv 的缓存引到数据根（C 盘零占用）', () => {
  const cacheDir = join(tmpdir(), 'mcphelm-cache-demo');
  withoutCacheEnv(() => {
    const env = childEnv('sk-test', cacheDir);
    assert.equal(env.NPM_CONFIG_CACHE, join(cacheDir, 'npm'));
    assert.equal(env.npm_config_cache, join(cacheDir, 'npm'));
    assert.equal(env.PIP_CACHE_DIR, join(cacheDir, 'pip'));
    assert.equal(env.UV_CACHE_DIR, join(cacheDir, 'uv'));
    assert.equal(env.XDG_CACHE_HOME, cacheDir);
    assert.equal(env.CONTROL_PLANE_API_KEY, 'sk-test');
  });
});

test('childEnv 尊重用户已设置的缓存位置，不强行覆盖', () => {
  withoutCacheEnv(() => {
    process.env.NPM_CONFIG_CACHE = 'D:/my-npm-cache';
    const env = childEnv(undefined, join(tmpdir(), 'mcphelm-cache-demo'));
    assert.equal(env.NPM_CONFIG_CACHE, 'D:/my-npm-cache');
  });
});
