import { sh } from "../../../core/shell.mjs";

export default async function speak({ text = "", voice = "Samantha", rate = 180 } = {}) {
  if (!text) return { ok: false, error: "text required" };
  const esc = String(text).replace(/"/g, '\\"');
  const cmd = `say -v "${voice}" -r ${rate} "${esc}"`;
  const r = await sh(cmd, { timeoutMs: 120_000 });
  return r.ok ? { ok: true, spoke: text.slice(0, 80) } : { ok: false, error: r.stderr };
}
