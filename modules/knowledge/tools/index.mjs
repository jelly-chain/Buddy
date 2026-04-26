// knowledge tools — ingest docs, keyword index search, semantic (if embeddings available)
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const INDEX_FILE = join(ROOT, 'logs', 'knowledge-index.json');

function loadIndex() {
  if (!existsSync(INDEX_FILE)) return { docs: {} };
  try { return JSON.parse(readFileSync(INDEX_FILE, 'utf8')); } catch { return { docs: {} }; }
}

function saveIndex(data) {
  mkdirSync(dirname(INDEX_FILE), { recursive: true });
  writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
}

function walkFiles(dir, exts = ['.md', '.txt', '.mjs', '.js', '.ts', '.py', '.rs']) {
  const out = [];
  try {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const full = join(dir, name);
      const s = statSync(full);
      if (s.isDirectory()) out.push(...walkFiles(full, exts));
      else if (exts.includes(name.slice(name.lastIndexOf('.')))) out.push(full);
    }
  } catch {}
  return out;
}

export async function ingest({ path = '.', exts } = {}) {
  const extList = exts ? (Array.isArray(exts) ? exts : exts.split(',')) : undefined;
  const files = walkFiles(path, extList);
  const index = loadIndex();
  let added = 0;
  for (const f of files) {
    try {
      const content = readFileSync(f, 'utf8');
      if (content.length > 500000) continue;
      index.docs[relative(ROOT, f)] = {
        path: f,
        size: content.length,
        preview: content.slice(0, 200),
        updated: Date.now()
      };
      added++;
    } catch {}
  }
  saveIndex(index);
  return { ok: true, ingested: added, total: Object.keys(index.docs).length };
}

export async function search({ query = '', limit = 10 } = {}) {
  if (!query) return { ok: false, error: 'query required' };
  try {
    // Fast: grep-based fulltext
    const cmd = `grep -rln --include='*.md' --include='*.mjs' --include='*.js' --include='*.ts' --include='*.py' --include='*.rs' --exclude-dir=node_modules --exclude-dir=.git -i "${query.replace(/"/g, '\\"')}" "${ROOT}" 2>/dev/null | head -${limit}`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const files = out.split('\n').filter(Boolean);
    // return with a context line per file
    const results = files.map(f => {
      try {
        const c = execSync(`grep -in "${query.replace(/"/g, '\\"')}" "${f}" 2>/dev/null | head -3`, { encoding: 'utf8' }).trim();
        return { file: relative(ROOT, f), snippet: c };
      } catch { return { file: relative(ROOT, f), snippet: '' }; }
    });
    return { ok: true, query, count: results.length, results };
  } catch (e) {
    return { ok: true, query, count: 0, results: [] };
  }
}

export async function stats() {
  const index = loadIndex();
  return { ok: true, total_docs: Object.keys(index.docs).length };
}

export async function list_docs({ limit = 50 } = {}) {
  const index = loadIndex();
  return { ok: true, docs: Object.keys(index.docs).slice(0, limit) };
}

export async function read_doc({ path } = {}) {
  if (!path) return { ok: false, error: 'path required' };
  const full = path.startsWith('/') ? path : join(ROOT, path);
  if (!existsSync(full)) return { ok: false, error: 'not found' };
  return { ok: true, path: full, content: readFileSync(full, 'utf8') };
}
