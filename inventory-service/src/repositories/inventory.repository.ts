import { PrismaClient, Inventory } from '@prisma/client';

export class InventoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.prisma.inventory.findUnique({ where: { productId } });
  }

  async upsert(productId: string, quantity: number): Promise<Inventory> {
    return this.prisma.inventory.upsert({
      where: { productId },
      create: { productId, quantity },
      update: { quantity },
    });
  }
}
