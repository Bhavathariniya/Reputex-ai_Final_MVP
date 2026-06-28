import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * Gemini AI — EXPLANATION layer only.
 *
 * Design decision (senior): the AI does NOT compute the trust score. The score
 * is deterministic and auditable (see scoring/engine.ts). Gemini is used to:
 *   1. turn the structured signals into a clear, human-readable narrative, and
 *   2. optionally flag extra red flags it spots in the verified source code.
 *
 * This keeps results reproducible and defensible (you can always explain why a
 * score is what it is) while still giving users the friendly AI summary.
 */

let client: GoogleGenerativeAI | null = null;
if (env.GEMINI_API_KEY) {
  client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

export interface AiExplanation {
  available: boolean;
  reasoning?: string;
  extraRiskFactors?: string[];
}

export async function explain(summary: unknown, sourceSnippet?: string): Promise<AiExplanation> {
  if (!client) return { available: false };
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = [
      'You are a blockchain security analyst. You are given the OUTPUT of a deterministic',
      'token risk engine (already scored). Do NOT invent new scores. In 3-5 sentences, explain',
      'in plain English what the risks mean for a retail investor, then list any ADDITIONAL',
      'concrete red flags you notice. Respond as strict JSON: {"reasoning": string, "extraRiskFactors": string[]}.',
      '',
      'ENGINE OUTPUT:',
      JSON.stringify(summary, null, 2),
      sourceSnippet ? `\nVERIFIED SOURCE (truncated):\n${sourceSnippet.slice(0, 6000)}` : '',
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJson(text);
    return {
      available: true,
      reasoning: typeof parsed?.reasoning === 'string' ? parsed.reasoning : text.slice(0, 800),
      extraRiskFactors: Array.isArray(parsed?.extraRiskFactors)
        ? parsed.extraRiskFactors.filter((x: unknown) => typeof x === 'string')
        : [],
    };
  } catch (err) {
    logger.warn('gemini_failed', { err: String(err) });
    return { available: false };
  }
}

function safeParseJson(text: string): any {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}
