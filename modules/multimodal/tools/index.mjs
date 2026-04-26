// multimodal tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "multimodal", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "multimodal", usage: "node modules/multimodal/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
