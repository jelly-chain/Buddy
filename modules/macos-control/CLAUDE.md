# macos-control module

## Purpose
Implements the **macos-control** capability in Buddy.

## Runtime
- Entry point: `modules/macos-control/run.mjs`
- Tools: `modules/macos-control/tools/index.mjs`
- Dispatcher usage: `node modules/macos-control/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
