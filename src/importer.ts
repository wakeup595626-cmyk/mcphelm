/**
 * 一键导入已有的 MCP 配置。
 *
 * 很多用户已经在 Claude Desktop / Cursor / VS Code 里配好了 MCP 服务器，
 * 格式都是经典的 { "mcpServers": { 名称: { command, args, env / url } } }。
 * 本模块负责：
 *   - 探测这些工具在本机的配置文件路径；
 *   - 把它们的 JSON 解析成 MCPHelm 的 McpServerConfig（含占位符变量）；
 *   - 合并进现有配置（重名可覆盖或跳过）。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists, readJsonSafe } from './util.ts';
import type { AppConfig, McpServerConfig } from './store.ts';

export interface ImportSource {
  id: string;
  label: string;
  /** 可能存在的配置文件路径（按优先级排列） */
  candidates: string[];
}

export interface FoundConfig {
  source: ImportSource;
  file: string;
  servers: McpServerConfig[];
  error?: string;
}

export interface ImportOutcome {
  added: string[];
  replaced: string[];
  skipped: string[];
}

/** 生成各家工具在本机可能的配置文件位置 */
export function importSources(env: NodeJS.ProcessEnv = process.env): ImportSource[] {
  const home = env.USERPROFILE ?? env.HOME ?? '';
  const appData = env.APPDATA ?? (home ? join(home, 'AppData', 'Roaming') : '');
  const sources: ImportSource[] = [];
  if (appData) {
    sources.push({
      id: 'claude-desktop',
      label: 'Claude Desktop',
      candidates: [join(appData, 'Claude', 'claude_desktop_config.json')],
    });
    sources.push({
      id: 'cursor',
      label: 'Cursor',
      candidates: [join(appData, 'Cursor', 'User', 'mcp.json'), join(home, '.cursor', 'mcp.json')],
    });
    sources.push({
      id: 'vscode',
      label: 'VS Code',
      candidates: [join(appData, 'Code', 'User', 'mcp.json')],
    });
  }
  if (home) {
    sources.push({ id: 'cursor-home', label: 'Cursor（用户目录）', candidates: [join(home, '.cursor', 'mcp.json')] });
    sources.push({ id: 'claude-code', label: 'Claude Code', candidates: [join(home, '.claude.json')] });
  }
  return sources;
}

/** 把各家 JSON 里的一台服务器定义翻译成 MCPHelm 配置；翻不了返回 null */
export function translateEntry(name: string, raw: unknown): McpServerConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const command = typeof obj.command === 'string' ? obj.command.trim() : '';
  const url = typeof obj.url === 'string' ? obj.url.trim() : '';

  if (url) {
    const server: McpServerConfig = { name, kind: 'http', url };
    if (obj.headers && typeof obj.headers === 'object' && !Array.isArray(obj.headers)) {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj.headers as Record<string, unknown>)) {
        if (typeof v === 'string') headers[k] = v;
      }
      if (Object.keys(headers).length > 0) server.headers = headers;
    }
    return server;
  }
  if (!command) return null;

  const args = Array.isArray(obj.args) ? obj.args.filter((a): a is string => typeof a === 'string') : [];
  const parts = [quoteIfNeeded(command), ...args.map(quoteIfNeeded)];
  const server: McpServerConfig = { name, kind: 'stdio', command: parts.join(' ') };

  // env 里的密钥不能直接拼进命令行——抽出为占位环境变量，交给隧道表单的密钥环节处理
  if (obj.env && typeof obj.env === 'object' && !Array.isArray(obj.env)) {
    const notes: string[] = [];
    for (const [k, v] of Object.entries(obj.env as Record<string, unknown>)) {
      if (typeof v === 'string' && v) notes.push(k);
    }
    if (notes.length > 0) {
      server.description = '导入自外部配置；原配置包含环境变量：' + notes.join('、') + '（请在启动命令或隧道密钥中补齐）';
    }
  }
  return server;
}

function quoteIfNeeded(part: string): string {
  if (!part) return part;
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(part)) return part;
  return '"' + part.replace(/"/g, '\\"') + '"';
}

/** 从一个 JSON 对象里挖出 mcpServers / servers 表 */
function extractServers(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const table = obj.mcpServers ?? obj.servers;
  if (!table || typeof table !== 'object' || Array.isArray(table)) return null;
  return table as Record<string, unknown>;
}

/** 解析一份外来配置文件，返回可直接合并的服务器列表 */
export function parseExternalConfig(source: ImportSource, file: string): FoundConfig {
  const raw = readJsonSafe<unknown>(file);
  if (raw === null) {
    return { source, file, servers: [], error: '不是合法的 JSON 文件' };
  }
  const table = extractServers(raw);
  if (!table) {
    return { source, file, servers: [], error: '文件里没有找到 mcpServers 配置段' };
  }
  const servers: McpServerConfig[] = [];
  for (const [name, entry] of Object.entries(table)) {
    const translated = translateEntry(name, entry);
    if (translated) servers.push(translated);
  }
  if (servers.length === 0) {
    return { source, file, servers: [], error: '配置段里没有能识别的服务器定义' };
  }
  return { source, file, servers };
}

/** 扫描本机，返回所有找到的外部 MCP 配置 */
export function scanExternalConfigs(env: NodeJS.ProcessEnv = process.env): FoundConfig[] {
  const found: FoundConfig[] = [];
  const seen = new Set<string>();
  for (const source of importSources(env)) {
    for (const candidate of source.candidates) {
      if (!fileExists(candidate) || seen.has(candidate)) continue;
      seen.add(candidate);
      found.push(parseExternalConfig(source, candidate));
      break;
    }
  }
  return found;
}

/** 解析用户直接粘贴的一段 mcpServers JSON 文本 */
export function parsePastedConfig(text: string): { servers: McpServerConfig[]; error?: string } {
  let raw: unknown = null;
  try {
    raw = JSON.parse(text);
  } catch {
    return { servers: [], error: '不是合法的 JSON，请检查是否完整粘贴了配置' };
  }
  const table = extractServers(raw);
  if (!table) {
    return { servers: [], error: '没有找到 mcpServers 配置段（支持 Claude / Cursor / VS Code 的格式）' };
  }
  const servers: McpServerConfig[] = [];
  for (const [name, entry] of Object.entries(table)) {
    const translated = translateEntry(name, entry);
    if (translated) servers.push(translated);
  }
  if (servers.length === 0) return { servers: [], error: '配置段里没有能识别的服务器定义' };
  return { servers };
}

/** 把导入的服务器合并进现有配置；overwrite=false 时重名跳过 */
export function mergeServers(
  config: AppConfig,
  servers: McpServerConfig[],
  opts: { overwrite?: boolean } = {}
): ImportOutcome {
  const outcome: ImportOutcome = { added: [], replaced: [], skipped: [] };
  for (const server of servers) {
    const existing = config.servers.find((s) => s.name === server.name);
    if (!existing) {
      config.servers.push(server);
      outcome.added.push(server.name);
    } else if (opts.overwrite) {
      config.servers[config.servers.indexOf(existing)] = server;
      outcome.replaced.push(server.name);
    } else {
      outcome.skipped.push(server.name);
    }
  }
  return outcome;
}

/** 直接读取指定路径的外部配置（面板手动选文件用） */
export function parseExternalFile(file: string): { servers: McpServerConfig[]; error?: string } {
  if (!fileExists(file)) return { servers: [], error: '文件不存在：' + file };
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    return { servers: [], error: '读取失败：' + (err instanceof Error ? err.message : String(err)) };
  }
  return parsePastedConfig(text);
}
