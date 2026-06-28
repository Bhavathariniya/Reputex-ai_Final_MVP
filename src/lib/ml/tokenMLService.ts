/**
 * Type definitions for the ML/risk analysis result shape.
 *
 * The actual analysis now runs server-side (see backend/ + `reputexApi.ts`).
 * This file is intentionally types-only — the old browser-side ML pipeline and
 * its direct provider calls were removed.
 */

export interface TokenRiskScore {
  overallRisk: number;
  rugPullRisk: number;
  liquidityRisk: number;
  contractRisk: number;
  communityRisk: number;
  confidence: number;
}

export interface MLAnalysisResult {
  mlScore: TokenRiskScore;
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
    aiRecommendations?: string[];
    aiRiskFactors?: string[];
    rugPullRiskLabel?: string;
    liquidityRiskLabel?: string;
    contractRiskLabel?: string;
    communityRiskLabel?: string;
    contractSecurityLabel?: string;
    liquiditySafetyLabel?: string;
    communityHealthLabel?: string;
    marketStabilityLabel?: string;
  };
  dexscreenerData?: any;
}
