import {
  AnnouncementItem,
  AuthorPost,
  Book,
  LinkItem,
  NewsItem,
  PhotoItem,
  VideoItem,
} from '../types';
import { buildShortShareExcerpt } from '../config/siteDomain';

export type NotifiableContentKind =
  | 'post'
  | 'book'
  | 'video'
  | 'photo'
  | 'news'
  | 'announcement'
  | 'link';

const SEEN_IDS_STORAGE_KEY = 'nabil_notified_content_ids_v1';
const MAX_STORED_IDS = 500;

let memorySeenSet: Set<string> | null = null;
let hasExistingRegistry = false;

function loadSeenRegistry(): Set<string> {
  if (memorySeenSet) return memorySeenSet;
  memorySeenSet = new Set<string>();
  if (typeof window === 'undefined') return memorySeenSet;

  try {
    const raw = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
    if (raw) {
      hasExistingRegistry = true;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          if (typeof entry === 'string') memorySeenSet!.add(entry);
        });
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return memorySeenSet;
}

function saveSeenRegistry(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(set);
    const trimmed = arr.length > MAX_STORED_IDS ? arr.slice(arr.length - MAX_STORED_IDS) : arr;
    localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota errors
  }
}

function makeContentKey(kind: NotifiableContentKind, id: string): string {
  return `${kind}:${id}`;
}

export function hasSeededNotificationRegistry(): boolean {
  loadSeenRegistry();
  return hasExistingRegistry;
}

/**
 * Seeds baseline IDs silently on initial setup so existing site items never spam notifications.
 */
export function seedBaselineContentIds(payload: {
  authorPosts?: AuthorPost[];
  books?: Book[];
  videos?: VideoItem[];
  photos?: PhotoItem[];
  news?: NewsItem[];
  announcements?: AnnouncementItem[];
  links?: LinkItem[];
}) {
  const seen = loadSeenRegistry();
  let changed = false;

  const markList = (kind: NotifiableContentKind, items?: Array<{ id?: string }>) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (item && item.id) {
        const key = makeContentKey(kind, item.id);
        if (!seen.has(key)) {
          seen.add(key);
          changed = true;
        }
      }
    });
  };

  markList('post', payload.authorPosts);
  markList('book', payload.books);
  markList('video', payload.videos);
  markList('photo', payload.photos);
  markList('news', payload.news);
  markList('announcement', payload.announcements);
  markList('link', payload.links);

  hasExistingRegistry = true;
  if (changed) {
    saveSeenRegistry(seen);
  }
}

interface NotificationContentMeta {
  title: string;
  body: string;
  url: string;
  image?: string;
}

function buildNotificationMeta(kind: NotifiableContentKind, item: unknown): NotificationContentMeta | null {
  if (!item || typeof item !== 'object') return null;

  switch (kind) {
    case 'post': {
      const p = item as AuthorPost;
      const categoryLabel = p.category || 'منشور';
      const title = p.title
        ? `${categoryLabel} جديدة: ${p.title}`
        : `جديد مجتمع الكاتب أ. نبيل بركات (${categoryLabel})`;
      const body = p.content
        ? buildShortShareExcerpt(p.content, 115)
        : 'تم نشر مشاركة جديدة في قسم المجتمع الأدبي.';
      return {
        title,
        body,
        url: `/?section=community&post=${encodeURIComponent(p.id)}`,
        image: p.imageUrl,
      };
    }
    case 'book': {
      const b = item as Book;
      return {
        title: 'إصدار أو رواية جديدة للكاتب أ. نبيل بركات',
        body: `«${b.title}» — ${b.genre || 'كتاب ورواية'}`,
        url: `/?section=books&item=${encodeURIComponent(b.id)}`,
        image: b.coverImage,
      };
    }
    case 'video': {
      const v = item as VideoItem;
      return {
        title: 'مقطع مرئي جديد — أ. نبيل بركات',
        body: v.title || 'تمت إضافة مقطع فيديو جديد إلى مكتبة الكاتب.',
        url: `/?section=videos&item=${encodeURIComponent(v.id)}`,
      };
    }
    case 'photo': {
      const ph = item as PhotoItem;
      return {
        title: 'صورة جديدة في ألبوم أ. نبيل بركات',
        body: ph.title || ph.caption || 'تمت إضافة لقطة جديدة إلى معرض الصور.',
        url: `/?section=photos&item=${encodeURIComponent(ph.id)}`,
        image: ph.imageUrl,
      };
    }
    case 'news': {
      const n = item as NewsItem;
      return {
        title: 'خبر أو مقال جديد — أ. نبيل بركات',
        body: n.title || buildShortShareExcerpt(n.excerpt || '', 110),
        url: `/?section=news&item=${encodeURIComponent(n.id)}`,
        image: n.coverImage,
      };
    }
    case 'announcement': {
      const a = item as AnnouncementItem;
      if (a.isActive === false) return null;
      return {
        title: a.badge ? `${a.badge} — أ. نبيل بركات` : 'تنبيه ثقافي جديد — أ. نبيل بركات',
        body: a.title || a.description || 'إعلان جديد في الموقع الرسمي للكاتب.',
        url: '/?section=home',
      };
    }
    case 'link': {
      const l = item as LinkItem;
      return {
        title: 'رابط ومورد جديد في موقع أ. نبيل بركات',
        body: l.title || l.description || 'تمت إضافة رابط جديد إلى قسم الروابط.',
        url: '/?section=links',
      };
    }
    default:
      return null;
  }
}

async function dispatchBrowserNotification(
  tag: string,
  meta: NotificationContentMeta
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions & { image?: string } = {
    body: meta.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    tag,
    data: { url: meta.url },
  };
  if (meta.image && meta.image.startsWith('http')) {
    options.image = meta.image;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(meta.title, options);
        return;
      }
    }
    const notif = new Notification(meta.title, options);
    notif.onclick = () => {
      window.focus();
      if (meta.url) {
        window.location.href = meta.url;
      }
    };
  } catch {
    // ignore OS/browser notification display constraints
  }
}

/**
 * Notifies the user about a newly published content item (post, book, video, photo, news, announcement, link).
 * Comments, replies, messages, likes, and views are intentionally NOT passed here.
 */
export function notifySingleNewContent(
  kind: NotifiableContentKind,
  item: { id?: string }
): void {
  if (!item || !item.id) return;
  const seen = loadSeenRegistry();
  const key = makeContentKey(kind, item.id);
  if (seen.has(key)) return;

  seen.add(key);
  hasExistingRegistry = true;
  saveSeenRegistry(seen);

  const meta = buildNotificationMeta(kind, item);
  if (!meta) return;
  void dispatchBrowserNotification(`nabil-${kind}-${item.id}`, meta);
}

/**
 * Compares incoming cloud items against previously seen IDs and notifies ONLY for genuinely new content additions.
 * Limits burst notifications to at most 2 items per sync batch to prevent notification overload.
 */
export function notifyNewContentFromSync<T extends { id?: string }>(
  kind: NotifiableContentKind,
  incomingItems: T[]
): void {
  if (!Array.isArray(incomingItems) || incomingItems.length === 0) return;
  const seen = loadSeenRegistry();

  // If registry was never initialized yet, seed silently instead of firing alerts for historical data
  if (!hasExistingRegistry) {
    incomingItems.forEach((item) => {
      if (item && item.id) seen.add(makeContentKey(kind, item.id));
    });
    hasExistingRegistry = true;
    saveSeenRegistry(seen);
    return;
  }

  const unseenItems: T[] = [];
  incomingItems.forEach((item) => {
    if (!item || !item.id) return;
    const key = makeContentKey(kind, item.id);
    if (!seen.has(key)) {
      seen.add(key);
      unseenItems.push(item);
    }
  });

  if (unseenItems.length === 0) return;
  saveSeenRegistry(seen);

  // Show up to 2 newest items to stay helpful without overwhelming the user
  unseenItems.slice(0, 2).forEach((item) => {
    const meta = buildNotificationMeta(kind, item);
    if (meta && item.id) {
      void dispatchBrowserNotification(`nabil-${kind}-${item.id}`, meta);
    }
  });
}
