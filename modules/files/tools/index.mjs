// files tools — fs ops, find, grep, read, write, list
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, unlinkSync, rmSync, cpSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';

export async function read({ path, encoding = 'utf8', maxBytes = 5 * 1024 * 1024 } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  try {
    const s = statSync(path);
    if (s.size > maxBytes) return { ok: false, error: `file too large (${s.size} > ${maxBytes})` };
    return { ok: true, path, size: s.size, content: readFileSync(path, encoding) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function write({ path, content = '', append = false } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  try {
    mkdirSync(dirname(resolve(path)), { recursive: true });
    if (append) writeFileSync(path, content, { flag: 'a' });
    else writeFileSync(path, content);
    return { ok: true, path, bytes: Buffer.byteLength(content) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function list({ path = '.', recursive = false, hidden = false } = {}) {
  try {
    if (!recursive) {
      const items = readdirSync(path).filter(n => hidden || !n.startsWith('.'));
      return { ok: true, path, count: items.length, items };
    }
    const out = execSync(`find "${path}" ${hidden ? '' : "-not -path '*/.*'"} -maxdepth 6`, { encoding: 'utf8' });
    const items = out.split('\n').filter(Boolean);
    return { ok: true, path, count: items.length, items: items.slice(0, 500) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function find({ path = '.', name = '', pattern = '' } = {}) {
  try {
    const q = name ? `-name "${name}"` : pattern ? `-name "${pattern}"` : '';
    const out = execSync(`find "${path}" ${q} -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | head -200`, { encoding: 'utf8' });
    const items = out.split('\n').filter(Boolean);
    return { ok: true, count: items.length, items };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function grep({ pattern, path = '.', file_pattern = '*' } = {}) {
  if (!pattern) return { ok: false, error: 'pattern required' };
  try {
    const cmd = `grep -rn --include="${file_pattern}" --exclude-dir=node_modules --exclude-dir=.git "${pattern.replace(/"/g, '\\"')}" "${path}" 2>/dev/null | head -100`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const matches = out.split('\n').filter(Boolean);
    return { ok: true, count: matches.length, matches };
  } catch (e) {
    // grep returns 1 if no match
    return { ok: true, count: 0, matches: [] };
  }
}

export async function exists({ path } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  return { ok: true, exists: existsSync(path), path };
}

export async function mkdir({ path } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  try { mkdirSync(path, { recursive: true }); return { ok: true, path }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function remove({ path, recursive = false } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  try {
    if (recursive) rmSync(path, { recursive: true, force: true });
    else unlinkSync(path);
    return { ok: true, removed: path };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function copy({ src, dest } = {}) {
  if (!src || !dest) return { ok: false, error: 'src & dest required' };
  try { cpSync(src, dest, { recursive: true }); return { ok: true, src, dest }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function stat({ path } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  try {
    const s = statSync(path);
    return { ok: true, path, size: s.size, is_dir: s.isDirectory(), is_file: s.isFile(), mtime: s.mtime, birthtime: s.birthtime };
  } catch (e) { return { ok: false, error: e.message }; }
}
