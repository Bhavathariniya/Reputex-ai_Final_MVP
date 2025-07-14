
import { TokenData } from '../../api-client';

export class FeatureScorer {
  calculateEnhancedFeatureScores(
    tokenData: any,
    contractData: any,
    honeypotData: any,
    socialData: any
  ) {
    return {
      contractSecurity: this.calculateContractSecurity(tokenData, contractData),
      liquiditySafety: this.calculateLiquiditySafety(tokenData, honeypotData),
      communityHealth: this.calculateCommunityHealth(tokenData, socialData),
      marketStability: this.calculateMarketStability(tokenData),
      ownershipRisk: this.calculateOwnershipRisk(tokenData, contractData),
      honeypotRisk: this.calculateHoneypotRisk(tokenData, honeypotData)
    };
  }

  private calculateContractSecurity(tokenData: any, contractData: any): number {
    let contractSecurity = 50;
    
    if (contractData?.isVerified) contractSecurity += 30;
    else contractSecurity -= 40; // Heavy penalty for unverified contracts
    
    if (contractData?.hasOwnershipRenounced) contractSecurity += 25;
    else contractSecurity -= 30; // Heavy penalty for retained ownership
    
    // Contract age factor
    if (tokenData.creationTime) {
      const daysSinceCreation = (Date.now() - new Date(tokenData.creationTime).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 365) contractSecurity += 15;
      else if (daysSinceCreation < 7) contractSecurity -= 25; // Very new = very risky
      else if (daysSinceCreation < 30) contractSecurity -= 10;
    }

    return Math.min(100, Math.max(0, contractSecurity));
  }

  private calculateLiquiditySafety(tokenData: any, honeypotData: any): number {
    let liquiditySafety = 30; // Lower baseline
    
    if (honeypotData?.honeypotResult?.isHoneypot) {
      liquiditySafety = 0; // Complete failure
    } else {
      liquiditySafety += 40; // Big bonus for passing honeypot check
      
      const sellTax = honeypotData?.honeypotResult?.sellTax || 0;
      const buyTax = honeypotData?.honeypotResult?.buyTax || 0;
      
      // Harsh penalties for high taxes
      if (sellTax > 30) liquiditySafety -= 40;
      else if (sellTax > 20) liquiditySafety -= 30;
      else if (sellTax > 15) liquiditySafety -= 20;
      else if (sellTax > 10) liquiditySafety -= 10;
      else if (sellTax > 5) liquiditySafety -= 5;
      
      if (buyTax > 20) liquiditySafety -= 20;
      else if (buyTax > 15) liquiditySafety -= 15;
      else if (buyTax > 10) liquiditySafety -= 10;
    }
    
    if (tokenData.isLiquidityLocked) liquiditySafety += 25;
    else liquiditySafety -= 20;

    return Math.min(100, Math.max(0, liquiditySafety));
  }

  private calculateCommunityHealth(tokenData: any, socialData: any): number {
    let communityHealth = 30; // Lower baseline
    
    if (socialData) {
      const twitterFollowers = socialData.twitter_followers || 0;
      const telegramUsers = socialData.telegram_channel_user_count || 0;
      
      // Strong social presence requirements
      if (twitterFollowers > 100000) communityHealth += 30;
      else if (twitterFollowers > 50000) communityHealth += 25;
      else if (twitterFollowers > 10000) communityHealth += 15;
      else if (twitterFollowers > 1000) communityHealth += 8;
      else if (twitterFollowers < 100) communityHealth -= 15;
      
      if (telegramUsers > 50000) communityHealth += 25;
      else if (telegramUsers > 10000) communityHealth += 15;
      else if (telegramUsers > 1000) communityHealth += 8;
      else if (telegramUsers < 100) communityHealth -= 10;
      
      // Sentiment analysis
      if (socialData.bullish_sentiment > 80) communityHealth += 20;
      else if (socialData.bullish_sentiment > 60) communityHealth += 10;
      else if (socialData.bullish_sentiment < 30) communityHealth -= 20;
    } else if (tokenData.communityData) {
      // Fallback to token data with stricter requirements
      const twitterFollowers = tokenData.communityData.twitterFollowers || 0;
      const telegramUsers = tokenData.communityData.telegramUsers || 0;
      
      if (twitterFollowers > 50000) communityHealth += 20;
      else if (twitterFollowers > 10000) communityHealth += 10;
      else if (twitterFollowers < 500) communityHealth -= 10;
      
      if (telegramUsers > 20000) communityHealth += 15;
      else if (telegramUsers > 5000) communityHealth += 8;
      else if (telegramUsers < 200) communityHealth -= 10;
    }

    return Math.min(100, Math.max(0, communityHealth));
  }

  private calculateMarketStability(tokenData: any): number {
    let marketStability = 45;
    
    if (tokenData.priceChange24h !== undefined) {
      const volatility = Math.abs(tokenData.priceChange24h);
      if (volatility < 2) marketStability += 20;
      else if (volatility < 5) marketStability += 15;
      else if (volatility < 10) marketStability += 10;
      else if (volatility > 100) marketStability -= 40; // Extreme volatility
      else if (volatility > 50) marketStability -= 25;
      else if (volatility > 30) marketStability -= 15;
    }

    // Enhanced volume analysis
    if (tokenData.tradingVolume && tokenData.marketCap && tokenData.marketCap > 0) {
      const volumeRatio = tokenData.tradingVolume / tokenData.marketCap;
      if (volumeRatio > 5) marketStability -= 30; // Suspicious high volume
      else if (volumeRatio > 2) marketStability -= 15;
      else if (volumeRatio > 0.5) marketStability += 15; // Healthy volume
      else if (volumeRatio > 0.1) marketStability += 10;
      else if (volumeRatio < 0.005) marketStability -= 20; // Too low volume
    }

    return Math.min(100, Math.max(0, marketStability));
  }

  private calculateOwnershipRisk(tokenData: any, contractData: any): number {
    let ownershipRisk = 40;
    
    // Estimate owner token percentage
    const ownerTokenPercentage = tokenData.ownerTokenPercentage || this.estimateOwnerTokenPercentage(tokenData, contractData);
    
    if (ownerTokenPercentage > 70) ownershipRisk += 50;
    else if (ownerTokenPercentage > 50) ownershipRisk += 35;
    else if (ownerTokenPercentage > 30) ownershipRisk += 20;
    else if (ownerTokenPercentage > 10) ownershipRisk += 10;
    else ownershipRisk -= 15; // Good distribution

    if (!contractData?.hasOwnershipRenounced) ownershipRisk += 25;

    return Math.min(100, Math.max(0, ownershipRisk));
  }

  private calculateHoneypotRisk(tokenData: any, honeypotData: any): number {
    let honeypotRisk = 10;
    
    if (honeypotData?.honeypotResult?.isHoneypot) {
      honeypotRisk = 100;
    } else {
      const honeypotProbability = tokenData.honeypotProbability || this.calculateHoneypotProbability(honeypotData);
      honeypotRisk += honeypotProbability * 0.8;
    }

    return Math.min(100, Math.max(0, honeypotRisk));
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
}

export const featureScorer = new FeatureScorer();
