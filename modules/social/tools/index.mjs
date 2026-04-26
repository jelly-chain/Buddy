// social tools — X/Twitter (via API v2), Telegram bot, macOS Messages
const X_BEARER = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || '';
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function x_post({ text } = {}) {
  if (!X_BEARER) return { ok: false, error: 'X_BEARER_TOKEN not set' };
  if (!text) return { ok: false, error: 'text required' };
  try {
    const r = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${X_BEARER}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000)
    });
    const json = await r.json();
    return { ok: r.ok, status: r.status, result: json };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function x_search({ query, count = 10 } = {}) {
  if (!X_BEARER) return { ok: false, error: 'X_BEARER_TOKEN not set' };
  if (!query) return { ok: false, error: 'query required' };
  try {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(count, 100)}`;
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${X_BEARER}` }, signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    return { ok: r.ok, results: json };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function telegram_send({ chat_id, text } = {}) {
  if (!TG_TOKEN) return { ok: false, error: 'TELEGRAM_BOT_TOKEN not set' };
  if (!chat_id || !text) return { ok: false, error: 'chat_id and text required' };
  try {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(10000)
    });
    const json = await r.json();
    return { ok: r.ok, result: json };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function imessage_send({ recipient, text } = {}) {
  if (!recipient || !text) return { ok: false, error: 'recipient and text required' };
  const { execSync } = await import('node:child_process');
  try {
    execSync(`osascript -e 'tell application "Messages" to send "${text.replace(/"/g, '\\"')}" to buddy "${recipient}" of service 1'`);
    return { ok: true, sent_to: recipient };
  } catch (e) { return { ok: false, error: e.message }; }
}
