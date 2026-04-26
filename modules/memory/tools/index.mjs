// memory tools — persistent JSON context store
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const STORE = join(ROOT, 'logs', 'memory.json');

function load() {
  if (!existsSync(STORE)) return {};
  try { return JSON.parse(readFileSync(STORE, 'utf8')); } catch { return {}; }
}

function save(data) {
  mkdirSync(dirname(STORE), { recursive: true });
  writeFileSync(STORE, JSON.stringify(data, null, 2));
}

export async function set({ key, value } = {}) {
  if (!key) return { ok: false, error: 'key required' };
  const data = load();
  data[key] = { value, updated: new Date().toISOString() };
  save(data);
  return { ok: true, key, stored: true };
}

export async function get({ key } = {}) {
  if (!key) return { ok: false, error: 'key required' };
  const data = load();
  if (!(key in data)) return { ok: true, found: false };
  return { ok: true, found: true, key, ...data[key] };
}

export async function keys() {
  const data = load();
  return { ok: true, count: Object.keys(data).length, keys: Object.keys(data) };
}

export async function remove({ key } = {}) {
  if (!key) return { ok: false, error: 'key required' };
  const data = load();
  const had = key in data;
  delete data[key];
  save(data);
  return { ok: true, removed: had };
}

export async function dump() {
  return { ok: true, data: load() };
}

export async function clear() {
  save({});
  return { ok: true, cleared: true };
}

export async function append_log({ entry = '' } = {}) {
  const logPath = join(ROOT, 'logs', 'events.jsonl');
  mkdirSync(dirname(logPath), { recursive: true });
  const line = JSON.stringify({ ts: Date.now(), entry }) + '\n';
  writeFileSync(logPath, line, { flag: 'a' });
  return { ok: true, logged: true };
}
