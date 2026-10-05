#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { flagBool, flagList, flagString, parseArgs } from './args.ts';
import { BRAND, packageVersion } from './brand.ts';
import { runDoctor, summarizeChecks } from './doctor.ts';
import type { CheckLevel } from './doctor.ts';
import { describeConfigScope, ensureRuntimeDirs, envKey, logFileFor, resolvePaths } from './paths.ts';
import type { AppPaths } from './paths.ts';
import { panelBanner, panelStopHint, startPanel } from './panel/server.ts';
import {
  followLog,
  listStatuses,
  probeHealth,
  readLogTail,
  readState,
  startTunnel,
  stopTunnel,
} from './runtime.ts';
import type { TunnelStatus } from './runtime.ts';
import {
  describeKey,
  emptyConfig,
  findServer,
  findTunnel,
  healthPortFor,
  isValidName,
  isValidTunnelId,
  loadConfig,
  saveConfig,
  serverTarget,
  validateConfig,
} from './store.ts';
import type { AppConfig, ConfigIssue, McpServerConfig, TunnelConfig } from './store.ts';
import { archTag, findRuntime, installRuntime, platformTag, runtimeBinaryName } from './tunnelclient.ts';
import {
  bold,
  cyan,
  dim,
  expandHome,
  fileExists,
  fmtDuration,
  formatTable,
  getFreePort,
  green,
  isProcessAlive,
  maskSecret,
  openBrowser,
  readJsonSafe,
  red,
  setColorEnabled,
  sleep,
  yellow,
} from './util.ts';

const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const DEFAULT_PANEL_PORT = 7331;
const DEFAULT_WAIT_SECONDS = 6;

interface GlobalOptions {
  configFlag?: string;
  json: boolean;
  rest: string[];
}

interface Ctx {
  paths: AppPaths;
  config: AppConfig;
  issues: ConfigIssue[];
}

/* ------------------------------------------------------------------ 通用输出 */

function out(line = ''): void {
  process.stdout.write(line + '\n');
}

function errOut(line = ''): void {
  process.stderr.write(line + '\n');
}

function fail(message: string): number {
  const lines = message.split('\n');
  errOut(red('[错误] ') + (lines[0] ?? ''));
  for (const line of lines.slice(1)) errOut('       ' + line);
  return EXIT_ERROR;
}

function usageError(message: string): number {
  errOut(red('[用法错误] ') + message);
  errOut(dim('执行 ' + BRAND.bin + ' --help 查看完整用法'));
  return EXIT_USAGE;
}

function levelLabel(level: CheckLevel): string {
  switch (level) {
    case 'pass':
      return green('通过');
    case 'info':
      return cyan('提示');
    case 'warn':
      return yellow('警告');
    default:
      return red('失败');
  }
}

function stateLabel(state: TunnelStatus['state']): string {
  switch (state) {
    case 'running':
      return green('运行中');
    case 'stopped':
      return dim('未启动');
    case 'stale':
      return yellow('残留状态');
    default:
      return red('异常');
  }
}

function truncate(text: string, max = 46): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function jsonOut(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

/* ------------------------------------------------------------------ 参数预处理 */

function extractGlobals(argv: string[]): GlobalOptions {
  const rest: string[] = [];
  let configFlag: string | undefined;
  let json = false;
  let i = 0;
  while (i < argv.length) {
    const tok = argv[i] as string;
    if (tok === '--') {
      rest.push(...argv.slice(i));
      break;
    }
    if (tok === '--json' || tok === '--json=true') {
      json = true;
      i++;
      continue;
    }
    if (tok === '--no-color' || tok === '--no-colour') {
      setColorEnabled(false);
      i++;
      continue;
    }
    if (tok === '--config') {
      const next = argv[i + 1];
      if (next !== undefined) {
        configFlag = next;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (tok.startsWith('--config=')) {
      configFlag = tok.slice('--config='.length);
      i++;
      continue;
    }
    rest.push(tok);
    i++;
  }
  return { configFlag, json, rest };
}

function buildCtx(g: GlobalOptions): Ctx {
  const paths = resolvePaths({ configFlag: g.configFlag });
  const loaded = loadConfig(paths);
  return { paths, config: loaded.config, issues: loaded.issues };
}

function missingConfigError(paths: AppPaths): string | null {
  if (!fileExists(paths.configFile)) {
    return [
      '找不到配置文件：' + paths.configFile,
      '先执行：' + BRAND.bin + ' init（在当前目录创建 ' + BRAND.configFileName + '）',
      '或用 ' + BRAND.bin + ' --config <路径> <命令> 指定已有的配置文件。',
    ].join('\n');
  }
  if (readJsonSafe<unknown>(paths.configFile) === null) {
    return '配置文件不是合法 JSON：' + paths.configFile;
  }
  return null;
}

function configErrorList(issues: ConfigIssue[]): string[] {
  return issues.filter((issue) => issue.level === 'error').map((issue) => issue.message);
}

function saveAndReport(ctx: Ctx, successMessage: string): number {
  const issues = validateConfig(ctx.config);
  const errors = configErrorList(issues);
  if (errors.length > 0) {
    return fail('配置未保存，存在以下问题：\n- ' + errors.join('\n- '));
  }
  saveConfig(ctx.paths, ctx.config);
  out(green('✔ ') + successMessage);
  out(dim('  配置文件：' + ctx.paths.configFile + '（' + countText(ctx.config) + '）'));
  const warns = issues.filter((issue) => issue.level === 'warn');
  for (const warn of warns) out(yellow('  ! ') + warn.message);
  return EXIT_OK;
}

function parseHeader(raw: string): { key: string; value: string } | null {
  const idx = raw.indexOf(':');
  if (idx <= 0) return null;
  const key = raw.slice(0, idx).trim();
  const value = raw.slice(idx + 1).trim();
  if (!key) return null;
  return { key, value };
}

function countText(config: AppConfig): string {
  return config.servers.length + ' 个 MCP 服务器 / ' + config.tunnels.length + ' 条隧道';
}

function selectTunnels(
  config: AppConfig,
  names: string[],
  all: boolean
): { tunnels: TunnelConfig[]; error?: string } {
  if (all) {
    if (config.tunnels.length === 0) return { tunnels: [], error: '配置里还没有任何隧道' };
    return { tunnels: config.tunnels };
  }
  if (names.length === 0) {
    return { tunnels: [], error: '请指定隧道名称，或加 --all 表示全部隧道' };
  }
  const picked: TunnelConfig[] = [];
  for (const name of names) {
    const tunnel = findTunnel(config, name);
    if (!tunnel) return { tunnels: [], error: '未找到隧道：' + name };
    picked.push(tunnel);
  }
  return { tunnels: picked };
}

function maskedConfig(config: AppConfig): unknown {
  return {
    ...config,
    tunnels: config.tunnels.map((tunnel) => ({
      ...tunnel,
      apiKey: tunnel.apiKey ? maskSecret(tunnel.apiKey) : undefined,
    })),
  };
}

async function waitUntilReady(healthAddr: string, seconds: number): Promise<boolean> {
  if (seconds <= 0) return false;
  const deadline = Date.now() + seconds * 1000;
  for (;;) {
    const probe = await probeHealth(healthAddr, 1500);
    if (probe.readyz) return true;
    if (Date.now() >= deadline) return false;
    await sleep(1000);
  }
}

function leftoverRunNames(paths: AppPaths, config: AppConfig): string[] {
  try {
    return readdirSync(paths.runDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -'.json'.length))
      .filter((name) => findTunnel(config, name) === undefined);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ 帮助文本 */

function usageText(): string {
  return [
    bold(BRAND.name) + '  v' + packageVersion(import.meta.url),
    dim('把本地 MCP 服务器通过 OpenAI 官方 tunnel-client 安全接进 ChatGPT / Codex。'),
    dim('自研实现、零运行时依赖、不需要任何授权码；运行时直接使用官方开源二进制。'),
    '',
    bold('用法：') + ' ' + BRAND.bin + ' <命令> [参数]',
    '',
    bold('快速开始'),
    '  ' + cyan(BRAND.bin + ' init') + '                                    在当前目录创建 ' + BRAND.configFileName,
    '  ' + cyan(BRAND.bin + ' runtime fetch') + '                           下载并校验官方 tunnel-client 运行时',
    '  ' + cyan(BRAND.bin + ' server add code --command "<启动命令>"') + '     注册一个本地 MCP 服务器',
    '  ' + cyan(BRAND.bin + ' tunnel add code --tunnel-id tunnel_xxx --server code'),
    '  ' + cyan(BRAND.bin + ' doctor') + '                                  环境体检',
    '  ' + cyan(BRAND.bin + ' start code') + '                              启动隧道',
    '  ' + cyan(BRAND.bin + ' panel') + '                                   打开本地面板',
    '',
    bold('命令总览'),
    '  ' + cyan('init') + '      创建配置文件',
    '  ' + cyan('server') + '    管理 MCP 服务器（add / list / remove）',
    '  ' + cyan('tunnel') + '    管理隧道（add / list / remove）',
    '  ' + cyan('start') + '     启动隧道（可指定多个名称，或 --all / --dry-run）',
    '  ' + cyan('stop') + '      停止隧道（可指定多个名称，或 --all）',
    '  ' + cyan('status') + '    查看运行状态（--health 探测健康端点）',
    '  ' + cyan('logs') + '      查看隧道日志（--follow 实时跟踪）',
    '  ' + cyan('doctor') + '    环境体检（--online 顺带查询官方最新版）',
    '  ' + cyan('panel') + '     启动本地面板（--port / --no-open）',
    '  ' + cyan('runtime') + '   管理官方运行时（path / fetch / import）',
    '  ' + cyan('config') + '    配置文件信息（path / show / validate）',
    '',
    bold('全局参数'),
    '  --config <文件>   指定配置文件路径',
    '  --json            以 JSON 输出（便于脚本调用）',
    '  --no-color        关闭彩色输出',
    '  -h, --help        查看帮助',
    '  -v, --version     查看版本',
    '',
    dim('官方文档：' + BRAND.docs.secureTunnelGuide),
  ].join('\n');
}

function commandHelp(topic: string): string {
  switch (topic) {
    case 'init':
      return [
        bold(BRAND.bin + ' init') + ' — 创建配置文件',
        '',
        '用法：' + BRAND.bin + ' init [--path <文件>] [--health-port <端口>] [--force]',
        '',
        '  --path <文件>        指定配置文件名或路径（默认 ./' + BRAND.configFileName + '）',
        '  --health-port <端口> 写入默认健康端点端口（默认 8080）',
        '  --force              覆盖已存在的配置文件',
      ].join('\n');
    case 'server':
      return [
        bold(BRAND.bin + ' server') + ' — 管理本地 MCP 服务器',
        '',
        '  ' + BRAND.bin + ' server add <名称> --command "<启动命令>" [--description "<说明>"]',
        '  ' + BRAND.bin + ' server add <名称> --url <MCP 端点> [--header "Key: Value"]... [--description "<说明>"]',
        '  ' + BRAND.bin + ' server list [--json]',
        '  ' + BRAND.bin + ' server remove <名称> [--force]',
        '',
        'stdio 用 --command，HTTP 用 --url，二者只能选一个。',
        'HTTP 型服务器可用 --header 重复添加请求头，会被官方运行时以 --mcp.extra-headers 转发。',
      ].join('\n');
    case 'tunnel':
      return [
        bold(BRAND.bin + ' tunnel') + ' — 管理安全隧道',
        '',
        '  ' + BRAND.bin + ' tunnel add <名称> --tunnel-id tunnel_xxx --server <服务器名> [选项]',
        '  ' + BRAND.bin + ' tunnel list [--json]',
        '  ' + BRAND.bin + ' tunnel remove <名称> [--force]',
        '',
        '选项：',
        '  --api-key-env <环境变量>  从环境变量读取 runtime key（推荐，默认 CONTROL_PLANE_API_KEY）',
        '  --api-key <key>           直接把 key 写进配置（不推荐，仅本地临时使用）',
        '  --health-port <端口>      本机健康端点端口（默认取配置里的 defaults.healthPort）',
        '  --arg <参数>              透传给官方 run 的高级参数，可重复',
        '',
        '隧道 ID 在 OpenAI 平台创建：' + BRAND.docs.platformTunnels,
      ].join('\n');
    case 'start':
      return [
        bold(BRAND.bin + ' start') + ' — 启动隧道',
        '',
        '用法：' + BRAND.bin + ' start <名称...> | --all [--dry-run] [--wait <秒>]',
        '',
        '  --all            启动配置里的全部隧道',
        '  --dry-run        只打印将要执行的命令，不真正启动',
        '  --wait <秒>      启动后等待健康端点就绪的秒数（默认 ' + String(DEFAULT_WAIT_SECONDS) + '，0 表示不等）',
      ].join('\n');
    case 'stop':
      return [
        bold(BRAND.bin + ' stop') + ' — 停止隧道',
        '',
        '用法：' + BRAND.bin + ' stop <名称...> | --all',
        '',
        '会自动结束该隧道的进程树，并清理运行状态文件。',
      ].join('\n');
    case 'status':
      return [
        bold(BRAND.bin + ' status') + ' — 查看隧道状态',
        '',
        '用法：' + BRAND.bin + ' status [名称...] [--health] [--json]',
        '',
        '  --health   额外探测每条运行中隧道的 /healthz 与 /readyz',
      ].join('\n');
    case 'logs':
      return [
        bold(BRAND.bin + ' logs') + ' — 查看隧道日志',
        '',
        '用法：' + BRAND.bin + ' logs <名称> [--lines <行数>] [--follow]',
        '',
        '  --lines <行数>   显示最后 N 行（默认 60）',
        '  --follow         持续跟踪新日志，Ctrl+C 退出',
      ].join('\n');
    case 'doctor':
      return [
        bold(BRAND.bin + ' doctor') + ' — 环境体检',
        '',
        '用法：' + BRAND.bin + ' doctor [--online] [--json]',
        '',
        '检查 Node 版本、配置文件、官方运行时、隧道 ID、runtime key、端口占用与 MCP 服务可达性。',
        '  --online   额外查询 GitHub 上官方 runtime 的最新版本',
      ].join('\n');
    case 'panel':
      return [
        bold(BRAND.bin + ' panel') + ' — 启动本地面板',
        '',
        '用法：' + BRAND.bin + ' panel [--port <端口>] [--host <地址>] [--no-open]',
        '',
        '  --port <端口>   指定端口（默认 ' + String(DEFAULT_PANEL_PORT) + '，被占用时自动换空闲端口）',
        '  --host <地址>   监听地址（默认 127.0.0.1，仅本机可访问）',
        '  --no-open       不自动打开浏览器',
      ].join('\n');
    case 'runtime':
      return [
        bold(BRAND.bin + ' runtime') + ' — 管理官方 tunnel-client 运行时',
        '',
        '  ' + BRAND.bin + ' runtime path                    显示当前使用的运行时与来源',
        '  ' + BRAND.bin + ' runtime fetch [--version vX.Y.Z] [--force] [--skip-verify]',
        '  ' + BRAND.bin + ' runtime import <压缩包.zip> [--version vX.Y.Z] [--skip-verify]',
        '',
        '下载的压缩包会用官方 SHA256SUMS.txt 校验；校验不通过会直接失败。',
      ].join('\n');
    case 'config':
      return [
        bold(BRAND.bin + ' config') + ' — 配置文件信息',
        '',
        '  ' + BRAND.bin + ' config path       显示实际使用的配置文件路径与来源',
        '  ' + BRAND.bin + ' config show       打印配置内容（apiKey 自动打码）',
        '  ' + BRAND.bin + ' config validate   校验配置并列出问题',
      ].join('\n');
    default:
      return usageText() + '\n\n' + dim('没有这个命令的帮助：' + topic);
  }
}

/* ------------------------------------------------------------------ init */

async function cmdInit(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ['--force'],
    string: ['--path', '--health-port'],
    aliases: { '-f': '--force', '-p': '--path' },
  });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');

  const rawPath = flagString(parsed, '--path');
  const target = rawPath
    ? resolve(ctx.paths.cwd, expandHome(rawPath))
    : join(ctx.paths.cwd, BRAND.configFileName);
  const portRaw = flagString(parsed, '--health-port');
  const port = portRaw === undefined ? 8080 : Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return usageError('--health-port 需要是 1-65535 的整数');
  }
  if (fileExists(target) && !flagBool(parsed, '--force')) {
    return fail('配置文件已存在：' + target + '\n如需覆盖请加 --force');
  }

  const config = emptyConfig();
  config.defaults = { healthPort: port };
  const localPaths: AppPaths = { ...ctx.paths, configFile: target, configDir: dirname(target) };
  try {
    ensureRuntimeDirs(localPaths);
  } catch (err) {
    out(yellow('  ! ') + '无法创建运行目录 ' + localPaths.home + '：' + (err instanceof Error ? err.message : String(err)));
    out(dim('    配置仍会正常写入；可用环境变量 ' + envKey('HOME') + ' 指定其它运行目录。'));
  }
  saveConfig(localPaths, config);

  if (g.json) {
    jsonOut({ ok: true, configFile: target, healthPort: port });
    return EXIT_OK;
  }
  out(green('✔ ') + '已创建配置文件：' + target);
  out(dim('  运行目录：' + localPaths.home));
  out('');
  out(bold('接下来：'));
  out('  1. ' + cyan(BRAND.bin + ' runtime fetch') + '                 下载并校验官方 tunnel-client');
  out('  2. ' + cyan(BRAND.bin + ' server add <名称> --command "<启动命令>"'));
  out('  3. ' + cyan(BRAND.bin + ' tunnel add <名称> --tunnel-id tunnel_xxx --server <服务器名>'));
  out('  4. ' + cyan(BRAND.bin + ' doctor') + '                        体检无误后 ' + BRAND.bin + ' start --all');
  return EXIT_OK;
}

/* ------------------------------------------------------------------ server */

async function cmdServer(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const sub = args[0] ?? 'list';
  const rest = args.slice(1);
  const guard = missingConfigError(ctx.paths);

  if (sub === 'add') {
    if (guard) return fail(guard);
    const parsed = parseArgs(rest, {
      boolean: ['--force'],
      string: ['--command', '--url', '--description'],
      repeat: ['--header'],
      aliases: { '-f': '--force', '-c': '--command', '-u': '--url', '-d': '--description', '-H': '--header' },
    });
    if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
    const name = parsed.positionals[0];
    if (!name) return usageError('缺少服务器名称，例如：' + BRAND.bin + ' server add code --command "npx -y xxx"');
    if (!isValidName(name)) return usageError('名称不合法（只允许字母数字与 . _ -，最长 40 字符）：' + name);
    const command = flagString(parsed, '--command');
    const url = flagString(parsed, '--url');
    if (command && url) return usageError('--command 与 --url 只能二选一（分别是 stdio 与 HTTP 两种形态）');
    if (!command && !url) return usageError('必须提供 --command（stdio）或 --url（HTTP）之一');
    if (findServer(ctx.config, name) && !flagBool(parsed, '--force')) {
      return fail('服务器已存在：' + name + '\n如需覆盖请加 --force');
    }

    const headers: Record<string, string> = {};
    for (const raw of flagList(parsed, '--header')) {
      const header = parseHeader(raw);
      if (!header) return usageError('请求头格式应为 "Key: Value"，收到：' + raw);
      headers[header.key] = header.value;
    }
    if (Object.keys(headers).length > 0 && !url) {
      return usageError('--header 只适用于 HTTP 型服务器（配合 --url 使用）');
    }

    const server: McpServerConfig = command
      ? { name, kind: 'stdio', command }
      : { name, kind: 'http', url: url ?? '' };
    const description = flagString(parsed, '--description');
    if (description) server.description = description;
    if (Object.keys(headers).length > 0) server.headers = headers;

    ctx.config.servers = [...ctx.config.servers.filter((item) => item.name !== name), server];
    const code = saveAndReport(ctx, '已保存 MCP 服务器 ' + name + '（' + server.kind + '：' + serverTarget(server) + '）');
    if (code !== EXIT_OK) return code;
    if (g.json) jsonOut({ ok: true, server });
    return EXIT_OK;
  }

  if (sub === 'list' || sub === 'ls') {
    if (!ctx.config.servers.length) {
      out('还没有注册任何 MCP 服务器。');
      out(dim('  示例：' + BRAND.bin + ' server add code --command "npx -y @modelcontextprotocol/server-filesystem D:\\work"'));
      return EXIT_OK;
    }
    if (g.json) {
      jsonOut({ ok: true, servers: ctx.config.servers });
      return EXIT_OK;
    }
    const rows = ctx.config.servers.map((server) => [
      server.name,
      server.kind,
      truncate(serverTarget(server), 60),
      server.description ?? '',
    ]);
    out(formatTable(['名称', '类型', '启动命令 / 端点', '说明'], rows));
    return EXIT_OK;
  }

  if (sub === 'remove' || sub === 'rm') {
    if (guard) return fail(guard);
    const parsed = parseArgs(rest, { boolean: ['--force'], aliases: { '-f': '--force' } });
    const name = parsed.positionals[0];
    if (!name) return usageError('缺少服务器名称：' + BRAND.bin + ' server remove <名称>');
    if (!findServer(ctx.config, name)) return fail('没有这个服务器：' + name);
    const referencing = ctx.config.tunnels.filter((tunnel) => tunnel.server === name);
    if (referencing.length > 0 && !flagBool(parsed, '--force')) {
      return fail(
        '服务器 ' +
          name +
          ' 仍被 ' +
          referencing.map((tunnel) => tunnel.name).join('、') +
          ' 引用\n先删除这些隧道，或加 --force 一并解除绑定'
      );
    }
    ctx.config.servers = ctx.config.servers.filter((server) => server.name !== name);
    if (referencing.length > 0) {
      ctx.config.tunnels = ctx.config.tunnels.filter((tunnel) => tunnel.server !== name);
    }
    const code = saveAndReport(ctx, '已删除 MCP 服务器 ' + name + (referencing.length ? '，并移除了 ' + referencing.length + ' 条引用它的隧道' : ''));
    return code;
  }

  return usageError('未知子命令：server ' + sub + '（可用 add / list / remove）');
}

/* ------------------------------------------------------------------ tunnel */

async function cmdTunnel(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const sub = args[0] ?? 'list';
  const rest = args.slice(1);
  const guard = missingConfigError(ctx.paths);

  if (sub === 'add') {
    if (guard) return fail(guard);
    const parsed = parseArgs(rest, {
      boolean: ['--force'],
      string: ['--tunnel-id', '--server', '--api-key-env', '--api-key', '--health-port'],
      repeat: ['--arg'],
      aliases: { '-f': '--force', '-t': '--tunnel-id', '-s': '--server' },
    });
    if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
    const name = parsed.positionals[0];
    if (!name) return usageError('缺少隧道名称，例如：' + BRAND.bin + ' tunnel add code --tunnel-id tunnel_xxx --server code');
    if (!isValidName(name)) return usageError('名称不合法（只允许字母数字与 . _ -，最长 40 字符）：' + name);
    const tunnelId = flagString(parsed, '--tunnel-id') ?? '';
    if (!tunnelId) return usageError('缺少 --tunnel-id（在 ' + BRAND.docs.platformTunnels + ' 创建）');
    if (!isValidTunnelId(tunnelId)) {
      return usageError('隧道 ID 格式不对：' + tunnelId + '\n应为 tunnel_ 加 32 位小写十六进制，例如 tunnel_0123456789abcdef0123456789abcdef');
    }
    const serverName = flagString(parsed, '--server') ?? '';
    if (!serverName) return usageError('缺少 --server（要暴露的本地 MCP 服务器名）');
    if (!findServer(ctx.config, serverName)) {
      const known = ctx.config.servers.map((server) => server.name);
      return fail(
        '没有这个 MCP 服务器：' + serverName + (known.length ? '\n已注册：' + known.join('、') : '\n先用 ' + BRAND.bin + ' server add 注册一个')
      );
    }
    if (findTunnel(ctx.config, name) && !flagBool(parsed, '--force')) {
      return fail('隧道已存在：' + name + '\n如需覆盖请加 --force');
    }
    const apiKey = flagString(parsed, '--api-key');
    const apiKeyEnvRaw = flagString(parsed, '--api-key-env');
    if (apiKey && apiKeyEnvRaw) return usageError('--api-key 与 --api-key-env 只能二选一');
    const apiKeyEnv = apiKey ? undefined : (apiKeyEnvRaw ?? 'CONTROL_PLANE_API_KEY');
    const portRaw = flagString(parsed, '--health-port');
    const healthPort = portRaw === undefined ? undefined : Number(portRaw);
    if (healthPort !== undefined && (!Number.isInteger(healthPort) || healthPort < 1 || healthPort > 65535)) {
      return usageError('--health-port 需要是 1-65535 的整数');
    }

    const tunnel: TunnelConfig = { name, tunnelId, server: serverName };
    if (apiKey) tunnel.apiKey = apiKey;
    if (apiKeyEnv) tunnel.apiKeyEnv = apiKeyEnv;
    if (healthPort !== undefined) tunnel.healthPort = healthPort;
    const extraArgs = flagList(parsed, '--arg');
    if (extraArgs.length > 0) tunnel.extraArgs = extraArgs;

    ctx.config.tunnels = [...ctx.config.tunnels.filter((item) => item.name !== name), tunnel];
    const code = saveAndReport(ctx, '已保存隧道 ' + name + '（MCP 服务器：' + serverName + '）');
    if (code !== EXIT_OK) return code;
    if (apiKey) {
      out(yellow('  ! ') + 'apiKey 以明文保存在配置文件里，长期使用建议改用 --api-key-env。');
    } else if (apiKeyEnv) {
      out(dim('  runtime key 将在启动时从环境变量 ' + apiKeyEnv + ' 读取。'));
    }
    if (g.json) jsonOut({ ok: true, tunnel: { ...tunnel, apiKey: tunnel.apiKey ? maskSecret(tunnel.apiKey) : undefined } });
    return EXIT_OK;
  }

  if (sub === 'list' || sub === 'ls') {
    if (!ctx.config.tunnels.length) {
      out('还没有配置任何隧道。');
      out(dim('  示例：' + BRAND.bin + ' tunnel add code --tunnel-id tunnel_xxx --server code'));
      return EXIT_OK;
    }
    if (g.json) {
      jsonOut({ ok: true, tunnels: ctx.config.tunnels.map((tunnel) => ({ ...tunnel, apiKey: tunnel.apiKey ? maskSecret(tunnel.apiKey) : undefined })) });
      return EXIT_OK;
    }
    const rows = ctx.config.tunnels.map((tunnel) => [
      tunnel.name,
      truncate(tunnel.tunnelId, 20),
      tunnel.server,
      describeKey(tunnel),
      tunnel.healthPort === undefined ? String(ctx.config.defaults?.healthPort ?? 8080) : String(tunnel.healthPort),
    ]);
    out(formatTable(['名称', 'tunnel id', 'MCP 服务器', 'runtime key', '健康端口'], rows));
    out(dim('  runtime key 只在启动子进程时经环境变量传入，不会写进命令行或日志。'));
    return EXIT_OK;
  }

  if (sub === 'remove' || sub === 'rm') {
    if (guard) return fail(guard);
    const parsed = parseArgs(rest, { boolean: ['--force'], aliases: { '-f': '--force' } });
    const name = parsed.positionals[0];
    if (!name) return usageError('缺少隧道名称：' + BRAND.bin + ' tunnel remove <名称>');
    const tunnel = findTunnel(ctx.config, name);
    if (!tunnel) return fail('没有这个隧道：' + name);
    const state = readState(ctx.paths, name);
    if (state && isProcessAlive(state.pid) && !flagBool(parsed, '--force')) {
      return fail('隧道 ' + name + ' 正在运行（PID ' + state.pid + '）\n先执行 ' + BRAND.bin + ' stop ' + name + '，或加 --force 强制移除配置');
    }
    ctx.config.tunnels = ctx.config.tunnels.filter((item) => item.name !== name);
    return saveAndReport(ctx, '已删除隧道 ' + name);
  }

  return usageError('未知子命令：tunnel ' + sub + '（可用 add / list / remove）');
}

/* ------------------------------------------------------------------ start / stop */

async function cmdStart(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const guard = missingConfigError(ctx.paths);
  if (guard) return fail(guard);
  const parsed = parseArgs(args, {
    boolean: ['--all', '--dry-run'],
    string: ['--wait'],
    aliases: { '-a': '--all', '-n': '--dry-run', '-w': '--wait' },
  });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const errors = configErrorList(ctx.issues);
  if (errors.length > 0) return fail('配置有错误，先修好再启动：\n- ' + errors.join('\n- '));

  const selection = selectTunnels(ctx.config, parsed.positionals, flagBool(parsed, '--all'));
  if (selection.error) return usageError(selection.error);

  const waitRaw = flagString(parsed, '--wait');
  const waitSeconds = waitRaw === undefined ? DEFAULT_WAIT_SECONDS : Number(waitRaw);
  if (!Number.isFinite(waitSeconds) || waitSeconds < 0) return usageError('--wait 需要是非负秒数');
  const dryRun = flagBool(parsed, '--dry-run');

  const runtime = findRuntime(ctx.paths);
  if (!runtime.path && !dryRun) {
    return fail('找不到官方 tunnel-client 运行时\n先执行：' + BRAND.bin + ' runtime fetch');
  }

  const results: { name: string; ok: boolean; detail: string }[] = [];
  for (const tunnel of selection.tunnels) {
    if (!dryRun) {
      const existing = readState(ctx.paths, tunnel.name);
      if (existing && isProcessAlive(existing.pid)) {
        out(yellow('跳过 ') + tunnel.name + dim('（已在运行，PID ' + existing.pid + '）'));
        results.push({ name: tunnel.name, ok: true, detail: 'already-running' });
        continue;
      }
    }
    const result = await startTunnel({
      paths: ctx.paths,
      config: ctx.config,
      tunnel,
      runtime,
      dryRun,
    });
    if (dryRun) {
      if (!result.ok) return fail(result.error ?? '无法生成启动命令');
      out(bold('[' + tunnel.name + '] ') + '将要执行：');
      out('  ' + (result.command ?? []).join(' '));
      out('  ' + dim('runtime key：' + describeKey(tunnel) + '（只会经环境变量 CONTROL_PLANE_API_KEY 传给子进程）'));
      out('  ' + dim('健康端点：优先使用端口 ' + String(healthPortFor(ctx.config, tunnel) ?? 8080) + '（被占用时自动换空闲端口）'));
      results.push({ name: tunnel.name, ok: true, detail: 'dry-run' });
      continue;
    }
    if (!result.ok) {
      errOut(red('✘ ') + tunnel.name + '：' + (result.error ?? '启动失败'));
      results.push({ name: tunnel.name, ok: false, detail: result.error ?? '启动失败' });
      continue;
    }
    const state = result.state;
    const healthAddr = state?.healthAddr ?? '';
    out(green('✔ ') + tunnel.name + ' 已启动' + dim('（PID ' + String(state?.pid ?? '?') + '，健康端点 http://' + healthAddr + '）'));
    const ready = await waitUntilReady(healthAddr, waitSeconds);
    if (ready) {
      out('  ' + green('● ') + '健康检查通过（/readyz），隧道已就绪。');
    } else if (waitSeconds > 0) {
      out('  ' + yellow('○ ') + '还未就绪，稍等片刻后执行 ' + BRAND.bin + ' status --health 复检。');
      out('  ' + dim('  日志：' + BRAND.bin + ' logs ' + tunnel.name + ' --follow'));
    }
    results.push({ name: tunnel.name, ok: true, detail: 'started' });
  }

  if (g.json) {
    jsonOut({ ok: results.every((item) => item.ok), results });
    return results.some((item) => !item.ok) ? EXIT_ERROR : EXIT_OK;
  }
  return results.some((item) => !item.ok) ? EXIT_ERROR : EXIT_OK;
}

async function cmdStop(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, { boolean: ['--all'], aliases: { '-a': '--all' } });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const selection = selectTunnels(ctx.config, parsed.positionals, flagBool(parsed, '--all'));
  if (selection.error) return usageError(selection.error);

  const names = selection.tunnels.map((tunnel) => tunnel.name);
  if (flagBool(parsed, '--all')) {
    for (const leftover of leftoverRunNames(ctx.paths, ctx.config)) names.push(leftover);
  }

  const results: { name: string; ok: boolean; message: string }[] = [];
  for (const name of names) {
    const result = await stopTunnel(ctx.paths, name);
    if (result.ok) out(green('✔ ') + result.message);
    else errOut(red('✘ ') + result.message);
    results.push({ name, ok: result.ok, message: result.message });
  }
  if (g.json) {
    jsonOut({ ok: results.every((item) => item.ok), results });
  }
  return results.some((item) => !item.ok) ? EXIT_ERROR : EXIT_OK;
}

/* ------------------------------------------------------------------ status */

async function cmdStatus(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, { boolean: ['--health'], aliases: { '-H': '--health' } });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const names = parsed.positionals;
  for (const name of names) {
    if (!findTunnel(ctx.config, name)) return fail('未找到隧道：' + name);
  }

  const all = listStatuses(ctx.paths, ctx.config);
  const selected = names.length > 0 ? all.filter((status) => names.includes(status.name)) : all;
  const withHealth: { status: TunnelStatus; ready: boolean | null }[] = [];
  for (const status of selected) {
    if (flagBool(parsed, '--health') && status.state === 'running' && status.healthAddr) {
      const probe = await probeHealth(status.healthAddr, 2000);
      withHealth.push({ status, ready: probe.readyz });
    } else {
      withHealth.push({ status, ready: null });
    }
  }

  if (g.json) {
    jsonOut({
      ok: true,
      runtime: (() => {
        const info = findRuntime(ctx.paths);
        return { path: info.path, version: info.version, source: info.source };
      })(),
      tunnels: withHealth.map((item) => ({ ...item.status, ready: item.ready })),
    });
    return EXIT_OK;
  }

  if (selected.length === 0) {
    out('还没有配置任何隧道。');
    out(dim('  示例：' + BRAND.bin + ' tunnel add code --tunnel-id tunnel_xxx --server code'));
    return EXIT_OK;
  }
  const rows = withHealth.map((item) => [
    item.status.name,
    stateLabel(item.status.state),
    item.status.pid === null ? '-' : String(item.status.pid),
    item.status.state === 'running' ? fmtDuration(item.status.uptimeMs) : '-',
    item.status.healthAddr ?? '-',
    truncate(item.status.target || '-', 40),
    item.ready === null ? '-' : item.ready ? green('就绪') : yellow('未就绪'),
  ]);
  out(formatTable(['名称', '状态', 'PID', '已运行', '健康端点', 'MCP 目标', '健康'], rows));

  const broken = withHealth.filter((item) => item.status.lastError);
  for (const item of broken) out(yellow('  ! ') + item.status.name + '：' + String(item.status.lastError));
  const leftovers = leftoverRunNames(ctx.paths, ctx.config);
  if (leftovers.length > 0) {
    out(dim('  另有 ' + leftovers.length + ' 条不在配置里的残留运行记录：' + leftovers.join('、') + '（可用 ' + BRAND.bin + ' stop --all 清理）'));
  }
  const runtime = findRuntime(ctx.paths);
  out(dim('  运行时：' + (runtime.path ?? '未找到（执行 ' + BRAND.bin + ' runtime fetch）') + (runtime.version ? '  v' + runtime.version : '')));
  return EXIT_OK;
}

/* ------------------------------------------------------------------ logs */

async function cmdLogs(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ['--follow'],
    string: ['--lines'],
    aliases: { '-f': '--follow', '-n': '--lines' },
  });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const name = parsed.positionals[0];
  if (!name) return usageError('缺少隧道名称：' + BRAND.bin + ' logs <名称> [--follow]');
  const tunnel = findTunnel(ctx.config, name);
  if (!tunnel) return fail('未找到隧道：' + name);

  const linesRaw = flagString(parsed, '--lines');
  const lines = linesRaw === undefined ? 60 : Number(linesRaw);
  if (!Number.isFinite(lines) || lines < 1) return usageError('--lines 需要是正整数');

  const logFile = logFileFor(ctx.paths, name);
  const tail = readLogTail(logFile, Math.floor(lines));
  if (g.json && !flagBool(parsed, '--follow')) {
    jsonOut({ ok: true, name, logFile, lines: tail.lines, truncated: tail.truncated });
    return EXIT_OK;
  }
  if (tail.lines.length === 0) {
    out(dim('日志为空：' + logFile));
    out(dim('  隧道启动后才有日志；执行 ' + BRAND.bin + ' start ' + name + ' 后再来看。'));
    if (!flagBool(parsed, '--follow')) return EXIT_OK;
  } else {
    if (tail.truncated) out(dim('（只显示最后 ' + String(Math.floor(lines)) + ' 行）'));
    for (const line of tail.lines) out(line);
  }

  if (!flagBool(parsed, '--follow')) return EXIT_OK;
  out(dim('--- 实时跟踪 ' + logFile + '，按 Ctrl+C 退出 ---'));
  const stopFollow = followLog(logFile, (incoming) => {
    for (const line of incoming) out(line);
  });
  await new Promise<void>((done) => {
    const onSigint = (): void => {
      stopFollow();
      out('');
      out(dim('已停止跟踪日志。'));
      done();
    };
    process.once('SIGINT', onSigint);
  });
  return EXIT_OK;
}

/* ------------------------------------------------------------------ doctor */

async function cmdDoctor(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, { boolean: ['--online'], aliases: { '-o': '--online' } });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const checks = await runDoctor({
    paths: ctx.paths,
    config: ctx.config,
    configIssues: ctx.issues,
    online: flagBool(parsed, '--online'),
  });
  const summary = summarizeChecks(checks);
  if (g.json) {
    jsonOut({ ok: summary.fail === 0, summary, checks });
    return summary.fail === 0 ? EXIT_OK : EXIT_ERROR;
  }
  out(bold(BRAND.name + ' 体检报告') + dim('  ' + ctx.paths.configFile));
  out('');
  for (const check of checks) {
    out('[' + levelLabel(check.level) + '] ' + check.title + dim('：' + check.detail));
    if (check.hint) out('        ' + dim('→ ' + check.hint));
  }
  out('');
  out(
    '结果：' +
      green('通过 ' + String(summary.pass)) +
      '  ' +
      cyan('提示 ' + String(summary.info)) +
      '  ' +
      yellow('警告 ' + String(summary.warn)) +
      '  ' +
      (summary.fail > 0 ? red('失败 ' + String(summary.fail)) : dim('失败 0'))
  );
  return summary.fail === 0 ? EXIT_OK : EXIT_ERROR;
}

/* ------------------------------------------------------------------ panel */

async function cmdPanel(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const parsed = parseArgs(args, {
    boolean: ['--no-open'],
    string: ['--port', '--host'],
    aliases: { '-p': '--port', '-H': '--host' },
  });
  if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
  const host = flagString(parsed, '--host') ?? '127.0.0.1';
  const portRaw = flagString(parsed, '--port');
  let port: number;
  if (portRaw === undefined) {
    port = await getFreePort(DEFAULT_PANEL_PORT);
    if (port !== DEFAULT_PANEL_PORT) {
      out(dim('默认端口 ' + String(DEFAULT_PANEL_PORT) + ' 已被占用，自动改用 ' + String(port) + '。'));
    }
  } else {
    port = Number(portRaw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return usageError('--port 需要是 1-65535 的整数');
    try {
      await getFreePort(port);
    } catch {
      return fail('端口 ' + String(port) + ' 已被占用，换个端口或用 ' + BRAND.bin + ' panel（自动选端口）');
    }
  }

  let handle: { url: string; port: number; close: () => Promise<void> };
  try {
    handle = await startPanel({
      paths: ctx.paths,
      config: ctx.config,
      configIssues: ctx.issues,
      port,
      host,
      onLog: (line) => out(dim('  ' + line)),
    });
  } catch (err) {
    return fail('面板启动失败：' + (err instanceof Error ? err.message : String(err)));
  }

  out(panelBanner(handle.url, ctx.paths.configFile));
  if (g.json) jsonOut({ ok: true, url: handle.url, port: handle.port, configFile: ctx.paths.configFile });
  if (!flagBool(parsed, '--no-open')) openBrowser(handle.url);

  await new Promise<void>((done) => {
    const shutdown = (): void => {
      void handle.close().then(() => {
        out('');
        out(panelStopHint());
        done();
      });
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
  return EXIT_OK;
}

/* ------------------------------------------------------------------ runtime */

async function cmdRuntime(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const sub = args[0] ?? 'path';
  const rest = args.slice(1);

  if (sub === 'path' || sub === 'list') {
    const info = findRuntime(ctx.paths);
    if (g.json) {
      jsonOut({ ok: info.path !== null, ...info, expected: runtimeBinaryName(), platform: platformTag(), arch: archTag() });
      return info.path ? EXIT_OK : EXIT_ERROR;
    }
    if (!info.path) {
      out(yellow('未找到官方 tunnel-client 运行时。'));
      out(dim('  期望文件名：' + runtimeBinaryName() + '（' + platformTag() + '/' + archTag() + '）'));
      out('  执行 ' + cyan(BRAND.bin + ' runtime fetch') + ' 自动下载并校验，');
      out('  或用 ' + cyan(envKey('TUNNEL_CLIENT') + '=<路径>') + ' 指定已有可执行文件。');
      return EXIT_ERROR;
    }
    out(green('✔ ') + '运行时：' + info.path);
    out('  版本：' + (info.version ?? '未知') + '    来源：' + info.source);
    return EXIT_OK;
  }

  if (sub === 'fetch' || sub === 'install') {
    const parsed = parseArgs(rest, {
      boolean: ['--force', '--skip-verify'],
      string: ['--version'],
      aliases: { '-f': '--force' },
    });
    if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
    const existing = findRuntime(ctx.paths);
    if (existing.path && !flagBool(parsed, '--force')) {
      out(yellow('运行时已存在：') + existing.path + (existing.version ? dim('（v' + existing.version + '）') : ''));
      out(dim('  如需重新下载请加 --force。'));
      return EXIT_OK;
    }
    const version = flagString(parsed, '--version');
    out(dim('平台：' + platformTag() + '/' + archTag() + '，目标：' + join(ctx.paths.binDir, runtimeBinaryName())));
    try {
      const result = await installRuntime({
        paths: ctx.paths,
        version,
        skipVerify: flagBool(parsed, '--skip-verify'),
        log: (line) => out('  ' + dim(line)),
      });
      if (g.json) jsonOut({ ok: true, ...result });
      else {
        out(green('✔ ') + '运行时已就绪：' + result.path);
        out('  版本：' + result.version + '    SHA-256：' + result.sha256 + (result.verified ? green('（官方校验通过）') : yellow('（未校验）')));
      }
      return EXIT_OK;
    } catch (err) {
      return fail('安装运行时失败：' + (err instanceof Error ? err.message : String(err)));
    }
  }

  if (sub === 'import') {
    const parsed = parseArgs(rest, {
      boolean: ['--skip-verify', '--force'],
      string: ['--version'],
    });
    if (parsed.errors.length > 0) return usageError(parsed.errors[0] ?? '');
    const zip = parsed.positionals[0];
    if (!zip) return usageError('缺少压缩包路径：' + BRAND.bin + ' runtime import <压缩包.zip>');
    try {
      const result = await installRuntime({
        paths: ctx.paths,
        zipPath: zip,
        version: flagString(parsed, '--version'),
        skipVerify: flagBool(parsed, '--skip-verify'),
        log: (line) => out('  ' + dim(line)),
      });
      if (g.json) jsonOut({ ok: true, ...result });
      else {
        out(green('✔ ') + '已从本地压缩包安装运行时：' + result.path);
        out('  版本：' + result.version + '    SHA-256：' + result.sha256 + (result.verified ? green('（官方校验通过）') : yellow('（未校验）')));
      }
      return EXIT_OK;
    } catch (err) {
      return fail('导入运行时失败：' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return usageError('未知子命令：runtime ' + sub + '（可用 path / fetch / import）');
}

/* ------------------------------------------------------------------ config */

async function cmdConfig(ctx: Ctx, g: GlobalOptions, args: string[]): Promise<number> {
  const sub = args[0] ?? 'path';
  if (sub === 'path') {
    if (g.json) {
      jsonOut({ ok: true, configFile: ctx.paths.configFile, scope: ctx.paths.configScope, home: ctx.paths.home });
      return EXIT_OK;
    }
    out('配置文件：' + ctx.paths.configFile);
    out('  来源：' + describeConfigScope(ctx.paths.configScope));
    out('  运行目录：' + ctx.paths.home);
    return EXIT_OK;
  }
  if (sub === 'show') {
    const guard = missingConfigError(ctx.paths);
    if (guard) return fail(guard);
    jsonOut(maskedConfig(ctx.config));
    return EXIT_OK;
  }
  if (sub === 'validate') {
    const guard = missingConfigError(ctx.paths);
    if (guard) return fail(guard);
    const issues = ctx.issues;
    if (g.json) {
      jsonOut({ ok: issues.every((issue) => issue.level !== 'error'), issues });
      return issues.some((issue) => issue.level === 'error') ? EXIT_ERROR : EXIT_OK;
    }
    if (issues.length === 0) {
      out(green('✔ ') + '配置没有问题：' + countText(ctx.config));
      return EXIT_OK;
    }
    for (const issue of issues) {
      const tag = issue.level === 'error' ? red('[错误]') : yellow('[警告]');
      out(tag + ' ' + issue.message);
    }
    return issues.some((issue) => issue.level === 'error') ? EXIT_ERROR : EXIT_OK;
  }
  return usageError('未知子命令：config ' + sub + '（可用 path / show / validate）');
}

/* ------------------------------------------------------------------ 入口 */

async function main(argv: string[]): Promise<number> {
  const globals = extractGlobals(argv);
  const rest = globals.rest;
  if (rest.length === 0) {
    out(usageText());
    return EXIT_OK;
  }
  const command = rest[0] as string;
  const args = rest.slice(1);

  if (command === 'help') {
    out(args[0] ? commandHelp(args[0]) : usageText());
    return EXIT_OK;
  }
  if (command === '--help' || command === '-h') {
    out(usageText());
    return EXIT_OK;
  }
  if (command === '--version' || command === '-v' || command === 'version') {
    out(BRAND.name + ' v' + packageVersion(import.meta.url));
    out(dim('需要 Node.js >= 20.11；官方运行时来自 ' + BRAND.docs.tunnelClientRepo));
    return EXIT_OK;
  }
  if (args.includes('--help') || args.includes('-h')) {
    out(commandHelp(command));
    return EXIT_OK;
  }

  const ctx = buildCtx(globals);
  switch (command) {
    case 'init':
      return cmdInit(ctx, globals, args);
    case 'server':
      return cmdServer(ctx, globals, args);
    case 'tunnel':
      return cmdTunnel(ctx, globals, args);
    case 'start':
      return cmdStart(ctx, globals, args);
    case 'stop':
      return cmdStop(ctx, globals, args);
    case 'status':
      return cmdStatus(ctx, globals, args);
    case 'logs':
      return cmdLogs(ctx, globals, args);
    case 'doctor':
      return cmdDoctor(ctx, globals, args);
    case 'panel':
      return cmdPanel(ctx, globals, args);
    case 'runtime':
      return cmdRuntime(ctx, globals, args);
    case 'config':
      return cmdConfig(ctx, globals, args);
    default:
      return usageError('未知命令：' + command);
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    errOut(red('[内部错误] ') + message);
    process.exitCode = EXIT_ERROR;
  });
