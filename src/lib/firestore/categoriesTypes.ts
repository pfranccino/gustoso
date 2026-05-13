/**
 * Tipos y defaults de categorías — sin imports de servidor.
 * Pueden importarse desde componentes cliente ('use client') con seguridad.
 */

export type Category = {
  id:        string;
  label:     string;
  emoji:     string;
  sortOrder: number;
  visible:   boolean;
  special?:  'burrito';
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id:'promos',    label:'Promos',      emoji:'🏷️',  sortOrder:0, visible:true },
  { id:'vienesas',  label:'Vienesas',    emoji:'🌭',  sortOrder:1, visible:true },
  { id:'as',        label:'AS',          emoji:'🥪',  sortOrder:2, visible:true },
  { id:'churrasco', label:'Churrasco',   emoji:'🥩',  sortOrder:3, visible:true },
  { id:'mechada',   label:'Mechada',     emoji:'🥖',  sortOrder:4, visible:true },
  { id:'burrito',   label:'Burrito',     emoji:'🌯',  sortOrder:5, visible:true, special:'burrito' },
  { id:'papas',     label:'Papas & Más', emoji:'🍟',  sortOrder:6, visible:true },
  { id:'bebidas',   label:'Bebidas',     emoji:'🥤',  sortOrder:7, visible:true },
];
