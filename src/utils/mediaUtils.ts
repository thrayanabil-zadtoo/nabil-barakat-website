/**
 * Media detection utility helper
 * Detects whether a URL represents a playable video media item
 * (direct MP4/WebM/mov, firestore chunked video, base64 video, blob,
 * or streaming platforms like YouTube, Vimeo, TikTok, Google Drive).
 */
import { parseVideoUrl } from './videoUtils';

export const isVideoMedia = (url: string | undefined | null): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();

  // Fast string checks
  if (
    lower.startsWith('firestore://video/') ||
    lower.startsWith('data:video/') ||
    lower.startsWith('blob:') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('youtube-nocookie.com') ||
    lower.includes('vimeo.com') ||
    lower.includes('tiktok.com') ||
    lower.includes('drive.google.com/file') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('/videos/') ||
    lower.includes('mixkit.co/videos') ||
    lower.includes('.mp4?')
  ) {
    return true;
  }

  // Deep parse fallback
  const parsed = parseVideoUrl(url);
  return parsed.platform !== 'unknown';
};
