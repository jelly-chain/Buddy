// evm tools — ERC20 balance, transfer estimate, gas, block, tx, nonce
// Self-healing multi-RPC fallback for resilience.

const RPC_POOLS = {
  ethereum: [
    process.env.ETH_RPC,
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://1rpc.io/eth'
  ].filter(Boolean),
  base: [
    process.env.BASE_RPC,
    'https://base-rpc.publicnode.com',
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://1rpc.io/base'
  ].filter(Boolean),
  polygon: [
    process.env.POLYGON_RPC,
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon'
  ].filter(Boolean),
  arbitrum: [
    process.env.ARBITRUM_RPC,
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum'
  ].filter(Boolean),
  optimism: [
    process.env.OPTIMISM_RPC,
    'https://optimism-rpc.publicnode.com',
    'https://mainnet.optimism.io'
  ].filter(Boolean),
  bnb: [
    process.env.BNB_RPC,
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed2.binance.org',
    'https://1rpc.io/bnb',
    'https://bsc.meowrpc.com',
    'https://rpc.ankr.com/bsc'
  ].filter(Boolean),
  opbnb: [
    process.env.OPBNB_RPC,
    'https://opbnb-rpc.publicnode.com',
    'https://opbnb-mainnet-rpc.bnbchain.org'
  ].filter(Boolean)
};

async function rpcCall(url, method, params = []) {
  const r = await fetch(url, {
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

async function rpc(chain, method, params = []) {
  const pool = RPC_POOLS[chain];
  if (!pool || pool.length === 0) throw new Error(`unknown chain ${chain}`);
  const errors = [];
  for (const url of pool) {
    try {
      return await rpcCall(url, method, params);
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  throw new Error(`All RPCs failed for ${chain}: ${errors.join(' | ')}`);
}

export async function native_balance({ address, chain = 'ethereum' } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  try {
    const hex = await rpc(chain, 'eth_getBalance', [address, 'latest']);
    const wei = BigInt(hex);
    return { ok: true, chain, address, eth: Number(wei) / 1e18, wei: wei.toString() };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ERC20 balanceOf(address) — selector 0x70a08231
export async function erc20_balance({ token, owner, chain = 'ethereum', decimals = 18 } = {}) {
  if (!token || !owner) return { ok: false, error: 'token and owner required' };
  try {
    const data = '0x70a08231' + owner.replace(/^0x/, '').padStart(64, '0');
    const hex = await rpc(chain, 'eth_call', [{ to: token, data }, 'latest']);
    const raw = BigInt(hex);
    return { ok: true, chain, token, owner, amount: Number(raw) / Math.pow(10, decimals), raw: raw.toString() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function erc20_info({ token, chain = 'ethereum' } = {}) {
  if (!token) return { ok: false, error: 'token required' };
  try {
    const [nameHex, symHex, decHex] = await Promise.all([
      rpc(chain, 'eth_call', [{ to: token, data: '0x06fdde03' }, 'latest']),
      rpc(chain, 'eth_call', [{ to: token, data: '0x95d89b41' }, 'latest']),
      rpc(chain, 'eth_call', [{ to: token, data: '0x313ce567' }, 'latest'])
    ]);
    const decode = hex => {
      if (!hex || hex === '0x') return '';
      const buf = Buffer.from(hex.slice(2), 'hex');
      const len = parseInt(hex.slice(66, 130), 16);
      return buf.slice(64, 64 + len).toString('utf8');
    };
    return { ok: true, chain, token, name: decode(nameHex), symbol: decode(symHex), decimals: parseInt(decHex, 16) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function nonce({ address, chain = 'ethereum' } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  try {
    const hex = await rpc(chain, 'eth_getTransactionCount', [address, 'latest']);
    return { ok: true, chain, address, nonce: parseInt(hex, 16) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function chain_id({ chain = 'ethereum' } = {}) {
  try {
    const hex = await rpc(chain, 'eth_chainId', []);
    return { ok: true, chain, chain_id: parseInt(hex, 16) };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function estimate_gas({ from, to, value = '0x0', data = '0x', chain = 'ethereum' } = {}) {
  if (!to) return { ok: false, error: 'to required' };
  try {
    const hex = await rpc(chain, 'eth_estimateGas', [{ from, to, value, data }]);
    return { ok: true, chain, gas: parseInt(hex, 16), hex };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function gas_price({ chain = 'ethereum' } = {}) {
  try {
    const hex = await rpc(chain, 'eth_gasPrice', []);
    const wei = BigInt(hex);
    return { ok: true, chain, gas_price_gwei: Number(wei) / 1e9, wei: wei.toString() };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function block({ chain = 'ethereum', number = 'latest', full = false } = {}) {
  try {
    const tag = typeof number === 'number' ? '0x' + number.toString(16) : number;
    const res = await rpc(chain, 'eth_getBlockByNumber', [tag, full]);
    return { ok: true, chain, block: res };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function chains() {
  return { ok: true, supported: Object.keys(RPC_POOLS), pools: RPC_POOLS };
}
