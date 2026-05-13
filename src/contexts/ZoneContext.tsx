'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ZoneResult = {
  zone: 'retiro' | 'delivery';
  distKm: number | null;
  deliveryFee: number | null;
  addrDisplay: string;
  activeCoords: { lat: number; lng: number } | null;
  locationUrl: string | undefined;
};

type ZoneContextType = {
  zoneResult: ZoneResult | null;
  setZoneResult: (r: ZoneResult) => void;
  clearZone: () => void;
};

const ZoneCtx = createContext<ZoneContextType>({
  zoneResult: null,
  setZoneResult: () => {},
  clearZone: () => {},
});

const STORAGE_KEY = 'gustoso_zone';

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [zoneResult, setZoneResultState] = useState<ZoneResult | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setZoneResultState(JSON.parse(stored));
    } catch {}
  }, []);

  function setZoneResult(r: ZoneResult) {
    setZoneResultState(r);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch {}
  }

  function clearZone() {
    setZoneResultState(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <ZoneCtx.Provider value={{ zoneResult, setZoneResult, clearZone }}>
      {children}
    </ZoneCtx.Provider>
  );
}

export function useZone() {
  return useContext(ZoneCtx);
}
