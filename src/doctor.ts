import { createServer } from 'node:net';
import { BRAND } from './brand.ts';
import { keyringHas, keyringSupported } from './keyring.ts';
import { logsUsage } from './logrotate.ts';
import { firstToken, resolveCommand } from './mcpcommand.ts';
import type { AppPaths } from './paths.ts';
import { describeConfigScope } from './paths.ts';
import { readState } from './runtime.ts';
import type { AppConfig, ConfigIssue, McpServerConfig, TunnelConfig } from './store.ts';
import { findServer, healthPortFor, isValidTunnelId, resolveApiKeyAsync, serverTarget } from './store.ts';
import { fetchLatestVersion, findRuntime } from './tunnelclient.ts';
import { fmtBytes, isProcessAlive } from './util.ts';

export type CheckLevel = 'pass' | 'info' | 'warn' | 'fail';

export interface DoctorCheck {
  id: string;
  title: string;
  level: CheckLevel;
  detail: string;
  hint?: string;
}

export interface DoctorOptions {
  paths: AppPaths;
  config: AppConfig;
  configIssues: ConfigIssue[];
  online?: boolean;
}

function portFree(port: number): Promise<boolean> {
  return new Promise<boolean>((resolvePort) => {
    const srv = createServer();
    srv.once('error', () => resolvePort(false));
    srv.once('listening', () => {
      srv.close(() => resolvePort(true));
    });
    srv.listen(port, '127.0.0.1');
  });
}

/** 兼容旧引用：firstToken 从 0.1.10 起住在 mcpcommand.ts（命令探测模块） */
export { firstToken };

export async function probeHttpMcp(url: string, timeoutMs = 5000): Promise<{ level: CheckLevel; detail: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'mcphelm-doctor', version: BRAND.version },
        },
      }),
      signal: ctrl.signal,
    });
    if (res.ok) return { level: 'pass', detail: 'HTTP ' + res.status + '，MCP 端点已响应 initialize' };
    return { level: 'warn', detail: 'HTTP ' + res.status + '（服务在线，但响应不符合预期）' };
  } catch (err) {
    return { level: 'fail', detail: '无法连接：' + (err instanceof Error ? err.message : String(err)) };
  } finally {
    clearTimeout(timer);
  }
}

function checkStdioServer(server: McpServerConfig): DoctorCheck {
  const probe = resolveCommand(server.command ?? '');
  const id = 'server-' + server.name;
  const title = 'MCP 服务器 ' + server.name;
  if (!probe.token) {
    return {
      id,
      title,
      level: 'fail',
      detail: 'stdio 命令为空',
      hint: '重新执行 server remove / server add 填写完整命令',
    };
  }
  if (!probe.ok) {
    return {
      id,
      title,
      level: 'fail',
      detail: probe.error ?? '找不到可执行文件 ' + probe.token,
      hint: probe.hint ?? '确认它已安装并在 PATH 中，或改用绝对路径',
    };
  }
  /* 在「常见安装目录」里找到的命令，启动隧道时会自动补进子进程 PATH（0.1.10） */
  const extra = probe.source === 'wellknown' ? '（不在 PATH，但启动时会自动补齐，无需手工设置）' : '';
  return {
    id,
    title,
    level: 'pass',
    detail: 'stdio 命令可用：' + probe.path + extra,
  };
}

async function checkTunnel(
  opts: DoctorOptions,
  tunnel: TunnelConfig
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const id = 'tunnel-' + tunnel.name;
  const server = findServer(opts.config, tunnel.server);

  checks.push({
    id: id + '-id',
    title: '隧道 ' + tunnel.name + ' 的 tunnel id',
    level: isValidTunnelId(tunnel.tunnelId) ? 'pass' : 'fail',
    detail: isValidTunnelId(tunnel.tunnelId)
      ? tunnel.tunnelId.slice(0, 11) + '***（格式正确）'
      : '格式不对：' + tunnel.tunnelId,
    hint: isValidTunnelId(tunnel.tunnelId) ? undefined : '应为 tunnel_ 加 32 位小写十六进制，例如 tunnel_0123456789abcdef0123456789abcdef',
  });

  const key = await resolveApiKeyAsync(tunnel);
  if (tunnel.apiKeyStore === 'keyring' && !key.ok && key.pendingKeyring !== true) {
    const present = await keyringHas(tunnel.name);
    checks.push({
      id: id + '-key',
      title: '隧道 ' + tunnel.name + ' 的 runtime key',
      level: present ? 'warn' : 'fail',
      detail: present
        ? '凭据管理器里有条目但读取失败'
        : key.error ?? '凭据管理器中没有该隧道的密钥',
      hint: '在面板里重新保存一次密钥，或改用环境变量方式',
    });
  } else {
    checks.push({
      id: id + '-key',
      title: '隧道 ' + tunnel.name + ' 的 runtime key',
      level: key.ok ? 'pass' : 'fail',
      detail: key.ok ? '已就绪（来源 ' + (key.source ?? '未知') + '）' : (key.error ?? '未配置'),
      hint: key.ok
        ? '密钥只在启动子进程时通过环境变量 CONTROL_PLANE_API_KEY 传入，不写日志、不进命令行'
        : '设置环境变量并在配置里写 apiKeyEnv，例如：setx ' + (tunnel.apiKeyEnv ?? 'CONTROL_PLANE_API_KEY') + ' "sk-..."',
    });
  }

  if (tunnel.apiKey) {
    checks.push({
      id: id + '-key-plain',
      title: '隧道 ' + tunnel.name + ' 的密钥存放方式',
      level: 'warn',
      detail: '密钥正以明文写在配置文件里',
      hint: keyringSupported()
        ? '建议在面板里把密钥来源改为"密钥保险箱"，密钥将存入 Windows 凭据管理器'
        : '建议改用环境变量方式（apiKeyEnv），避免密钥落盘',
    });
  }

  const port = healthPortFor(opts.config, tunnel);
  if (port && port > 0) {
    const state = readState(opts.paths, tunnel.name);
    const selfUsing = state !== null && isProcessAlive(state.pid) && state.healthAddr.endsWith(':' + port);
    if (selfUsing) {
      checks.push({
        id: id + '-port',
        title: '隧道 ' + tunnel.name + ' 的健康端点端口 ' + port,
        level: 'info',
        detail: '端口正在被本隧道使用（PID ' + String(state.pid) + '）',
      });
    } else {
      const free = await portFree(port);
      checks.push({
        id: id + '-port',
        title: '隧道 ' + tunnel.name + ' 的健康端点端口 ' + port,
        level: free ? 'pass' : 'warn',
        detail: free ? '端口空闲' : '端口已被占用',
        hint: free ? undefined : '启动时会自动改用空闲端口，或修改配置中的 healthPort',
      });
    }
  }

  if (server) {
    if (server.kind === 'http' && server.url) {
      const probe = await probeHttpMcp(server.url);
      checks.push({
        id: id + '-mcp',
        title: '隧道 ' + tunnel.name + ' 绑定的 MCP 端点',
        level: probe.level,
        detail: server.url + ' — ' + probe.detail,
        hint: probe.level === 'pass' ? undefined : '确认 MCP 服务已启动；HTTP 型 MCP 需要监听该地址并支持 initialize',
      });
    } else {
      checks.push({ ...checkStdioServer(server), id: id + '-mcp', title: '隧道 ' + tunnel.name + ' 绑定的命令' });
    }
  }

  return checks;
}

export async function runDoctor(opts: DoctorOptions): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const parts = process.versions.node.split('.');
  const major = Number(parts[0] ?? '0');
  const minor = Number(parts[1] ?? '0');
  const nodeOk = major > 20 || (major === 20 && minor >= 11);
  checks.push({
    id: 'node',
    title: 'Node.js 版本',
    level: nodeOk ? 'pass' : 'fail',
    detail: '当前 ' + process.version + '（要求 >= 20.11）',
    hint: nodeOk ? undefined : '升级 Node.js 到 20.11 或更高版本后再运行',
  });

  checks.push({
    id: 'config',
    title: '配置文件',
    level: opts.paths.configScope === 'missing' ? 'fail' : 'pass',
    detail: opts.paths.configFile + '（' + describeConfigScope(opts.paths.configScope) + '）',
    hint: opts.paths.configScope === 'missing' ? '先执行：' + BRAND.bin + ' init' : undefined,
  });

  if (opts.configIssues.length === 0) {
    checks.push({
      id: 'config-valid',
      title: '配置内容',
      level: 'pass',
      detail: opts.config.servers.length + ' 个服务器 / ' + opts.config.tunnels.length + ' 条隧道，未发现问题',
    });
  } else {
    for (const issue of opts.configIssues) {
      checks.push({
        id: 'config-' + issue.level + '-' + checks.length,
        title: '配置检查',
        level: issue.level === 'error' ? 'fail' : 'warn',
        detail: issue.message,
      });
    }
  }

  const runtime = findRuntime(opts.paths);
  checks.push({
    id: 'runtime',
    title: 'tunnel-client 运行时',
    level: runtime.path ? 'pass' : 'fail',
    detail: runtime.path
      ? runtime.path + (runtime.version ? '（版本 ' + runtime.version + '）' : '（版本未知）')
      : '未找到官方 tunnel-client 运行时',
    hint: runtime.path ? undefined : '执行：' + BRAND.bin + ' runtime fetch（自动下载并校验官方压缩包）',
  });

  if (opts.online) {
    try {
      const latest = await fetchLatestVersion();
      const behind = runtime.version !== null && latest.replace(/^v/, '') !== runtime.version;
      checks.push({
        id: 'runtime-latest',
        title: '官方最新版本',
        level: behind ? 'warn' : 'pass',
        detail: 'GitHub 最新 ' + latest + (runtime.version ? '，本地 ' + runtime.version : ''),
        hint: behind ? '可执行：' + BRAND.bin + ' runtime fetch --force 升级到最新版' : undefined,
      });
    } catch (err) {
      checks.push({
        id: 'runtime-latest',
        title: '官方最新版本',
        level: 'info',
        detail: '查询失败：' + (err instanceof Error ? err.message : String(err)),
        hint: '检查网络或代理设置后重试',
      });
    }
  }

  if (opts.config.tunnels.length === 0) {
    checks.push({
      id: 'tunnels',
      title: '隧道',
      level: 'info',
      detail: '尚未配置任何隧道',
      hint: '执行：' + BRAND.bin + ' tunnel add <名称> --tunnel-id tunnel_xxx --server <服务器名>',
    });
  }
  for (const tunnel of opts.config.tunnels) {
    const tunnelChecks = await checkTunnel(opts, tunnel);
    checks.push(...tunnelChecks);
  }

  const usage = logsUsage(opts.paths.logsDir);
  checks.push({
    id: 'logs',
    title: '日志占用',
    level: usage.totalBytes > 200 * 1024 * 1024 ? 'warn' : 'pass',
    detail:
      usage.totalBytes === 0
        ? '还没有产生日志'
        : '共 ' + fmtBytes(usage.totalBytes) +
          (usage.largestFile ? '，最大单文件 ' + usage.largestFile + '（' + fmtBytes(usage.largestBytes) + '）' : '') +
          '；单文件超过 5MB 会自动轮转',
    hint: usage.totalBytes > 200 * 1024 * 1024 ? '可打开日志目录手动清理旧存档（.1.log 等）' : undefined,
  });

  return checks;
}

export function summarizeChecks(checks: DoctorCheck[]): { pass: number; info: number; warn: number; fail: number } {
  const summary = { pass: 0, info: 0, warn: 0, fail: 0 };
  for (const check of checks) summary[check.level] += 1;
  return summary;
}

export function serverSummaryLine(server: McpServerConfig): string {
  return server.kind === 'stdio' ? 'stdio / ' + serverTarget(server) : 'http / ' + serverTarget(server);
}
