import http from 'node:http';
import https from 'node:https';

const PORT = parseInt(process.env.PROXY_PORT ?? '7788');
const API_KEY = process.env.OPENROUTER_API_KEY;
const REFERER = process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost';
const TITLE = process.env.OPENROUTER_X_TITLE ?? 'Buddy';
const DEBUG = process.env.PROXY_DEBUG === '1';

const ALLOWED_BODY_KEYS = new Set([
  'model','messages','max_tokens','temperature','top_p','top_k',
  'stream','stop','system','tools','tool_choice','metadata'
]);

const BUDDY_SYSTEM = process.env.AGENT_SYSTEM_PROMPT ?? '';

if (!API_KEY) { console.error('OPENROUTER_API_KEY not set'); process.exit(1); }

let HEALTH_OK = true;
let HEALTH_TS = Date.now();
const HEALTH_COOLDOWN = 5000;
function isHealthy(){ return HEALTH_OK && (Date.now() - HEALTH_TS) < HEALTH_COOLDOWN; }

function log(...args) { if (DEBUG) console.error('[proxy]', ...args); }

function sanitize(body) {
  return Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_BODY_KEYS.has(k)));
}

function injectSystem(body) {
  if (!BUDDY_SYSTEM) return body;
  if (typeof body.system === 'string') return { ...body, system: `${BUDDY_SYSTEM}\n\n${body.system}` };
  if (Array.isArray(body.system)) return { ...body, system: [{ type: 'text', text: BUDDY_SYSTEM }, ...body.system] };
  return { ...body, system: BUDDY_SYSTEM };
}

async function withRetry(fn, retries = 3, delay = 500) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries || ![429, 500, 502, 503].includes(err.status)) throw err;
      await new Promise(r => setTimeout(r, delay * 2 ** i));
    }
  }
}

let UPSTREAM_OK = true;
let UPSTREAM_TS = Date.now();

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: UPSTREAM_OK, port: PORT, ts: UPSTREAM_TS }));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  let body;
  try { body = JSON.parse(raw); } catch { res.writeHead(400); return res.end('Bad JSON'); }
  const patched = injectSystem(sanitize(body));
  const payload = JSON.stringify(patched);
  log('→', patched.model, 'stream:', patched.stream);
  const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': REFERER,
      'X-Title': TITLE,
    },
  };
  try {
    await withRetry(() => new Promise((resolve, reject) => {
      const upstream = https.request(options, (uRes) => {
        UPSTREAM_OK = true; UPSTREAM_TS = Date.now();
        res.writeHead(uRes.statusCode, uRes.headers);
        uRes.pipe(res);
        uRes.on('end', resolve);
        uRes.on('error', reject);
      });
      upstream.on('error', reject);
      upstream.setTimeout(120000, () => { upstream.destroy(); reject(Object.assign(new Error('timeout'), { status: 504 })); });
      upstream.write(payload);
      upstream.end();
    }));
  } catch (err) {
    log('upstream error', err.message);
    UPSTREAM_OK = false; UPSTREAM_TS = Date.now();
    if (!res.headersSent) {
      res.writeHead(err.status ?? 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
});

server.listen(PORT, '127.0.0.1', () => console.log('[proxy] listening on http://127.0.0.1:' + PORT));

let healthReady = true;
function respondHealth(res){ res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: healthReady, port: PORT })); }

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
