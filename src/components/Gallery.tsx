import { GalleryItem } from '@/lib/firestore/gallery';

export default function Gallery({ items = [] }: { items?: GalleryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: '60px 0', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--orange)', textTransform: 'uppercase' }}>Galería</span>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginTop: 6 }}>Nuestros platos</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ aspectRatio: '4/3', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative', background: 'var(--bg3)' }}>
              <img
                src={item.imageUrl}
                alt={item.title || 'Plato Gustoso'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {item.title && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 12px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: .3 }}>
                    {item.title}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
