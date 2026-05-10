export const STORAGE_BUCKET = 'wedding-media';
export const SIGNED_URL_TTL_SECONDS = 60 * 30;
export const MAX_IMAGE_UPLOADS_PER_BATCH = 10;
export const MAX_VIDEO_UPLOADS_PER_BATCH = 3;
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 60 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 120;

export const ACCEPTED_MIME_TYPES = [
  'image/gif',
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

export function normalizeAcceptedMimeType(mimeType) {
  return ACCEPTED_MIME_TYPES.includes(mimeType) ? mimeType : null;
}

export function isVideoMimeType(mimeType) {
  return String(mimeType || '').startsWith('video/');
}

export function getMaxFileSizeBytes(mimeType) {
  return isVideoMimeType(mimeType) ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
}
