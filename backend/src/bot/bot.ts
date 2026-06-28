import { Bot, InlineKeyboard } from 'grammy';
import { env } from '../config/env';
import { analyzeToken } from '../services/analyze';
import { explorerAddressUrl } from '../chains';
import { logger } from '../lib/logger';
import { formatAnalysis } from './format';

/**
 * ReputeX Telegram bot — handler definitions only.
 *
 * `createBot()` builds a fully-wired bot WITHOUT starting it, so the same
 * handlers can run either via long-polling (`npm run bot` / a worker) or via a
 * webhook mounted on the Express API. Send it any EVM token address and it
 * replies with the genuine ReputeX trust score, reusing the same deterministic
 * engine as the web app and API.
 */

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

const WELCOME = [
  '🛡️ <b>ReputeX AI — Crypto Safety Scanner</b>',
  '',
  'Send me any token <b>contract address</b> (0x…) and I’ll tell you if it looks safe — honeypot check, contract security, liquidity, holder concentration and more, in one score.',
  '',
  '<b>Try it:</b> paste an address, or use <code>/scan 0x…</code>',
  '',
  '<i>Not financial advice. Always do your own research.</i>',
].join('\n');

/** A valid token is `<numeric_bot_id>:<secret>` — catch a half-pasted token early. */
export function isValidBotToken(token?: string): token is string {
  return Boolean(token && /^\d+:[A-Za-z0-9_-]+$/.test(token));
}

/** Shared handler: analyze an address and reply with a formatted card. */
async function handleScan(ctx: any, address: string): Promise<void> {
  const thinking = await ctx.reply('🔎 Analyzing on-chain… this takes a few seconds.');
  try {
    const result = await analyzeToken({ address, network: 'auto', skipAi: true });

    const keyboard = new InlineKeyboard()
      .url('🔍 Full report', `${env.WEB_APP_URL}/result?address=${result.address}&network=${result.network}`)
      .url('🌐 Explorer', explorerAddressUrl(result.network, result.address));

    await ctx.api.editMessageText(ctx.chat.id, thinking.message_id, formatAnalysis(result), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    logger.error('bot_scan_failed', { err: String(err) });
    await ctx.api.editMessageText(
      ctx.chat.id,
      thinking.message_id,
      '⚠️ Couldn’t analyze that address. Make sure it’s a valid token contract on a supported chain, then try again.',
    );
  }
}

/** Build a fully-wired bot. Does NOT start polling or set a webhook. */
export function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.command('start', (ctx) => ctx.reply(WELCOME, { parse_mode: 'HTML' }));
  bot.command('help', (ctx) => ctx.reply(WELCOME, { parse_mode: 'HTML' }));

  bot.command('scan', async (ctx) => {
    const match = ADDRESS_RE.exec(ctx.match ?? '');
    if (!match) {
      await ctx.reply('Usage: <code>/scan 0x…</code> (a token contract address)', { parse_mode: 'HTML' });
      return;
    }
    await handleScan(ctx, match[0]);
  });

  // Any plain message containing an address → analyze it.
  bot.on('message:text', async (ctx) => {
    const match = ADDRESS_RE.exec(ctx.message.text);
    if (match) {
      await handleScan(ctx, match[0]);
    } else {
      await ctx.reply('Send me a token contract address (0x…) to scan, or /help.', { parse_mode: 'HTML' });
    }
  });

  bot.catch((err) => logger.error('bot_error', { err: String(err.error) }));

  return bot;
}
