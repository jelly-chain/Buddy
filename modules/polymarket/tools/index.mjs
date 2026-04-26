// polymarket tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "polymarket", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "polymarket", usage: "node modules/polymarket/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
