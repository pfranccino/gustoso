import { getReviews, Review } from '@/lib/firestore/reviews';
import ReviewsEditor from '@/components/ReviewsEditor';

export default async function ReviewsPage() {
  let reviews: Review[] = [];
  try { reviews = await getReviews(); } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', margin: 0 }}>
          Reseñas
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Los testimonios que aparecen en la sección "Lo que dicen nuestros clientes". Cópialos desde Google Maps.
        </p>
      </div>
      <ReviewsEditor initial={reviews} />
    </div>
  );
}
