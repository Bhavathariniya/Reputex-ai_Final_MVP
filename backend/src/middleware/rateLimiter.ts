import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Per-IP rate limit on the analysis endpoint. Protects both our wallet (every
 * analysis fans out to ~7 paid/free providers) and the upstream APIs from
 * abuse. Tune RATE_LIMIT_* in env; for production behind a proxy, also set
 * `app.set('trust proxy', 1)` (done in index.ts).
 */
export const analyzeRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RateLimited', message: 'Too many requests — please slow down.' },
});
