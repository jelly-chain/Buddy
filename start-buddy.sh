#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Load env
if [ ! -f .env ]; then echo "❌  .env not found"; exit 1; fi
set -a; source .env; set +a
chmod 600 .env

# Start proxy (kill lingering first to avoid EADDRINUSE)
if lsof -i :${PROXY_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Proxy port ${PROXY_PORT} in use; terminating existing..."
  lsof -i :${PROXY_PORT} -sTCP:LISTEN -t | xargs -r kill -9 || true
  sleep 1
fi

node proxy.mjs > logs/proxy.log 2>&1 &
PROXY_PID=$!

# Readiness probe
echo -n "   waiting for proxy"
for i in $(seq 1 20); do
  curl -sf "http://127.0.0.1:${PROXY_PORT}/health" > /dev/null && break
  echo -n "."; sleep 0.3
done
echo " ready"

# ── Route Claude Code through proxy ─────────────────────────────────────────
export ANTHROPIC_BASE_URL="http://127.0.0.1:${PROXY_PORT}/api"
export ANTHROPIC_API_KEY="$OPENROUTER_API_KEY"

export ANTHROPIC_DEFAULT_OPUS_MODEL="${ANTHROPIC_DEFAULT_OPUS_MODEL:-anthropic/claude-sonnet-4.5}"
export ANTHROPIC_DEFAULT_SONNET_MODEL="${ANTHROPIC_DEFAULT_SONNET_MODEL:-anthropic/claude-sonnet-4.5}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="${ANTHROPIC_DEFAULT_HAIKU_MODEL:-anthropic/claude-haiku-4.5}"
export CLAUDE_CODE_SUBAGENT_MODEL="${CLAUDE_CODE_SUBAGENT_MODEL:-anthropic/claude-haiku-4.5}"

export DISABLE_AUTOUPDATES=1
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# Make `buddy` CLI available inside the Claude Code session
export PATH="$(pwd)/bin:$PATH"

# Voice defaults (OpenRouter TTS/STT) — voice is always ON by default.
# (Use Shift+Tab in Claude Code to switch modes; no buddy mode toggle needed.)
export BUDDY_TTS_MODEL="${BUDDY_TTS_MODEL:-openai/gpt-4o-mini-tts-2025-12-15}"
export BUDDY_TTS_VOICE="${BUDDY_TTS_VOICE:-alloy}"
export BUDDY_STT_MODEL="${BUDDY_STT_MODEL:-openai/whisper-1}"
export BUDDY_STT_TIMEOUT_MS="${BUDDY_STT_TIMEOUT_MS:-30000}"
export BUDDY_MIC_DEVICE="${BUDDY_MIC_DEVICE:-0}"   # 0 = built-in MacBook mic

# Force voice auto-speak + live transcript ON at every launch
mkdir -p logs
cat > logs/voice-state.json <<JSON
{
  "autoSpeak": true,
  "liveTranscript": true
}
JSON

# ── Mic permission probe ────────────────────────────────────────────────────
# Trigger macOS's native mic permission prompt for this terminal app.
# On first run you'll see a system dialog; on subsequent runs it's silent.
MIC_OK=0
echo -n "   checking mic access (device :${BUDDY_MIC_DEVICE})"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -f avfoundation -i ":${BUDDY_MIC_DEVICE}" -t 0.5 -ac 1 -ar 16000 -y /tmp/buddy-mic-probe.wav >/dev/null 2>/tmp/buddy-mic-probe.err || true
  if [ -s /tmp/buddy-mic-probe.wav ]; then
    echo " ✓ granted"
    MIC_OK=1
    rm -f /tmp/buddy-mic-probe.wav /tmp/buddy-mic-probe.err
  else
    echo " ✗ denied"
    echo ""
    echo "⚠️  Microphone access is blocked for this terminal."
    echo "   → Open: System Settings → Privacy & Security → Microphone"
    echo "   → Enable access for Terminal / iTerm / VS Code (whichever you're using)"
    echo "   → Then re-run: bash start-buddy.sh"
    if [ -s /tmp/buddy-mic-probe.err ]; then
      echo "   → Detail: $(tail -n 1 /tmp/buddy-mic-probe.err)"
    fi
    echo ""
  fi
else
  echo " ⚠️  ffmpeg not found (brew install ffmpeg)"
fi

# ── Background voice listener daemon ────────────────────────────────────────
# Continuously captures mic → transcribes → appends to logs/voice-transcript.jsonl.
# Disable by exporting BUDDY_VOICE_LISTEN=off before running this script.
VOICE_DAEMON_PID=""
if [ "$MIC_OK" = "1" ] && [ "${BUDDY_VOICE_LISTEN:-on}" != "off" ]; then
  # Kill any stale voice daemon from a previous run
  if [ -f logs/voice-daemon.pid ]; then
    OLD_PID=$(cat logs/voice-daemon.pid 2>/dev/null || true)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill "$OLD_PID" 2>/dev/null || true
      sleep 0.3
    fi
    rm -f logs/voice-daemon.pid logs/voice-daemon.status
  fi
  node core/voice-daemon.mjs >> logs/voice-daemon.log 2>&1 &
  VOICE_DAEMON_PID=$!
  echo "   🎤 voice daemon started (pid ${VOICE_DAEMON_PID}, window ${BUDDY_VOICE_WINDOW_SEC:-5}s)"
  echo "      logs → logs/voice-transcript.jsonl"
else
  if [ "${BUDDY_VOICE_LISTEN:-on}" = "off" ]; then
    echo "   🔇 voice listener disabled (BUDDY_VOICE_LISTEN=off)"
  else
    echo "   🔇 voice listener skipped (mic not available)"
  fi
fi

echo ""
echo "🤖 Buddy — via OpenRouter (proxy on :${PROXY_PORT})"
echo "   Base URL : ${ANTHROPIC_BASE_URL}"
echo "   Sonnet   : ${ANTHROPIC_DEFAULT_SONNET_MODEL}"
echo "   Haiku    : ${ANTHROPIC_DEFAULT_HAIKU_MODEL}"
echo "   Subagent : ${CLAUDE_CODE_SUBAGENT_MODEL}"
echo "   Modules  : $(ls modules | wc -l | tr -d ' ') loaded"
echo "   Voice    : ON  (TTS ${BUDDY_TTS_VOICE} · STT ${BUDDY_STT_MODEL##*/})"
echo ""
echo "   ⚡ Try: buddy help | buddy status | buddy voice say 'hi' | buddy voice listen"
echo "   ⌨  Shift+Tab inside Claude to switch between plan/edit/auto modes."
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "↓  shutting down proxy (pid $PROXY_PID)"
  kill $PROXY_PID 2>/dev/null || true
  if [ -n "$VOICE_DAEMON_PID" ]; then
    echo "↓  stopping voice daemon (pid $VOICE_DAEMON_PID)"
    kill $VOICE_DAEMON_PID 2>/dev/null || true
  fi
  rm -f logs/voice-daemon.pid logs/voice-daemon.status 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Launch Claude Code with dangerously-skip-permissions (autonomous mode)
claude \
  --dangerously-skip-permissions \
  --mcp-config ./config/mcp.json \
  "$@"
