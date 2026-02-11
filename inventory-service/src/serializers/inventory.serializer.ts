import { Serializer } from 'jsonapi-serializer';
import { Inventory } from '@prisma/client';

const inventorySerializer = new Serializer('inventory', {
  pluralizeType: false,
  attributes: ['productId', 'quantity', 'createdAt', 'updatedAt'],
  keyForAttribute: 'camelCase',
  dataLinks: {
    self: (data: Inventory) => `/api/v1/inventory/${data.productId}`,
  },
});

export function serializeInventory(inventory: Inventory) {
  return inventorySerializer.serialize(inventory);
}
