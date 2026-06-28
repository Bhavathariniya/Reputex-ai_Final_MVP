import 'dotenv/config';
import { z } from 'zod';

/**
 * Validated, typed environment configuration.
 *
 * Provider keys are optional so the server still boots in degraded mode if a
 * key is missing — each service checks for its own key and falls back to
 * "data unavailable" rather than crashing. This keeps the scoring engine
 * honest: missing data lowers confidence, it does not fabricate a result.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGINS: z.string().default('http://localhost:8080,http://localhost:5173'),

  CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),

  ETHERSCAN_API_KEY: z.string().optional(),
  MORALIS_API_KEY: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Telegram bot (optional — needed for `npm run bot` or webhook mode)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  // Public URL of the web app, used for "Open full report" buttons in the bot.
  WEB_APP_URL: z.string().default('http://localhost:8080'),
  // Public https URL of THIS API, used to register the Telegram webhook.
  // On Render this is auto-injected as RENDER_EXTERNAL_URL; set explicitly elsewhere.
  PUBLIC_API_URL: z.string().optional(),
  // Optional shared secret validating inbound webhook calls (auto-derived if unset).
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Which providers have a key configured — surfaced in /health for ops visibility. */
export const providerStatus = {
  etherscan: Boolean(env.ETHERSCAN_API_KEY),
  moralis: Boolean(env.MORALIS_API_KEY),
  coingecko: Boolean(env.COINGECKO_API_KEY),
  gemini: Boolean(env.GEMINI_API_KEY),
};
