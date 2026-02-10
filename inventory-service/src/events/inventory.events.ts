import pino from 'pino';

const logger = pino({ name: 'inventory-service' });

export interface InventoryChangeEvent {
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  change: number;
}

export function emitInventoryUpdated(event: InventoryChangeEvent): void {
  logger.info(
    {
      event: 'inventory.updated',
      productId: event.productId,
      previousQuantity: event.previousQuantity,
      newQuantity: event.newQuantity,
      change: event.change,
    },
    'Inventory updated',
  );
}

export function emitInventoryCreated(productId: string, quantity: number): void {
  logger.info(
    {
      event: 'inventory.created',
      productId,
      quantity,
    },
    'Inventory record created',
  );
}
