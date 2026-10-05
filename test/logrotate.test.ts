import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { logsUsage, pruneLogs, rotateLogIfNeeded } from '../src/logrotate.ts';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mcphelm-log-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('logrotate', () => {
  it('超过上限的日志会被轮转成 .1.log', () => {
    const file = join(dir, 'demo.log');
    writeFileSync(file, 'x'.repeat(2048), 'utf8');
    const result = rotateLogIfNeeded(file, 1024);
    assert.equal(result.rotated, true);
    assert.ok(readdirSync(dir).includes('demo.1.log'));
  });

  it('未超限时保持不动', () => {
    const file = join(dir, 'demo.log');
    writeFileSync(file, 'short', 'utf8');
    const result = rotateLogIfNeeded(file, 1024);
    assert.equal(result.rotated, false);
  });

  it('pruneLogs 只保留指定份数的存档', () => {
    for (const n of [1, 2, 3, 4, 5]) writeFileSync(join(dir, 'demo.' + n + '.log'), 'x', 'utf8');
    writeFileSync(join(dir, 'demo.log'), 'x', 'utf8');
    const removed = pruneLogs(dir, 2);
    assert.equal(removed, 3);
    const left = readdirSync(dir).sort();
    assert.deepEqual(left, ['demo.4.log', 'demo.5.log', 'demo.log']);
  });

  it('logsUsage 统计总占用与最大文件', () => {
    writeFileSync(join(dir, 'a.log'), 'x'.repeat(100), 'utf8');
    writeFileSync(join(dir, 'b.log'), 'x'.repeat(300), 'utf8');
    const usage = logsUsage(dir);
    assert.equal(usage.totalBytes, 400);
    assert.equal(usage.largestFile, 'b.log');
    assert.equal(usage.largestBytes, 300);
  });
});
