import { getReviews, Review } from '@/lib/firestore/reviews';
import ReviewsEditor from '@/components/ReviewsEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function ReviewsPage() {
  let reviews: Review[] = [];
  try { reviews = await getReviews(); } catch {}

  const visible = reviews.filter(r => r.visible).length;

  return (
    <div>
      <AdminHeader
        title="Reseñas"
        subtitle={`${visible} visible${visible !== 1 ? 's' : ''} de ${reviews.length} · copiadas desde Google Maps`}
        isLive={visible > 0}
      />
      <ReviewsEditor initial={reviews} />
    </div>
  );
}
