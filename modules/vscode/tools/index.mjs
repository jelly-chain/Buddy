// vscode tools — generate tasks.json, launch.json, install extensions, open
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export async function gen_tasks({ cwd = process.cwd(), tasks = [] } = {}) {
  const path = join(cwd, '.vscode', 'tasks.json');
  const defaultTasks = tasks.length ? tasks : [
    { label: 'dev', type: 'shell', command: 'npm run dev', problemMatcher: [], group: { kind: 'build', isDefault: true } },
    { label: 'test', type: 'shell', command: 'npm test', problemMatcher: [], group: { kind: 'test', isDefault: true } },
    { label: 'build', type: 'shell', command: 'npm run build', problemMatcher: [] }
  ];
  writeJson(path, { version: '2.0.0', tasks: defaultTasks });
  return { ok: true, path, tasks: defaultTasks.length };
}

export async function gen_launch({ cwd = process.cwd(), program = '${workspaceFolder}/index.js' } = {}) {
  const path = join(cwd, '.vscode', 'launch.json');
  writeJson(path, {
    version: '0.2.0',
    configurations: [
      { type: 'node', request: 'launch', name: 'Launch', program, skipFiles: ['<node_internals>/**'] },
      { type: 'chrome', request: 'launch', name: 'Launch Chrome', url: 'http://localhost:3000', webRoot: '${workspaceFolder}' }
    ]
  });
  return { ok: true, path };
}

export async function gen_settings({ cwd = process.cwd(), settings = {} } = {}) {
  const path = join(cwd, '.vscode', 'settings.json');
  const defaults = {
    'editor.formatOnSave': true,
    'editor.tabSize': 2,
    'files.eol': '\n',
    'typescript.tsdk': 'node_modules/typescript/lib'
  };
  writeJson(path, { ...defaults, ...settings });
  return { ok: true, path };
}

export async function install_ext({ id } = {}) {
  if (!id) return { ok: false, error: 'id required' };
  try {
    const out = execSync(`code --install-extension ${id}`, { encoding: 'utf8' });
    return { ok: true, out: out.trim() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function open({ path = '.' } = {}) {
  try {
    execSync(`code "${path}"`);
    return { ok: true, opened: path };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function list_extensions() {
  try {
    const out = execSync('code --list-extensions', { encoding: 'utf8' });
    return { ok: true, extensions: out.split('\n').filter(Boolean) };
  } catch (e) { return { ok: false, error: e.message }; }
}
