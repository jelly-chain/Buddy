# vault module

## Purpose
Implements the **vault** capability in Buddy.

## Runtime
- Entry point: `modules/vault/run.mjs`
- Tools: `modules/vault/tools/index.mjs`
- Dispatcher usage: `node modules/vault/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
