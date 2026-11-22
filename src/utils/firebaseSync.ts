import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, Unsubscribe, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getPostTimestamp, sortCommunityPostsNewestFirst } from './communityPostColors';
import { normalizePhotoCategory, normalizePhotosList } from './photoCategories';
import {
  AuthorProfile,
  Book,
  VideoItem,
  PhotoItem,
  NewsItem,
  LinkItem,
  AnnouncementItem,
  VisitorComment,
  VisitorMessage,
  AuthorPost,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let cloudQuotaExceeded = false;
let cloudQuotaListener: ((message: string) => void) | null = null;

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  const code = (error as any)?.code;
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded')
  );
}

export function isCloudQuotaExceeded(): boolean {
  return cloudQuotaExceeded;
}

export function resetCloudQuotaFlag(): void {
  cloudQuotaExceeded = false;
}

export function setCloudQuotaListener(listener: ((message: string) => void) | null): void {
  cloudQuotaListener = listener;
}

function notifyIfQuotaExceeded(error: unknown): void {
  if (isQuotaExceededError(error)) {
    const firstTrigger = !cloudQuotaExceeded;
    cloudQuotaExceeded = true;
    const msg = error instanceof Error ? error.message : String(error);
    if (firstTrigger && cloudQuotaListener) {
      cloudQuotaListener(msg);
    }
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  notifyIfQuotaExceeded(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export interface SyncedSiteData {
  authorProfile?: AuthorProfile;
  books?: Book[];
  videos?: VideoItem[];
  photos?: PhotoItem[];
  news?: NewsItem[];
  links?: LinkItem[];
  announcements?: AnnouncementItem[];
  comments?: VisitorComment[];
  messages?: VisitorMessage[];
  authorPosts?: AuthorPost[];
  updatedAt?: string;
  _isSeeded?: boolean;
}

const COLLECTION_NAME = 'site_content';
const MAIN_DOC_ID = 'main';
const CLOUD_MEDIA_SENTINEL = '__CLOUD_MEDIA__';
const AGGREGATE_BYTES_BUDGET = 340_000;
const BOOKS_AGGREGATE_BYTES_BUDGET = 520_000;
const DELETED_PHOTOS_STORAGE_KEY = 'nabil_deleted_photo_ids_v1';
const DELETED_POSTS_STORAGE_KEY = 'nabil_deleted_post_ids_v1';

const writtenPhotoSignatures = new Map<string, string>();
const writtenPostSignatures = new Map<string, string>();
const writtenBookSignatures = new Map<string, string>();
const writtenAggregateSignatures = new Map<string, string>();

// Shared module caches so modular index docs & individual item collections merge deterministically
let latestAggregateBooks: Book[] | null = null;
const latestIndividualBooksMap = new Map<string, Book>();

let latestAggregatePhotos: PhotoItem[] | null = null;
const latestIndividualPhotosMap = new Map<string, PhotoItem>();
const latestPhotosDeletedIds = new Set<string>(loadDeletedIdsFromStorage(DELETED_PHOTOS_STORAGE_KEY));

let latestAggregatePosts: AuthorPost[] | null = null;
const latestIndividualPostsMap = new Map<string, AuthorPost>();
const latestPostsDeletedIds = new Set<string>(loadDeletedIdsFromStorage(DELETED_POSTS_STORAGE_KEY));

const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function getUtf8ByteLength(str: string): number {
  if (!str) return 0;
  if (utf8Encoder) {
    return utf8Encoder.encode(str).length;
  }
  return str.length * 2;
}

function loadDeletedIdsFromStorage(key: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveDeletedIdsToStorage(key: string, set: Set<string>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const arr = Array.from(set).slice(-250);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // ignore storage limits
  }
}

function getItemSignature(item: Record<string, any>): string {
  try {
    const str = JSON.stringify(item);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return `${str.length}:${hash}`;
  } catch {
    return `${Date.now()}`;
  }
}

function sanitizeMediaSentinel(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value === CLOUD_MEDIA_SENTINEL ? '' : value;
}

function mergeBookItem(agg: Book, indiv?: Book): Book {
  if (!indiv) {
    return {
      ...agg,
      coverImage: sanitizeMediaSentinel(agg.coverImage),
    };
  }
  const indivCover = sanitizeMediaSentinel(indiv.coverImage);
  const aggCover = sanitizeMediaSentinel(agg.coverImage);
  const indivGallery = Array.isArray(indiv.galleryImages) ? indiv.galleryImages : [];
  const aggGallery = Array.isArray(agg.galleryImages) ? agg.galleryImages : [];
  const indivPages = Array.isArray(indiv.samplePages) && indiv.samplePages.length > 0 ? indiv.samplePages : agg.samplePages;
  return {
    ...agg,
    ...indiv,
    coverImage: indivCover || aggCover,
    galleryImages: indivGallery.length > 0 ? indivGallery : aggGallery,
    samplePages: indivPages,
  };
}

function mergeBooksFromCaches(): Book[] {
  const merged: Book[] = [];
  const seen = new Set<string>();

  if (latestAggregateBooks && latestAggregateBooks.length > 0) {
    for (const agg of latestAggregateBooks) {
      if (!agg || !agg.id || seen.has(agg.id)) continue;
      seen.add(agg.id);
      merged.push(mergeBookItem(agg, latestIndividualBooksMap.get(agg.id)));
    }
  }

  latestIndividualBooksMap.forEach((indiv, id) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push({
      ...indiv,
      coverImage: sanitizeMediaSentinel(indiv.coverImage),
    });
  });

  return merged;
}

function mergePhotosFromCaches(): PhotoItem[] {
  const merged: PhotoItem[] = [];
  const seen = new Set<string>();

  if (latestAggregatePhotos && latestAggregatePhotos.length > 0) {
    for (const agg of latestAggregatePhotos) {
      if (!agg || !agg.id || latestPhotosDeletedIds.has(agg.id) || seen.has(agg.id)) continue;
      seen.add(agg.id);
      const indiv = latestIndividualPhotosMap.get(agg.id);
      if (indiv) {
        const indivImg = sanitizeMediaSentinel(indiv.imageUrl);
        const aggImg = sanitizeMediaSentinel(agg.imageUrl);
        merged.push({
          ...agg,
          ...indiv,
          imageUrl: indivImg || aggImg,
          category: normalizePhotoCategory(indiv.category || agg.category),
        });
      } else {
        merged.push({
          ...agg,
          imageUrl: sanitizeMediaSentinel(agg.imageUrl),
          category: normalizePhotoCategory(agg.category),
        });
      }
    }
  }

  // Prepend any items present in individual collection that aren't in the aggregate index yet
  const extraIndividual: PhotoItem[] = [];
  latestIndividualPhotosMap.forEach((indiv, id) => {
    if (!id || latestPhotosDeletedIds.has(id) || seen.has(id)) return;
    seen.add(id);
    extraIndividual.push({
      ...indiv,
      imageUrl: sanitizeMediaSentinel(indiv.imageUrl),
      category: normalizePhotoCategory(indiv.category),
    });
  });

  if (extraIndividual.length > 0) {
    extraIndividual.sort((a, b) => {
      const aTs = Number((a as any).createdAt || 0);
      const bTs = Number((b as any).createdAt || 0);
      return bTs - aTs;
    });
    return normalizePhotosList([...extraIndividual, ...merged]);
  }

  return normalizePhotosList(merged);
}

function mergePostsFromCaches(): AuthorPost[] {
  const mergedMap = new Map<string, AuthorPost>();

  if (latestAggregatePosts && Array.isArray(latestAggregatePosts)) {
    for (const agg of latestAggregatePosts) {
      if (!agg || !agg.id || latestPostsDeletedIds.has(agg.id)) continue;
      mergedMap.set(agg.id, {
        ...agg,
        imageUrl: sanitizeMediaSentinel(agg.imageUrl) || undefined,
      });
    }
  }

  latestIndividualPostsMap.forEach((indiv, id) => {
    if (!id || latestPostsDeletedIds.has(id)) return;
    const prevAgg = mergedMap.get(id);
    const indivImg = sanitizeMediaSentinel(indiv.imageUrl);
    const aggImg = sanitizeMediaSentinel(prevAgg?.imageUrl);
    mergedMap.set(id, {
      ...(prevAgg || {}),
      ...indiv,
      imageUrl: indivImg || aggImg || undefined,
    });
  });

  return sortCommunityPostsNewestFirst(Array.from(mergedMap.values()));
}

/**
 * Deeply removes all `undefined` values from objects and arrays,
 * and guards against strings that exceed Firestore field/document limits.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (typeof obj === 'string') {
    // Guard: Prevent massive video base64 data from crashing Firestore's 1MB document limit
    if (obj.startsWith('data:video/') && obj.length > 700000) {
      console.warn('[Firestore] Video base64 exceeds Firestore 700KB limit; omitted from cloud doc.');
      return '' as unknown as T;
    }
    return obj;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanUndefined(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = cleanUndefined(value);
    }
  }
  return result as T;
}

/**
 * Subscribes to real-time cloud updates from Firestore.
 * Listens to both modular aggregate docs and individual collections to ensure
 * every item (regardless of image payload count) syncs in real time.
 */
export function subscribeToCloudSiteData(
  onUpdate: (data: Partial<SyncedSiteData>, source?: string) => void
): () => void {
  const unsubs: Unsubscribe[] = [];
  let disposed = false;
  let heavyAttached = false;
  let waveBTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const handleSnapshotErr = (path: string, err: any) => {
    notifyIfQuotaExceeded(err);
    console.warn(`[Firestore] Sync notice (${path}):`, err?.message || err);
  };

  const attachHeavyListeners = () => {
    if (disposed || heavyAttached) return;
    heavyAttached = true;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    // Wave A: Lightweight-to-medium modular aggregate docs (instant above-the-fold hydration)
    // 1. Modular 'books' document
    const booksDocRef = doc(db, COLLECTION_NAME, 'books');
    unsubs.push(
      onSnapshot(
        booksDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.books && Array.isArray(data.books) && data.books.length > 0) {
              latestAggregateBooks = data.books as Book[];
              const merged = mergeBooksFromCaches();
              if (merged.length > 0) {
                onUpdate({ books: merged, _isSeeded: true }, 'books');
              }
            }
          }
        },
        (err) => handleSnapshotErr(`${COLLECTION_NAME}/books`, err)
      )
    );

    // 4. Modular 'photos' document
    const photosDocRef = doc(db, COLLECTION_NAME, 'photos');
    unsubs.push(
      onSnapshot(
        photosDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data?.deletedIds)) {
              data.deletedIds.forEach((id: string) => id && latestPhotosDeletedIds.add(id));
              saveDeletedIdsToStorage(DELETED_PHOTOS_STORAGE_KEY, latestPhotosDeletedIds);
            }
            if (data?.photos && Array.isArray(data.photos)) {
              latestAggregatePhotos = data.photos;
              const merged = mergePhotosFromCaches();
              if (merged.length > 0 || data.photos.length === 0) {
                onUpdate({ photos: merged, _isSeeded: true }, 'photos');
              }
            }
          }
        },
        (err) => handleSnapshotErr(`${COLLECTION_NAME}/photos`, err)
      )
    );

    // 5. Modular 'news' document
    const newsDocRef = doc(db, COLLECTION_NAME, 'news');
    unsubs.push(
      onSnapshot(
        newsDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.news && Array.isArray(data.news)) {
              onUpdate({ news: data.news, _isSeeded: true }, 'news');
            }
          }
        },
        (err) => handleSnapshotErr(`${COLLECTION_NAME}/news`, err)
      )
    );

    // 10. Modular 'author_posts' document
    const postsDocRef = doc(db, COLLECTION_NAME, 'author_posts');
    unsubs.push(
      onSnapshot(
        postsDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data?.deletedIds)) {
              data.deletedIds.forEach((id: string) => id && latestPostsDeletedIds.add(id));
              saveDeletedIdsToStorage(DELETED_POSTS_STORAGE_KEY, latestPostsDeletedIds);
            }
            if (data?.authorPosts && Array.isArray(data.authorPosts)) {
              latestAggregatePosts = data.authorPosts;
              const merged = mergePostsFromCaches();
              if (merged.length > 0 || data.authorPosts.length === 0) {
                onUpdate({ authorPosts: merged, _isSeeded: true }, 'author_posts');
              }
            }
          }
        },
        (err) => handleSnapshotErr(`${COLLECTION_NAME}/author_posts`, err)
      )
    );

    // Wave B: Full individual item collections (books, photos_gallery, community_posts)
    waveBTimer = setTimeout(() => {
      if (disposed) return;

      // 1b. Individual books collection
      const booksCol = collection(db, 'books');
      unsubs.push(
        onSnapshot(
          booksCol,
          (snapshot) => {
            latestIndividualBooksMap.clear();
            snapshot.forEach((d) => {
              if (d.id && !d.id.includes('test')) {
                const bData = d.data() as Book;
                latestIndividualBooksMap.set(d.id, bData);
                writtenBookSignatures.set(d.id, getItemSignature(bData));
              }
            });
            if (!snapshot.empty || (latestAggregateBooks && latestAggregateBooks.length > 0)) {
              const merged = mergeBooksFromCaches();
              if (merged.length > 0) {
                onUpdate({ books: merged, _isSeeded: true }, 'books_col');
              }
            }
          },
          (err) => handleSnapshotErr('books', err)
        )
      );

      // 4b. Individual photos_gallery collection
      const photosGalleryCol = collection(db, 'photos_gallery');
      unsubs.push(
        onSnapshot(
          photosGalleryCol,
          (snapshot) => {
            latestIndividualPhotosMap.clear();
            snapshot.forEach((d) => {
              if (d.id && !d.id.includes('test')) {
                const pData = d.data() as PhotoItem;
                latestIndividualPhotosMap.set(d.id, pData);
                writtenPhotoSignatures.set(d.id, getItemSignature(pData));
              }
            });
            if (!snapshot.empty || (latestAggregatePhotos && latestAggregatePhotos.length > 0)) {
              const merged = mergePhotosFromCaches();
              onUpdate({ photos: merged, _isSeeded: true }, 'photos_gallery');
            }
          },
          (err) => handleSnapshotErr('photos_gallery', err)
        )
      );

      // 10b. Individual community_posts collection
      const communityPostsCol = collection(db, 'community_posts');
      unsubs.push(
        onSnapshot(
          communityPostsCol,
          (snapshot) => {
            latestIndividualPostsMap.clear();
            snapshot.forEach((d) => {
              if (d.id && !d.id.includes('test')) {
                const postData = d.data() as AuthorPost;
                latestIndividualPostsMap.set(d.id, postData);
                writtenPostSignatures.set(d.id, getItemSignature(postData));
              }
            });
            if (!snapshot.empty || (latestAggregatePosts && latestAggregatePosts.length > 0)) {
              const merged = mergePostsFromCaches();
              onUpdate({ authorPosts: merged, _isSeeded: true }, 'community_posts');
            }
          },
          (err) => handleSnapshotErr('community_posts', err)
        )
      );
    }, 120);
  };

  // Stage 1: Attach tiny core metadata docs first (~12 KB total) so Watch stream connects and marks Online in <500ms
  const triggerHeavyOnce = (snapshot: { metadata?: { fromCache?: boolean } }) => {
    if (!heavyAttached && !snapshot?.metadata?.fromCache) {
      attachHeavyListeners();
    }
  };

  // 2. Listen to modular 'profile' document
  const profileDocRef = doc(db, COLLECTION_NAME, 'profile');
  unsubs.push(
    onSnapshot(
      profileDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.authorProfile) {
            onUpdate({ authorProfile: data.authorProfile, _isSeeded: true }, 'profile');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/profile`, err)
    )
  );

  // 3. Listen to modular 'videos' document
  const videosDocRef = doc(db, COLLECTION_NAME, 'videos');
  unsubs.push(
    onSnapshot(
      videosDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.videos && Array.isArray(data.videos)) {
            onUpdate({ videos: data.videos, _isSeeded: true }, 'videos');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/videos`, err)
    )
  );

  // 6. Listen to modular 'links' document
  const linksDocRef = doc(db, COLLECTION_NAME, 'links');
  unsubs.push(
    onSnapshot(
      linksDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.links && Array.isArray(data.links)) {
            onUpdate({ links: data.links, _isSeeded: true }, 'links');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/links`, err)
    )
  );

  // 7. Listen to modular 'announcements' document
  const annDocRef = doc(db, COLLECTION_NAME, 'announcements');
  unsubs.push(
    onSnapshot(
      annDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.announcements && Array.isArray(data.announcements)) {
            onUpdate({ announcements: data.announcements, _isSeeded: true }, 'announcements');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/announcements`, err)
    )
  );

  // 8. Listen to modular 'comments' document
  const commentsDocRef = doc(db, COLLECTION_NAME, 'comments');
  unsubs.push(
    onSnapshot(
      commentsDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.comments && Array.isArray(data.comments)) {
            onUpdate({ comments: data.comments, _isSeeded: true }, 'comments');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/comments`, err)
    )
  );

  // 9. Listen to modular 'messages' document
  const messagesDocRef = doc(db, COLLECTION_NAME, 'messages');
  unsubs.push(
    onSnapshot(
      messagesDocRef,
      (snapshot) => {
        triggerHeavyOnce(snapshot);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.messages && Array.isArray(data.messages)) {
            onUpdate({ messages: data.messages, _isSeeded: true }, 'messages');
          }
        }
      },
      (err) => handleSnapshotErr(`${COLLECTION_NAME}/messages`, err)
    )
  );

  // Fallback safeguard in case Stage 1 fires only from cache or takes longer
  fallbackTimer = setTimeout(() => {
    attachHeavyListeners();
  }, 600);

  return () => {
    disposed = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (waveBTimer) clearTimeout(waveBTimer);
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Fetch initial cloud state with modular and individual collection fallbacks
 */
export async function fetchCloudSiteData(): Promise<SyncedSiteData | null> {
  const result: Partial<SyncedSiteData> = {};
  let foundAny = false;

  const catchReadErr = (err: unknown) => {
    notifyIfQuotaExceeded(err);
    return null;
  };

  try {
    const [
      booksSnap,
      booksColSnap,
      profileSnap,
      photosSnap,
      photosColSnap,
      videosSnap,
      newsSnap,
      linksSnap,
      annSnap,
      postsSnap,
      communityColSnap,
    ] = await Promise.all([
      getDoc(doc(db, COLLECTION_NAME, 'books')).catch(catchReadErr),
      getDocs(collection(db, 'books')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'profile')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'photos')).catch(catchReadErr),
      getDocs(collection(db, 'photos_gallery')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'videos')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'news')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'links')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'announcements')).catch(catchReadErr),
      getDoc(doc(db, COLLECTION_NAME, 'author_posts')).catch(catchReadErr),
      getDocs(collection(db, 'community_posts')).catch(catchReadErr),
    ]);

    // Books merge (site_content/books + books collection)
    if (booksColSnap && !booksColSnap.empty) {
      booksColSnap.forEach((d) => {
        if (d.id && !d.id.includes('test')) {
          const bData = d.data() as Book;
          latestIndividualBooksMap.set(d.id, bData);
          writtenBookSignatures.set(d.id, getItemSignature(bData));
        }
      });
    }
    if (booksSnap && booksSnap.exists()) {
      const data = booksSnap.data();
      if (data?.books && Array.isArray(data.books)) {
        latestAggregateBooks = data.books as Book[];
      }
    }
    if ((booksSnap && booksSnap.exists()) || latestIndividualBooksMap.size > 0) {
      const mergedBooks = mergeBooksFromCaches();
      if (mergedBooks.length > 0) {
        result.books = mergedBooks;
        foundAny = true;
      }
    }

    if (profileSnap && profileSnap.exists()) {
      const data = profileSnap.data();
      if (data?.authorProfile) {
        result.authorProfile = data.authorProfile;
        foundAny = true;
      }
    }

    // Photos merge (site_content/photos + photos_gallery collection)
    if (photosColSnap && !photosColSnap.empty) {
      photosColSnap.forEach((d) => {
        if (d.id && !d.id.includes('test')) {
          const pData = d.data() as PhotoItem;
          latestIndividualPhotosMap.set(d.id, pData);
          writtenPhotoSignatures.set(d.id, getItemSignature(pData));
        }
      });
    }
    if (photosSnap && photosSnap.exists()) {
      const data = photosSnap.data();
      if (Array.isArray(data?.deletedIds)) {
        data.deletedIds.forEach((id: string) => id && latestPhotosDeletedIds.add(id));
        saveDeletedIdsToStorage(DELETED_PHOTOS_STORAGE_KEY, latestPhotosDeletedIds);
      }
      if (data?.photos && Array.isArray(data.photos)) {
        latestAggregatePhotos = data.photos;
      }
    }
    if ((photosSnap && photosSnap.exists()) || (photosColSnap && !photosColSnap.empty)) {
      result.photos = mergePhotosFromCaches();
      foundAny = true;
    }

    if (videosSnap && videosSnap.exists()) {
      const data = videosSnap.data();
      if (data?.videos && Array.isArray(data.videos)) {
        result.videos = data.videos;
        foundAny = true;
      }
    }

    if (newsSnap && newsSnap.exists()) {
      const data = newsSnap.data();
      if (data?.news && Array.isArray(data.news)) {
        result.news = data.news;
        foundAny = true;
      }
    }

    if (linksSnap && linksSnap.exists()) {
      const data = linksSnap.data();
      if (data?.links && Array.isArray(data.links)) {
        result.links = data.links;
        foundAny = true;
      }
    }

    if (annSnap && annSnap.exists()) {
      const data = annSnap.data();
      if (data?.announcements && Array.isArray(data.announcements)) {
        result.announcements = data.announcements;
        foundAny = true;
      }
    }

    // Community posts merge (site_content/author_posts + community_posts collection)
    if (communityColSnap && !communityColSnap.empty) {
      communityColSnap.forEach((d) => {
        if (d.id && !d.id.includes('test')) {
          const postData = d.data() as AuthorPost;
          latestIndividualPostsMap.set(d.id, postData);
          writtenPostSignatures.set(d.id, getItemSignature(postData));
        }
      });
    }
    if (postsSnap && postsSnap.exists()) {
      const data = postsSnap.data();
      if (Array.isArray(data?.deletedIds)) {
        data.deletedIds.forEach((id: string) => id && latestPostsDeletedIds.add(id));
        saveDeletedIdsToStorage(DELETED_POSTS_STORAGE_KEY, latestPostsDeletedIds);
      }
      if (data?.authorPosts && Array.isArray(data.authorPosts)) {
        latestAggregatePosts = data.authorPosts;
      }
    }
    if ((postsSnap && postsSnap.exists()) || (communityColSnap && !communityColSnap.empty)) {
      result.authorPosts = mergePostsFromCaches();
      foundAny = true;
    }

    // 2. Fallback to main aggregate doc if modular docs didn't populate fields
    if (!foundAny) {
      const mainSnap = await getDoc(doc(db, COLLECTION_NAME, MAIN_DOC_ID)).catch(() => null);
      if (mainSnap && mainSnap.exists()) {
        const mainData = mainSnap.data() as SyncedSiteData;
        if (Array.isArray(mainData.photos)) {
          mainData.photos = normalizePhotosList(
            mainData.photos.map((p) => ({ ...p, imageUrl: sanitizeMediaSentinel(p.imageUrl) }))
          );
        }
        return mainData;
      }
    }

    if (foundAny) {
      result._isSeeded = true;
      return result as SyncedSiteData;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Notice during cloud state fetch:', error);
    return null;
  }
}

/**
 * Creates a safe, lightweight aggregate index of books for `site_content/books` (<520 KB).
 * Full covers/samplePages remain authoritatively inside `/books/{id}`.
 */
export function createAggregateBooksIndex(books: any[], confirmedIndividualIds?: Set<string>): any[] {
  let cumulativeBytes = 0;
  return books.map((b) => {
    const cleanedGallery = (b.galleryImages || []).filter(
      (img: string) =>
        img !== b.coverImage &&
        !img.includes('book_reality_dream') &&
        !img.includes('cultural_salon_event') &&
        !img.startsWith('data:video/')
    );

    const lightweightPages = (b.samplePages || []).map((p: any) => {
      if (p.image && typeof p.image === 'string' && p.image.startsWith('data:image/') && p.image.length > 5000) {
        const { image, ...rest } = p;
        return rest;
      }
      return p;
    });

    const candidate = {
      ...b,
      galleryImages: cleanedGallery,
      samplePages: lightweightPages,
    };

    const itemBytes = getUtf8ByteLength(JSON.stringify(candidate));
    const isHeavyCover = typeof b.coverImage === 'string' && b.coverImage.startsWith('data:image/') && b.coverImage.length > 8000;
    const canOffloadCover = !confirmedIndividualIds || confirmedIndividualIds.has(b.id);

    if (isHeavyCover && canOffloadCover && cumulativeBytes + itemBytes > BOOKS_AGGREGATE_BYTES_BUDGET) {
      const stripped = {
        ...candidate,
        coverImage: CLOUD_MEDIA_SENTINEL,
        galleryImages: [],
      };
      cumulativeBytes += getUtf8ByteLength(JSON.stringify(stripped));
      return stripped;
    }

    cumulativeBytes += itemBytes;
    return candidate;
  });
}

/**
 * Creates a guaranteed <360KB aggregate index for `site_content/photos`.
 * Full base64 images are always authoritatively stored inside `/photos_gallery/{id}`.
 */
export function createAggregatePhotosIndex(photos: PhotoItem[], confirmedIndividualIds?: Set<string>): PhotoItem[] {
  let cumulativeBytes = 0;
  return photos.map((p) => {
    const normalized: PhotoItem = {
      ...p,
      category: normalizePhotoCategory(p.category),
    };
    const rawImg = normalized.imageUrl || '';
    const isHeavyBase64 = rawImg.startsWith('data:image/') && rawImg.length > 8000;
    const itemBytes = getUtf8ByteLength(JSON.stringify(normalized));
    const canOffload = !confirmedIndividualIds || confirmedIndividualIds.has(p.id);

    if (isHeavyBase64 && canOffload && cumulativeBytes + itemBytes > AGGREGATE_BYTES_BUDGET) {
      const stripped = {
        ...normalized,
        imageUrl: CLOUD_MEDIA_SENTINEL,
      };
      cumulativeBytes += getUtf8ByteLength(JSON.stringify(stripped));
      return stripped;
    }

    cumulativeBytes += itemBytes;
    return normalized;
  });
}

/**
 * Creates a guaranteed <360KB aggregate index for `site_content/author_posts`.
 * Full post images/media are always authoritatively stored inside `/community_posts/{id}`.
 */
export function createAggregateAuthorPostsIndex(posts: AuthorPost[], confirmedIndividualIds?: Set<string>): AuthorPost[] {
  let cumulativeBytes = 0;
  return posts.map((post) => {
    const rawImg = post.imageUrl || '';
    const isHeavyBase64 = rawImg.startsWith('data:image/') && rawImg.length > 8000;
    const rawAudio = post.audioUrl || '';
    const isHeavyAudio = rawAudio.startsWith('data:audio/') && rawAudio.length > 8000;
    const itemBytes = getUtf8ByteLength(JSON.stringify(post));
    const canOffload = !confirmedIndividualIds || confirmedIndividualIds.has(post.id);

    if ((isHeavyBase64 || isHeavyAudio) && canOffload && cumulativeBytes + itemBytes > AGGREGATE_BYTES_BUDGET) {
      const stripped = {
        ...post,
        ...(isHeavyBase64 ? { imageUrl: CLOUD_MEDIA_SENTINEL } : {}),
        ...(isHeavyAudio ? { audioUrl: '' } : {}),
      };
      cumulativeBytes += getUtf8ByteLength(JSON.stringify(stripped));
      return stripped;
    }

    cumulativeBytes += itemBytes;
    return post;
  });
}

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncPayload: Partial<SyncedSiteData> = {};
let saveChain: Promise<boolean> = Promise.resolve(true);

async function runQueuedCloudSave(dataToSave: Partial<SyncedSiteData>): Promise<boolean> {
  if (!dataToSave || Object.keys(dataToSave).length === 0) return true;

  try {
    const sanitized = cleanUndefined(dataToSave);
    const nowIso = new Date().toISOString();
    let hadCriticalFailure = false;

    // Phase 1: Write all individual atomic docs first (photos_gallery, community_posts, books)
    // and track confirmed IDs so aggregate docs only reference __CLOUD_MEDIA__ when individual storage succeeded.
    const phase1Promises: Promise<void>[] = [];
    const confirmedBookIds = new Set<string>(writtenBookSignatures.keys());
    const confirmedPhotoIds = new Set<string>(writtenPhotoSignatures.keys());
    const confirmedPostIds = new Set<string>(writtenPostSignatures.keys());

    if (sanitized.books && Array.isArray(sanitized.books)) {
      latestAggregateBooks = sanitized.books as Book[];
      sanitized.books.forEach((b: any) => {
        if (b?.id) {
          latestIndividualBooksMap.set(b.id, b as Book);
          const bookSig = getItemSignature(b);
          if (writtenBookSignatures.get(b.id) === bookSig) {
            confirmedBookIds.add(b.id);
            return;
          }
          phase1Promises.push(
            setDoc(doc(db, 'books', b.id), { ...b, updatedAt: nowIso }, { merge: true })
              .then(() => {
                writtenBookSignatures.set(b.id, bookSig);
                confirmedBookIds.add(b.id);
              })
              .catch((err) => {
                hadCriticalFailure = true;
                handleFirestoreError(err, OperationType.WRITE, `books/${b.id}`);
              })
          );
        }
      });
    }

    let normalizedPhotos: PhotoItem[] | null = null;
    if (sanitized.photos && Array.isArray(sanitized.photos)) {
      normalizedPhotos = normalizePhotosList(sanitized.photos as PhotoItem[]);
      latestAggregatePhotos = normalizedPhotos;

      normalizedPhotos.forEach((photo) => {
        if (!photo.id) return;
        latestPhotosDeletedIds.delete(photo.id);
        latestIndividualPhotosMap.set(photo.id, photo);

        const docPayload = cleanUndefined({
          ...photo,
          createdAt: (photo as any).createdAt || Date.now(),
        });
        const sig = getItemSignature(docPayload);
        if (writtenPhotoSignatures.get(photo.id) === sig) {
          confirmedPhotoIds.add(photo.id);
          return;
        }
        phase1Promises.push(
          setDoc(doc(db, 'photos_gallery', photo.id), { ...docPayload, updatedAt: nowIso }, { merge: true })
            .then(() => {
              writtenPhotoSignatures.set(photo.id, sig);
              confirmedPhotoIds.add(photo.id);
            })
            .catch((err) => {
              hadCriticalFailure = true;
              handleFirestoreError(err, OperationType.WRITE, `photos_gallery/${photo.id}`);
            })
        );
      });
    }

    let sortedPosts: AuthorPost[] | null = null;
    if (sanitized.authorPosts && Array.isArray(sanitized.authorPosts)) {
      sortedPosts = sortCommunityPostsNewestFirst(sanitized.authorPosts as AuthorPost[]);
      sanitized.authorPosts = sortedPosts;
      latestAggregatePosts = sortedPosts;

      sortedPosts.forEach((post) => {
        if (!post.id) return;
        latestPostsDeletedIds.delete(post.id);
        latestIndividualPostsMap.set(post.id, post);

        const docPayload = cleanUndefined({
          ...post,
          createdAt: (post as any).createdAt || getPostTimestamp(post) || Date.now(),
        });
        const sig = getItemSignature(docPayload);
        if (writtenPostSignatures.get(post.id) === sig) {
          confirmedPostIds.add(post.id);
          return;
        }
        phase1Promises.push(
          setDoc(doc(db, 'community_posts', post.id), { ...docPayload, updatedAt: nowIso }, { merge: true })
            .then(() => {
              writtenPostSignatures.set(post.id, sig);
              confirmedPostIds.add(post.id);
            })
            .catch((err) => {
              hadCriticalFailure = true;
              handleFirestoreError(err, OperationType.WRITE, `community_posts/${post.id}`);
            })
        );
      });
    }

    let phase1TimedOut = false;
    if (phase1Promises.length > 0) {
      await Promise.race([
        Promise.all(phase1Promises),
        new Promise<void>((resolve) =>
          setTimeout(() => {
            phase1TimedOut = true;
            resolve();
          }, 15000)
        ),
      ]);
    }

    // Phase 2: Write modular aggregate index documents safely within size budgets
    const phase2Promises: Promise<void>[] = [];

    const trackedWrite = (path: string, promise: Promise<unknown>) => {
      phase2Promises.push(
        promise
          .then(() => undefined)
          .catch((err) => {
            hadCriticalFailure = true;
            handleFirestoreError(err, OperationType.WRITE, path);
          })
      );
    };

    const writeModularIfChanged = (key: string, payloadObj: Record<string, any>, critical = true) => {
      const sig = getItemSignature(payloadObj);
      if (writtenAggregateSignatures.get(key) === sig) return;
      const writePromise = setDoc(doc(db, COLLECTION_NAME, key), { ...payloadObj, updatedAt: nowIso }, { merge: true })
        .then(() => {
          writtenAggregateSignatures.set(key, sig);
        });
      if (critical) {
        trackedWrite(`${COLLECTION_NAME}/${key}`, writePromise);
      } else {
        phase2Promises.push(
          writePromise.catch((err) => {
            notifyIfQuotaExceeded(err);
            console.warn(`[Firestore] ${key} save notice:`, err?.message);
          })
        );
      }
    };

    if (sanitized.books && Array.isArray(sanitized.books)) {
      const aggregateBooks = createAggregateBooksIndex(sanitized.books, confirmedBookIds);
      writeModularIfChanged('books', { books: aggregateBooks }, true);
    }

    if (sanitized.authorProfile) {
      writeModularIfChanged('profile', { authorProfile: sanitized.authorProfile }, true);
      const profileSig = getItemSignature(sanitized.authorProfile);
      if (writtenAggregateSignatures.get('site_settings_profile') !== profileSig) {
        phase2Promises.push(
          setDoc(doc(db, 'site_settings', 'profile'), { ...sanitized.authorProfile, updatedAt: nowIso }, { merge: true })
            .then(() => {
              writtenAggregateSignatures.set('site_settings_profile', profileSig);
            })
            .catch((err) => {
              notifyIfQuotaExceeded(err);
              console.warn('[Firestore] Site settings profile notice:', err?.message);
            })
        );
      }
    }

    if (sanitized.videos && Array.isArray(sanitized.videos)) {
      const safeVideos = sanitized.videos.map((v: any) => {
        const isBase64Url = typeof v.url === 'string' && v.url.startsWith('data:video/');
        const isBase64File = typeof v.videoFileUrl === 'string' && v.videoFileUrl.startsWith('data:video/');
        if (isBase64Url || isBase64File) {
          return {
            ...v,
            url: isBase64Url ? (v.videoFileUrl && !v.videoFileUrl.startsWith('data:') ? v.videoFileUrl : '') : v.url,
            videoFileUrl: isBase64File ? undefined : v.videoFileUrl,
          };
        }
        return v;
      });

      writeModularIfChanged('videos', { videos: cleanUndefined(safeVideos) }, true);
    }

    if (normalizedPhotos) {
      const aggregatePhotos = createAggregatePhotosIndex(normalizedPhotos, confirmedPhotoIds);
      writeModularIfChanged(
        'photos',
        {
          photos: aggregatePhotos,
          deletedIds: Array.from(latestPhotosDeletedIds).slice(-250),
        },
        true
      );
    }

    if (sanitized.news && Array.isArray(sanitized.news)) {
      const safeNews = sanitized.news.map((n: any) => {
        if (typeof n.videoUrl === 'string' && n.videoUrl.startsWith('data:video/')) {
          return { ...n, videoUrl: '' };
        }
        return n;
      });
      writeModularIfChanged('news', { news: safeNews }, true);
    }

    if (sanitized.links && Array.isArray(sanitized.links)) {
      writeModularIfChanged('links', { links: sanitized.links }, true);
    }

    if (sanitized.announcements && Array.isArray(sanitized.announcements)) {
      writeModularIfChanged('announcements', { announcements: sanitized.announcements }, true);
    }

    if (sanitized.comments && Array.isArray(sanitized.comments)) {
      writeModularIfChanged('comments', { comments: sanitized.comments }, false);
    }

    if (sanitized.messages && Array.isArray(sanitized.messages)) {
      writeModularIfChanged('messages', { messages: sanitized.messages }, false);
    }

    if (sortedPosts) {
      const aggregatePosts = createAggregateAuthorPostsIndex(sortedPosts, confirmedPostIds);
      writeModularIfChanged(
        'author_posts',
        {
          authorPosts: aggregatePosts,
          deletedIds: Array.from(latestPostsDeletedIds).slice(-250),
        },
        true
      );
    }

    let phase2TimedOut = false;
    if (phase2Promises.length > 0) {
      await Promise.race([
        Promise.all(phase2Promises),
        new Promise<void>((resolve) =>
          setTimeout(() => {
            phase2TimedOut = true;
            resolve();
          }, 15000)
        ),
      ]);
    }

    if (phase1TimedOut || phase2TimedOut) {
      console.warn('[Firestore] Save exceeded 15s phase timeout; writes may still be completing in background.');
      return false;
    }

    if (hadCriticalFailure) {
      return false;
    }

    console.log('[Firestore] Site data verified & saved to cloud!');
    return true;
  } catch (error) {
    notifyIfQuotaExceeded(error);
    console.error('[Firestore] Failed to save site data to cloud:', error);
    return false;
  }
}

/**
 * Serializes and saves site data to Firestore across individual item docs and modular index docs.
 * Returns true ONLY if all critical writes succeeded cleanly.
 */
export function saveSiteDataToCloud(data: Partial<SyncedSiteData>, immediate = false): Promise<boolean> {
  pendingSyncPayload = {
    ...pendingSyncPayload,
    ...data,
  };

  const enqueueFlush = (): Promise<boolean> => {
    saveChain = saveChain.then(async () => {
      const batch = { ...pendingSyncPayload };
      pendingSyncPayload = {};
      if (Object.keys(batch).length === 0) return true;
      return runQueuedCloudSave(batch);
    });
    return saveChain;
  };

  if (immediate) {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
      syncDebounceTimer = null;
    }
    return enqueueFlush();
  }

  return new Promise((resolve) => {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(() => {
      syncDebounceTimer = null;
      enqueueFlush().then(resolve);
    }, 150);
  });
}

/**
 * Deletes an individual photo from `photos_gallery` and records a tombstone so it does not resurrect.
 */
export async function deletePhotoFromCloud(photoId: string): Promise<void> {
  if (!photoId) return;
  latestPhotosDeletedIds.add(photoId);
  latestIndividualPhotosMap.delete(photoId);
  writtenPhotoSignatures.delete(photoId);
  saveDeletedIdsToStorage(DELETED_PHOTOS_STORAGE_KEY, latestPhotosDeletedIds);
  try {
    await deleteDoc(doc(db, 'photos_gallery', photoId));
  } catch (err: any) {
    console.warn(`[Firestore] Notice deleting photos_gallery/${photoId}:`, err?.message);
  }
}

/**
 * Deletes an individual post from `community_posts` and records a tombstone so it does not resurrect.
 */
export async function deleteCommunityPostFromCloud(postId: string): Promise<void> {
  if (!postId) return;
  latestPostsDeletedIds.add(postId);
  latestIndividualPostsMap.delete(postId);
  writtenPostSignatures.delete(postId);
  saveDeletedIdsToStorage(DELETED_POSTS_STORAGE_KEY, latestPostsDeletedIds);
  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (err: any) {
    console.warn(`[Firestore] Notice deleting community_posts/${postId}:`, err?.message);
  }
}

/**
 * Atomically updates only engagement stats (likesCount / viewsCount) on a single `community_posts/{postId}` doc
 * without rewriting aggregate index documents (`site_content/author_posts` or `site_content/main`).
 */
export async function syncSinglePostStatsToCloud(
  postId: string,
  stats: { viewsCount?: number; likesCount?: number }
): Promise<boolean> {
  if (!postId || cloudQuotaExceeded) return false;
  const payload = cleanUndefined({
    ...stats,
    updatedAt: new Date().toISOString(),
  });
  if (Object.keys(payload).length <= 1) return true;

  try {
    await updateDoc(doc(db, 'community_posts', postId), payload);
    return true;
  } catch (err: any) {
    notifyIfQuotaExceeded(err);
    if (err?.code === 'not-found') {
      return false;
    }
    console.warn(`[Firestore] Notice updating stats for community_posts/${postId}:`, err?.message);
    return false;
  }
}

export function getLocalDeletedPhotoIds(): Set<string> {
  return new Set(latestPhotosDeletedIds);
}

export function getLocalDeletedPostIds(): Set<string> {
  return new Set(latestPostsDeletedIds);
}
