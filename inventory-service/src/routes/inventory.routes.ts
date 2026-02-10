import { Router } from 'express';
import { z } from 'zod';
import { InventoryController } from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate.middleware';

const updateInventorySchema = z.object({
  data: z.object({
    type: z.literal('inventory'),
    attributes: z.object({
      quantity: z.number().int().min(0, 'Quantity must be non-negative'),
    }),
  }),
});

export function createInventoryRoutes(controller: InventoryController): Router {
  const router = Router();

  /**
   * @openapi
   * /inventory/{productId}:
   *   get:
   *     summary: Get inventory for a product
   *     tags: [Inventory]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Inventory found
   *       404:
   *         description: Product or inventory not found
   *       503:
   *         description: Products service unavailable
   */
  router.get('/:productId', controller.getByProductId);

  /**
   * @openapi
   * /inventory/{productId}:
   *   patch:
   *     summary: Update inventory (upsert)
   *     tags: [Inventory]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               data:
   *                 type: object
   *                 properties:
   *                   type:
   *                     type: string
   *                     example: inventory
   *                   attributes:
   *                     type: object
   *                     properties:
   *                       quantity:
   *                         type: integer
   *                         minimum: 0
   *     responses:
   *       200:
   *         description: Inventory updated
   *       404:
   *         description: Product not found
   *       503:
   *         description: Products service unavailable
   *       504:
   *         description: Products service timeout
   */
  router.patch('/:productId', validate(updateInventorySchema), controller.updateStock);

  return router;
}
