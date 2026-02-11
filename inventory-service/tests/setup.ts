// Jest setup file - runs BEFORE any test module imports
// This ensures env vars are set before env.ts loads
process.env.API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/inventory_db';
process.env.PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001';
