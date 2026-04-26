import { sh } from "../../../core/shell.mjs";

export default async function open({ target, app, background = false } = {}) {
  if (!target && !app) return { ok: false, error: "target (file/url) or app required" };
  const parts = ["open"];
  if (background) parts.push("-g");
  if (app) parts.push(`-a "${app}"`);
  if (target) parts.push(`"${target.replace(/"/g, '\\"')}"`);
  const r = await sh(parts.join(" "));
  return r.ok ? { ok: true, opened: target ?? app } : { ok: false, error: r.stderr };
}
