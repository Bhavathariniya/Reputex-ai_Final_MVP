/**
 * ReputeX backend client.
 *
 * This is the ONLY path the UI should use to analyze a token. All provider keys
 * and the scoring engine live server-side; the browser just calls this endpoint.
 * The legacy `src/lib/api/*` modules (direct provider calls from the browser)
 * are deprecated and no longer used in the main flow.
 */
import type { MLAnalysisResult } from './ml/tokenMLService';
import type { TokenData } from './api-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'positive' | 'info';

export interface BackendReason {
  severity: Severity;
  pillar: string;
  message: string;
  evidence?: string;
  source: string;
}

export interface BackendPillar {
  key: string;
  label: string;
  score: number;
  weight: number;
  available: boolean;
}

export interface AnalyzeResult {
  address: string;
  network: string;
  addressType: 'contract' | 'wallet' | 'unknown';
  trustScore: number;
  verdict: string;
  confidence: number;
  pillars: BackendPillar[];
  reasons: BackendReason[];
  riskFactors: string[];
  recommendations: string[];
  token: {
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    creator?: string;
    creationDate?: string;
    ageDays?: number;
    priceUsd?: number;
    marketCap?: number;
    liquidityUsd?: number;
    volume24h?: number;
    priceChange24h?: number;
  };
  honeypot: { checked: boolean; isHoneypot: boolean | null; buyTax: number | null; sellTax: number | null };
  dataSources: Record<string, boolean>;
  aiReasoning?: string;
  scores: {
    trust_score: number;
    developer_score: number;
    liquidity_score: number;
    community_score: number;
    holder_distribution: number;
    fraud_risk: number;
    social_sentiment: number;
  };
  ml: MLAnalysisResult;
  timestamp: string;
}

/** Call the backend risk engine. Throws on network/HTTP error so the caller can show a message. */
export async function analyzeAddress(address: string, network = 'auto'): Promise<AnalyzeResult> {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, network }),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.message || body.error || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as AnalyzeResult;
}

/** A view model matching the exact shapes the existing Result page renders. */
export interface ResultViewModel {
  mlAnalysis: MLAnalysisResult;
  tokenData: TokenData;
  analysisData: any;
  contractAnalysis: any;
  resolvedNetwork: string;
}

/** Map the backend result into the legacy UI shapes (no component changes needed). */
export function toResultViewModel(r: AnalyzeResult): ResultViewModel {
  const tokenData: TokenData = {
    tokenName: r.token.name || 'Unknown Token',
    tokenSymbol: r.token.symbol || '????',
    totalSupply: r.token.totalSupply || 'N/A',
    decimals: r.token.decimals ?? 18,
    holderCount: 0,
    isLiquidityLocked: false,
    isVerified: r.dataSources.etherscan,
    currentPrice: r.token.priceUsd,
    marketCap: r.token.marketCap,
    tradingVolume: r.token.volume24h,
    priceChange24h: r.token.priceChange24h,
    creationTime: r.token.creationDate,
    contractCreator: r.token.creator,
  };

  const scamIndicators = r.riskFactors.map((f) => ({ label: 'Risk Factor', description: f }));

  const analysisData = {
    scores: r.scores,
    analysis: r.aiReasoning || buildPlainSummary(r),
    scamIndicators,
    verdict: r.verdict,
    confidence: r.confidence,
    reasons: r.reasons,
    recommendations: r.recommendations,
    timestamp: r.timestamp,
    tokenData,
  };

  const contractAnalysis = {
    tokenOverview: {
      name: tokenData.tokenName,
      symbol: tokenData.tokenSymbol,
      address: r.address,
      decimals: tokenData.decimals,
      totalSupply: tokenData.totalSupply,
      deployer: r.token.creator || 'Unknown',
      creationTime: r.token.creationDate || 'Unavailable',
    },
    rugPullRisk: {
      score: r.ml.mlScore.rugPullRisk,
      level: riskLabel(r.ml.mlScore.rugPullRisk),
      indicators: scamIndicators,
      ownershipRenounced: false,
    },
    honeypotCheck: {
      isHoneypot: Boolean(r.honeypot.isHoneypot),
      risk: riskLabel(r.ml.mlScore.liquidityRisk),
      indicators: r.honeypot.isHoneypot ? scamIndicators : [],
    },
    contractVulnerability: {
      isVerified: r.dataSources.etherscan,
      riskyFunctions: [],
      liquidityLocked: false,
    },
    sybilAttack: {
      score: r.ml.mlScore.communityRisk,
      level: riskLabel(r.ml.mlScore.communityRisk),
      suspiciousAddresses: 0,
      uniqueReceivers: 0,
      uniqueSenders: 0,
    },
    walletReputation: {
      score: r.ml.features.contractSecurity,
      level: riskLabel(100 - r.ml.features.contractSecurity),
      previousScams: 0,
    },
    scamPatternMatch: r.aiReasoning || buildPlainSummary(r),
    timestamp: r.timestamp,
  };

  return { mlAnalysis: r.ml, tokenData, analysisData, contractAnalysis, resolvedNetwork: r.network };
}

function riskLabel(risk: number): string {
  if (risk < 30) return 'Low Risk';
  if (risk < 50) return 'Moderate Risk';
  if (risk < 70) return 'High Risk';
  return 'Critical Risk';
}

function buildPlainSummary(r: AnalyzeResult): string {
  const name = r.token.name || 'This token';
  return `${name} scored ${r.trustScore}/100 (${r.verdict}) on the ${r.network} network with ${Math.round(
    r.confidence * 100,
  )}% data confidence. ${r.riskFactors.slice(0, 2).join(' ')}`;
}
