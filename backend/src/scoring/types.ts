/** Severity of an individual finding, worst-first ordering. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'positive' | 'info';

/** A single, evidence-backed reason that moved the score. This is what makes
 *  the score *genuine* — every point is traceable to a real data source. */
export interface Reason {
  severity: Severity;
  pillar: PillarKey;
  message: string;
  /** The concrete evidence (e.g. "sell tax = 38%", "owner = 0x0"). */
  evidence?: string;
  /** Which upstream provider produced the evidence. */
  source: string;
}

export type PillarKey =
  | 'tradability'
  | 'contractSecurity'
  | 'liquidity'
  | 'holderDistribution'
  | 'marketCommunity';

export interface Pillar {
  key: PillarKey;
  label: string;
  /** 0-100, higher = safer. */
  score: number;
  weight: number;
  /** False when we had no real data for this pillar (it then does not count). */
  available: boolean;
}

export type Verdict =
  | 'Likely Safe'
  | 'Probably OK'
  | 'High Caution'
  | 'High Risk'
  | 'Critical - Avoid';

export interface TokenSummary {
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
}

export interface AnalyzeResult {
  address: string;
  network: string;
  addressType: 'contract' | 'wallet' | 'unknown';
  /** 0-100, higher = safer. */
  trustScore: number;
  verdict: Verdict;
  /** 0-1: how much real data backed this score. */
  confidence: number;
  pillars: Pillar[];
  reasons: Reason[];
  riskFactors: string[];
  recommendations: string[];
  token: TokenSummary;
  honeypot: {
    checked: boolean;
    isHoneypot: boolean | null;
    buyTax: number | null;
    sellTax: number | null;
  };
  dataSources: Record<string, boolean>;
  aiReasoning?: string;
  /** Frontend-compatible projections (so existing UI components render unchanged). */
  scores: LegacyScores;
  ml: LegacyMl;
  timestamp: string;
}

export interface LegacyScores {
  trust_score: number;
  developer_score: number;
  liquidity_score: number;
  community_score: number;
  holder_distribution: number;
  fraud_risk: number;
  social_sentiment: number;
}

export interface LegacyMl {
  mlScore: {
    overallRisk: number;
    rugPullRisk: number;
    liquidityRisk: number;
    contractRisk: number;
    communityRisk: number;
    confidence: number;
  };
  features: {
    contractSecurity: number;
    liquiditySafety: number;
    communityHealth: number;
    marketStability: number;
    ownershipRisk: number;
    honeypotRisk: number;
  };
  recommendations: string[];
  riskFactors: string[];
  confidenceLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  geminiAnalysis?: {
    reasoning: string;
    confidence: number;
  };
}
