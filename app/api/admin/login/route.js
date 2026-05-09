import { NextResponse } from 'next/server';

import {
  ADMIN_ACCESS_COOKIE_NAME,
  authenticateAdminUser,
  getAdminCookieOptions,
  isAdminConfigured,
} from '@/lib/admin-session';

export async function POST(request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Admin nao configurado no servidor.' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Informe email e senha.' },
      { status: 400 },
    );
  }

  try {
    const { accessToken } = await authenticateAdminUser(email, password);
    const response = NextResponse.json({ ok: true });

    response.cookies.set(
      ADMIN_ACCESS_COOKIE_NAME,
      accessToken,
      getAdminCookieOptions(accessToken),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao autenticar.' },
      { status: 401 },
    );
  }
}
