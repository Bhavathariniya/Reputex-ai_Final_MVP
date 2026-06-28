
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
import { Volume2, VolumeX, Shield, Send } from 'lucide-react';
import { analyzeAddress } from '@/lib/reputexApi';
import { TELEGRAM_BOT_URL } from '@/config/links';

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

  const handleAddressSearch = async (address: string, network: string) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      // Single call to the ReputeX backend — genuine deterministic scoring.
      // The backend auto-detects the network and contract/wallet type.
      const result = await analyzeAddress(address, network || 'auto');

      setSearchedNetwork(result.network);
      setAddressType(result.addressType === 'unknown' ? null : result.addressType);

      setAnalysis({
        ...result.scores,
        analysis: result.aiReasoning ||
          `${result.token.name || 'This token'} scored ${result.trustScore}/100 (${result.verdict}) on ${result.network} ` +
          `with ${Math.round(result.confidence * 100)}% data confidence.`,
        network: result.network,
        address_type: result.addressType,
        timestamp: result.timestamp,
        scamIndicators: result.riskFactors.map((f) => ({ label: 'Risk Factor', description: f })),
      });

      toast.success(`Analysis complete — ${result.verdict} (${result.trustScore}/100)`);
    } catch (error) {
      console.error('Error in analysis process:', error);
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
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

          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/5 text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
          >
            <Send className="h-4 w-4" />
            Prefer chat? Scan any token right inside Telegram
            <span className="opacity-60 group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
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
