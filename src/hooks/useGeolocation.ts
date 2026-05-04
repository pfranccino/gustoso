'use client';

import { useState } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; locationUrl: string }
  | { status: 'denied' }
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
        setState(err.code === err.PERMISSION_DENIED ? { status: 'denied' } : { status: 'error' });
      },
      { timeout: 10000 }
    );
  };

  const clear = () => setState({ status: 'idle' });

  return { state, request, clear };
}
