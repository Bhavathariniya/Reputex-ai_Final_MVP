
import { tokenMLAnalyzer, TokenRiskScore } from './tokenAnalyzer';
import { TokenData } from '../api-client';
import { getContractSourceCode } from '../api/etherscan';
import { checkHoneypot } from '../api/honeypot';
import { getTokenSocialStats } from '../api/lunarcrush';
import { getDexscreenerData } from '../api/dexscreener';
import { geminiAIService } from '../ai/geminiService';
import { dataEnhancer } from './utils/dataEnhancer';
import { featureScorer } from './utils/featureScorer';
import { recommendationGenerator } from './utils/recommendationGenerator';
import { riskAssessor } from './utils/riskAssessor';

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
    aiRecommendations: string[];
    aiRiskFactors: string[];
    rugPullRiskLabel: string;
    liquidityRiskLabel: string;
    contractRiskLabel: string;
    communityRiskLabel: string;
    contractSecurityLabel: string;
    liquiditySafetyLabel: string;
    communityHealthLabel: string;
    marketStabilityLabel: string;
  };
  dexscreenerData?: any;
}

/**
 * Enhanced token analysis using Gemini AI and improved ML model with real-time data
 */
export class TokenMLService {
  /**
   * Perform comprehensive ML analysis with Gemini AI integration using real-time data
   */
  async analyzeTokenWithML(
    address: string,
    tokenData: TokenData,
    network: string = 'ethereum'
  ): Promise<MLAnalysisResult> {
    try {
      console.log('Starting enhanced ML analysis with Gemini AI and Dexscreener for token:', address);

      // Gather comprehensive real-time data for ML features
      const [contractInfo, honeypotInfo, socialInfo, dexscreenerInfo] = await Promise.allSettled([
        getContractSourceCode(address),
        checkHoneypot(address, network),
        tokenData.tokenSymbol ? getTokenSocialStats(tokenData.tokenSymbol) : null,
        getDexscreenerData(address)
      ]);

      // Extract successful results
      const contractData = contractInfo.status === 'fulfilled' ? contractInfo.value : null;
      const honeypotData = honeypotInfo.status === 'fulfilled' ? honeypotInfo.value : null;
      const socialData = socialInfo.status === 'fulfilled' ? socialInfo.value : null;
      const dexscreenerData = dexscreenerInfo.status === 'fulfilled' ? dexscreenerInfo.value : null;

      console.log('Real-time data gathered:', {
        contract: !!contractData,
        honeypot: !!honeypotData,
        social: !!socialData,
        dexscreener: !!dexscreenerData
      });

      // Enhanced token data with real-time information from Dexscreener
      let enhancedTokenData = { ...tokenData, contractAddress: address };
      
      if (dexscreenerData?.pairs?.[0]) {
        const mainPair = dexscreenerData.pairs[0];
        enhancedTokenData = {
          ...enhancedTokenData,
          tokenName: mainPair.baseToken?.name || tokenData.tokenName,
          tokenSymbol: mainPair.baseToken?.symbol || tokenData.tokenSymbol,
          currentPrice: parseFloat(mainPair.priceUsd || '0'),
          marketCap: mainPair.marketCap || mainPair.fdv || tokenData.marketCap || 0,
          tradingVolume: mainPair.volume?.h24 || tokenData.tradingVolume || 0,
          priceChange24h: mainPair.priceChange?.h24 || 0
        };
      }

      // Get AI-powered analysis from Gemini with real-time data
      let geminiResult = null;
      try {
        console.log('Requesting Gemini AI analysis with real-time Dexscreener data...');
        geminiResult = await geminiAIService.analyzeTokenRisk({
          tokenData: enhancedTokenData,
          contractInfo: contractData,
          honeypotData: honeypotData,
          socialData: socialData,
          holderData: [], // Could be enhanced with actual holder data
          network,
          geckoTerminalData: null,
          dexscreenerData: dexscreenerData
        });
        console.log('Gemini AI analysis completed with Dexscreener data:', geminiResult);
      } catch (geminiError) {
        console.error('Gemini AI analysis failed:', geminiError);
      }

      // Use Gemini results if available, otherwise fall back to original ML
      let mlScore: TokenRiskScore;
      let features: any;
      let recommendations: string[];
      let riskFactors: string[];

      if (geminiResult) {
        // Use Gemini AI results (now more accurate with real-time data)
        mlScore = {
          overallRisk: geminiResult.overallRisk,
          rugPullRisk: geminiResult.rugPullRisk,
          liquidityRisk: geminiResult.liquidityRisk,
          contractRisk: geminiResult.contractRisk,
          communityRisk: geminiResult.communityRisk,
          confidence: geminiResult.confidence / 100 // Convert to 0-1 scale
        };

        features = {
          contractSecurity: geminiResult.contractSecurity,
          liquiditySafety: geminiResult.liquiditySafety,
          communityHealth: geminiResult.communityHealth,
          marketStability: geminiResult.marketStability,
          ownershipRisk: geminiResult.rugPullRisk, // Rug pull risk as proxy for ownership risk
          honeypotRisk: geminiResult.liquidityRisk // Liquidity risk as proxy for honeypot risk
        };

        // Use Gemini's actual recommendations and risk factors
        recommendations = Array.isArray(geminiResult.recommendations) ? geminiResult.recommendations : ['Conduct thorough research before investing'];
        riskFactors = Array.isArray(geminiResult.riskFactors) ? geminiResult.riskFactors : ['Standard investment risks apply'];
      } else {
        // Fall back to original ML analysis
        const enhancedTokenDataForML = dataEnhancer.enhanceTokenData(enhancedTokenData, contractData, honeypotData);
        mlScore = tokenMLAnalyzer.analyzeToken(enhancedTokenDataForML, contractData, honeypotData, socialData);
        features = featureScorer.calculateEnhancedFeatureScores(enhancedTokenDataForML, contractData, honeypotData, socialData);
        recommendations = recommendationGenerator.generateEnhancedRecommendations(mlScore, features, honeypotData);
        riskFactors = riskAssessor.identifyEnhancedRiskFactors(mlScore, contractData, honeypotData, enhancedTokenData);
      }

      // Determine confidence level
      const confidenceLevel = riskAssessor.determineConfidenceLevel(mlScore.confidence, contractData, honeypotData);

      console.log('Enhanced ML Analysis with Gemini AI and Dexscreener completed:', { 
        overallRisk: mlScore.overallRisk,
        confidence: mlScore.confidence,
        features,
        geminiUsed: !!geminiResult,
        dexscreenerUsed: !!dexscreenerData,
        tokenName: enhancedTokenData.tokenName
      });

      return {
        mlScore,
        features,
        recommendations,
        riskFactors,
        confidenceLevel,
        dexscreenerData,
        geminiAnalysis: geminiResult ? {
          reasoning: geminiResult.reasoning,
          confidence: geminiResult.confidence,
          aiRecommendations: Array.isArray(geminiResult.recommendations) ? geminiResult.recommendations : [],
          aiRiskFactors: Array.isArray(geminiResult.riskFactors) ? geminiResult.riskFactors : [],
          rugPullRiskLabel: geminiResult.rugPullRiskLabel,
          liquidityRiskLabel: geminiResult.liquidityRiskLabel,
          contractRiskLabel: geminiResult.contractRiskLabel,
          communityRiskLabel: geminiResult.communityRiskLabel,
          contractSecurityLabel: geminiResult.contractSecurityLabel,
          liquiditySafetyLabel: geminiResult.liquiditySafetyLabel,
          communityHealthLabel: geminiResult.communityHealthLabel,
          marketStabilityLabel: geminiResult.marketStabilityLabel
        } : undefined
      };

    } catch (error) {
      console.error('Error in enhanced ML analysis:', error);
      
      // Return conservative high-risk assessment on error
      return {
        mlScore: {
          overallRisk: 75,
          rugPullRisk: 70,
          liquidityRisk: 65,
          contractRisk: 60,
          communityRisk: 80,
          confidence: 0.3
        },
        features: {
          contractSecurity: 30,
          liquiditySafety: 25,
          communityHealth: 20,
          marketStability: 35,
          ownershipRisk: 80,
          honeypotRisk: 75
        },
        recommendations: [
          '⚠️ ANALYSIS ERROR - Exercise extreme caution',
          '🚨 Unable to verify token safety - Recommend avoiding until more data available'
        ],
        riskFactors: [
          'Insufficient data for comprehensive analysis',
          'Unable to verify contract security',
          'Cannot confirm liquidity safety'
        ],
        confidenceLevel: 'Low'
      };
    }
  }
}

// Export singleton instance
export const tokenMLService = new TokenMLService();
