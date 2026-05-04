import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function verifySession(): Promise<string> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) throw new Error('No session cookie');

  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded.uid;
}
