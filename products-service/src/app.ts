import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { swaggerSpec } from './config/swagger';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error-handler.middleware';
import { ProductRepository } from './repositories/product.repository';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { createProductRoutes } from './routes/product.routes';

export function createApp(prisma: PrismaClient) {
  const app = express();

  app.use(express.json());

  // Swagger docs (no auth required)
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Auth middleware for all API routes
  app.use('/api/v1', authMiddleware);

  // Dependency injection
  const repository = new ProductRepository(prisma);
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  // Routes
  app.use('/api/v1/products', createProductRoutes(controller));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
