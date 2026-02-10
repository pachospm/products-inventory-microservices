import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createApp } from '../../src/app';

// Set env vars before importing
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/inventory_test';
process.env.API_KEY = 'test-api-key';
process.env.PRODUCTS_SERVICE_URL = 'http://localhost:3001';
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();
const mockHttpClient = axios.create();
const app = createApp(prisma, mockHttpClient);
const API_KEY = 'test-api-key';

// Mock axios for inter-service calls
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const mockInstance = {
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: { common: {} } },
  };
  return {
    ...actual,
    create: jest.fn(() => mockInstance),
  };
});

describe('Inventory Routes (Integration)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.inventory.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.inventory.deleteMany();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/inventory/:productId', () => {
    it('should return inventory for a product', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock product service response
      (mockHttpClient.get as jest.Mock).mockResolvedValue({
        data: { data: { id: productId, attributes: { name: 'Test', sku: 'T-1' } } },
      });

      // Create inventory record
      await prisma.inventory.create({
        data: { productId, quantity: 50 },
      });

      const res = await request(app)
        .get(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('inventory');
      expect(res.body.data.attributes['product-id']).toBe(productId);
      expect(res.body.data.attributes.quantity).toBe(50);
    });

    it('should return 401 without API key', async () => {
      const res = await request(app).get('/api/v1/inventory/some-id');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/inventory/:productId', () => {
    it('should update inventory (upsert)', async () => {
      const productId = '223e4567-e89b-12d3-a456-426614174000';

      (mockHttpClient.get as jest.Mock).mockResolvedValue({
        data: { data: { id: productId, attributes: { name: 'Test', sku: 'T-2' } } },
      });

      const res = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .send({
          data: {
            type: 'inventory',
            attributes: { quantity: 100 },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attributes.quantity).toBe(100);
    });

    it('should return 422 for invalid quantity', async () => {
      const res = await request(app)
        .patch('/api/v1/inventory/some-id')
        .set('X-API-Key', API_KEY)
        .send({
          data: {
            type: 'inventory',
            attributes: { quantity: -5 },
          },
        });

      expect(res.status).toBe(422);
    });
  });
});
