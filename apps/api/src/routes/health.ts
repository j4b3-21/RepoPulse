import { Router } from 'express';
import type { AppConfig } from '../config.js';

export function createHealthRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/live', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/ready', (_req, res) => {
    const checks = {
      config: true,
      githubBaseUrl: Boolean(config.GITHUB_API_BASE_URL),
    };
    const ready = Object.values(checks).every(Boolean);
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks,
    });
  });

  return router;
}
