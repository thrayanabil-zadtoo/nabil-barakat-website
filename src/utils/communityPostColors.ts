export interface ColorPreset {
  id: string;
  label: string;
  class: string;
  preview: string;
  badgeBg: string;
}

export const COMMUNITY_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'red',
    label: 'أحمر ياقوتي ناصع (شاعري)',
    class: 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800 text-white',
    preview: 'bg-red-600 border border-red-700',
    badgeBg: 'bg-red-600 text-white',
  },
  {
    id: 'crimson',
    label: 'عنابي / قرمزي كلاسيكي',
    class: 'bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] text-white',
    preview: 'bg-[#991b1b] border border-[#7f1d1d]',
    badgeBg: 'bg-[#991b1b] text-white',
  },
  {
    id: 'ruby',
    label: 'ياقوتي داكن فخم',
    class: 'bg-gradient-to-br from-[#4c0519] via-[#881337] to-[#be123c] text-white',
    preview: 'bg-[#881337] border border-[#4c0519]',
    badgeBg: 'bg-[#881337] text-white',
  },
  {
    id: 'navy',
    label: 'أزرق ملكي كحلي',
    class: 'bg-gradient-to-br from-[#07243c] via-[#0b385e] to-[#0d4573] text-white',
    preview: 'bg-[#0b385e] border border-[#07243c]',
    badgeBg: 'bg-[#0b385e] text-white',
  },
  {
    id: 'amber',
    label: 'عنبر أدبي مذهب',
    class: 'bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#dfa85b] text-white',
    preview: 'bg-[#b45309] border border-[#78350f]',
    badgeBg: 'bg-[#b45309] text-white',
  },
  {
    id: 'emerald',
    label: 'زمردي عميق',
    class: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white',
    preview: 'bg-[#064e3b] border border-[#022c22]',
    badgeBg: 'bg-[#064e3b] text-white',
  },
  {
    id: 'purple',
    label: 'بنفسجي شاعري',
    class: 'bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#7c3aed] text-white',
    preview: 'bg-[#4c1d95] border border-[#2e1065]',
    badgeBg: 'bg-[#4c1d95] text-white',
  },
  {
    id: 'midnight',
    label: 'ليلي فاحم',
    class: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] text-white',
    preview: 'bg-[#0f172a] border border-black',
    badgeBg: 'bg-[#0f172a] text-white',
  },
  {
    id: 'none',
    label: 'بدون لون (أبيض نقي كلاسيكي)',
    class: 'bg-white text-slate-800',
    preview: 'bg-white border-2 border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
  },
];

/**
 * Resolves color id to preset object with smart fallbacks for any red variation
 */
export function getCommunityColorPreset(colorId?: string): ColorPreset {
  if (!colorId || colorId === 'none') {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'none')!;
  }

  const normalized = String(colorId).trim().toLowerCase();

  // Smart matching for red/ruby/crimson variants
  if (
    normalized === 'red' ||
    normalized === 'ahmar' ||
    normalized === 'أحمر' ||
    normalized.includes('red') ||
    normalized.includes('rose')
  ) {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'red')!;
  }

  if (
    normalized === 'crimson' ||
    normalized === 'عنابي' ||
    normalized === 'قرمزي' ||
    normalized.includes('crimson')
  ) {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'crimson')!;
  }

  if (normalized === 'ruby' || normalized === 'ياقوتي') {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'ruby')!;
  }

  const exactMatch = COMMUNITY_COLOR_PRESETS.find((c) => c.id === normalized);
  if (exactMatch) return exactMatch;

  // Fallback to red if it was a color card attempt, or white
  return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'red') || COMMUNITY_COLOR_PRESETS[0];
}

const ARABIC_MONTHS: Record<string, number> = {
  يناير: 0,
  فبراير: 1,
  مارس: 2,
  أبريل: 3,
  ابريل: 3,
  مايو: 4,
  يونيو: 5,
  يونية: 5,
  يوليو: 6,
  يولية: 6,
  أغسطس: 7,
  اغسطس: 7,
  سبتمبر: 8,
  أكتوبر: 9,
  اكتوبر: 9,
  نوفمبر: 10,
  ديسمبر: 11,
};

function toWesternDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Extracts a reliable creation timestamp (ms) from a community post
 * so the newest writings always appear first.
 */
export function getPostTimestamp(post: { id?: string; createdAt?: number; date?: string }): number {
  if (!post) return 0;

  if (typeof post.createdAt === 'number' && Number.isFinite(post.createdAt) && post.createdAt > 0) {
    return post.createdAt;
  }

  // 1. Check timestamp encoded in id (e.g. post-1793422970805)
  if (typeof post.id === 'string') {
    const match = post.id.match(/(\d{11,15})/);
    if (match) {
      const ts = Number(match[1]);
      if (Number.isFinite(ts) && ts > 0) return ts;
    }
  }

  // 2. Parse date string (ISO YYYY-MM-DD or Arabic date like "١١ نوفمبر ٢٠٢٦")
  if (typeof post.date === 'string' && post.date.trim()) {
    const normalizedDate = toWesternDigits(post.date.trim());
    const directParsed = Date.parse(normalizedDate);
    if (!Number.isNaN(directParsed)) {
      return directParsed;
    }

    for (const [monthName, monthIdx] of Object.entries(ARABIC_MONTHS)) {
      if (normalizedDate.includes(monthName)) {
        const nums = normalizedDate.match(/\d+/g);
        if (nums && nums.length >= 2) {
          const day = Number(nums[0]);
          const year = Number(nums[nums.length - 1]);
          if (year > 1900 && day >= 1 && day <= 31) {
            return new Date(year, monthIdx, day).getTime();
          }
        }
      }
    }
  }

  // 3. Small fallback for numeric short IDs (e.g. post-1, post-2)
  if (typeof post.id === 'string') {
    const shortMatch = post.id.match(/(\d+)/);
    if (shortMatch) {
      return Number(shortMatch[1]);
    }
  }

  return 0;
}

/**
 * Sorts community posts strictly newest-first (الأحدث في البداية).
 */
export function sortCommunityPostsNewestFirst<T extends { id?: string; createdAt?: number; date?: string }>(
  posts: T[]
): T[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => {
    const diff = getPostTimestamp(b) - getPostTimestamp(a);
    if (diff !== 0) return diff;
    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
}

