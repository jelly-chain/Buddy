// news tools — fetch crypto news from multiple sources (CryptoPanic, CoinGecko, RSS)
export async function crypto_news({ limit = 10, filter = 'hot' } = {}) {
  try {
    const key = process.env.CRYPTOPANIC_API_KEY || '';
    if (key) {
      const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${key}&filter=${filter}&public=true`;
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await r.json();
      return { ok: true, source: 'cryptopanic', posts: (json.results || []).slice(0, limit).map(p => ({ title: p.title, url: p.url, currencies: p.currencies, created_at: p.created_at })) };
    }
    // fallback: CoinGecko status updates
    const r = await fetch('https://api.coingecko.com/api/v3/news', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    return { ok: true, source: 'coingecko', posts: (json.data || []).slice(0, limit) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function rss({ url, limit = 10 } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const xml = await r.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) && items.length < limit) {
      const it = m[1];
      const title = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
      const link = (it.match(/<link>(.*?)<\/link>/) || [])[1]?.trim();
      const pub = (it.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim();
      if (title) items.push({ title, link, pub_date: pub });
    }
    return { ok: true, url, count: items.length, items };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function hacker_news({ limit = 10 } = {}) {
  try {
    const r = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(10000) });
    const ids = (await r.json()).slice(0, limit);
    const stories = await Promise.all(ids.map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()).catch(() => null)
    ));
    return { ok: true, stories: stories.filter(Boolean).map(s => ({ title: s.title, url: s.url, score: s.score, by: s.by })) };
  } catch (e) { return { ok: false, error: e.message }; }
}
