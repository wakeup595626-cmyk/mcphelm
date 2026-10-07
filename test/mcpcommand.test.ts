import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import test from 'node:test';
import {
  escapeForTunnelClient,
  expandEnvVars,
  firstToken,
  installHintFor,
  looksLikePath,
  mergePathDirs,
  resolveCommand,
  tunnelCommandString,
  wellKnownBinDirs,
} from '../src/mcpcommand.ts';

const WIN = process.platform === 'win32';

/** 造一份 Windows 风格的进程环境（测试里不碰真实系统） */
function winEnv(pathValue: string): NodeJS.ProcessEnv {
  return { PATH: pathValue, PATHEXT: '.COM;.EXE;.BAT;.CMD' };
}

test('firstToken：引号路径、单引号、普通命令都取第一段', () => {
  assert.equal(firstToken('uvx windows-mcp'), 'uvx');
  assert.equal(firstToken('  npx   -y demo  '), 'npx');
  assert.equal(firstToken('"C:\\Program Files\\tool.exe" --run'), 'C:\\Program Files\\tool.exe');
  assert.equal(firstToken("'/opt/my tool/run' --x"), '/opt/my tool/run');
  assert.equal(firstToken(''), '');
});

test('looksLikePath：路径写法与裸命令名区分开', () => {
  assert.equal(looksLikePath('C:\\tools\\x.exe'), true);
  assert.equal(looksLikePath('./bin/x'), true);
  assert.equal(looksLikePath('/usr/local/bin/x'), true);
  assert.equal(looksLikePath('uvx'), false);
  assert.equal(looksLikePath('npx.cmd'), false);
});

test('resolveCommand：命令在 PATH 里 → 直接用 PATH 命中', () => {
  const dir = join('C:', 'nodejs');
  const res = resolveCommand('node --version', {
    platform: 'win32',
    env: winEnv(dir),
    home: join('C:', 'Users', 'demo'),
    binDirs: [],
    isFile: (p) => p.toLowerCase() === join(dir, 'node.exe').toLowerCase(),
  });
  assert.equal(res.ok, true);
  assert.equal(res.source, 'path');
  assert.equal(dirname(res.path ?? ''), dir);
  assert.deepEqual(res.pathDirs, []);
});

test('resolveCommand：命令只在常见安装目录里 → 记下目录，启动时自动补 PATH（真机 uvx 事故）', () => {
  const home = join('C:', 'Users', 'demo');
  const uvDir = join(home, '.local', 'bin');
  const res = resolveCommand('uvx windows-mcp', {
    platform: 'win32',
    env: winEnv('C:\\Windows\\System32'),
    home,
    binDirs: [uvDir],
    isDir: (p) => p === uvDir,
    isFile: (p) => p.toLowerCase() === join(uvDir, 'uvx.exe').toLowerCase(),
  });
  assert.equal(res.ok, true);
  assert.equal(res.source, 'wellknown');
  assert.equal(res.token, 'uvx');
  assert.equal(dirname(res.path ?? ''), uvDir);
  assert.deepEqual(res.pathDirs, [uvDir]);
});

test('resolveCommand：完全找不到时给人话原因 + 修复建议，而不是等隧道崩溃', () => {
  const res = resolveCommand('uvx windows-mcp', {
    platform: 'win32',
    env: winEnv(''),
    home: join('C:', 'Users', 'demo'),
    binDirs: [join('C:', 'Users', 'demo', '.local', 'bin')],
    isDir: () => false,
    isFile: () => false,
  });
  assert.equal(res.ok, false);
  assert.equal(res.source, 'missing');
  assert.match(res.error ?? '', /uvx/);
  assert.match(res.hint ?? '', /uv/);
  assert.equal(res.path, null);
});

test('resolveCommand：命令写的是绝对路径但文件不存在 → 提示检查路径', () => {
  const res = resolveCommand('C:\\tools\\missing.exe --flag', {
    platform: 'win32',
    env: winEnv(''),
    isFile: () => false,
  });
  assert.equal(res.ok, false);
  assert.match(res.error ?? '', /missing\.exe/);
  assert.match(res.hint ?? '', /路径|可执行文件/);
});

test('resolveCommand：空命令直接说清楚，不进入启动流程', () => {
  const res = resolveCommand('   ', { platform: 'win32', env: winEnv(''), isFile: () => false });
  assert.equal(res.ok, false);
  assert.equal(res.token, '');
  assert.match(res.hint ?? '', /启动命令/);
});

test('Windows 上按 PATHEXT 展开候选名（大小写都试）', () => {
  const dir = join('C:', 'Users', 'demo', '.local', 'bin');
  const upper = join(dir, 'UVX.EXE');
  /* 真实 Windows 文件系统不区分大小写，这里用不敏感比较模拟 */
  const res = resolveCommand('uvx', {
    platform: 'win32',
    env: winEnv(''),
    home: join('C:', 'Users', 'demo'),
    binDirs: [dir],
    isDir: (p) => p === dir,
    isFile: (p) => p.toLowerCase() === upper.toLowerCase(),
  });
  assert.equal(res.ok, true);
  assert.equal((res.path ?? '').toLowerCase(), upper.toLowerCase());
  /* 裸命令名必须经过 PATHEXT 展开才可能命中 */
  assert.notEqual(res.path, join(dir, 'uvx'));
});

test('wellKnownBinDirs：Windows 覆盖 uv / npm / pipx / cargo 这些默认落点', () => {
  const home = join('C:', 'Users', 'demo');
  const dirs = wellKnownBinDirs('win32', { APPDATA: join(home, 'AppData', 'Roaming'), LOCALAPPDATA: join(home, 'AppData', 'Local') }, home);
  assert.ok(dirs.includes(join(home, '.local', 'bin')));
  assert.ok(dirs.includes(join(home, 'AppData', 'Roaming', 'npm')));
  assert.ok(dirs.includes(join(home, '.cargo', 'bin')));
});

test('mergePathDirs：补目录时去重、去空、Windows 忽略大小写', () => {
  const dirA = join('C:', 'nodejs');
  const dirB = join('C:', 'Users', 'demo', '.local', 'bin');
  const merged = mergePathDirs(dirA + delimiter + dirB + delimiter + '  ', [dirB.toUpperCase(), join('C:', 'extra')], 'win32');
  const parts = merged.split(delimiter);
  assert.deepEqual(parts.slice(0, 2), [dirA, dirB]);
  const keys = parts.map((p) => p.toLowerCase().replace(/[\\/]+$/, ''));
  assert.equal(new Set(keys).size, keys.length, '不该出现重复目录');
  assert.ok(keys.includes(join('C:', 'extra').toLowerCase()));
});

test('mergePathDirs：没有原 PATH 时也能直接用传入目录组装', () => {
  const dir = join('C:', 'Users', 'demo', '.local', 'bin');
  assert.equal(mergePathDirs(undefined, [dir], 'win32'), dir);
  assert.equal(mergePathDirs('', [], 'win32'), '');
});

test('installHintFor：按工具给出对应的安装指引', () => {
  assert.match(installHintFor('uvx'), /uv/);
  assert.match(installHintFor('npx'), /Node\.js|nodejs/);
  assert.match(installHintFor('python.exe'), /Python/);
  assert.match(installHintFor('bunx'), /Bun/);
  assert.match(installHintFor('some-weird-tool'), /完整路径/);
});

test('resolveCommand 能读真实文件系统：临时目录里的可执行文件会被认出来', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-cmd-'));
  try {
    const exe = join(dir, 'fake-mcp-tool.exe');
    writeFileSync(exe, '');
    const res = resolveCommand('fake-mcp-tool', {
      platform: process.platform,
      env: { PATH: '', PATHEXT: '.EXE' },
      home: dir,
      binDirs: [dir],
      isDir: (p) => p === dir,
      isFile: (p) => p === exe,
    });
    assert.equal(res.ok, true);
    assert.equal(res.path, exe);
    assert.ok(process.platform === 'win32' || res.source === 'wellknown');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveCommand 的目录探测在真实 Windows 路径上不会抛异常', () => {
  if (!WIN) return;
  const dir = mkdtempSync(join(tmpdir(), 'mcphelm-cmd2-'));
  try {
    mkdirSync(join(dir, 'bin'));
    const res = resolveCommand('definitely-not-installed-tool-xyz', { binDirs: [join(dir, 'bin')], isFile: () => false });
    assert.equal(res.ok, false);
    assert.match(res.hint ?? '', /完整路径|安装/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * 按真机实测的 tunnel-client 拆分规则还原 argv：
 * 反斜杠是转义符（引号内外都是），单引号内原样保留，引号内的空格不分词。
 * 这里用它把「我们写进 --mcp.command 的字符串」还原成子进程真正收到的 argv。
 */
function splitLikeTunnelClient(input: string): string[] {
  const out: string[] = [];
  let cur = '';
  let started = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i] as string;
    if (quote === "'") {
      if (ch === "'") quote = null;
      else cur += ch;
      continue;
    }
    if (quote === '"' && ch === '"') {
      /* 双引号内的空格不分词，关引号时才结束 */
      quote = null;
      continue;
    }
    if (ch === '\\') {
      const next = input[i + 1];
      if (next === undefined) cur += '\\';
      else {
        cur += next;
        i += 1;
      }
      started = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      continue;
    }
    if (quote === null && /\s/.test(ch)) {
      if (started) {
        out.push(cur);
        cur = '';
        started = false;
      }
      continue;
    }
    cur += ch;
    started = true;
  }
  if (started) out.push(cur);
  return out;
}

test('expandEnvVars：展开 %NAME%，Windows 下大小写不敏感', () => {
  const env: NodeJS.ProcessEnv = { USERPROFILE: 'C:\\Users\\demo' };
  assert.equal(expandEnvVars('uvx x --db-path %USERPROFILE%\\data.db', env, 'win32'), 'uvx x --db-path C:\\Users\\demo\\data.db');
  assert.equal(expandEnvVars('uvx x --db-path %userprofile%\\data.db', env, 'win32'), 'uvx x --db-path C:\\Users\\demo\\data.db');
  assert.equal(expandEnvVars('npx -y x "%USERPROFILE%\\Documents"', env, 'win32'), 'npx -y x "C:\\Users\\demo\\Documents"');
});

test('expandEnvVars：值里有空格且不在引号内时自动补引号，认不出的变量原样保留', () => {
  const env: NodeJS.ProcessEnv = { MY_DIR: 'C:\\Program Files\\demo' };
  assert.equal(expandEnvVars('run %MY_DIR%\\tool.exe', env, 'win32'), 'run "C:\\Program Files\\demo"\\tool.exe');
  assert.equal(expandEnvVars('run "%MY_DIR%\\tool.exe"', env, 'win32'), 'run "C:\\Program Files\\demo\\tool.exe"');
  assert.equal(expandEnvVars('run %NO_SUCH_VAR_AT_ALL%\\x', env, 'win32'), 'run %NO_SUCH_VAR_AT_ALL%\\x');
  assert.equal(expandEnvVars('run ${MY_DIR}/tool', env, 'linux'), 'run "C:\\Program Files\\demo"/tool');
});

test('escapeForTunnelClient：单引号外的反斜杠复制一份，单引号内原样', () => {
  assert.equal(escapeForTunnelClient('uvx x --db-path C:\\Users\\demo\\a.db'), 'uvx x --db-path C:\\\\Users\\\\demo\\\\a.db');
  assert.equal(escapeForTunnelClient("npx -y x 'C:\\Users\\demo'"), "npx -y x 'C:\\Users\\demo'");
  assert.equal(escapeForTunnelClient('uvx windows-mcp serve'), 'uvx windows-mcp serve');
});

test('回归（真机事故）：未转义的 Windows 路径会被 tunnel-client 吃掉反斜杠', () => {
  const broken = 'uvx mcp-server-sqlite --db-path C:\\Users\\demo\\mcphelm.db';
  assert.deepEqual(splitLikeTunnelClient(broken), ['uvx', 'mcp-server-sqlite', '--db-path', 'C:Usersdemomcphelm.db']);
});

test('修复后：变量展开 + 转义后，子进程拿到的是完整 Windows 路径（带空格也不怕）', () => {
  const env: NodeJS.ProcessEnv = { USERPROFILE: 'C:\\Users\\demo' };
  const full = tunnelCommandString('uvx mcp-server-sqlite --db-path "%USERPROFILE%\\Documents\\mcphelm.db"', env, 'win32');
  assert.deepEqual(splitLikeTunnelClient(full), ['uvx', 'mcp-server-sqlite', '--db-path', 'C:\\Users\\demo\\Documents\\mcphelm.db']);
  const spaced = tunnelCommandString('npx -y d "%PROGRAM_FILES%\\My Tool\\run.exe"', { PROGRAM_FILES: 'C:\\Program Files' }, 'win32');
  assert.deepEqual(splitLikeTunnelClient(spaced), ['npx', '-y', 'd', 'C:\\Program Files\\My Tool\\run.exe']);
});

