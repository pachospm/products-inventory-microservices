import { AxiosInstance, AxiosError } from 'axios';
import { NotFoundError, ServiceUnavailableError, GatewayTimeoutError } from '../utils/errors';

export interface ProductData {
  id: string;
  attributes: {
    name: string;
    sku: string;
  };
}

export class ProductClientService {
  constructor(private httpClient: AxiosInstance) {}

  async validateProductExists(productId: string): Promise<ProductData> {
    try {
      const response = await this.httpClient.get(`/api/v1/products/${productId}`);
      return response.data.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 404) {
          throw new NotFoundError('Product', productId);
        }
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          throw new GatewayTimeoutError('Products service');
        }
        if (err.code === 'ECONNREFUSED' || !err.response) {
          throw new ServiceUnavailableError('Products service');
        }
      }
      throw new ServiceUnavailableError('Products service');
    }
  }
}
