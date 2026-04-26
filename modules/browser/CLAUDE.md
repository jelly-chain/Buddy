# browser module

## Purpose
Implements the **browser** capability in Buddy.

## Runtime
- Entry point: `modules/browser/run.mjs`
- Tools: `modules/browser/tools/index.mjs`
- Dispatcher usage: `node modules/browser/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
