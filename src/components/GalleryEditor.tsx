'use client';

import { useState, useRef, useTransition } from 'react';
import { GalleryItem } from '@/lib/firestore/gallery';

export default function GalleryEditor({ initial }: { initial: GalleryItem[] }) {
  const [items,      setItems]      = useState<GalleryItem[]>(initial);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState('');
  const [newTitle,   setNewTitle]   = useState('');
  const [isPending,  startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── upload + create ── */

  async function handleAdd() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadErr('Selecciona una imagen primero.'); return; }

    setUploading(true); setUploadErr('');
    try {
      // 1. Upload to Cloudinary
      const form = new FormData();
      form.append('file', file);
      const upRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upRes.ok) throw new Error('upload');
      const { url } = await upRes.json();

      // 2. Save to Firestore
      const res = await fetch('/api/admin/gallery', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), imageUrl: url, sortOrder: items.length }),
      });
      if (!res.ok) throw new Error('save');
      const { id } = await res.json();

      setItems(prev => [...prev, { id, title: newTitle.trim(), imageUrl: url, sortOrder: prev.length }]);
      setNewTitle('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setUploadErr('Error al subir. Intenta de nuevo.');
    }
    setUploading(false);
  }

  /* ── edit title inline ── */

  function handleTitleBlur(item: GalleryItem, title: string) {
    if (title === item.title) return;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, title } : i));
    fetch(`/api/admin/gallery/${item.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }

  /* ── delete ── */

  function handleDelete(item: GalleryItem) {
    if (!confirm(`¿Eliminar "${item.title || 'esta foto'}"?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${item.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== item.id));
    });
  }

  /* ── replace photo ── */

  async function handleReplace(item: GalleryItem) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true); setUploadErr('');
      try {
        const form = new FormData();
        form.append('file', file);
        const upRes = await fetch('/api/upload', { method: 'POST', body: form });
        if (!upRes.ok) throw new Error();
        const { url } = await upRes.json();
        await fetch(`/api/admin/gallery/${item.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        });
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, imageUrl: url } : i));
      } catch {
        setUploadErr('Error al reemplazar la foto.');
      }
      setUploading(false);
    };
    input.click();
  }

  return (
    <div style={{ maxWidth: 640 }}>

      {/* Grid de fotos existentes */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {/* Imagen */}
              <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: 'var(--bg3)' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* Overlay actions */}
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 5 }}>
                  <button onClick={() => handleReplace(item)} disabled={uploading}
                    title="Reemplazar foto"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📷
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={isPending}
                    title="Eliminar"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              </div>
              {/* Título editable */}
              <div style={{ padding: '8px 10px' }}>
                <input
                  defaultValue={item.title}
                  onBlur={e => handleTitleBlur(item, e.target.value.trim())}
                  placeholder="Título (opcional)"
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'Barlow',sans-serif", boxSizing: 'border-box' as const }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
          <div style={{ fontSize: 14 }}>No hay fotos aún. Agrega la primera.</div>
        </div>
      )}

      {/* Agregar nueva foto */}
      <div style={{ background: 'var(--card)', border: '2px dashed rgba(242,100,25,0.3)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 14 }}>
          Agregar foto
        </div>

        {/* File picker */}
        <div style={{ marginBottom: 12 }}>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ fontSize: 13, color: 'var(--text)', width: '100%' }} />
        </div>

        {/* Título */}
        <div style={{ marginBottom: 14 }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Título — ej: Sándwich Churrasco (opcional)"
            style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: '1.5px solid rgba(242,100,25,0.25)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13, fontFamily: "'Barlow',sans-serif", outline: 'none', boxSizing: 'border-box' as const }} />
        </div>

        {uploadErr && (
          <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>{uploadErr}</div>
        )}

        <button onClick={handleAdd} disabled={uploading || isPending}
          style={{ width: '100%', padding: '11px', borderRadius: 999, border: 'none', background: uploading ? '#d1bfb8' : '#F26419', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'Subiendo…' : '+ Subir foto'}
        </button>
      </div>
    </div>
  );
}
