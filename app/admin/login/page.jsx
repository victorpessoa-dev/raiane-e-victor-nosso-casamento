import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/login-form';
import { hasAdminSession, isAdminConfigured } from '@/lib/admin-session';

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect('/admin');
  }

  return <LoginForm configured={isAdminConfigured()} />;
}
