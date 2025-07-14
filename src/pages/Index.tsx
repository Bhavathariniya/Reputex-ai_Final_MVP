
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AddressInput from '@/components/AddressInput';
import LoadingAnimation from '@/components/LoadingAnimation';
import AnalysisReport from '@/components/AnalysisReport';
import TokenStats from '@/components/TokenStats';
import TutorialFAQ from '@/components/TutorialFAQ';
import { toast } from 'sonner';
import { Volume2, VolumeX, Shield } from 'lucide-react';
import {
  getWalletTransactions,
  getTokenData,
  getRepoActivity,
  getAIAnalysis,
  checkBlockchainForScore,
  storeScoreOnBlockchain,
  getSocialSentiment,
  detectScamIndicators,
  analyzeEthereumToken,
} from '@/lib/api-client';
import { isContract, detectBlockchain } from '@/lib/chain-detection';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [searchedNetwork, setSearchedNetwork] = useState<string>('ethereum');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [addressType, setAddressType] = useState<'wallet' | 'contract' | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for address in URL query params
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const addressParam = query.get('address');
    const networkParam = query.get('network') || 'ethereum';
    
    if (addressParam) {
      setSearchedAddress(addressParam);
      setSearchedNetwork(networkParam);
      handleAddressSearch(addressParam, networkParam);
    }
  }, [location]);

  const autoDetectNetwork = async (address: string): Promise<string> => {
    setIsAutoDetecting(true);
    try {
      toast.info("Detecting blockchain network...");
      const detectedNetwork = await detectBlockchain(address);
      if (detectedNetwork) {
        toast.success(`Detected network: ${detectedNetwork}`);
        return detectedNetwork;
      } else {
        toast.warning("Could not detect network. Defaulting to Ethereum.");
        return 'ethereum';
      }
    } catch (error) {
      console.error("Error detecting network:", error);
      toast.error("Network detection failed. Defaulting to Ethereum.");
      return 'ethereum';
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleAddressSearch = async (address: string, network: string) => {
    setIsLoading(true);
    setAnalysis(null);
    
    // Auto-detect network if set to 'auto'
    let resolvedNetwork = network;
    if (network === 'auto') {
      resolvedNetwork = await autoDetectNetwork(address);
    }
    
    try {
      // First check if we already have this score on the blockchain
      const existingScoreResponse = await checkBlockchainForScore(address, resolvedNetwork);
      
      if (existingScoreResponse.success && existingScoreResponse.data) {
        // Use existing score
        setAnalysis(existingScoreResponse.data);
        toast.success('Retrieved existing analysis from blockchain');
        setIsLoading(false);
        
        // Set the address type based on the stored data
        setAddressType(existingScoreResponse.data.address_type || null);
        return;
      }
      
      // If Ethereum network, try using our enhanced Etherscan analyzer for tokens
      if (resolvedNetwork === 'ethereum') {
        try {
          const ethAnalysisResponse = await analyzeEthereumToken(address);
          
          if (ethAnalysisResponse.success && ethAnalysisResponse.data) {
            // Extract token overview data
            const tokenOverview = ethAnalysisResponse.data.tokenOverview;
            const rugPullRisk = ethAnalysisResponse.data.rugPullRisk;
            const walletReputation = ethAnalysisResponse.data.walletReputation;
            const sybilRisk = ethAnalysisResponse.data.sybilAttack;
            
            // Convert to our expected format
            const enhancedData = {
              trust_score: Math.max(0, 100 - rugPullRisk.score),
              developer_score: walletReputation.score,
              liquidity_score: ethAnalysisResponse.data.contractVulnerability.liquidityLocked ? 85 : 45,
              community_score: Math.max(0, 100 - sybilRisk.score),
              holder_distribution: 70, // Simplified
              fraud_risk: rugPullRisk.score,
              social_sentiment: 70, // Simplified
              
              // Add analysis text
              analysis: `${tokenOverview.name} (${tokenOverview.symbol}) was analyzed with an overall risk assessment of ${rugPullRisk.level}. The contract was created on ${new Date(tokenOverview.creationTime).toLocaleDateString()} by address ${tokenOverview.deployer}. ${rugPullRisk.indicators.length > 0 ? `${rugPullRisk.indicators.length} risky functions were identified in the contract.` : 'No significant risk indicators were found in the contract code.'} ${ethAnalysisResponse.data.honeypotCheck.isHoneypot ? 'WARNING: This token shows characteristics of a potential honeypot.' : ''} ${ethAnalysisResponse.data.contractVulnerability.liquidityLocked ? 'The liquidity appears to be locked, which is positive for security.' : 'No evidence of locked liquidity was found, which could present a potential risk.'}`,
              
              // Add token type data
              address_type: 'contract',
              network: resolvedNetwork,
              timestamp: new Date().toISOString(),
              
              // Add sentiment and scam indicators
              scam_indicators: rugPullRisk.indicators.map((ind: any) => ({
                label: ind.term,
                description: ind.risk
              })),
              sentiment_data: {
                sentiment: rugPullRisk.score > 70 ? 'negative' : rugPullRisk.score > 30 ? 'mixed' : 'positive',
                keywords: ['token', 'contract', 'analysis'],
                phrases: [
                  rugPullRisk.score > 70 ? 'High risk contract with multiple concerns' : 
                  rugPullRisk.score > 30 ? 'Some risk factors present in this contract' : 
                  'Contract appears relatively safe based on analysis'
                ]
              }
            };
            
            // Store the analysis result
            setAnalysis(enhancedData);
            setAddressType('contract');
            
            // Store on blockchain
            await storeScoreOnBlockchain(address, enhancedData);
            
            toast.success(`Enhanced Ethereum contract analysis complete`);
            setIsLoading(false);
            return;
          }
        } catch (ethError) {
          console.error('Error in Ethereum analysis:', ethError);
          // Continue with fallback analysis
        }
      }
      
      // If no existing score or Ethereum analysis, perform traditional analysis
      // First determine if this is a contract or wallet
      const isContractAddress = await isContract(address, resolvedNetwork);
      setAddressType(isContractAddress ? 'contract' : 'wallet');
      
      // Fetch wallet transaction data
      const walletData = await getWalletTransactions(address);
      
      // Fetch token data (if it's a contract)
      const tokenData = await getTokenData(address);
      
      // Simulate GitHub repo activity (relevant mainly for contracts/tokens)
      const repoData = await getRepoActivity("example/repo");
      
      // Get social sentiment data
      const sentimentData = await getSocialSentiment(address, resolvedNetwork);
      
      // Detect scam indicators
      const scamData = await detectScamIndicators(address, tokenData.data, resolvedNetwork);
      
      // Aggregate the data
      const aggregatedData = {
        network: resolvedNetwork,
        address_type: isContractAddress ? 'contract' : 'wallet',
        community_size: "Medium", // Simulated community size
      };
      
      if (walletData.success && walletData.data) {
        Object.assign(aggregatedData, walletData.data);
      }
      
      if (tokenData.success && tokenData.data) {
        Object.assign(aggregatedData, tokenData.data);
      }
      
      if (repoData.success && repoData.data) {
        Object.assign(aggregatedData, repoData.data);
      }
      
      if (sentimentData.success && sentimentData.data) {
        Object.assign(aggregatedData, sentimentData.data);
      }
      
      if (scamData.success && scamData.data) {
        Object.assign(aggregatedData, scamData.data);
      }
      
      // Get enhanced AI analysis
      const aiAnalysisResponse = await getAIAnalysis(aggregatedData);
      
      if (aiAnalysisResponse.success && aiAnalysisResponse.data) {
        // Prepare the final analysis data with all scores and indicators
        const enhancedData = {
          ...aiAnalysisResponse.data,
          network: resolvedNetwork,
          address_type: isContractAddress ? 'contract' : 'wallet',
          sentimentData: aiAnalysisResponse.data.sentiment_data,
          scamIndicators: aiAnalysisResponse.data.scam_indicators,
        };
        
        // Store the analysis result
        setAnalysis(enhancedData);
        
        // Store on blockchain
        await storeScoreOnBlockchain(address, enhancedData);
        
        const addressTypeText = isContractAddress ? 'contract' : 'wallet';
        toast.success(`Enhanced analysis complete for ${resolvedNetwork} ${addressTypeText}`);
      } else {
        toast.error('Failed to analyze address');
      }
    } catch (error) {
      console.error('Error in analysis process:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (address: string, network: string) => {
    setSearchedAddress(address);
    setSearchedNetwork(network);
    // Update URL with the address and network parameters
    navigate(`/?address=${address}&network=${network}`);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      // Play ambient sound
      try {
        const audio = new Audio('/ambient.mp3'); // This file would need to be added
        audio.volume = 0.2;
        audio.loop = true;
        audio.play().catch(error => {
          console.log("Audio playback failed: ", error);
        });
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    } else {
      // Stop ambient sound - this is simplified; you'd need to keep a reference to the audio element
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <Navbar />
      
      <div className="audio-toggle" onClick={toggleAudio}>
        {audioEnabled ? (
          <Volume2 className="h-5 w-5 text-neon-cyan" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      <main className="flex-grow pt-32 pb-16 px-4 container mx-auto relative z-10">
        <section className="mb-12 text-center">
          <div className="shield-logo mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Shield className="w-16 h-16 text-neon-cyan" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-float">
            <span className="neon-text">ReputeX AI</span>
          </h1>
          
          <p className="tagline max-w-2xl mx-auto">
            Web3's Multi-Chain AI-Powered Reputation Shield – Detect Scams & Invest Fearlessly Across All Major Blockchains.
          </p>
          
          <AddressInput onSubmit={handleSubmit} isLoading={isLoading || isAutoDetecting} />
        </section>
        
        <section className="container mx-auto">
          {(isLoading || isAutoDetecting) && <LoadingAnimation />}
          
          {!isLoading && !isAutoDetecting && analysis && searchedAddress && (
            <AnalysisReport
              address={searchedAddress}
              network={searchedNetwork || 'ethereum'}
              scores={{
                trust_score: analysis.trust_score,
                developer_score: analysis.developer_score,
                liquidity_score: analysis.liquidity_score,
                community_score: analysis.community_score,
                holder_distribution: analysis.holder_distribution,
                fraud_risk: analysis.fraud_risk,
                social_sentiment: analysis.social_sentiment,
              }}
              analysis={analysis.analysis}
              timestamp={analysis.timestamp}
              scamIndicators={analysis.scamIndicators}
            />
          )}
          
          {!isLoading && !isAutoDetecting && !analysis && (
            <div className="space-y-8 mt-10">
              <div className="max-w-4xl mx-auto">
                <div className="glowing-card rounded-xl p-8 text-center">
                  <h3 className="text-2xl font-semibold mb-4">Enter an address to analyze</h3>
                  <p className="text-muted-foreground">
                    Get comprehensive reputation scores, security analysis, and AI fraud detection for any blockchain wallet or token address across 12 major blockchains.
                  </p>
                </div>
              </div>
              
              {/* Import TokenStats component for trending, trusted, and recent tokens */}
              <TokenStats 
                trendingTokens={[
                  {
                    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
                    name: "Dai Stablecoin",
                    symbol: "DAI",
                    network: "ethereum",
                    trustScore: 95,
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                    name: "Uniswap",
                    symbol: "UNI",
                    network: "ethereum",
                    trustScore: 92,
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
                    name: "ChainLink Token",
                    symbol: "LINK",
                    network: "ethereum",
                    trustScore: 90,
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
                    name: "Aave Token",
                    symbol: "AAVE",
                    network: "ethereum",
                    trustScore: 89,
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
                    name: "Basic Attention Token",
                    symbol: "BAT",
                    network: "ethereum",
                    trustScore: 85,
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  }
                ]}
                trustedTokens={[
                  {
                    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                    name: "Wrapped Ether",
                    symbol: "WETH",
                    network: "ethereum",
                    trustScore: 98,
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
                    name: "Wrapped BTC",
                    symbol: "WBTC",
                    network: "ethereum",
                    trustScore: 96,
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    name: "USD Coin",
                    symbol: "USDC",
                    network: "ethereum",
                    trustScore: 94,
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
                    name: "Tether USD",
                    symbol: "USDT",
                    network: "ethereum",
                    trustScore: 85,
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
                    name: "Dai Stablecoin",
                    symbol: "DAI",
                    network: "ethereum",
                    trustScore: 95,
                    timestamp: new Date().toISOString()
                  }
                ]}
                recentTokens={[
                  {
                    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                    name: "Uniswap",
                    symbol: "UNI",
                    network: "ethereum",
                    riskLevel: "Low Risk",
                    timestamp: new Date().toISOString()
                  },
                  {
                    address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
                    name: "Aave Token",
                    symbol: "AAVE",
                    network: "ethereum",
                    riskLevel: "Low Risk",
                    timestamp: new Date(Date.now() - 1000*60*5).toISOString()
                  },
                  {
                    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
                    name: "ChainLink Token",
                    symbol: "LINK",
                    network: "ethereum",
                    riskLevel: "Low Risk",
                    timestamp: new Date(Date.now() - 1000*60*15).toISOString()
                  },
                  {
                    address: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
                    name: "Basic Attention Token",
                    symbol: "BAT",
                    network: "ethereum",
                    riskLevel: "Low Risk",
                    timestamp: new Date(Date.now() - 1000*60*30).toISOString()
                  },
                  {
                    address: "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
                    name: "Enjin Coin",
                    symbol: "ENJ",
                    network: "ethereum",
                    riskLevel: "Low Risk",
                    timestamp: new Date(Date.now() - 1000*60*45).toISOString()
                  }
                ]}
              />
              
              {/* Import TutorialFAQ component */}
              <TutorialFAQ />
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
