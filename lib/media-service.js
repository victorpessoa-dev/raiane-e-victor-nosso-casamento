import { randomUUID } from 'crypto';

import {
  normalizeAcceptedMimeType,
  SIGNED_URL_TTL_SECONDS,
  STORAGE_BUCKET,
} from '@/lib/constants';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

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

async function createSignedUrl(storagePath, download) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, download ? { download } : undefined);

  if (error || !data?.signedUrl) {
    throw new Error('Falha ao assinar midia.');
  }

  return data.signedUrl;
}

async function mapMediaRecord(record, includeDownloadUrl = false) {
  const signedUrl = await createSignedUrl(record.storage_path);
  const downloadUrl = includeDownloadUrl
    ? await createSignedUrl(record.storage_path, record.file_name)
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

export async function listVisibleCarouselMedia() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('media_uploads')
    .select('id, file_name, file_type, uploader_name, message, storage_path, created_at, is_visible')
    .eq('file_type', 'image')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error('Falha ao carregar midia publica.');
  }

  return Promise.all((data || []).map((item) => mapMediaRecord(item, false)));
}

export async function listAdminMedia() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('media_uploads')
    .select('id, file_name, file_type, file_size, uploader_name, message, storage_path, created_at, is_visible')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Falha ao carregar midia do admin.');
  }

  return Promise.all((data || []).map((item) => mapMediaRecord(item, true)));
}

export async function createMediaUpload({ file, name, message }) {
  const mimeType = normalizeAcceptedMimeType(file.type);
  if (!mimeType) {
    throw new Error(`Formato nao suportado: ${file.name}`);
  }

  const storagePath = createStoragePath(file.name);
  const supabase = getSupabaseAdminClient();

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
      is_visible: false,
    });

  if (insertError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao registrar ${file.name}.`);
  }
}

export async function updateMediaVisibility(id, isVisible) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('media_uploads')
    .update({ is_visible: isVisible })
    .eq('id', id);

  if (error) {
    throw new Error('Falha ao atualizar visibilidade.');
  }
}

export async function deleteMediaItems(ids) {
  const supabase = getSupabaseAdminClient();
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
