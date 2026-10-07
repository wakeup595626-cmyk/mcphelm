import { readFileSync } from 'node:fs';

export const BRAND = {
  name: 'MCPHelm',
  slug: 'mcphelm',
  bin: 'mcphelm',
  version: '0.1.8',
  configFileName: 'mcphelm.config.json',
  homeDirName: '.mcphelm',
  envPrefix: 'MCPHELM',
  repoUrl: 'https://github.com/wakeup595626-cmyk/mcphelm',
  /**
   * 「点个 Star」的落地页。
   * GitHub 不允许第三方软件替用户点 Star（自动化刷星属于 AUP 明令禁止的行为），
   * 所以这里只负责把仓库页打开，由用户自己点一下右上角的 ★。
   */
  starUrl: 'https://github.com/wakeup595626-cmyk/mcphelm',
  /**
   * 赞助入口。收款码是面板同源静态图片（打包进 asar，不联网）。
   * 留空 alipayQr 则界面自动隐藏「请我喝咖啡」相关区块，不会出现死链。
   */
  support: {
    alipayQr: 'support/alipay.png',
    /** 可选：其它赞助渠道（爱发电 / Buy Me a Coffee 等）；留空则只显示收款码 */
    link: '',
  },
  docs: {
    secureTunnelGuide: 'https://developers.openai.com/api/docs/guides/secure-mcp-tunnels',
    platformTunnels: 'https://platform.openai.com/settings/organization/tunnels',
    platformApiKeys: 'https://platform.openai.com/settings/organization/api-keys',
    chatgptConnectors: 'https://chatgpt.com/#settings/Connectors',
    tunnelClientRepo: 'https://github.com/openai/tunnel-client',
  },
} as const;

export function packageVersion(fromUrl: string): string {
  try {
    const url = new URL('../package.json', fromUrl);
    const parsed = JSON.parse(readFileSync(url, 'utf8')) as { version?: string };
    return parsed.version ?? BRAND.version;
  } catch {
    return BRAND.version;
  }
}
