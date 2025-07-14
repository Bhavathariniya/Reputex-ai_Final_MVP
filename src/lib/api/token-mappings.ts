// Common token symbol to CoinGecko ID mappings
export const tokenSymbolToId: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  usdt: 'tether',
  bnb: 'binancecoin',
  usdc: 'usd-coin',
  xrp: 'ripple',
  sol: 'solana',
  ada: 'cardano',
  doge: 'dogecoin',
  matic: 'matic-network',
  dot: 'polkadot',
  ltc: 'litecoin',
  shib: 'shiba-inu',
  avax: 'avalanche-2',
  dai: 'dai',
  link: 'chainlink',
  atom: 'cosmos',
  uni: 'uniswap',
  okb: 'okb',
  etc: 'ethereum-classic',
  xlm: 'stellar',
  near: 'near',
  ape: 'apecoin',
  fil: 'filecoin',
  hbar: 'hedera-hashgraph',
  vet: 'vechain',
  icp: 'internet-computer',
  mana: 'decentraland',
  sand: 'the-sandbox',
  xmr: 'monero',
  aave: 'aave',
  egld: 'elrond-erd-2',
  theta: 'theta-token',
  axs: 'axie-infinity',
  algo: 'algorand',
  xtz: 'tezos',
  ftm: 'fantom',
  eos: 'eos',
  snx: 'havven',
  cake: 'pancakeswap-token',
  kcs: 'kucoin-shares',
  flow: 'flow',
  grt: 'the-graph',
  neo: 'neo',
  hnt: 'helium',
  ar: 'arweave',
  klay: 'klay-token',
  btt: 'bittorrent',
  waves: 'waves',
  mkr: 'maker',
  chz: 'chiliz',
  inch: '1inch',
  ens: 'ethereum-name-service',
  crv: 'curve-dao-token',
  comp: 'compound-governance-token',
  ldo: 'lido-dao',
  gmt: 'stepn',
  pepe: 'pepe',
  arb: 'arbitrum'
};

/**
 * Get CoinGecko ID from token symbol
 * @param symbol Token symbol (case insensitive)
 * @returns CoinGecko ID or undefined if not found
 */
export function getCoinGeckoIdFromSymbol(symbol?: string): string | undefined {
  if (!symbol) return undefined;
  return tokenSymbolToId[symbol.toLowerCase()];
}

/**
 * Maps a token symbol from Etherscan to a CoinGecko ID
 * This allows us to fetch token images for tokens found via Etherscan
 */
export function mapEtherscanSymbolToCoinGeckoId(symbol: string): string | undefined {
  const lowerSymbol = symbol.toLowerCase();
  
  // Add mappings for common tokens
  const symbolToId: Record<string, string> = {
    'eth': 'ethereum',
    'weth': 'weth',
    'usdt': 'tether',
    'usdc': 'usd-coin',
    'dai': 'dai',
    'link': 'chainlink',
    'uni': 'uniswap',
    'bnb': 'binancecoin',
    'matic': 'matic-network',
    'aave': 'aave',
    'mkr': 'maker',
    'comp': 'compound-governance-token',
    'snx': 'havven',
    'crv': 'curve-dao-token',
    'yfi': 'yearn-finance',
    'sushi': 'sushi',
    'bal': 'balancer',
    '1inch': '1inch',
    'fei': 'fei-usd',
    'shib': 'shiba-inu',
  };
  
  return symbolToId[lowerSymbol];
}
