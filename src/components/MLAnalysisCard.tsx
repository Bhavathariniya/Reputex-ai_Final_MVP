
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

/**
 * Color helpers — bars are graded by what the number *means*, not a single
 * brand color. For "risk" metrics a higher value is worse; for "safety"
 * features a higher value is better. Both map to the same green→red scale.
 */
const riskTone = (score: number) => {
  if (score < 30) return { text: 'text-emerald-400', bar: 'bg-emerald-500', soft: 'bg-emerald-500/10 border-emerald-500/30' };
  if (score < 50) return { text: 'text-yellow-400', bar: 'bg-yellow-500', soft: 'bg-yellow-500/10 border-yellow-500/30' };
  if (score < 70) return { text: 'text-orange-400', bar: 'bg-orange-500', soft: 'bg-orange-500/10 border-orange-500/30' };
  return { text: 'text-red-400', bar: 'bg-red-500', soft: 'bg-red-500/10 border-red-500/30' };
};

const safetyTone = (score: number) => riskTone(100 - score);

const MLAnalysisCard: React.FC<MLAnalysisCardProps> = ({ mlAnalysis, isLoading }) => {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const toggleDropdown = (scoreId: string) => {
    setExpandedDropdown(expandedDropdown === scoreId ? null : scoreId);
  };

  if (isLoading) {
    return (
      <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-neon-cyan" />
            Safety Analysis
          </CardTitle>
          <CardDescription>Running the analysis…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low Risk', ...riskTone(score) };
    if (score < 50) return { level: 'Moderate Risk', ...riskTone(score) };
    if (score < 70) return { level: 'High Risk', ...riskTone(score) };
    return { level: 'Critical Risk', ...riskTone(score) };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-emerald-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const overall = mlAnalysis.mlScore.overallRisk;
  const overallRisk = getRiskLevel(overall);
  // Safety score = the inverse, framed positively for the headline number.
  const safetyScore = Math.max(0, Math.min(100, 100 - overall));
  const overallTone = riskTone(overall);

  // Score info data with emojis and descriptions
  const scoreInfoData = {
    'overall-risk': {
      emoji: '🎯',
      title: 'What is the Overall Risk Score?',
      description: 'This score combines every risk factor below into a single number. Lower is safer. Use it for a quick read, then check the breakdown for the why.'
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
            className="flex items-center gap-1 text-muted-foreground hover:text-neon-cyan transition-colors duration-200"
            aria-label="More info"
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
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{scoreInfo?.emoji}</span>
              <h4 className="text-sm font-semibold text-foreground">{scoreInfo?.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{scoreInfo?.description}</p>
          </div>
        </div>
      </div>
    );
  };

  // Risk breakdown rows (higher = worse) and feature rows (higher = better).
  const riskRows = [
    { id: 'rug-pull', label: 'Rug Pull Risk', value: mlAnalysis.mlScore.rugPullRisk },
    { id: 'liquidity-risk', label: 'Liquidity Risk', value: mlAnalysis.mlScore.liquidityRisk },
    { id: 'contract-risk', label: 'Contract Risk', value: mlAnalysis.mlScore.contractRisk },
    { id: 'community-risk', label: 'Community Risk', value: mlAnalysis.mlScore.communityRisk },
  ];
  const featureRows = [
    { id: 'contract-security', label: 'Contract Security', value: mlAnalysis.features.contractSecurity },
    { id: 'liquidity-safety', label: 'Liquidity Safety', value: mlAnalysis.features.liquiditySafety },
    { id: 'community-health', label: 'Community Health', value: mlAnalysis.features.communityHealth },
    { id: 'market-stability', label: 'Market Stability', value: mlAnalysis.features.marketStability },
  ];

  return (
    <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-neon-cyan" />
            Safety Analysis
          </CardTitle>
          <Badge className={`${overallRisk.soft} ${overallRisk.text} border`}>
            {overallRisk.level}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          A genuine, on-chain assessment of this token's safety and legitimacy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Insights Section */}
        {mlAnalysis.geminiAnalysis && (
          <div className="space-y-3 p-4 bg-muted/20 border border-border/60 rounded-lg">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-neon-cyan" />
              AI Insights
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mlAnalysis.geminiAnalysis.reasoning}
            </p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neon-cyan">AI Confidence: {mlAnalysis.geminiAnalysis.confidence}%</span>
              <span className="text-muted-foreground">Advanced AI Analysis</span>
            </div>
          </div>
        )}

        {/* Headline — Safety score + overall risk, side by side */}
        <div className={`rounded-xl border p-5 ${overallRisk.soft}`}>
          <div className="flex items-end justify-between mb-3">
            <div className="space-y-1">
              <ScoreDropdown scoreId="overall-risk">
                <span className="text-sm font-medium text-muted-foreground">Overall Risk Score</span>
              </ScoreDropdown>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${overallTone.text}`}>{overall}</span>
                <span className="text-sm text-muted-foreground">/ 100 risk</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs text-muted-foreground">Safety</span>
              <div className={`text-2xl font-bold ${safetyTone(safetyScore).text}`}>{safetyScore}%</div>
            </div>
          </div>
          <Progress
            value={overall}
            className="h-3 bg-muted/50"
            indicatorClassName={overallTone.bar}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
            <span>🟢 Safe</span>
            <span className={getConfidenceColor(mlAnalysis.mlScore.confidence)}>
              Confidence: {Math.round(mlAnalysis.mlScore.confidence * 100)}%
            </span>
            <span>Dangerous 🔴</span>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Risk Breakdown
            <span className="text-xs text-muted-foreground font-normal">(lower is better)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskRows.map((row) => {
              const tone = riskTone(row.value);
              return (
                <div key={row.id} className="space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <ScoreDropdown scoreId={row.id}>
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                    </ScoreDropdown>
                    <span className={`text-sm font-semibold ${tone.text}`}>{row.value}%</span>
                  </div>
                  <Progress value={row.value} className="h-2 bg-muted/50" indicatorClassName={tone.bar} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neon-cyan" />
            Safety Signals
            <span className="text-xs text-muted-foreground font-normal">(higher is better)</span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {featureRows.map((row) => {
              const tone = safetyTone(row.value);
              return (
                <div key={row.id} className="bg-muted/20 p-3 rounded-lg border border-border/60 relative">
                  <div className="flex justify-between items-center mb-1">
                    <ScoreDropdown scoreId={row.id}>
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                    </ScoreDropdown>
                    <span className={`text-sm font-semibold ${tone.text}`}>{row.value}%</span>
                  </div>
                  <Progress value={row.value} className="h-1.5 bg-muted/50" indicatorClassName={tone.bar} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {mlAnalysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-neon-cyan" />
              What this means for you
            </h4>
            <div className="space-y-2">
              {mlAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
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
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
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
