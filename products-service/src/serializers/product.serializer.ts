import { Serializer } from 'jsonapi-serializer';
import { Product } from '@prisma/client';
import { PaginationMeta, PaginationLinks } from '../utils/pagination';

const productSerializer = new Serializer('products', {
  attributes: ['name', 'description', 'price', 'sku', 'createdAt', 'updatedAt'],
  keyForAttribute: 'camelCase',
  dataLinks: {
    self: (data: Product) => `/api/v1/products/${data.id}`,
  },
  transform: (record: Product) => ({
    ...record,
    price: Number(record.price),
  }),
});

export function serializeProduct(product: Product) {
  return productSerializer.serialize(product);
}

export function serializeProducts(
  products: Product[],
  meta: PaginationMeta,
  links: PaginationLinks,
) {
  const serialized = productSerializer.serialize(products);
  return { ...serialized, meta, links };
}
