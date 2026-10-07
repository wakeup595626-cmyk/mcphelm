#!/usr/bin/env node
/**
 * 隧道守护进程（supervisor）。
 *
 * 由 startTunnel 以独立进程方式拉起，自己不直接连 ChatGPT，
 * 只负责一件事：看住真正的 tunnel-client 子进程——
 *   - 子进程意外退出时按指数退避自动重启，并把退出码、信号写进日志；
 *   - 短时间内连续崩溃则判定"起不来"，停止重试并在日志里给出排查指引；
 *   - 收到 SIGTERM 或 run 目录里出现 .stop 标记时，带着整棵子进程树一起退出。
 *
 * 用法（仅内部调用，不面向用户）：
 *   node supervisor.js <runtimePath> -- <args...>
 * 环境变量：
 *   MCPHELM_SUPERVISOR_NAME   隧道名（写日志用）
 *   MCPHELM_SUPERVISOR_STOP   .stop 标记文件的完整路径
 */
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const WATCH_MS = 800;
const MAX_RAPID_CRASHES = 5;
const RAPID_WINDOW_MS = 120_000;
const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 60_000;

function log(line: string): void {
  process.stdout.write('[' + new Date().toISOString() + '][supervisor] ' + line + '\n');
}

/**
 * 把「为什么退出」写成一份摘要文件（0.1.10 新增）。
 * 面板读到它就能给出人话原因，而不是让用户对着「状态残留」发愣。
 */
function writeErrorFile(
  file: string,
  info: { kind: string; message: string; hint: string | null; detail?: string }
): void {
  if (!file) return;
  try {
    writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...info }, null, 2) + '\n', 'utf8');
  } catch {
    // 摘要写不进去不影响守护进程本身
  }
}

function parseArgv(argv: string[]): { runtime: string; args: string[] } | null {
  const sep = argv.indexOf('--');
  if (sep < 1) return null;
  const runtime = argv[0];
  const args = argv.slice(sep + 1);
  if (!runtime) return null;
  return { runtime, args };
}

function backoffDelay(attempt: number): number {
  const exp = BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const capped = Math.min(exp, MAX_DELAY_MS);
  return Math.round(capped * (0.8 + Math.random() * 0.4));
}

async function main(): Promise<void> {
  const parsed = parseArgv(process.argv.slice(2));
  const name = process.env.MCPHELM_SUPERVISOR_NAME ?? 'tunnel';
  const stopFile = process.env.MCPHELM_SUPERVISOR_STOP ?? '';
  const errorFile = process.env.MCPHELM_SUPERVISOR_ERROR ?? '';
  if (!parsed) {
    log('参数不完整（需要 <runtime> -- <args...>），守护进程退出');
    process.exit(2);
  }

  let stopping = false;
  let child: ChildProcess | null = null;
  let attempt = 0;
  const crashTimes: number[] = [];

  const stopWatcher = setInterval(() => {
    if (stopFile && existsSync(stopFile)) {
      log('检测到停止标记，开始退出（隧道 ' + name + '）');
      void shutdown(0);
    }
  }, WATCH_MS);
  stopWatcher.unref();

  process.on('SIGTERM', () => {
    log('收到终止信号，开始退出');
    void shutdown(0);
  });
  process.on('SIGINT', () => {
    void shutdown(0);
  });

  async function killChild(): Promise<void> {
    const target = child;
    if (!target || target.exitCode !== null || target.signalCode !== null) return;
    const pid = target.pid;
    if (process.platform === 'win32' && pid) {
      await new Promise<void>((done) => {
        const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
        });
        killer.on('exit', () => done());
        killer.on('error', () => done());
      });
      return;
    }
    try {
      target.kill('SIGTERM');
    } catch {
      return;
    }
    await new Promise<void>((done) => setTimeout(done, 2500));
    try {
      target.kill('SIGKILL');
    } catch {
      // 已经不在了
    }
  }

  async function shutdown(code: number): Promise<void> {
    if (stopping) return;
    stopping = true;
    clearInterval(stopWatcher);
    await killChild();
    log('守护进程退出（隧道 ' + name + '）');
    process.exit(code);
  }

  log('守护进程已接管隧道 ' + name + '（PID ' + String(process.pid) + '）');

  while (!stopping) {
    attempt += 1;
    const startedAt = Date.now();
    child = spawn(parsed.runtime, parsed.args, {
      stdio: ['ignore', process.stdout, process.stderr],
      env: process.env,
      windowsHide: true,
    });
    const childPid = child.pid;
    log('启动 tunnel-client（第 ' + attempt + ' 次，PID ' + String(childPid ?? '?') + '）');

    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((wait) => {
      child?.once('error', (err) => {
        log('无法拉起 tunnel-client：' + err.message);
        writeErrorFile(errorFile, {
          kind: 'spawn',
          message: '无法拉起 tunnel-client：' + err.message,
          hint: '先确认软件安装目录没有被杀毒软件隔离或删除，然后在面板里点「启动」重试。',
        });
        wait({ code: 127, signal: null });
      });
      child?.once('exit', (code, signal) => wait({ code, signal }));
    });
    child = null;
    if (stopping) break;

    const ranMs = Date.now() - startedAt;
    const how = exit.signal ? '被信号 ' + exit.signal + ' 终止' : '退出码 ' + String(exit.code ?? '?');
    log('tunnel-client 已退出（' + how + '，本次存活 ' + (ranMs / 1000).toFixed(1) + ' 秒）');

    if (exit.code === 0 && ranMs > 30_000) {
      log('tunnel-client 正常结束，守护进程不再重启');
      process.exit(0);
    }

    const now = Date.now();
    crashTimes.push(now);
    while (crashTimes.length > 0 && now - (crashTimes[0] ?? now) > RAPID_WINDOW_MS) crashTimes.shift();
    if (crashTimes.length >= MAX_RAPID_CRASHES) {
      writeErrorFile(errorFile, {
        kind: 'giveup',
        message:
          '隧道在 ' + Math.round(RAPID_WINDOW_MS / 1000) + ' 秒内连续崩溃 ' + MAX_RAPID_CRASHES + ' 次，已停止自动重启',
        hint: '日志最后几行通常就是原因（本地命令找不到 / 密钥无效 / 网络不通）；修好后回到面板点「启动」重试。',
        detail: how + '，最近一次存活 ' + (ranMs / 1000).toFixed(1) + ' 秒',
      });
      log(
        '隧道 ' + name + ' 在 ' + Math.round(RAPID_WINDOW_MS / 1000) + ' 秒内连续崩溃 ' + MAX_RAPID_CRASHES +
          ' 次，停止自动重启。请检查：runtime key 是否有效、隧道 ID 是否正确、本地 MCP 命令能否手动跑通；修复后在面板或命令行重新启动。'
      );
      process.exit(1);
    }

    const delay = backoffDelay(crashTimes.length);
    log((delay / 1000).toFixed(1) + ' 秒后自动重启（' + crashTimes.length + '/' + MAX_RAPID_CRASHES + ' 次连续崩溃）…');
    await new Promise<void>((done) => setTimeout(done, delay));
  }
}

void main();
