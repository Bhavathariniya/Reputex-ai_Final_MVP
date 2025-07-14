import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock, 
  Shield, 
  Code,
  Flame,
  Users,
  ExternalLink,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

interface TokenContractAnalysisProps {
  tokenData: {
    tokenOverview: {
      name: string;
      symbol: string;
      address: string;
      decimals: number;
      totalSupply: string;
      deployer: string;
      creationTime: string;
    };
    rugPullRisk: {
      score: number;
      level: string;
      indicators: Array<{term: string; found: boolean; risk: string}>;
      ownershipRenounced: boolean;
    };
    honeypotCheck: {
      isHoneypot: boolean;
      risk: string;
      indicators: Array<{term: string; found: boolean; risk: string}>;
    };
    contractVulnerability: {
      isVerified: boolean;
      riskyFunctions: Array<{term: string; found: boolean; risk: string}>;
      liquidityLocked: boolean;
    };
    sybilAttack: {
      score: number;
      level: string;
      suspiciousAddresses: number;
      uniqueReceivers: number;
      uniqueSenders: number;
    };
    walletReputation: {
      score: number;
      level: string;
      previousScams: number;
    };
    scamPatternMatch: string;
    timestamp: string;
  };
}

const TokenContractAnalysis: React.FC<TokenContractAnalysisProps> = ({ tokenData }) => {
  const {
    tokenOverview,
    rugPullRisk,
    honeypotCheck,
    contractVulnerability,
    sybilAttack,
    walletReputation,
    scamPatternMatch
  } = tokenData;

  // Format token amount exactly like the terminal script - matches getTokenStats.ts output
  const formatTokenAmount = (totalSupplyRaw: string, decimals: number): string => {
    if (totalSupplyRaw === 'N/A' || totalSupplyRaw === 'Loading...') {
      return totalSupplyRaw;
    }
    
    try {
      // Convert exactly like terminal: totalSupply / 10^decimals
      const supply = Number(totalSupplyRaw);
      const divisor = Math.pow(10, decimals);
      const formattedAmount = supply / divisor;
      
      // Use toLocaleString() for comma formatting exactly like terminal would show
      return formattedAmount.toLocaleString(undefined, { 
        maximumFractionDigits: 0  // No decimals for whole numbers
      });
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return totalSupplyRaw;
    }
  };

  // Helper function to render risk indicators
  const renderRiskIndicators = (indicators: Array<{term: string; found: boolean; risk: string}>) => {
    return indicators.map((indicator, index) => (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-500 cursor-help">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {indicator.term}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm max-w-xs">{indicator.risk}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ));
  };

  // Helper function to render risk level badge
  const renderRiskLevel = (level: string) => {
    switch (level) {
      case 'High Risk':
        return (
          <Badge className="bg-red-500/20 text-red-500">
            <Flame className="h-3 w-3 mr-1" />
            High Risk
          </Badge>
        );
      case 'Medium Risk':
        return (
          <Badge className="bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Medium Risk
          </Badge>
        );
      case 'Low Risk':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Low Risk
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {level}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Overview */}
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
              <p className="font-semibold text-lg">{tokenOverview.name}</p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Symbol</h3>
              <p className="font-semibold text-lg">{tokenOverview.symbol}</p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Total Supply</h3>
              <p className="font-semibold text-lg">{formatTokenAmount(tokenOverview.totalSupply, tokenOverview.decimals)}</p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Decimals</h3>
              <p className="font-semibold text-lg">{tokenOverview.decimals}</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm text-muted-foreground mb-1">Contract Address</h3>
              <div className="font-mono text-sm bg-muted/30 p-2 rounded break-all">
                {tokenOverview.address}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-auto p-1"
                  onClick={() => window.open(`https://etherscan.io/address/${tokenOverview.address}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="sr-only">View on Etherscan</span>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Deployer</h3>
              <div className="font-mono text-sm truncate" title={tokenOverview.deployer}>
                {tokenOverview.deployer.substring(0, 10)}...{tokenOverview.deployer.substring(tokenOverview.deployer.length - 8)}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Creation Time</h3>
              <p className="text-sm">{new Date(tokenOverview.creationTime).toLocaleDateString()} {new Date(tokenOverview.creationTime).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Rug Pull Risk with ML insights */}
      <Card className="glass-card border-neon-pink">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-neon-pink" />
              Rug Pull Risk Score
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                ML Enhanced
              </Badge>
            </CardTitle>
            {renderRiskLevel(rugPullRisk.level)}
          </div>
          <CardDescription>
            Analysis enhanced with machine learning risk prediction model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Risk Level</span>
              <span className="text-lg font-bold">{rugPullRisk.score}%</span>
            </div>
            <Progress 
              value={rugPullRisk.score} 
              className="h-2.5" 
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Risk Indicators</h3>
              <div className="flex flex-wrap gap-2">
                {rugPullRisk.indicators.length > 0 ? (
                  renderRiskIndicators(rugPullRisk.indicators)
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No risk indicators found
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Ownership Status</h3>
              {rugPullRisk.ownershipRenounced ? (
                <Badge className="bg-emerald-500/20 text-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ownership Renounced
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Owner Can Modify Contract
                </Badge>
              )}
            </div>

            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">ML Risk Assessment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {rugPullRisk.level === 'High Risk' 
                  ? "Our machine learning model has identified multiple high-risk patterns similar to known rug pull schemes. The combination of contract features, holder distribution, and trading patterns suggests elevated risk."
                  : rugPullRisk.level === 'Medium Risk'
                  ? "The ML model detects some concerning patterns that warrant caution. While not immediately dangerous, several risk indicators align with tokens that have experienced issues."
                  : "Machine learning analysis indicates this token follows patterns similar to legitimate projects with strong fundamentals and community backing."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Honeypot Check */}
      <Card className="glass-card border-neon-orange">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-neon-orange" />
              Honeypot Check
            </CardTitle>
            {honeypotCheck.isHoneypot ? (
              <Badge className="bg-red-500/20 text-red-500">
                <XCircle className="h-3 w-3 mr-1" />
                Potential Honeypot
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Not a Honeypot
              </Badge>
            )}
          </div>
          <CardDescription>
            Analysis of whether the token allows selling after purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {honeypotCheck.indicators.length > 0 ? (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-2">Honeypot Indicators</h3>
                  <div className="flex flex-wrap gap-2">
                    {renderRiskIndicators(honeypotCheck.indicators)}
                  </div>
                </div>
                
                <div className="p-3 border border-amber-500/20 rounded-md bg-amber-500/5">
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1 text-amber-500" />
                    This contract contains features that might restrict selling tokens after purchase. 
                    These restrictions could be temporary trading controls or potentially malicious.
                    Exercise caution when trading.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-3 border border-emerald-500/20 rounded-md bg-emerald-500/5">
                <p className="text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 inline-block mr-1 text-emerald-500" />
                  No honeypot indicators detected. Our analysis suggests that this token allows normal buying and selling operations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-neon-purple">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-neon-purple" />
              Contract Vulnerability Analysis
            </CardTitle>
            {contractVulnerability.isVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-500">
                <XCircle className="h-3 w-3 mr-1" />
                Unverified
              </Badge>
            )}
          </div>
          <CardDescription>
            Assessment of contract features that could pose risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Contract Status</h3>
              <div className="flex flex-wrap gap-2">
                {contractVulnerability.isVerified ? (
                  <Badge className="bg-emerald-500/20 text-emerald-500">
                    Source Code Verified
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-500">
                    Source Code Not Verified
                  </Badge>
                )}
                
                {contractVulnerability.liquidityLocked ? (
                  <Badge className="bg-emerald-500/20 text-emerald-500">
                    <Lock className="h-3 w-3 mr-1" />
                    Liquidity Locked
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-500">
                    <Unlock className="h-3 w-3 mr-1" />
                    Liquidity Not Locked
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Risky Functions</h3>
              <div className="flex flex-wrap gap-2">
                {contractVulnerability.riskyFunctions.length > 0 ? (
                  renderRiskIndicators(contractVulnerability.riskyFunctions)
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No risky functions detected
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {!contractVulnerability.isVerified 
                  ? "This contract's source code is not verified on Etherscan, which makes it impossible to fully analyze its functionality and risks."
                  : contractVulnerability.riskyFunctions.length > 0
                  ? "This contract contains functions that could potentially be used to manipulate the token or harm holders."
                  : "This contract appears to have minimal vulnerabilities based on our analysis."}
                {!contractVulnerability.liquidityLocked && " Additionally, the token's liquidity does not appear to be locked, which increases the risk of liquidity being removed."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-neon-blue">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-neon-blue" />
              Sybil Attack / Bot Activity Score
            </CardTitle>
            {renderRiskLevel(sybilAttack.level)}
          </div>
          <CardDescription>
            Analysis of token transfer patterns for manipulation detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Risk Level</span>
              <span className="text-lg font-bold">{sybilAttack.score}%</span>
            </div>
            <Progress 
              value={sybilAttack.score} 
              className="h-2.5" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 border border-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Suspicious Addresses</div>
              <div className="text-lg font-medium">{sybilAttack.suspiciousAddresses}</div>
            </div>
            
            <div className="p-3 border border-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Unique Receivers</div>
              <div className="text-lg font-medium">{sybilAttack.uniqueReceivers}</div>
            </div>
            
            <div className="p-3 border border-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Unique Senders</div>
              <div className="text-lg font-medium">{sybilAttack.uniqueSenders}</div>
            </div>
          </div>

          <div className="p-3 border border-muted rounded-md bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {sybilAttack.level === 'High Risk' 
                ? "Our analysis has detected patterns consistent with Sybil attacks or bot manipulation. Multiple addresses may be controlled by the same entity to create artificial activity."
                : sybilAttack.level === 'Medium Risk'
                ? "Some suspicious transfer patterns have been detected, which could indicate limited bot activity or early signs of manipulation."
                : "Transfer patterns appear normal with no significant indicators of Sybil attacks or bot manipulation."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-neon-cyan">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neon-cyan" />
              Deployer Wallet Reputation
            </CardTitle>
            <Badge className={walletReputation.level === 'Trustworthy' 
              ? "bg-emerald-500/20 text-emerald-500"
              : walletReputation.level === 'Neutral'
              ? "bg-amber-500/20 text-amber-500"
              : "bg-red-500/20 text-red-500"
            }>
              {walletReputation.level}
            </Badge>
          </div>
          <CardDescription>
            Analysis of the contract deployer's wallet history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Reputation Score</span>
              <span className="text-lg font-bold">{walletReputation.score}%</span>
            </div>
            <Progress 
              value={walletReputation.score} 
              className="h-2.5" 
            />
          </div>

          <div className="space-y-4">
            <div className="p-3 border border-muted rounded-md bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {walletReputation.level === 'Trustworthy' 
                  ? "The contract deployer has a positive track record with no detected scams or fraudulent activities in their history."
                  : walletReputation.level === 'Neutral'
                  ? "The contract deployer has a mixed history or insufficient data for a definitive reputation assessment."
                  : `The contract deployer has a concerning history with ${walletReputation.previousScams} previous contracts that were flagged as potentially fraudulent.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-neon-yellow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-neon-yellow" />
            Scam Pattern Similarity
          </CardTitle>
          <CardDescription>
            AI comparison with known scam contract patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-muted rounded-md bg-muted/30">
            <p className="text-lg font-medium mb-2">Analysis Result:</p>
            <p className="text-muted-foreground">
              {scamPatternMatch}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenContractAnalysis;
