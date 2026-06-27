import { env } from '../config/env';
import { httpJson } from '../lib/http';
import { cachedIf } from '../lib/cache';
import type { HolderInfo } from './explorer';

/**
 * Moralis integration — real token holder distribution.
 *
 * This is what makes the Holder Distribution pillar genuine. The `/holders`
 * stats endpoint returns the top-10 supply percentage and total holder count
 * directly (available on the free tier), so we no longer fall back to an
 * "unavailable" pillar for most tokens.
 */
const BASE = 'https://deep-index.moralis.io/api/v2.2';
const KEY = env.MORALIS_API_KEY ?? '';

/** Our chain slugs → Moralis chain identifiers. */
const CHAIN_MAP: Record<string, string> = {
  ethereum: 'eth',
  binance: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  avalanche: 'avalanche',
  fantom: 'fantom',
  base: 'base',
};

function headers(): Record<string, string> {
  return { 'X-API-Key': KEY, accept: 'application/json' };
}

export async function getHolderConcentration(chainSlug: string, address: string): Promise<HolderInfo> {
  if (!KEY) return { available: false };
  const chain = CHAIN_MAP[chainSlug];
  if (!chain) return { available: false };

  return cachedIf(`moralis-holders:${chainSlug}:${address}`, env.CACHE_TTL_SECONDS, (v) => v.available, async () => {
    // Primary: holder stats (one call → top10 supply % + total holders).
    const stats = await httpJson<any>(`${BASE}/erc20/${address}/holders?chain=${chain}`, { headers: headers() });
    const top10FromStats = num(stats?.holderSupply?.top10?.supplyPercent);
    if (top10FromStats !== undefined) {
      return { available: true, holderCount: num(stats?.totalHolders), top10Pct: top10FromStats };
    }

    // Fallback: top-100 owners list → compute top-10 share ourselves.
    const owners = await httpJson<any>(
      `${BASE}/erc20/${address}/owners?chain=${chain}&limit=100&order=DESC`,
      { headers: headers() },
    );
    const rows: any[] = owners?.result ?? [];
    if (rows.length === 0) return { available: false };

    let top10Pct: number | undefined;
    if (num(rows[0]?.percentage_relative_to_total_supply) !== undefined) {
      top10Pct = rows
        .slice(0, 10)
        .reduce((s, r) => s + (num(r.percentage_relative_to_total_supply) ?? 0), 0);
    } else {
      const total = num(owners?.totalSupply);
      if (total && total > 0) {
        const top10 = rows.slice(0, 10).reduce((s, r) => s + (num(r.balance_formatted) ?? 0), 0);
        top10Pct = (top10 / total) * 100;
      }
    }
    if (top10Pct === undefined) return { available: false };
    return { available: true, holderCount: num(owners?.total) ?? rows.length, top10Pct };
  });
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
