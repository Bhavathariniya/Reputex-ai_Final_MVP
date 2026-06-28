import React, { useState } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, LabelList,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity, ShieldCheck, PieChart as PieIcon, Droplets, Users, Coins,
  FileCode, ChevronDown, CheckCircle2, AlertTriangle, Gauge,
} from 'lucide-react';
import ContractCodeDisplay from '@/components/ContractCodeDisplay';
import type { AnalyzeResult } from '@/lib/reputexApi';

interface Props {
  result: AnalyzeResult;
  address: string;
}

/* palette aligned to the site theme */
const C = {
  cyan: '#22e0ff',
  blue: '#2E8BFF',
  purple: '#8A2BE2',
  pink: '#FF00FF',
  emerald: '#34d399',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
  grid: 'rgba(148,163,184,0.18)',
  axis: 'rgba(148,163,184,0.7)',
};

const scoreColor = (s: number) => (s >= 75 ? C.emerald : s >= 55 ? C.yellow : s >= 35 ? C.orange : C.red);
const riskColor = (s: number) => (s < 30 ? C.emerald : s < 50 ? C.yellow : s < 70 ? C.orange : C.red);

const fmtUsd = (n?: number): string => {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (n > 0 && n < 0.01) return `$${n.toPrecision(2)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const fmtSupply = (raw?: string, decimals = 18): string => {
  if (!raw || raw === 'N/A') return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  // Heuristic: very large integers are base units → scale by decimals.
  const v = n > 1e15 ? n / Math.pow(10, decimals) : n;
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const fmtDate = (d?: string): string => {
  if (!d) return '—';
  const parts = d.includes('-') ? d.split('-') : [];
  let date: Date;
  if (parts.length === 3 && parts[0].length <= 2) {
    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  } else {
    date = new Date(d);
  }
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}{typeof p.value === 'number' && p.value <= 100 ? '' : ''}</span>
        </div>
      ))}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; mono?: boolean; span?: boolean }> = ({
  label, children, mono, span,
}) => (
  <div className={span ? 'col-span-1 md:col-span-2' : ''}>
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`${mono ? 'font-mono text-xs bg-muted/30 p-2 rounded break-all' : 'font-semibold'}`}>{children}</div>
  </div>
);

const TokenAnalytics: React.FC<Props> = ({ result, address }) => {
  const [showSource, setShowSource] = useState(false);
  const { token, ml, pillars, honeypot } = result;
  const f = ml.features;

  // ── Security fingerprint (radar) — all framed as "safety" (higher better)
  const radarData = [
    { metric: 'Contract', value: f.contractSecurity ?? 0 },
    { metric: 'Liquidity', value: f.liquiditySafety ?? 0 },
    { metric: 'Community', value: f.communityHealth ?? 0 },
    { metric: 'Market', value: f.marketStability ?? 0 },
    { metric: 'Ownership', value: 100 - (f.ownershipRisk ?? 0) },
    { metric: 'Honeypot', value: 100 - (f.honeypotRisk ?? 0) },
  ];

  // ── Risk dials (radial) — higher = worse
  const riskData = [
    { name: 'Rug Pull', value: ml.mlScore.rugPullRisk, fill: riskColor(ml.mlScore.rugPullRisk) },
    { name: 'Liquidity', value: ml.mlScore.liquidityRisk, fill: riskColor(ml.mlScore.liquidityRisk) },
    { name: 'Contract', value: ml.mlScore.contractRisk, fill: riskColor(ml.mlScore.contractRisk) },
    { name: 'Community', value: ml.mlScore.communityRisk, fill: riskColor(ml.mlScore.communityRisk) },
  ];

  // ── Pillar weighted contribution (bar)
  const contribData = (pillars ?? [])
    .filter((p) => p.available)
    .map((p) => ({ name: p.label, value: Math.round(p.score * p.weight), score: p.score }));

  // ── Holder concentration — parse "Top N holders control X%" from reasons
  const holderReason = result.reasons.find((r) => /top\s*\d+\s*holders?/i.test(`${r.message} ${r.evidence ?? ''}`));
  const holderPctMatch = holderReason && `${holderReason.message} ${holderReason.evidence ?? ''}`.match(/([\d.]+)\s*%/);
  const topPct = holderPctMatch ? Math.min(100, parseFloat(holderPctMatch[1])) : null;
  const holderData = topPct != null ? [
    { name: 'Top holders', value: topPct, fill: topPct > 50 ? C.red : topPct > 30 ? C.orange : C.emerald },
    { name: 'Everyone else', value: 100 - topPct, fill: C.blue },
  ] : null;

  // ── Liquidity / market ratios (analyst metrics)
  const liq = token.liquidityUsd;
  const mc = token.marketCap;
  const vol = token.volume24h;
  const liqToMc = liq != null && mc ? (liq / mc) * 100 : null;     // depth vs size
  const volToLiq = vol != null && liq ? (vol / liq) * 100 : null;  // daily turnover
  const marketBars = [
    { name: 'Market Cap', value: mc ?? 0 },
    { name: 'Liquidity', value: liq ?? 0 },
    { name: 'Volume 24h', value: vol ?? 0 },
  ].filter((d) => d.value > 0);

  const taxData = honeypot.checked ? [
    { name: 'Buy', value: honeypot.buyTax ?? 0, fill: (honeypot.buyTax ?? 0) > 10 ? C.red : C.cyan },
    { name: 'Sell', value: honeypot.sellTax ?? 0, fill: (honeypot.sellTax ?? 0) > 10 ? C.red : C.blue },
  ] : null;

  return (
    <div className="space-y-6">
      {/* ───────── Token fundamentals ───────── */}
      <Card className="glass-card border-neon-cyan/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-5 w-5 text-neon-cyan" />
            Token Fundamentals
          </CardTitle>
          <CardDescription>On-chain contract facts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <Field label="Name">{token.name || 'Unknown'}</Field>
            <Field label="Symbol">{token.symbol ? token.symbol.toUpperCase() : '—'}</Field>
            <Field label="Total Supply">{fmtSupply(token.totalSupply, token.decimals)}</Field>
            <Field label="Decimals">{token.decimals ?? 18}</Field>
            <Field label="Verified">
              {result.dataSources?.etherscan ? (
                <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="h-3 w-3 mr-1" />Yes</Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400"><AlertTriangle className="h-3 w-3 mr-1" />No</Badge>
              )}
            </Field>
            <Field label="Created">{fmtDate(token.creationDate)}</Field>
            <Field label="Age">{token.ageDays != null ? `${Math.round(token.ageDays)} days` : '—'}</Field>
            <Field label="Top Holders">{topPct != null ? `Control ${topPct}%` : '—'}</Field>
            <Field label="Contract Address" mono span>{address}</Field>
            {token.creator && <Field label="Deployer" mono span>{token.creator}</Field>}
          </div>
        </CardContent>
      </Card>

      {/* ───────── Two-up: security fingerprint radar + risk dials ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Safety Fingerprint
            </CardTitle>
            <CardDescription>Six safety dimensions — bigger shape is safer</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={C.grid} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: C.axis, fontSize: 11 }} />
                <Radar dataKey="value" name="Safety" stroke={C.cyan} fill={C.cyan} fillOpacity={0.35} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-5 w-5 text-orange-400" />
              Risk Dials
            </CardTitle>
            <CardDescription>Four risk vectors — fuller ring means more risk</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart innerRadius="25%" outerRadius="100%" data={riskData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.12)' }} cornerRadius={6} />
                <Tooltip content={<ChartTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {riskData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold" style={{ color: d.fill }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───────── Pillar contribution to trust score ───────── */}
      {contribData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-neon-cyan" />
              What drives the trust score
            </CardTitle>
            <CardDescription>Weighted points each pillar contributes (score × weight)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(180, contribData.length * 46)}>
              <BarChart data={contribData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: C.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {contribData.map((d, i) => <Cell key={i} fill={scoreColor(d.score)} />)}
                  <LabelList dataKey="value" position="right" fill={C.axis} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────── Market depth + holder concentration ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="h-5 w-5 text-blue-400" />
              Market &amp; Liquidity
            </CardTitle>
            <CardDescription>Depth relative to size and daily turnover</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={marketBars} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <XAxis type="number" hide scale="log" domain={['auto', 'auto']} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: C.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} formatter={(v: any) => fmtUsd(v)} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                    <Cell fill={C.purple} /><Cell fill={C.cyan} /><Cell fill={C.blue} />
                    <LabelList dataKey="value" position="right" fill={C.axis} fontSize={11} formatter={(v: any) => fmtUsd(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No DEX market data available for this token.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">Liquidity / Market Cap</div>
                <div className="text-lg font-bold" style={{ color: liqToMc == null ? undefined : liqToMc < 2 ? C.red : liqToMc < 8 ? C.yellow : C.emerald }}>
                  {liqToMc != null ? `${liqToMc.toFixed(1)}%` : '—'}
                </div>
                <div className="text-[11px] text-muted-foreground">higher = easier to exit</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="text-xs text-muted-foreground mb-1">24h Volume / Liquidity</div>
                <div className="text-lg font-bold" style={{ color: volToLiq == null ? undefined : volToLiq > 300 ? C.orange : C.cyan }}>
                  {volToLiq != null ? `${volToLiq.toFixed(0)}%` : '—'}
                </div>
                <div className="text-[11px] text-muted-foreground">daily turnover rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-neon-cyan" />
              Holder Concentration
            </CardTitle>
            <CardDescription>How much supply the largest wallets control</CardDescription>
          </CardHeader>
          <CardContent>
            {holderData ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={holderData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                      {holderData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} formatter={(v: any) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {holderData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-sm" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-2 font-bold" style={{ color: d.fill }}>{d.value.toFixed(1)}%</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    {topPct! > 50 ? 'Highly concentrated — a few wallets can move the price.' : topPct! > 30 ? 'Moderately concentrated.' : 'Reasonably distributed.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Holder distribution data not available for this token.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────── Trading taxes ───────── */}
      {taxData && (taxData[0].value > 0 || taxData[1].value > 0) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-5 w-5 text-yellow-400" />
              Trading Taxes
            </CardTitle>
            <CardDescription>Fees charged on each buy and sell</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={taxData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" hide domain={[0, Math.max(20, ...taxData.map((d) => d.value))]} />
                <YAxis type="category" dataKey="name" width={50} tick={{ fill: C.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} formatter={(v: any) => `${v}%`} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                  {taxData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  <LabelList dataKey="value" position="right" fill={C.axis} fontSize={12} formatter={(v: any) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────── Verified source code (collapsible) ───────── */}
      <Card className="glass-card">
        <button
          onClick={() => setShowSource((s) => !s)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-neon-purple" />
            <span className="font-semibold">Verified Source Code</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showSource ? 'rotate-180' : ''}`} />
        </button>
        {showSource && (
          <CardContent className="pt-0">
            <ContractCodeDisplay contractAddress={address} tokenName={token.name || 'Token'} />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TokenAnalytics;
