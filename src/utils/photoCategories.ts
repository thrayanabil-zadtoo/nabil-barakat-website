import { PhotoItem } from '../types';

export const PHOTO_CATEGORIES = [
  'في صومعة الكاتب',
  'حفلات توقيع',
  'ندوات وملتقيات',
  'المؤلفات والكتب',
  'مستودع الوسائط الحرة (لحين الحاجة)',
  'مقاطع مرئية',
] as const;

export const DEFAULT_PHOTO_CATEGORY = 'في صومعة الكاتب';

const CATEGORY_ALIASES: Record<string, string> = {
  'صومعة الكاتب': 'في صومعة الكاتب',
  'في صومعة الكاتب': 'في صومعة الكاتب',
  'في صومعة الكتابة': 'في صومعة الكاتب',
  'صومعة الكتابة': 'في صومعة الكاتب',
  'صومعه الكاتب': 'في صومعة الكاتب',
  'في صومعه الكاتب': 'في صومعة الكاتب',
  'ندوات ومؤتمرات': 'ندوات وملتقيات',
  'ندوات وملتقيات': 'ندوات وملتقيات',
  'حفلات التوقيع': 'حفلات توقيع',
  'حفلات توقيع': 'حفلات توقيع',
  'المؤلفات والكتب': 'المؤلفات والكتب',
  'مستودع الوسائط الحرة (لحين الحاجة)': 'مستودع الوسائط الحرة (لحين الحاجة)',
  'مقاطع مرئية': 'مقاطع مرئية',
};

/**
 * Unifies synonymous or mistyped photo category names into a single canonical label
 * so duplicate filter tabs (e.g. "في صومعة الكاتب" vs "صومعة الكاتب") never appear.
 */
export function normalizePhotoCategory(category?: string | null): string {
  const cleaned = (category || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return DEFAULT_PHOTO_CATEGORY;

  if (CATEGORY_ALIASES[cleaned]) {
    return CATEGORY_ALIASES[cleaned];
  }

  if (cleaned.includes('صومع') && cleaned.includes('كاتب')) {
    return 'في صومعة الكاتب';
  }

  return cleaned;
}

/**
 * Normalizes photo categories and deduplicates items by ID cleanly.
 */
export function normalizePhotosList(list: PhotoItem[]): PhotoItem[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: PhotoItem[] = [];

  for (const item of list) {
    if (!item || !item.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({
      ...item,
      category: normalizePhotoCategory(item.category),
    });
  }

  return result;
}
