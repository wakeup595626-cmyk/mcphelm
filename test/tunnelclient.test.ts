import assert from 'node:assert/strict';
import test from 'node:test';
import {
  archTag,
  platformTag,
  parseSha256Sums,
  parseReleaseTag,
  parseVersion,
  runtimeAssetName,
  runtimeBinaryName,
  versionFromZipName,
} from '../src/tunnelclient.ts';

const ASSET = 'tunnel-client-runtime-v0.0.15-windows-amd64.zip';
const HASH = 'aa5ddb14dddd602fa59f3e6f4401aa8a79a218e341466226b7434127dff65dbc';

test('parseSha256Sums 能取出指定文件的校验值', () => {
  const text = [
    '1111111111111111111111111111111111111111111111111111111111111111  other.zip',
    HASH.toUpperCase() + '  *' + ASSET,
    '',
  ].join('\n');
  assert.equal(parseSha256Sums(text, ASSET), HASH);
  assert.equal(parseSha256Sums(text, 'missing.zip'), null);
  assert.equal(parseSha256Sums('', ASSET), null);
});

test('parseSha256Sums 忽略格式不对的行', () => {
  assert.equal(parseSha256Sums('not-a-hash  ' + ASSET, ASSET), null);
});

test('平台与架构标签在支持的组合上稳定', () => {
  assert.ok(['windows', 'darwin', 'linux'].includes(platformTag()));
  assert.ok(['amd64', 'arm64'].includes(archTag()));
  assert.ok(runtimeBinaryName().startsWith('tunnel-client-runtime'));
});

test('资源文件名与官方发布保持一致', () => {
  assert.equal(runtimeAssetName('v0.0.15'), 'tunnel-client-runtime-v0.0.15-' + platformTag() + '-' + archTag() + '.zip');
});

test('版本号解析', () => {
  assert.equal(parseVersion('tunnel-client-runtime 0.0.15'), '0.0.15');
  assert.equal(parseVersion('no version here'), null);
  assert.equal(versionFromZipName('tunnel-client-runtime-v0.0.15-windows-amd64.zip'), 'v0.0.15');
  assert.equal(versionFromZipName('random.zip'), null);
});

test('兜底链路能从不带 API 的地址里认出最新版本', () => {
  assert.equal(parseReleaseTag('https://github.com/openai/tunnel-client/releases/tag/v0.0.15'), 'v0.0.15');
  assert.equal(
    parseReleaseTag('<a href="/openai/tunnel-client/releases/tag/v0.0.14">x</a>'),
    'v0.0.14'
  );
  assert.equal(parseReleaseTag('https://github.com/openai/tunnel-client/releases'), null);
});
