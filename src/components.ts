/**
 * 组件市场：把 GitHub 上主流开源 MCP 服务器打包成"一键安装组件"。
 *
 * 设计目标：让新用户不用知道命令怎么写，挑一个组件点"安装"，
 * MCPHelm 自动把它下载到数据根（默认不在 C 盘）、生成正确的启动命令、
 * 写进 config.servers——之后挂隧道、体检、看日志都和手动添加的服务器一模一样。
 *
 * 与 src/templates.ts 的区别：templates 只是"帮你填命令"，组件是真的
 * "帮你把服务器程序装进数据根"。组件来源全部是官方/高星开源项目，
 * 许可证宽松（MIT / Apache-2.0），允许再分发；这里按需下载，不预打包，
 * 所以 MCPHelm 安装包保持小巧、组件永远能拿到最新版。
 */
import { join } from 'node:path';
import type { AppPaths } from './paths.ts';

/** 组件的"MCP 传输方式"：决定隧道怎么接它 */
export type ComponentKind = 'stdio' | 'http';

/** 组件的运行时装载方式 */
export type ComponentRunner = 'npx' | 'uvx';

export interface ComponentSpec {
  /** 组件唯一 id（同时也是装进 servers[] 时建议的服务器名） */
  id: string;
  /** 显示名 */
  title: string;
  /** 一句话说明（中文） */
  description: string;
  /** 来源项目（GitHub 仓库），用于界面标注与版权说明 */
  source: { repo: string; license: string; url: string };
  /** 传输方式 */
  kind: ComponentKind;
  /** 运行时装载方式 */
  runner: ComponentRunner;
  /** 传给 npx / uvx 的包名（含可选版本），例如 "@playwright/mcp@latest" */
  package: string;
  /** 额外固定的启动参数 */
  args?: string[];
  /** 需要用户选填的参数说明（界面提示，可选） */
  hint?: string;
  /** 安装完成后写进 servers[] 的说明文字 */
  serverDescription?: string;
}

/**
 * 内置精选组件清单。
 * 大哥那三件套（serena / windows-mcp / playwright-mcp）排最前，
 * 后面是官方维护、用户基数大的轻量组件，全部按需下载。
 */
export const COMPONENTS: ComponentSpec[] = [
  {
    id: 'serena',
    title: 'Serena 代码助手',
    description: '读懂整个代码库，让 ChatGPT 能精准查找、分析、改写你的项目代码。',
    source: { repo: 'oraios/serena', license: 'MIT', url: 'https://github.com/oraios/serena' },
    kind: 'stdio',
    runner: 'uvx',
    package: 'serena-agent',
    args: ['start-mcp-server', '--transport', 'stdio'],
    hint: '首次运行会下载依赖，稍慢；之后秒开。',
    serverDescription: 'Serena 代码语义分析（组件市场安装）',
  },
  {
    id: 'windows-mcp',
    title: 'Windows-MCP 桌面控制',
    description: '让 ChatGPT 看你的屏幕、操作 Windows 窗口与鼠标键盘，实现桌面自动化。',
    source: { repo: 'CursorTouch/Windows-MCP', license: 'MIT', url: 'https://github.com/CursorTouch/Windows-MCP' },
    kind: 'stdio',
    runner: 'uvx',
    package: 'windows-mcp',
    hint: '需要 Windows 桌面环境；远程/无界面场景不适用。',
    serverDescription: 'Windows-MCP 桌面自动化（组件市场安装）',
  },
  {
    id: 'playwright-mcp',
    title: 'Playwright 浏览器',
    description: '让 ChatGPT 自动开浏览器、点网页、填表单、截图，做网页自动化。',
    source: { repo: 'microsoft/playwright-mcp', license: 'Apache-2.0', url: 'https://github.com/microsoft/playwright-mcp' },
    kind: 'stdio',
    runner: 'npx',
    package: '@playwright/mcp@latest',
    hint: '首次使用会提示下载浏览器内核，按提示确认一次即可。',
    serverDescription: 'Playwright 浏览器自动化（组件市场安装）',
  },
  {
    id: 'filesystem',
    title: 'Filesystem 文件读写',
    description: '让 ChatGPT 读写你指定的本机文件夹（官方示例服务器，最常用）。',
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-filesystem',
    args: ['%USERPROFILE%\\Documents'],
    hint: '默认开放"文档"文件夹；安装后可在服务器列表里把路径改成你想开放的目录。',
    serverDescription: 'Filesystem 文件读写（组件市场安装）',
  },
  {
    id: 'fetch',
    title: 'Fetch 网页抓取',
    description: '抓取网页正文交给 ChatGPT 阅读，省去手动复制粘贴。',
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    kind: 'stdio',
    runner: 'uvx',
    package: 'mcp-server-fetch',
    serverDescription: 'Fetch 网页抓取（组件市场安装）',
  },
  {
    id: 'memory',
    title: 'Memory 持久记忆',
    description: '给 ChatGPT 一块跨会话的记忆板，记住你的偏好和项目背景。',
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-memory',
    serverDescription: 'Memory 持久记忆（组件市场安装）',
  },
];

export function findComponent(id: string): ComponentSpec | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

/** 组件在数据根下的预留目录（将来预打包/离线组件用；当前轻量组件按需加载，不占目录） */
export function componentDir(paths: AppPaths, id: string): string {
  return join(paths.home, 'components', id);
}

/**
 * 该组件最终生成的 MCP 启动命令（写进 config.servers 的 command）。
 * 所有第三方包管理器的下载缓存都引到数据根 cache 下，不写 C 盘。
 */
export function componentCommand(spec: ComponentSpec, paths: AppPaths): string {
  const parts: string[] = [];
  if (spec.runner === 'npx') {
    parts.push('npx', '-y', spec.package);
  } else {
    parts.push('uvx', spec.package);
  }
  if (spec.args) parts.push(...spec.args);
  return parts.join(' ');
}

/** 该组件依赖的运行器名称（用于界面提示和体检）：npx 随 Node 自带；uvx 需要装 uv */
export function runnerName(runner: ComponentRunner): string {
  return runner === 'npx' ? 'npx（随 Node.js 自带）' : 'uvx（需先安装 uv）';
}
