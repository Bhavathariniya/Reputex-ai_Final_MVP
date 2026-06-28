import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle,
  Copy, Check, ExternalLink, TrendingUp, TrendingDown, Droplets, BarChart3,
  Wallet, Clock, Database, Info,
} from 'lucide-react';
import type { AnalyzeResult, BackendReason } from '@/lib/reputexApi';

interface TokenReportProps {
  result: AnalyzeResult;
}

/* ------------------------------------------------------------------ helpers */

/** Trust score is "higher is better" — grade green→red accordingly. */
const trustTone = (score: number) => {
  if (score >= 75) return { text: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40', glow: 'shadow-[0_0_30px_-8px] shadow-emerald-500/50', soft: 'bg-emerald-500/10' };
  if (score >= 55) return { text: 'text-yellow-400', bar: 'bg-yellow-500', ring: 'border-yellow-500/40', glow: 'shadow-[0_0_30px_-8px] shadow-yellow-500/50', soft: 'bg-yellow-500/10' };
  if (score >= 35) return { text: 'text-orange-400', bar: 'bg-orange-500', ring: 'border-orange-500/40', glow: 'shadow-[0_0_30px_-8px] shadow-orange-500/50', soft: 'bg-orange-500/10' };
  return { text: 'text-red-400', bar: 'bg-red-500', ring: 'border-red-500/40', glow: 'shadow-[0_0_30px_-8px] shadow-red-500/50', soft: 'bg-red-500/10' };
};

const severityMeta: Record<string, { tone: string; bg: string; label: string; weight: number }> = {
  critical: { tone: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Critical', weight: 5 },
  high: { tone: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'High', weight: 4 },
  medium: { tone: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', label: 'Medium', weight: 3 },
  low: { tone: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Low', weight: 2 },
  info: { tone: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', label: 'Info', weight: 1 },
  positive: { tone: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Good', weight: 0 },
};

const fmtUsd = (n?: number): string => {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (n > 0 && n < 0.01) return `$${n.toPrecision(2)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const fmtAge = (days?: number, creationDate?: string): string => {
  if (days != null && days >= 0) {
    if (days >= 365) return `${(days / 365).toFixed(1)} yrs`;
    if (days >= 30) return `${Math.round(days / 30)} mo`;
    return `${Math.round(days)} d`;
  }
  return creationDate || '—';
};

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const explorerBase: Record<string, string> = {
  ethereum: 'https://etherscan.io',
  bsc: 'https://bscscan.com',
  polygon: 'https://polygonscan.com',
  arbitrum: 'https://arbiscan.io',
  optimism: 'https://optimistic.etherscan.io',
  base: 'https://basescan.org',
  avalanche: 'https://snowtrace.io',
  fantom: 'https://ftmscan.com',
};

/* -------------------------------------------------------------- components */

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone?: string }> = ({
  icon, label, value, tone,
}) => (
  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
      {icon}
      {label}
    </div>
    <div className={`text-base font-semibold ${tone ?? 'text-foreground'}`}>{value}</div>
  </div>
);

const TokenReport: React.FC<TokenReportProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const tone = trustTone(result.trustScore);
  const name = result.token.name || 'Unknown Token';
  const symbol = result.token.symbol ? result.token.symbol.toUpperCase() : '';
  const confidencePct = Math.round(result.confidence * 100);

  const sources = result.dataSources || {};
  const sourceEntries = Object.entries(sources);
  const liveSources = sourceEntries.filter(([, ok]) => ok).length;

  const explorer = explorerBase[result.network];
  const explorerUrl = explorer ? `${explorer}/token/${result.address}` : undefined;

  const copyAddress = () => {
    navigator.clipboard?.writeText(result.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Split reasons into risks (bad) and strengths (positive), each sorted by weight.
  const risks = result.reasons
    .filter((r) => r.severity !== 'positive' && r.severity !== 'info')
    .sort((a, b) => (severityMeta[b.severity]?.weight ?? 0) - (severityMeta[a.severity]?.weight ?? 0));
  const strengths = result.reasons.filter((r) => r.severity === 'positive');

  const VerdictIcon = result.trustScore >= 75 ? ShieldCheck : result.trustScore >= 45 ? Shield : ShieldAlert;

  const change = result.token.priceChange24h;

  return (
    <div className="space-y-6">
      {/* ───────────────────────── Verdict hero ───────────────────────── */}
      <Card className={`relative overflow-hidden border ${tone.ring} bg-card/60 backdrop-blur-md ${tone.glow}`}>
        <div className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Identity */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold truncate">{name}</h2>
                {symbol && <span className="text-lg font-semibold text-muted-foreground">{symbol}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="border-neon-cyan/40 text-neon-cyan capitalize">
                  {result.network}
                </Badge>
                <Badge variant="outline" className="border-border/60 capitalize text-muted-foreground">
                  {result.addressType === 'unknown' ? 'token' : result.addressType}
                </Badge>
                <button
                  onClick={copyAddress}
                  className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy address"
                >
                  {shortAddr(result.address)}
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-neon-cyan transition-colors"
                  >
                    Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Confidence + data coverage */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Confidence: <span className="text-foreground font-medium">{confidencePct}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Live data sources: <span className="text-foreground font-medium">{liveSources}/{sourceEntries.length}</span>
                </span>
              </div>
            </div>

            {/* Trust score */}
            <div className={`shrink-0 rounded-xl border ${tone.ring} ${tone.soft} p-5 text-center w-full lg:w-56`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <VerdictIcon className={`h-5 w-5 ${tone.text}`} />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Trust Score</span>
              </div>
              <div className={`text-5xl font-bold leading-none ${tone.text}`}>{result.trustScore}</div>
              <div className="text-xs text-muted-foreground mt-1">out of 100</div>
              <Progress value={result.trustScore} className="h-1.5 bg-muted/50 mt-3" indicatorClassName={tone.bar} />
              <div className={`mt-3 text-sm font-semibold ${tone.text}`}>{result.verdict}</div>
            </div>
          </div>

          {/* Market stats strip */}
          {(result.token.priceUsd != null || result.token.marketCap != null || result.token.liquidityUsd != null) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              <StatTile icon={<BarChart3 className="h-3.5 w-3.5" />} label="Price" value={fmtUsd(result.token.priceUsd)} />
              <StatTile
                icon={change != null && change < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                label="24h"
                value={change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                tone={change == null ? undefined : change >= 0 ? 'text-emerald-400' : 'text-red-400'}
              />
              <StatTile icon={<Wallet className="h-3.5 w-3.5" />} label="Market Cap" value={fmtUsd(result.token.marketCap)} />
              <StatTile icon={<Droplets className="h-3.5 w-3.5" />} label="Liquidity" value={fmtUsd(result.token.liquidityUsd)} />
              <StatTile icon={<BarChart3 className="h-3.5 w-3.5" />} label="Volume 24h" value={fmtUsd(result.token.volume24h)} />
              <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Age" value={fmtAge(result.token.ageDays, result.token.creationDate)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───────────────────── Scoring pillars ───────────────────── */}
      {result.pillars?.length > 0 && (
        <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-neon-cyan" />
              How the score breaks down
            </CardTitle>
            <CardDescription>
              Each pillar is scored independently and weighted into the trust score. Pillars with no data lower confidence instead of guessing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.pillars.map((p) => {
              const pTone = trustTone(p.score);
              return (
                <div key={p.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(p.weight * 100)}% weight</span>
                      {!p.available && (
                        <Badge variant="outline" className="border-border/60 text-muted-foreground text-[10px] py-0">
                          no data
                        </Badge>
                      )}
                    </div>
                    <span className={`font-semibold ${p.available ? pTone.text : 'text-muted-foreground'}`}>
                      {p.available ? `${p.score}/100` : '—'}
                    </span>
                  </div>
                  <Progress
                    value={p.available ? p.score : 0}
                    className="h-2 bg-muted/50"
                    indicatorClassName={p.available ? pTone.bar : 'bg-muted'}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ───────────────────── Findings: risks + strengths ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risks */}
        <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Key risks
              <span className="text-xs font-normal text-muted-foreground">({risks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notable risks detected by the engine.</p>
            ) : (
              risks.map((r, i) => <ReasonRow key={i} reason={r} />)
            )}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Good signs
              <span className="text-xs font-normal text-muted-foreground">({strengths.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">No standout positive signals.</p>
            ) : (
              strengths.map((r, i) => <ReasonRow key={i} reason={r} positive />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────── Honeypot / tax ───────────────────── */}
      {result.honeypot?.checked && (
        <Card className="border border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-neon-cyan" />
              Honeypot &amp; trading taxes
            </CardTitle>
            <CardDescription>Can you actually sell, and what does it cost?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`rounded-lg border p-3 ${result.honeypot.isHoneypot ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
              <div className="text-xs text-muted-foreground mb-1">Sellable?</div>
              <div className={`font-semibold flex items-center gap-1.5 ${result.honeypot.isHoneypot ? 'text-red-400' : 'text-emerald-400'}`}>
                {result.honeypot.isHoneypot ? <><XCircle className="h-4 w-4" /> Honeypot</> : <><CheckCircle2 className="h-4 w-4" /> Yes</>}
              </div>
            </div>
            <StatTile icon={<TrendingUp className="h-3.5 w-3.5" />} label="Buy tax" value={result.honeypot.buyTax != null ? `${result.honeypot.buyTax}%` : '—'} />
            <StatTile icon={<TrendingDown className="h-3.5 w-3.5" />} label="Sell tax" value={result.honeypot.sellTax != null ? `${result.honeypot.sellTax}%` : '—'} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/** A single reason line: severity chip + message + evidence + source. */
const ReasonRow: React.FC<{ reason: BackendReason; positive?: boolean }> = ({ reason, positive }) => {
  const meta = severityMeta[reason.severity] ?? severityMeta.info;
  return (
    <div className={`rounded-lg border p-3 ${meta.bg}`}>
      <div className="flex items-start gap-2">
        {positive ? (
          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${meta.tone}`} />
        ) : (
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${meta.tone}`} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground">{reason.message}</span>
            {!positive && (
              <Badge variant="outline" className={`text-[10px] py-0 border-current ${meta.tone}`}>
                {meta.label}
              </Badge>
            )}
          </div>
          {reason.evidence && (
            <p className="text-xs text-muted-foreground mt-1 break-words">{reason.evidence}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
            <span>{reason.pillar}</span>
            <span>·</span>
            <span>{reason.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenReport;
