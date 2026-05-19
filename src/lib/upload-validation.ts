export const UPLOAD_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 30 * 1024 * 1024,
} as const;

export type MediaCategory = keyof typeof UPLOAD_SIZE_LIMITS;

export function getMediaCategory(mimeType: string): MediaCategory | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return null;
}

export function getMaxUploadSize(category: MediaCategory) {
  return UPLOAD_SIZE_LIMITS[category];
}

export function formatMaxUploadSize(category: MediaCategory) {
  const mb = UPLOAD_SIZE_LIMITS[category] / (1024 * 1024);
  return `${mb} МБ`;
}

export const ALLOWED_UPLOAD_ACCEPT = "image/*,video/*,audio/*";
