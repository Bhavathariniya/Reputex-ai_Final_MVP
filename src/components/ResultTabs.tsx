import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Lock, Code, Users, BarChart2, CheckCircle, Brain, FileText } from 'lucide-react';
import TokenContractAnalysis from '@/components/TokenContractAnalysis';
import TokenAnalysis from '@/components/TokenAnalysis';
import MLAnalysisCard from '@/components/MLAnalysisCard';
import ContractCodeDisplay from '@/components/ContractCodeDisplay';
import DexscreenerDisplay from '@/components/DexscreenerDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tokenMLService } from '@/lib/ml/tokenMLService';
import { TokenData } from '@/lib/api-client';

interface ResultTabsProps {
  contractAnalysis: any;
  analysisData: any;
  tokenData: any;
  address: string;
  network: string;
}

const ResultTabs: React.FC<ResultTabsProps> = ({ 
  contractAnalysis, 
  analysisData, 
  tokenData,
  address,
  network 
}) => {
  const [mlAnalysis, setMlAnalysis] = useState<any>(null);
  const [isMLAnalysisLoading, setIsMLAnalysisLoading] = useState(false);

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

  useEffect(() => {
    // Fetch ML analysis with Dexscreener data
    if (address && tokenData) {
      fetchMLAnalysis();
    }
  }, [address, network, tokenData]);

  const fetchMLAnalysis = async () => {
    setIsMLAnalysisLoading(true);
    try {
      const tokenDataForML: TokenData = {
        tokenName: tokenData.tokenName || 'Unknown',
        tokenSymbol: tokenData.tokenSymbol || 'Unknown',
        totalSupply: tokenData.totalSupply || '0',
        decimals: tokenData.decimals || 18,
        currentPrice: tokenData.currentPrice || 0,
        marketCap: tokenData.marketCap || 0,
        tradingVolume: tokenData.tradingVolume || 0,
        priceChange24h: tokenData.priceChange24h || 0,
        holderCount: tokenData.holderCount || 0,
        creationTime: tokenData.creationTime || new Date().toISOString(),
        isLiquidityLocked: tokenData.isLiquidityLocked || false,
        contractCreator: tokenData.contractCreator || address,
        isVerified: tokenData.isVerified || false
      };
      
      const mlResult = await tokenMLService.analyzeTokenWithML(address, tokenDataForML, network);
      console.log("ML Analysis with Dexscreener completed:", mlResult);
      setMlAnalysis(mlResult);
    } catch (error) {
      console.error("ML Analysis failed:", error);
    } finally {
      setIsMLAnalysisLoading(false);
    }
  };

  if (!contractAnalysis && !analysisData) {
    return null;
  }

  const formatTokenAmount = (amount: string, decimals: number): string => {
    if (!amount || isNaN(Number(amount))) return '0';
    const amountNum = parseFloat(amount);
    const formattedAmount = amountNum / Math.pow(10, decimals);
    return formattedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <Tabs defaultValue="overview" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 md:gap-2">
        <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <Shield className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="ai-analysis" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <Brain className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">AI Analysis</span>
        </TabsTrigger>
        <TabsTrigger value="contract-code" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <FileText className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Source Code</span>
        </TabsTrigger>
        <TabsTrigger value="market-data" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Market Data</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Security</span>
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab - Clean token information only */}
      <TabsContent value="overview" className="space-y-4">
        {tokenData && (
          <Card className="glass-card border-neon-cyan">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-neon-cyan" />
                Token Overview
              </CardTitle>
              <CardDescription>
                Basic information about the token contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Token Name</h3>
                  <p className="font-semibold text-lg">{tokenData.tokenName || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Symbol</h3>
                  <p className="font-semibold text-lg">{tokenData.tokenSymbol || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Total Supply</h3>
                  <p className="font-semibold text-lg">
                    {tokenData.totalSupply ? formatTokenAmount(tokenData.totalSupply, tokenData.decimals) : '0'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Decimals</h3>
                  <p className="font-semibold text-lg">{tokenData.decimals}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm text-muted-foreground mb-1">Contract Address</h3>
                  <div className="font-mono text-sm bg-muted/30 p-2 rounded break-all">
                    {address}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Contract Verified</h3>
                  <div className="font-medium flex items-center">
                    {tokenData.isVerified ? (
                      <Badge className="bg-emerald-500/20 text-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </div>
                {tokenData.creationTime && (
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Creation Date</h3>
                    <p className="text-sm">{formatCreationDate(tokenData.creationTime)}</p>
                  </div>
                )}
                {tokenData.contractCreator && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm text-muted-foreground mb-1">Contract Creator</h3>
                    <div className="font-mono text-xs bg-muted/30 p-2 rounded break-all">
                      {tokenData.contractCreator}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Summary */}
        {(mlAnalysis?.geminiAnalysis || analysisData) && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mlAnalysis?.geminiAnalysis && <Brain className="h-5 w-5 text-purple-400" />}
                AI Analysis Summary
              </CardTitle>
              <CardDescription>
                {mlAnalysis?.geminiAnalysis ? 'Google Gemini AI-powered analysis with real-time market data' : 'Overview analysis of this token'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {mlAnalysis?.geminiAnalysis?.reasoning || analysisData?.analysis}
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* AI Analysis Tab - Keep only the MLAnalysisCard */}
      <TabsContent value="ai-analysis" className="space-y-4">
        {mlAnalysis && (
          <MLAnalysisCard mlAnalysis={mlAnalysis} isLoading={isMLAnalysisLoading} />
        )}
        
        {!mlAnalysis && (
          <div className="flex flex-col items-center justify-center py-8">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Analysis Loading</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Advanced AI analysis is being performed with real-time market data from Dexscreener API.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Contract Source Code Tab */}
      <TabsContent value="contract-code" className="space-y-4">
        <ContractCodeDisplay 
          contractAddress={address}
          tokenName={tokenData?.tokenName || 'Token'}
        />
      </TabsContent>

      {/* Real-Time Market Data Tab */}
      <TabsContent value="market-data" className="space-y-4">
        {mlAnalysis?.dexscreenerData && (
          <DexscreenerDisplay 
            dexscreenerData={mlAnalysis.dexscreenerData}
            tokenAddress={address}
          />
        )}
        
        {!mlAnalysis?.dexscreenerData && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>📊 Real-Time Market Data</CardTitle>
              <CardDescription>Loading market data from Dexscreener...</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fetching real-time trading data from decentralized exchanges...
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Security Analysis Tab - Clean security information only */}
      <TabsContent value="security" className="space-y-4">
        {/* Honeypot Check */}
        <Card className="glass-card border-neon-orange">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-neon-orange" />
                Honeypot & Tax Analysis
              </CardTitle>
              {contractAnalysis?.honeypotCheck?.isHoneypot ? (
                <Badge className="bg-red-500/20 text-red-500">
                  Potential Honeypot
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-500">
                  Not a Honeypot
                </Badge>
              )}
            </div>
            <CardDescription>
              Analysis of whether the token allows selling after purchase and tax rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contractAnalysis?.honeypotCheck?.indicators?.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Honeypot Indicators</h3>
                <div className="flex flex-wrap gap-2">
                  {contractAnalysis.honeypotCheck.indicators.map((indicator: any, i: number) => (
                    <Badge key={i} variant="outline" className="border-red-500 bg-red-500/10 text-red-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {indicator.term}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 border border-emerald-500/20 rounded-md bg-emerald-500/5">
                <p className="text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 inline-block mr-1 text-emerald-500" />
                  No honeypot indicators detected. Our analysis suggests that this token allows normal buying and selling operations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Contract Verification Status */}
        <Card className="glass-card border-neon-purple">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-neon-purple" />
                Contract Verification
              </CardTitle>
              {tokenData?.isVerified ? (
                <Badge className="bg-emerald-500/20 text-emerald-500">
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-500">
                  Unverified
                </Badge>
              )}
            </div>
            <CardDescription>
              Smart contract source code verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-sm font-medium mb-2">Verification Status</h3>
              <div className="flex flex-wrap gap-2">
                {tokenData?.isVerified ? (
                  <Badge className="bg-emerald-500/20 text-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Source Code Verified
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Source Code Not Verified
                  </Badge>
                )}
              </div>
              
              <div className="mt-4 p-3 border border-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  {tokenData?.isVerified 
                    ? "This contract's source code has been verified and is publicly auditable on the blockchain explorer."
                    : "This contract's source code has not been verified, which presents transparency risks. Unverified contracts cannot be fully audited by the community."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ResultTabs;
