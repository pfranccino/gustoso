export type CostEntry = {
  id:         string;
  name:       string;       // nombre del insumo / producto
  quantity:   number;       // cantidad comprada
  totalPrice: number;       // precio total pagado ($)
  unitPrice:  number;       // calculado: totalPrice / quantity
  date:       string;       // ISO date string YYYY-MM-DD
  notes:      string;       // notas opcionales
  createdAt?: string;
};
