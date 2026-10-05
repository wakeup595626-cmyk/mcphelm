/**
 * "先测试再保存"：保存服务器配置前，先验证它真的能跑。
 *
 *  - stdio：短暂拉起命令，发出一个最小的 MCP initialize，等服务端回包或至少确认进程活着；
 *  - http：向端点发 initialize 探活（复用 doctor 里的实现思路，但面向表单即时反馈）。
 *
 * 所有测试都有超时保护，绝不会卡住面板。
 */
import { spawn } from 'node:child_process';
import { BRAND } from './brand.ts';

export interface TestResult {
  ok: boolean;
  level: 'pass' | 'warn' | 'fail';
  summary: string;
  detail?: string;
  elapsedMs: number;
}

const STDIO_TIMEOUT_MS = 12_000;
const HTTP_TIMEOUT_MS = 8_000;

const INITIALIZE_FRAME = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'mcphelm-tester', version: BRAND.version },
  },
});

/** 测试一条 stdio 启动命令 */
export async function testStdioCommand(command: string): Promise<TestResult> {
  const started = Date.now();
  const trimmed = command.trim();
  if (!trimmed) {
    return { ok: false, level: 'fail', summary: '命令为空', elapsedMs: 0 };
  }
  return new Promise<TestResult>((done) => {
    let finished = false;
    let sawOutput = '';
    const finish = (result: Omit<TestResult, 'elapsedMs'>): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        child.kill();
      } catch {
        // 已经退出
      }
      done({ ...result, elapsedMs: Date.now() - started });
    };

    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const shellArgs = process.platform === 'win32' ? ['/d', '/s', '/c', trimmed] : ['-c', trimmed];
    const child = spawn(shell, shellArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, MCPHELM_TEST_MODE: '1' },
    });

    const timer = setTimeout(() => {
      finish({
        ok: false,
        level: 'fail',
        summary: '12 秒内没有收到 MCP 响应',
        detail: sawOutput ? '进程输出过内容但不是合法的 initialize 应答：' + sawOutput.slice(0, 200) : '进程没有任何输出，可能命令本身起不来',
      });
    }, STDIO_TIMEOUT_MS);

    child.on('error', (err) => {
      finish({ ok: false, level: 'fail', summary: '命令无法启动：' + err.message });
    });
    child.on('exit', (code, signal) => {
      if (finished) return;
      finish({
        ok: false,
        level: 'fail',
        summary: '进程提前退出（' + (signal ? '信号 ' + signal : '退出码 ' + String(code ?? '?')) + '）',
        detail: sawOutput ? '退出前输出：' + sawOutput.slice(0, 200) : undefined,
      });
    });

    const onData = (chunk: unknown): void => {
      const text = String(chunk);
      sawOutput += text;
      if (sawOutput.length > 4096) sawOutput = sawOutput.slice(-4096);
      // 收到包含 "result" 或 "error" 的 JSON-RPC 应答就算握手成功
      if (/"jsonrpc"\s*:\s*"2\.0"/.test(sawOutput) && /"(result|error)"\s*:/.test(sawOutput)) {
        finish({ ok: true, level: 'pass', summary: 'MCP 握手成功，服务器可用' });
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);

    child.stdin?.on('error', () => {
      // 服务端立刻关了 stdin，交给 exit 事件汇报
    });
    try {
      child.stdin?.write(INITIALIZE_FRAME + '\n');
    } catch {
      // 写入失败同样交给 exit 事件
    }
  });
}

/** 测试一个 HTTP MCP 端点 */
export async function testHttpEndpoint(url: string, headers?: Record<string, string>): Promise<TestResult> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...(headers ?? {}),
      },
      body: INITIALIZE_FRAME,
      signal: ctrl.signal,
    });
    const elapsedMs = Date.now() - started;
    if (res.ok) {
      return { ok: true, level: 'pass', summary: 'HTTP ' + res.status + '，端点已响应 MCP initialize', elapsedMs };
    }
    return {
      ok: false,
      level: 'warn',
      summary: 'HTTP ' + res.status + '（地址可达，但响应不符合 MCP 预期）',
      detail: '请确认这是 MCP 端点而不是普通网页，且支持 POST initialize',
      elapsedMs,
    };
  } catch (err) {
    return {
      ok: false,
      level: 'fail',
      summary: '连不上：' + (err instanceof Error ? err.message : String(err)),
      detail: '请确认服务已经启动、地址与端口正确',
      elapsedMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}
