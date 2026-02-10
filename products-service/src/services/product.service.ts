import { Product, Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { PaginationParams } from '../utils/pagination';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  sku: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
}

export class ProductService {
  constructor(private repository: ProductRepository) {}

  async create(input: CreateProductInput): Promise<Product> {
    try {
      return await this.repository.create({
        name: input.name,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        sku: input.sku,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
      }
      throw err;
    }
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError('Product', id);
    }
    return product;
  }

  async findAll(params: PaginationParams): Promise<{ data: Product[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, params.pageSize),
      this.repository.count(),
    ]);
    return { data, total };
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    await this.findById(id);

    try {
      const data: Prisma.ProductUpdateInput = { ...input };
      if (input.price !== undefined) {
        data.price = new Prisma.Decimal(input.price);
      }
      return await this.repository.update(id, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`Product with SKU '${input.sku}' already exists`);
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
