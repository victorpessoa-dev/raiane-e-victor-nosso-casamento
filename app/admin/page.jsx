import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { hasAdminSession } from '@/lib/admin-session';

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect('/admin/login');
  }

  return <AdminDashboard />;
}
