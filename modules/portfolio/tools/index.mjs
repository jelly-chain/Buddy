// portfolio tools — track holdings across chains, value in USD
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const PORTFOLIO_FILE = join(ROOT, 'logs', 'portfolio.json');

function load() {
  if (!existsSync(PORTFOLIO_FILE)) return { holdings: [] };
  try { return JSON.parse(readFileSync(PORTFOLIO_FILE, 'utf8')); } catch { return { holdings: [] }; }
}

function save(data) {
  mkdirSync(dirname(PORTFOLIO_FILE), { recursive: true });
  writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

export async function add({ chain, symbol, amount, address } = {}) {
  if (!chain || !symbol || amount == null) return { ok: false, error: 'chain, symbol, amount required' };
  const p = load();
  p.holdings.push({ chain, symbol, amount: parseFloat(amount), address, added_at: Date.now() });
  save(p);
  return { ok: true, holdings: p.holdings.length };
}

export async function list() {
  return { ok: true, ...load() };
}

export async function remove({ index } = {}) {
  if (index == null) return { ok: false, error: 'index required' };
  const p = load();
  const removed = p.holdings.splice(parseInt(index), 1);
  save(p);
  return { ok: true, removed };
}

export async function clear() {
  save({ holdings: [] });
  return { ok: true };
}

export async function value({ vs = 'usd' } = {}) {
  const p = load();
  if (!p.holdings.length) return { ok: true, total: 0, holdings: [] };
  const symbols = [...new Set(p.holdings.map(h => h.symbol.toLowerCase()))];
  try {
    // use CoinGecko simple/price with ids — requires mapping. Try symbol search.
    const searchRes = await Promise.all(symbols.map(async s => {
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/search?query=${s}`, { signal: AbortSignal.timeout(10000) });
        const j = await r.json();
        const coin = j.coins?.find(c => c.symbol.toLowerCase() === s);
        return coin ? { symbol: s, id: coin.id } : null;
      } catch { return null; }
    }));
    const map = {};
    searchRes.filter(Boolean).forEach(x => { map[x.symbol] = x.id; });
    const ids = Object.values(map).join(',');
    if (!ids) return { ok: false, error: 'could not resolve symbols' };
    const pr = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}`, { signal: AbortSignal.timeout(10000) });
    const prices = await pr.json();
    let total = 0;
    const enriched = p.holdings.map(h => {
      const id = map[h.symbol.toLowerCase()];
      const price = id ? prices[id]?.[vs] : null;
      const val = price ? price * h.amount : null;
      if (val) total += val;
      return { ...h, price_usd: price, value_usd: val };
    });
    return { ok: true, vs, total_value: total, holdings: enriched };
  } catch (e) { return { ok: false, error: e.message }; }
}
