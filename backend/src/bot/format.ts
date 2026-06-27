import type { AnalyzeResult } from '../scoring/types';
import { getChain } from '../chains';

/** Escape user/token-derived text for Telegram HTML parse mode. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const VERDICT_EMOJI: Record<string, string> = {
  'Likely Safe': '🟢',
  'Probably OK': '🟡',
  'High Caution': '🟠',
  'High Risk': '🔴',
  'Critical - Avoid': '⛔',
};

/** 10-segment progress bar, e.g. ▰▰▰▰▰▰▱▱▱▱ */
function bar(score: number): string {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 10);
  return '▰'.repeat(filled) + '▱'.repeat(10 - filled);
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Build the rich HTML message shown for a completed analysis. */
export function formatAnalysis(r: AnalyzeResult): string {
  const emoji = VERDICT_EMOJI[r.verdict] ?? '⚪';
  const name = r.token.name ? esc(r.token.name) : 'Unknown token';
  const symbol = r.token.symbol ? ` (${esc(r.token.symbol)})` : '';
  const chain = getChain(r.network).name;

  const lines: string[] = [];
  lines.push(`${emoji} <b>${name}${symbol}</b> — ${esc(r.verdict)}`);
  lines.push('');
  lines.push(`<b>Trust Score: ${r.trustScore}/100</b>`);
  lines.push(`<code>${bar(r.trustScore)}</code>  ${r.trustScore}%`);
  lines.push('');
  lines.push(`🌐 ${esc(chain)} · ${r.addressType} · ${Math.round(r.confidence * 100)}% confidence`);

  const risks = r.reasons
    .filter((x) => x.severity === 'critical' || x.severity === 'high' || x.severity === 'medium')
    .slice(0, 4);
  if (risks.length) {
    lines.push('');
    lines.push('<b>⚠️ Risks</b>');
    for (const x of risks) {
      lines.push(`• ${esc(x.message)}${x.evidence ? ` <i>(${esc(x.evidence)})</i>` : ''}`);
    }
  }

  const goods = r.reasons.filter((x) => x.severity === 'positive').slice(0, 3);
  if (goods.length) {
    lines.push('');
    lines.push('<b>✅ Good signs</b>');
    for (const x of goods) lines.push(`• ${esc(x.message)}`);
  }

  lines.push('');
  lines.push(`<code>${shortAddr(r.address)}</code>`);
  lines.push('<i>Not financial advice. Always DYOR.</i>');

  return lines.join('\n');
}

export { shortAddr };
