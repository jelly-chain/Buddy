// token-scanner tools — check new tokens, detect rugs, GoPlus/DexScreener lookup
export async function dexscreener_search({ query } = {}) {
  if (!query) return { ok: false, error: 'query required' };
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    return { ok: true, query, count: json.pairs?.length || 0, pairs: (json.pairs || []).slice(0, 20) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function dexscreener_token({ chain = 'bsc', address } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    return { ok: true, chain, address, pairs: json.pairs || [] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function trending_solana() {
  try {
    const r = await fetch('https://api.dexscreener.com/token-boosts/top/v1', { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    const sol = (Array.isArray(json) ? json : []).filter(t => t.chainId === 'solana').slice(0, 20);
    return { ok: true, count: sol.length, tokens: sol };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function goplus_check({ chain_id = '56', contract } = {}) {
  if (!contract) return { ok: false, error: 'contract required' };
  try {
    const r = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chain_id}?contract_addresses=${contract}`, { signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    const result = json.result?.[contract.toLowerCase()];
    if (!result) return { ok: true, contract, warning: 'no data', raw: json };
    const risks = [];
    if (result.is_honeypot === '1') risks.push('HONEYPOT');
    if (result.is_mintable === '1') risks.push('MINTABLE');
    if (result.can_take_back_ownership === '1') risks.push('TAKE_BACK_OWNERSHIP');
    if (result.owner_change_balance === '1') risks.push('OWNER_CHANGE_BALANCE');
    if (result.hidden_owner === '1') risks.push('HIDDEN_OWNER');
    if (parseFloat(result.buy_tax || '0') > 0.1) risks.push(`BUY_TAX_${result.buy_tax}`);
    if (parseFloat(result.sell_tax || '0') > 0.1) risks.push(`SELL_TAX_${result.sell_tax}`);
    return { ok: true, contract, risks, risk_level: risks.length === 0 ? 'low' : risks.length < 3 ? 'medium' : 'high', raw: result };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function pumpfun_trending() {
  try {
    const r = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=20&sort=last_trade_timestamp&order=DESC', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const json = await r.json();
    return { ok: true, count: Array.isArray(json) ? json.length : 0, coins: Array.isArray(json) ? json.slice(0, 20) : [] };
  } catch (e) { return { ok: false, error: e.message }; }
}
