/**
 * Video URL Parser and Embed Helper
 * Handles TikTok (desktop, mobile short links vm.tiktok / vt.tiktok, query params),
 * YouTube, and direct video links.
 */

export interface ParsedVideoInfo {
  platform: 'tiktok' | 'youtube' | 'direct' | 'unknown';
  videoId: string | null;
  embedUrl: string | null;
  directUrl: string;
  isShortLink: boolean;
  cleanUrl: string;
}

export function parseVideoUrl(input: string): ParsedVideoInfo {
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

  // 2. Check for YouTube
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
      directUrl: cleanUrl,
      isShortLink: cleanUrl.includes('youtu.be/'),
      cleanUrl,
    };
  }

  // 3. Check for Direct Video (mp4, webm, mov, data:, blob:)
  if (cleanUrl.startsWith('data:video/') || cleanUrl.startsWith('blob:') || /\.(mp4|webm|ogg|mov)($|\?)/i.test(cleanUrl)) {
    return {
      platform: 'direct',
      videoId: null,
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
      isShortLink: false,
      cleanUrl,
    };
  }

  // 4. Check for TikTok
  const isTikTok = /tiktok\.com/i.test(cleanUrl);
  const isShortLink = /(?:vm|vt|t)\.tiktok\.com/i.test(cleanUrl);

  // Extract TikTok numeric video ID:
  // e.g. /video/7321098765432109876 or /photo/7321098765432109876 or /v/7321098765432109876 or any 15-22 digit sequence
  const tiktokIdMatch = cleanUrl.match(/\/(?:video|photo|v)\/(\d{15,22})/i) || cleanUrl.match(/(\d{17,21})/);
  const videoId = tiktokIdMatch ? tiktokIdMatch[1] : null;

  if (videoId) {
    return {
      platform: 'tiktok',
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      directUrl: cleanUrl,
      isShortLink: false,
      cleanUrl,
    };
  }

  return {
    platform: isTikTok ? 'tiktok' : 'unknown',
    videoId: null,
    embedUrl: null, // No numeric ID found, render interactive card with direct link
    directUrl: cleanUrl,
    isShortLink,
    cleanUrl,
  };
}
