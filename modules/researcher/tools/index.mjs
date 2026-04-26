// researcher tools — deep research combining search + LLM synthesis
const KEY = process.env.OPENROUTER_API_KEY || '';

async function webSearch(query) {
  const bKey = process.env.BRAVE_SEARCH_API_KEY || '';
  if (bKey) {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
      const r = await fetch(url, { headers: { 'X-Subscription-Token': bKey, 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
      const json = await r.json();
      return (json.web?.results || []).map(x => ({ title: x.title, url: x.url, desc: x.description }));
    } catch {}
  }
  // DDG fallback
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const results = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) && results.length < 10) {
      results.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: m[1] });
    }
    return results;
  } catch { return []; }
}

async function llmSynthesize({ model, question, sources }) {
  const context = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.desc || ''}`).join('\n\n');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a research assistant. Synthesize the sources into a concise, well-cited answer. Use [1], [2] style citations.' },
        { role: 'user', content: `Question: ${question}\n\nSources:\n${context}` }
      ]
    }),
    signal: AbortSignal.timeout(60000)
  });
  const json = await r.json();
  return json.choices?.[0]?.message?.content || '';
}

export async function research({ question, model = 'openai/gpt-4o-mini', depth = 1 } = {}) {
  if (!question) return { ok: false, error: 'question required' };
  if (!KEY) return { ok: false, error: 'OPENROUTER_API_KEY not set' };
  const sources = await webSearch(question);
  if (!sources.length) return { ok: false, error: 'no search results' };
  const answer = await llmSynthesize({ model, question, sources: sources.slice(0, 8) });
  return { ok: true, question, sources: sources.slice(0, 8), answer };
}

export async function summarize_url({ url, model = 'openai/gpt-4o-mini' } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  if (!KEY) return { ok: false, error: 'OPENROUTER_API_KEY not set' };
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 Buddy' } });
    const html = await r.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 12000);
    const llm = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: `Summarize this page in 5 bullet points:\n\n${text}` }]
      }),
      signal: AbortSignal.timeout(60000)
    });
    const json = await llm.json();
    return { ok: true, url, summary: json.choices?.[0]?.message?.content || '' };
  } catch (e) { return { ok: false, error: e.message }; }
}
