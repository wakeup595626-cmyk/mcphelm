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
 *
 * 收录标准（逐条联网核实仓库、包名与许可证）：
 * - 仓库真实存在且可访问，包名在 npm / PyPI 上真实可下载；
 * - 许可证宽松（MIT / Apache-2.0），允许按需下载与再分发；
 * - 开箱即用，不需要任何 API Key（要密钥的云服务类不收录）。
 *
 * 星标说明：stars 是打包那一刻的快照（见 STARS_SNAPSHOT_AT），用户打开
 * 组件市场时面板会联网刷新真实数字并缓存进数据根（见 src/marketstars.ts）；
 * 刷新不到（离线 / 限流 / 仓库改名）就继续显示快照数字并标注快照日期。
 */
import { join } from 'node:path';
import type { AppPaths } from './paths.ts';

/** 星标快照的抓取日期（界面在刷新失败时标注它，避免把旧数字当成实时值） */
export const STARS_SNAPSHOT_AT = '2026-10-06';

/** 组件的"MCP 传输方式"：决定隧道怎么接它 */
export type ComponentKind = 'stdio' | 'http';

/** 组件的运行时装载方式 */
export type ComponentRunner = 'npx' | 'uvx';

export interface ComponentSpec {
  /** 组件唯一 id（同时也是装进 servers[] 时建议的服务器名） */
  id: string;
  /** 显示名（中文） */
  title: string;
  /** 显示名（英文，界面切到 English 时用） */
  titleEn: string;
  /** 一句话说明（中文） */
  description: string;
  /** 一句话说明（英文） */
  descriptionEn: string;
  /** 这个组件能干什么（中文短句，界面一行一条） */
  abilities: string[];
  /** 与 abilities 一一对应的英文短句 */
  abilitiesEn: string[];
  /** 来源项目（GitHub 仓库），用于界面标注与版权说明 */
  source: { repo: string; license: string; url: string };
  /** GitHub 星标快照（打包时抓取的真实数字） */
  stars: number;
  /** 传输方式 */
  kind: ComponentKind;
  /** 运行时装载方式 */
  runner: ComponentRunner;
  /** 传给 npx / uvx 的包名（含可选版本），例如 "@playwright/mcp@latest" */
  package: string;
  /** 额外固定的启动参数 */
  args?: string[];
  /** 需要用户注意的参数/环境说明（中文，界面提示，可选） */
  hint?: string;
  /** 同上，英文 */
  hintEn?: string;
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
    titleEn: 'Serena code agent',
    description: '读懂整个代码库，让 ChatGPT 能精准查找、分析、改写你的项目代码。',
    descriptionEn: 'Gives ChatGPT semantic understanding of your codebase for precise search, analysis and edits.',
    abilities: ['按语义检索符号、定义与引用', '跨文件重构与批量改写', '按项目记住常用工作流'],
    abilitiesEn: ['Semantic search for symbols, definitions, references', 'Cross-file refactoring and batch edits', 'Remembers per-project workflows'],
    source: { repo: 'oraios/serena', license: 'MIT', url: 'https://github.com/oraios/serena' },
    stars: 30048,
    kind: 'stdio',
    runner: 'uvx',
    package: 'serena-agent',
    args: ['start-mcp-server', '--transport', 'stdio'],
    hint: '首次运行会下载依赖，稍慢；之后秒开。',
    hintEn: 'First run downloads dependencies (slow once), fast afterwards.',
    serverDescription: 'Serena 代码语义分析（组件市场安装）',
  },
  {
    id: 'windows-mcp',
    title: 'Windows-MCP 桌面控制',
    titleEn: 'Windows-MCP desktop control',
    description: '让 ChatGPT 看你的屏幕、操作 Windows 窗口与鼠标键盘，实现桌面自动化。',
    descriptionEn: 'Lets ChatGPT see your screen and drive Windows windows, mouse and keyboard.',
    abilities: ['截屏识别界面与控件', '点击、输入、拖拽等桌面操作', '自动化重复的日常流程'],
    abilitiesEn: ['Screenshots plus UI and control detection', 'Clicks, typing and dragging on the desktop', 'Automates repetitive everyday flows'],
    source: { repo: 'CursorTouch/Windows-MCP', license: 'MIT', url: 'https://github.com/CursorTouch/Windows-MCP' },
    stars: 7709,
    kind: 'stdio',
    runner: 'uvx',
    package: 'windows-mcp',
    hint: '需要 Windows 桌面环境；远程/无界面场景不适用。',
    hintEn: 'Needs a Windows desktop session; headless/remote use is not supported.',
    serverDescription: 'Windows-MCP 桌面自动化（组件市场安装）',
  },
  {
    id: 'playwright-mcp',
    title: 'Playwright 浏览器',
    titleEn: 'Playwright browser',
    description: '让 ChatGPT 自动开浏览器、点网页、填表单、截图，做网页自动化。',
    descriptionEn: 'Drives a real browser for ChatGPT: open pages, click, fill forms, take screenshots.',
    abilities: ['自动打开网页并交互操作', '抓取页面结构、正文与截图', '跑端到端的网页测试'],
    abilitiesEn: ['Opens pages and interacts with them', 'Extracts structure, text and screenshots', 'Runs end-to-end browser tests'],
    source: { repo: 'microsoft/playwright-mcp', license: 'Apache-2.0', url: 'https://github.com/microsoft/playwright-mcp' },
    stars: 37862,
    kind: 'stdio',
    runner: 'npx',
    package: '@playwright/mcp@latest',
    hint: '首次使用会提示下载浏览器内核，按提示确认一次即可。',
    hintEn: 'First use asks to download browser binaries — confirm once.',
    serverDescription: 'Playwright 浏览器自动化（组件市场安装）',
  },
  {
    id: 'chrome-devtools',
    title: 'Chrome DevTools 调试',
    titleEn: 'Chrome DevTools debugging',
    description: '连着真实 Chrome 调试网页：看控制台报错、查网络请求、录制性能数据。',
    descriptionEn: 'Debugs a real Chrome: console errors, network requests and performance traces.',
    abilities: ['读取控制台日志与报错', '检查网络请求与响应内容', '录制性能 trace 定位卡顿'],
    abilitiesEn: ['Reads console logs and errors', 'Inspects network requests and responses', 'Records performance traces to find jank'],
    source: { repo: 'ChromeDevTools/chrome-devtools-mcp', license: 'Apache-2.0', url: 'https://github.com/ChromeDevTools/chrome-devtools-mcp' },
    stars: 53028,
    kind: 'stdio',
    runner: 'npx',
    package: 'chrome-devtools-mcp@latest',
    hint: '需要本机已安装 Google Chrome。',
    hintEn: 'Requires Google Chrome installed on this machine.',
    serverDescription: 'Chrome DevTools 网页调试（组件市场安装）',
  },
  {
    id: 'markitdown',
    title: 'MarkItDown 文档转写',
    titleEn: 'MarkItDown document converter',
    description: '把 PDF、Word、Excel、PPT 等文档转成 Markdown 交给 ChatGPT 阅读。',
    descriptionEn: 'Converts PDF, Word, Excel and PowerPoint files to Markdown for ChatGPT to read.',
    abilities: ['PDF / Word / Excel / PPT 转 Markdown', '保留标题、表格与列表结构', '支持批量转换整个文件夹'],
    abilitiesEn: ['PDF / Word / Excel / PPT to Markdown', 'Keeps headings, tables and lists', 'Converts whole folders in one go'],
    source: { repo: 'microsoft/markitdown', license: 'MIT', url: 'https://github.com/microsoft/markitdown' },
    stars: 188797,
    kind: 'stdio',
    runner: 'uvx',
    package: 'markitdown-mcp',
    hint: '纯图片的扫描 PDF 需要额外 OCR 依赖。',
    hintEn: 'Image-only scanned PDFs need extra OCR dependencies.',
    serverDescription: 'MarkItDown 文档转 Markdown（组件市场安装）',
  },
  {
    id: 'context7',
    title: 'Context7 最新文档',
    titleEn: 'Context7 live docs',
    description: '给 ChatGPT 实时拉取库和框架的最新官方文档与代码示例，避免写出过时用法。',
    descriptionEn: 'Fetches up-to-date official docs and code samples for libraries and frameworks.',
    abilities: ['按库名解析到官方文档', '返回带版本号的示例代码', '减少 API 用法幻觉'],
    abilitiesEn: ['Resolves a library name to official docs', 'Returns version-pinned code samples', 'Cuts down on invented API usage'],
    source: { repo: 'upstash/context7', license: 'MIT', url: 'https://github.com/upstash/context7' },
    stars: 62736,
    kind: 'stdio',
    runner: 'npx',
    package: '@upstash/context7-mcp',
    hint: '免费额度有限，用量大时可以自备 API Key。',
    hintEn: 'Free quota is limited; bring your own API key for heavy use.',
    serverDescription: 'Context7 最新文档检索（组件市场安装）',
  },
  {
    id: 'desktop-commander',
    title: 'Desktop Commander 终端',
    titleEn: 'Desktop Commander terminal',
    description: '让 ChatGPT 在你电脑上执行终端命令、读写文件、跑脚本，做真正的开发操作。',
    descriptionEn: 'Runs terminal commands, edits files and executes scripts on your machine.',
    abilities: ['执行命令行与脚本', '批量读写、搜索文件', '长任务分段读取输出'],
    abilitiesEn: ['Runs commands and scripts', 'Batch reads, writes and file search', 'Streams long-running output'],
    source: { repo: 'wonderwhy-er/DesktopCommanderMCP', license: 'MIT', url: 'https://github.com/wonderwhy-er/DesktopCommanderMCP' },
    stars: 9933,
    kind: 'stdio',
    runner: 'npx',
    package: '@wonderwhy-er/desktop-commander',
    hint: '权限很大：只建议在你信任的机器上使用。',
    hintEn: 'Wide permissions: only use on a machine you trust.',
    serverDescription: 'Desktop Commander 终端执行（组件市场安装）',
  },
  {
    id: 'filesystem',
    title: 'Filesystem 文件读写',
    titleEn: 'Filesystem read and write',
    description: '让 ChatGPT 读写你指定的本机文件夹（官方示例服务器，最常用）。',
    descriptionEn: 'Lets ChatGPT read and write a folder you choose (official reference server).',
    abilities: ['读取指定目录的文件', '新建与编辑文件', '按名字搜索目录结构'],
    abilitiesEn: ['Reads files in a chosen directory', 'Creates and edits files', 'Searches the directory tree by name'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-filesystem',
    args: ['%USERPROFILE%\\Documents'],
    hint: '默认开放"文档"文件夹；安装后可在服务器列表里把路径改成你想开放的目录。',
    hintEn: 'Opens your Documents folder by default; edit the path in Servers afterwards.',
    serverDescription: 'Filesystem 文件读写（组件市场安装）',
  },
  {
    id: 'fetch',
    title: 'Fetch 网页抓取',
    titleEn: 'Fetch web reader',
    description: '抓取网页正文交给 ChatGPT 阅读，省去手动复制粘贴。',
    descriptionEn: 'Fetches web page content as text so ChatGPT can read it without copy-paste.',
    abilities: ['抓取网页正文并转成 Markdown', '自动跟随正文里的链接', '长文分段返回不撑爆上下文'],
    abilitiesEn: ['Converts page content to Markdown', 'Follows links inside the page', 'Chunks long articles to fit context'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'uvx',
    package: 'mcp-server-fetch',
    serverDescription: 'Fetch 网页抓取（组件市场安装）',
  },
  {
    id: 'memory',
    title: 'Memory 持久记忆',
    titleEn: 'Memory knowledge store',
    description: '给 ChatGPT 一块跨会话的记忆板，记住你的偏好和项目背景。',
    descriptionEn: 'A knowledge graph that remembers your preferences and project context across chats.',
    abilities: ['建立实体与关系知识图', '跨会话记住你的偏好', '随时检索历史记忆'],
    abilitiesEn: ['Builds an entity/relation graph', 'Remembers preferences across sessions', 'Retrieves past memories on demand'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-memory',
    serverDescription: 'Memory 持久记忆（组件市场安装）',
  },
  {
    id: 'time',
    title: 'Time 时间与时区',
    titleEn: 'Time and timezone',
    description: '给 ChatGPT 准确的时间与时区换算能力，避免把日期算错。',
    descriptionEn: 'Accurate current time and timezone conversion so dates are never guessed.',
    abilities: ['获取任意时区的当前时间', '时区之间换算', '避免模型凭空推算日期'],
    abilitiesEn: ['Current time in any timezone', 'Converts between timezones', 'Stops the model from guessing dates'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'uvx',
    package: 'mcp-server-time',
    serverDescription: 'Time 时间与时区（组件市场安装）',
  },
  {
    id: 'git',
    title: 'Git 仓库助手',
    titleEn: 'Git repository helper',
    description: '让 ChatGPT 直接读你的 Git 仓库：提交历史、差异、分支与文件内容。',
    descriptionEn: 'Gives ChatGPT read access to a Git repo: history, diffs, branches and file contents.',
    abilities: ['查看提交历史与差异', '搜索仓库内容', '读取分支与工作区状态'],
    abilitiesEn: ['Reads commit history and diffs', 'Searches repository contents', 'Shows branches and working tree state'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'uvx',
    package: 'mcp-server-git',
    args: ['--repository', '%USERPROFILE%\\Documents'],
    hint: '默认指向"文档"下的仓库；装好后把它改成你自己的 Git 仓库路径。',
    hintEn: 'Points at a repo under Documents by default; change it to your own repo path.',
    serverDescription: 'Git 仓库读取（组件市场安装）',
  },
  {
    id: 'sqlite',
    title: 'SQLite 数据库',
    titleEn: 'SQLite database',
    description: '让 ChatGPT 直接查询和修改 SQLite 数据库文件，做数据探索。',
    descriptionEn: 'Query and modify a SQLite database file directly from ChatGPT.',
    abilities: ['执行 SQL 查询与聚合', '浏览表结构和字段', '写入、更新与分析数据'],
    abilitiesEn: ['Runs SQL queries and aggregates', 'Explores tables and columns', 'Writes, updates and analyses data'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'uvx',
    package: 'mcp-server-sqlite',
    args: ['--db-path', '%USERPROFILE%\\Documents\\mcphelm.db'],
    hint: '默认库文件是"文档\\mcphelm.db"；换成你自己的 .db 路径即可。',
    hintEn: 'Defaults to Documents\\mcphelm.db; point it at your own .db file instead.',
    serverDescription: 'SQLite 数据库（组件市场安装）',
  },
  {
    id: 'sequential-thinking',
    title: 'Sequential Thinking 分步推理',
    titleEn: 'Sequential thinking',
    description: '让 ChatGPT 把复杂问题拆成可修改的多步推演，中途能回溯和修正。',
    descriptionEn: 'Breaks hard problems into revisable step-by-step reasoning with backtracking.',
    abilities: ['把难题拆成多步推演', '中途修正与回溯思路', '输出可检查的推理过程'],
    abilitiesEn: ['Splits hard problems into steps', 'Revises and backtracks mid-way', 'Produces an inspectable reasoning trail'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-sequential-thinking',
    serverDescription: 'Sequential Thinking 分步推理（组件市场安装）',
  },
  {
    id: 'duckduckgo',
    title: 'DuckDuckGo 联网搜索',
    titleEn: 'DuckDuckGo web search',
    description: '给 ChatGPT 一双"联网的眼睛"：关键词搜索网页并抓取结果摘要。',
    descriptionEn: 'Gives ChatGPT live web search: keyword results plus extracted page content.',
    abilities: ['关键词搜索网页结果', '抓取结果正文摘要', '免 API Key 开箱即用'],
    abilitiesEn: ['Keyword web search', 'Fetches and summarises result pages', 'Works without any API key'],
    source: { repo: 'nickclyde/duckduckgo-mcp-server', license: 'MIT', url: 'https://github.com/nickclyde/duckduckgo-mcp-server' },
    stars: 1523,
    kind: 'stdio',
    runner: 'uvx',
    package: 'duckduckgo-mcp-server',
    hint: '免费接口偶发限流，密集使用可能被暂时拦截。',
    hintEn: 'The free endpoint rate-limits; heavy use may be blocked temporarily.',
    serverDescription: 'DuckDuckGo 联网搜索（组件市场安装）',
  },
  {
    id: 'arxiv',
    title: 'arXiv 论文检索',
    titleEn: 'arXiv paper search',
    description: '搜索 arXiv 论文、下载全文并转成 Markdown 让 ChatGPT 精读。',
    descriptionEn: 'Searches arXiv, downloads papers and converts full text to Markdown for close reading.',
    abilities: ['按关键词检索论文', '下载并解析论文全文', '管理待读论文列表'],
    abilitiesEn: ['Keyword search across arXiv', 'Downloads and parses full text', 'Keeps a reading list'],
    source: { repo: 'blazickjp/arxiv-mcp-server', license: 'Apache-2.0', url: 'https://github.com/blazickjp/arxiv-mcp-server' },
    stars: 3196,
    kind: 'stdio',
    runner: 'uvx',
    package: 'arxiv-mcp-server',
    hint: '首次下载并转写论文较慢，需要联网拉 PDF。',
    hintEn: 'First download and conversion is slow — it pulls the PDF over the network.',
    serverDescription: 'arXiv 论文检索（组件市场安装）',
  },
  {
    id: 'obsidian',
    title: 'Obsidian 笔记库',
    titleEn: 'Obsidian vault',
    description: '让 ChatGPT 搜索、读取和新建你 Obsidian 库里的笔记。',
    descriptionEn: 'Search, read and create notes in your Obsidian vault.',
    abilities: ['按关键词搜索笔记', '读取单篇笔记全文', '列出目录并新建笔记'],
    abilitiesEn: ['Searches notes by keyword', 'Reads a full note', 'Lists folders and creates notes'],
    source: { repo: 'StevenStavrakis/obsidian-mcp', license: 'MIT', url: 'https://github.com/StevenStavrakis/obsidian-mcp' },
    stars: 739,
    kind: 'stdio',
    runner: 'npx',
    package: 'obsidian-mcp',
    args: ['%USERPROFILE%\\Documents\\Obsidian'],
    hint: '默认指向"文档\\Obsidian"；装好后改成你自己笔记库的路径。',
    hintEn: 'Defaults to Documents\\Obsidian; change it to your own vault path.',
    serverDescription: 'Obsidian 笔记库（组件市场安装）',
  },
  {
    id: 'everything',
    title: 'Everything 官方自检',
    titleEn: 'Everything self-test',
    description: '官方"全家桶"示例服务器：一次挂上所有演示工具，用来验证隧道是否真的通了。',
    descriptionEn: 'The official demo server: every sample tool in one place, handy for testing a tunnel.',
    abilities: ['官方示例服务器全部工具', '验证隧道与客户端是否连通', '排查连接类问题'],
    abilitiesEn: ['All official sample tools at once', 'Proves the tunnel and client are wired up', 'Helps debug connection problems'],
    source: { repo: 'modelcontextprotocol/servers', license: 'MIT', url: 'https://github.com/modelcontextprotocol/servers' },
    stars: 91042,
    kind: 'stdio',
    runner: 'npx',
    package: '@modelcontextprotocol/server-everything',
    serverDescription: 'Everything 官方自检（组件市场安装）',
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
