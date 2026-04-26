import { sh } from "../../../core/shell.mjs";

export default async function dialog({ prompt = "Enter value:", title = "Buddy", defaultAnswer = "", type = "input" } = {}) {
  const esc = (s) => String(s).replace(/["\\]/g, "\\$&");
  let script;
  if (type === "input") {
    script = `display dialog "${esc(prompt)}" with title "${esc(title)}" default answer "${esc(defaultAnswer)}"`;
  } else if (type === "confirm") {
    script = `display dialog "${esc(prompt)}" with title "${esc(title)}" buttons {"Cancel","OK"} default button "OK"`;
  } else {
    return { ok: false, error: "type must be input|confirm" };
  }
  const r = await sh(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  if (!r.ok) {
    if ((r.stderr || "").includes("User canceled")) return { ok: true, cancelled: true };
    return { ok: false, error: r.stderr };
  }
  // parse "button returned:OK, text returned:foo"
  const out = r.stdout;
  const text = /text returned:([^,]*)/.exec(out)?.[1]?.trim() ?? null;
  const btn = /button returned:([^,]*)/.exec(out)?.[1]?.trim() ?? null;
  return { ok: true, button: btn, text };
}
