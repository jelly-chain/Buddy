// clipboard-watch tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "clipboard-watch", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "clipboard-watch", usage: "node modules/clipboard-watch/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
