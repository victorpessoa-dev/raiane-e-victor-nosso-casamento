import { randomUUID } from 'crypto';

import {
  normalizeAcceptedMimeType,
  SIGNED_URL_TTL_SECONDS,
  STORAGE_BUCKET,
} from '@/lib/constants';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function mapFileType(mimeType) {
  return mimeType.startsWith('video/') ? 'video' : 'image';
}

function createStoragePath(fileName) {
  const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'bin';
  return `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
}

function sanitizeText(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

async function createSignedUrl(supabase, storagePath, download) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, download ? { download } : undefined);

  if (error || !data?.signedUrl) {
    throw new Error('Falha ao assinar midia.');
  }

  return data.signedUrl;
}

async function mapMediaRecord(supabase, record, includeDownloadUrl = false) {
  const signedUrl = await createSignedUrl(supabase, record.storage_path);
  const downloadUrl = includeDownloadUrl
    ? await createSignedUrl(supabase, record.storage_path, record.file_name)
    : null;

  return {
    id: record.id,
    fileName: record.file_name,
    fileType: record.file_type,
    fileSize: record.file_size,
    uploaderName: record.uploader_name || '',
    message: record.message || '',
    isVisible: Boolean(record.is_visible),
    createdAt: record.created_at,
    signedUrl,
    downloadUrl,
  };
}

async function mapMediaRecordSafely(supabase, record, includeDownloadUrl = false) {
  try {
    return await mapMediaRecord(supabase, record, includeDownloadUrl);
  } catch {
    return null;
  }
}

export async function listVisibleCarouselMedia() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('media_uploads')
    .select('id, file_name, file_type, uploader_name, message, storage_path, created_at, is_visible')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Falha ao carregar midia publica.');
  }

  const items = await Promise.all((data || []).map((item) => mapMediaRecordSafely(supabase, item, false)));
  return items.filter(Boolean);
}

export async function listAdminMedia(accessToken) {
  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase
    .from('media_uploads')
    .select('id, file_name, file_type, file_size, uploader_name, message, storage_path, created_at, is_visible')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Falha ao carregar midia do admin.');
  }

  const items = await Promise.all((data || []).map((item) => mapMediaRecordSafely(supabase, item, true)));
  return items.filter(Boolean);
}

export async function createMediaUpload({ file, name, message }) {
  const mimeType = normalizeAcceptedMimeType(file.type, file.name);
  if (!mimeType) {
    throw new Error(`Formato nao suportado: ${file.name}`);
  }

  const storagePath = createStoragePath(file.name);
  const supabase = createSupabaseServerClient();

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha ao enviar ${file.name}.`);
  }

  const { error: insertError } = await supabase
    .from('media_uploads')
    .insert({
      file_name: sanitizeText(file.name, 255),
      storage_path: storagePath,
      file_type: mapFileType(mimeType),
      mime_type: mimeType,
      file_size: file.size,
      uploader_name: sanitizeText(name, 120),
      message: sanitizeText(message, 1000),
      is_visible: true,
    });

  if (insertError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(
      insertError.message
        ? `Falha ao registrar ${file.name}: ${insertError.message}`
        : `Falha ao registrar ${file.name}.`,
    );
  }
}

export async function updateMediaVisibility(accessToken, id, isVisible) {
  const supabase = createSupabaseServerClient(accessToken);
  const { error } = await supabase
    .from('media_uploads')
    .update({ is_visible: isVisible })
    .eq('id', id);

  if (error) {
    throw new Error('Falha ao atualizar visibilidade.');
  }
}

export async function deleteMediaItems(accessToken, ids) {
  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase
    .from('media_uploads')
    .select('id, storage_path')
    .in('id', ids);

  if (error) {
    throw new Error('Falha ao localizar midia para exclusao.');
  }

  const paths = (data || []).map((item) => item.storage_path).filter(Boolean);

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    if (storageError) {
      throw new Error('Falha ao remover arquivos do storage.');
    }
  }

  const { error: deleteError } = await supabase
    .from('media_uploads')
    .delete()
    .in('id', ids);

  if (deleteError) {
    throw new Error('Falha ao excluir registros.');
  }
}
