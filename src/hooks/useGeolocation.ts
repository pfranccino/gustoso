import { useState, useCallback } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; locationUrl: string; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'timeout' }
  | { status: 'error' };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setState({ status: 'success', locationUrl, lat, lng });
      },
      (err) => {
        switch (err.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            setState({ status: 'denied' }); break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            setState({ status: 'unavailable' }); break;
          case GeolocationPositionError.TIMEOUT:
            setState({ status: 'timeout' }); break;
          default:
            setState({ status: 'error' });
        }
      },
      // enableHighAccuracy:true mejora la precisión en móvil
      // timeout amplio para redes lentas
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
    );
  }, []);

  const clear = useCallback(() => setState({ status: 'idle' }), []);

  return { state, request, clear };
}
