/**
 * Dynamic Statistics Utility
 * Provides deterministic and progressive view/like counts (>1000)
 * with a daily increment of 50 to 200 per day since baseline,
 * plus interactive local liking and live online visitor simulation (>100).
 */
import { getPostTimestamp } from './communityPostColors';

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

/**
 * Generates immediate initial stats for any newly published community post:
 * - Minimum 50 views added immediately (ranging between 50 and 200)
 * - Varied initial likes between 50 and 200 (never exceeding views)
 */
export function generateInitialCommunityPostStats(): {
  viewsCount: number;
  likesCount: number;
} {
  const viewsCount = 50 + Math.floor(Math.random() * 151); // 50..200
  const maxLikes = Math.max(50, Math.min(200, viewsCount));
  const likesCount = 50 + Math.floor(Math.random() * (maxLikes - 50 + 1)); // 50..maxLikes
  return { viewsCount, likesCount };
}

/**
 * Computes consistent, progressive views and likes for a community post.
 * Guarantees at least 50 views immediately on any post and varies daily
 * increments between 50 and 200.
 */
export function getCommunityPostStats(post: {
  id: string;
  viewsCount?: number;
  likesCount?: number;
  createdAt?: number;
  date?: string;
}): { views: number; likes: number; baseViews: number; baseLikes: number } {
  const idKey = post.id || 'post-default';
  const hViews = hashString(`${idKey}_views`);
  const hLikes = hashString(`${idKey}_likes`);

  const hasPersistedLikes = typeof post.likesCount === 'number' && post.likesCount >= 50;
  const fallbackViews = 50 + (hViews % 151); // 50..200

  let baseViews =
    typeof post.viewsCount === 'number' && post.viewsCount >= 50
      ? post.viewsCount
      : fallbackViews;

  if (hasPersistedLikes && baseViews < (post.likesCount as number)) {
    baseViews = Math.max(50, (post.likesCount as number) + 12 + (hViews % 38));
  }

  const maxInitialLikes = Math.max(50, Math.min(200, baseViews));
  const fallbackLikes =
    50 + (hLikes % Math.max(1, maxInitialLikes - 50 + 1));

  const baseLikes =
    typeof post.likesCount === 'number' && post.likesCount > 0
      ? Math.max(50, post.likesCount)
      : fallbackLikes;

  // Determine post creation timestamp (supports createdAt, numeric IDs, and Arabic dates)
  const createdMs = getPostTimestamp(post);

  const daysElapsed =
    createdMs > 0
      ? Math.min(365, Math.floor(Math.max(0, Date.now() - createdMs) / (1000 * 60 * 60 * 24)))
      : 0;

  let addedViews = 0;
  let addedLikes = 0;
  for (let d = 1; d <= daysElapsed; d++) {
    const dv = 50 + (hashString(`${idKey}_dv_${d}`) % 151); // 50..200 per day
    const dl = 50 + (hashString(`${idKey}_dl_${d}`) % Math.max(1, dv - 50 + 1)); // 50..dv per day
    addedViews += dv;
    addedLikes += dl;
  }

  return {
    views: baseViews + addedViews,
    likes: baseLikes + addedLikes,
    baseViews,
    baseLikes,
  };
}

/**
 * Persists a visitor's liked heart state per community post locally so it survives page refreshes and cloud updates.
 */
export function getLocalPostLikeState(postId: string): boolean | null {
  if (typeof window === 'undefined' || !postId) return null;
  try {
    const val = localStorage.getItem(`nabil_post_liked_${postId}`);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function setLocalPostLikeState(postId: string, liked: boolean): void {
  if (typeof window === 'undefined' || !postId) return;
  try {
    localStorage.setItem(`nabil_post_liked_${postId}`, liked ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}


