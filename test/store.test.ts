import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ensureRuntimeDirs, resolvePaths } from '../src/paths.ts';
import {
  emptyConfig,
  findServer,
  findTunnel,
  healthPortFor,
  isValidName,
  isValidTunnelId,
  loadConfig,
  resolveApiKey,
  saveConfig,
  validateConfig,
} from '../src/store.ts';
import type { AppConfig } from '../src/store.ts';

const TUNNEL_ID = 'tunnel_' + 'a1b2c3d4'.repeat(4);

function sampleConfig(): AppConfig {
  return {
    version: 1,
    servers: [{ name: 'code', kind: 'stdio', command: 'npx -y demo' }],
    tunnels: [{ name: 'code', tunnelId: TUNNEL_ID, server: 'code', apiKeyEnv: 'CONTROL_PLANE_API_KEY' }],
    defaults: { healthPort: 8080 },
  };
}

test('TUNNEL_ID 校验规则', () => {
  assert.equal(isValidTunnelId(TUNNEL_ID), true);
  assert.equal(isValidTunnelId('tunnel_' + 'A'.repeat(32)), false, '大写十六进制不接受');
  assert.equal(isValidTunnelId('tunnel_' + 'a'.repeat(31)), false, '长度不足不接受');
  assert.equal(isValidTunnelId('tunnel_' + 'a'.repeat(33)), false, '长度超出不接受');
  assert.equal(isValidTunnelId('abc'), false);
});

test('名称校验规则', () => {
  assert.equal(isValidName('my-server_1.0'), true);
  assert.equal(isValidName('-bad'), false);
  assert.equal(isValidName('has space'), false);
  assert.equal(isValidName('a'.repeat(41)), false);
});

test('合法配置没有任何问题', () => {
  assert.deepEqual(validateConfig(sampleConfig()), []);
});

test('validateConfig 能抓出引用缺失、重复与格式错误', () => {
  const config = sampleConfig();
  config.tunnels.push({ name: 'code', tunnelId: 'bad-id', server: 'ghost' });
  const issues = validateConfig(config);
  assert.deepEqual(
    issues.map((issue) => issue.level).sort(),
    ['error', 'error', 'error', 'warn'],
    '重复名称 / 非法 ID / 未知服务器是错误，缺 runtime key 只是警告'
  );
  const messages = issues.map((issue) => issue.message + '|' + issue.level);
  assert.ok(messages.some((line) => line.includes('隧道名称重复')));
  assert.ok(messages.some((line) => line.includes('隧道 ID 格式不对')));
  assert.ok(messages.some((line) => line.includes('引用了不存在的服务器')));
  assert.ok(messages.some((line) => line.includes('未配置 runtime key')));
});

test('没有 runtime key 只算警告，不算错误', () => {
  const config = sampleConfig();
  const tunnel = findTunnel(config, 'code');
  assert.ok(tunnel);
  delete tunnel.apiKeyEnv;
  const issues = validateConfig(config);
  assert.deepEqual(issues.map((issue) => issue.level), ['warn']);
});

test('resolveApiKey 优先取环境变量，其次取明文配置', () => {
  const missing = resolveApiKey({ name: 'x', tunnelId: TUNNEL_ID, server: 'code', apiKeyEnv: 'MCPHELM_TEST_KEY' }, {});
  assert.equal(missing.ok, false);
  assert.match(missing.error ?? '', /MCPHELM_TEST_KEY/);

  const fromEnv = resolveApiKey(
    { name: 'x', tunnelId: TUNNEL_ID, server: 'code', apiKeyEnv: 'MCPHELM_TEST_KEY' },
    { MCPHELM_TEST_KEY: 'sk-abc' }
  );
  assert.equal(fromEnv.ok, true);
  assert.equal(fromEnv.value, 'sk-abc');
  assert.equal(fromEnv.source, 'env:MCPHELM_TEST_KEY');

  const inline = resolveApiKey({ name: 'x', tunnelId: TUNNEL_ID, server: 'code', apiKey: 'sk-inline' }, {});
  assert.equal(inline.ok, true);
  assert.equal(inline.value, 'sk-inline');
});

test('healthPortFor 回落到默认端口', () => {
  const config = sampleConfig();
  const tunnel = findTunnel(config, 'code');
  assert.ok(tunnel);
  assert.equal(healthPortFor(config, tunnel), 8080);
  tunnel.healthPort = 9000;
  assert.equal(healthPortFor(config, tunnel), 9000);
});

test('saveConfig / loadConfig 往返一致', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-store-'));
  try {
    const paths = resolvePaths({ cwd: dir, env: { MCPHELM_HOME: join(dir, 'home') } });
    assert.equal(paths.configScope, 'missing');
    assert.equal(loadConfig(paths).ok, false);

    saveConfig(paths, sampleConfig());
    const reloaded = loadConfig(paths);
    assert.equal(reloaded.ok, true);
    assert.equal(reloaded.issues.length, 0);
    assert.equal(findServer(reloaded.config, 'code')?.kind, 'stdio');
    assert.equal(findTunnel(reloaded.config, 'code')?.tunnelId, TUNNEL_ID);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('损坏的 JSON 被视为配置错误', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-store-bad-'));
  try {
    const file = join(dir, 'mcphelm.config.json');
    writeFileSync(file, '{ not json');
    const paths = resolvePaths({ cwd: dir, env: { MCPHELM_HOME: join(dir, 'home') } });
    const loaded = loadConfig(paths);
    assert.equal(loaded.ok, false);
    assert.equal(loaded.error, 'config-not-found');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('emptyConfig 是新手的起点', () => {
  const config = emptyConfig();
  assert.equal(config.version, 1);
  assert.deepEqual(config.servers, []);
  assert.deepEqual(config.tunnels, []);
});

test('resolvePaths 把临时目录与缓存目录都归在数据根下（可整体挪出 C 盘）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-paths-'));
  try {
    const home = join(dir, 'home');
    const paths = resolvePaths({ cwd: dir, env: { MCPHELM_HOME: home } });
    assert.equal(paths.home, home);
    assert.equal(paths.tmpDir, join(home, 'tmp'));
    assert.equal(paths.cacheDir, join(home, 'cache'));
    assert.equal(paths.desktopDir, join(home, 'desktop'));
    ensureRuntimeDirs(paths);
    assert.equal(existsSync(paths.tmpDir), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
