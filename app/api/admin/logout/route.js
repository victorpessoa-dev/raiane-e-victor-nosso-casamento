import { NextResponse } from 'next/server';

import { ADMIN_ACCESS_COOKIE_NAME, getExpiredAdminCookieOptions } from '@/lib/admin-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_ACCESS_COOKIE_NAME, '', getExpiredAdminCookieOptions());
  return response;
}
