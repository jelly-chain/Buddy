// ai-agents tools — spawn sub-agents via OpenRouter (through local proxy when available)
const PROXY_PORT = process.env.PROXY_PORT || '7788';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

async function proxyHealthy() {
  try {
    const r = await fetch(`http://127.0.0.1:${PROXY_PORT}/health`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

// Note: proxy.mjs is Anthropic Messages API for Claude CLI only.
// ai-agents uses OpenRouter's OpenAI-compatible chat/completions endpoint directly.
async function callOpenRouter({ model, messages, temperature = 0.7, max_tokens = 2048 }) {
  if (!OPENROUTER_KEY) return { ok: false, error: 'OPENROUTER_API_KEY not set' };

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost',
        'X-Title': process.env.OPENROUTER_X_TITLE || 'Buddy'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
      signal: AbortSignal.timeout(120000)
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, status: r.status, error: text.slice(0, 1000) };
    try {
      const json = JSON.parse(text);
      // OpenAI-compatible shape
      const content = json.choices?.[0]?.message?.content
        // Anthropic-shape fallback (if proxy was accidentally hit)
        || (Array.isArray(json.content) ? json.content.map(c => c.text || '').join('') : '')
        || '';
      return { ok: true, model, content, usage: json.usage };
    } catch {
      return { ok: false, error: 'malformed JSON', raw: text.slice(0, 500) };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function spawn({ model = 'openai/gpt-4o-mini', prompt = '', system = '', temperature = 0.7, max_tokens = 2048 } = {}) {
  if (!prompt) return { ok: false, error: 'prompt required' };
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return await callOpenRouter({ model, messages, temperature, max_tokens });
}

export async function chat({ model = 'openai/gpt-4o-mini', messages = [], temperature = 0.7, max_tokens = 2048 } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, error: 'messages array required' };
  return await callOpenRouter({ model, messages, temperature, max_tokens });
}

export async function list_models() {
  if (!OPENROUTER_KEY) return { ok: false, error: 'OPENROUTER_API_KEY not set' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return { ok: false, status: r.status };
    const json = await r.json();
    const models = (json.data || []).map(m => ({ id: m.id, context: m.context_length, pricing: m.pricing }));
    return { ok: true, count: models.length, models: models.slice(0, 50) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function parallel({ prompts = [], model = 'openai/gpt-4o-mini' } = {}) {
  if (!Array.isArray(prompts) || prompts.length === 0) return { ok: false, error: 'prompts array required' };
  const results = await Promise.all(prompts.map(p => spawn({ model, prompt: p })));
  return { ok: true, count: results.length, results };
}
