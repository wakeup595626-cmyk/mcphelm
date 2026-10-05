import assert from 'node:assert/strict';
import test from 'node:test';
import { flagBool, flagList, flagString, parseArgs } from '../src/args.ts';

test('parseArgs 支持布尔、字符串与内联等号', () => {
  const parsed = parseArgs(['start', 'demo', '--all', '--wait', '5', '--lines=42'], {
    boolean: ['--all'],
    string: ['--wait', '--lines'],
  });
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.positionals, ['start', 'demo']);
  assert.equal(flagBool(parsed, '--all'), true);
  assert.equal(flagString(parsed, '--wait'), '5');
  assert.equal(flagString(parsed, '--lines'), '42');
});

test('parseArgs 支持别名与可重复参数', () => {
  const parsed = parseArgs(['-H', 'A: 1', '--header', 'B: 2'], {
    repeat: ['--header'],
    aliases: { '-H': '--header' },
  });
  assert.deepEqual(flagList(parsed, '--header'), ['A: 1', 'B: 2']);
});

test('parseArgs 报告未知参数与缺失取值', () => {
  assert.equal(parseArgs(['--nope'], {}).errors.length, 1);
  const missing = parseArgs(['--wait'], { string: ['--wait'] });
  assert.match(missing.errors[0] ?? '', /missing value/);
});

test('parseArgs 在 -- 之后只当作位置参数', () => {
  const parsed = parseArgs(['logs', '--', '--weird', 'name'], { boolean: ['--follow'] });
  assert.deepEqual(parsed.positionals, ['logs', '--weird', 'name']);
  assert.deepEqual(parsed.errors, []);
});

test('parseArgs 允许 --flag=false', () => {
  const parsed = parseArgs(['--all=false'], { boolean: ['--all'] });
  assert.equal(flagBool(parsed, '--all'), false);
});
