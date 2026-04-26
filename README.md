# Buddy

> Multi-chain AI builder and coding agent powered by Claude Code — macOS-first, VS Code-friendly, with Solana and BNB as primary chains.

**GitHub:** [github.com/jelly-chain/buddy](https://github.com/jelly-chain/buddy)

---

## What is this?

Buddy is a launch wrapper and local operating environment for [Claude Code](https://github.com/anthropics/claude-code) that:

- Routes Claude Code through a **local Anthropic-compatible proxy** backed by **OpenRouter**
- Lets you run Claude Code using **OpenRouter model IDs** while preserving Anthropic-style compatibility flow
- Prioritizes **Solana** and **BNB Chain** for on-chain tooling, trading workflows, scanning, and automation
- Is designed to be strong on **macOS** and comfortable inside **VS Code**
- Supports a modular upgrade path into a much larger Buddy agent system
- Can be extended with wallet tools, chain watchers, builders, local automations, and voice support
- Includes `CLAUDE.md` so every Buddy session starts with clear runtime and safety rules already loaded
- Includes optional OpenRouter TTS / voice support for short spoken task updates

---

## Why use Buddy?

Buddy is built for people who want Claude Code to behave more like a real local operator instead of just a chat tool.

It is especially useful if you want:

- A **local-first AI coding setup**
- **OpenRouter-backed Claude Code**
- Better support for **crypto-native workflows**
- A base for a larger **personal dev / trading / automation agent**
- A repo you can evolve from a simple launcher into a **multi-module AI system**

---

## Primary focus

### Chains

- **BNB Chain / opBNB** — primary
- **Solana** — primary
- **Ethereum** — secondary
- **Base** — secondary
- **Polygon** — secondary
- **Arbitrum** — secondary

### Operating environment

- **macOS first**
- **VS Code friendly**
- **Terminal-native**
- **Local proxy architecture**
- **OpenRouter model routing**

---

## Project donation wallet

**BNB:** `0xDd81Fe5404a1bF0c8b66EBC3205684c3eF5Ed17B`

**SOL:** `FuYxmffq2gYfLZ3WAsedqtmBtxLkA4XDcscnk9oTqV1C`

---

## Prerequisites

| Tool | Version | Get it |
|------|---------|--------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| npm | v9+ | Comes with Node |
| Git | any | [git-scm.com](https://git-scm.com) |
| Claude Code CLI | latest | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) |
| ffmpeg | any | `brew install ffmpeg` (required for voice — mic capture + audio decode) |
| Solana CLI | optional | [docs.solana.com](https://docs.solana.com/cli/install-solana-cli-tools) |
| whisper.cpp | optional | `brew install whisper-cpp` (offline STT fallback) |

> **About `node_modules/`** — like any Node project, you do **not** commit `node_modules/`.  
> It's in `.gitignore`. Users just clone the repo and run `npm install`; the `package.json` + `package-lock.json` in the repo pin every dependency.  
> The voice features added recently use only built-in Node APIs (`node:fs`, `fetch`, `FormData`) — no extra npm packages were introduced.

### Install Claude Code CLI globally

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

---

## Quick Start

### Mac / Linux

```bash
# 1. Clone the repo
git clone https://github.com/jelly-chain/buddy
cd buddy

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env

# 4. Add your API key
nano .env

# 5. Launch Buddy
bash start-buddy.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/jelly-chain/buddy
cd buddy
npm install
copy .env.example .env
notepad .env
bash start-buddy.sh
```

> Buddy is primarily designed for macOS and Unix-like environments. Windows support may require small shell/path adjustments.

---

## API key — which one to use?

### Option A: OpenRouter (current main path)

Buddy’s current architecture is built around **OpenRouter** with a **local compatibility proxy** in front of Claude Code.

```bash
OPENROUTER_API_KEY=sk-or-...
```

Get one at [openrouter.ai/keys](https://openrouter.ai/keys)

Buddy then maps OpenRouter models into Anthropic compatibility slots.

### Current model slot setup

| Role | Model |
|------|-------|
| Main interactive session | `openai/gpt-5-nano` |
| Opus slot | `openai/gpt-oss-20b` |
| Sonnet slot | `nvidia/nemotron-3-super-120b-a12b` |
| Haiku slot | `nemotron-3-super-120b` |
| Sub-agent | `qwen/qwen3.5-9b` |

You can change these in your environment if you want to tune for speed, quality, or cost.

---

## How Buddy works

Buddy currently uses a local runtime flow:

1. `start-buddy.sh` loads `.env`
2. `OPENROUTER_API_KEY` is required
3. `proxy.mjs` starts locally
4. Claude Code is pointed at `ANTHROPIC_BASE_URL=http://127.0.0.1:<port>/api`
5. Claude Code sends Anthropic-style requests to the local proxy
6. The proxy forwards them to OpenRouter

This means Buddy behaves like a compatibility bridge between Claude Code and OpenRouter while keeping everything local and inspectable.

---

## What’s in this repo?

### Current Buddy foundation

- **Local OpenRouter proxy**
- **Anthropic-compatible request flow**
- **Environment-based model routing**
- **Shell launcher**
- **Optional TTS / voice patch**
- **CLAUDE.md runtime memory**
- **TypeScript-ready repo foundation**

### Buddy modular direction

Buddy is intended to grow as a larger modular system with:

- macOS tools
- VS Code task generation
- Solana + BNB chain operations
- wallet watchers
- token scanners
- NFT analytics
- prediction market integrations
- local research tools
- agent memory
- scheduler / alerts / workflows
- project builders and code scaffolds

---

## Example `.env`

```bash
OPENROUTER_API_KEY=your_key_here
OPENROUTER_HTTP_REFERER=http://localhost
OPENROUTER_X_TITLE=Buddy
PROXY_PORT=7788
PROXY_DEBUG=0

ANTHROPIC_DEFAULT_OPUS_MODEL=openai/gpt-oss-20b
ANTHROPIC_DEFAULT_SONNET_MODEL=nvidia/nemotron-3-super-120b-a12b
ANTHROPIC_DEFAULT_HAIKU_MODEL=nemotron-3-super-120b
CLAUDE_CODE_SUBAGENT_MODEL=qwen/qwen3.5-9b
```

---

## The `buddy` CLI

When you launch via `bash start-buddy.sh`, the `buddy` CLI is auto-added to PATH. Inside the Claude Code session (or any shell that sources the same env), you can drive everything with short commands:

```bash
buddy help                          # show all commands
buddy status                        # agent-health snapshot
buddy modules                       # list all 75 modules
buddy chains                        # list supported chains + RPC pools

# Mode switching is handled natively by Claude Code — press Shift+Tab to cycle
# between plan / edit / auto modes. (There is no `buddy mode` CLI toggle anymore.)

# Voice state (persisted to logs/voice-state.json — forced to ON each session)
buddy voice                         # full state snapshot
buddy voice say "hello world"
buddy voice set nova                # alloy|ash|ballad|coral|echo|fable|nova|onyx|sage|shimmer
buddy voice list
buddy voice listen [--live]         # 5s mic → transcript

# Inside Claude Code, prefix `buddy …` with `!` so it runs as a shell command:
#   !buddy voice listen
#   !tail -n 20 logs/voice-transcript.jsonl

# Generic dispatch to any module/tool
buddy blockchain block_number --chain solana
buddy evm chain_id --chain bnb
buddy search web --query "solana news"
buddy sentiment fear_greed
buddy portfolio list
buddy token-scanner trending_solana
```

Everything returns JSON on stdout with `{ ok: true/false, ... }`. Errors exit 1.

## Voice / TTS / STT

Buddy ships with a full voice pipeline. All state is persisted to `logs/voice-state.json` so it survives across process invocations.

### TTS (text → speech)

```bash
buddy voice say "hello world"
buddy voice set nova        # alloy|ash|ballad|coral|echo|fable|nova|onyx|sage|shimmer
buddy voice                 # snapshot: current voice, auto, live, model, supported
buddy voice list
```

TTS goes through OpenRouter `/api/v1/audio/speech`. On macOS, Buddy auto-converts PCM → WAV via `ffmpeg` (or `afconvert` as fallback) and plays with `afplay`. If the remote TTS fails it falls back to the macOS `say` command.

### STT (speech → text)

```bash
buddy voice listen          # 5s mic capture → transcribe
buddy voice listen --live   # also print [live-transcript] line to stdout
```

STT order of operations:
1. Record via `ffmpeg` (avfoundation) or `sox` for 5s @ 16kHz mono.
2. Try OpenRouter `/api/v1/audio/transcriptions`.
3. On failure, fall back to local **whisper-cli** / **whisper-cpp** (brew) using a ggml model at `~/.buddy/models/ggml-base.en.bin`.
4. Else fall back to python `whisper`.
5. Else return actionable diagnostics (mic permission, missing binary, missing model).

Install local fallback (recommended):

```bash
brew install whisper-cpp ffmpeg
mkdir -p ~/.buddy/models
curl -L -o ~/.buddy/models/ggml-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

Env overrides: `BUDDY_MIC_DEVICE=0` (avfoundation audio index, `0` = built-in MacBook mic), `BUDDY_WHISPER_MODEL=/path/to/ggml.bin`, `BUDDY_STT_TIMEOUT_MS=30000`, `BUDDY_TTS_VOICE=alloy`.

### Always-on background voice daemon 🎤

When you run `bash start-buddy.sh`, a background voice daemon (`core/voice-daemon.mjs`) starts automatically. It:

- Continuously captures 5-second mic windows
- Transcribes via OpenRouter STT (whisper.cpp fallback)
- Appends each utterance to `logs/voice-transcript.jsonl`
- Is auto-killed when the script exits

Watch live:
```bash
tail -f logs/voice-transcript.jsonl
```

Disable it for a session:
```bash
BUDDY_VOICE_LISTEN=off bash start-buddy.sh
```

Tuning:
```bash
BUDDY_VOICE_WINDOW_SEC=3  # shorter capture windows (default 5)
BUDDY_VOICE_IDLE_MS=100   # idle between windows (default 250)
```

On first launch macOS will prompt you for **Microphone** access for your terminal app (Terminal / iTerm / VS Code). Grant it, then the probe at startup will print `✓ granted`. If denied, the script prints a pointer to System Settings → Privacy & Security → Microphone.

## Modes

Mode switching is built into Claude Code — **press Shift+Tab** in the Claude prompt to cycle through **plan / edit / auto** modes. Buddy no longer ships its own `buddy mode` toggle (it was redundant with Claude's native shortcut).

---

## Safety mode

Buddy is designed to work with:

```bash
--dangerously-skip-permissions
```

That makes it powerful, but it also means you should operate it carefully.

Recommended operator rules:

- Never run destructive shell commands unless intended
- Never expose `.env`, wallet files, SSH keys, or secrets
- Never force-push unless explicitly intended
- Never deploy or migrate by accident
- Prefer read / inspect / diff / dry-run behavior first
- Be careful with recursive commands and file moves

---

## Repo structure

```bash
buddy/
├── CLAUDE.md
├── README.md
├── package.json
├── proxy.mjs
├── start-buddy.sh
├── .env.example
├── src/
│   └── voice/
├── test_openrouter_tts.ts
├── tsconfig.json
└── ...
```

As Buddy evolves, this structure can expand into a larger modular `modules/` system for chain tools, macOS tools, project builders, monitoring, and workflows.

---

## Programs

### BNB

- Token deploy tooling
- Wallet monitoring
- DEX / memecoin workflows
- Prediction market support

### SOL

- SPL tooling
- Wallet monitoring
- Token scanning
- DeFi / launch flows

### ETH

- General EVM read/write support
- Contract tooling
- Secondary chain integrations

### Base

- Secondary EVM support
- Builder / deploy workflows
- Agent-compatible tooling

---

## Contract addresses

**BNB:** `0xf581ee357f11d7478fafd183b4a41347c35a4444`

**SOL:** `soon`

**ETH:** `SOON`

**BASE:** `SOON`

---

## What `start-buddy.sh` does

1. Loads `.env`
2. Verifies `OPENROUTER_API_KEY`
3. Starts the local proxy
4. Exports Anthropic compatibility variables
5. Redirects Claude Code through the local proxy
6. Launches Claude Code with Buddy’s local runtime setup

This keeps the launch flow simple and reproducible.

---

## VS Code workflow

Buddy is intended to work well with VS Code.

Recommended use:

- Open the repo in VS Code
- Use the integrated terminal to run `bash start-buddy.sh`
- Keep `.env`, `proxy.mjs`, and `CLAUDE.md` easy to inspect
- Add `.vscode/tasks.json` and `.vscode/launch.json` as you evolve the repo
- Use Buddy as the coding/operator layer while VS Code remains the main editing surface

---

## Debug checklist

If Buddy does not start:

- Confirm `.env` exists
- Confirm `OPENROUTER_API_KEY` is set
- Confirm the proxy port is free
- Confirm `ANTHROPIC_BASE_URL` points to the local proxy
- Confirm the OpenRouter model IDs are valid for your account
- Run `claude --version`
- Check terminal output in VS Code for any launch errors

---

## Related files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Runtime behavior, model routing, safety rules |
| `proxy.mjs` | Anthropic-compatible local proxy to OpenRouter |
| `start-buddy.sh` | Main launcher |
| `package.json` | ESM package config and dependencies |
| `test_openrouter_tts.ts` | Voice/TTS test |
| `patch_openrouter_tts.diff` | TTS patch reference |

---

## Roadmap

### Buddy foundation
- OpenRouter proxy
- Claude Code launch wrapper
- Model slot mapping
- Basic TTS path
- Local-first shell flow

### Buddy modular system
- Full `modules/` architecture
- macOS automation
- VS Code integration
- Solana + BNB operator stack
- monitors, alerts, and workflows
- memory, planning, and agent orchestration
- stronger safety and rollback systems

---

## License

MIT — see [LICENSE](LICENSE)
