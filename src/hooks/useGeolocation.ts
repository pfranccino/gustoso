'use client';

import { useState } from 'react';

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

  const request = () => {
    if (!navigator.geolocation) {
      setState({ status: 'error' });
      return;
    }
    setState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
        setState({ status: 'success', locationUrl });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED)   setState({ status: 'denied' });
        else if (err.code === err.POSITION_UNAVAILABLE) setState({ status: 'unavailable' });
        else if (err.code === err.TIMEOUT)        setState({ status: 'timeout' });
        else                                      setState({ status: 'error' });
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 }
    );
  };

  const clear = () => setState({ status: 'idle' });

  return { state, request, clear };
}
