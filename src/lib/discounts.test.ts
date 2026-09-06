import { describe, it, expect } from 'vitest';
import { computeDiscountAmount, computeFinalTotal } from '@/lib/discounts';

describe('computeDiscountAmount', () => {
  it('descuento fijo devuelve el monto tal cual', () => {
    expect(computeDiscountAmount('fixed', 1500, 10000)).toBe(1500);
  });

  it('descuento porcentual se calcula sobre el total', () => {
    expect(computeDiscountAmount('percent', 10, 10000)).toBe(1000);
    expect(computeDiscountAmount('percent', 50, 8000)).toBe(4000);
  });

  it('porcentaje redondea al peso más cercano', () => {
    // 15% de 3333 = 499.95 → 500
    expect(computeDiscountAmount('percent', 15, 3333)).toBe(500);
    // 33% de 100 = 33
    expect(computeDiscountAmount('percent', 33, 100)).toBe(33);
    // 10% de 155 = 15.5 → 16
    expect(computeDiscountAmount('percent', 10, 155)).toBe(16);
  });

  it('100% descuenta el total completo', () => {
    expect(computeDiscountAmount('percent', 100, 12345)).toBe(12345);
  });

  it('0% o $0 no descuentan nada', () => {
    expect(computeDiscountAmount('percent', 0, 10000)).toBe(0);
    expect(computeDiscountAmount('fixed', 0, 10000)).toBe(0);
  });
});

describe('computeFinalTotal', () => {
  it('resta descuento y suma delivery', () => {
    expect(computeFinalTotal(10000, 1000, 2000)).toBe(11000);
  });

  it('nunca baja de 0 antes de sumar delivery', () => {
    // descuento fijo mayor al total: el subtotal se clampa a 0, pero el
    // delivery se cobra igual
    expect(computeFinalTotal(5000, 8000, 2000)).toBe(2000);
  });

  it('un descuento que supera el total no genera crédito negativo', () => {
    expect(computeFinalTotal(5000, 8000, 0)).toBe(0);
  });

  it('sin descuento ni delivery devuelve el total', () => {
    expect(computeFinalTotal(7000, 0, 0)).toBe(7000);
  });

  it('el delivery se suma después del clamp (descuento no come el envío)', () => {
    // total 3000, descuento 3000 → subtotal 0, + delivery 1500 = 1500
    expect(computeFinalTotal(3000, 3000, 1500)).toBe(1500);
  });
});
