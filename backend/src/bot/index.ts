import { env } from '../config/env';
import { logger } from '../lib/logger';
import { createBot, isValidBotToken } from './bot';

/**
 * Long-polling entry point for the Telegram bot. Run with `npm run bot` (local
 * dev) or as an always-on worker. In production on Render the bot instead runs
 * in WEBHOOK mode from the API web service — see src/bot/webhook.ts — so no
 * separate process is needed.
 */
const TOKEN = env.TELEGRAM_BOT_TOKEN;
if (!isValidBotToken(TOKEN)) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ TELEGRAM_BOT_TOKEN is missing or malformed. Expected "<bot_id>:<secret>"\n' +
      '   (e.g. 8012345678:AA...). Copy the FULL token from @BotFather into backend/.env.',
  );
  process.exit(1);
}

const bot = createBot(TOKEN);

void bot.start({
  onStart: (info) => logger.info('bot_started', { mode: 'long-polling', username: info.username }),
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('bot_stopping', { sig });
    void bot.stop();
  });
}
