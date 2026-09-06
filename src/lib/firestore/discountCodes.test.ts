import { describe, it, expect, vi, beforeEach } from 'vitest';

/* Estado mutable del doc que devuelve el mock de Firestore */
const state = vi.hoisted(() => ({ doc: null as { exists: boolean; data: () => unknown } | null }));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => state.doc,
      }),
    }),
  }),
}));

import { validateDiscountCode } from '@/lib/firestore/discountCodes';

function setDoc(exists: boolean, data?: Record<string, unknown>) {
  state.doc = { exists, data: () => data };
}

const DAY = 24 * 60 * 60 * 1000;

describe('validateDiscountCode', () => {
  beforeEach(() => { state.doc = null; });

  it('código inexistente → inválido', async () => {
    setDoc(false);
    const r = await validateDiscountCode('NOPE');
    expect(r).toEqual({ valid: false, error: 'Código no encontrado' });
  });

  it('código desactivado → inválido', async () => {
    setDoc(true, { active: false, type: 'fixed', value: 1000, maxUses: 0, usedCount: 0 });
    const r = await validateDiscountCode('GUST-OFF');
    expect(r).toEqual({ valid: false, error: 'Código desactivado' });
  });

  it('sin usos disponibles (usedCount >= maxUses) → inválido', async () => {
    setDoc(true, { active: true, type: 'fixed', value: 1000, maxUses: 3, usedCount: 3 });
    const r = await validateDiscountCode('GUST-USED');
    expect(r).toEqual({ valid: false, error: 'Código ya no tiene usos disponibles' });
  });

  it('maxUses = 0 significa usos ilimitados', async () => {
    setDoc(true, { active: true, type: 'percent', value: 20, maxUses: 0, usedCount: 999 });
    const r = await validateDiscountCode('GUST-INF');
    expect(r.valid).toBe(true);
  });

  it('código expirado → inválido', async () => {
    setDoc(true, {
      active: true, type: 'fixed', value: 1000, maxUses: 0, usedCount: 0,
      expiresAt: new Date(Date.now() - DAY).toISOString(),
    });
    const r = await validateDiscountCode('GUST-OLD');
    expect(r).toEqual({ valid: false, error: 'Código expirado' });
  });

  it('expiración futura → válido', async () => {
    setDoc(true, {
      active: true, type: 'fixed', value: 1000, maxUses: 0, usedCount: 0,
      expiresAt: new Date(Date.now() + DAY).toISOString(),
    });
    const r = await validateDiscountCode('GUST-FUTURE');
    expect(r.valid).toBe(true);
  });

  it('código fijo válido devuelve type y value', async () => {
    setDoc(true, { active: true, type: 'fixed', value: 1500, maxUses: 5, usedCount: 1 });
    const r = await validateDiscountCode('GUST-1500');
    expect(r).toMatchObject({ valid: true, type: 'fixed', value: 1500 });
  });

  it('código porcentual válido incluye el % en el display', async () => {
    setDoc(true, { active: true, type: 'percent', value: 10, maxUses: 0, usedCount: 0 });
    const r = await validateDiscountCode('GUST-10');
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.type).toBe('percent');
      expect(r.value).toBe(10);
      expect(r.display).toContain('10%');
    }
  });
});
