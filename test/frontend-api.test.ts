/*
 * 面板前端调用点与后端路由方法的静态一致性测试。
 *
 * 背景：面板的 api() 帮助函数在「没传第二个参数」时会退化成浏览器原生 GET。
 * 0.1.3 修复的缺陷（组件市场点「安装」报「未知接口：GET /api/components/:id/install」，
 * 隧道启停/删除、服务器删除等无参数写操作按钮同样失效）就是调用点漏写 method 触发的。
 * 这里把这个缺陷类型钉死在测试里：
 *   1. app.js 中每个 api(...) 调用都必须显式声明 method；
 *   2. 声明的 method 必须能匹配到 server.ts 里同方法的真实路由。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(join(root, 'src', 'panel', 'web', 'app.js'), 'utf8');
const serverSource = readFileSync(join(root, 'src', 'panel', 'server.ts'), 'utf8');

type CallSite = { line: number; method: string | null; pathTemplate: string; snippet: string };
type Route = { method: string; pathTemplate: string };

const PLACEHOLDER = '\u0001';
const BACKTICK = String.fromCharCode(96);

function isQuote(ch: string): boolean {
  return ch === "'" || ch === '"' || ch === BACKTICK;
}

function skipString(source: string, start: number): number {
  const quote = source[start] as string;
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i] as string;
    if (ch === '\\') { i += 2; continue; }
    if (ch === quote) return i + 1;
    i += 1;
  }
  return i;
}

function readBalanced(source: string, openIndex: number): { text: string; end: number } {
  let depth = 0;
  let i = openIndex;
  while (i < source.length) {
    const ch = source[i] as string;
    if (isQuote(ch)) { i = skipString(source, i); continue; }
    if (ch === '/' && source[i + 1] === '/') { while (i < source.length && source[i] !== '\n') i += 1; continue; }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return { text: source.slice(openIndex + 1, i), end: i + 1 };
    }
    i += 1;
  }
  throw new Error('括号未闭合，位置 ' + openIndex);
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i] as string;
    if (isQuote(ch)) {
      const end = skipString(text, i);
      cur += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    else if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; i += 1; continue; }
    cur += ch;
    i += 1;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

function buildTemplate(expr: string): string {
  let out = '';
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i] as string;
    if (isQuote(ch)) {
      const end = skipString(expr, i);
      out += expr.slice(i + 1, end - 1);
      i = end;
      continue;
    }
    out += PLACEHOLDER;
    i += 1;
  }
  const pathOnly = out.split('?')[0] ?? out;
  return pathOnly.replace(/\u0001+/g, ':x');
}

function extractCallSites(source: string): CallSite[] {
  const sites: CallSite[] = [];
  const re = /(^|[^\w$.])api\s*\(/g;
  let m: RegExpExecArray | null = re.exec(source);
  while (m) {
    const openIndex = m.index + m[0].length - 1;
    const head = source.slice(Math.max(0, m.index - 40), m.index + m[0].length);
    if (!/function\s+api\s*\($/.test(head)) {
      const { text, end } = readBalanced(source, openIndex);
      const methodMatch = /\bmethod\s*:\s*'([A-Z]+)'/.exec(text);
      const firstArg = splitTopLevel(text)[0] ?? '';
      sites.push({
        line: source.slice(0, openIndex).split('\n').length,
        method: methodMatch ? (methodMatch[1] as string) : null,
        pathTemplate: buildTemplate(firstArg),
        snippet: text.replace(/\s+/g, ' ').slice(0, 70),
      });
      re.lastIndex = end;
    }
    m = re.exec(source);
  }
  return sites;
}

function regexBodyToTemplate(body: string): string {
  return body
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\\\//g, '/')
    .replace(/\([^)]*\)/g, ':x');
}

function extractRoutes(source: string): Route[] {
  const lines = source.split('\n');
  const varTemplates = new Map<string, string>();
  for (const line of lines) {
    const m = /const (\w+Match) = \/(.+)\/\.exec\(path\)/.exec(line);
    if (m) varTemplates.set(m[1] as string, regexBodyToTemplate(m[2] as string));
  }
  const routes: Route[] = [];
  for (const line of lines) {
    const exact = /if \(method === '(GET|POST)' && path === '([^']+)'\)/.exec(line);
    if (exact) {
      routes.push({ method: exact[1] as string, pathTemplate: exact[2] as string });
      continue;
    }
    const byVar = /if \(method === '(GET|POST)' && (\w+)\)/.exec(line);
    if (byVar) {
      const tpl = varTemplates.get(byVar[2] as string);
      if (tpl) routes.push({ method: byVar[1] as string, pathTemplate: tpl });
    }
  }
  return routes;
}

function matchTemplate(front: string, back: string): boolean {
  const a = front.split('/');
  const b = back.split('/');
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const seg = a[i] as string;
    const route = b[i] as string;
    if (route === ':x' || seg === ':x' || seg === route) continue;
    if (seg.endsWith(':x') && route.startsWith(seg.slice(0, -2))) continue;
    return false;
  }
  return true;
}

describe('面板前端调用点与后端路由方法一致', () => {
  const sites = extractCallSites(appSource);
  const routes = extractRoutes(serverSource);

  it('扫描器能提取到调用点与后端路由（防止解析失效导致空跑）', () => {
    assert.ok(sites.length >= 20, '提取到的 api() 调用点过少：' + sites.length);
    assert.ok(routes.length >= 20, '提取到的后端路由过少：' + routes.length);
  });

  it('每个 api() 调用点都显式声明了 method', () => {
    const missing = sites.filter((s) => s.method === null);
    assert.equal(
      missing.length,
      0,
      '以下调用点没写 method（缺省会退化成 GET，写接口会报「未知接口」）：\n' +
        missing.map((s) => s.line + ' 行: api(' + s.snippet + ')').join('\n'),
    );
  });

  it('声明的方法与后端真实路由一致', () => {
    const problems: string[] = [];
    for (const s of sites) {
      if (s.method === null) continue;
      const matched = routes.filter((r) => matchTemplate(s.pathTemplate, r.pathTemplate));
      if (matched.length === 0) {
        problems.push(s.line + ' 行: 找不到与 ' + s.method + ' ' + s.pathTemplate + ' 匹配的后端路由');
        continue;
      }
      const methods = Array.from(new Set(matched.map((r) => r.method)));
      if (!methods.includes(s.method)) {
        problems.push(s.line + ' 行: ' + s.pathTemplate + ' 的后端方法是 ' + methods.join('/') + '，前端却用了 ' + s.method);
      }
    }
    assert.equal(problems.length, 0, problems.join('\n'));
  });
});

