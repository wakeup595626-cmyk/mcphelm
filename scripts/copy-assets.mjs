import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'src', 'panel', 'web');
const to = resolve(root, 'dist', 'panel', 'web');

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log('panel assets -> ' + to);
