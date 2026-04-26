// bnb tools — BNB/opBNB specific operations (BEP20, PancakeSwap, BSCScan)
const BSC_RPC = process.env.BNB_RPC || 'https://bsc-dataseed.bnbchain.org';
const OPBNB_RPC = process.env.OPBNB_RPC || 'https://opbnb-rpc.publicnode.com';
const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || '';

async function rpc(url, method, params = []) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

export async function balance({ address, network = 'bsc' } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  const url = network === 'opbnb' ? OPBNB_RPC : BSC_RPC;
  try {
    const hex = await rpc(url, 'eth_getBalance', [address, 'latest']);
    const wei = BigInt(hex);
    return { ok: true, network, address, bnb: Number(wei) / 1e18 };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function gas_price({ network = 'bsc' } = {}) {
  const url = network === 'opbnb' ? OPBNB_RPC : BSC_RPC;
  try {
    const hex = await rpc(url, 'eth_gasPrice', []);
    return { ok: true, network, gas_price_gwei: Number(BigInt(hex)) / 1e9 };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function bep20_balance({ token, owner, decimals = 18, network = 'bsc' } = {}) {
  if (!token || !owner) return { ok: false, error: 'token and owner required' };
  const url = network === 'opbnb' ? OPBNB_RPC : BSC_RPC;
  try {
    const data = '0x70a08231' + owner.replace(/^0x/, '').padStart(64, '0');
    const hex = await rpc(url, 'eth_call', [{ to: token, data }, 'latest']);
    const raw = BigInt(hex);
    return { ok: true, network, token, owner, amount: Number(raw) / Math.pow(10, decimals) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function bscscan_tx({ hash } = {}) {
  if (!hash) return { ok: false, error: 'hash required' };
  try {
    const url = `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${hash}${BSCSCAN_KEY ? `&apikey=${BSCSCAN_KEY}` : ''}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await r.json();
    return { ok: true, hash, status: json };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function block_number({ network = 'bsc' } = {}) {
  const url = network === 'opbnb' ? OPBNB_RPC : BSC_RPC;
  try {
    const hex = await rpc(url, 'eth_blockNumber', []);
    return { ok: true, network, block: parseInt(hex, 16) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function pancakeswap_quote({ token_in, token_out, amount_in } = {}) {
  return { ok: false, error: 'pancakeswap quote requires v3 SDK — use modules/defi or add bsc-swap-quoter' };
}
