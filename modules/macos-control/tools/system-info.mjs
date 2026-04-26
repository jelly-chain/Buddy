import { sh } from "../../../core/shell.mjs";
import os from "node:os";

export default async function systemInfo() {
  const [swVer, hwModel, uptime, diskU] = await Promise.all([
    sh("sw_vers"),
    sh("sysctl -n hw.model hw.memsize machdep.cpu.brand_string"),
    sh("uptime"),
    sh("df -h / | tail -1"),
  ]);
  const parseKV = (s) => Object.fromEntries(s.split("\n").filter(Boolean).map(l => {
    const [k, ...v] = l.split(":"); return [k.trim(), v.join(":").trim()];
  }));
  const [model, memsize, cpu] = hwModel.stdout.split("\n");
  return {
    ok: true,
    os: parseKV(swVer.stdout || ""),
    hardware: {
      model: model || os.type(),
      cpu: cpu || os.cpus()[0]?.model,
      cores: os.cpus().length,
      memGB: +(Number(memsize || 0) / 2 ** 30).toFixed(1) || Math.round(os.totalmem() / 2 ** 30),
    },
    uptime: uptime.stdout,
    disk: diskU.stdout,
    host: os.hostname(),
    user: os.userInfo().username,
    node: process.version,
  };
}
