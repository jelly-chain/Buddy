import { sh } from "../../../core/shell.mjs";

export default async function notify({ title = "Buddy", message = "", subtitle = "", sound } = {}) {
  const esc = (s) => String(s).replace(/["\\]/g, "\\$&");
  let script = `display notification "${esc(message)}" with title "${esc(title)}"`;
  if (subtitle) script += ` subtitle "${esc(subtitle)}"`;
  if (sound) script += ` sound name "${esc(sound)}"`;
  const r = await sh(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  return r.ok ? { ok: true, title, message } : { ok: false, error: r.stderr || "notify failed" };
}
