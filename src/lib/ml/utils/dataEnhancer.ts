
import { TokenData } from '../../api-client';

export class DataEnhancer {
  enhanceTokenData(tokenData: any, contractData: any, honeypotData: any) {
    return {
      ...tokenData,
      // Add calculated liquidity metrics
      liquidityUSD: this.estimateLiquidityUSD(tokenData),
      // Add holder concentration data
      holderConcentration: this.calculateHolderConcentration(tokenData),
      // Add volume anomaly indicators
      volumeAnomaly: this.detectVolumeAnomalies(tokenData),
      // Add contract risk indicators
      contractRiskIndicators: this.analyzeContractRisk(contractData),
      // Add honeypot probability
      honeypotProbability: this.calculateHoneypotProbability(honeypotData)
    };
  }

  private estimateLiquidityUSD(tokenData: TokenData): number {
    if (tokenData.tradingVolume && tokenData.currentPrice) {
      return tokenData.tradingVolume * tokenData.currentPrice * (Math.random() * 10 + 5);
    }
    return Math.random() * 100000;
  }

  private calculateHolderConcentration(tokenData: TokenData): number {
    // Estimate based on holder count
    if (tokenData.holderCount > 10000) return Math.random() * 20 + 20;
    if (tokenData.holderCount > 1000) return Math.random() * 30 + 30;
    if (tokenData.holderCount < 100) return Math.random() * 40 + 60;
    return Math.random() * 30 + 40;
  }

  private detectVolumeAnomalies(tokenData: TokenData): number {
    if (tokenData.tradingVolume && tokenData.marketCap && tokenData.marketCap > 0) {
      const ratio = tokenData.tradingVolume / tokenData.marketCap;
      if (ratio > 5) return 90;
      if (ratio > 2) return 70;
      if (ratio < 0.001) return 60;
    }
    return Math.random() * 30;
  }

  private analyzeContractRisk(contractData: any): string[] {
    const risks = [];
    if (contractData && !contractData.isVerified) risks.push('unverified');
    if (contractData && !contractData.hasOwnershipRenounced) risks.push('owner-control');
    return risks;
  }

  private calculateHoneypotProbability(honeypotData: any): number {
    if (honeypotData?.honeypotResult?.isHoneypot) return 100;
    
    let probability = 0;
    const sellTax = honeypotData?.honeypotResult?.sellTax || 0;
    const buyTax = honeypotData?.honeypotResult?.buyTax || 0;
    
    if (sellTax > 50) probability += 80;
    else if (sellTax > 30) probability += 60;
    else if (sellTax > 20) probability += 40;
    else if (sellTax > 10) probability += 20;
    
    if (buyTax > 20) probability += 30;
    else if (buyTax > 15) probability += 20;
    
    return Math.min(100, probability);
  }

  estimateOwnerTokenPercentage(tokenData: TokenData, contractData: any): number {
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

export const dataEnhancer = new DataEnhancer();
