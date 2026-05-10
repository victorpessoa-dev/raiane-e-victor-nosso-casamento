import { NextResponse } from 'next/server';

import { getAdminAccessToken, hasAdminSession } from '@/lib/admin-session';
import { STORAGE_BUCKET } from '@/lib/constants';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server';

function createDownloadHeaderValue(fileName) {
  const normalizedName = String(fileName || 'arquivo').replace(/[\r\n"]/g, '').trim() || 'arquivo';
  const encodedName = encodeURIComponent(normalizedName);
  return `attachment; filename="${normalizedName}"; filename*=UTF-8''${encodedName}`;
}

export async function GET(request, { params }) {
  const isAdmin = await hasAdminSession();
  const accessToken = isAdmin ? getAdminAccessToken() : '';
  const supabase = createSupabaseServiceClient() || createSupabaseServerClient(accessToken);

  let query = supabase
    .from('media_uploads')
    .select('id, file_name, mime_type, storage_path, is_visible')
    .eq('id', params.id)
    .limit(1);

  if (!isAdmin) {
    query = query.eq('is_visible', true);
  }

  const { data: record, error: recordError } = await query.maybeSingle();

  if (recordError) {
    return NextResponse.json({ error: 'Falha ao localizar midia.' }, { status: 500 });
  }

  if (!record?.storage_path) {
    return NextResponse.json({ error: 'Midia nao encontrada.' }, { status: 404 });
  }

  const { data: file, error: fileError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(record.storage_path);

  if (fileError || !file) {
    return NextResponse.json({ error: 'Falha ao carregar arquivo.' }, { status: 404 });
  }

  const shouldDownload = request.nextUrl.searchParams.get('download') === '1';
  const arrayBuffer = await file.arrayBuffer();
  const headers = new Headers({
    'Cache-Control': shouldDownload ? 'private, no-store' : 'public, max-age=300, s-maxage=300',
    'Content-Type': record.mime_type || file.type || 'application/octet-stream',
  });

  if (shouldDownload) {
    headers.set('Content-Disposition', createDownloadHeaderValue(record.file_name));
  }

  return new Response(arrayBuffer, {
    status: 200,
    headers,
  });
}
