import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { serializeProduct, serializeProducts } from '../serializers/product.serializer';
import {
  parsePagination,
  buildPaginationMeta,
  buildPaginationLinks,
  PaginationMeta,
  PaginationLinks,
} from '../utils/pagination';

export class ProductController {
  constructor(private service: ProductService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, price, sku } = req.body.data.attributes;
      const product = await this.service.create({ name, description, price, sku });
      res.status(201).json(serializeProduct(product));
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const product = await this.service.findById(id);
      res.json(serializeProduct(product));
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = parsePagination(req.query);
      const { data, total } = await this.service.findAll(params);
      const meta = buildPaginationMeta(total, params);
      const links = buildPaginationLinks('/api/v1/products', meta);
      res.json(serializeProducts(data, meta as PaginationMeta, links as PaginationLinks));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const attrs = req.body.data.attributes;
      const product = await this.service.update(id, attrs);
      res.json(serializeProduct(product));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.service.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
