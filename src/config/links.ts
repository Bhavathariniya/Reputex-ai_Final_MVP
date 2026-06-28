/**
 * External link configuration.
 *
 * The Telegram bot URL is read from VITE_TELEGRAM_BOT_URL so it can be set per
 * environment without code changes. Update the fallback (or set the env var) to
 * your bot's real username — find it in @BotFather → /mybots.
 */
export const TELEGRAM_BOT_URL =
  import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/ReputeXAIbot';
