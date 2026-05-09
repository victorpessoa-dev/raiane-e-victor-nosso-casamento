import { NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/admin-session';

export async function GET() {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, error: 'Nao autorizado.' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email || '',
    },
  });
}
