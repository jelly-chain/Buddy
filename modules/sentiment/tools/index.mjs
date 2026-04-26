// sentiment tools — fear/greed index, social sentiment via OpenRouter LLM
const KEY = process.env.OPENROUTER_API_KEY || '';

export async function fear_greed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    const d = json.data?.[0];
    return { ok: true, value: d?.value, classification: d?.value_classification, timestamp: d?.timestamp };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function analyze({ text } = {}) {
  if (!text) return { ok: false, error: 'text required' };
  if (!KEY) return { ok: false, error: 'OPENROUTER_API_KEY not set' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Classify sentiment as one of: bullish, bearish, neutral. Return JSON only: {"sentiment":"...","score":-1..1,"reasoning":"..."}' },
          { role: 'user', content: text.slice(0, 4000) }
        ],
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000)
    });
    const json = await r.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    try { return { ok: true, ...JSON.parse(content) }; } catch { return { ok: true, raw: content }; }
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function coin_sentiment({ coin_id = 'bitcoin' } = {}) {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/${coin_id}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false`, { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    return {
      ok: true,
      coin_id,
      sentiment_up: json.sentiment_votes_up_percentage,
      sentiment_down: json.sentiment_votes_down_percentage,
      community: json.community_data
    };
  } catch (e) { return { ok: false, error: e.message }; }
}
