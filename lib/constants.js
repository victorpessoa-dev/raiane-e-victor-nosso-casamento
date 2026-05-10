export const STORAGE_BUCKET = 'wedding-media';
export const SIGNED_URL_TTL_SECONDS = 60 * 30;
export const MAX_IMAGE_UPLOADS_PER_BATCH = 10;
export const MAX_VIDEO_UPLOADS_PER_BATCH = 3;
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 60 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 120;

export const ACCEPTED_MIME_TYPES = [
  'image/gif',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/mov',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
];

const MIME_TYPE_BY_EXTENSION = {
  '.avi': 'video/x-msvideo',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heics': 'image/heic-sequence',
  '.heif': 'image/heif',
  '.heifs': 'image/heif-sequence',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

const BROWSER_PREVIEWABLE_IMAGE_MIME_TYPES = [
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
];

function getFileExtension(fileName) {
  const normalizedName = String(fileName || '').trim().toLowerCase();
  const lastDot = normalizedName.lastIndexOf('.');
  return lastDot >= 0 ? normalizedName.slice(lastDot) : '';
}

export function normalizeAcceptedMimeType(mimeType, fileName = '') {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();
  if (ACCEPTED_MIME_TYPES.includes(normalizedMimeType)) {
    return normalizedMimeType;
  }

  const extension = getFileExtension(fileName);
  return MIME_TYPE_BY_EXTENSION[extension] || null;
}

export function isVideoMimeType(mimeType) {
  return String(mimeType || '').startsWith('video/');
}

export function getAcceptedUploadInputTypes() {
  return [...ACCEPTED_MIME_TYPES, ...Object.keys(MIME_TYPE_BY_EXTENSION)];
}

export function isBrowserPreviewableImageMimeType(mimeType) {
  return BROWSER_PREVIEWABLE_IMAGE_MIME_TYPES.includes(String(mimeType || '').toLowerCase());
}

export function getMaxFileSizeBytes(mimeType) {
  return isVideoMimeType(mimeType) ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
}
