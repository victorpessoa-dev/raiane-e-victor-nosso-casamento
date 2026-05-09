import { NextResponse } from 'next/server';

import { MAX_FILE_SIZE_BYTES, normalizeAcceptedMimeType } from '@/lib/constants';
import { createMediaUpload } from '@/lib/media-service';
import { rateLimit } from '@/lib/rate-limit';

function getRequestIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request) {
  const requestId = getRequestIdentifier(request);
  const uploadRate = rateLimit({
    key: `upload:${requestId}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!uploadRate.success) {
    return NextResponse.json(
      { error: 'Muitos envios em pouco tempo. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(uploadRate.retryAfterSeconds),
        },
      },
    );
  }

  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const files = formData
    .getAll('files')
    .filter((entry) => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'Selecione pelo menos um arquivo.' }, { status: 400 });
  }

  if (files.length > 20) {
    return NextResponse.json({ error: 'Envie no maximo 20 arquivos por vez.' }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} excede o limite de 100 MB.` },
        { status: 400 },
      );
    }

    if (!normalizeAcceptedMimeType(file.type)) {
      return NextResponse.json(
        { error: `${file.name} possui um formato nao suportado.` },
        { status: 400 },
      );
    }
  }

  try {
    await Promise.all(files.map((file) => createMediaUpload({ file, name, message })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao enviar arquivos.' },
      { status: 500 },
    );
  }
}
