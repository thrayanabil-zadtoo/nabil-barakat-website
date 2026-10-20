/**
 * Video URL Parser and Embed Helper
 * Handles YouTube (standard, shorts, youtu.be, embed), Vimeo, TikTok,
 * Google Drive videos, and direct video links (MP4, WebM, blob, firestore).
 */

export interface ParsedVideoInfo {
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'drive' | 'direct' | 'unknown';
  videoId: string | null;
  embedUrl: string | null;
  directUrl: string;
  isShortLink: boolean;
  cleanUrl: string;
}

export function parseVideoUrl(input: string | undefined | null): ParsedVideoInfo {
  if (!input) {
    return {
      platform: 'unknown',
      videoId: null,
      embedUrl: null,
      directUrl: '',
      isShortLink: false,
      cleanUrl: '',
    };
  }

  // 1. Extract pure URL from any accompanying text (e.g. mobile share text)
  const urlMatch = input.match(/(https?:\/\/[^\s"'<>]+)/i);
  const rawUrl = urlMatch ? urlMatch[1] : input.trim();
  const cleanUrl = rawUrl.trim();

  // 2. Check for YouTube (watch?v=, youtu.be/, /embed/, /shorts/)
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      directUrl: cleanUrl,
      isShortLink: cleanUrl.includes('youtu.be/'),
      cleanUrl,
    };
  }

  // 3. Check for Vimeo (vimeo.com/12345678 or player.vimeo.com/video/12345678)
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      platform: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
      directUrl: cleanUrl,
      isShortLink: false,
      cleanUrl,
    };
  }

  // 4. Check for Google Drive Video
  const driveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const videoId = driveMatch[1];
    return {
      platform: 'drive',
      videoId,
      embedUrl: `https://drive.google.com/file/d/${videoId}/preview`,
      directUrl: cleanUrl,
      isShortLink: false,
      cleanUrl,
    };
  }

  // 5. Check for TikTok
  const isTikTok = /tiktok\.com/i.test(cleanUrl);
  const tiktokIdMatch = cleanUrl.match(/\/(?:video|photo|v)\/(\d{15,22})/i) || cleanUrl.match(/(\d{17,21})/);
  if (isTikTok && tiktokIdMatch && tiktokIdMatch[1]) {
    const videoId = tiktokIdMatch[1];
    return {
      platform: 'tiktok',
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      directUrl: cleanUrl,
      isShortLink: /(?:vm|vt|t)\.tiktok\.com/i.test(cleanUrl),
      cleanUrl,
    };
  }

  // 6. Check for Direct Video (mp4, webm, mov, data:, blob:, firestore:)
  if (
    cleanUrl.startsWith('firestore://video/') ||
    cleanUrl.startsWith('data:video/') ||
    cleanUrl.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov)($|\?)/i.test(cleanUrl) ||
    cleanUrl.includes('/uploads/videos/')
  ) {
    return {
      platform: 'direct',
      videoId: null,
      embedUrl: null, // HTML5 video player handles it directly
      directUrl: cleanUrl,
      isShortLink: false,
      cleanUrl,
    };
  }

  return {
    platform: isTikTok ? 'tiktok' : 'unknown',
    videoId: null,
    embedUrl: null,
    directUrl: cleanUrl,
    isShortLink: false,
    cleanUrl,
  };
}
