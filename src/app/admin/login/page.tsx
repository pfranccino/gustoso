'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { getClientAuth }              = await import('@/lib/firebase/client');

      const credential = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken    = await credential.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error('session-error');
      window.location.href = '/admin/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Email o contraseña incorrectos');
      } else if (msg.includes('too-many-requests')) {
        setError('Demasiados intentos. Espera unos minutos.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #FFF9F5 0%, #FFE5CC 100%)',
      padding: '24px',
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Fondo decorativo igual al Hero */}
      <div style={{ position:'fixed', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,100,25,0.10) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:36 }}>
          <Logo size={48}/>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(242,100,25,0.2)',
          borderRadius: 14,
          padding: '36px 28px 40px',
          boxShadow: '0 8px 40px rgba(242,100,25,0.10)',
        }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: 32,
            color: '#1A0800',
            marginBottom: 4,
            lineHeight: 1,
          }}>
            Panel Admin
          </h1>
          <p style={{ fontSize: 14, color: '#A0541A', marginBottom: 32, fontWeight: 500 }}>
            Gustoso&apos;s — acceso exclusivo
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: '#A0541A',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 7,
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1.5px solid rgba(242,100,25,0.25)',
                  background: '#FFF9F5',
                  color: '#1A0800',
                  fontSize: 15,
                  fontFamily: "'Barlow', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: '#A0541A',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 7,
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1.5px solid rgba(242,100,25,0.25)',
                  background: '#FFF9F5',
                  color: '#1A0800',
                  fontSize: 15,
                  fontFamily: "'Barlow', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#dc2626',
                fontWeight: 600,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                borderRadius: 999,
                border: 'none',
                background: loading ? '#d1bfb8' : '#F26419',
                color: '#ffffff',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 20,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5,
                transition: 'background .2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(242,100,25,0.35)',
              }}
            >
              {loading ? 'Ingresando…' : 'Ingresar →'}
            </button>
          </form>
        </div>

        {/* Volver al menú */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#A0541A', textDecoration: 'none', fontWeight: 600 }}>
            ← Volver al menú
          </a>
        </div>
      </div>
    </div>
  );
}
