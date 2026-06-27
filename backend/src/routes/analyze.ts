import { Router } from 'express';
import { analyzeRateLimiter } from '../middleware/rateLimiter';
import { analyzeSchema, validateBody, type AnalyzeBody } from '../middleware/validate';
import { isSupportedChain } from '../chains';
import { analyzeToken, SUPPORTED_NETWORKS } from '../services/analyze';
import { logger } from '../lib/logger';

export const analyzeRouter = Router();

/**
 * POST /api/v1/analyze
 * Body: { address: "0x..", network?: "ethereum"|"auto"|.., skipAi?: boolean }
 *
 * Returns the full deterministic risk analysis (see scoring/types.ts).
 */
analyzeRouter.post('/analyze', analyzeRateLimiter, validateBody(analyzeSchema), async (req, res, next) => {
  const { address, network, skipAi } = req.body as AnalyzeBody;
  try {
    if (network && network !== 'auto' && !isSupportedChain(network)) {
      res.status(400).json({
        error: 'UnsupportedNetwork',
        message: `Network "${network}" is not supported.`,
        supported: SUPPORTED_NETWORKS,
      });
      return;
    }
    const started = Date.now();
    const result = await analyzeToken({ address, network, skipAi });
    logger.info('analyze_done', {
      address,
      network: result.network,
      trustScore: result.trustScore,
      verdict: result.verdict,
      ms: Date.now() - started,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
