import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type DiscountType = 'fixed' | 'percent';

export type DiscountCode = {
  id: string;           // document ID = the code itself (uppercase)
  code: string;
  type: DiscountType;
  value: number;        // CLP amount or 1-100 percent
  description: string;  // nota interna
  maxUses: number;      // 0 = ilimitado
  usedCount: number;
  expiresAt: string | null;  // ISO string
  active: boolean;
  createdAt: string;
};

export type NewDiscountCode = {
  code: string;
  type: DiscountType;
  value: number;
  description: string;
  maxUses: number;
  expiresAt: string | null;
  active: boolean;
};

export type ValidateResult =
  | { valid: true;  type: DiscountType; value: number; display: string }
  | { valid: false; error: string };

const COL = 'discount_codes';

function docToCode(doc: FirebaseFirestore.DocumentSnapshot): DiscountCode {
  const d = doc.data()!;
  return {
    id:          doc.id,
    code:        doc.id,
    type:        d.type        ?? 'fixed',
    value:       d.value       ?? 0,
    description: d.description ?? '',
    maxUses:     d.maxUses     ?? 1,
    usedCount:   d.usedCount   ?? 0,
    expiresAt:   d.expiresAt instanceof Timestamp ? d.expiresAt.toDate().toISOString() : null,
    active:      d.active      ?? true,
    createdAt:   d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
  };
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const snap = await getAdminDb().collection(COL).orderBy('createdAt', 'desc').get();
  return snap.docs.map(docToCode);
}

export async function createDiscountCode(data: NewDiscountCode): Promise<void> {
  const code = data.code.trim().toUpperCase();
  await getAdminDb().collection(COL).doc(code).set({
    type:        data.type,
    value:       data.value,
    description: data.description,
    maxUses:     data.maxUses,
    usedCount:   0,
    expiresAt:   data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null,
    active:      data.active,
    createdAt:   FieldValue.serverTimestamp(),
  });
}

export async function updateDiscountCode(code: string, update: Partial<Pick<DiscountCode, 'active' | 'description' | 'maxUses' | 'expiresAt'>>): Promise<void> {
  const payload: Record<string, unknown> = { ...update };
  if ('expiresAt' in update) {
    payload.expiresAt = update.expiresAt ? Timestamp.fromDate(new Date(update.expiresAt)) : null;
  }
  await getAdminDb().collection(COL).doc(code.toUpperCase()).update(payload);
}

export async function deleteDiscountCode(code: string): Promise<void> {
  await getAdminDb().collection(COL).doc(code.toUpperCase()).delete();
}

/** Valida un código y retorna el descuento. Llamar desde API pública. */
export async function validateDiscountCode(code: string): Promise<ValidateResult> {
  const doc = await getAdminDb().collection(COL).doc(code.trim().toUpperCase()).get();
  if (!doc.exists) return { valid: false, error: 'Código no encontrado' };

  const d = doc.data()!;
  if (!d.active)                          return { valid: false, error: 'Código desactivado' };
  if (d.maxUses > 0 && d.usedCount >= d.maxUses) return { valid: false, error: 'Código ya no tiene usos disponibles' };
  if (d.expiresAt) {
    const exp = d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : new Date(d.expiresAt);
    if (exp < new Date())                 return { valid: false, error: 'Código expirado' };
  }

  const type: DiscountType = d.type ?? 'fixed';
  const value: number      = d.value ?? 0;
  const display = type === 'percent' ? `${value}% de descuento` : `$${value.toLocaleString('es-CL')} de descuento`;
  return { valid: true, type, value, display };
}

/** Incrementa usedCount atómicamente al confirmar un pedido. No lanza si el código ya no es válido. */
export async function redeemDiscountCode(code: string): Promise<void> {
  try {
    await getAdminDb().collection(COL).doc(code.trim().toUpperCase()).update({
      usedCount: FieldValue.increment(1),
    });
  } catch { /* si el doc fue eliminado mientras tanto, ignorar */ }
}
