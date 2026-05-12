export const UNITS = ['unidad', 'kg', 'g', 'L', 'mL', 'caja', 'paquete', 'docena'] as const;
export type Unit = typeof UNITS[number];

export type CostEntry = {
  id:         string;
  name:       string;       // nombre del insumo / producto
  quantity:   number;       // cantidad comprada
  unit:       Unit;         // unidad de medida
  totalPrice: number;       // precio total pagado ($)
  unitPrice:  number;       // calculado: totalPrice / quantity
  date:       string;       // ISO date string YYYY-MM-DD
  notes:      string;       // notas opcionales
  createdAt?: string;
};
