// personas tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "personas", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "personas", usage: "node modules/personas/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
