import { useState, useCallback, useEffect, useRef } from 'react';

export type GeoStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error';

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
  const permRef = useRef<PermissionStatus | null>(null);

  // Escuchar cambios de permiso en tiempo real
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions.query({ name: 'geolocation' }).then(perm => {
      if (cancelled) return;
      permRef.current = perm;
      perm.onchange = () => {
        if (cancelled) return;
        if (perm.state === 'granted') doGetPosition();
        else if (perm.state === 'denied') setState({ status: 'denied' });
        else setState({ status: 'idle' });
      };
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (permRef.current) permRef.current.onchange = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doGetPosition = useCallback(() => {
    setState({ status: 'loading' });

    const onSuccess = ({ coords }: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = coords;
      setState({
        status: 'success',
        locationUrl: `https://maps.google.com/?q=${lat},${lng}`,
        lat,
        lng,
      });
    };

    const onError = (err: GeolocationPositionError) => {
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
    };

    // Intento 1: red/WiFi (rápido, ~1-2s)
    navigator.geolocation.getCurrentPosition(onSuccess, (err) => {
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        setState({ status: 'denied' });
        return;
      }
      // Intento 2: GPS (más lento pero más preciso)
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
    }, { enableHighAccuracy: false, timeout: 7000, maximumAge: 120000 });
  }, []);

  const request = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') { setState({ status: 'denied' }); return; }
      } catch {}
    }
    doGetPosition();
  }, [doGetPosition]);

  const clear = useCallback(() => setState({ status: 'idle' }), []);

  return { state, request, clear };
}
