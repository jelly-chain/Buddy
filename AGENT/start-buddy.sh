#!/usr/bin/env bash
set -euo pipefail

# Load env
if [ ! -f .env ]; then echo "❌  .env not found"; exit 1; fi
set -a; source .env; set +a
chmod 600 .env

# Start proxy (kill if already running on same port to avoid EADDRINUSE)
if lsof -i :${PROXY_PORT} -sTCP:LISTEN -t >/dev/null ; then
  echo "Proxy port ${PROXY_PORT} in use; terminating existing proxy..."
  lsof -i :${PROXY_PORT} -sTCP:LISTEN -t | xargs -r kill -9
fi
node proxy.mjs &
PROXY_PID=$!

# Readiness probe
echo -n "   waiting for proxy"
for i in $(seq 1 20); do
  curl -sf "http://127.0.0.1:${PROXY_PORT}/health" > /dev/null && break
  echo -n "."; sleep 0.3
done
echo " ready"

# MVP bootstrap via launcher (absolute path resolution)
DIR="$(cd "$(dirname "$0")" && pwd)"
node -e "import('${DIR}/bootstrapRunnerLauncher.mjs').then(m => m.default()).catch(e => { console.error(e); process.exit(1); })"

# Cleanup on exit
cleanup() { echo ""; echo "↓  shutting down proxy"; kill $PROXY_PID 2>/dev/null || true; }
trap cleanup EXIT INT TERM

wait $PROXY_PID 2>/dev/null || true
