import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSecretBlob, keyringSupported } from '../src/keyring.ts';

test('decodeSecretBlob：UTF-16LE 的 blob（凭据管理器惯例）', () => {
  assert.equal(decodeSecretBlob(Buffer.from('sk-test-123', 'utf16le')), 'sk-test-123');
});

test('decodeSecretBlob：UTF-8 的 blob 兜底', () => {
  assert.equal(decodeSecretBlob(Buffer.from('sk-test-123', 'utf8')), 'sk-test-123');
});

test('decodeSecretBlob：去掉结尾的 NUL', () => {
  assert.equal(decodeSecretBlob(Buffer.from('sk-test-123\u0000', 'utf16le')), 'sk-test-123');
});

test('decodeSecretBlob：空内容返回 null', () => {
  assert.equal(decodeSecretBlob(Buffer.alloc(0)), null);
  assert.equal(decodeSecretBlob(Buffer.from('\u0000', 'utf16le')), null);
});

test('keyringSupported 与当前平台一致', () => {
  assert.equal(keyringSupported(), process.platform === 'win32');
});

