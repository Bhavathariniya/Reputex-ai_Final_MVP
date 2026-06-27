import { CHAINS, DEFAULT_CHAIN, EVM_CHAIN_IDS, getChain, isSupportedChain } from '../chains';
import { getCode, getCreation, getHolderConcentration as explorerHolders, getOwner, getSourceCode } from './explorer';
import { getHolderConcentration as moralisHolders } from './moralis';
import type { HolderInfo } from './explorer';
import { checkHoneypot } from './honeypot';
import { getMarket } from './dexscreener';
import { getCommunity } from './coingecko';
import { explain } from './gemini';
import { computeScore, type EngineInput } from '../scoring/engine';
import type { AnalyzeResult } from '../scoring/types';
import { logger } from '../lib/logger';

/**
 * Resolve which EVM chain an address lives on by checking where it actually has
 * deployed bytecode. This REPLACES the old `Math.random()` chain picker — it is
 * a genuine on-chain probe. Priority order favours the highest-activity chains
 * to keep the probe cheap.
 */
const DETECT_ORDER = ['ethereum', 'binance', 'base', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom'];

async function detectChain(address: string): Promise<{ network: string; isContract: boolean }> {
  const checks = await Promise.allSettled(
    DETECT_ORDER.map(async (slug) => ({ slug, code: await getCode(slug, address) })),
  );
  for (const slug of DETECT_ORDER) {
    const found = checks.find((c) => c.status === 'fulfilled' && c.value.slug === slug) as
      | PromiseFulfilledResult<{ slug: string; code: string }>
      | undefined;
    if (found && found.value.code && found.value.code !== '0x') {
      return { network: slug, isContract: true };
    }
  }
  // No bytecode anywhere → it's a wallet (or an unsupported chain).
  return { network: DEFAULT_CHAIN, isContract: false };
}

/**
 * Resolve holder concentration from the best available source: Moralis first
 * (real top-10 supply % + total holders, free tier), then Etherscan Pro as a
 * fallback. If neither has data, the pillar honestly reports unavailable.
 */
async function resolveHolders(chainSlug: string, address: string): Promise<HolderInfo> {
  const fromMoralis = await moralisHolders(chainSlug, address);
  if (fromMoralis.available) return fromMoralis;
  return explorerHolders(chainSlug, address);
}

export interface AnalyzeOptions {
  address: string;
  network?: string;
  /** Skip the Gemini explanation layer (faster, deterministic-only). */
  skipAi?: boolean;
}

export async function analyzeToken(opts: AnalyzeOptions): Promise<AnalyzeResult> {
  const address = opts.address.toLowerCase();

  // 1. Resolve network + address type (real on-chain checks).
  let network = opts.network && opts.network !== 'auto' ? opts.network.toLowerCase() : '';
  let addressType: 'contract' | 'wallet' | 'unknown' = 'unknown';

  if (network && isSupportedChain(network)) {
    const code = await getCode(network, address);
    addressType = code === null ? 'unknown' : code === '0x' ? 'wallet' : code.length > 2 ? 'contract' : 'unknown';
  } else {
    const detected = await detectChain(address);
    network = detected.network;
    addressType = detected.isContract ? 'contract' : 'wallet';
  }

  const chain = getChain(network);
  logger.info('analyze_start', { address, network: chain.id, addressType });

  // 2. Gather every real signal in parallel. Each call self-degrades to
  //    "unavailable" on failure, so one dead provider never sinks the analysis.
  const [honeypot, source, creation, owner, holders, market, community] = await Promise.all([
    checkHoneypot(chain.id, address),
    getSourceCode(chain.id, address),
    getCreation(chain.id, address),
    getOwner(chain.id, address),
    resolveHolders(chain.id, address),
    getMarket(address),
    getCommunity(chain.id, address),
  ]);

  const baseInput: EngineInput = {
    address,
    network: chain.id,
    addressType,
    honeypot,
    source,
    creation,
    owner,
    holders,
    market,
    community,
  };

  // 3. Deterministic score first (this is the source of truth).
  const preliminary = computeScore(baseInput);

  // 4. Optional AI explanation layer (narrative + extra red flags only).
  if (opts.skipAi) return preliminary;

  const ai = await explain(
    {
      trustScore: preliminary.trustScore,
      verdict: preliminary.verdict,
      pillars: preliminary.pillars,
      reasons: preliminary.reasons.slice(0, 12),
      honeypot: preliminary.honeypot,
    },
    source.sourceCode,
  );

  if (!ai.available) return preliminary;

  // Recompute (cheap, pure) so the AI narrative/flags are folded into the result.
  return computeScore({ ...baseInput, aiReasoning: ai.reasoning, aiExtraRiskFactors: ai.extraRiskFactors });
}

export const SUPPORTED_NETWORKS = EVM_CHAIN_IDS;
export const NETWORK_META = CHAINS;
