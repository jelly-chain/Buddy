// agent-health tools — self-check, list modules, proxy status
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..', '..', '..');

export async function status() {
  const proxyPort = process.env.PROXY_PORT || '7788';
  let proxy = { ok: false, error: 'not reachable' };
  try {
    const r = await fetch(`http://127.0.0.1:${proxyPort}/health`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) proxy = await r.json();
  } catch (e) { proxy = { ok: false, error: e.message }; }

  const hasEnv = existsSync(join(ROOT, '.env'));
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  const moduleCount = readdirSync(join(ROOT, 'modules'))
    .filter(d => statSync(join(ROOT, 'modules', d)).isDirectory()).length;

  return {
    ok: true,
    proxy,
    env: { loaded: hasEnv, openrouter_key: hasKey, proxy_port: proxyPort },
    modules: moduleCount,
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    uptime_s: Math.round(process.uptime())
  };
}

export async function listModules() {
  const modulesDir = join(ROOT, 'modules');
  const mods = readdirSync(modulesDir).filter(d => {
    try { return statSync(join(modulesDir, d)).isDirectory(); } catch { return false; }
  });
  const detailed = mods.map(m => {
    const toolsFile = join(modulesDir, m, 'tools', 'index.mjs');
    const runFile = join(modulesDir, m, 'run.mjs');
    const claudeMd = join(modulesDir, m, 'CLAUDE.md');
    return {
      name: m,
      has_run: existsSync(runFile),
      has_tools: existsSync(toolsFile),
      has_doc: existsSync(claudeMd)
    };
  });
  return { ok: true, count: mods.length, modules: detailed };
}

// Alias used by CLAUDE.md docs
export const list_modules = listModules;

export async function ping() {
  return { ok: true, pong: true, ts: Date.now() };
}

export async function logs({ lines = 50 } = {}) {
  const logPath = join(ROOT, 'logs', 'proxy.log');
  if (!existsSync(logPath)) return { ok: false, error: 'no proxy.log' };
  try {
    const out = execSync(`tail -n ${lines} "${logPath}"`, { encoding: 'utf8' });
    return { ok: true, lines: out.split('\n') };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function killProxy() {
  const port = process.env.PROXY_PORT || '7788';
  try {
    execSync(`lsof -i :${port} -sTCP:LISTEN -t | xargs -r kill -9`, { stdio: 'pipe' });
    return { ok: true, killed: true, port };
  } catch (e) {
    return { ok: true, killed: false, reason: 'no listener' };
  }
}

export const kill_proxy = killProxy;
