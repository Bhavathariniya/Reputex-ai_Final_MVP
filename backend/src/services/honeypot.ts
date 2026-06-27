import { getChain } from '../chains';
import { httpJson } from '../lib/http';
import { cached } from '../lib/cache';
import { env } from '../config/env';

/**
 * honeypot.is integration — the single most important *direct* scam signal.
 *
 * It actually SIMULATES a buy and a sell on-chain, so it can tell us whether a
 * token can really be sold, and the true buy/sell tax. No API key required.
 */
const BASE = 'https://api.honeypot.is/v2';

export interface HoneypotInfo {
  available: boolean;
  isHoneypot?: boolean;
  buyTax?: number;
  sellTax?: number;
  transferTax?: number;
  simulationSuccess?: boolean;
  flags: string[];
  riskLevel?: string;
}

export async function checkHoneypot(chainSlug: string, address: string): Promise<HoneypotInfo> {
  const chain = getChain(chainSlug);
  if (chain.honeypotChainId === null) {
    return { available: false, flags: [] };
  }
  return cached(`honeypot:${chainSlug}:${address}`, env.CACHE_TTL_SECONDS, async () => {
    const data = await httpJson<any>(`${BASE}/IsHoneypot?address=${address}&chainID=${chain.honeypotChainId}`);
    if (!data) return { available: false, flags: [] };

    const hp = data.honeypotResult ?? {};
    const sim = data.simulationResult ?? {};
    const flags: string[] = Array.isArray(data.flags) ? data.flags : [];

    return {
      available: true,
      isHoneypot: Boolean(hp.isHoneypot),
      buyTax: numberOr(sim.buyTax),
      sellTax: numberOr(sim.sellTax),
      transferTax: numberOr(sim.transferTax),
      simulationSuccess: data.simulationSuccess !== false,
      flags,
      riskLevel: data?.summary?.risk,
    };
  });
}

function numberOr(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
}
