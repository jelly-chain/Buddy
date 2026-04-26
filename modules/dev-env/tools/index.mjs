// dev-env tools — brew packages, shell setup, check tools
import { execSync } from 'node:child_process';

function sh(cmd, timeout = 120000) {
  try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function check_tools({ tools = ['node', 'npm', 'git', 'brew', 'python3', 'cargo', 'docker'] } = {}) {
  const results = {};
  const list = Array.isArray(tools) ? tools : tools.split(',').map(s => s.trim());
  for (const t of list) {
    try {
      const ver = execSync(`${t} --version 2>&1 | head -1`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      results[t] = { installed: true, version: ver };
    } catch {
      results[t] = { installed: false };
    }
  }
  return { ok: true, results };
}

export async function brew_install({ pkg } = {}) {
  if (!pkg) return { ok: false, error: 'pkg required' };
  return sh(`brew install ${pkg}`, 600000);
}

export async function brew_list() {
  return sh(`brew list --formula | head -100`);
}

export async function npm_install({ pkg, global = false, cwd = process.cwd() } = {}) {
  if (!pkg) return { ok: false, error: 'pkg required' };
  const flag = global ? '-g' : '';
  try {
    const out = execSync(`npm install ${flag} ${pkg}`, { cwd, encoding: 'utf8', timeout: 300000 });
    return { ok: true, out: out.trim() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function pip_install({ pkg } = {}) {
  if (!pkg) return { ok: false, error: 'pkg required' };
  return sh(`pip install --user ${pkg}`, 300000);
}

export async function cargo_install({ pkg } = {}) {
  if (!pkg) return { ok: false, error: 'pkg required' };
  return sh(`cargo install ${pkg}`, 600000);
}

export async function node_version() {
  return sh(`node --version`);
}

export async function npm_audit({ cwd = process.cwd() } = {}) {
  try {
    const out = execSync(`npm audit --json || true`, { cwd, encoding: 'utf8' });
    try { return { ok: true, audit: JSON.parse(out) }; } catch { return { ok: true, raw: out.slice(0, 2000) }; }
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function shell_info() {
  return { ok: true, shell: process.env.SHELL, term: process.env.TERM, user: process.env.USER, home: process.env.HOME, path_count: (process.env.PATH || '').split(':').length };
}
