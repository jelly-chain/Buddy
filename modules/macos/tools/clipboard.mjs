import { sh } from "../../../core/shell.mjs";

export default async function clipboard({ action = "read", text = "" } = {}) {
  if (action === "read") {
    const r = await sh("pbpaste");
    return r.ok ? { ok: true, text: r.stdout } : { ok: false, error: r.stderr };
  }
  if (action === "write") {
    const r = await sh("pbcopy", { input: String(text ?? "") });
    return r.ok ? { ok: true, wrote: String(text ?? "").length } : { ok: false, error: r.stderr };
  }
  if (action === "clear") {
    const r = await sh("pbcopy", { input: "" });
    return r.ok ? { ok: true, cleared: true } : { ok: false, error: r.stderr };
  }
  return { ok: false, error: `Unknown action: ${action}. Use read|write|clear` };
}
