import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDexscreenerData, calculateLiquidityRiskScore, calculateMarketStabilityScore } from '../api/dexscreener';

interface TokenAnalysisInput {
  tokenData: any;
  contractInfo: any;
  honeypotData: any;
  socialData: any;
  holderData: any[];
  network: string;
  geckoTerminalData: any;
  dexscreenerData?: any;
}

interface GeminiAnalysisResult {
  overallRisk: number;
  rugPullRisk: number;
  liquidityRisk: number;
  contractRisk: number;
  communityRisk: number;
  contractSecurity: number;
  liquiditySafety: number;
  communityHealth: number;
  marketStability: number;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  riskFactors: string[];
  // New qualitative descriptions
  rugPullRiskLabel: string;
  liquidityRiskLabel: string;
  contractRiskLabel: string;
  communityRiskLabel: string;
  contractSecurityLabel: string;
  liquiditySafetyLabel: string;
  communityHealthLabel: string;
  marketStabilityLabel: string;
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = 'AIzaSyALmQ4dZEj5kOubxOVF7OIaD5HfW5J9KeQ';
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    } else {
      console.warn('Gemini API key not found');
    }
  }

  /**
   * Check if a token is a stablecoin based on symbol and name
   */
  private isStablecoin(tokenSymbol: string, tokenName: string): boolean {
    const stablecoinSymbols = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'USDD', 'FRAX', 'LUSD', 'sUSD'];
    const stablecoinNames = ['tether', 'usd coin', 'dai', 'binance usd', 'trueusd', 'pax dollar', 'frax', 'liquity usd'];
    
    const symbol = tokenSymbol?.toUpperCase() || '';
    const name = tokenName?.toLowerCase() || '';
    
    return stablecoinSymbols.includes(symbol) || 
           stablecoinNames.some(stableName => name.includes(stableName)) ||
           symbol.includes('USD') || name.includes('usd');
  }

  /**
   * Calculate Market Stability score using real-time Dexscreener data
   */
  private calculateMarketStabilityScore(input: TokenAnalysisInput): number {
    const { dexscreenerData, tokenData } = input;
    
    // Use Dexscreener data if available
    if (dexscreenerData) {
      return calculateMarketStabilityScore(
        dexscreenerData,
        90, // Default high contract security for calculation
        90, // Default high liquidity safety for calculation  
        90  // Default high community health for calculation
      );
    }

    // Fallback to existing logic
    const currentPrice = parseFloat(String(tokenData?.currentPrice || '0'));
    const priceChange24h = tokenData?.priceChange24h || 0;
    const tokenSymbol = tokenData?.tokenSymbol || '';
    const tokenName = tokenData?.tokenName || '';
    
    console.log('Market Stability calculation input:', {
      currentPrice,
      priceChange24h,
      tokenSymbol,
      tokenName,
      isStablecoin: this.isStablecoin(tokenSymbol, tokenName)
    });

    let marketStabilityScore = 50; // Default score

    // Check if token is a stablecoin
    if (this.isStablecoin(tokenSymbol, tokenName)) {
      console.log('Token identified as stablecoin, calculating deviation from $1.00');
      
      if (currentPrice > 0) {
        const deviationFromOne = Math.abs(currentPrice - 1.0) / 1.0;
        const deviationPercent = deviationFromOne * 100;
        
        console.log('Stablecoin deviation from $1.00:', deviationPercent + '%');
        
        // Stablecoin scoring logic
        if (deviationPercent < 0.01) {
          marketStabilityScore = 100;
        } else if (deviationPercent < 0.05) {
          marketStabilityScore = 97;
        } else if (deviationPercent < 0.1) {
          marketStabilityScore = 94;
        } else if (deviationPercent < 0.2) {
          marketStabilityScore = 89;
        } else {
          marketStabilityScore = 80;
        }
      } else {
        marketStabilityScore = 70; // Unknown price for stablecoin is concerning
      }
    } else {
      console.log('Token is not a stablecoin, calculating volatility estimate');
      
      // For non-stablecoins, use price change as volatility estimate
      if (priceChange24h !== undefined) {
        const volatilityEstimate = Math.abs(priceChange24h);
        
        console.log('Estimated volatility from 24h change:', volatilityEstimate + '%');
        
        // Convert to stability scoring
        if (volatilityEstimate <= 2) {
          marketStabilityScore = 95;
        } else if (volatilityEstimate <= 5) {
          marketStabilityScore = 85;
        } else if (volatilityEstimate <= 10) {
          marketStabilityScore = 75;
        } else {
          marketStabilityScore = 50;
        }
      } else {
        marketStabilityScore = 60;
      }
    }

    console.log('Final Market Stability Score:', marketStabilityScore);
    
    return Math.round(marketStabilityScore);
  }

  /**
   * Cap scores between 1% and 98% to prevent false confidence or complete safety
   */
  private capScore(score: number): number {
    return Math.max(1, Math.min(98, Math.round(score)));
  }

  async analyzeTokenRisk(input: TokenAnalysisInput): Promise<GeminiAnalysisResult> {
    if (!this.model) {
      console.error('❌ GEMINI API: Model not initialized - API key missing');
      throw new Error('Gemini AI not initialized - API key missing');
    }

    try {
      console.log('🚀 GEMINI API: Starting real-time AI risk analysis...');
      console.log('📝 GEMINI API: Using API key:', 'AIzaSyALmQ4dZEj5kOubxOVF7OIaD5HfW5J9KeQ'.substring(0, 20) + '...');

      const prompt = this.createAnalysisPrompt(input);
      console.log('📤 GEMINI API: Sending prompt to Gemini 2.0 Flash...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ GEMINI API: Received real response from Gemini AI');
      console.log('📥 GEMINI API: Raw response length:', text.length, 'characters');
      console.log('🔍 GEMINI API: Raw response preview:', text.substring(0, 200) + '...');
      
      const analysis = this.parseGeminiResponse(text, input);
      
      console.log('✨ GEMINI API: Successfully processed Gemini analysis result');
      console.log('🎯 GEMINI API: Overall risk score from Gemini:', analysis.overallRisk);
      
      return analysis;
    } catch (error) {
      console.error('❌ GEMINI API: Analysis failed with error:', error);
      console.error('🔄 GEMINI API: Falling back to local analysis');
      return this.createFallbackAnalysis(input);
    }
  }

  private createAnalysisPrompt(input: TokenAnalysisInput): string {
    const { tokenData, contractInfo, honeypotData, dexscreenerData } = input;
    
    const contractAge = tokenData.creationTime 
      ? Math.floor((Date.now() - new Date(tokenData.creationTime).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const isHoneypot = honeypotData?.honeypotResult?.isHoneypot || false;
    const sellTax = honeypotData?.honeypotResult?.sellTax || 0;
    const buyTax = honeypotData?.honeypotResult?.buyTax || 0;
    const isVerified = contractInfo?.isVerified || false;
    const hasOwnershipRenounced = contractInfo?.hasOwnershipRenounced || false;
    
    // Use Dexscreener data if available
    let marketCap = 0;
    let volume24h = 0;
    let liquidity = 0;
    let priceChange24h = 0;
    
    if (dexscreenerData?.pairs?.[0]) {
      const mainPair = dexscreenerData.pairs[0];
      marketCap = mainPair.marketCap || mainPair.fdv || 0;
      volume24h = mainPair.volume?.h24 || 0;
      liquidity = mainPair.liquidity?.usd || 0;
      priceChange24h = mainPair.priceChange?.h24 || 0;
    } else {
      marketCap = tokenData?.marketCap || 0;
      volume24h = tokenData?.tradingVolume || 0;
    }
    
    const holderCount = tokenData.holderCount || 0;

    return `You are a professional cryptocurrency risk analyst. Analyze this token and provide EXACT numerical scores (0-100) and qualitative labels.

TOKEN INFORMATION:
- Name: ${tokenData.tokenName || 'Unknown'}
- Symbol: ${tokenData.tokenSymbol || 'Unknown'}
- Contract Age: ${contractAge} days
- Market Cap: $${marketCap.toLocaleString()}
- 24h Volume: $${volume24h.toLocaleString()}
- Liquidity: $${liquidity.toLocaleString()}
- Price Change 24h: ${priceChange24h}%
- Holder Count: ${holderCount}

SECURITY DATA:
- Contract Verified: ${isVerified ? 'YES' : 'NO'}
- Ownership Renounced: ${hasOwnershipRenounced ? 'YES' : 'NO'}
- Honeypot Detected: ${isHoneypot ? 'YES' : 'NO'}
- Buy Tax: ${buyTax}%
- Sell Tax: ${sellTax}%

SCORING METHODOLOGY:
1. Rug Pull Risk: Consider contract verification, ownership status, age, holder distribution
2. Liquidity Risk: Evaluate honeypot status, tax rates, trading volume
3. Contract Risk: Assess verification status, ownership, age, code quality
4. Community Risk: Analyze holder count, distribution, social presence
5. Security/Safety metrics: Inverse of risk scores
6. Market Stability: Based on market cap, volume, volatility

QUALITATIVE LABELS:
- Very Low (0-10%), Low (11-25%), Low-Moderate (26-40%), Moderate (41-60%), Moderate-High (61-75%), High (76-90%), Very High (91-100%)

Return ONLY this JSON format:
{
  "rugPullRisk": [0-100 number],
  "rugPullRiskLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "liquidityRisk": [0-100 number],
  "liquidityRiskLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "contractRisk": [0-100 number],
  "contractRiskLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "communityRisk": [0-100 number],
  "communityRiskLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "contractSecurity": [0-100 number],
  "contractSecurityLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "liquiditySafety": [0-100 number],
  "liquiditySafetyLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",  
  "communityHealth": [0-100 number],
  "communityHealthLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "marketStability": [0-100 number],
  "marketStabilityLabel": "[Very Low/Low/Low-Moderate/Moderate/Moderate-High/High/Very High]",
  "overallRisk": [0-100 number],
  "confidence": [70-95 number],
  "reasoning": "Brief analysis explanation",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "riskFactors": ["Risk factor 1", "Risk factor 2"]
}`;
  }

  private parseGeminiResponse(text: string, input: TokenAnalysisInput): GeminiAnalysisResult {
    try {
      let cleanText = text.trim();
      
      // Remove markdown formatting
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Extract JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        console.log('Parsed Gemini response (before transformations):', parsed);
        
        // Get original Gemini scores
        let rugPullRisk = parsed.rugPullRisk || 0;
        let liquidityRisk = parsed.liquidityRisk || 0;
        let contractRisk = parsed.contractRisk || 0;
        let communityRisk = parsed.communityRisk || 0;
        
        // HIGH-RISK TOKEN OVERRIDE RULE
        // If any risk score > 90%, use Gemini score directly without modification
        const isHighRiskToken = rugPullRisk > 90 || liquidityRisk > 90 || contractRisk > 90 || communityRisk > 90;
        
        if (!isHighRiskToken) {
          // Apply transformations only for non-high-risk tokens
          rugPullRisk = this.applyRugPullTransformation(rugPullRisk);
          communityRisk = this.applyCommunityRiskTransformation(communityRisk);
          contractRisk = this.applyContractRiskTransformation(contractRisk);
          
          // Use real Dexscreener data for liquidity risk if available
          if (input.dexscreenerData) {
            liquidityRisk = calculateLiquidityRiskScore(input.dexscreenerData);
            console.log('Using Dexscreener liquidity risk:', liquidityRisk);
          } else {
            liquidityRisk = this.applyLiquidityRiskTransformation(liquidityRisk);
          }
          
          liquidityRisk = this.applyLiquidityRiskFinalAdjustment(
            liquidityRisk,
            parsed.liquidityRisk
          );
        } else {
          console.log('High-risk token detected - using Gemini scores directly without modification');
        }
        
        // Calculate derived scores
        let contractSecurity = Math.max(0, Math.min(100, 100 - contractRisk));
        let liquiditySafety = Math.max(0, Math.min(100, 100 - liquidityRisk));
        let communityHealth = Math.max(0, Math.min(100, 100 - communityRisk));
        let marketStability;
        
        // ULTRA HIGH-RISK OVERRIDE RULE
        // If ALL four risk scores > 80%, force market stability to 5% or lower
        const isUltraHighRisk = rugPullRisk > 80 && liquidityRisk > 80 && contractRisk > 80 && communityRisk > 80;
        
        if (isUltraHighRisk) {
          console.log('Ultra high-risk token - forcing market stability to 5%');
          marketStability = 5;
          // Recalculate security scores for ultra high-risk tokens
          contractSecurity = 100 - contractRisk;
          liquiditySafety = 100 - liquidityRisk;
          communityHealth = 100 - communityRisk;
        } else {
          // Use real-time Market Stability calculation with Dexscreener data
          marketStability = input.dexscreenerData 
            ? calculateMarketStabilityScore(
                input.dexscreenerData,
                contractSecurity,
                liquiditySafety,
                communityHealth
              )
            : this.calculateMarketStabilityScore(input);
        }
        
        // Apply score capping (1% to 98%) to all final scores
        let finalScores = {
          rugPullRisk: this.capScore(rugPullRisk),
          liquidityRisk: this.capScore(liquidityRisk),
          contractRisk: this.capScore(contractRisk),
          communityRisk: this.capScore(communityRisk),
          contractSecurity: this.capScore(contractSecurity),
          liquiditySafety: this.capScore(liquiditySafety),
          communityHealth: this.capScore(communityHealth),
          marketStability: this.capScore(marketStability)
        };
        
        // Calculate overall risk with capped scores
        const overallRisk = this.capScore(
          (finalScores.rugPullRisk + finalScores.liquidityRisk + finalScores.contractRisk + finalScores.communityRisk) / 4
        );
        
        // NEW: Risk Label Consistency Logic
        // Apply risk label-based score adjustments after all calculations
        finalScores = this.applyRiskLabelConsistency(finalScores, overallRisk);
        
        console.log('Final capped scores after risk label consistency:', finalScores);
        console.log('Overall risk (final):', overallRisk);
        
        // Update reasoning for high-risk tokens
        let updatedReasoning = parsed.reasoning || 'Analysis completed using AI assessment with real-time market data.';
        if (isHighRiskToken || isUltraHighRisk) {
          updatedReasoning = `HIGH RISK TOKEN DETECTED: ${updatedReasoning} Multiple risk factors exceed critical thresholds.`;
        }
        
        return {
          overallRisk,
          rugPullRisk: finalScores.rugPullRisk,
          liquidityRisk: finalScores.liquidityRisk,
          contractRisk: finalScores.contractRisk,
          communityRisk: finalScores.communityRisk,
          contractSecurity: finalScores.contractSecurity,
          liquiditySafety: finalScores.liquiditySafety,
          communityHealth: finalScores.communityHealth,
          marketStability: finalScores.marketStability,
          confidence: this.clampValue(parsed.confidence, 70, 95),
          reasoning: updatedReasoning,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Conduct thorough research before investing'],
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : ['Standard investment risks apply'],
          // Qualitative labels - update for transformed scores
          rugPullRiskLabel: parsed.rugPullRiskLabel || this.getQualitativeLabel(finalScores.rugPullRisk),
          liquidityRiskLabel: parsed.liquidityRiskLabel || this.getQualitativeLabel(finalScores.liquidityRisk),
          contractRiskLabel: parsed.contractRiskLabel || this.getQualitativeLabel(finalScores.contractRisk),
          communityRiskLabel: parsed.communityRiskLabel || this.getQualitativeLabel(finalScores.communityRisk),
          contractSecurityLabel: parsed.contractSecurityLabel || this.getQualitativeLabel(finalScores.contractSecurity),
          liquiditySafetyLabel: parsed.liquiditySafetyLabel || this.getQualitativeLabel(finalScores.liquiditySafety),
          communityHealthLabel: parsed.communityHealthLabel || this.getQualitativeLabel(finalScores.communityHealth),
          marketStabilityLabel: parsed.marketStabilityLabel || this.getQualitativeLabel(finalScores.marketStability)
        };
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response text:', text);
    }

    return this.createFallbackAnalysis(input);
  }

  /**
   * Apply risk label consistency logic to ensure scores align with risk classifications
   */
  private applyRiskLabelConsistency(
    scores: {
      rugPullRisk: number;
      liquidityRisk: number;
      contractRisk: number;
      communityRisk: number;
      contractSecurity: number;
      liquiditySafety: number;
      communityHealth: number;
      marketStability: number;
    },
    overallRisk: number
  ) {
    console.log('Applying risk label consistency logic for overall risk:', overallRisk);
    
    // Determine risk level based on overall risk score
    let riskLevel = 'Low Risk';
    if (overallRisk >= 70) riskLevel = 'Critical Risk';
    else if (overallRisk >= 50) riskLevel = 'High Risk';
    else if (overallRisk >= 30) riskLevel = 'Moderate Risk';
    
    console.log('Determined risk level:', riskLevel);
    
    // Apply adjustments based on risk level
    if (riskLevel === 'Critical Risk') {
      console.log('Applying Critical Risk adjustments');
      // Ensure all risk scores are ≥ 90%
      scores.rugPullRisk = Math.max(scores.rugPullRisk, 90);
      scores.liquidityRisk = Math.max(scores.liquidityRisk, 90);
      scores.contractRisk = Math.max(scores.contractRisk, 90);
      scores.communityRisk = Math.max(scores.communityRisk, 90);
      
      // Set safety scores accordingly lower
      scores.contractSecurity = Math.min(scores.contractSecurity, 10);
      scores.liquiditySafety = Math.min(scores.liquiditySafety, 5);
      scores.communityHealth = Math.min(scores.communityHealth, 10);
      scores.marketStability = Math.min(scores.marketStability, 10);
      
    } else if (riskLevel === 'High Risk') {
      console.log('Applying High Risk adjustments');
      // Ensure all risk scores are ≥ 80%
      scores.rugPullRisk = Math.max(scores.rugPullRisk, 80);
      scores.liquidityRisk = Math.max(scores.liquidityRisk, 80);
      scores.contractRisk = Math.max(scores.contractRisk, 80);
      scores.communityRisk = Math.max(scores.communityRisk, 80);
      
      // Set safety scores accordingly
      scores.contractSecurity = Math.min(scores.contractSecurity, 20);
      scores.liquiditySafety = Math.min(scores.liquiditySafety, 15);
      scores.communityHealth = Math.min(scores.communityHealth, 20);
      scores.marketStability = Math.min(scores.marketStability, 20);
    }
    
    // Apply final capping to ensure all scores remain within 1-98% bounds
    const cappedScores = {
      rugPullRisk: this.capScore(scores.rugPullRisk),
      liquidityRisk: this.capScore(scores.liquidityRisk),
      contractRisk: this.capScore(scores.contractRisk),
      communityRisk: this.capScore(scores.communityRisk),
      contractSecurity: this.capScore(scores.contractSecurity),
      liquiditySafety: this.capScore(scores.liquiditySafety),
      communityHealth: this.capScore(scores.communityHealth),
      marketStability: this.capScore(scores.marketStability)
    };
    
    console.log('Risk label consistency applied, final scores:', cappedScores);
    return cappedScores;
  }

  /**
   * Apply custom transformation to Rug Pull Risk
   * New Score = (10% of Gemini's rugPullRisk)
   */
  private applyRugPullTransformation(originalScore: number): number {
    if (typeof originalScore !== 'number' || isNaN(originalScore)) {
      return 0;
    }
    
    const transformedScore = originalScore * 0.1; // 10% of original score
    return Math.round(Math.max(0, Math.min(100, transformedScore))); // Clamp between 0-100 and round
  }

  /**
   * Apply custom transformation to Community Risk
   * New Score = 0.4 * communityRisk = (communityRisk / 2) - (10% of communityRisk)
   */
  private applyCommunityRiskTransformation(originalScore: number): number {
    if (typeof originalScore !== 'number' || isNaN(originalScore)) {
      return 0;
    }
    
    const transformedScore = originalScore * 0.4; // 40% of original score
    return Math.round(Math.max(0, Math.min(100, transformedScore))); // Clamp between 0-100 and round
  }

  /**
   * Apply custom transformation to Contract Risk
   * If contractRisk > 30: New Score = (contractRisk / 2) - (10% of contractRisk)
   * Else: New Score = contractRisk - 10
   */
  private applyContractRiskTransformation(originalScore: number): number {
    if (typeof originalScore !== 'number' || isNaN(originalScore)) {
      return 0;
    }
    
    let transformedScore;
    if (originalScore > 30) {
      transformedScore = (originalScore / 2) - (0.1 * originalScore); // 40% of original
    } else {
      transformedScore = originalScore - 10;
    }
    
    return Math.round(Math.max(0, Math.min(100, transformedScore))); // Clamp between 0-100 and round
  }

  /**
   * Apply custom transformation to Liquidity Risk
   * If liquidityRisk > 20: New Score = (liquidityRisk / 2) - (10% of liquidityRisk)
   * Else: New Score = liquidityRisk (unchanged)
   */
  private applyLiquidityRiskTransformation(originalScore: number): number {
    if (typeof originalScore !== 'number' || isNaN(originalScore)) {
      return 0;
    }
    
    let transformedScore;
    if (originalScore > 20) {
      transformedScore = (originalScore / 2) - (0.1 * originalScore); // 40% of original
    } else {
      transformedScore = originalScore; // unchanged
    }
    
    return Math.round(Math.max(0, Math.min(100, transformedScore))); // Clamp between 0-100 and round
  }

  /**
   * Apply final display adjustment to Liquidity Risk
   * If original Gemini liquidityRisk ≤ 20: subtract 5 from transformed value
   */
  private applyLiquidityRiskFinalAdjustment(
    transformedLiquidityRisk: number,
    originalLiquidityRisk: number
  ): number {
    if (typeof transformedLiquidityRisk !== 'number' || isNaN(transformedLiquidityRisk)) {
      return 0;
    }
    
    let finalScore = transformedLiquidityRisk;
    
    // Check if original Gemini score was ≤ 20
    if (originalLiquidityRisk <= 20) {
      finalScore -= 5; // Subtract 5 for low liquidity case
      console.log('Liquidity risk adjustment applied: -5 points for low risk case');
    }
    
    return Math.round(Math.max(0, Math.min(100, finalScore))); // Clamp between 0-100 and round
  }

  private getQualitativeLabel(score: number): string {
    if (score <= 10) return 'Very Low';
    if (score <= 25) return 'Low';  
    if (score <= 40) return 'Low-Moderate';
    if (score <= 60) return 'Moderate';
    if (score <= 75) return 'Moderate-High';
    if (score <= 90) return 'High';
    return 'Very High';
  }

  private clampValue(value: any, min: number, max: number): number {
    const num = typeof value === 'number' ? value : parseInt(value) || min;
    return Math.min(max, Math.max(min, num));
  }

  private createFallbackAnalysis(input: TokenAnalysisInput): GeminiAnalysisResult {
    const { contractInfo, honeypotData, tokenData, dexscreenerData } = input;
    
    const isHoneypot = honeypotData?.honeypotResult?.isHoneypot || false;
    const sellTax = honeypotData?.honeypotResult?.sellTax || 0;
    const isVerified = contractInfo?.isVerified || false;
    const hasOwnershipRenounced = contractInfo?.hasOwnershipRenounced || false;
    const holderCount = tokenData.holderCount || 0;
    
    // Calculate realistic fallback scores
    let rugPullRisk = 5;
    if (isHoneypot) rugPullRisk = 95;
    else if (!hasOwnershipRenounced && !isVerified) rugPullRisk = 70;
    else if (!hasOwnershipRenounced) rugPullRisk = 40;
    else if (!isVerified) rugPullRisk = 25;
    
    // Use real Dexscreener data for liquidity risk if available
    let liquidityRisk = dexscreenerData 
      ? calculateLiquidityRiskScore(dexscreenerData)
      : 10;
    
    if (isHoneypot) liquidityRisk = 95;
    else if (sellTax > 50) liquidityRisk = 90;
    else if (sellTax > 30) liquidityRisk = 75;
    else if (sellTax > 20) liquidityRisk = 60;
    else if (sellTax > 10) liquidityRisk = 35;
    
    let contractRisk = 15;
    if (!isVerified) contractRisk += 50;
    if (!hasOwnershipRenounced) contractRisk += 25;
    
    let communityRisk = 20;
    if (holderCount < 10) communityRisk = 90;
    else if (holderCount < 100) communityRisk = 60;
    else if (holderCount < 1000) communityRisk = 35;
    
    // Check for high-risk override conditions
    const isHighRiskToken = rugPullRisk > 90 || liquidityRisk > 90 || contractRisk > 90 || communityRisk > 90;
    
    if (!isHighRiskToken) {
      // Apply transformations to fallback scores for non-high-risk tokens
      rugPullRisk = this.applyRugPullTransformation(rugPullRisk);
      communityRisk = this.applyCommunityRiskTransformation(communityRisk);
      contractRisk = this.applyContractRiskTransformation(contractRisk);
      liquidityRisk = this.applyLiquidityRiskTransformation(liquidityRisk);
      liquidityRisk = this.applyLiquidityRiskFinalAdjustment(liquidityRisk, liquidityRisk);
    }
    
    const contractSecurity = Math.max(0, 100 - contractRisk);
    const liquiditySafety = Math.max(0, 100 - liquidityRisk);
    const communityHealth = Math.max(0, 100 - communityRisk);
    
    // Check for ultra high-risk conditions
    const isUltraHighRisk = rugPullRisk > 80 && liquidityRisk > 80 && contractRisk > 80 && communityRisk > 80;
    
    let marketStability;
    if (isUltraHighRisk) {
      marketStability = 5; // Force to 5% for ultra high-risk tokens
    } else {
      // Use real-time Market Stability calculation for fallback too
      marketStability = dexscreenerData 
        ? calculateMarketStabilityScore(
            dexscreenerData,
            contractSecurity,
            liquiditySafety,
            communityHealth
          )
        : this.calculateMarketStabilityScore(input);
    }
    
    // Apply score capping to all fallback scores
    const finalScores = {
      rugPullRisk: this.capScore(rugPullRisk),
      liquidityRisk: this.capScore(liquidityRisk),
      contractRisk: this.capScore(contractRisk),
      communityRisk: this.capScore(communityRisk),
      contractSecurity: this.capScore(contractSecurity),
      liquiditySafety: this.capScore(liquiditySafety),
      communityHealth: this.capScore(communityHealth),
      marketStability: this.capScore(marketStability)
    };
    
    const overallRisk = this.capScore(
      (finalScores.rugPullRisk + finalScores.liquidityRisk + finalScores.contractRisk + finalScores.communityRisk) / 4
    );
    
    return {
      overallRisk,
      rugPullRisk: finalScores.rugPullRisk,
      liquidityRisk: finalScores.liquidityRisk,
      contractRisk: finalScores.contractRisk,
      communityRisk: finalScores.communityRisk,
      contractSecurity: finalScores.contractSecurity,
      liquiditySafety: finalScores.liquiditySafety,
      communityHealth: finalScores.communityHealth,
      marketStability: finalScores.marketStability,
      confidence: 75,
      reasoning: `Fallback analysis for ${input.tokenData.tokenName || 'token'} based on security metrics and real-time market data.${isHighRiskToken || isUltraHighRisk ? ' HIGH RISK TOKEN DETECTED.' : ''}`,
      recommendations: [
        isHoneypot ? 'CRITICAL: Avoid this token - confirmed honeypot' : 'Conduct thorough research before investing'
      ],
      riskFactors: [
        ...(isHoneypot ? ['Confirmed honeypot mechanism'] : []),
        ...(!isVerified ? ['Contract not verified'] : []),
        ...(!hasOwnershipRenounced ? ['Ownership not renounced'] : []),
        ...(sellTax > 20 ? [`High sell tax: ${sellTax}%`] : [])
      ],
      rugPullRiskLabel: this.getQualitativeLabel(finalScores.rugPullRisk),
      liquidityRiskLabel: this.getQualitativeLabel(finalScores.liquidityRisk),
      contractRiskLabel: this.getQualitativeLabel(finalScores.contractRisk),
      communityRiskLabel: this.getQualitativeLabel(finalScores.communityRisk),
      contractSecurityLabel: this.getQualitativeLabel(finalScores.contractSecurity),
      liquiditySafetyLabel: this.getQualitativeLabel(finalScores.liquiditySafety),
      communityHealthLabel: this.getQualitativeLabel(finalScores.communityHealth),
      marketStabilityLabel: this.getQualitativeLabel(finalScores.marketStability)
    };
  }
}

export const geminiAIService = new GeminiAIService();
