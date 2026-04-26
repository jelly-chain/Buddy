// macos tools — notify, clipboard, screenshot, speak, open-app
import { execSync, execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function esc(s) { return String(s).replace(/"/g, '\\"'); }

export async function notify({ title = 'Buddy', message = '', sound = 'default' } = {}) {
  try {
    execSync(`osascript -e 'display notification "${esc(message)}" with title "${esc(title)}" sound name "${esc(sound)}"'`);
    return { ok: true, title, message };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function speak({ text = '', voice = 'Alex', rate = 200 } = {}) {
  if (!text) return { ok: false, error: 'text required' };
  try {
    execFileSync('say', ['-v', voice, '-r', String(rate), text]);
    return { ok: true, text, voice };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function clipboard_read() {
  try {
    const data = execSync('pbpaste', { encoding: 'utf8' });
    return { ok: true, data };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function clipboard_write({ text = '' } = {}) {
  try {
    const tmp = join(tmpdir(), `clip-${Date.now()}.txt`);
    writeFileSync(tmp, text);
    execSync(`pbcopy < "${tmp}"`);
    return { ok: true, bytes: text.length };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function screenshot({ path = join(tmpdir(), `shot-${Date.now()}.png`), interactive = false } = {}) {
  try {
    execSync(`screencapture ${interactive ? '-i' : '-x'} "${path}"`);
    return { ok: true, path };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function open_app({ app = '', url = '', path = '' } = {}) {
  try {
    if (url) { execSync(`open "${esc(url)}"`); return { ok: true, opened: url }; }
    if (path) { execSync(`open "${esc(path)}"`); return { ok: true, opened: path }; }
    if (app) { execSync(`open -a "${esc(app)}"`); return { ok: true, opened: app }; }
    return { ok: false, error: 'provide app, url, or path' };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function dialog({ title = 'Buddy', message = '', buttons = ['OK'] } = {}) {
  try {
    const btns = buttons.map(b => `"${esc(b)}"`).join(', ');
    const out = execSync(`osascript -e 'display dialog "${esc(message)}" with title "${esc(title)}" buttons {${btns}} default button 1'`, { encoding: 'utf8' });
    return { ok: true, response: out.trim() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function system_info() {
  try {
    const osVer = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
    const host = execSync('hostname', { encoding: 'utf8' }).trim();
    const arch = execSync('uname -m', { encoding: 'utf8' }).trim();
    const uptime = execSync('uptime', { encoding: 'utf8' }).trim();
    return { ok: true, os: `macOS ${osVer}`, host, arch, uptime };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function battery() {
  try {
    const out = execSync('pmset -g batt', { encoding: 'utf8' });
    const m = out.match(/(\d+)%/);
    const charging = /AC Power|charging/i.test(out);
    return { ok: true, percent: m ? parseInt(m[1], 10) : null, charging, raw: out.trim() };
  } catch (e) { return { ok: false, error: e.message }; }
}
