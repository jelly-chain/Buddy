// docker tools — build, run, compose, ps, logs
import { execSync } from 'node:child_process';

function sh(cmd, timeout = 120000) {
  try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', timeout }).trim() }; }
  catch (e) { return { ok: false, error: e.message, stderr: e.stderr?.toString() }; }
}

export async function ps({ all = false } = {}) {
  return sh(`docker ps ${all ? '-a' : ''} --format "{{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Image}}"`);
}

export async function build({ tag, path = '.', dockerfile = 'Dockerfile' } = {}) {
  if (!tag) return { ok: false, error: 'tag required' };
  return sh(`docker build -f ${dockerfile} -t ${tag} ${path}`, 600000);
}

export async function run_container({ image, name = '', ports = '', detach = true, env = '' } = {}) {
  if (!image) return { ok: false, error: 'image required' };
  const n = name ? `--name ${name}` : '';
  const p = ports ? `-p ${ports}` : '';
  const e = env ? `-e ${env}` : '';
  return sh(`docker run ${detach ? '-d' : ''} ${n} ${p} ${e} ${image}`);
}

export async function stop({ name } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  return sh(`docker stop ${name}`);
}

export async function logs({ name, tail = 100 } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  return sh(`docker logs --tail ${tail} ${name} 2>&1`);
}

export async function compose_up({ path = '.', detach = true } = {}) {
  return sh(`cd "${path}" && docker compose up ${detach ? '-d' : ''}`, 300000);
}

export async function compose_down({ path = '.' } = {}) {
  return sh(`cd "${path}" && docker compose down`);
}

export async function images() {
  return sh(`docker images --format "{{.Repository}}:{{.Tag}}\\t{{.ID}}\\t{{.Size}}"`);
}

export async function prune() {
  return sh(`docker system prune -f`);
}
