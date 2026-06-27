import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, corsOrigins } from './config/env';
import { logger } from './lib/logger';
import { healthRouter } from './routes/health';
import { analyzeRouter } from './routes/analyze';
import { errorHandler, notFound } from './middleware/errorHandler';

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
app.use(express.json({ limit: '16kb' })); // tiny body cap — we only accept an address

// --- Routes ---
app.use('/', healthRouter);
app.use('/api/v1', analyzeRouter);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info('server_started', {
    port: env.PORT,
    env: env.NODE_ENV,
    cors: corsOrigins,
  });
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('server_stopping', { sig });
    server.close(() => process.exit(0));
  });
}
