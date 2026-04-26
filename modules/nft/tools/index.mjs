// nft tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "nft", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "nft", usage: "node modules/nft/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
