import { getUsuarios } from '@/actions/admin';
import AdminPage from '@/components/AdminPage';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const session = await getSession();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const usuarios = await getUsuarios();
  return <AdminPage usuarios={usuarios} />;
}
