// planner tools — decompose tasks into plans, track TODO progress
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const PLANS_DIR = join(ROOT, 'logs', 'plans');
const TODO_FILE = join(ROOT, 'TODO.md');

export async function create_plan({ title = '', steps = [] } = {}) {
  if (!title) return { ok: false, error: 'title required' };
  const stamp = new Date().toISOString().split('T')[0];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const path = join(PLANS_DIR, `${stamp}_${slug}.md`);
  mkdirSync(dirname(path), { recursive: true });
  const body = `# ${title}\n\nDate: ${stamp}\n\n## Steps\n${steps.map((s, i) => `- [ ] ${i + 1}. ${s}`).join('\n')}\n`;
  writeFileSync(path, body);
  return { ok: true, path, steps: steps.length };
}

export async function list_plans() {
  if (!existsSync(PLANS_DIR)) return { ok: true, plans: [] };
  const fs = await import('node:fs');
  const files = fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('.md'));
  return { ok: true, count: files.length, plans: files };
}

export async function read_plan({ name } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  const path = join(PLANS_DIR, name.endsWith('.md') ? name : `${name}.md`);
  if (!existsSync(path)) return { ok: false, error: 'plan not found' };
  return { ok: true, path, content: readFileSync(path, 'utf8') };
}

export async function update_todo({ steps = [] } = {}) {
  const lines = steps.map((s, i) => `- [${s.done ? 'x' : ' '}] ${i + 1}. ${s.text}`);
  const body = `# TODO\n\nUpdated: ${new Date().toISOString()}\n\n${lines.join('\n')}\n`;
  writeFileSync(TODO_FILE, body);
  return { ok: true, path: TODO_FILE, count: steps.length };
}

export async function mark_done({ index } = {}) {
  if (index === undefined) return { ok: false, error: 'index required' };
  if (!existsSync(TODO_FILE)) return { ok: false, error: 'no TODO.md' };
  let body = readFileSync(TODO_FILE, 'utf8');
  const lines = body.split('\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^- \[ \] (\d+)\./);
    if (m && parseInt(m[1]) === Number(index)) {
      lines[i] = lines[i].replace('- [ ]', '- [x]');
      found = true;
      break;
    }
  }
  writeFileSync(TODO_FILE, lines.join('\n'));
  return { ok: true, marked: found, index };
}

export async function read_todo() {
  if (!existsSync(TODO_FILE)) return { ok: true, content: '' };
  return { ok: true, content: readFileSync(TODO_FILE, 'utf8') };
}
