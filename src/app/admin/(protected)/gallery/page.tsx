import { getGalleryItems, GalleryItem } from '@/lib/firestore/gallery';
import GalleryEditor from '@/components/GalleryEditor';

export default async function GalleryPage() {
  let items: GalleryItem[] = [];
  try { items = await getGalleryItems(); } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', margin: 0 }}>
          Galería
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Las fotos que aparecen en la sección "Nuestros platos" del menú público.
        </p>
      </div>
      <GalleryEditor initial={items} />
    </div>
  );
}
