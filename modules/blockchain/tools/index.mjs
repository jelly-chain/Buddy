// blockchain tools — multi-chain balance, fee estimate, address validation, RPC router
// Now with automatic multi-RPC fallback for resilience.

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
    'https://base.llamarpc.com',
    'https://mainnet.base.org',
    'https://1rpc.io/base'
  ].filter(Boolean),
  polygon: [
    process.env.POLYGON_RPC,
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon',
    'https://1rpc.io/matic'
  ].filter(Boolean),
  arbitrum: [
    process.env.ARBITRUM_RPC,
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://1rpc.io/arb'
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
    'https://opbnb-mainnet-rpc.bnbchain.org',
    'https://opbnb.publicnode.com'
  ].filter(Boolean),
  optimism: [
    process.env.OPTIMISM_RPC,
    'https://optimism-rpc.publicnode.com',
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://1rpc.io/op'
  ].filter(Boolean),
  solana: [
    process.env.SOLANA_RPC,
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana'
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
  const json = await r.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

// Try each RPC in the pool until one succeeds
async function rpc(chain, method, params = []) {
  const pool = RPC_POOLS[chain];
  if (!pool || pool.length === 0) throw new Error(`unknown chain ${chain}`);
  const errors = [];
  for (const url of pool) {
    try {
      const result = await rpcCall(url, method, params);
      return { result, url };
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  const err = new Error(`All RPCs failed for ${chain}: ${errors.join(' | ')}`);
  err.details = errors;
  throw err;
}

function isEvmAddr(a) { return /^0x[a-fA-F0-9]{40}$/.test(a); }
function isSolAddr(a) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a); }

export async function validate_address({ address = '', chain = '' } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  const isEvm = isEvmAddr(address);
  const isSol = isSolAddr(address);
  return { ok: true, address, is_evm: isEvm, is_solana: isSol, detected_chain: isEvm ? 'evm' : isSol ? 'solana' : 'unknown' };
}

export async function balance({ address, chain = 'ethereum' } = {}) {
  if (!address) return { ok: false, error: 'address required' };
  if (!RPC_POOLS[chain]) return { ok: false, error: `unknown chain ${chain}`, supported: Object.keys(RPC_POOLS) };
  try {
    if (chain === 'solana') {
      const { result, url } = await rpc(chain, 'getBalance', [address]);
      const lamports = result.value ?? result;
      return { ok: true, chain, address, balance_sol: lamports / 1e9, lamports, rpc: url };
    }
    const { result: hex, url } = await rpc(chain, 'eth_getBalance', [address, 'latest']);
    const wei = BigInt(hex);
    return { ok: true, chain, address, balance_native: Number(wei) / 1e18, wei: wei.toString(), rpc: url };
  } catch (e) {
    return { ok: false, chain, error: e.message, details: e.details };
  }
}

export async function gas_price({ chain = 'ethereum' } = {}) {
  if (!RPC_POOLS[chain]) return { ok: false, error: `unknown chain ${chain}` };
  try {
    if (chain === 'solana') {
      const { result, url } = await rpc(chain, 'getRecentPrioritizationFees', [[]]);
      return { ok: true, chain, fees: result.slice(0, 5), rpc: url };
    }
    const { result: hex, url } = await rpc(chain, 'eth_gasPrice', []);
    const wei = BigInt(hex);
    return { ok: true, chain, gas_price_gwei: Number(wei) / 1e9, wei: wei.toString(), rpc: url };
  } catch (e) {
    return { ok: false, error: e.message, details: e.details };
  }
}

export async function block_number({ chain = 'ethereum' } = {}) {
  if (!RPC_POOLS[chain]) return { ok: false, error: `unknown chain ${chain}` };
  try {
    if (chain === 'solana') {
      const { result, url } = await rpc(chain, 'getSlot', []);
      return { ok: true, chain, slot: result, rpc: url };
    }
    const { result: hex, url } = await rpc(chain, 'eth_blockNumber', []);
    return { ok: true, chain, block: parseInt(hex, 16), rpc: url };
  } catch (e) {
    return { ok: false, error: e.message, details: e.details };
  }
}

export async function tx_receipt({ hash, chain = 'ethereum' } = {}) {
  if (!hash) return { ok: false, error: 'hash required' };
  if (!RPC_POOLS[chain]) return { ok: false, error: `unknown chain ${chain}` };
  try {
    if (chain === 'solana') {
      const { result, url } = await rpc(chain, 'getTransaction', [hash, { maxSupportedTransactionVersion: 0 }]);
      return { ok: true, chain, tx: result, rpc: url };
    }
    const { result, url } = await rpc(chain, 'eth_getTransactionReceipt', [hash]);
    return { ok: true, chain, receipt: result, rpc: url };
  } catch (e) {
    return { ok: false, error: e.message, details: e.details };
  }
}

export async function chain_id({ chain = 'ethereum' } = {}) {
  if (!RPC_POOLS[chain]) return { ok: false, error: `unknown chain ${chain}` };
  try {
    if (chain === 'solana') return { ok: true, chain, chain_id: 'solana-mainnet' };
    const { result: hex, url } = await rpc(chain, 'eth_chainId', []);
    return { ok: true, chain, chain_id: parseInt(hex, 16), rpc: url };
  } catch (e) {
    return { ok: false, error: e.message, details: e.details };
  }
}

export async function rpc_health({ chain } = {}) {
  const chains = chain ? [chain] : Object.keys(RPC_POOLS);
  const results = {};
  for (const c of chains) {
    results[c] = [];
    for (const url of RPC_POOLS[c]) {
      try {
        const t0 = Date.now();
        await rpcCall(url, c === 'solana' ? 'getSlot' : 'eth_blockNumber', []);
        results[c].push({ url, ok: true, ms: Date.now() - t0 });
      } catch (e) {
        results[c].push({ url, ok: false, error: e.message });
      }
    }
  }
  return { ok: true, results };
}

export async function chains() {
  const pools = {};
  for (const c of Object.keys(RPC_POOLS)) pools[c] = RPC_POOLS[c];
  return { ok: true, supported: Object.keys(RPC_POOLS), pools };
}
