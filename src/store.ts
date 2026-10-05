import { BRAND } from './brand.ts';
import type { AppPaths } from './paths.ts';
import { join } from 'node:path';
import { atomicWriteJson, isProcessAlive, maskSecret, readJsonSafe } from './util.ts';

export type ServerKind = 'stdio' | 'http';

export interface McpServerConfig {
  name: string;
  description?: string;
  kind: ServerKind;
  /** stdio：完整命令行，例如 "npx -y @scope/server" 或 "python -m my_server --stdio" */
  command?: string;
  /** http：MCP 端点地址，例如 "http://127.0.0.1:3001/mcp" */
  url?: string;
  /** http：额外请求头（传给官方 --mcp.extra-headers） */
  headers?: Record<string, string>;
}

export interface TunnelConfig {
  name: string;
  /** OpenAI 平台生成的隧道 ID：tunnel_ + 32 位小写十六进制 */
  tunnelId: string;
  /** 引用 config.servers 中的服务器名 */
  server: string;
  /** 读取 runtime key 的环境变量名（推荐做法，密钥不落盘） */
  apiKeyEnv?: string;
  /** 直接写进配置的 runtime key（不推荐，仅本地临时使用） */
  apiKey?: string;
  /** 标记密钥已存入 Windows 凭据管理器（mcphelm/tunnel/<name>），不落盘 */
  apiKeyStore?: 'keyring';
  /** 本地健康端点端口，默认 8080 */
  healthPort?: number;
  /** 透传给 tunnel-client run 的高级参数 */
  extraArgs?: string[];
}

export type PanelLanguage = 'zh' | 'en';

export interface AppConfig {
  version: 1;
  servers: McpServerConfig[];
  tunnels: TunnelConfig[];
  defaults?: {
    healthPort?: number;
  };
  ui?: {
    language?: PanelLanguage;
    /** 面板访问口令；缺省时启动面板自动生成随机口令 */
    token?: string;
    /** 桌面端专属：关掉主窗口时最小化到托盘而不是退出 */
    minimizeToTray?: boolean;
    /** 桌面端专属：登录系统后自动启动 MCPHelm */
    autoLaunch?: boolean;
  };
}

export interface ConfigIssue {
  level: 'error' | 'warn';
  message: string;
}

export interface LoadResult {
  ok: boolean;
  config: AppConfig;
  issues: ConfigIssue[];
  error?: string;
}

export const TUNNEL_ID_RE = /^tunnel_[0-9a-f]{32}$/;
export const SAFE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;

export function emptyConfig(): AppConfig {
  return { version: 1, servers: [], tunnels: [], defaults: { healthPort: 8080 } };
}

export function isValidTunnelId(id: string): boolean {
  return TUNNEL_ID_RE.test(id);
}

export function isValidName(name: string): boolean {
  return SAFE_NAME_RE.test(name);
}

export function findServer(config: AppConfig, name: string): McpServerConfig | undefined {
  return config.servers.find((s) => s.name === name);
}

export function findTunnel(config: AppConfig, name: string): TunnelConfig | undefined {
  return config.tunnels.find((t) => t.name === name);
}

export function serverTarget(server: McpServerConfig): string {
  return server.kind === 'stdio' ? (server.command ?? '') : (server.url ?? '');
}

export function validateConfig(config: AppConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (config.version !== 1) {
    issues.push({ level: 'error', message: '配置版本不受支持：' + String(config.version) });
  }
  const serverNames = new Set<string>();
  for (const server of config.servers) {
    if (!isValidName(server.name)) {
      issues.push({ level: 'error', message: '服务器名称非法（只允许字母数字与 . _ -）：' + server.name });
    }
    if (serverNames.has(server.name)) {
      issues.push({ level: 'error', message: '服务器名称重复：' + server.name });
    }
    serverNames.add(server.name);
    if (server.kind === 'stdio' && !server.command) {
      issues.push({ level: 'error', message: 'stdio 服务器缺少 command：' + server.name });
    }
    if (server.kind === 'http' && !server.url) {
      issues.push({ level: 'error', message: 'http 服务器缺少 url：' + server.name });
    }
    if (server.kind === 'http' && server.url && !/^https?:\/\//.test(server.url)) {
      issues.push({ level: 'warn', message: 'http 服务器 url 不是 http(s) 地址：' + server.name });
    }
  }
  const tunnelNames = new Set<string>();
  for (const tunnel of config.tunnels) {
    if (!isValidName(tunnel.name)) {
      issues.push({ level: 'error', message: '隧道名称非法（只允许字母数字与 . _ -）：' + tunnel.name });
    }
    if (tunnelNames.has(tunnel.name)) {
      issues.push({ level: 'error', message: '隧道名称重复：' + tunnel.name });
    }
    tunnelNames.add(tunnel.name);
    if (!isValidTunnelId(tunnel.tunnelId)) {
      issues.push({ level: 'error', message: '隧道 ID 格式不对（应为 tunnel_ + 32 位小写十六进制）：' + tunnel.name });
    }
    if (!findServer(config, tunnel.server)) {
      issues.push({ level: 'error', message: '隧道引用了不存在的服务器：' + tunnel.name + ' -> ' + tunnel.server });
    }
    if (!tunnel.apiKeyEnv && !tunnel.apiKey && tunnel.apiKeyStore !== 'keyring') {
      issues.push({ level: 'warn', message: '隧道未配置 runtime key（apiKeyEnv / 密钥保险箱 / apiKey）：' + tunnel.name });
    }
    if (tunnel.healthPort !== undefined && (tunnel.healthPort < 1 || tunnel.healthPort > 65535)) {
      issues.push({ level: 'error', message: '健康端点端口超出范围：' + tunnel.name });
    }
  }
  return issues;
}

export function loadConfig(paths: AppPaths): LoadResult {
  const raw = readJsonSafe<unknown>(paths.configFile);
  if (raw === null) {
    return {
      ok: false,
      config: emptyConfig(),
      issues: [{ level: 'error', message: '配置文件不存在或不是合法 JSON：' + paths.configFile }],
      error: 'config-not-found',
    };
  }
  const candidate = raw as Partial<AppConfig>;
  const config: AppConfig = {
    version: 1,
    servers: Array.isArray(candidate.servers) ? candidate.servers : [],
    tunnels: Array.isArray(candidate.tunnels) ? candidate.tunnels : [],
    defaults: candidate.defaults ?? { healthPort: 8080 },
    ui: candidate.ui && typeof candidate.ui === 'object' ? candidate.ui : undefined,
  };
  const issues = validateConfig(config);
  const hasError = issues.some((i) => i.level === 'error');
  return { ok: !hasError, config, issues };
}

/**
 * 保存配置。真正写入前，先把磁盘上现存的配置原样留一份到 config.backup.json——
 * 这样配置自动备份才是真的：一旦某次保存出问题（面板误操作、磁盘写坏），
 * 用户随时能把 backup 改回 config.json 恢复。备份失败不阻断主保存。
 */
export function saveConfig(paths: AppPaths, config: AppConfig): void {
  try {
    const existing = readJsonSafe<unknown>(paths.configFile);
    if (existing !== null) {
      atomicWriteJson(backupConfigFile(paths), existing);
    }
  } catch {
    // 备份失败（例如磁盘满）不应影响本次保存
  }
  atomicWriteJson(paths.configFile, config);
}

/** 自动备份文件的位置（与迁移、界面提示共用一个口径，固定为 config.backup.json） */
export function backupConfigFile(paths: AppPaths): string {
  return join(paths.configDir, 'config.backup.json');
}

export interface ResolvedKey {
  ok: boolean;
  value?: string;
  source?: string;
  error?: string;
  /** true 表示密钥在系统保险箱里，需要走 resolveApiKeyAsync 异步取 */
  pendingKeyring?: boolean;
}

export function resolveApiKey(tunnel: TunnelConfig, env: NodeJS.ProcessEnv = process.env): ResolvedKey {
  if (tunnel.apiKeyEnv) {
    const value = env[tunnel.apiKeyEnv];
    if (!value) {
      return { ok: false, error: '环境变量 ' + tunnel.apiKeyEnv + ' 未设置或为空（隧道 ' + tunnel.name + '）' };
    }
    return { ok: true, value, source: 'env:' + tunnel.apiKeyEnv };
  }
  if (tunnel.apiKeyStore === 'keyring') {
    // 同步接口拿不到凭据内容；由异步解析器 resolveApiKeyAsync 处理
    return { ok: false, error: '密钥存放在 Windows 凭据管理器，请使用异步解析', pendingKeyring: true };
  }
  if (tunnel.apiKey) {
    return { ok: true, value: tunnel.apiKey, source: 'config(明文)' };
  }
  return { ok: false, error: '隧道 ' + tunnel.name + ' 未配置 runtime key，请设置 apiKeyEnv 或 apiKey' };
}

/**
 * 异步版密钥解析：在 resolveApiKey 的基础上，额外支持从 Windows 凭据管理器取回
 * apiKeyStore === 'keyring' 的密钥。启动隧道、面板显示状态都应使用这个版本。
 */
export async function resolveApiKeyAsync(
  tunnel: TunnelConfig,
  env: NodeJS.ProcessEnv = process.env
): Promise<ResolvedKey> {
  const sync = resolveApiKey(tunnel, env);
  if (!sync.pendingKeyring) return sync;
  const { keyringGet, keyringSupported } = await import('./keyring.ts');
  if (!keyringSupported()) {
    return { ok: false, error: '当前平台不支持系统密钥保险箱，无法取回隧道 ' + tunnel.name + ' 的密钥' };
  }
  const secret = await keyringGet(tunnel.name);
  if (!secret) {
    return {
      ok: false,
      error: 'Windows 凭据管理器里没有找到隧道 ' + tunnel.name + ' 的密钥（可能被清理了），请重新保存一次密钥',
    };
  }
  return { ok: true, value: secret, source: 'Windows 凭据管理器' };
}

export function describeKey(tunnel: TunnelConfig, env: NodeJS.ProcessEnv = process.env): string {
  if (tunnel.apiKeyStore === 'keyring') return '已存入 Windows 凭据管理器（不落盘）';
  const resolved = resolveApiKey(tunnel, env);
  if (!resolved.ok || !resolved.value) return '未配置';
  return maskSecret(resolved.value) + '  来源 ' + (resolved.source ?? '未知');
}

export function healthPortFor(config: AppConfig, tunnel: TunnelConfig): number | undefined {
  return tunnel.healthPort ?? config.defaults?.healthPort;
}

export function configSummary(config: AppConfig): string {
  return (
    config.servers.length +
    ' 个 MCP 服务器 / ' +
    config.tunnels.length +
    ' 条隧道  (' +
    BRAND.configFileName +
    ')'
  );
}

export function isStalePid(pid: number | undefined): boolean {
  if (!pid) return true;
  return !isProcessAlive(pid);
}
