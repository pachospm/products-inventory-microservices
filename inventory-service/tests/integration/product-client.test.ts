import { AxiosError } from 'axios';
import { ProductClientService } from '../../src/services/product-client.service';
import { NotFoundError, ServiceUnavailableError, GatewayTimeoutError } from '../../src/utils/errors';

describe('ProductClientService', () => {
  let service: ProductClientService;
  let mockHttpClient: { get: jest.Mock };

  beforeEach(() => {
    mockHttpClient = { get: jest.fn() };
    service = new ProductClientService(mockHttpClient as any);
  });

  describe('validateProductExists', () => {
    it('should return product data when product exists', async () => {
      const productData = {
        id: 'prod-123',
        attributes: { name: 'Test Product', sku: 'TEST-001' },
      };

      mockHttpClient.get.mockResolvedValue({
        data: { data: productData },
      });

      const result = await service.validateProductExists('prod-123');

      expect(result).toEqual(productData);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/products/prod-123');
    });

    it('should throw NotFoundError when product does not exist (404)', async () => {
      const error = new AxiosError('Not Found', '404', undefined, undefined, {
        status: 404,
        data: {},
        headers: {},
        statusText: 'Not Found',
        config: {} as any,
      });

      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.validateProductExists('prod-999')).rejects.toThrow(NotFoundError);
    });

    it('should throw GatewayTimeoutError on timeout', async () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.validateProductExists('prod-123')).rejects.toThrow(
        GatewayTimeoutError,
      );
    });

    it('should throw ServiceUnavailableError on connection refused', async () => {
      const error = new AxiosError('Connection refused', 'ECONNREFUSED');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.validateProductExists('prod-123')).rejects.toThrow(
        ServiceUnavailableError,
      );
    });

    it('should throw ServiceUnavailableError on unknown errors', async () => {
      const error = new AxiosError('Server error', '500', undefined, undefined, {
        status: 500,
        data: {},
        headers: {},
        statusText: 'Internal Server Error',
        config: {} as any,
      });

      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.validateProductExists('prod-123')).rejects.toThrow(
        ServiceUnavailableError,
      );
    });
  });
});
