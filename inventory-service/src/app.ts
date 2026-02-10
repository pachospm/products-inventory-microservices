import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { AxiosInstance } from 'axios';
import { swaggerSpec } from './config/swagger';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error-handler.middleware';
import { InventoryRepository } from './repositories/inventory.repository';
import { ProductClientService } from './services/product-client.service';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';
import { createInventoryRoutes } from './routes/inventory.routes';

export function createApp(prisma: PrismaClient, httpClient: AxiosInstance) {
  const app = express();

  app.use(express.json());

  // Swagger docs (no auth required)
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Auth middleware for all API routes
  app.use('/api/v1', authMiddleware);

  // Dependency injection
  const repository = new InventoryRepository(prisma);
  const productClient = new ProductClientService(httpClient);
  const service = new InventoryService(repository, productClient);
  const controller = new InventoryController(service);

  // Routes
  app.use('/api/v1/inventory', createInventoryRoutes(controller));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
