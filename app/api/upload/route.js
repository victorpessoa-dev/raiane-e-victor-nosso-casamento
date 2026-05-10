import { NextResponse } from 'next/server';

import {
  getMaxFileSizeBytes,
  isVideoMimeType,
  MAX_IMAGE_UPLOADS_PER_BATCH,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_UPLOADS_PER_BATCH,
  normalizeAcceptedMimeType,
} from '@/lib/constants';
import { createMediaUpload } from '@/lib/media-service';
import { rateLimit } from '@/lib/rate-limit';

function getRequestIdentifier(request) {
  const headerCandidates = [
    'cf-connecting-ip',
    'x-nf-client-connection-ip',
    'x-real-ip',
    'x-client-ip',
    'fly-client-ip',
    'x-vercel-forwarded-for',
    'x-forwarded-for',
  ];

  for (const headerName of headerCandidates) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      const firstValue = headerValue.split(',')[0]?.trim();
      if (firstValue) {
        return firstValue;
      }
    }
  }

  return null;
}

function isFileLike(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  return typeof entry.arrayBuffer === 'function'
    && typeof entry.name === 'string'
    && typeof entry.size === 'number';
}

export async function POST(request) {
  const requestId = getRequestIdentifier(request);
  const uploadRate = requestId
    ? rateLimit({
      key: `upload:${requestId}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    })
    : { success: true, retryAfterSeconds: 0 };

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
    .filter(isFileLike);
  const fileDurations = formData.getAll('fileDurations');

  if (files.length === 0) {
    return NextResponse.json({ error: 'Selecione pelo menos um arquivo.' }, { status: 400 });
  }

  const imageFiles = files.filter((file) => {
    const mimeType = normalizeAcceptedMimeType(file.type, file.name);
    return mimeType && !isVideoMimeType(mimeType);
  });
  const videoFiles = files.filter((file) => {
    const mimeType = normalizeAcceptedMimeType(file.type, file.name);
    return mimeType && isVideoMimeType(mimeType);
  });

  if (imageFiles.length > MAX_IMAGE_UPLOADS_PER_BATCH) {
    return NextResponse.json(
      { error: `Envie no maximo ${MAX_IMAGE_UPLOADS_PER_BATCH} fotos por vez.` },
      { status: 400 },
    );
  }

  if (videoFiles.length > MAX_VIDEO_UPLOADS_PER_BATCH) {
    return NextResponse.json(
      { error: `Envie no maximo ${MAX_VIDEO_UPLOADS_PER_BATCH} videos por vez.` },
      { status: 400 },
    );
  }

  for (const [index, file] of files.entries()) {
    const mimeType = normalizeAcceptedMimeType(file.type, file.name);
    if (!mimeType) {
      return NextResponse.json(
        { error: `${file.name} possui um formato nao suportado.` },
        { status: 400 },
      );
    }

    const maxFileSize = getMaxFileSizeBytes(mimeType);
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `${file.name} excede o limite de ${Math.round(maxFileSize / (1024 * 1024))} MB.` },
        { status: 400 },
      );
    }

    if (isVideoMimeType(mimeType)) {
      const rawDuration = fileDurations[index];
      const durationSeconds = Number(rawDuration);

      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return NextResponse.json(
          { error: `Nao foi possivel validar a duracao de ${file.name}.` },
          { status: 400 },
        );
      }

      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        return NextResponse.json(
          { error: `${file.name} excede o limite de 2 minutos.` },
          { status: 400 },
        );
      }
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
