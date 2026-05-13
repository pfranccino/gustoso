'use client';

import { createContext, useContext } from 'react';
import { DeliveryConfig, DEFAULT_DELIVERY } from '@/lib/firestore/settingsTypes';

export type { DeliveryConfig };

export type PublicSettings = {
  waNumber:   string;
  address:    string;
  isOpen:     boolean;
  schedule:   string;
  waGreeting: string;
  waFooter:   string;
  delivery:   DeliveryConfig;
  avgMinutes: number;
  openTime:   string;  // hora apertura (HH:MM) cuando autoSchedule está activo, '' si no aplica
};

const DEFAULT: PublicSettings = {
  waNumber:   '56985219094',
  address:    'Marino José Manuel Ramírez #1641',
  isOpen:     true,
  schedule:   'Lunes a Domingo 12:00 – 22:00',
  waGreeting: "Hola Gustoso's! Quiero hacer un pedido 🛒",
  waFooter:   '',
  delivery:   { ...DEFAULT_DELIVERY },
  avgMinutes: 25,
  openTime:   '',
};

const SettingsContext = createContext<PublicSettings>(DEFAULT);

export function SettingsProvider({ value, children }: { value: PublicSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
