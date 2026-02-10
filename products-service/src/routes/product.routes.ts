import { Router } from 'express';
import { z } from 'zod';
import { ProductController } from '../controllers/product.controller';
import { validate } from '../middlewares/validate.middleware';

const createProductSchema = z.object({
  data: z.object({
    type: z.literal('products'),
    attributes: z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      price: z.number().positive('Price must be positive'),
      sku: z.string().min(1, 'SKU is required'),
    }),
  }),
});

const updateProductSchema = z.object({
  data: z.object({
    type: z.literal('products'),
    attributes: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive('Price must be positive').optional(),
      sku: z.string().min(1).optional(),
    }),
  }),
});

export function createProductRoutes(controller: ProductController): Router {
  const router = Router();

  /**
   * @openapi
   * /products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
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
   *                     example: products
   *                   attributes:
   *                     type: object
   *                     properties:
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       price:
   *                         type: number
   *                       sku:
   *                         type: string
   *     responses:
   *       201:
   *         description: Product created
   *       422:
   *         description: Validation error
   */
  router.post('/', validate(createProductSchema), controller.create);

  /**
   * @openapi
   * /products:
   *   get:
   *     summary: List all products with pagination
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page[number]
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: page[size]
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of products
   */
  router.get('/', controller.findAll);

  /**
   * @openapi
   * /products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Product found
   *       404:
   *         description: Product not found
   */
  router.get('/:id', controller.findById);

  /**
   * @openapi
   * /products/{id}:
   *   patch:
   *     summary: Update a product
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
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
   *                     example: products
   *                   attributes:
   *                     type: object
   *     responses:
   *       200:
   *         description: Product updated
   *       404:
   *         description: Product not found
   */
  router.patch('/:id', validate(updateProductSchema), controller.update);

  /**
   * @openapi
   * /products/{id}:
   *   delete:
   *     summary: Delete a product
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Product deleted
   *       404:
   *         description: Product not found
   */
  router.delete('/:id', controller.delete);

  return router;
}
