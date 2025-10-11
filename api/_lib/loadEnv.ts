import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

function parseLine(line: string) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;

  let [, key, value] = match;
  value = value.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith('\'') && value.endsWith('\''))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf-8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parsed = parseLine(trimmed);
    if (!parsed) continue;

    const { key, value } = parsed;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

if (!loaded) {
  loaded = true;

  const baseDir = process.cwd();
  const candidates = ['.env.local', '.env'];

  for (const fileName of candidates) {
    loadEnvFile(resolve(baseDir, fileName));
  }
}

export {};
