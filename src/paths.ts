import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { BRAND } from './brand.ts';
import { ensureDir, expandHome, fileExists } from './util.ts';

export type ConfigScope = 'explicit' | 'project' | 'home' | 'missing';

export interface AppPaths {
  cwd: string;
  home: string;
  configFile: string;
  configScope: ConfigScope;
  configDir: string;
  runDir: string;
  logsDir: string;
  binDir: string;
}

export interface PathOptions {
  cwd?: string;
  configFlag?: string;
  env?: NodeJS.ProcessEnv;
}

export function envKey(suffix: string): string {
  return BRAND.envPrefix + '_' + suffix;
}

export function resolvePaths(opts: PathOptions = {}): AppPaths {
  const env = opts.env ?? process.env;
  const cwd = resolve(opts.cwd ?? process.cwd());
  const explicitHome = env[envKey('HOME')];
  const home = explicitHome ? resolve(expandHome(explicitHome)) : join(homedir(), BRAND.homeDirName);

  const flag = opts.configFlag ?? env[envKey('CONFIG')];
  const projectFile = join(cwd, BRAND.configFileName);
  const homeFile = join(home, 'config.json');

  let configFile: string;
  let configScope: ConfigScope;
  if (flag) {
    configFile = isAbsolute(flag) ? flag : resolve(cwd, flag);
    configScope = 'explicit';
  } else if (fileExists(projectFile)) {
    configFile = projectFile;
    configScope = 'project';
  } else {
    configFile = homeFile;
    configScope = fileExists(homeFile) ? 'home' : 'missing';
  }

  return {
    cwd,
    home,
    configFile,
    configScope,
    configDir: dirname(configFile),
    runDir: join(home, 'run'),
    logsDir: join(home, 'logs'),
    binDir: join(home, 'bin'),
  };
}

export function ensureRuntimeDirs(paths: AppPaths): void {
  ensureDir(paths.home);
  ensureDir(paths.runDir);
  ensureDir(paths.logsDir);
  ensureDir(paths.binDir);
}

export function sanitizeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_');
}

export function stateFileFor(paths: AppPaths, tunnelName: string): string {
  return join(paths.runDir, sanitizeName(tunnelName) + '.json');
}

export function logFileFor(paths: AppPaths, tunnelName: string): string {
  return join(paths.logsDir, sanitizeName(tunnelName) + '.log');
}

export function describeConfigScope(scope: ConfigScope): string {
  switch (scope) {
    case 'explicit':
      return '命令行 --config 指定';
    case 'project':
      return '当前目录项目配置';
    case 'home':
      return '用户主目录配置';
    default:
      return '尚未创建';
  }
}
