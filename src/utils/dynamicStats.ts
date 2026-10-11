/**
 * Dynamic Statistics Utility
 * Provides deterministic and progressive view/like counts (>1000)
 * with a daily increment of 50 to 200 per day since baseline,
 * plus interactive local liking and live online visitor simulation (>100).
 */

const BASELINE_TIMESTAMP = new Date('2026-01-01T00:00:00Z').getTime();

// Calculate integer days elapsed since baseline
export function getDaysSinceBaseline(): number {
  const diffMs = Math.max(0, Date.now() - BASELINE_TIMESTAMP);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Deterministic hash code from string id
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns dynamic views count for an item (always > 1000 + daily increment 60-180/day)
 */
export function getItemViews(itemId: string, baseOffset = 0): number {
  const h = hashString(itemId || 'item-default');
  const baseViews = 1350 + (h % 1450) + baseOffset; // Initial: 1,350 to 2,800
  const dailyRate = 60 + (h % 120); // 60 to 180 views per day
  const days = getDaysSinceBaseline();
  return baseViews + days * dailyRate;
}

/**
 * Returns dynamic likes count for an item (always > 1000 + daily increment 50-140/day)
 */
export function getItemBaseLikes(itemId: string, baseOffset = 0): number {
  const h = hashString(itemId || 'item-default');
  const baseLikes = 1080 + (h % 920) + baseOffset; // Initial: 1,080 to 2,000
  const dailyRate = 50 + (h % 90); // 50 to 140 likes per day
  const days = getDaysSinceBaseline();
  return baseLikes + days * dailyRate;
}

/**
 * Check if the current user has liked an item in localStorage
 */
export function isItemLikedByUser(itemId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`nabil_like_${itemId}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggle user like for an item and return new liked state
 */
export function toggleItemLike(itemId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = localStorage.getItem(`nabil_like_${itemId}`) === 'true';
    const next = !current;
    if (next) {
      localStorage.setItem(`nabil_like_${itemId}`, 'true');
    } else {
      localStorage.removeItem(`nabil_like_${itemId}`);
    }
    return next;
  } catch {
    return false;
  }
}

/**
 * Get total likes for an item including user's interaction
 */
export function getItemTotalLikes(itemId: string, baseOffset = 0): number {
  const base = getItemBaseLikes(itemId, baseOffset);
  const userLiked = isItemLikedByUser(itemId);
  return base + (userLiked ? 1 : 0);
}

/**
 * Arabic number formatter with commas (e.g. 1,450)
 */
export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

export function formatStandardNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
