# context module

## Purpose
Implements the **context** capability in Buddy.

## Runtime
- Entry point: `modules/context/run.mjs`
- Tools: `modules/context/tools/index.mjs`
- Dispatcher usage: `node modules/context/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
