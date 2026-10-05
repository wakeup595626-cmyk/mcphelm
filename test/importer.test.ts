import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeServers, parsePastedConfig, translateEntry } from '../src/importer.ts';
import { emptyConfig } from '../src/store.ts';

describe('importer', () => {
  it('把 Claude 风格的 stdio 条目翻译成 MCPHelm 服务器', () => {
    const server = translateEntry('notes', {
      command: 'npx',
      args: ['-y', '@scope/server', '--root', 'D:\\docs'],
      env: { API_KEY: 'secret' },
    });
    assert.ok(server);
    assert.equal(server.kind, 'stdio');
    assert.match(server.command ?? '', /^npx -y @scope\/server --root/);
    assert.match(server.description ?? '', /API_KEY/);
  });

  it('把 url 形式的条目翻译成 HTTP 服务器并带走 headers', () => {
    const server = translateEntry('remote', {
      url: 'http://127.0.0.1:8787/mcp',
      headers: { Authorization: 'Bearer x' },
    });
    assert.ok(server);
    assert.equal(server.kind, 'http');
    assert.equal(server.url, 'http://127.0.0.1:8787/mcp');
    assert.equal(server.headers?.Authorization, 'Bearer x');
  });

  it('无法识别的条目返回 null', () => {
    assert.equal(translateEntry('bad', { nope: true }), null);
    assert.equal(translateEntry('bad2', 'string'), null);
  });

  it('parsePastedConfig 解析 mcpServers 段', () => {
    const text = JSON.stringify({
      mcpServers: {
        files: { command: 'npx', args: ['-y', 'server-filesystem'] },
      },
    });
    const parsed = parsePastedConfig(text);
    assert.equal(parsed.error, undefined);
    assert.equal(parsed.servers.length, 1);
    assert.equal(parsed.servers[0]?.name, 'files');
  });

  it('parsePastedConfig 对坏 JSON 给出中文错误', () => {
    const parsed = parsePastedConfig('{not json');
    assert.equal(parsed.servers.length, 0);
    assert.match(parsed.error ?? '', /JSON/);
  });

  it('mergeServers 处理新增、覆盖与跳过', () => {
    const config = emptyConfig();
    config.servers.push({ name: 'a', kind: 'stdio', command: 'old' });
    const incoming = [
      { name: 'a', kind: 'stdio' as const, command: 'new' },
      { name: 'b', kind: 'http' as const, url: 'http://127.0.0.1:1/mcp' },
    ];
    const skipped = mergeServers(config, incoming);
    assert.deepEqual(skipped.skipped, ['a']);
    assert.deepEqual(skipped.added, ['b']);
    // 上一轮已把 b 加进来，这一轮两个名字都是覆盖
    const replaced = mergeServers(config, incoming, { overwrite: true });
    assert.deepEqual(replaced.replaced, ['a', 'b']);
    assert.deepEqual(replaced.skipped, []);
    assert.equal(config.servers.find((s) => s.name === 'a')?.command, 'new');
  });
});
