import { httpJson } from '../lib/http';
import { cached } from '../lib/cache';
import { env } from '../config/env';

/**
 * Dexscreener integration — real, key-free DEX market data.
 *
 * Provides genuine liquidity depth (USD in the pool), 24h volume, price change,
 * and pair age. Liquidity depth is the most reliable on-market rug signal:
 * a token with a few thousand dollars of liquidity can be drained instantly.
 */
const BASE = 'https://api.dexscreener.com/latest/dex/tokens';

export interface MarketInfo {
  available: boolean;
  name?: string;
  symbol?: string;
  priceUsd?: number;
  liquidityUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  marketCap?: number;
  pairCount?: number;
  pairAgeDays?: number;
  dexUrl?: string;
}

export async function getMarket(address: string): Promise<MarketInfo> {
  return cached(`dex:${address}`, env.CACHE_TTL_SECONDS, async () => {
    const data = await httpJson<any>(`${BASE}/${address}`);
    const pairs: any[] = data?.pairs ?? [];
    if (!pairs.length) return { available: false };

    // Use the deepest-liquidity pair as the canonical market.
    const main = pairs.reduce((best, cur) =>
      (cur.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? cur : best,
    );

    let pairAgeDays: number | undefined;
    if (main.pairCreatedAt) {
      pairAgeDays = Math.max(0, Math.floor((Date.now() - Number(main.pairCreatedAt)) / 86_400_000));
    }

    return {
      available: true,
      name: main.baseToken?.name,
      symbol: main.baseToken?.symbol,
      priceUsd: num(main.priceUsd),
      liquidityUsd: num(main.liquidity?.usd),
      volume24h: num(main.volume?.h24),
      priceChange24h: num(main.priceChange?.h24),
      marketCap: num(main.marketCap ?? main.fdv),
      pairCount: pairs.length,
      pairAgeDays,
      dexUrl: main.url,
    };
  });
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
