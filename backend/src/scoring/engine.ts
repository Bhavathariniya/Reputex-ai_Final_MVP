import { clamp, scanSource } from './signals';
import type {
  AnalyzeResult,
  LegacyMl,
  LegacyScores,
  Pillar,
  PillarKey,
  Reason,
  Severity,
  TokenSummary,
  Verdict,
} from './types';
import type { HoneypotInfo } from '../services/honeypot';
import type { SourceInfo, CreationInfo, OwnerInfo, HolderInfo } from '../services/explorer';
import type { MarketInfo } from '../services/dexscreener';
import type { CommunityInfo } from '../services/coingecko';

/**
 * ReputeX Trust Score — deterministic, transparent, evidence-based.
 *
 * Five pillars, each scored 0-100 (higher = safer) from REAL data only, then
 * combined by weight. Missing data lowers confidence instead of being faked.
 * On top of the weighted average we apply hard "veto" caps that encode how a
 * human auditor thinks (a confirmed honeypot can never score well, no matter
 * how good its marketing/community looks). See backend/SCORING.md for the full
 * methodology.
 */

const WEIGHTS: Record<PillarKey, number> = {
  tradability: 0.3,
  contractSecurity: 0.25,
  liquidity: 0.2,
  holderDistribution: 0.15,
  marketCommunity: 0.1,
};

const PILLAR_LABELS: Record<PillarKey, string> = {
  tradability: 'Tradability & Honeypot',
  contractSecurity: 'Contract Security',
  liquidity: 'Liquidity Depth',
  holderDistribution: 'Holder Distribution',
  marketCommunity: 'Market & Community',
};

export interface EngineInput {
  address: string;
  network: string;
  addressType: 'contract' | 'wallet' | 'unknown';
  honeypot: HoneypotInfo;
  source: SourceInfo;
  creation: CreationInfo;
  owner: OwnerInfo;
  holders: HolderInfo;
  market: MarketInfo;
  community: CommunityInfo;
  aiReasoning?: string;
  aiExtraRiskFactors?: string[];
}

interface PillarResult {
  score: number;
  available: boolean;
  reasons: Reason[];
}

// ---------------------------------------------------------------------------
// Pillar 1 — Tradability (can you actually sell? what's the real tax?)
// ---------------------------------------------------------------------------
function scoreTradability(hp: HoneypotInfo): PillarResult {
  const reasons: Reason[] = [];
  if (!hp.available) {
    return { score: 50, available: false, reasons: [] };
  }
  let score = 72;

  if (hp.isHoneypot) {
    reasons.push(r('critical', 'tradability', 'Honeypot confirmed — tokens cannot be sold after purchase.', 'honeypot.is simulation', 'honeypot.is'));
    return { score: 0, available: true, reasons };
  }
  reasons.push(r('positive', 'tradability', 'Buy/sell simulation succeeded — token is sellable.', undefined, 'honeypot.is'));

  const sell = hp.sellTax ?? 0;
  const buy = hp.buyTax ?? 0;
  if (sell >= 50) { score -= 50; reasons.push(r('critical', 'tradability', 'Extreme sell tax effectively traps funds.', `sell tax ${sell}%`, 'honeypot.is')); }
  else if (sell >= 30) { score -= 35; reasons.push(r('high', 'tradability', 'Very high sell tax.', `sell tax ${sell}%`, 'honeypot.is')); }
  else if (sell >= 15) { score -= 20; reasons.push(r('high', 'tradability', 'High sell tax.', `sell tax ${sell}%`, 'honeypot.is')); }
  else if (sell >= 8) { score -= 10; reasons.push(r('medium', 'tradability', 'Elevated sell tax.', `sell tax ${sell}%`, 'honeypot.is')); }

  if (buy >= 20) { score -= 18; reasons.push(r('high', 'tradability', 'Very high buy tax.', `buy tax ${buy}%`, 'honeypot.is')); }
  else if (buy >= 10) { score -= 8; reasons.push(r('medium', 'tradability', 'Elevated buy tax.', `buy tax ${buy}%`, 'honeypot.is')); }

  if (hp.simulationSuccess === false) { score -= 25; reasons.push(r('high', 'tradability', 'Trade simulation failed — tradability could not be verified.', undefined, 'honeypot.is')); }
  if (hp.flags && hp.flags.length > 0) { score -= Math.min(15, hp.flags.length * 5); reasons.push(r('medium', 'tradability', `Provider raised ${hp.flags.length} warning flag(s).`, hp.flags.slice(0, 3).join(', '), 'honeypot.is')); }

  return { score: clamp(score), available: true, reasons };
}

// ---------------------------------------------------------------------------
// Pillar 2 — Contract Security (verification, ownership, dangerous code, age)
// ---------------------------------------------------------------------------
function scoreContractSecurity(source: SourceInfo, owner: OwnerInfo, creation: CreationInfo): PillarResult {
  const reasons: Reason[] = [];
  const available = source.available || owner.available || creation.available;
  let score = 55;

  // Verification
  if (source.available) {
    if (source.isVerified) {
      score += 20;
      reasons.push(r('positive', 'contractSecurity', 'Source code is verified and publicly auditable.', source.contractName, 'Etherscan'));
    } else {
      score -= 35;
      reasons.push(r('high', 'contractSecurity', 'Source code is NOT verified — contract behaviour is opaque.', undefined, 'Etherscan'));
    }
  }

  // Ownership (real on-chain owner() read)
  if (owner.available) {
    if (owner.renounced) {
      score += 20;
      reasons.push(r('positive', 'contractSecurity', 'Ownership renounced (owner = 0x0) — privileged functions are locked.', undefined, 'eth_call owner()'));
    } else {
      score -= 12;
      reasons.push(r('medium', 'contractSecurity', 'Ownership not renounced — owner retains privileged control.', owner.owner, 'eth_call owner()'));
    }
  }

  // Static red-flag scan of verified source
  const scan = scanSource(source.sourceCode);
  if (scan.scanned) {
    let penalty = 0;
    for (const cap of scan.capabilities) {
      const p = cap.severity === 'high' ? 8 : 4;
      penalty += p;
      reasons.push(r(cap.severity, 'contractSecurity', `${cap.label}: ${cap.note}`, undefined, 'source scan'));
    }
    score -= Math.min(30, penalty); // cap total code-flag penalty
    if (scan.capabilities.length === 0) {
      reasons.push(r('positive', 'contractSecurity', 'No common dangerous capabilities found in source.', undefined, 'source scan'));
    }
  }

  // Contract age
  if (creation.ageDays !== undefined) {
    const d = creation.ageDays;
    if (d > 365) { score += 12; reasons.push(r('positive', 'contractSecurity', 'Established contract (>1 year old).', `${d} days`, 'Etherscan')); }
    else if (d >= 30) { score += 4; }
    else if (d >= 7) { score -= 8; reasons.push(r('medium', 'contractSecurity', 'Young contract (under 1 month).', `${d} days`, 'Etherscan')); }
    else { score -= 18; reasons.push(r('high', 'contractSecurity', 'Very new contract (under 1 week) — elevated rug risk.', `${d} days`, 'Etherscan')); }
  }

  return { score: clamp(score), available, reasons };
}

// ---------------------------------------------------------------------------
// Pillar 3 — Liquidity Depth (can the market absorb a sell? rug-ability)
// ---------------------------------------------------------------------------
function scoreLiquidity(market: MarketInfo): PillarResult {
  const reasons: Reason[] = [];
  if (!market.available) return { score: 50, available: false, reasons: [] };
  let score = 50;

  const liq = market.liquidityUsd ?? 0;
  if (liq >= 1_000_000) { score += 35; reasons.push(r('positive', 'liquidity', 'Deep liquidity pool.', usd(liq), 'Dexscreener')); }
  else if (liq >= 250_000) { score += 25; reasons.push(r('positive', 'liquidity', 'Healthy liquidity.', usd(liq), 'Dexscreener')); }
  else if (liq >= 100_000) { score += 12; }
  else if (liq >= 25_000) { score -= 5; reasons.push(r('medium', 'liquidity', 'Shallow liquidity.', usd(liq), 'Dexscreener')); }
  else if (liq >= 5_000) { score -= 25; reasons.push(r('high', 'liquidity', 'Very low liquidity — high slippage and rug risk.', usd(liq), 'Dexscreener')); }
  else { score -= 40; reasons.push(r('critical', 'liquidity', 'Negligible liquidity — can be drained almost instantly.', usd(liq), 'Dexscreener')); }

  const vol = market.volume24h ?? 0;
  if (vol >= 100_000) { score += 8; }
  else if (vol < 1_000) { score -= 12; reasons.push(r('medium', 'liquidity', 'Almost no 24h trading volume.', usd(vol), 'Dexscreener')); }

  if (market.pairAgeDays !== undefined && market.pairAgeDays < 2) {
    score -= 12;
    reasons.push(r('medium', 'liquidity', 'Trading pair created in the last 48h.', `${market.pairAgeDays} days`, 'Dexscreener'));
  }

  return { score: clamp(score), available: true, reasons };
}

// ---------------------------------------------------------------------------
// Pillar 4 — Holder Distribution (whale dump risk)
// ---------------------------------------------------------------------------
function scoreHolders(holders: HolderInfo): PillarResult {
  const reasons: Reason[] = [];
  if (!holders.available || holders.top10Pct === undefined) {
    return { score: 50, available: false, reasons: [] };
  }
  const top10 = holders.top10Pct;
  let score: number;
  if (top10 <= 20) score = 90;
  else if (top10 <= 40) score = 75;
  else if (top10 <= 50) score = 60;
  else if (top10 <= 70) score = 40;
  else if (top10 <= 90) score = 20;
  else score = 10;

  const sev: Severity = top10 > 70 ? 'high' : top10 > 50 ? 'medium' : 'positive';
  reasons.push(r(sev, 'holderDistribution', `Top 10 holders control ${top10.toFixed(1)}% of supply.`, undefined, 'Etherscan'));
  return { score, available: true, reasons };
}

// ---------------------------------------------------------------------------
// Pillar 5 — Market & Community (volatility, wash-volume, social presence)
// ---------------------------------------------------------------------------
function scoreMarketCommunity(market: MarketInfo, community: CommunityInfo): PillarResult {
  const reasons: Reason[] = [];
  const available = market.available || community.available;
  let score = 50;

  if (market.available && market.priceChange24h !== undefined) {
    const v = Math.abs(market.priceChange24h);
    if (v < 5) score += 12;
    else if (v < 15) score += 5;
    else if (v > 100) { score -= 30; reasons.push(r('high', 'marketCommunity', 'Extreme 24h price swing.', `${market.priceChange24h.toFixed(1)}%`, 'Dexscreener')); }
    else if (v > 50) { score -= 18; reasons.push(r('medium', 'marketCommunity', 'High volatility.', `${market.priceChange24h.toFixed(1)}%`, 'Dexscreener')); }
  }

  if (market.available && market.marketCap && market.volume24h) {
    const ratio = market.volume24h / market.marketCap;
    if (ratio > 3) { score -= 15; reasons.push(r('medium', 'marketCommunity', 'Volume far exceeds market cap — possible wash trading.', `vol/mcap ${ratio.toFixed(1)}x`, 'Dexscreener')); }
    else if (ratio >= 0.05 && ratio <= 1) score += 8;
  }

  if (community.available) {
    const tw = community.twitterFollowers ?? 0;
    const tg = community.telegramUsers ?? 0;
    if (tw > 50_000) score += 10; else if (tw > 10_000) score += 5;
    if (tg > 20_000) score += 8; else if (tg > 5_000) score += 4;
    if ((community.sentimentUpPct ?? 0) > 70) score += 6;
    if (tw > 10_000 || tg > 5_000) {
      reasons.push(r('positive', 'marketCommunity', 'Established social presence.', `${tw} Twitter / ${tg} Telegram`, 'CoinGecko'));
    }
  }

  return { score: clamp(score), available, reasons };
}

// ---------------------------------------------------------------------------
// Combine
// ---------------------------------------------------------------------------
export function computeScore(input: EngineInput): AnalyzeResult {
  const t = scoreTradability(input.honeypot);
  const c = scoreContractSecurity(input.source, input.owner, input.creation);
  const l = scoreLiquidity(input.market);
  const h = scoreHolders(input.holders);
  const m = scoreMarketCommunity(input.market, input.community);

  const pillarResults: Record<PillarKey, PillarResult> = {
    tradability: t,
    contractSecurity: c,
    liquidity: l,
    holderDistribution: h,
    marketCommunity: m,
  };

  const pillars: Pillar[] = (Object.keys(WEIGHTS) as PillarKey[]).map((key) => ({
    key,
    label: PILLAR_LABELS[key],
    score: Math.round(pillarResults[key].score),
    weight: WEIGHTS[key],
    available: pillarResults[key].available,
  }));

  // Weighted average over AVAILABLE pillars; coverage = confidence.
  const availableWeight = pillars.filter((p) => p.available).reduce((s, p) => s + p.weight, 0);
  let weighted =
    availableWeight > 0
      ? pillars.filter((p) => p.available).reduce((s, p) => s + p.score * p.weight, 0) / availableWeight
      : 40;

  // Veto caps — encode hard auditor rules that override a rosy average.
  const caps: number[] = [];
  const hp = input.honeypot;
  if (hp.available && hp.isHoneypot) caps.push(12);
  if (hp.available && (hp.sellTax ?? 0) >= 50) caps.push(25);
  if (hp.available && hp.simulationSuccess === false) caps.push(45);
  if (input.source.available && !input.source.isVerified) caps.push(60);
  const scan = scanSource(input.source.sourceCode);
  const hasHighCap = scan.capabilities.some((x) => x.severity === 'high');
  if (input.owner.available && input.owner.renounced === false && hasHighCap) caps.push(68);

  const cap = caps.length ? Math.min(...caps) : 100;
  const trustScore = Math.round(clamp(Math.min(weighted, cap)));

  // Confidence: data coverage, but the honeypot check is pivotal — without it
  // we cap confidence regardless of how much else we gathered.
  let confidence = availableWeight;
  if (!hp.available) confidence = Math.min(confidence, 0.6);
  confidence = Math.round(confidence * 100) / 100;

  const allReasons = [t, c, l, h, m]
    .flatMap((p) => p.reasons)
    .sort((a, b) => sevRank(a.severity) - sevRank(b.severity));

  const riskFactors = allReasons
    .filter((x) => x.severity === 'critical' || x.severity === 'high' || x.severity === 'medium')
    .map((x) => `${x.message}${x.evidence ? ` (${x.evidence})` : ''}`);
  if (input.aiExtraRiskFactors) riskFactors.push(...input.aiExtraRiskFactors);

  const verdict = toVerdict(trustScore);
  const recommendations = buildRecommendations(trustScore, verdict, input);

  const token = buildTokenSummary(input);

  const scores = projectLegacyScores(trustScore, pillarResults);
  const ml = projectLegacyMl(trustScore, pillarResults, confidence, recommendations, riskFactors, input.aiReasoning);

  return {
    address: input.address,
    network: input.network,
    addressType: input.addressType,
    trustScore,
    verdict,
    confidence,
    pillars,
    reasons: allReasons,
    riskFactors: riskFactors.length ? riskFactors : ['No major risk factors identified from available data.'],
    recommendations,
    token,
    honeypot: {
      checked: hp.available,
      isHoneypot: hp.available ? Boolean(hp.isHoneypot) : null,
      buyTax: hp.buyTax ?? null,
      sellTax: hp.sellTax ?? null,
    },
    dataSources: {
      honeypot: hp.available,
      etherscan: input.source.available || input.creation.available || input.owner.available,
      holders: input.holders.available,
      dexscreener: input.market.available,
      coingecko: input.community.available,
      ai: Boolean(input.aiReasoning),
    },
    aiReasoning: input.aiReasoning,
    scores,
    ml,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function r(severity: Severity, pillar: PillarKey, message: string, evidence: string | undefined, source: string): Reason {
  return { severity, pillar, message, evidence, source };
}

function sevRank(s: Severity): number {
  return { critical: 0, high: 1, medium: 2, low: 3, positive: 4, info: 5 }[s];
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function toVerdict(score: number): Verdict {
  if (score >= 80) return 'Likely Safe';
  if (score >= 60) return 'Probably OK';
  if (score >= 40) return 'High Caution';
  if (score >= 20) return 'High Risk';
  return 'Critical - Avoid';
}

function buildRecommendations(score: number, verdict: Verdict, input: EngineInput): string[] {
  const recs: string[] = [];
  if (input.honeypot.available && input.honeypot.isHoneypot) {
    recs.push('🚨 Do NOT buy — this token is a confirmed honeypot (you will not be able to sell).');
  }
  if (input.source.available && !input.source.isVerified) {
    recs.push('Avoid unverified contracts, or only risk what you can afford to lose.');
  }
  if (input.owner.available && input.owner.renounced === false) {
    recs.push('Owner retains control — watch for fee/blacklist changes before committing funds.');
  }
  if (input.market.available && (input.market.liquidityUsd ?? 0) < 25_000) {
    recs.push('Low liquidity means high slippage; size positions small and use limit orders.');
  }
  if (score >= 80) recs.push('Risk signals are low, but always verify the official contract address.');
  else if (score >= 60) recs.push('Moderate risk — do your own research and start with a small test transaction.');
  else recs.push('Elevated risk — strongly consider avoiding or waiting for more track record.');
  return recs;
}

function buildTokenSummary(input: EngineInput): TokenSummary {
  return {
    name: input.community.name ?? input.market.name ?? input.source.contractName,
    symbol: input.community.symbol ?? input.market.symbol,
    creator: input.creation.contractCreator,
    creationDate: input.creation.creationDate,
    ageDays: input.creation.ageDays,
    priceUsd: input.market.priceUsd,
    marketCap: input.market.marketCap ?? input.community.marketCapUsd,
    liquidityUsd: input.market.liquidityUsd,
    volume24h: input.market.volume24h ?? input.community.totalVolumeUsd,
    priceChange24h: input.market.priceChange24h,
  };
}

function projectLegacyScores(trust: number, p: Record<PillarKey, PillarResult>): LegacyScores {
  return {
    trust_score: trust,
    developer_score: Math.round(p.contractSecurity.score),
    liquidity_score: Math.round(p.liquidity.score),
    community_score: Math.round(p.marketCommunity.score),
    holder_distribution: Math.round(p.holderDistribution.score),
    fraud_risk: Math.round(clamp(100 - p.tradability.score)),
    social_sentiment: Math.round(p.marketCommunity.score),
  };
}

function projectLegacyMl(
  trust: number,
  p: Record<PillarKey, PillarResult>,
  confidence: number,
  recommendations: string[],
  riskFactors: string[],
  aiReasoning?: string,
): LegacyMl {
  const confidenceLevel: LegacyMl['confidenceLevel'] =
    confidence > 0.85 ? 'Very High' : confidence > 0.7 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';

  return {
    mlScore: {
      overallRisk: Math.round(clamp(100 - trust)),
      rugPullRisk: Math.round(clamp(100 - p.contractSecurity.score)),
      liquidityRisk: Math.round(clamp(100 - p.liquidity.score)),
      contractRisk: Math.round(clamp(100 - p.contractSecurity.score)),
      communityRisk: Math.round(clamp(100 - p.marketCommunity.score)),
      confidence,
    },
    features: {
      contractSecurity: Math.round(p.contractSecurity.score),
      liquiditySafety: Math.round(p.liquidity.score),
      communityHealth: Math.round(p.marketCommunity.score),
      marketStability: Math.round(p.marketCommunity.score),
      ownershipRisk: Math.round(clamp(100 - p.contractSecurity.score)),
      honeypotRisk: Math.round(clamp(100 - p.tradability.score)),
    },
    recommendations,
    riskFactors,
    confidenceLevel,
    ...(aiReasoning ? { geminiAnalysis: { reasoning: aiReasoning, confidence: Math.round(confidence * 100) } } : {}),
  };
}
