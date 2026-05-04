import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase/admin';
import AdminNav from '@/components/AdminNav';

async function verifyAdminSession() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return false;
    await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const valid = await verifyAdminSession();
  if (!valid) redirect('/admin/login');

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <AdminNav/>
      <main style={{ flex:1, maxWidth:800, width:'100%', margin:'0 auto', padding:'24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
