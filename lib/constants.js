export const STORAGE_BUCKET = 'wedding-media';
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 60 * 30;

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
];

export function normalizeAcceptedMimeType(mimeType) {
  return ACCEPTED_MIME_TYPES.includes(mimeType) ? mimeType : null;
}
