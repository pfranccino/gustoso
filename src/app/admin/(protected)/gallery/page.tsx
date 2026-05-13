import { getGalleryItems, GalleryItem } from '@/lib/firestore/gallery';
import GalleryEditor from '@/components/GalleryEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function GalleryPage() {
  let items: GalleryItem[] = [];
  try { items = await getGalleryItems(); } catch {}

  return (
    <div>
      <AdminHeader
        title="Galería"
        subtitle={`${items.length} foto${items.length !== 1 ? 's' : ''} · aparecen en "Nuestros platos"`}
      />
      <GalleryEditor initial={items} />
    </div>
  );
}
