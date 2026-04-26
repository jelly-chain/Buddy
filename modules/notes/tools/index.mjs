// notes tools — macOS Notes app, file-based notes
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const NOTES_DIR = process.env.BUDDY_NOTES_DIR || join(homedir(), '.buddy', 'notes');
mkdirSync(NOTES_DIR, { recursive: true });

export async function create({ title, body = '' } = {}) {
  if (!title) return { ok: false, error: 'title required' };
  const safe = title.replace(/[^a-z0-9_-]+/gi, '_');
  const path = join(NOTES_DIR, `${Date.now()}_${safe}.md`);
  writeFileSync(path, `# ${title}\n\n${body}\n`);
  return { ok: true, path, title };
}

export async function list() {
  const files = readdirSync(NOTES_DIR).filter(f => f.endsWith('.md'));
  return { ok: true, dir: NOTES_DIR, count: files.length, files };
}

export async function read({ name } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  const path = join(NOTES_DIR, name.endsWith('.md') ? name : `${name}.md`);
  if (!existsSync(path)) return { ok: false, error: 'not found' };
  return { ok: true, path, content: readFileSync(path, 'utf8') };
}

export async function mac_notes_create({ title, body = '' } = {}) {
  if (!title) return { ok: false, error: 'title required' };
  const script = `tell application "Notes" to make new note with properties {name:"${title.replace(/"/g, '\\"')}", body:"${body.replace(/"/g, '\\"').replace(/\n/g, '<br>')}"}`;
  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { ok: true, title };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function mac_notes_list() {
  try {
    const out = execSync(`osascript -e 'tell application "Notes" to return name of notes'`, { encoding: 'utf8' }).trim();
    return { ok: true, notes: out.split(', ') };
  } catch (e) { return { ok: false, error: e.message }; }
}
