import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { createApp } from './app';
import { createHttpClient } from './utils/http-client';
import pino from 'pino';

const logger = pino({ name: 'inventory-service' });
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  logger.info('Connected to database');

  const httpClient = createHttpClient(env.PRODUCTS_SERVICE_URL, env.API_KEY);
  const app = createApp(prisma, httpClient);

  app.listen(env.PORT, () => {
    logger.info(`Inventory service running on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
