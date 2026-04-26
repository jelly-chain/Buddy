// monitor tools — watch processes, URLs, event log tail, disk/cpu/net snapshot
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const EVENTS_LOG = join(ROOT, 'logs', 'events.jsonl');

function appendEvent(evt) {
  mkdirSync(dirname(EVENTS_LOG), { recursive: true });
  writeFileSync(EVENTS_LOG, JSON.stringify({ ts: Date.now(), ...evt }) + '\n', { flag: 'a' });
}

export async function cpu() {
  try {
    const out = execSync(`ps -A -o %cpu | awk '{s+=$1} END {print s}'`, { encoding: 'utf8' }).trim();
    const load = execSync('uptime', { encoding: 'utf8' }).match(/load averages?: ([\d.]+) ([\d.]+) ([\d.]+)/);
    return { ok: true, total_cpu_pct: parseFloat(out), load_1m: load ? parseFloat(load[1]) : null, load_5m: load ? parseFloat(load[2]) : null, load_15m: load ? parseFloat(load[3]) : null };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function memory() {
  try {
    const vm = execSync('vm_stat', { encoding: 'utf8' });
    const pageSize = 4096;
    const m = {};
    vm.split('\n').forEach(l => {
      const mm = l.match(/^(.+?):\s+(\d+)/);
      if (mm) m[mm[1].trim()] = parseInt(mm[2]);
    });
    const free_mb = Math.round(((m['Pages free'] || 0) + (m['Pages inactive'] || 0)) * pageSize / 1024 / 1024);
    const active_mb = Math.round((m['Pages active'] || 0) * pageSize / 1024 / 1024);
    return { ok: true, free_mb, active_mb, raw: m };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function disk() {
  try {
    const out = execSync('df -h /', { encoding: 'utf8' }).trim().split('\n')[1];
    const parts = out.split(/\s+/);
    return { ok: true, size: parts[1], used: parts[2], avail: parts[3], pct: parts[4] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function network() {
  try {
    const out = execSync(`netstat -ib | grep -e "en0" -e "en1" | head -1`, { encoding: 'utf8' }).trim();
    return { ok: true, raw: out };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function watch_process({ name } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  try {
    const out = execSync(`pgrep -fl "${name}" || echo ""`, { encoding: 'utf8' }).trim();
    const running = out.length > 0;
    return { ok: true, name, running, procs: out.split('\n').filter(Boolean) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function ping_url({ url } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  const start = Date.now();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000), method: 'HEAD' });
    return { ok: true, url, status: r.status, latency_ms: Date.now() - start };
  } catch (e) {
    return { ok: false, url, error: e.message, latency_ms: Date.now() - start };
  }
}

export async function tail_events({ lines = 20 } = {}) {
  if (!existsSync(EVENTS_LOG)) return { ok: true, events: [] };
  try {
    const out = execSync(`tail -n ${lines} "${EVENTS_LOG}"`, { encoding: 'utf8' });
    const events = out.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
    return { ok: true, count: events.length, events };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function log_event({ type = 'info', message = '', data = {} } = {}) {
  appendEvent({ type, message, data });
  return { ok: true, logged: true };
}

export async function snapshot() {
  return {
    ok: true,
    ts: new Date().toISOString(),
    cpu: await cpu(),
    memory: await memory(),
    disk: await disk()
  };
}
