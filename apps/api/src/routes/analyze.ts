import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AnalyzeRequestSchema } from '@repopulse/shared';
import type { AppConfig } from '../config.js';
import { AppError, toClientError } from '../errors.js';
import type { Logger } from '../logger.js';
import type { AnalyzeService } from '../services/analyzeService.js';

export function createAnalyzeRouter(
  service: AnalyzeService,
  config: AppConfig,
  logger: Logger,
): Router {
  const router = Router();

  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'rate_limited',
        message: 'Too many analysis requests. Please try again later.',
      },
    },
  });

  router.post('/', limiter, async (req, res) => {
    try {
      const body = AnalyzeRequestSchema.safeParse(req.body);
      if (!body.success) {
        throw new AppError(400, 'invalid_request', 'Request body must include a valid url string.');
      }

      const report = await service.analyze(body.data.url);
      res.status(200).json(report);
    } catch (error) {
      const client = toClientError(error);
      if (!(error instanceof AppError)) {
        logger.error('analyze_unexpected_error', {
          message: error instanceof Error ? error.message : 'unknown',
        });
      } else {
        logger.warn('analyze_failed', { code: client.code, statusCode: client.statusCode });
      }
      res.status(client.statusCode).json({
        error: { code: client.code, message: client.message },
      });
    }
  });

  return router;
}
