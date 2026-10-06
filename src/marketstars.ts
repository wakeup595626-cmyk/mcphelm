/**
 * 组件市场的星标数字：内置快照 + 联网刷新缓存。
 *
 * components.ts 里的 stars 是打包那一刻的快照（见 STARS_SNAPSHOT_AT），
 * 面板打开组件市场时会顺带问一次 GitHub，把真实数字写进数据根 cache 下复用；
 * 问不到（离线 / 限流 / 仓库改名）就继续用快照，界面永远不会空着，也不会卡住。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface StarsCache {
  /** 抓取时间（ISO 字符串） */
  at: string;
  /** 仓库全名（owner/repo） → star 数 */
  repos: Record<string, number>;
}

/** 缓存有效期 6 小时：GitHub 未授权接口每小时 60 次，十几个仓库刷新一次远远够用 */
export const STARS_TTL_MS = 6 * 60 * 60 * 1000;

export function readStarsCache(file: string): StarsCache | null {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as StarsCache;
    if (!parsed || typeof parsed !== 'object' || !parsed.repos || typeof parsed.repos !== 'object') return null;
    return { at: String(parsed.at ?? ''), repos: parsed.repos };
  } catch {
    return null;
  }
}

export function starsCacheFresh(cache: StarsCache | null, now = Date.now()): boolean {
  if (!cache) return false;
  const at = Date.parse(cache.at);
  return Number.isFinite(at) && now - at >= 0 && now - at < STARS_TTL_MS;
}

export function writeStarsCache(file: string, repos: Record<string, number>, now = new Date()): StarsCache {
  const cache: StarsCache = { at: now.toISOString(), repos };
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(cache, null, 2), 'utf8');
  } catch {
    /* 写不进去（只读目录等）不影响显示，下次再算 */
  }
  return cache;
}

/** 拉单个仓库的 star 数；任何异常都返回 null，绝不抛给调用方 */
export async function fetchRepoStars(repo: string, timeoutMs = 8000): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.github.com/repos/' + repo, {
      headers: { 'user-agent': 'MCPHelm', accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { stargazers_count?: unknown };
    const n = body?.stargazers_count;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 串行刷新一批仓库（串行是为了不去撞 GitHub 的并发/限流）。
 * 只要有一个成功就写缓存，失败的那些保留上一次的旧值。
 */
export async function refreshStars(
  repos: string[],
  file: string,
  previous: StarsCache | null = null,
  timeoutMs = 8000
): Promise<{ ok: boolean; cache: StarsCache | null }> {
  const merged: Record<string, number> = { ...(previous?.repos ?? {}) };
  let ok = false;
  for (const repo of repos) {
    const stars = await fetchRepoStars(repo, timeoutMs);
    if (stars !== null) {
      merged[repo] = stars;
      ok = true;
    }
  }
  if (!ok) return { ok: false, cache: previous };
  return { ok: true, cache: writeStarsCache(file, merged) };
}

/** 12345 → 12.3k；小于 1000 原样显示 */
export function formatStars(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n / 1000) + 'k';
}
