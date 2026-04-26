# agent-health module

## Purpose
Implements the **agent-health** capability in Buddy.

## Runtime
- Entry point: `modules/agent-health/run.mjs`
- Tools: `modules/agent-health/tools/index.mjs`
- Dispatcher usage: `node modules/agent-health/run.mjs &lt;tool&gt; [--arg value]`

## Behavior Contract
- Return JSON-only results.
- Keep tool outputs concise and actionable.
- Use environment variables for secrets/config (no hardcoded local machine paths).
- Follow root `CLAUDE.md` autonomy/safety rules.

## Notes
This module doc is intentionally lightweight and portable.
