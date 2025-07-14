import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnalysisReport from '@/components/AnalysisReport';
import LoadingAnimation from '@/components/LoadingAnimation';
import ResultTabs from '@/components/ResultTabs';
import { toast } from 'sonner';
import { analyzeEthereumToken, fetchTokenData, TokenData } from '@/lib/api-client';
import { detectBlockchain } from '@/lib/chain-detection';
import TokenSymbol from '@/components/TokenSymbol';
import { generateExplorerLink } from '@/lib/api/etherscan';
import { getTokenSocialStats, calculateCommunityScore } from '@/lib/api/lunarcrush';
import { checkHoneypot, calculateFraudRiskScore } from '@/lib/api/honeypot';
import { getContractSourceCode, getTokenHolders, calculateHolderDistributionScore } from '@/lib/api/etherscan';
import { getTokenDetailsFromGeckoTerminal } from '@/lib/api/geckoterminal';
import { tokenMLService, MLAnalysisResult } from '@/lib/ml/tokenMLService';
import MLAnalysisCard from '@/components/MLAnalysisCard';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressFromParams = searchParams.get('address');
  const networkFromParams = searchParams.get('network');
  
  // Get address and network from state or URL params
  const { address = addressFromParams, network = networkFromParams || 'ethereum' } = location.state || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [contractAnalysis, setContractAnalysis] = useState<any>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [mlAnalysis, setMLAnalysis] = useState<MLAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiResponses, setApiResponses] = useState<{
    tokenInfo?: any;
    sourceCode?: any;
    transactions?: any;
    honeypotCheck?: any;
    socialStats?: any;
    tokenHolders?: any;
    geckoData?: any;
  }>({});

  // Helper function to format creation date properly
  const formatCreationDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date Unavailable';
    
    try {
      // Handle dd-MM-yyyy format from Etherscan (e.g., "28-11-2017")
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          
          // Create date object from dd-MM-yyyy format
          const date = new Date(`${year}-${month}-${day}`);
          
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric"
            });
          }
        }
      }
      
      // Try parsing as ISO string or other formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long", 
          year: "numeric"
        });
      }
      
      return 'Date Unavailable';
    } catch (error) {
      console.error('Error formatting creation date:', error);
      return 'Date Unavailable';
    }
  };

  // Helper function to merge token data from multiple sources
  const mergeTokenDataSources = (tokenData: TokenData | undefined, geckoData: any, contractInfo: any): TokenData | null => {
    if (!tokenData && !geckoData) return null;
    
    return {
      ...tokenData,
      // Use GeckoTerminal data if available for more accuracy
      tokenName: tokenData?.tokenName || geckoData?.tokenData?.name || 'Unknown',
      tokenSymbol: tokenData?.tokenSymbol || geckoData?.tokenData?.symbol || 'Unknown',
      currentPrice: geckoData?.tokenData?.price_usd || tokenData?.currentPrice || 0,
      marketCap: geckoData?.tokenData?.market_cap_usd || tokenData?.marketCap || 0,
      tradingVolume: geckoData?.tokenData?.volume_usd?.h24 || tokenData?.tradingVolume || 0,
      priceChange24h: geckoData?.tokenData?.price_change_24h || tokenData?.priceChange24h || 0,
      totalSupply: geckoData?.tokenData?.total_supply || tokenData?.totalSupply || 'N/A',
      decimals: geckoData?.tokenData?.decimals || tokenData?.decimals || 18,
      // Enhanced verification status
      isVerified: contractInfo?.isVerified || tokenData?.isVerified || false,
      // Contract creator info - preserve the original creationDate format
      contractCreator: contractInfo?.contractCreator || tokenData?.contractCreator,
      creationTime: contractInfo?.creationDate || tokenData?.creationTime,
      // Social data from GeckoTerminal
      communityData: {
        ...tokenData?.communityData,
        website: geckoData?.tokenData?.socials?.website_url,
        twitter: geckoData?.tokenData?.socials?.twitter_username,
        telegram: geckoData?.tokenData?.socials?.telegram_handle,
        discord: geckoData?.tokenData?.socials?.discord_url,
      }
    } as TokenData;
  };

  const calculateEnhancedScores = ({
    tokenData,
    contractSourceInfo,
    honeypotCheckResult,
    tokenHolders,
    socialStats,
    geckoData,
    network
  }: {
    tokenData?: TokenData;
    contractSourceInfo?: any;
    honeypotCheckResult?: any;
    tokenHolders?: any[];
    socialStats?: any;
    geckoData?: any;
    network: string;
  }) => {
    // Enhanced fraud risk calculation
    const fraudRiskScore = calculateFraudRiskScore(honeypotCheckResult);
    
    // Enhanced developer score based on real verification data
    let developerScore = 50; // Lower baseline
    
    if (contractSourceInfo?.isVerified) developerScore += 25; // Verified contracts get big bonus
    else developerScore -= 20; // Unverified contracts are penalized
    
    if (contractSourceInfo?.hasOwnershipRenounced) developerScore += 20;
    else developerScore -= 15; // Not renouncing ownership is risky
    
    // Contract age factor
    if (contractSourceInfo?.creationTime || tokenData?.creationTime) {
      const creationDate = new Date(contractSourceInfo?.creationTime || tokenData?.creationTime);
      const daysSinceCreation = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > 365) developerScore += 15; // Older contracts are more trusted
      else if (daysSinceCreation < 7) developerScore -= 25; // Very new contracts are risky
      else if (daysSinceCreation < 30) developerScore -= 10;
    }
    
    // Enhanced liquidity score using real honeypot data
    let liquidityScore = 40; // Lower baseline
    
    if (honeypotCheckResult?.honeypotResult?.isHoneypot) {
      liquidityScore = 5; // Honeypots get almost zero score
    } else {
      liquidityScore += 30; // Passing honeypot test is important
      
      const sellTax = honeypotCheckResult?.honeypotResult?.sellTax || 0;
      const buyTax = honeypotCheckResult?.honeypotResult?.buyTax || 0;
      
      // Realistic tax penalties
      if (sellTax > 30) liquidityScore -= 35;
      else if (sellTax > 20) liquidityScore -= 25;
      else if (sellTax > 10) liquidityScore -= 15;
      else if (sellTax > 5) liquidityScore -= 8;
      
      if (buyTax > 15) liquidityScore -= 20;
      else if (buyTax > 10) liquidityScore -= 10;
      else if (buyTax > 5) liquidityScore -= 5;
      
      if (honeypotCheckResult?.honeypotResult?.simulationSuccess) liquidityScore += 10;
    }
    
    // Real liquidity data from GeckoTerminal
    if (geckoData?.tokenData?.volume_usd?.h24 && geckoData?.tokenData?.market_cap_usd) {
      const liquidityRatio = geckoData.tokenData.volume_usd.h24 / geckoData.tokenData.market_cap_usd;
      if (liquidityRatio > 0.5) liquidityScore += 15;
      else if (liquidityRatio > 0.1) liquidityScore += 10;
      else if (liquidityRatio < 0.001) liquidityScore -= 20;
    }
    
    // Enhanced community score using real social data
    let communityScore = socialStats ? 
      calculateCommunityScore(socialStats) : 45; // Lower baseline
    
    // Use GeckoTerminal social data if available
    if (geckoData?.tokenData?.socials) {
      const socials = geckoData.tokenData.socials;
      if (socials.twitter_username) communityScore += 10;
      if (socials.telegram_handle) communityScore += 10;
      if (socials.website_url) communityScore += 5;
      if (socials.discord_url) communityScore += 5;
    }
    
    // Enhanced holder distribution using real holder data
    const holderDistributionScore = tokenHolders && tokenHolders.length > 0 ? 
      calculateHolderDistributionScore(tokenHolders) : 40; // Lower baseline for unknown
    
    // Enhanced social sentiment with real data
    let socialSentimentScore = 50; // Lower baseline
    
    if (socialStats) {
      const bullishSentiment = socialStats.bullish_sentiment || 50;
      if (bullishSentiment > 80) socialSentimentScore = 85;
      else if (bullishSentiment > 70) socialSentimentScore = 75;
      else if (bullishSentiment > 60) socialSentimentScore = 65;
      else if (bullishSentiment > 40) socialSentimentScore = 55;
      else if (bullishSentiment < 30) socialSentimentScore = 30;
      
      if (socialStats.social_volume > 10000) socialSentimentScore += 10;
      else if (socialStats.social_volume > 1000) socialSentimentScore += 5;
      
      if (socialStats.social_contributors > 1000) socialSentimentScore += 10;
      else if (socialStats.social_contributors > 100) socialSentimentScore += 5;
    }
    
    // Enhanced trust score calculation with proper weighting
    const trustScore = Math.min(100, Math.max(0, Math.round(
      (liquidityScore * 0.35) +        // Liquidity is most important
      ((100 - fraudRiskScore) * 0.30) + // Fraud risk (inverted)
      (developerScore * 0.20) +        // Developer credibility
      (communityScore * 0.15)          // Community strength
    )));
    
    return {
      trust_score: trustScore,
      developer_score: Math.min(100, Math.max(0, developerScore)),
      liquidity_score: Math.min(100, Math.max(0, liquidityScore)),
      community_score: Math.min(100, Math.max(0, communityScore)),
      holder_distribution: Math.min(100, Math.max(0, holderDistributionScore)),
      fraud_risk: Math.min(100, Math.max(0, fraudRiskScore)),
      social_sentiment: Math.min(100, Math.max(0, socialSentimentScore))
    };
  };

  const generateEnhancedAnalysisText = (
    tokenData: TokenData | undefined, 
    network: string,
    contractSourceInfo?: any,
    honeypotCheckResult?: any,
    geckoData?: any
  ): string => {
    if (!tokenData && !geckoData) return 'Analysis data unavailable';
    
    const name = tokenData?.tokenName || geckoData?.tokenData?.name || 'Unknown Token';
    const symbol = tokenData?.tokenSymbol || geckoData?.tokenData?.symbol || 'UNKNOWN';
    
    let analysisText = `${name} (${symbol}) was comprehensively analyzed on the ${network} network. `;
    
    // Contract verification status
    if (contractSourceInfo) {
      analysisText += contractSourceInfo.isVerified 
        ? 'The contract source code is verified and publicly auditable. ' 
        : 'WARNING: The contract source code is NOT verified, which presents significant transparency risks. ';
        
      analysisText += contractSourceInfo.hasOwnershipRenounced
        ? 'Contract ownership has been renounced, preventing future malicious changes. '
        : 'CAUTION: Contract ownership has NOT been renounced, allowing the developer to modify the contract. ';
    }
    
    // Comprehensive honeypot analysis
    if (honeypotCheckResult) {
      if (honeypotCheckResult.honeypotResult?.isHoneypot) {
        analysisText += 'CRITICAL WARNING: This token has been confirmed as a HONEYPOT. Buyers cannot sell their tokens after purchase. ';
      } else {
        analysisText += 'Honeypot analysis passed - no obvious selling restrictions detected. ';
        
        const sellTax = honeypotCheckResult.honeypotResult?.sellTax || 0;
        const buyTax = honeypotCheckResult.honeypotResult?.buyTax || 0;
        
        if (sellTax > 20 || buyTax > 15) {
          analysisText += `However, this token has concerning tax rates: ${buyTax}% buy tax and ${sellTax}% sell tax. `;
        } else {
          analysisText += `Tax rates are reasonable: ${buyTax}% buy tax and ${sellTax}% sell tax. `;
        }
      }
    }
    
    return analysisText;
  };

  const extractEnhancedScamIndicators = (
    tokenData?: TokenData, 
    honeypotCheckResult?: any, 
    contractSourceInfo?: any,
    tokenHolders?: any[],
    geckoData?: any
  ): Array<{ label: string, description: string }> => {
    const indicators: Array<{ label: string, description: string }> = [];
    
    // Critical honeypot indicators
    if (honeypotCheckResult?.honeypotResult.isHoneypot) {
      indicators.push({
        label: "CRITICAL: Honeypot Detected",
        description: "This token prevents selling after purchase. DO NOT BUY."
      });
    }
    
    // High tax warnings
    const sellTax = honeypotCheckResult?.honeypotResult.sellTax || 0;
    const buyTax = honeypotCheckResult?.honeypotResult.buyTax || 0;
    
    if (sellTax > 30) {
      indicators.push({
        label: "EXTREME Sell Tax",
        description: `This token has a ${sellTax}% sell tax, making it nearly impossible to sell profitably.`
      });
    } else if (sellTax > 15) {
      indicators.push({
        label: "Very High Sell Tax",
        description: `This token has a ${sellTax}% sell tax.`
      });
    }
    
    return indicators;
  };

  const calculateSybilRisk = (tokenHolders: any[], tokenData: TokenData | null): number => {
    if (!tokenHolders || tokenHolders.length === 0) return 60; // Unknown = medium risk
    
    let sybilScore = 20; // Base score
    
    // Check for holder concentration
    if (tokenHolders.length < 10) sybilScore += 40; // Very few holders
    else if (tokenHolders.length < 50) sybilScore += 20;
    else if (tokenHolders.length < 100) sybilScore += 10;
    
    // Check for suspicious patterns in holder addresses
    const suspiciousCount = countSuspiciousAddresses(tokenHolders);
    sybilScore += suspiciousCount * 5;
    
    return Math.min(100, sybilScore);
  };

  const countSuspiciousAddresses = (tokenHolders: any[]): number => {
    if (!tokenHolders) return 0;
    
    let suspiciousCount = 0;
    const addressPatterns = new Set();
    
    tokenHolders.forEach(holder => {
      const address = holder.address || holder.holder_address;
      if (address) {
        // Check for similar address patterns (simplified)
        const pattern = address.substring(0, 10);
        if (addressPatterns.has(pattern)) {
          suspiciousCount++;
        }
        addressPatterns.add(pattern);
      }
    });
    
    return suspiciousCount;
  };

  const generateScamPatternAnalysis = (scamIndicators: any[], honeypotResult: any, contractInfo: any): string => {
    if (scamIndicators.length === 0) {
      return "This contract doesn't match any known scam patterns in our database.";
    }
    
    let analysis = `This contract shows ${scamIndicators.length} potential warning signs: `;
    
    if (honeypotResult?.honeypotResult?.isHoneypot) {
      analysis += "CRITICAL - Honeypot detected. ";
    }
    
    if (!contractInfo?.isVerified) {
      analysis += "Contract is not verified. ";
    }
    
    if (!contractInfo?.hasOwnershipRenounced) {
      analysis += "Ownership not renounced. ";
    }
    
    analysis += "Please exercise extreme caution before investing.";
    
    return analysis;
  };

  const renderCreatorAddress = (creatorAddress: string | undefined) => {
    if (!creatorAddress) return <span className="text-muted-foreground">Not available</span>;
    
    const shortAddress = `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;
    const explorerUrl = generateExplorerLink(creatorAddress, network);
    
    return (
      <a 
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center hover:underline text-blue-500"
      >
        {shortAddress}
        <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    );
  };

  useEffect(() => {
    if (!address) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Determine the blockchain network if not provided
        let resolvedNetwork = network;
        if (!resolvedNetwork || resolvedNetwork === 'auto') {
          const detectedNetwork = await detectBlockchain(address);
          resolvedNetwork = detectedNetwork || 'ethereum';
        }
        
        // Fetch token data from multiple sources for accuracy
        const tokenResponse = await fetchTokenData(address, resolvedNetwork);
        
        if (!tokenResponse.success) {
          throw new Error(tokenResponse.error || 'Failed to fetch token data');
        }
        
        let geckoData = null;
        let contractSourceInfo = null;
        let honeypotCheckResult = null;
        let tokenHolders = [];
        let socialStats = null;
        
        // Enhanced data fetching for EVM chains
        if (['ethereum', 'binance', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'base', 'zksync'].includes(resolvedNetwork)) {
          try {
            // Get enhanced token data from GeckoTerminal
            if (resolvedNetwork === 'ethereum') {
              geckoData = await getTokenDetailsFromGeckoTerminal(address);
              console.log("GeckoTerminal data:", geckoData);
            }
            
            // Get contract source code with verification status
            contractSourceInfo = await getContractSourceCode(address);
            console.log("Contract source info:", contractSourceInfo);
            
            // Check honeypot status for accurate fraud detection
            honeypotCheckResult = await checkHoneypot(address, resolvedNetwork);
            console.log("Honeypot check result:", honeypotCheckResult);
            
            // Get actual token holders for distribution analysis
            tokenHolders = await getTokenHolders(address, 1, 100);
            console.log("Token holders:", tokenHolders?.length || 0);
            
            // Get social stats if we have a token symbol
            if (tokenResponse.data?.tokenSymbol) {
              socialStats = await getTokenSocialStats(tokenResponse.data.tokenSymbol);
              console.log("Social stats:", socialStats);
            }
            
            // Store all API responses for debugging
            setApiResponses({
              sourceCode: contractSourceInfo,
              honeypotCheck: honeypotCheckResult,
              tokenHolders: tokenHolders,
              socialStats: socialStats,
              geckoData: geckoData
            });
          } catch (ethErr) {
            console.error('Error fetching additional data:', ethErr);
          }
        }
        
        // Merge token data with enhanced sources
        const enhancedTokenData = mergeTokenDataSources(tokenResponse.data, geckoData, contractSourceInfo);
        console.log("Enhanced token data with creation info:", enhancedTokenData);
        setTokenData(enhancedTokenData);
        
        // Run ML analysis with Gemini AI - this is the main source of truth
        if (enhancedTokenData) {
          try {
            console.log('Running Gemini AI analysis...');
            const mlResult = await tokenMLService.analyzeTokenWithML(
              address,
              enhancedTokenData,
              resolvedNetwork
            );
            console.log('Gemini AI analysis result:', mlResult);
            
            // Set ML analysis state immediately with the result
            setMLAnalysis(mlResult);
            
            // Only proceed if we have valid ML results
            if (mlResult && mlResult.mlScore) {
              // Use ONLY Gemini's analysis results - no fallback calculations
              const analysisText = mlResult.geminiAnalysis?.reasoning || 
                `${enhancedTokenData?.tokenName || 'Token'} analyzed using advanced AI risk assessment.`;
              
              // Use Gemini risk factors directly
              const scamIndicators = mlResult.riskFactors?.map(factor => ({
                label: "AI Risk Factor",
                description: factor
              })) || [];
              
              // Set analysis data using ONLY Gemini results
              const overallRisk = mlResult.mlScore.overallRisk;
              const contractSecurity = mlResult.features.contractSecurity;
              const liquiditySafety = mlResult.features.liquiditySafety;
              const communityHealth = mlResult.features.communityHealth;
              
              setAnalysisData({
                scores: {
                  trust_score: Math.max(0, 100 - overallRisk),
                  developer_score: contractSecurity,
                  liquidity_score: liquiditySafety,
                  community_score: communityHealth,
                  holder_distribution: communityHealth,
                  fraud_risk: overallRisk,
                  social_sentiment: communityHealth
                },
                analysis: analysisText,
                scamIndicators,
                timestamp: new Date().toISOString(),
                tokenData: enhancedTokenData
              });

              // Create contract analysis using ONLY Gemini data
              const rugPullRisk = mlResult.mlScore.rugPullRisk;
              const communityRisk = mlResult.mlScore.communityRisk;
              
              setContractAnalysis({
                tokenOverview: {
                  name: enhancedTokenData?.tokenName || 'Unknown',
                  symbol: enhancedTokenData?.tokenSymbol || 'Unknown',
                  address: address,
                  decimals: enhancedTokenData?.decimals || 18,
                  totalSupply: enhancedTokenData?.totalSupply || 'N/A',
                  deployer: enhancedTokenData?.contractCreator || "Unknown",
                  creationTime: enhancedTokenData?.creationTime || new Date().toISOString()
                },
                rugPullRisk: {
                  score: rugPullRisk,
                  level: mlResult.geminiAnalysis?.rugPullRiskLabel || 'Unknown',
                  indicators: scamIndicators,
                  ownershipRenounced: contractSourceInfo?.hasOwnershipRenounced || false
                },
                honeypotCheck: {
                  isHoneypot: honeypotCheckResult?.honeypotResult?.isHoneypot || false,
                  risk: mlResult.geminiAnalysis?.liquidityRiskLabel || 'Unknown',
                  indicators: honeypotCheckResult?.honeypotResult?.isHoneypot ? scamIndicators : []
                },
                contractVulnerability: {
                  isVerified: contractSourceInfo?.isVerified || false,
                  riskyFunctions: [],
                  liquidityLocked: enhancedTokenData?.isLiquidityLocked || false
                },
                sybilAttack: {
                  score: communityRisk,
                  level: mlResult.geminiAnalysis?.communityRiskLabel || 'Unknown',
                  suspiciousAddresses: 0,
                  uniqueReceivers: tokenHolders?.length || 0,
                  uniqueSenders: Math.floor((tokenHolders?.length || 0) * 0.8)
                },
                walletReputation: {
                  score: contractSecurity,
                  level: mlResult.geminiAnalysis?.contractSecurityLabel || 'Unknown',
                  previousScams: 0
                },
                scamPatternMatch: mlResult.geminiAnalysis?.reasoning || 'Analysis completed using AI risk assessment.',
                timestamp: new Date().toISOString()
              });
            } else {
              throw new Error('Invalid ML analysis results returned');
            }
          } catch (mlError) {
            console.error('Gemini AI analysis failed:', mlError);
            throw new Error('Failed to get AI analysis');
          }
        }

      } catch (error) {
        console.error("Error in analysis process:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        
        toast.error('Failed to analyze token', {
          description: error instanceof Error ? error.message : 'Please try again later'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, network, navigate]);

  if (!address) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">AI Risk Analysis Results</h1>
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-semibold capitalize">{network}</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs sm:text-sm font-mono bg-muted/30 p-2 rounded break-all">
                {address}
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/')}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* AI Risk Assessment - Show actual Gemini results */}
              {mlAnalysis && (
                <MLAnalysisCard 
                  mlAnalysis={mlAnalysis} 
                  isLoading={false}
                />
              )}
              
              {/* Enhanced Tabbed Interface - Remove all score displays except AI Risk Assessment */}
              {(contractAnalysis || analysisData) && (
                <ResultTabs
                  contractAnalysis={contractAnalysis}
                  analysisData={analysisData}
                  tokenData={tokenData}
                  address={address}
                  network={network || 'ethereum'}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
