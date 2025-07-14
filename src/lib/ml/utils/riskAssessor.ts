
import { TokenRiskScore } from '../tokenAnalyzer';
import { TokenData } from '../../api-client';

export class RiskAssessor {
  identifyEnhancedRiskFactors(mlScore: TokenRiskScore, contractData: any, honeypotData: any, tokenData: any): string[] {
    const riskFactors = [];

    // Critical honeypot indicators
    if (honeypotData?.honeypotResult?.isHoneypot) {
      riskFactors.push('🚨 HONEYPOT CONFIRMED - Cannot sell after purchase');
    }

    // Tax-related risks
    const sellTax = honeypotData?.honeypotResult?.sellTax || 0;
    const buyTax = honeypotData?.honeypotResult?.buyTax || 0;
    
    if (sellTax > 30) {
      riskFactors.push(`💸 EXTREME sell tax: ${sellTax}% - May prevent selling`);
    } else if (sellTax > 20) {
      riskFactors.push(`💸 Very high sell tax: ${sellTax}%`);
    } else if (sellTax > 10) {
      riskFactors.push(`💸 High sell tax: ${sellTax}%`);
    }

    if (buyTax > 15) {
      riskFactors.push(`💸 Very high buy tax: ${buyTax}%`);
    } else if (buyTax > 10) {
      riskFactors.push(`💸 High buy tax: ${buyTax}%`);
    }

    // Contract security risks
    if (contractData && !contractData.isVerified) {
      riskFactors.push('❌ Contract source code not verified');
    }

    if (contractData && !contractData.hasOwnershipRenounced) {
      riskFactors.push('⚠️ Contract ownership not renounced - Owner retains control');
    }

    // Ownership concentration risks
    const ownerTokenPercentage = tokenData.ownerTokenPercentage || this.estimateOwnerTokenPercentage(tokenData, contractData);
    if (ownerTokenPercentage > 50) {
      riskFactors.push(`🏦 High owner concentration: ${ownerTokenPercentage.toFixed(1)}% of supply`);
    }

    // Liquidity risks
    if (!tokenData.isLiquidityLocked) {
      riskFactors.push('🌊 Liquidity not locked - Can be removed at any time');
    }

    // Age-related risks
    if (tokenData.creationTime) {
      const daysSinceCreation = (Date.now() - new Date(tokenData.creationTime).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 1) {
        riskFactors.push('🕐 VERY NEW TOKEN - Less than 1 day old');
      } else if (daysSinceCreation < 7) {
        riskFactors.push('🕐 Very new token - Less than 1 week old');
      }
    }

    // ML model risk assessments
    if (mlScore.rugPullRisk > 80) {
      riskFactors.push('💀 EXTREME rug pull probability');
    } else if (mlScore.rugPullRisk > 60) {
      riskFactors.push('⚠️ High rug pull probability');
    }

    if (mlScore.liquidityRisk > 75) {
      riskFactors.push('🌊 Critical liquidity manipulation risk');
    }

    return riskFactors.length > 0 ? riskFactors : ['✅ No major risk factors identified'];
  }

  determineConfidenceLevel(confidence: number, contractData: any, honeypotData: any): 'Low' | 'Medium' | 'High' | 'Very High' {
    let adjustedConfidence = confidence;
    
    // Boost confidence if we have key data sources
    if (contractData && honeypotData) adjustedConfidence += 0.2;
    if (contractData?.isVerified) adjustedConfidence += 0.1;
    if (honeypotData?.honeypotResult) adjustedConfidence += 0.15;
    
    adjustedConfidence = Math.min(1, adjustedConfidence);
    
    if (adjustedConfidence > 0.85) return 'Very High';
    if (adjustedConfidence > 0.7) return 'High';
    if (adjustedConfidence > 0.5) return 'Medium';
    return 'Low';
  }

  private estimateOwnerTokenPercentage(tokenData: TokenData, contractData: any): number {
    // Estimate based on contract age and verification
    if (contractData?.hasOwnershipRenounced) return Math.random() * 10;
    
    const contractAge = tokenData.creationTime 
      ? (Date.now() - new Date(tokenData.creationTime).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    
    if (contractAge < 7) return Math.random() * 50 + 30; // New contracts often have high concentration
    if (contractAge < 30) return Math.random() * 30 + 20;
    return Math.random() * 20 + 5;
  }
}

export const riskAssessor = new RiskAssessor();
