import { readFileSync } from 'node:fs';

export const BRAND = {
  name: 'MCPHelm',
  slug: 'mcphelm',
  bin: 'mcphelm',
  version: '0.1.0',
  configFileName: 'mcphelm.config.json',
  homeDirName: '.mcphelm',
  envPrefix: 'MCPHELM',
  repoUrl: 'https://github.com/wakeup595626-cmyk/mcphelm',
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
