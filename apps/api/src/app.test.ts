import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

function testConfig() {
  return loadConfig({
    NODE_ENV: 'test',
    PORT: '3000',
    CORS_ORIGIN: 'http://localhost:8080',
    GITHUB_API_BASE_URL: 'https://api.github.com',
    GITHUB_REQUEST_TIMEOUT_MS: '2000',
    CACHE_TTL_SECONDS: '0',
    CACHE_MAX_ENTRIES: '10',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX: '1000',
    LOG_LEVEL: 'error',
  });
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'x-ratelimit-remaining': '50',
      ...headers,
    },
  });
}

describe('API health', () => {
  it('returns liveness', async () => {
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl: vi.fn(),
    });
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns readiness', async () => {
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl: vi.fn(),
    });
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});

describe('POST /api/v1/analyze', () => {
  it('validates body', async () => {
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl: vi.fn(),
    });
    const res = await request(app).post('/api/v1/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('rejects unsupported hosts', async () => {
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl: vi.fn(),
    });
    const res = await request(app)
      .post('/api/v1/analyze')
      .send({ url: 'https://gitlab.com/foo/bar' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('unsupported_host');
  });

  it('maps repository not found', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, { message: 'Not Found' }));
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl,
    });
    const res = await request(app)
      .post('/api/v1/analyze')
      .send({ url: 'https://github.com/acme/missing' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('repository_not_found');
  });

  it('maps rate limits', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0' }),
    );
    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl,
    });
    const res = await request(app)
      .post('/api/v1/analyze')
      .send({ url: 'https://github.com/acme/demo' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('github_rate_limited');
  });

  it('returns a health report for a mocked repository', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/repos/acme/demo')) {
        return jsonResponse(200, {
          name: 'demo',
          full_name: 'acme/demo',
          description: 'Demo',
          owner: { login: 'acme' },
          language: 'TypeScript',
          stargazers_count: 12,
          forks_count: 3,
          open_issues_count: 2,
          pushed_at: '2024-06-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
          default_branch: 'main',
          html_url: 'https://github.com/acme/demo',
          private: false,
          has_issues: true,
        });
      }
      if (url.includes('/contents')) {
        return jsonResponse(200, [
          { name: 'README.md', path: 'README.md', type: 'file' },
          { name: 'tests', path: 'tests', type: 'dir' },
        ]);
      }
      if (url.includes('/readme')) {
        const content = Buffer.from('# Demo\n\n## Install\n\nnpm i\n\n## Usage\n').toString('base64');
        return jsonResponse(200, { content, encoding: 'base64', name: 'README.md' });
      }
      if (url.includes('/issues')) {
        return jsonResponse(200, [
          {
            title: 'Bug',
            created_at: '2024-06-01T00:00:00Z',
            labels: [{ name: 'bug' }],
          },
          {
            title: 'PR',
            created_at: '2024-06-01T00:00:00Z',
            labels: [],
            pull_request: {},
          },
        ]);
      }
      return jsonResponse(404, { message: 'Not Found' });
    });

    const app = createApp({
      config: testConfig(),
      logger: createLogger(testConfig()),
      fetchImpl: fetchImpl as typeof fetch,
    });

    const res = await request(app)
      .post('/api/v1/analyze')
      .send({ url: 'https://github.com/acme/demo' });

    expect(res.status).toBe(200);
    expect(res.body.overview.fullName).toBe('acme/demo');
    expect(res.body.overview.openIssues).toBe(1);
    expect(res.body.categories).toHaveLength(4);
    expect(typeof res.body.overallScore).toBe('number');
  });
});
