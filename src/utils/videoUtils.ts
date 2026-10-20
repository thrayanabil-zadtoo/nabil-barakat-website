/**
 * Video URL Parser and Embed Helper
 * Handles YouTube (standard, shorts, live, youtu.be, embed, mobile share, iframe tags),
 * Vimeo, TikTok, Google Drive videos, and direct video links (MP4, WebM, blob, firestore).
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

  let text = input.trim();

  // If user pasted an iframe embed code (e.g. <iframe src="https://www.youtube.com/embed/..."></iframe>)
  const iframeSrcMatch = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    text = iframeSrcMatch[1].trim();
  }

  // Extract pure URL from any accompanying text (e.g. mobile share text "Watch this: https://...")
  const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+)/i);
  let rawUrl = urlMatch ? urlMatch[1] : text;

  // Normalize protocol if missing (e.g. "www.youtube.com/..." or "youtu.be/...")
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('firestore://') && !rawUrl.startsWith('data:') && !rawUrl.startsWith('blob:')) {
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || rawUrl.includes('vimeo.com') || rawUrl.includes('tiktok.com')) {
      rawUrl = 'https://' + rawUrl;
    }
  }

  const cleanUrl = rawUrl.trim();

  // 1. Check for YouTube
  // Patterns supported:
  // - https://www.youtube.com/watch?v=VIDEO_ID (and with extra query params: ?si=...&v=ID)
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const isYouTubeHost = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(cleanUrl);

  if (isYouTubeHost) {
    let videoId: string | null = null;

    // Pattern A: youtu.be/VIDEO_ID
    const youtuBeMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (youtuBeMatch && youtuBeMatch[1]) {
      videoId = youtuBeMatch[1];
    }

    // Pattern B: /embed/VIDEO_ID or /v/VIDEO_ID
    if (!videoId) {
      const embedMatch = cleanUrl.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/i);
      if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
      }
    }

    // Pattern C: /shorts/VIDEO_ID
    if (!videoId) {
      const shortsMatch = cleanUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
      if (shortsMatch && shortsMatch[1]) {
        videoId = shortsMatch[1];
      }
    }

    // Pattern D: /live/VIDEO_ID
    if (!videoId) {
      const liveMatch = cleanUrl.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
      if (liveMatch && liveMatch[1]) {
        videoId = liveMatch[1];
      }
    }

    // Pattern E: watch?v=VIDEO_ID or watch?anything&v=VIDEO_ID
    if (!videoId) {
      const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
      if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1];
      }
    }

    if (videoId) {
      return {
        platform: 'youtube',
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
        directUrl: cleanUrl,
        isShortLink: cleanUrl.includes('youtu.be/'),
        cleanUrl,
      };
    }
  }

  // 2. Check for Vimeo (vimeo.com/12345678 or player.vimeo.com/video/12345678)
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

  // 3. Check for Google Drive Video
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

  // 4. Check for TikTok
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

  // 5. Check for Direct Video (mp4, webm, mov, data:, blob:, firestore:)
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
