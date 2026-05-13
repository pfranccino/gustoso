import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth } from '@/lib/firebase/admin';
import AdminSidebar from '@/components/AdminSidebar';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) redirect('/admin/login');

  let email = '';
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    email = decoded.email ?? '';
  } catch {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', alignItems:'stretch' }}>
      <AdminSidebar email={email}/>
      <main className="adm-main" style={{ flex:1, minWidth:0, overflowX:'hidden', padding:'28px 24px 48px' }}>
        <div style={{ maxWidth:860, width:'100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
