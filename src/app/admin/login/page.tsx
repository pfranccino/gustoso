'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:32 }}>
          <Logo size={40}/>
        </div>

        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'32px 28px' }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'var(--text)', marginBottom:6 }}>
            Panel Admin
          </h1>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:28 }}>
            Ingresa con tu cuenta de Gustoso&apos;s
          </p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:15, fontFamily:'Barlow,sans-serif', outline:'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:15, fontFamily:'Barlow,sans-serif', outline:'none' }}
              />
            </div>

            {error && (
              <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:13, color:'#dc2626', fontWeight:600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding:'13px', borderRadius:999, border:'none', background: loading ? 'var(--border)' : 'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor: loading ? 'not-allowed' : 'pointer', marginTop:4, transition:'background .2s' }}
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
