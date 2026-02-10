import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { serializeInventory } from '../serializers/inventory.serializer';

export class InventoryController {
  constructor(private service: InventoryService) {}

  getByProductId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const inventory = await this.service.getByProductId(productId);
      res.json(serializeInventory(inventory));
    } catch (err) {
      next(err);
    }
  };

  updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId as string;
      const { quantity } = req.body.data.attributes;
      const inventory = await this.service.updateStock(productId, quantity);
      res.json(serializeInventory(inventory));
    } catch (err) {
      next(err);
    }
  };
}
