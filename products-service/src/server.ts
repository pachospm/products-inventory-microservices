import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { createApp } from './app';
import pino from 'pino';

const logger = pino({ name: 'products-service' });
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  logger.info('Connected to database');

  const app = createApp(prisma);

  app.listen(env.PORT, () => {
    logger.info(`Products service running on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
