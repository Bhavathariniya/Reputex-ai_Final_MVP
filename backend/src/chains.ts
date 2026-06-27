/**
 * Chain registry.
 *
 * We use the Etherscan **V2 multichain API** (`api.etherscan.io/v2/api?chainid=`),
 * which lets a single Etherscan API key serve 50+ EVM chains. This replaces the
 * old per-explorer-key approach and is why one ETHERSCAN_API_KEY covers all
 * supported networks below.
 *
 * honeypotChainId maps to the chains supported by honeypot.is (the real
 * buy/sell simulation provider). Where it is null, honeypot simulation is
 * unavailable and the tradability pillar degrades to lower confidence.
 */
export interface ChainInfo {
  id: string;
  chainId: number;
  name: string;
  explorerApi: string;
  explorerUrl: string;
  /** CoinGecko asset-platform id, for market data lookups. */
  coingeckoPlatform: string | null;
  /** honeypot.is chainID, or null if unsupported. */
  honeypotChainId: number | null;
}

const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';

export const CHAINS: Record<string, ChainInfo> = {
  ethereum: {
    id: 'ethereum', chainId: 1, name: 'Ethereum', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://etherscan.io', coingeckoPlatform: 'ethereum', honeypotChainId: 1,
  },
  binance: {
    id: 'binance', chainId: 56, name: 'BNB Chain', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://bscscan.com', coingeckoPlatform: 'binance-smart-chain', honeypotChainId: 56,
  },
  polygon: {
    id: 'polygon', chainId: 137, name: 'Polygon', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://polygonscan.com', coingeckoPlatform: 'polygon-pos', honeypotChainId: 137,
  },
  arbitrum: {
    id: 'arbitrum', chainId: 42161, name: 'Arbitrum', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://arbiscan.io', coingeckoPlatform: 'arbitrum-one', honeypotChainId: 42161,
  },
  optimism: {
    id: 'optimism', chainId: 10, name: 'Optimism', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://optimistic.etherscan.io', coingeckoPlatform: 'optimistic-ethereum', honeypotChainId: 10,
  },
  avalanche: {
    id: 'avalanche', chainId: 43114, name: 'Avalanche', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://snowtrace.io', coingeckoPlatform: 'avalanche', honeypotChainId: 43114,
  },
  fantom: {
    id: 'fantom', chainId: 250, name: 'Fantom', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://ftmscan.com', coingeckoPlatform: 'fantom', honeypotChainId: 250,
  },
  base: {
    id: 'base', chainId: 8453, name: 'Base', explorerApi: ETHERSCAN_V2,
    explorerUrl: 'https://basescan.org', coingeckoPlatform: 'base', honeypotChainId: 8453,
  },
};

export const DEFAULT_CHAIN = 'ethereum';

export function getChain(id: string | undefined | null): ChainInfo {
  if (!id) return CHAINS[DEFAULT_CHAIN];
  return CHAINS[id.toLowerCase()] ?? CHAINS[DEFAULT_CHAIN];
}

export function isSupportedChain(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHAINS, id.toLowerCase());
}

export const EVM_CHAIN_IDS = Object.keys(CHAINS);

export function explorerAddressUrl(chainId: string, address: string): string {
  return `${getChain(chainId).explorerUrl}/address/${address}`;
}
