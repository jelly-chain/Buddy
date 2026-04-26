// scheduler tools — cron, macOS Reminders, Calendar, launchd one-shots
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const JOBS_FILE = join(ROOT, 'logs', 'jobs.json');

function loadJobs() {
  if (!existsSync(JOBS_FILE)) return [];
  try { return JSON.parse(readFileSync(JOBS_FILE, 'utf8')); } catch { return []; }
}
function saveJobs(j) {
  mkdirSync(dirname(JOBS_FILE), { recursive: true });
  writeFileSync(JOBS_FILE, JSON.stringify(j, null, 2));
}

function esc(s) { return String(s).replace(/"/g, '\\"'); }

export async function add_reminder({ title = '', note = '', due = '' } = {}) {
  if (!title) return { ok: false, error: 'title required' };
  const dueScript = due ? ` due date:(date "${esc(due)}")` : '';
  try {
    execSync(`osascript -e 'tell application "Reminders" to make new reminder with properties {name:"${esc(title)}", body:"${esc(note)}"${dueScript}}'`);
    return { ok: true, added: title };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function list_reminders() {
  try {
    const out = execSync(`osascript -e 'tell application "Reminders" to return name of reminders whose completed is false'`, { encoding: 'utf8' });
    const list = out.trim().split(', ').filter(Boolean);
    return { ok: true, count: list.length, reminders: list };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function add_calendar_event({ title = '', start = '', end = '', calendar = 'Calendar' } = {}) {
  if (!title || !start) return { ok: false, error: 'title and start required' };
  const endStr = end || start;
  try {
    execSync(`osascript <<EOF
tell application "Calendar"
  tell calendar "${esc(calendar)}"
    make new event with properties {summary:"${esc(title)}", start date:(date "${esc(start)}"), end date:(date "${esc(endStr)}")}
  end tell
end tell
EOF`);
    return { ok: true, added: title };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function cron_add({ expr = '', cmd = '' } = {}) {
  if (!expr || !cmd) return { ok: false, error: 'expr and cmd required' };
  try {
    const current = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' });
    const line = `${expr} ${cmd}`;
    if (current.includes(line)) return { ok: true, already_present: true, line };
    const next = (current.trim() + '\n' + line + '\n').trim() + '\n';
    const tmpFile = `/tmp/cron-${Date.now()}`;
    writeFileSync(tmpFile, next);
    execSync(`crontab "${tmpFile}"`);
    return { ok: true, added: line };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function cron_list() {
  try {
    const out = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' });
    return { ok: true, crontab: out };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function job_add({ name = '', cmd = '', every_s = 0, at_iso = '' } = {}) {
  if (!name || !cmd) return { ok: false, error: 'name and cmd required' };
  const jobs = loadJobs();
  jobs.push({ name, cmd, every_s, at_iso, created: new Date().toISOString() });
  saveJobs(jobs);
  return { ok: true, added: name, total: jobs.length };
}

export async function job_list() {
  return { ok: true, jobs: loadJobs() };
}

export async function launchd_create({ label = '', cmd = '', interval_s = 0 } = {}) {
  if (!label || !cmd) return { ok: false, error: 'label and cmd required' };
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyLists/1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>-c</string><string>${cmd}</string></array>
  ${interval_s > 0 ? `<key>StartInterval</key><integer>${interval_s}</integer>` : ''}
  <key>RunAtLoad</key><true/>
</dict></plist>`;
  const path = join(homedir(), 'Library', 'LaunchAgents', `${label}.plist`);
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, plist);
    execSync(`launchctl unload "${path}" 2>/dev/null; launchctl load "${path}"`);
    return { ok: true, label, path };
  } catch (e) { return { ok: false, error: e.message }; }
}
