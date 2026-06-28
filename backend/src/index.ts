import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, corsOrigins } from './config/env';
import { logger } from './lib/logger';
import { healthRouter } from './routes/health';
import { analyzeRouter } from './routes/analyze';
import { sourceRouter } from './routes/source';
import { errorHandler, notFound } from './middleware/errorHandler';
import { mountTelegramWebhook, activateTelegramWebhook } from './bot/webhook';

const app = express();

// Behind a reverse proxy / load balancer in production so rate-limit & client
// IP detection work correctly.
app.set('trust proxy', 1);

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl / server-to-server (no Origin header) and any
      // explicitly allowlisted browser origin. Everything else is rejected.
      if (!origin || corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST'],
  }),
);
// Telegram webhook receiver — mounted BEFORE the global body cap (it brings its
// own parser) and before the 404 handler. Returns null when the bot is disabled.
const telegramBot = mountTelegramWebhook(app);

app.use(express.json({ limit: '16kb' })); // tiny body cap — we only accept an address

// --- Routes ---
app.use('/', healthRouter);
app.use('/api/v1', analyzeRouter);
app.use('/api/v1', sourceRouter);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info('server_started', {
    port: env.PORT,
    env: env.NODE_ENV,
    cors: corsOrigins,
  });
  // Register the webhook with Telegram once we're actually listening.
  if (telegramBot) void activateTelegramWebhook(telegramBot);
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('server_stopping', { sig });
    server.close(() => process.exit(0));
  });
}
