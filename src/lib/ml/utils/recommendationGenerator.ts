
import { TokenRiskScore } from '../tokenAnalyzer';

export class RecommendationGenerator {
  generateEnhancedRecommendations(mlScore: TokenRiskScore, features: any, honeypotData: any): string[] {
    const recommendations = [];

    // Overall risk assessment with clear thresholds
    if (mlScore.overallRisk >= 85) {
      recommendations.push('🚨 EXTREME DANGER - DO NOT INVEST. This token shows multiple critical scam indicators.');
    } else if (mlScore.overallRisk >= 70) {
      recommendations.push('💀 VERY HIGH RISK - Strong recommendation to avoid. Multiple red flags detected.');
    } else if (mlScore.overallRisk >= 50) {
      recommendations.push('⚠️ HIGH RISK - Exercise extreme caution. Consider avoiding this investment.');
    } else if (mlScore.overallRisk >= 35) {
      recommendations.push('⚠️ Moderate risk detected - Conduct thorough research before investing.');
    } else if (mlScore.overallRisk < 25) {
      recommendations.push('✅ Low risk profile - This appears to be a relatively safe investment.');
    }

    // Specific risk-based recommendations
    if (features.honeypotRisk > 80 || honeypotData?.honeypotResult?.isHoneypot) {
      recommendations.push('💀 CRITICAL: HONEYPOT DETECTED - You will NOT be able to sell this token after purchase');
    } else if (features.honeypotRisk > 50) {
      recommendations.push('🔍 High honeypot risk - Verify selling capability before investing');
    }

    if (features.ownershipRisk > 70) {
      recommendations.push('🚨 CRITICAL: High owner token concentration - Extreme rug pull risk');
    } else if (features.ownershipRisk > 50) {
      recommendations.push('⚠️ Significant owner concentration - Monitor for potential rug pull');
    }

    if (features.contractSecurity < 30) {
      recommendations.push('⚠️ DANGER: Critical contract security issues - Unverified or risky contract detected');
    } else if (features.contractSecurity > 80) {
      recommendations.push('✅ Excellent contract security - Verified and well-structured');
    }

    if (features.liquiditySafety < 25) {
      recommendations.push('🚨 CRITICAL: Liquidity manipulation detected - Trading may be impossible');
    } else if (features.liquiditySafety > 75) {
      recommendations.push('💧 Good liquidity safety - Trading appears unrestricted');
    }

    // Confidence-based recommendations
    if (mlScore.confidence > 0.8) {
      recommendations.push('🎯 High confidence analysis - Sufficient data for reliable assessment');
    } else if (mlScore.confidence < 0.5) {
      recommendations.push('❓ Moderate confidence - Limited data available, exercise extra caution');
    }

    return recommendations.length > 0 ? recommendations : ['📊 Standard due diligence recommended'];
  }
}

export const recommendationGenerator = new RecommendationGenerator();
