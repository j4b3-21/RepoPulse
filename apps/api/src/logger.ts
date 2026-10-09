import type { AppConfig } from './config.js';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;

export function createLogger(config: AppConfig) {
  const min = levels[config.LOG_LEVEL];

  function write(level: keyof typeof levels, message: string, meta?: Record<string, unknown>) {
    if (levels[level] < min) return;
    const entry = {
      level,
      message,
      time: new Date().toISOString(),
      ...(meta ? sanitize(meta) : {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) => write('debug', message, meta),
    info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
  };
}

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (/authorization|token|secret|password/i.test(key)) {
      out[key] = '[redacted]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

export type Logger = ReturnType<typeof createLogger>;
