import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield, AlertTriangle, TrendingUp, Lock, CheckCircle, XCircle, FileText, Copy,
} from 'lucide-react';
import { TokenData } from '@/lib/api-client';
import { toast } from 'sonner';

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

type Tone = 'emerald' | 'gold' | 'orange' | 'red';

const TONE: Record<Tone, { text: string; bar: string; ring: string; soft: string; label: string }> = {
  emerald: { text: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'hsl(158 64% 45%)', soft: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', label: 'Strong' },
  gold:    { text: 'text-amber-400',   bar: 'bg-amber-400',   ring: 'hsl(38 92% 50%)',  soft: 'bg-amber-500/10 border-amber-500/30 text-amber-300',     label: 'Moderate' },
  orange:  { text: 'text-orange-400',  bar: 'bg-orange-500',  ring: 'hsl(25 90% 53%)',  soft: 'bg-orange-500/10 border-orange-500/30 text-orange-300',  label: 'Weak' },
  red:     { text: 'text-red-400',     bar: 'bg-red-500',     ring: 'hsl(0 72% 51%)',   soft: 'bg-red-500/10 border-red-500/30 text-red-300',          label: 'Critical' },
};

function toneFor(score: number): Tone {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'orange';
  return 'red';
}

function verdictFor(score: number): string {
  if (score >= 80) return 'Likely Safe';
  if (score >= 60) return 'Probably OK';
  if (score >= 40) return 'High Caution';
  if (score >= 20) return 'High Risk';
  return 'Critical — Avoid';
}

const ScoreGauge: React.FC<{ score: number; tone: Tone }> = ({ score, tone }) => {
  const r = 76;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative h-48 w-48">
      <svg className="h-48 w-48 -rotate-90" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(222 25% 17%)" strokeWidth="12" />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={TONE[tone].ring} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 6px ${TONE[tone].ring})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-5xl font-bold ${TONE[tone].text}`}>{score}</span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const PillarBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const tone = toneFor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${TONE[tone].text}`}>{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${TONE[tone].bar}`} style={{ width: `${value}%`, transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );
};

const AnalysisReport: React.FC<AnalysisReportProps> = ({
  address, network, scores, analysis, timestamp, tokenData, scamIndicators = [],
}) => {
  const tone = toneFor(scores.trust_score);
  const safety = 100 - scores.fraud_risk;
  const shortAddr = `${address.slice(0, 8)}…${address.slice(-6)}`;

  const copy = () => {
    navigator.clipboard?.writeText(address);
    toast.success('Address copied');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Hero score */}
      <Card className="glass-card overflow-hidden">
        <div className={`h-1 w-full ${TONE[tone].bar}`} />
        <CardContent className="grid grid-cols-1 items-center gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
          <div className="flex justify-center">
            <ScoreGauge score={scores.trust_score} tone={tone} />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge className={`border ${TONE[tone].soft} text-sm`}>
                <Shield className="mr-1 h-3.5 w-3.5" /> {verdictFor(scores.trust_score)}
              </Badge>
              <span className="pill capitalize">{network}</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                {tokenData?.tokenName || 'Trust Analysis'}
                {tokenData?.tokenSymbol ? <span className="text-muted-foreground"> ({tokenData.tokenSymbol})</span> : null}
              </h2>
              <button onClick={copy} className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                {shortAddr} <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="metric-card text-center md:text-left">
                <div className="text-xs text-muted-foreground">Safety</div>
                <div className={`font-display text-xl font-bold ${TONE[toneFor(safety)].text}`}>{safety}%</div>
              </div>
              <div className="metric-card text-center md:text-left">
                <div className="text-xs text-muted-foreground">Fraud risk</div>
                <div className={`font-display text-xl font-bold ${TONE[toneFor(100 - scores.fraud_risk)].text}`}>{scores.fraud_risk}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Score breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <PillarBar label="Contract security" value={scores.developer_score} />
          <PillarBar label="Liquidity" value={scores.liquidity_score} />
          <PillarBar label="Holder distribution" value={scores.holder_distribution} />
          <PillarBar label="Community" value={scores.community_score} />
          <PillarBar label="Social sentiment" value={scores.social_sentiment} />
          <PillarBar label="Tradability (1 − fraud)" value={100 - scores.fraud_risk} />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" /> Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{analysis}</p>
        </CardContent>
      </Card>

      {/* Risk factors */}
      {scamIndicators.length > 0 && (
        <Card className="border border-amber-500/30 bg-amber-500/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-300">
              <AlertTriangle className="h-4 w-4" /> Risk factors ({scamIndicators.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scamIndicators.map((ind, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-amber-500/15 bg-amber-500/[0.06] p-3">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <div className="text-sm text-muted-foreground">{ind.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Token info */}
      {tokenData && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Token details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Info label="Name" value={tokenData.tokenName} />
            <Info label="Symbol" value={tokenData.tokenSymbol} />
            <BoolInfo label="Verified contract" ok={tokenData.isVerified} okText="Verified" noText="Unverified" />
            <BoolInfo label="Liquidity lock" ok={tokenData.isLiquidityLocked} okText="Locked" noText="Unknown" icon={Lock} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-center justify-between gap-2 px-1 text-xs text-muted-foreground sm:flex-row">
        <span>Analyzed {new Date(timestamp).toLocaleString()}</span>
        <span className="text-muted-foreground/70">Not financial advice — always do your own research.</span>
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="metric-card">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="truncate font-medium">{value || '—'}</div>
  </div>
);

const BoolInfo: React.FC<{ label: string; ok: boolean; okText: string; noText: string; icon?: React.ComponentType<{ className?: string }> }> = ({ label, ok, okText, noText, icon: Icon }) => (
  <div className="metric-card">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`flex items-center gap-1.5 font-medium ${ok ? 'text-emerald-400' : 'text-muted-foreground'}`}>
      {ok ? <CheckCircle className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {ok ? okText : noText}
    </div>
  </div>
);

export default AnalysisReport;
