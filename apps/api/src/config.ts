import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_API_BASE_URL: z.string().url().default('https://api.github.com'),
  GITHUB_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppConfig = z.infer<typeof EnvSchema> & {
  githubToken?: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid configuration: ${details}`);
  }

  const data = parsed.data;
  const token = data.GITHUB_TOKEN?.trim();
  if (token === '') {
    throw new Error('Invalid configuration: GITHUB_TOKEN must not be empty when set.');
  }

  return {
    ...data,
    githubToken: token || undefined,
  };
}
