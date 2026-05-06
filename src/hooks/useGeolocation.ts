import { useState, useCallback, useEffect, useRef } from 'react';

export type GeoStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'denied'        // bloqueado a nivel de sitio en el browser
  | 'unavailable'   // GPS no disponible en el dispositivo
  | 'timeout'
  | 'error';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; locationUrl: string }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'timeout' }
  | { status: 'error' };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });
  const permRef = useRef<PermissionStatus | null>(null);

  // Escuchar cambios de permiso en tiempo real (el usuario va a config y lo habilita)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    let cancelled = false;
    navigator.permissions.query({ name: 'geolocation' }).then(perm => {
      if (cancelled) return;
      permRef.current = perm;

      perm.onchange = () => {
        if (cancelled) return;
        if (perm.state === 'granted') {
          // El usuario acaba de habilitar el permiso — lanzar geolocalización automáticamente
          doGetPosition();
        } else if (perm.state === 'denied') {
          setState({ status: 'denied' });
        } else {
          // 'prompt' — volver a idle para que el usuario pueda intentar de nuevo
          setState({ status: 'idle' });
        }
      };
    }).catch(() => { /* browser no soporta Permissions API */ });

    return () => {
      cancelled = true;
      if (permRef.current) permRef.current.onchange = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doGetPosition = useCallback(() => {
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
        setState({ status: 'success', locationUrl });
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
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
    );
  }, []);

  const request = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }

    // Consultar el estado real del permiso antes de llamar a getCurrentPosition
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          setState({ status: 'denied' });
          return;
        }
        // Si está en 'prompt' o 'granted', continuar normalmente
      } catch {
        // Permissions API no disponible — continuar de todas formas
      }
    }

    doGetPosition();
  }, [doGetPosition]);

  const clear = useCallback(() => setState({ status: 'idle' }), []);

  return { state, request, clear };
}
