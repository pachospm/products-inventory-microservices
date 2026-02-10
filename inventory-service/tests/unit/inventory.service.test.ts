import { InventoryService } from '../../src/services/inventory.service';
import { InventoryRepository } from '../../src/repositories/inventory.repository';
import { ProductClientService } from '../../src/services/product-client.service';
import { NotFoundError } from '../../src/utils/errors';

// Mock events to avoid pino output during tests
jest.mock('../../src/events/inventory.events', () => ({
  emitInventoryUpdated: jest.fn(),
  emitInventoryCreated: jest.fn(),
}));

const mockInventory = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  productId: 'prod-123',
  quantity: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProductData = {
  id: 'prod-123',
  attributes: { name: 'Test Product', sku: 'TEST-001' },
};

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<InventoryRepository>;
  let productClient: jest.Mocked<ProductClientService>;

  beforeEach(() => {
    repository = {
      findByProductId: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<InventoryRepository>;

    productClient = {
      validateProductExists: jest.fn(),
    } as unknown as jest.Mocked<ProductClientService>;

    service = new InventoryService(repository, productClient);
  });

  describe('getByProductId', () => {
    it('should return inventory for an existing product', async () => {
      productClient.validateProductExists.mockResolvedValue(mockProductData);
      repository.findByProductId.mockResolvedValue(mockInventory);

      const result = await service.getByProductId('prod-123');

      expect(result).toEqual(mockInventory);
      expect(productClient.validateProductExists).toHaveBeenCalledWith('prod-123');
    });

    it('should throw NotFoundError when product exists but no inventory', async () => {
      productClient.validateProductExists.mockResolvedValue(mockProductData);
      repository.findByProductId.mockResolvedValue(null);

      await expect(service.getByProductId('prod-123')).rejects.toThrow(NotFoundError);
    });

    it('should propagate error when product does not exist', async () => {
      productClient.validateProductExists.mockRejectedValue(
        new NotFoundError('Product', 'prod-999'),
      );

      await expect(service.getByProductId('prod-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStock', () => {
    it('should create inventory for new product', async () => {
      productClient.validateProductExists.mockResolvedValue(mockProductData);
      repository.findByProductId.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ ...mockInventory, quantity: 50 });

      const result = await service.updateStock('prod-123', 50);

      expect(result.quantity).toBe(50);
      expect(repository.upsert).toHaveBeenCalledWith('prod-123', 50);
    });

    it('should update existing inventory', async () => {
      productClient.validateProductExists.mockResolvedValue(mockProductData);
      repository.findByProductId.mockResolvedValue(mockInventory);
      repository.upsert.mockResolvedValue({ ...mockInventory, quantity: 95 });

      const result = await service.updateStock('prod-123', 95);

      expect(result.quantity).toBe(95);
    });

    it('should propagate error when product does not exist', async () => {
      productClient.validateProductExists.mockRejectedValue(
        new NotFoundError('Product', 'prod-999'),
      );

      await expect(service.updateStock('prod-999', 10)).rejects.toThrow(NotFoundError);
      expect(repository.upsert).not.toHaveBeenCalled();
    });
  });
});
