import { NextResponse } from 'next/server';

import { getAdminAccessToken, requireAdminRequest } from '@/lib/admin-session';
import { updateMediaVisibility } from '@/lib/media-service';

export async function PATCH(request, { params }) {
  if (!(await requireAdminRequest())) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const isVisible = body?.isVisible;

  if (typeof isVisible !== 'boolean') {
    return NextResponse.json({ error: 'Parametro invalido.' }, { status: 400 });
  }

  try {
    await updateMediaVisibility(getAdminAccessToken(), params.id, isVisible);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar visibilidade.' },
      { status: 500 },
    );
  }
}
