import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

/** 404 for unknown routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'NotFound' });
}

/**
 * Central error handler. Never leaks internals (stack traces, provider URLs,
 * keys) to the client — those go to the server log only.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('unhandled_error', { err: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: 'InternalError', message: 'Something went wrong analysing this token.' });
}
