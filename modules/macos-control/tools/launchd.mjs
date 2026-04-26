import { sh } from "../../../core/shell.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";

const AGENTS_DIR = join(os.homedir(), "Library", "LaunchAgents");

function plist({ label, program, args = [], workingDir, stdout, stderr, keepAlive = false, runAtLoad = true, startInterval }) {
  const argsXml = [program, ...args].map(a => `<string>${a}</string>`).join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array>
    ${argsXml}
  </array>
  ${workingDir ? `<key>WorkingDirectory</key><string>${workingDir}</string>` : ""}
  ${stdout ? `<key>StandardOutPath</key><string>${stdout}</string>` : ""}
  ${stderr ? `<key>StandardErrorPath</key><string>${stderr}</string>` : ""}
  <key>RunAtLoad</key><${runAtLoad}/>
  <key>KeepAlive</key><${keepAlive}/>
  ${startInterval ? `<key>StartInterval</key><integer>${startInterval}</integer>` : ""}
</dict></plist>`;
}

export default async function launchd({ action, label, program, args, workingDir, stdout, stderr, keepAlive, startInterval } = {}) {
  if (!action) return { ok: false, error: "action required: install|uninstall|list|start|stop|status" };
  await mkdir(AGENTS_DIR, { recursive: true });
  const path = label ? join(AGENTS_DIR, `${label}.plist`) : null;

  if (action === "list") {
    const r = await sh(`launchctl list | grep -i buddy || true`);
    return { ok: true, entries: r.stdout.split("\n").filter(Boolean) };
  }
  if (action === "install") {
    if (!label || !program) return { ok: false, error: "label and program required" };
    const xml = plist({ label, program, args, workingDir, stdout, stderr, keepAlive, startInterval });
    await writeFile(path, xml);
    await sh(`launchctl unload "${path}" 2>/dev/null || true`);
    const r = await sh(`launchctl load "${path}"`);
    return r.ok ? { ok: true, installed: path } : { ok: false, error: r.stderr };
  }
  if (action === "uninstall") {
    if (!label) return { ok: false, error: "label required" };
    await sh(`launchctl unload "${path}" 2>/dev/null || true`);
    await sh(`rm -f "${path}"`);
    return { ok: true, removed: path };
  }
  if (action === "start" || action === "stop") {
    if (!label) return { ok: false, error: "label required" };
    const r = await sh(`launchctl ${action} ${label}`);
    return r.ok ? { ok: true, label, action } : { ok: false, error: r.stderr };
  }
  if (action === "status") {
    const r = await sh(`launchctl list ${label || ""}`);
    return { ok: true, status: r.stdout || r.stderr };
  }
  return { ok: false, error: `Unknown action: ${action}` };
}
