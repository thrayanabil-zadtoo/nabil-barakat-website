// Utility for detecting reader device, OS, browser, and tracking reading progress

export interface DeviceInfo {
  os: string;
  osIcon: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenRes: string;
  fingerprint: string;
  lastVisit: string;
}

export interface ReadingBookmark {
  bookId: string;
  bookTitle: string;
  bookCover: string;
  pageIndex: number;
  pageNumber: number;
  pageTitle: string;
  totalPages: number;
  percent: number;
  updatedAt: string;
  deviceInfo: DeviceInfo;
}

export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  let os = 'جهاز كمبيوتر / نظام مجهول';
  let osIcon = '💻';

  if (ua.includes('Win')) {
    if (ua.includes('Windows NT 10.0')) os = 'ويندوز (Windows 10 / 11)';
    else if (ua.includes('Windows NT 6.3')) os = 'ويندوز (Windows 8.1)';
    else if (ua.includes('Windows NT 6.1')) os = 'ويندوز (Windows 7)';
    else os = 'ويندوز (Windows)';
    osIcon = '🪟';
  } else if (ua.includes('Mac OS') || ua.includes('Macintosh')) {
    os = 'ماك (macOS Apple)';
    osIcon = '🍎';
  } else if (ua.includes('Android')) {
    os = 'أندرويد (Android)';
    osIcon = '🤖';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'آيفون / آيباد (iOS Apple)';
    osIcon = '📱';
  } else if (ua.includes('Linux')) {
    os = 'لينكس (Linux)';
    osIcon = '🐧';
  }

  let browser = 'متصفح ويب';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Persistent unique visitor identifier
  let storedFp = localStorage.getItem('zadtoo_reader_device_fp');
  if (!storedFp) {
    storedFp = 'fp_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem('zadtoo_reader_device_fp', storedFp);
    } catch {
      // ignore
    }
  }

  return {
    os,
    osIcon,
    browser,
    deviceType,
    screenRes: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080',
    fingerprint: storedFp,
    lastVisit: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
  };
};

const BOOKMARK_STORAGE_KEY = 'zadtoo_reader_active_bookmark';

export const saveReadingProgress = (
  bookId: string,
  bookTitle: string,
  bookCover: string,
  pageIndex: number,
  pageNumber: number,
  pageTitle: string,
  totalPages: number
) => {
  try {
    const dev = getDeviceInfo();
    const percent = totalPages > 0 ? Math.round(((pageIndex + 1) / totalPages) * 100) : 0;
    const bookmark: ReadingBookmark = {
      bookId,
      bookTitle,
      bookCover,
      pageIndex,
      pageNumber,
      pageTitle,
      totalPages,
      percent,
      updatedAt: new Date().toISOString(),
      deviceInfo: dev,
    };
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmark));
    // Also dispatch custom event so other components immediately know
    window.dispatchEvent(new CustomEvent('zadtoo_reading_bookmark_updated', { detail: bookmark }));
  } catch (e) {
    console.error('Error saving reading progress:', e);
  }
};

export const getReadingProgress = (): ReadingBookmark | null => {
  try {
    const data = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as ReadingBookmark;
  } catch (e) {
    console.error('Error reading progress:', e);
    return null;
  }
};

export const clearReadingProgress = () => {
  try {
    localStorage.removeItem(BOOKMARK_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('zadtoo_reading_bookmark_updated', { detail: null }));
  } catch {
    // ignore
  }
};
