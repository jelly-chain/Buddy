import { sh } from "../../../core/shell.mjs";

export default async function proc({ action = "list", name, pid, signal = "TERM", top = 10 } = {}) {
  if (action === "list") {
    const r = await sh(`ps -axo pid,rss,pcpu,comm | sort -rk 3 | head -n ${top + 1}`);
    return { ok: true, processes: r.stdout.split("\n") };
  }
  if (action === "find") {
    if (!name) return { ok: false, error: "name required" };
    const r = await sh(`pgrep -fl "${name.replace(/"/g, '\\"')}" || true`);
    const lines = r.stdout.split("\n").filter(Boolean).map(l => {
      const [pid, ...rest] = l.split(" ");
      return { pid: parseInt(pid, 10), cmd: rest.join(" ") };
    });
    return { ok: true, matches: lines };
  }
  if (action === "kill") {
    if (!pid && !name) return { ok: false, error: "pid or name required" };
    const cmd = pid ? `kill -${signal} ${pid}` : `pkill -${signal} -f "${name.replace(/"/g, '\\"')}"`;
    const r = await sh(cmd);
    return r.ok ? { ok: true, killed: pid ?? name } : { ok: false, error: r.stderr };
  }
  return { ok: false, error: "action must be list|find|kill" };
}
