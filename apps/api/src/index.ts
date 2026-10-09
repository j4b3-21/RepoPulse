import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

const config = loadConfig();
const logger = createLogger(config);
const app = createApp({ config, logger });

const server = app.listen(config.PORT, () => {
  logger.info('server_listening', { port: config.PORT, env: config.NODE_ENV });
});

function shutdown(signal: string) {
  logger.info('shutdown_start', { signal });
  server.close((err) => {
    if (err) {
      logger.error('shutdown_error', { message: err.message });
      process.exit(1);
    }
    logger.info('shutdown_complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('shutdown_forced');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
