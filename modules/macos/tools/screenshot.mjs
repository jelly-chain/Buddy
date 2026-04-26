import { sh } from "../../../core/shell.mjs";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

export default async function screenshot({ path, mode = "window", clipboard = false, open = false } = {}) {
  // mode: fullscreen | window | selection
  const flags = { fullscreen: "", window: "-w", selection: "-s" }[mode] ?? "-w";
  if (clipboard) {
    const r = await sh(`screencapture ${flags} -c`);
    return r.ok ? { ok: true, to: "clipboard", mode } : { ok: false, error: r.stderr };
  }
  const out = path ? resolve(path) : resolve(`logs/screenshot-${Date.now()}.png`);
  await mkdir(resolve(out, ".."), { recursive: true });
  const r = await sh(`screencapture ${flags} "${out}"`);
  if (!r.ok) return { ok: false, error: r.stderr };
  if (open) await sh(`open "${out}"`);
  return { ok: true, path: out, mode };
}
