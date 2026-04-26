// git tools — status, clone, commit, push, branch, log, diff
import { execSync } from 'node:child_process';

function gitRun(cmd, cwd = process.cwd()) {
  return execSync(`git ${cmd}`, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

export async function status({ cwd = process.cwd() } = {}) {
  try {
    const out = gitRun('status --short --branch', cwd);
    return { ok: true, status: out.trim(), cwd };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function clone({ url, dest = '.', depth = 0 } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  try {
    const d = depth > 0 ? `--depth ${depth}` : '';
    const out = execSync(`git clone ${d} "${url}" "${dest}"`, { encoding: 'utf8' });
    return { ok: true, url, dest, out };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function commit({ message = 'update', cwd = process.cwd(), all = true } = {}) {
  try {
    if (all) gitRun('add -A', cwd);
    const out = gitRun(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
    return { ok: true, out: out.trim() };
  } catch (e) { return { ok: false, error: e.stderr?.toString() || e.message }; }
}

export async function push({ cwd = process.cwd(), remote = 'origin', branch = '' } = {}) {
  try {
    const b = branch || gitRun('rev-parse --abbrev-ref HEAD', cwd).trim();
    const out = execSync(`git push ${remote} ${b}`, { cwd, encoding: 'utf8' });
    return { ok: true, branch: b, remote, out };
  } catch (e) { return { ok: false, error: e.stderr?.toString() || e.message }; }
}

export async function branch({ cwd = process.cwd(), name = '', checkout = false } = {}) {
  try {
    if (!name) {
      const all = gitRun('branch -a', cwd);
      return { ok: true, branches: all.split('\n').map(s => s.trim()).filter(Boolean) };
    }
    if (checkout) gitRun(`checkout -b ${name}`, cwd);
    else gitRun(`branch ${name}`, cwd);
    return { ok: true, created: name, checked_out: checkout };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function log({ cwd = process.cwd(), count = 10 } = {}) {
  try {
    const out = gitRun(`log --oneline -n ${count}`, cwd);
    return { ok: true, commits: out.trim().split('\n') };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function diff({ cwd = process.cwd(), staged = false } = {}) {
  try {
    const out = gitRun(`diff ${staged ? '--staged' : ''}`, cwd);
    return { ok: true, diff: out, lines: out.split('\n').length };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function pull({ cwd = process.cwd() } = {}) {
  try { return { ok: true, out: gitRun('pull', cwd).trim() }; }
  catch (e) { return { ok: false, error: e.stderr?.toString() || e.message }; }
}
