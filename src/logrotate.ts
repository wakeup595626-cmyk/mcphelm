/**
 * 日志轮转（logrotate）。
 *
 * 隧道日志此前只追加、不上限，长期挂着会把日志文件越养越大。
 * 这里提供两件事：
 *   - rotateLogIfNeeded：日志超过单文件上限时把旧内容改名存档（xxx.1.log），新内容从头写；
 *   - pruneLogs：启动面板/CLI 时清理超出保留份数的旧存档，避免目录无限膨胀。
 */
import { readdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileExists } from './util.ts';

export const DEFAULT_MAX_LOG_BYTES = 5 * 1024 * 1024;
export const DEFAULT_KEEP_ARCHIVES = 3;

export interface RotateResult {
  rotated: boolean;
  archivedTo?: string;
  sizeBefore?: number;
}

/** 日志超过上限时轮转成 <name>.1.log，返回是否发生了轮转 */
export function rotateLogIfNeeded(logFile: string, maxBytes = DEFAULT_MAX_LOG_BYTES): RotateResult {
  if (!fileExists(logFile)) return { rotated: false };
  let size = 0;
  try {
    size = statSync(logFile).size;
  } catch {
    return { rotated: false };
  }
  if (size < maxBytes) return { rotated: false, sizeBefore: size };
  const archive = logFile.replace(/\.log$/, '') + '.1.log';
  try {
    renameSync(logFile, archive);
  } catch {
    // 日志正被占用改不了名时，本轮放弃，下次启动再试
    return { rotated: false, sizeBefore: size };
  }
  return { rotated: true, archivedTo: archive, sizeBefore: size };
}

/** 清理日志目录里超出保留份数的旧存档（*.N.log），返回删除的文件数 */
export function pruneLogs(logsDir: string, keepArchives = DEFAULT_KEEP_ARCHIVES): number {
  let removed = 0;
  let names: string[] = [];
  try {
    names = readdirSync(logsDir);
  } catch {
    return 0;
  }
  // 按隧道名分组，只处理 .N.log 形式的存档
  const groups = new Map<string, { n: number; file: string }[]>();
  for (const name of names) {
    const m = /^(.+)\.(\d+)\.log$/.exec(name);
    if (!m) continue;
    const base = m[1] ?? '';
    const n = Number(m[2] ?? '0');
    const list = groups.get(base) ?? [];
    list.push({ n, file: name });
    groups.set(base, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.n - a.n);
    for (const item of list.slice(keepArchives)) {
      try {
        unlinkSync(join(logsDir, item.file));
        removed += 1;
      } catch {
        // 删除失败不影响其余文件
      }
    }
  }
  return removed;
}

/** 供医生检查用：统计日志目录占用与最大单文件，超限时给出提示 */
export function logsUsage(logsDir: string): { totalBytes: number; largestFile: string | null; largestBytes: number } {
  let total = 0;
  let largest = 0;
  let largestFile: string | null = null;
  try {
    for (const name of readdirSync(logsDir)) {
      if (!name.endsWith('.log')) continue;
      try {
        const size = statSync(join(logsDir, name)).size;
        total += size;
        if (size > largest) {
          largest = size;
          largestFile = basename(name);
        }
      } catch {
        // 单个文件读不到就跳过
      }
    }
  } catch {
    return { totalBytes: 0, largestFile: null, largestBytes: 0 };
  }
  return { totalBytes: total, largestFile, largestBytes: largest };
}
