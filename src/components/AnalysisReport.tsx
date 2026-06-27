
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Lock, 
  Code, 
  CheckCircle,
  XCircle,
  Flame,
  Brain
} from 'lucide-react';
import { TokenData } from '@/lib/api-client';

interface AnalysisReportProps {
  address: string;
  network: string;
  scores: {
    trust_score: number;
    developer_score: number;
    liquidity_score: number;
    community_score: number;
    holder_distribution: number;
    fraud_risk: number;
    social_sentiment: number;
  };
  analysis: string;
  timestamp: string;
  tokenData?: TokenData | null;
  scamIndicators?: Array<{ label: string; description: string }>;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({
  address,
  network,
  scores,
  analysis,
  timestamp,
  tokenData,
  scamIndicators = []
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500/20 text-green-400 border-green-500/20' };
    if (score >= 60) return { label: 'Good', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' };
    return { label: 'Poor', color: 'bg-red-500/20 text-red-400 border-red-500/20' };
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore <= 20) return { label: 'Very Low', color: 'bg-green-500/20 text-green-400 border-green-500/20' };
    if (riskScore <= 40) return { label: 'Low', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' };
    if (riskScore <= 60) return { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' };
    if (riskScore <= 80) return { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/20' };
    return { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/20' };
  };

  const trustBadge = getScoreBadge(scores.trust_score);
  const riskBadge = getRiskLevel(scores.fraud_risk);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-2 border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Brain className="h-6 w-6" />
              Security Analysis Report
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={trustBadge.color}>
                Trust: {trustBadge.label}
              </Badge>
              <Badge className={riskBadge.color}>
                Risk: {riskBadge.label}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-gray-400">
            Comprehensive security analysis for token contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(scores.trust_score)}`}>
                {scores.trust_score}%
              </div>
              <div className="text-sm text-gray-400">Trust Score</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(100 - scores.fraud_risk)}`}>
                {100 - scores.fraud_risk}%
              </div>
              <div className="text-sm text-gray-400">Safety Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">
                {network.charAt(0).toUpperCase() + network.slice(1)}
              </div>
              <div className="text-sm text-gray-400">Network</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-700/50 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Shield className="h-5 w-5" />
              Security Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Developer Reputation</span>
                <span className={`text-sm font-medium ${getScoreColor(scores.developer_score)}`}>
                  {scores.developer_score}%
                </span>
              </div>
              <Progress value={scores.developer_score} className="h-2 bg-gray-700/50" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Liquidity Security</span>
                <span className={`text-sm font-medium ${getScoreColor(scores.liquidity_score)}`}>
                  {scores.liquidity_score}%
                </span>
              </div>
              <Progress value={scores.liquidity_score} className="h-2 bg-gray-700/50" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Holder Distribution</span>
                <span className={`text-sm font-medium ${getScoreColor(scores.holder_distribution)}`}>
                  {scores.holder_distribution}%
                </span>
              </div>
              <Progress value={scores.holder_distribution} className="h-2 bg-gray-700/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-700/50 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Users className="h-5 w-5" />
              Community Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Community Health</span>
                <span className={`text-sm font-medium ${getScoreColor(scores.community_score)}`}>
                  {scores.community_score}%
                </span>
              </div>
              <Progress value={scores.community_score} className="h-2 bg-gray-700/50" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Social Sentiment</span>
                <span className={`text-sm font-medium ${getScoreColor(scores.social_sentiment)}`}>
                  {scores.social_sentiment}%
                </span>
              </div>
              <Progress value={scores.social_sentiment} className="h-2 bg-gray-700/50" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Fraud Risk</span>
                <span className={`text-sm font-medium ${scores.fraud_risk <= 30 ? 'text-green-400' : scores.fraud_risk <= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {scores.fraud_risk}%
                </span>
              </div>
              <Progress value={scores.fraud_risk} className="h-2 bg-gray-700/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Summary */}
      <Card className="border border-gray-700/50 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Code className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {analysis}
          </p>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      {scamIndicators.length > 0 && (
        <Card className="border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Risk Indicators Detected
            </CardTitle>
            <CardDescription className="text-orange-300/70">
              The following potential risk factors were identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scamIndicators.map((indicator, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <XCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-orange-300 mb-1">
                      {indicator.label}
                    </div>
                    <div className="text-sm text-gray-300">
                      {indicator.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Information */}
      {tokenData && (
        <Card className="border border-gray-700/50 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
              Token Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Token Name</div>
                <div className="font-medium text-gray-200">{tokenData.tokenName}</div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Symbol</div>
                <div className="font-medium text-gray-200">{tokenData.tokenSymbol}</div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Total Supply</div>
                <div className="font-medium text-gray-200">
                  {parseInt(tokenData.totalSupply).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Holders</div>
                <div className="font-medium text-gray-200">{tokenData.holderCount.toLocaleString()}</div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Liquidity Lock</div>
                <div className="flex items-center gap-2">
                  {tokenData.isLiquidityLocked ? (
                    <>
                      <Lock className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Locked</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Contract Verified</div>
                <div className="flex items-center gap-2">
                  {tokenData.isVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card className="border border-gray-700/50 bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Analysis completed on {new Date(timestamp).toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-cyan-400" />
              Powered by AI Security Analysis
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisReport;
