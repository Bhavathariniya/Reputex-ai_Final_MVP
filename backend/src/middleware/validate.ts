import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

/** EVM address shape — the only input we accept for analysis. */
export const analyzeSchema = z.object({
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 0x EVM address (40 hex chars).'),
  network: z.string().trim().toLowerCase().optional(),
  skipAi: z.boolean().optional(),
});

export type AnalyzeBody = z.infer<typeof analyzeSchema>;

/** Generic body validator factory — rejects malformed input with 400 before
 *  it ever reaches a provider call (defence against injection / abuse). */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
