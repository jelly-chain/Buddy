// whale-tracker tools — monitor large wallet movements
export async function whale_alert({ min_value = 1000000 } = {}) {
  const key = process.env.WHALE_ALERT_API_KEY || '';
  if (!key) return { ok: false, error: 'WHALE_ALERT_API_KEY not set' };
  try {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 3600;
    const url = `https://api.whale-alert.io/v1/transactions?api_key=${key}&start=${start}&min_value=${min_value}&limit=50`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    return { ok: true, count: json.count, transactions: json.transactions || [] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function top_holders({ chain = 'ethereum', token } = {}) {
  if (!token) return { ok: false, error: 'token required' };
  return { ok: false, error: 'requires paid data source (Moralis/Covalent/DexScreener)', hint: 'use dexscreener module or add MORALIS_API_KEY' };
}

export async function track_eth_wallet({ address, hours = 24 } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  const key = process.env.ETHERSCAN_API_KEY || '';
  if (!key) return { ok: false, error: 'ETHERSCAN_API_KEY not set' };
  try {
    const r = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${key}`, { signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
    const recent = (json.result || []).filter(tx => parseInt(tx.timeStamp) > cutoff);
    return { ok: true, address, window_hours: hours, count: recent.length, txs: recent.slice(0, 20) };
  } catch (e) { return { ok: false, error: e.message }; }
}
