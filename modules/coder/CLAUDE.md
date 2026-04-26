# coder module

## Purpose
Implements the **coder** capability in Buddy.

## Runtime
- Entry point: `modules/coder/run.mjs`
- Tools: `modules/coder/tools/index.mjs`
- Dispatcher usage: `node modules/coder/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
