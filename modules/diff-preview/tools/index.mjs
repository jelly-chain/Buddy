// diff-preview tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "diff-preview", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "diff-preview", usage: "node modules/diff-preview/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
