import express, { type Express } from 'express';
import { webhookCallback, type Bot } from 'grammy';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { createBot, isValidBotToken } from './bot';

/**
 * Webhook mode for the Telegram bot, served from the API web service so the bot
 * needs no separate always-on process (works on Render's free plan).
 *
 * Flow: mountTelegramWebhook() registers the receiving route synchronously
 * (before the 404 handler); activateTelegramWebhook() then tells Telegram where
 * to push updates. Both are no-ops unless a valid token AND a public URL exist.
 */

export const TELEGRAM_WEBHOOK_PATH = '/telegram/webhook';

/** Public https URL of THIS API — explicit override, else Render's injected var. */
function publicApiUrl(): string | undefined {
  return env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL;
}

/** Secret used both in the URL header check and Telegram's setWebhook call. */
function webhookSecret(token: string): string {
  return env.TELEGRAM_WEBHOOK_SECRET || token.split(':')[1].slice(0, 32);
}

/**
 * Register the webhook receiver route and return the bot (or null if disabled).
 * Uses its own JSON parser so it's independent of the tiny global body cap.
 */
export function mountTelegramWebhook(app: Express): Bot | null {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!isValidBotToken(token)) {
    logger.info('telegram_webhook_disabled', { reason: 'no_valid_token' });
    return null;
  }
  if (!publicApiUrl()) {
    logger.warn('telegram_webhook_disabled', {
      reason: 'no_public_url',
      hint: 'set PUBLIC_API_URL (or deploy on Render, which injects RENDER_EXTERNAL_URL)',
    });
    return null;
  }

  const bot = createBot(token);
  app.use(
    TELEGRAM_WEBHOOK_PATH,
    express.json({ limit: '1mb' }),
    webhookCallback(bot, 'express', { secretToken: webhookSecret(token) }),
  );
  return bot;
}

/** Tell Telegram to push updates to our webhook URL. Call once after listen(). */
export async function activateTelegramWebhook(bot: Bot): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN!;
  const base = publicApiUrl()!.replace(/\/$/, '');
  const url = `${base}${TELEGRAM_WEBHOOK_PATH}`;
  try {
    await bot.init();
    await bot.api.setWebhook(url, {
      secret_token: webhookSecret(token),
      drop_pending_updates: true,
    });
    logger.info('telegram_webhook_set', { url, username: bot.botInfo?.username });
  } catch (err) {
    logger.error('telegram_webhook_failed', { url, err: String(err) });
  }
}
