import type { DiscountType } from '@/lib/firestore/discountCodes';

/**
 * Monto de descuento en CLP a partir de un código validado.
 * - `percent`: `value` es 1–100 → se aplica sobre `total` y se redondea.
 * - `fixed`:   `value` es un monto fijo en CLP.
 *
 * Devuelve el monto bruto; el clamp contra el total lo hace `computeFinalTotal`.
 */
export function computeDiscountAmount(type: DiscountType, value: number, total: number): number {
  if (type === 'percent') return Math.round(total * value / 100);
  return value;
}

/**
 * Total final del pedido: subtotal menos descuento (sin bajar de 0) más delivery.
 * El delivery se suma después del clamp para que un descuento grande nunca
 * "coma" el costo de envío.
 */
export function computeFinalTotal(total: number, discountAmount: number, deliveryFee: number): number {
  return Math.max(0, total - discountAmount) + deliveryFee;
}
