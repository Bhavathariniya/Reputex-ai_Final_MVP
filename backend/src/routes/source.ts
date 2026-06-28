import { Router } from 'express';
import { z } from 'zod';
import { getSourceCode } from '../services/explorer';
import { isSupportedChain } from '../chains';
import { analyzeRateLimiter } from '../middleware/rateLimiter';

export const sourceRouter = Router();

const querySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address'),
  network: z.string().optional(),
});

/**
 * GET /api/v1/source?address=0x..&network=ethereum
 * Returns verified contract source code (server-side, keyed). Powers the
 * "Source Code" tab without exposing the Etherscan key to the browser.
 */
sourceRouter.get('/source', analyzeRateLimiter, async (req, res, next) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { address } = parsed.data;
  const network = parsed.data.network && isSupportedChain(parsed.data.network) ? parsed.data.network : 'ethereum';
  try {
    const src = await getSourceCode(network, address.toLowerCase());
    res.json({
      isVerified: src.isVerified,
      contractName: src.contractName ?? '',
      compilerVersion: src.compilerVersion ?? '',
      isProxy: src.isProxy ?? false,
      sourceCode: src.sourceCode ?? '',
    });
  } catch (err) {
    next(err);
  }
});
