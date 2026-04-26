// search tools — web search (Brave API or DuckDuckGo fallback), fetch page, summarize
import { execSync } from 'node:child_process';

export async function web({ query = '', count = 10 } = {}) {
  if (!query) return { ok: false, error: 'query required' };
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  if (braveKey) {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey },
        signal: AbortSignal.timeout(10000)
      });
      if (!r.ok) return { ok: false, error: `Brave HTTP ${r.status}` };
      const json = await r.json();
      const results = (json.web?.results || []).map(x => ({
        title: x.title, url: x.url, description: x.description
      }));
      return { ok: true, source: 'brave', query, count: results.length, results };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // DuckDuckGo HTML fallback (scrape)
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Buddy' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const results = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) && results.length < count) {
      results.push({ title: m[2].trim(), url: m[1], description: '' });
    }
    return { ok: true, source: 'duckduckgo', query, count: results.length, results };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function fetch_page({ url, as = 'text' } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Buddy' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow'
    });
    const ct = r.headers.get('content-type') || '';
    if (as === 'json' || ct.includes('json')) {
      return { ok: r.ok, status: r.status, content_type: ct, data: await r.json() };
    }
    const body = await r.text();
    return { ok: r.ok, status: r.status, content_type: ct, length: body.length, body: body.slice(0, 50000) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function extract_text({ url } = {}) {
  const page = await fetch_page({ url });
  if (!page.ok) return page;
  const text = (page.body || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { ok: true, url, length: text.length, text: text.slice(0, 20000) };
}

export async function news({ query = 'tech', count = 10 } = {}) {
  return await web({ query: `${query} news`, count });
}
