import { ProductService, CreateProductInput } from '../../src/services/product.service';
import { ProductRepository } from '../../src/repositories/product.repository';
import { NotFoundError, ConflictError } from '../../src/utils/errors';
import { Prisma } from '@prisma/client';

// Mock the repository
jest.mock('../../src/repositories/product.repository');

const mockProduct = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Product',
  description: 'A test product',
  price: new Prisma.Decimal(29.99),
  sku: 'TEST-001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ProductRepository>;

    service = new ProductService(repository);
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const input: CreateProductInput = {
        name: 'Test Product',
        description: 'A test product',
        price: 29.99,
        sku: 'TEST-001',
      };

      repository.create.mockResolvedValue(mockProduct);

      const result = await service.create(input);

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
        price: expect.any(Prisma.Decimal),
        sku: input.sku,
      });
    });

    it('should throw ConflictError on duplicate SKU', async () => {
      const input: CreateProductInput = {
        name: 'Test Product',
        price: 29.99,
        sku: 'TEST-001',
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      repository.create.mockRejectedValue(prismaError);

      await expect(service.create(input)).rejects.toThrow(ConflictError);
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      repository.findById.mockResolvedValue(mockProduct);

      const result = await service.findById(mockProduct.id);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      repository.findAll.mockResolvedValue([mockProduct]);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repository.findAll).toHaveBeenCalledWith(0, 10);
    });

    it('should calculate correct skip for page 2', async () => {
      repository.findAll.mockResolvedValue([]);
      repository.count.mockResolvedValue(15);

      await service.findAll({ page: 2, pageSize: 10 });

      expect(repository.findAll).toHaveBeenCalledWith(10, 10);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updated = { ...mockProduct, name: 'Updated Product' };
      repository.findById.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue(updated);

      const result = await service.update(mockProduct.id, { name: 'Updated Product' });

      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundError when updating non-existent product', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'test' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('should delete a product successfully', async () => {
      repository.findById.mockResolvedValue(mockProduct);
      repository.delete.mockResolvedValue(mockProduct);

      await expect(service.delete(mockProduct.id)).resolves.toBeUndefined();
    });

    it('should throw NotFoundError when deleting non-existent product', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
