
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Shield, TrendingUp, CheckCircle, XCircle, Info, ChevronDown } from 'lucide-react';
import { MLAnalysisResult } from '@/lib/ml/tokenMLService';

interface MLAnalysisCardProps {
  mlAnalysis: MLAnalysisResult;
  isLoading: boolean;
}

const MLAnalysisCard: React.FC<MLAnalysisCardProps> = ({ mlAnalysis, isLoading }) => {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const toggleDropdown = (scoreId: string) => {
    setExpandedDropdown(expandedDropdown === scoreId ? null : scoreId);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Brain className="h-5 w-5" />
            AI Risk Analysis
          </CardTitle>
          <CardDescription>Loading AI analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low Risk', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' };
    if (score < 50) return { level: 'Moderate Risk', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' };
    if (score < 70) return { level: 'High Risk', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' };
    return { level: 'Critical Risk', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const overallRisk = getRiskLevel(mlAnalysis.mlScore.overallRisk);

  // Score info data with emojis and descriptions
  const scoreInfoData = {
    'overall-risk': {
      emoji: '🎯',
      title: 'What is Overall Risk Score?',
      description: 'This score combines all risk factors to estimate the overall safety of the token. A lower score means the token is safer. Use this to quickly gauge risk.'
    },
    'rug-pull': {
      emoji: '🔐',
      title: 'What is Rug Pull Risk?',
      description: 'Measures how likely the token can be rug pulled based on contract settings, ownership, and liquidity controls. High scores mean higher risk of exit scams.'
    },
    'liquidity-risk': {
      emoji: '💧',
      title: 'What is Liquidity Risk?',
      description: 'Indicates how easily the token can be traded. High liquidity risk means low volume or pool liquidity — harder to buy/sell without price impact.'
    },
    'contract-risk': {
      emoji: '📋',
      title: 'What is Contract Risk?',
      description: 'Measures risks in the smart contract code like upgradeability, owner permissions, or hidden functions. High scores suggest a need for manual review.'
    },
    'community-risk': {
      emoji: '👥',
      title: 'What is Community Risk?',
      description: 'Evaluates the strength and size of the community behind the token. Smaller or inactive communities increase risk and reduce trust.'
    },
    'contract-security': {
      emoji: '🛡️',
      title: 'What is Contract Security?',
      description: 'Reflects how secure the contract appears to be based on verification, audit signals, and permission structures. Higher is better.'
    },
    'liquidity-safety': {
      emoji: '🔒',
      title: 'What is Liquidity Safety?',
      description: 'Shows if the liquidity is locked and secured. If liquidity is not locked, it can be pulled, causing the token\'s price to crash.'
    },
    'community-health': {
      emoji: '💚',
      title: 'What is Community Health?',
      description: 'Measures engagement, reach, and support of the community. Strong communities help project growth and reduce the chance of fraud.'
    },
    'market-stability': {
      emoji: '📈',
      title: 'What is Market Stability?',
      description: 'Evaluates trading activity and price stability. Stable markets indicate genuine interest and lower manipulation risk.'
    }
  };

  // Dropdown component for score info
  const ScoreDropdown = ({ scoreId, children }: { scoreId: string; children: React.ReactNode }) => {
    const isExpanded = expandedDropdown === scoreId;
    const scoreInfo = scoreInfoData[scoreId as keyof typeof scoreInfoData];

    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          {children}
          <button
            onClick={() => toggleDropdown(scoreId)}
            className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
          >
            <Info className="h-4 w-4" />
            <ChevronDown 
              className={`h-3 w-3 transition-transform duration-300 ease-in-out ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`} 
            />
          </button>
        </div>
        
        {/* Dropdown Content */}
        <div className={`
          absolute top-full left-0 right-0 mt-2 z-50 transition-all duration-300 ease-in-out transform
          ${isExpanded 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }
        `}>
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{scoreInfo?.emoji}</span>
              <h4 className="text-sm font-semibold text-cyan-400">{scoreInfo?.title}</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{scoreInfo?.description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-cyan-500/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Brain className="h-5 w-5" />
            AI Risk Assessment
          </CardTitle>
          <Badge className={`${overallRisk.bgColor} ${overallRisk.color} border`}>
            {overallRisk.level}
          </Badge>
        </div>
        <CardDescription className="text-gray-400">
          Advanced AI analysis of token safety and legitimacy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Insights Section */}
        {mlAnalysis.geminiAnalysis && (
          <div className="space-y-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {mlAnalysis.geminiAnalysis.reasoning}
            </p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-400">AI Confidence: {mlAnalysis.geminiAnalysis.confidence}%</span>
              <span className="text-gray-500">Advanced AI Analysis</span>
            </div>
          </div>
        )}

        {/* Overall Risk Score */}
        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <ScoreDropdown scoreId="overall-risk">
              <span className="text-sm font-medium text-gray-300">Overall Risk Score</span>
            </ScoreDropdown>
            <span className={`text-xl font-bold ${overallRisk.color}`}>
              {mlAnalysis.mlScore.overallRisk}%
            </span>
          </div>
          <Progress 
            value={mlAnalysis.mlScore.overallRisk} 
            className="h-3 bg-gray-700/50"
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Safe</span>
            <span className={getConfidenceColor(mlAnalysis.mlScore.confidence)}>
              Confidence: {Math.round(mlAnalysis.mlScore.confidence * 100)}%
            </span>
            <span>Dangerous</span>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <ScoreDropdown scoreId="rug-pull">
                <span className="text-sm text-gray-300">Rug Pull Risk</span>
              </ScoreDropdown>
              <span className="text-sm font-medium text-cyan-400">
                {mlAnalysis.mlScore.rugPullRisk}%
              </span>
            </div>
            <Progress 
              value={mlAnalysis.mlScore.rugPullRisk} 
              className="h-2 bg-gray-700/50"
            />
          </div>
          
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <ScoreDropdown scoreId="liquidity-risk">
                <span className="text-sm text-gray-300">Liquidity Risk</span>
              </ScoreDropdown>
              <span className="text-sm font-medium text-cyan-400">
                {mlAnalysis.mlScore.liquidityRisk}%
              </span>
            </div>
            <Progress 
              value={mlAnalysis.mlScore.liquidityRisk} 
              className="h-2 bg-gray-700/50"
            />
          </div>
          
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <ScoreDropdown scoreId="contract-risk">
                <span className="text-sm text-gray-300">Contract Risk</span>
              </ScoreDropdown>
              <span className="text-sm font-medium text-cyan-400">
                {mlAnalysis.mlScore.contractRisk}%
              </span>
            </div>
            <Progress 
              value={mlAnalysis.mlScore.contractRisk} 
              className="h-2 bg-gray-700/50"
            />
          </div>
          
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <ScoreDropdown scoreId="community-risk">
                <span className="text-sm text-gray-300">Community Risk</span>
              </ScoreDropdown>
              <span className="text-sm font-medium text-cyan-400">
                {mlAnalysis.mlScore.communityRisk}%
              </span>
            </div>
            <Progress 
              value={mlAnalysis.mlScore.communityRisk} 
              className="h-2 bg-gray-700/50"
            />
          </div>
        </div>

        {/* Feature Scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Feature Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 relative">
              <div className="flex justify-between items-center mb-1">
                <ScoreDropdown scoreId="contract-security">
                  <span className="text-xs text-gray-400">Contract Security</span>
                </ScoreDropdown>
                <span className="text-sm font-medium text-cyan-400">
                  {mlAnalysis.features.contractSecurity}%
                </span>
              </div>
              <Progress 
                value={mlAnalysis.features.contractSecurity} 
                className="h-1.5 bg-gray-700/50"
              />
            </div>
            
            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 relative">
              <div className="flex justify-between items-center mb-1">
                <ScoreDropdown scoreId="liquidity-safety">
                  <span className="text-xs text-gray-400">Liquidity Safety</span>
                </ScoreDropdown>
                <span className="text-sm font-medium text-cyan-400">
                  {mlAnalysis.features.liquiditySafety}%
                </span>
              </div>
              <Progress 
                value={mlAnalysis.features.liquiditySafety} 
                className="h-1.5 bg-gray-700/50"
              />
            </div>
            
            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 relative">
              <div className="flex justify-between items-center mb-1">
                <ScoreDropdown scoreId="community-health">
                  <span className="text-xs text-gray-400">Community Health</span>
                </ScoreDropdown>
                <span className="text-sm font-medium text-cyan-400">
                  {mlAnalysis.features.communityHealth}%
                </span>
              </div>
              <Progress 
                value={mlAnalysis.features.communityHealth} 
                className="h-1.5 bg-gray-700/50"
              />
            </div>
            
            <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 relative">
              <div className="flex justify-between items-center mb-1">
                <ScoreDropdown scoreId="market-stability">
                  <span className="text-xs text-gray-400">Market Stability</span>
                </ScoreDropdown>
                <span className="text-sm font-medium text-cyan-400">
                  {mlAnalysis.features.marketStability}%
                </span>
              </div>
              <Progress 
                value={mlAnalysis.features.marketStability} 
                className="h-1.5 bg-gray-700/50"
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {mlAnalysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {mlAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {mlAnalysis.riskFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {mlAnalysis.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <XCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MLAnalysisCard;
