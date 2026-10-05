import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeChecks } from '../src/doctor.ts';
import type { DoctorCheck } from '../src/doctor.ts';
import {
  LineBuffer,
  expandHome,
  fmtBytes,
  fmtDuration,
  formatTable,
  maskSecret,
  stripAnsi,
  visibleWidth,
} from '../src/util.ts';

test('中文按两个显示列宽计算，表格能对齐', () => {
  assert.equal(visibleWidth('名称'), 4);
  assert.equal(visibleWidth('demo'), 4);
  assert.equal(visibleWidth('运行中'), 6);
  const table = formatTable(['名称', '状态'], [['demo', 'running']]).split('\n');
  assert.equal(table.length, 3);
  assert.equal(table[1], '----  -------');
  const header = table[0] ?? '';
  const row = table[2] ?? '';
  const headPrefix = header.slice(0, header.indexOf('状态'));
  const rowPrefix = row.slice(0, row.indexOf('running'));
  // “名称”占 4 列，所以两行第二列都从第 6 个显示列开始；行尾宽度允许不同。
  assert.equal(visibleWidth(headPrefix), 6);
  assert.equal(visibleWidth(headPrefix), visibleWidth(rowPrefix));
  assert.equal(visibleWidth(header), 10);
  assert.equal(visibleWidth(row), 13);
});

test('颜色代码不计入宽度', () => {
  const colored = '\u001b[32mok\u001b[39m';
  assert.equal(stripAnsi(colored), 'ok');
  assert.equal(visibleWidth(colored), 2);
});

test('maskSecret 不泄露完整密钥', () => {
  assert.equal(maskSecret('sk-1234567890'), 'sk-*** (len 13)');
  assert.equal(maskSecret('abc'), '***');
  assert.equal(maskSecret(''), '(empty)');
});

test('LineBuffer 能处理跨块换行', () => {
  const buffer = new LineBuffer();
  assert.deepEqual(buffer.push('a\nb'), ['a']);
  assert.deepEqual(buffer.push('c\nd\n'), ['bc', 'd']);
  assert.deepEqual(buffer.flush(), []);
  assert.deepEqual(buffer.push('tail'), []);
  assert.deepEqual(buffer.flush(), ['tail']);
});

test('时长与体积格式化', () => {
  assert.equal(fmtDuration(5_000), '5s');
  assert.equal(fmtDuration(65_000), '1m 5s');
  assert.equal(fmtDuration(3_600_000), '1h 0m');
  assert.equal(fmtBytes(512), '512 B');
  assert.equal(fmtBytes(2048), '2.0 KB');
});

test('expandHome 展开用户目录写法', () => {
  assert.equal(expandHome('~/x').endsWith('x'), true);
  assert.equal(expandHome('/absolute/path'), '/absolute/path');
});

test('summarizeChecks 统计各等级数量', () => {
  const checks: DoctorCheck[] = [
    { id: 'a', title: 'a', level: 'pass', detail: '' },
    { id: 'b', title: 'b', level: 'warn', detail: '' },
    { id: 'c', title: 'c', level: 'fail', detail: '' },
    { id: 'd', title: 'd', level: 'info', detail: '' },
  ];
  assert.deepEqual(summarizeChecks(checks), { pass: 1, info: 1, warn: 1, fail: 1 });
});
