// macos-control tools — launchd, automator, system info, volume, wifi, bluetooth
import { execSync } from 'node:child_process';

function sh(cmd) {
  try { return { ok: true, out: execSync(cmd, { encoding: 'utf8' }).trim() }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function system_info() {
  try {
    const data = {};
    data.os = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
    data.build = execSync('sw_vers -buildVersion', { encoding: 'utf8' }).trim();
    data.host = execSync('hostname', { encoding: 'utf8' }).trim();
    data.user = execSync('whoami', { encoding: 'utf8' }).trim();
    data.arch = execSync('uname -m', { encoding: 'utf8' }).trim();
    data.cpu = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
    data.mem_gb = Math.round(parseInt(execSync('sysctl -n hw.memsize', { encoding: 'utf8' })) / 1024 / 1024 / 1024);
    return { ok: true, ...data };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function disk_usage() {
  return sh('df -h / | tail -1');
}

export async function top_processes({ count = 10 } = {}) {
  try {
    const out = execSync(`ps aux | sort -k3 -rn | head -${count + 1}`, { encoding: 'utf8' });
    return { ok: true, processes: out.split('\n').filter(Boolean) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function volume_get() {
  return sh(`osascript -e 'output volume of (get volume settings)'`);
}

export async function volume_set({ level = 50 } = {}) {
  return sh(`osascript -e 'set volume output volume ${level}'`);
}

export async function wifi_status() {
  return sh(`networksetup -getairportnetwork en0 2>/dev/null || networksetup -getairportnetwork en1`);
}

export async function wifi_toggle({ on = true } = {}) {
  return sh(`networksetup -setairportpower en0 ${on ? 'on' : 'off'}`);
}

export async function bluetooth_toggle({ on = true } = {}) {
  return sh(`blueutil -p ${on ? '1' : '0'} 2>/dev/null || echo "blueutil not installed: brew install blueutil"`);
}

export async function sleep_display() {
  return sh(`pmset displaysleepnow`);
}

export async function lock_screen() {
  return sh(`pmset displaysleepnow && osascript -e 'tell application "System Events" to keystroke "q" using {control down, command down}'`);
}

export async function launchd_list() {
  try {
    const out = execSync(`launchctl list | head -50`, { encoding: 'utf8' });
    return { ok: true, jobs: out.split('\n').filter(Boolean) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function run_applescript({ script = '' } = {}) {
  if (!script) return { ok: false, error: 'script required' };
  try {
    const out = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { encoding: 'utf8' });
    return { ok: true, out: out.trim() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function focus_app({ name } = {}) {
  if (!name) return { ok: false, error: 'name required' };
  try {
    execSync(`osascript -e 'tell application "${name}" to activate'`);
    return { ok: true, focused: name };
  } catch (e) { return { ok: false, error: e.message }; }
}
