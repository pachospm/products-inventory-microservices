import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';

// Set env vars before importing anything that uses them
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/products_db';
process.env.API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();
const app = createApp(prisma);
const API_KEY = 'test-api-key';

describe('Product Routes (Integration)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.product.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();
  });

  describe('POST /api/v1/products', () => {
    it('should create a product', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send({
          data: {
            type: 'products',
            attributes: {
              name: 'Test Laptop',
              description: 'A gaming laptop',
              price: 1299.99,
              sku: 'LAP-001',
            },
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.type).toBe('products');
      expect(res.body.data.attributes.name).toBe('Test Laptop');
      expect(res.body.data.attributes.sku).toBe('LAP-001');
    });

    it('should return 422 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send({
          data: {
            type: 'products',
            attributes: {
              price: -10,
            },
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 401 without API key', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({
          data: {
            type: 'products',
            attributes: { name: 'Test', price: 10, sku: 'T-1' },
          },
        });

      expect(res.status).toBe(401);
    });

    it('should return 409 for duplicate SKU', async () => {
      const body = {
        data: {
          type: 'products',
          attributes: {
            name: 'Product A',
            price: 10,
            sku: 'DUP-001',
          },
        },
      };

      await request(app).post('/api/v1/products').set('X-API-Key', API_KEY).send(body);

      const res = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(body);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return a product by ID', async () => {
      const product = await prisma.product.create({
        data: { name: 'Test', price: 10, sku: 'GET-001' },
      });

      const res = await request(app)
        .get(`/api/v1/products/${product.id}`)
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(product.id);
      expect(res.body.data.type).toBe('products');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should list products with pagination', async () => {
      await prisma.product.createMany({
        data: [
          { name: 'Product 1', price: 10, sku: 'LIST-001' },
          { name: 'Product 2', price: 20, sku: 'LIST-002' },
          { name: 'Product 3', price: 30, sku: 'LIST-003' },
        ],
      });

      const res = await request(app)
        .get('/api/v1/products?page[number]=1&page[size]=2')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
      expect(res.body.links).toBeDefined();
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should update a product', async () => {
      const product = await prisma.product.create({
        data: { name: 'Old Name', price: 10, sku: 'UPD-001' },
      });

      const res = await request(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('X-API-Key', API_KEY)
        .send({
          data: {
            type: 'products',
            attributes: { name: 'New Name' },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attributes.name).toBe('New Name');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product', async () => {
      const product = await prisma.product.create({
        data: { name: 'To Delete', price: 10, sku: 'DEL-001' },
      });

      const res = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(404);
    });
  });
});
