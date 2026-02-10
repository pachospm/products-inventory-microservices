import { Inventory } from '@prisma/client';
import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductClientService } from './product-client.service';
import { NotFoundError } from '../utils/errors';
import { emitInventoryUpdated, emitInventoryCreated } from '../events/inventory.events';

export class InventoryService {
  constructor(
    private repository: InventoryRepository,
    private productClient: ProductClientService,
  ) {}

  async getByProductId(productId: string): Promise<Inventory> {
    await this.productClient.validateProductExists(productId);

    const inventory = await this.repository.findByProductId(productId);
    if (!inventory) {
      throw new NotFoundError('Inventory', productId);
    }
    return inventory;
  }

  async updateStock(productId: string, quantity: number): Promise<Inventory> {
    await this.productClient.validateProductExists(productId);

    const existing = await this.repository.findByProductId(productId);

    const result = await this.repository.upsert(productId, quantity);

    if (existing) {
      emitInventoryUpdated({
        productId,
        previousQuantity: existing.quantity,
        newQuantity: quantity,
        change: quantity - existing.quantity,
      });
    } else {
      emitInventoryCreated(productId, quantity);
    }

    return result;
  }
}
