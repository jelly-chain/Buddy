// sandbox tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "sandbox", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "sandbox", usage: "node modules/sandbox/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
