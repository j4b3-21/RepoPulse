import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { AppConfig } from './config.js';
import { InMemoryCache } from './cache/memoryCache.js';
import { GitHubClient } from './github/client.js';
import type { Logger } from './logger.js';
import { createAnalyzeRouter } from './routes/analyze.js';
import { createHealthRouter } from './routes/health.js';
import { AnalyzeService } from './services/analyzeService.js';
import type { HealthReport } from '@repopulse/shared';
import type { FetchLike } from './github/client.js';

export type CreateAppOptions = {
  config: AppConfig;
  logger: Logger;
  fetchImpl?: FetchLike;
};

export function createApp({ config, logger, fetchImpl }: CreateAppOptions) {
  const app = express();

  app.disable('x-powered-by');
  // Behind Nginx / reverse proxies so express-rate-limit can use X-Forwarded-For safely.
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const origins = config.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: origins.length === 1 ? origins[0] : origins,
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '16kb' }));

  const github = new GitHubClient(config, logger, fetchImpl);
  const cache = new InMemoryCache<HealthReport>(config.CACHE_MAX_ENTRIES);
  const analyzeService = new AnalyzeService(github, cache, config, logger);

  app.use('/api/v1/health', createHealthRouter(config));
  app.use('/api/v1/analyze', createAnalyzeRouter(analyzeService, config, logger));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'not_found', message: 'Not found.' },
    });
  });

  return app;
}
