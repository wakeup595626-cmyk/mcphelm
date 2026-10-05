import assert from 'node:assert/strict';
import { mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SUPERVISOR = fileURLToPath(new URL('../src/supervisor.ts', import.meta.url));

let dir = '';
let children: import('node:child_process').ChildProcess[] = [];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mcphelm-sup-'));
  children = [];
});

afterEach(async () => {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // 已退出
    }
  }
  await new Promise((done) => setTimeout(done, 300));
  rmSync(dir, { recursive: true, force: true });
});

function runSupervisor(runtime: string, args: string[], env: NodeJS.ProcessEnv) {
  const logFile = join(dir, 'out.log');
  const fd = openSync(logFile, 'a');
  const child = spawn(process.execPath, ['--experimental-strip-types', SUPERVISOR, runtime, '--', ...args], {
    stdio: ['ignore', fd, fd],
    env,
    windowsHide: true,
  });
  children.push(child);
  return { child, logFile };
}

describe('supervisor', () => {
  it('参数不全时立刻退出并写明原因', async () => {
    const { child, logFile } = runSupervisor('', [], { ...process.env, MCPHELM_SUPERVISOR_NAME: 't1' });
    const code = await new Promise<number | null>((done) => child.once('exit', (c) => done(c)));
    assert.notEqual(code, 0);
    const text = readFileSync(logFile, 'utf8');
    assert.match(text, /参数不完整/);
  });

  it('快速崩溃达到上限后停止重启并记录退出码', async () => {
    const crash = join(dir, 'crash.js');
    writeFileSync(crash, 'process.exit(42);\n', 'utf8');
    const { child, logFile } = runSupervisor(process.execPath, [crash], {
      ...process.env,
      MCPHELM_SUPERVISOR_NAME: 'crashy',
      MCPHELM_SUPERVISOR_STOP: join(dir, 'crashy.stop'),
    });
    const code = await new Promise<number | null>((done) => child.once('exit', (c) => done(c)), );
    assert.equal(code, 1);
    const text = readFileSync(logFile, 'utf8');
    assert.match(text, /退出码 42/);
    assert.match(text, /连续崩溃 5 次/);
  }, 30000);

  it('看到停止标记后带子进程退出', async () => {
    const stay = join(dir, 'stay.js');
    writeFileSync(stay, 'setInterval(() => {}, 1000);\n', 'utf8');
    const stopFile = join(dir, 'stay.stop');
    const { child, logFile } = runSupervisor(process.execPath, [stay], {
      ...process.env,
      MCPHELM_SUPERVISOR_NAME: 'stay',
      MCPHELM_SUPERVISOR_STOP: stopFile,
    });
    await new Promise((done) => setTimeout(done, 800));
    writeFileSync(stopFile, 'stop\n', 'utf8');
    const code = await new Promise<number | null>((done) => child.once('exit', (c) => done(c)));
    assert.equal(code, 0);
    const text = readFileSync(logFile, 'utf8');
    assert.match(text, /检测到停止标记/);
  }, 15000);
});
