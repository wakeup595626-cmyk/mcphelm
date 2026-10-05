/**
 * 常用 MCP 服务器模板：新用户不知道命令怎么写时，挑一个模板一键填入。
 * 只收录官方/主流、用户基数大、安装一句命令就能跑的服务器。
 */
import type { McpServerConfig } from './store.ts';

export interface ServerTemplate {
  id: string;
  name: string;
  kind: 'stdio' | 'http';
  command?: string;
  description: string;
  /** 表单里需要用户自己补的占位提示 */
  hint?: string;
}

export const SERVER_TEMPLATES: ServerTemplate[] = [
  {
    id: 'filesystem',
    name: 'filesystem',
    kind: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-filesystem "%USERPROFILE%\\Documents"',
    description: '读写本机文件夹（官方示例服务器）。把路径换成你想开放的目录。',
    hint: '把命令末尾的路径改成你要开放的文件夹，例如 D:\\work',
  },
  {
    id: 'fetch',
    name: 'fetch',
    kind: 'stdio',
    command: 'uvx mcp-server-fetch',
    description: '抓取网页内容交给模型阅读（需要本机装有 uv / Python）。',
    hint: '没有 uv 的话先执行：pip install uv，或改用 npm 镜像命令',
  },
  {
    id: 'git',
    name: 'git',
    kind: 'stdio',
    command: 'uvx mcp-server-git --repository "%USERPROFILE%"',
    description: '读取本地 Git 仓库历史与状态（需要本机装有 uv / Python）。',
    hint: '把 --repository 后面的路径换成你的仓库目录',
  },
  {
    id: 'sqlite',
    name: 'sqlite',
    kind: 'stdio',
    command: 'uvx mcp-server-sqlite --db-path "%USERPROFILE%\\data.db"',
    description: '让模型查询本地 SQLite 数据库（需要本机装有 uv / Python）。',
    hint: '把 --db-path 换成你的 .db 文件完整路径',
  },
  {
    id: 'everything',
    name: 'everything-search',
    kind: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-everything',
    description: '官方全功能演示服务器，适合先跑通流程、确认隧道没问题。',
  },
];

export function templateToServer(tpl: ServerTemplate, existingNames: string[]): McpServerConfig {
  let name = tpl.name;
  let i = 2;
  while (existingNames.includes(name)) {
    name = tpl.name + '-' + i;
    i += 1;
  }
  const server: McpServerConfig = { name, kind: tpl.kind, description: tpl.description };
  if (tpl.kind === 'stdio') server.command = tpl.command ?? '';
  return server;
}
