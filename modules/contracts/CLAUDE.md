# contracts module

## Purpose
Implements the **contracts** capability in Buddy.

## Runtime
- Entry point: `modules/contracts/run.mjs`
- Tools: `modules/contracts/tools/index.mjs`
- Dispatcher usage: `node modules/contracts/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
