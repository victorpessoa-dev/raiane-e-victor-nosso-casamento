import { NextResponse } from 'next/server';

import { getAdminAccessToken, requireAdminRequest } from '@/lib/admin-session';
import { deleteMediaItems, listAdminMedia } from '@/lib/media-service';

export async function GET() {
  if (!(await requireAdminRequest())) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  try {
    const items = await listAdminMedia(getAdminAccessToken());
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar arquivos.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  if (!(await requireAdminRequest())) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Nenhum item informado.' }, { status: 400 });
  }

  try {
    await deleteMediaItems(getAdminAccessToken(), ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir arquivos.' },
      { status: 500 },
    );
  }
}
