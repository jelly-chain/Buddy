// deploy tools — Vercel, Cloudflare, Fly, Netlify wrappers
import { execSync } from 'node:child_process';

function sh(cmd, cwd = process.cwd(), timeout = 300000) {
  try { return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString() }; }
}

export async function vercel_deploy({ cwd = process.cwd(), prod = false } = {}) {
  return sh(`vercel ${prod ? '--prod' : ''} --yes`, cwd);
}

export async function vercel_env_add({ key, value, target = 'production', cwd = process.cwd() } = {}) {
  if (!key || !value) return { ok: false, error: 'key and value required' };
  return sh(`echo "${value}" | vercel env add ${key} ${target}`, cwd);
}

export async function cf_deploy({ cwd = process.cwd() } = {}) {
  return sh(`wrangler deploy`, cwd);
}

export async function cf_pages_deploy({ dir, project, cwd = process.cwd() } = {}) {
  if (!dir || !project) return { ok: false, error: 'dir and project required' };
  return sh(`wrangler pages deploy "${dir}" --project-name=${project}`, cwd);
}

export async function fly_deploy({ cwd = process.cwd() } = {}) {
  return sh(`flyctl deploy`, cwd);
}

export async function fly_status({ app } = {}) {
  return sh(app ? `flyctl status -a ${app}` : `flyctl status`);
}

export async function netlify_deploy({ cwd = process.cwd(), prod = false } = {}) {
  return sh(`netlify deploy ${prod ? '--prod' : ''}`, cwd);
}

export async function tools_check() {
  const tools = ['vercel', 'wrangler', 'flyctl', 'netlify'];
  const results = {};
  for (const t of tools) {
    try { execSync(`which ${t}`, { stdio: 'pipe' }); results[t] = true; }
    catch { results[t] = false; }
  }
  return { ok: true, available: results };
}
