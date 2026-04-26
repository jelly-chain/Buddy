// solana tools — SPL tokens, balances, tx, Jupiter swap quote, address lookup
const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

async function rpc(method, params = []) {
  const r = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

export async function balance({ address } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  try {
    const res = await rpc('getBalance', [address]);
    return { ok: true, address, sol: (res.value || 0) / 1e9, lamports: res.value || 0 };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function token_accounts({ owner } = {}) {
  if (!owner) return { ok: false, error: 'owner required' };
  try {
    const res = await rpc('getTokenAccountsByOwner', [owner, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }]);
    const accts = (res.value || []).map(a => {
      const info = a.account.data.parsed.info;
      return { mint: info.mint, amount: info.tokenAmount.uiAmount, decimals: info.tokenAmount.decimals };
    }).filter(a => a.amount > 0);
    return { ok: true, owner, count: accts.length, accounts: accts };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function tx({ signature } = {}) {
  if (!signature) return { ok: false, error: 'signature required' };
  try {
    const res = await rpc('getTransaction', [signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
    return { ok: true, tx: res };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function slot() {
  try {
    const res = await rpc('getSlot', []);
    return { ok: true, slot: res };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function epoch_info() {
  try { return { ok: true, info: await rpc('getEpochInfo', []) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function jupiter_quote({ input_mint = 'So11111111111111111111111111111111111111112', output_mint, amount = 1e9, slippage_bps = 50 } = {}) {
  if (!output_mint) return { ok: false, error: 'output_mint required' };
  try {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${input_mint}&outputMint=${output_mint}&amount=${amount}&slippageBps=${slippage_bps}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, error: `Jupiter HTTP ${r.status}` };
    const json = await r.json();
    return { ok: true, quote: json };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function token_price({ mint } = {}) {
  if (!mint) return { ok: false, error: 'mint required' };
  try {
    const r = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const json = await r.json();
    return { ok: true, price: json.data?.[mint] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function sig_history({ address, limit = 10 } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  try {
    const res = await rpc('getSignaturesForAddress', [address, { limit }]);
    return { ok: true, count: res.length, signatures: res };
  } catch (e) { return { ok: false, error: e.message }; }
}
