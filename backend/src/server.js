import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`A Una Milla backend running on http://localhost:${env.PORT}`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`Active flight provider: ${env.FLIGHT_PROVIDER}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Closed database connection and stopped server. Exiting process.');
      process.exit(0);
    });

    // Force exit after 5s timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Server failed to start', { message: err.message, stack: err.stack });
  process.exit(1);
});
