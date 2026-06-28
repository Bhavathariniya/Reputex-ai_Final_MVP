import { Router } from 'express';
import { providerStatus } from '../config/env';
import { SUPPORTED_NETWORKS } from '../services/analyze';

export const healthRouter = Router();

/** Liveness + ops visibility: which providers are configured, which chains we serve. */
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    providers: providerStatus,
    networks: SUPPORTED_NETWORKS,
    timestamp: new Date().toISOString(),
  });
});
