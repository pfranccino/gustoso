'use client';

import { useState, useCallback } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number; locationUrl: string }
  | { status: 'error' };            // cualquier fallo (denied, timeout, unavailable)

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'error' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setState({ status: 'success', lat, lng, locationUrl: `https://maps.google.com/?q=${lat},${lng}` });
      },
      () => setState({ status: 'error' }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }, []);

  const clear = useCallback(() => setState({ status: 'idle' }), []);

  return { state, request, clear };
}
