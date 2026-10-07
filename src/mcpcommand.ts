/**
 * 本地 MCP 命令的可用性探测（0.1.10 新增）。
 *
 * 真实事故：组件市场装了 windows-mcp（命令 `uvx windows-mcp`），本机其实装了 uv，
 * 但它在 %USERPROFILE%\.local\bin —— 这个目录不在 PATH 里。tunnel-client 拉起本地
 * MCP 子进程时报 `exec: "uvx": executable file not found in %PATH%`，0.1 秒就退出，
 * 守护进程重试 5 次后放弃，面板只留一句「状态残留」，用户完全看不出发生了什么。
 *
 * 所以这里做两件事：
 * 1) 启动隧道前先探测命令能不能找到：找不到就直接给人话错误 + 修复建议，不进崩溃循环；
 * 2) 命令在「常见安装目录」（~/.local/bin、npm 全局目录等）里找到时，把这些目录追加进
 *    子进程 PATH —— 隧道直接能跑，用户不用手工去改系统环境变量。
 */
import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { BRAND } from './brand.ts';

export type CommandSource = 'path' | 'wellknown' | 'literal' | 'missing';

export interface CommandResolution {
  /** 命令的第一个 token（可执行文件那一段） */
  token: string;
  ok: boolean;
  /** 找到的可执行文件绝对路径 */
  path: string | null;
  source: CommandSource;
  /** 需要追加进子进程 PATH 的目录（source === 'wellknown' 时非空） */
  pathDirs: string[];
  error: string | null;
  hint: string | null;
}

export interface ResolveOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  home?: string;
  /** 覆盖「常见安装目录」清单（测试用） */
  binDirs?: string[];
  /** 覆盖文件探测（测试用） */
  isFile?: (path: string) => boolean;
  /** 覆盖目录探测（测试用） */
  isDir?: (path: string) => boolean;
}

function isFileSync(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDirSync(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** 取命令的第一个 token，兼容带引号的写法："C:\path with space\tool.exe" args */
export function firstToken(command: string): string {
  const trimmed = command.trim();
  if (!trimmed) return '';
  const m = /^"([^"]+)"|^'([^']+)'|^(\S+)/.exec(trimmed);
  if (!m) return trimmed;
  return m[1] ?? m[2] ?? m[3] ?? trimmed;
}

/** 命令第一段是否本身就是路径（而不是靠 PATH 找的命令名） */
export function looksLikePath(token: string): boolean {
  return /[\\/]/.test(token) || /^[A-Za-z]:/.test(token);
}

/** 判断字符串某个位置是不是处在引号里（成对规则，够用且可预测） */
function insideQuotesAt(text: string, index: number): boolean {
  let double = false;
  let single = false;
  for (let i = 0; i < index; i += 1) {
    const ch = text[i];
    if (ch === '"' && !single) double = !double;
    else if (ch === "'" && !double) single = !single;
  }
  return double || single;
}

/**
 * 展开命令里的变量（0.1.10 新增）。
 *
 * 为什么必须自己展开：tunnel-client 是 Go 写的，拿到 --mcp.command 后直接按空格拆分、
 * 原样交给 CreateProcess，**不会**经过 cmd.exe，所以 %USERPROFILE% 这类变量会以字面量
 * 传给子进程。真机日志里 git / sqlite / obsidian 三个组件就是这么崩的：
 * mcp-server-git 收到的仓库路径是字面量 "%USERPROFILE%\Documents"。
 *
 * 支持 Windows 风格 %NAME%（大小写不敏感，与系统一致），以及类 Unix 的
 * 「美元符号 + 花括号」写法；认不出的变量原样保留（让用户看得见自己写错了）；
 * 值里带空格又不在引号里时自动补双引号。
 */
export function expandEnvVars(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): string {
  if (!command.includes('%') && !command.includes('$')) return command;
  const lookup = (name: string): string | null => {
    if (!name) return null;
    if (platform === 'win32') {
      const wanted = name.toUpperCase();
      for (const [key, value] of Object.entries(env)) {
        if (key.toUpperCase() === wanted && typeof value === 'string') return value;
      }
      return null;
    }
    const value = env[name];
    return typeof value === 'string' ? value : null;
  };
  return command.replace(
    /%([A-Za-z_][A-Za-z0-9_]*)%|\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
    (raw: string, winName: string | undefined, shName: string | undefined, offset: number): string => {
      const value = lookup(winName ?? shName ?? '');
      if (value === null) return raw;
      if (/[\s"]/.test(value) && !insideQuotesAt(command, offset)) return '"' + value + '"';
      return value;
    }
  );
}

/**
 * 让命令安全穿过 tunnel-client 的参数拆分器（0.1.10 新增）。
 *
 * 真机实测（tunnel-client-runtime，Windows）：它用一个 shell 风格的拆分器解析
 * --mcp.command 的字符串，**反斜杠被当成转义符吃掉**：
 *   C:\Users\me\Documents                 → C:UsersmeDocuments          （路径全毁）
 *   "C:\Program Files\Some Dir\tool.exe"  → C:Program FilesSome Dirtool.exe
 *   C:\\Users\\me\\Documents              → C:\Users\me\Documents        （正确）
 *   'C:\Users\me\Documents'               → C:\Users\me\Documents        （单引号内不转义）
 * 所以把「单引号之外」的反斜杠一律复制一份：子进程最终拿到的就是原样的 Windows 路径。
 * 这是对拆分器行为的精确逆运算，不做正斜杠转换，不改变用户写下的路径语义。
 */
export function escapeForTunnelClient(command: string): string {
  if (!command.includes('\\')) return command;
  let out = '';
  let single = false;
  for (const ch of command) {
    if (ch === "'") {
      single = !single;
      out += ch;
      continue;
    }
    if (ch === '\\' && !single) {
      out += '\\\\';
      continue;
    }
    out += ch;
  }
  return out;
}

/** 写进 --mcp.command 的最终字符串：先展开变量，再转义反斜杠（顺序不能反） */
export function tunnelCommandString(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): string {
  return escapeForTunnelClient(expandEnvVars(command, env, platform));
}

/** 常见安装目录：npx / uvx / python 这类工具的默认落点 */
export function wellKnownBinDirs(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir()
): string[] {
  const dirs: string[] = [];
  const push = (dir: string | undefined): void => {
    if (dir && dir.length > 0) dirs.push(dir);
  };
  if (platform === 'win32') {
    const roaming = env.APPDATA ?? join(home, 'AppData', 'Roaming');
    const local = env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
    /* uv / pipx 的默认落点：这次事故的元凶，就是它没人帮用户加进 PATH */
    push(join(home, '.local', 'bin'));
    push(join(home, '.cargo', 'bin'));
    push(join(roaming, 'npm'));
    push(join(roaming, 'Python', 'Scripts'));
    push(join(local, 'pnpm'));
    push(join(home, 'scoop', 'shims'));
    push(join(home, '.bun', 'bin'));
    push(join(home, 'go', 'bin'));
    push(join(env.ProgramData ?? 'C:\\ProgramData', 'chocolatey', 'bin'));
    push(join(env.ProgramFiles ?? 'C:\\Program Files', 'nodejs'));
  } else {
    push(join(home, '.local', 'bin'));
    push(join(home, '.cargo', 'bin'));
    push(join(home, '.bun', 'bin'));
    push(join(home, 'go', 'bin'));
    push('/usr/local/bin');
    push('/usr/bin');
    if (platform === 'darwin') push('/opt/homebrew/bin');
  }
  return dirs;
}

function pathEntries(env: NodeJS.ProcessEnv): string[] {
  const raw = env.PATH ?? env.Path ?? env.path ?? '';
  return raw
    .split(delimiter)
    .map((item) => item.trim().replace(/^"(.*)"$/, '$1'))
    .filter((item) => item.length > 0);
}

/** Windows 上按 PATHEXT 展开候选名（uvx → uvx.exe / uvx.cmd …） */
function candidateNames(token: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string[] {
  if (platform !== 'win32') return [token];
  if (/\.[A-Za-z0-9]{1,8}$/.test(token)) return [token];
  const exts = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((ext) => ext.trim())
    .filter((ext) => ext.length > 0);
  const names = [token];
  for (const ext of exts) {
    names.push(token + ext.toLowerCase());
    names.push(token + ext.toUpperCase());
  }
  return names;
}

function findInDirs(
  token: string,
  dirs: string[],
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  isFile: (path: string) => boolean
): string | null {
  const names = candidateNames(token, platform, env);
  for (const dir of dirs) {
    for (const name of names) {
      const candidate = join(dir, name);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** 命令装不上时给的人话指引（按常见工具分类） */
export function installHintFor(token: string): string {
  const name = token.replace(/\.(exe|cmd|bat|com)$/i, '').toLowerCase();
  if (name === 'npx' || name === 'npm' || name === 'node') {
    return '这是 Node.js 自带的工具：装好 Node.js 20 或更新版本（https://nodejs.org）后重开 ' + BRAND.name + ' 即可。';
  }
  if (name === 'uvx' || name === 'uv') {
    return (
      'uvx 属于 uv 工具：装好 uv（https://docs.astral.sh/uv/）后重开 ' +
      BRAND.name +
      ' 即可，也可以把命令改成 uvx.exe 的完整路径。'
    );
  }
  if (name === 'python' || name === 'python3' || name === 'py' || name === 'pip' || name === 'pipx') {
    return '这属于 Python：装好 Python 3.10+（https://www.python.org）后重开 ' + BRAND.name + ' 即可。';
  }
  if (name === 'bunx' || name === 'bun') {
    return '这属于 Bun：装好 Bun（https://bun.sh）后重开 ' + BRAND.name + ' 即可。';
  }
  if (name === 'deno') return '装好 Deno（https://deno.com）后重开 ' + BRAND.name + ' 即可。';
  if (name === 'docker') return '装好并启动 Docker Desktop，确认 docker 命令可用后重试。';
  return '确认这个工具已经安装；或者把命令换成可执行文件的完整路径（例如 C:\\Users\\你的用户名\\.local\\bin\\uvx.exe）。';
}

/**
 * 探测一条 stdio 命令能不能跑起来。
 * 顺序：用户直接写的路径 → 系统 PATH → 常见安装目录（找到就自动补齐 PATH）。
 */
export function resolveCommand(command: string, opts: ResolveOptions = {}): CommandResolution {
  const platform = opts.platform ?? process.platform;
  const env = opts.env ?? process.env;
  const home = opts.home ?? homedir();
  const cwd = opts.cwd ?? process.cwd();
  const isFile = opts.isFile ?? isFileSync;
  const isDir = opts.isDir ?? isDirSync;
  /* 变量先展开再探测：用户写 %USERPROFILE%\... 时，要检查的是展开后的真实路径 */
  const token = firstToken(expandEnvVars(command, env, platform));

  const missing = (error: string, hint: string | null): CommandResolution => ({
    token,
    ok: false,
    path: null,
    source: 'missing',
    pathDirs: [],
    error,
    hint,
  });

  if (!token) {
    return missing(
      '本地 MCP 命令是空的，隧道没有东西可以启动',
      '打开「服务器」编辑这一条，填上启动命令，例如：uvx windows-mcp 或 npx -y @playwright/mcp@latest'
    );
  }

  if (looksLikePath(token)) {
    const candidate = isAbsolute(token) ? token : resolve(cwd, token);
    if (isFile(candidate)) {
      return { token, ok: true, path: candidate, source: 'literal', pathDirs: [], error: null, hint: null };
    }
    return missing(
      '命令里的可执行文件不存在：' + token,
      '检查路径有没有写错；也可以直接在「服务器」里改成本机真实存在的可执行文件路径。'
    );
  }

  const onPath = findInDirs(token, pathEntries(env), platform, env, isFile);
  if (onPath) return { token, ok: true, path: onPath, source: 'path', pathDirs: [], error: null, hint: null };

  const dirs = (opts.binDirs ?? wellKnownBinDirs(platform, env, home)).filter((dir) => isDir(dir));
  const inWellKnown = findInDirs(token, dirs, platform, env, isFile);
  if (inWellKnown) {
    return {
      token,
      ok: true,
      path: inWellKnown,
      source: 'wellknown',
      pathDirs: [dirname(inWellKnown)],
      error: null,
      hint: null,
    };
  }

  const error = '本机找不到命令 “' + token + '”（没有安装，或者安装目录不在 PATH 里），隧道启动后会立刻退出';
  const checked = dirs.length > 0 ? '已顺手检查过 ' + dirs.join('、') + ' 这些常用安装目录。' : '';
  return missing(error, installHintFor(token) + checked);
}

/**
 * 把目录追加进 PATH（去重、去末尾斜杠；Windows 上忽略大小写）。
 * 用于：命令在「常见安装目录」里找到时，让 tunnel-client 的子进程也能找到它。
 */
export function mergePathDirs(
  existing: string | undefined,
  dirs: string[],
  platform: NodeJS.Platform = process.platform
): string {
  const key = (value: string): string => {
    const trimmed = value.trim().replace(/[\\/]+$/, '');
    return platform === 'win32' ? trimmed.toLowerCase().replace(/\//g, '\\') : trimmed;
  };
  const current = (existing ?? '')
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const seen = new Set(current.map(key));
  const merged = [...current];
  for (const dir of dirs) {
    const k = key(dir);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    merged.push(dir);
  }
  return merged.join(delimiter);
}
