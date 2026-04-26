// repl tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "repl", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "repl", usage: "node modules/repl/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
