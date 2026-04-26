// calendar-sync tools — scaffold ready
// Define tools as named exports; see CLAUDE.md for module purpose

export async function status() {
  return { ok: true, module: "calendar-sync", implemented: false, note: "Add tool implementations here" };
}

export async function help() {
  return { ok: true, module: "calendar-sync", usage: "node modules/calendar-sync/run.mjs <tool> [--arg value]", tools: ["status", "help"] };
}
