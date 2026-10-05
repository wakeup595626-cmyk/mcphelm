/**
 * 面板访问口令。
 *
 * 面板虽然只监听 127.0.0.1，但本机任何网页都可能对它发请求（DNS rebinding、
 * 恶意页面里的表单/图片请求）。口令机制确保：只有从 MCPHelm 自己打开的页面
 * 才能调用 API——口令写进 URL 的 #token，前端每次请求都带上，服务器逐个校验。
 * 口令不落盘、不进日志；用户也可以在 config.ui.token 里固定一个自己的口令。
 */
import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 18;

export function generatePanelToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** 从请求里提取口令：URL 查询参数或自定义请求头 */
export function extractToken(url: URL, headers: Record<string, unknown>): string | null {
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery;
  const fromHeader = headers['x-mcphelm-token'];
  if (typeof fromHeader === 'string' && fromHeader) return fromHeader;
  return null;
}
