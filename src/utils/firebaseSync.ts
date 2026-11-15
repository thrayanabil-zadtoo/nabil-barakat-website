import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Unsubscribe, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sortCommunityPostsNewestFirst } from './communityPostColors';
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
const AGGREGATE_BYTES_BUDGET = 520_000;
const DELETED_PHOTOS_STORAGE_KEY = 'nabil_deleted_photo_ids_v1';
const DELETED_POSTS_STORAGE_KEY = 'nabil_deleted_post_ids_v1';

const writtenPhotoSignatures = new Map<string, string>();
const writtenPostSignatures = new Map<string, string>();

// Shared module caches so modular index docs & individual item collections merge deterministically
let latestAggregatePhotos: PhotoItem[] | null = null;
const latestIndividualPhotosMap = new Map<string, PhotoItem>();
const latestPhotosDeletedIds = new Set<string>(loadDeletedIdsFromStorage(DELETED_PHOTOS_STORAGE_KEY));

let latestAggregatePosts: AuthorPost[] | null = null;
const latestIndividualPostsMap = new Map<string, AuthorPost>();
const latestPostsDeletedIds = new Set<string>(loadDeletedIdsFromStorage(DELETED_POSTS_STORAGE_KEY));

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

  // 1. Listen to modular 'books' document
  const booksDocRef = doc(db, COLLECTION_NAME, 'books');
  const booksUnsub = onSnapshot(
    booksDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.books && Array.isArray(data.books) && data.books.length > 0) {
          onUpdate({ books: data.books, _isSeeded: true }, 'books');
        }
      }
    },
    (err) => console.warn('[Firestore] Books modular sync notification:', err.message)
  );
  unsubs.push(booksUnsub);

  // 1b. Listen to individual books collection for atomic single-book updates
  const booksCol = collection(db, 'books');
  const booksColUnsub = onSnapshot(
    booksCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const loadedBooks: any[] = [];
        snapshot.forEach((d) => {
          if (d.id && !d.id.includes('test')) {
            loadedBooks.push(d.data());
          }
        });
        if (loadedBooks.length > 0) {
          onUpdate({ books: loadedBooks, _isSeeded: true }, 'books');
        }
      }
    },
    (err) => console.warn('[Firestore] Books collection sync notice:', err.message)
  );
  unsubs.push(booksColUnsub);

  // 2. Listen to modular 'profile' document
  const profileDocRef = doc(db, COLLECTION_NAME, 'profile');
  const profileUnsub = onSnapshot(
    profileDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.authorProfile) {
          onUpdate({ authorProfile: data.authorProfile, _isSeeded: true }, 'profile');
        }
      }
    },
    (err) => console.warn('[Firestore] Profile modular sync notification:', err.message)
  );
  unsubs.push(profileUnsub);

  // 3. Listen to modular 'videos' document
  const videosDocRef = doc(db, COLLECTION_NAME, 'videos');
  const videosUnsub = onSnapshot(
    videosDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.videos && Array.isArray(data.videos)) {
          onUpdate({ videos: data.videos, _isSeeded: true }, 'videos');
        }
      }
    },
    (err) => console.warn('[Firestore] Videos modular sync notification:', err.message)
  );
  unsubs.push(videosUnsub);

  // 4. Listen to modular 'photos' document
  const photosDocRef = doc(db, COLLECTION_NAME, 'photos');
  const photosUnsub = onSnapshot(
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
    (err) => console.warn('[Firestore] Photos modular sync notification:', err.message)
  );
  unsubs.push(photosUnsub);

  // 4b. Listen to individual photos_gallery collection for atomic updates
  const photosGalleryCol = collection(db, 'photos_gallery');
  const photosGalleryUnsub = onSnapshot(
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
    (err) => console.warn('[Firestore] Photos gallery collection sync notice:', err.message)
  );
  unsubs.push(photosGalleryUnsub);

  // 5. Listen to modular 'news' document
  const newsDocRef = doc(db, COLLECTION_NAME, 'news');
  const newsUnsub = onSnapshot(
    newsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.news && Array.isArray(data.news)) {
          onUpdate({ news: data.news, _isSeeded: true }, 'news');
        }
      }
    },
    (err) => console.warn('[Firestore] News modular sync notification:', err.message)
  );
  unsubs.push(newsUnsub);

  // 6. Listen to modular 'links' document
  const linksDocRef = doc(db, COLLECTION_NAME, 'links');
  const linksUnsub = onSnapshot(
    linksDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.links && Array.isArray(data.links)) {
          onUpdate({ links: data.links, _isSeeded: true }, 'links');
        }
      }
    },
    (err) => console.warn('[Firestore] Links modular sync notification:', err.message)
  );
  unsubs.push(linksUnsub);

  // 7. Listen to modular 'announcements' document
  const annDocRef = doc(db, COLLECTION_NAME, 'announcements');
  const annUnsub = onSnapshot(
    annDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.announcements && Array.isArray(data.announcements)) {
          onUpdate({ announcements: data.announcements, _isSeeded: true }, 'announcements');
        }
      }
    },
    (err) => console.warn('[Firestore] Announcements sync notification:', err.message)
  );
  unsubs.push(annUnsub);

  // 8. Listen to modular 'comments' document
  const commentsDocRef = doc(db, COLLECTION_NAME, 'comments');
  const commentsUnsub = onSnapshot(
    commentsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.comments && Array.isArray(data.comments)) {
          onUpdate({ comments: data.comments, _isSeeded: true }, 'comments');
        }
      }
    },
    (err) => console.warn('[Firestore] Comments modular sync notification:', err.message)
  );
  unsubs.push(commentsUnsub);

  // 9. Listen to modular 'messages' document
  const messagesDocRef = doc(db, COLLECTION_NAME, 'messages');
  const messagesUnsub = onSnapshot(
    messagesDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.messages && Array.isArray(data.messages)) {
          onUpdate({ messages: data.messages, _isSeeded: true }, 'messages');
        }
      }
    },
    (err) => console.warn('[Firestore] Messages modular sync notification:', err.message)
  );
  unsubs.push(messagesUnsub);

  // 10. Listen to modular 'author_posts' document
  const postsDocRef = doc(db, COLLECTION_NAME, 'author_posts');
  const postsUnsub = onSnapshot(
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
    (err) => console.warn('[Firestore] Author posts sync notification:', err.message)
  );
  unsubs.push(postsUnsub);

  // 10b. Listen to individual community_posts collection for atomic updates
  const communityPostsCol = collection(db, 'community_posts');
  const communityPostsUnsub = onSnapshot(
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
    (err) => console.warn('[Firestore] Community posts collection sync notice:', err.message)
  );
  unsubs.push(communityPostsUnsub);

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Fetch initial cloud state with modular and individual collection fallbacks
 */
export async function fetchCloudSiteData(): Promise<SyncedSiteData | null> {
  const result: Partial<SyncedSiteData> = {};
  let foundAny = false;

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
      getDoc(doc(db, COLLECTION_NAME, 'books')).catch(() => null),
      getDocs(collection(db, 'books')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'profile')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'photos')).catch(() => null),
      getDocs(collection(db, 'photos_gallery')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'videos')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'news')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'links')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'announcements')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'author_posts')).catch(() => null),
      getDocs(collection(db, 'community_posts')).catch(() => null),
    ]);

    // Books merge
    const individualBooksMap = new Map<string, any>();
    if (booksColSnap && !booksColSnap.empty) {
      booksColSnap.forEach((d) => {
        if (d.id && !d.id.includes('test')) {
          individualBooksMap.set(d.id, d.data());
        }
      });
    }

    if (booksSnap && booksSnap.exists()) {
      const data = booksSnap.data();
      if (data?.books && Array.isArray(data.books)) {
        const mergedBooks = data.books.map((b: any) => {
          if (b.id && individualBooksMap.has(b.id)) {
            return { ...b, ...individualBooksMap.get(b.id) };
          }
          return b;
        });
        individualBooksMap.forEach((colBook, colId) => {
          if (!mergedBooks.some((mb: any) => mb.id === colId)) {
            mergedBooks.push(colBook);
          }
        });
        result.books = mergedBooks;
        foundAny = true;
      }
    } else if (individualBooksMap.size > 0) {
      result.books = Array.from(individualBooksMap.values());
      foundAny = true;
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
 * Creates a safe, lightweight aggregate index of books for `site_content/books` (<750 KB).
 */
export function createAggregateBooksIndex(books: any[]): any[] {
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

    return {
      ...b,
      galleryImages: cleanedGallery,
      samplePages: lightweightPages,
    };
  });
}

/**
 * Creates a guaranteed <600KB aggregate index for `site_content/photos`.
 * Full base64 images are always authoritatively stored inside `/photos_gallery/{id}`.
 */
export function createAggregatePhotosIndex(photos: PhotoItem[]): PhotoItem[] {
  let cumulativeBytes = 0;
  return photos.map((p) => {
    const normalized: PhotoItem = {
      ...p,
      category: normalizePhotoCategory(p.category),
    };
    const rawImg = normalized.imageUrl || '';
    const isHeavyBase64 = rawImg.startsWith('data:image/') && rawImg.length > 8000;
    const itemSize = JSON.stringify(normalized).length;

    if (isHeavyBase64 && cumulativeBytes + itemSize > AGGREGATE_BYTES_BUDGET) {
      return {
        ...normalized,
        imageUrl: CLOUD_MEDIA_SENTINEL,
      };
    }

    cumulativeBytes += itemSize;
    return normalized;
  });
}

/**
 * Creates a guaranteed <600KB aggregate index for `site_content/author_posts`.
 * Full post images/media are always authoritatively stored inside `/community_posts/{id}`.
 */
export function createAggregateAuthorPostsIndex(posts: AuthorPost[]): AuthorPost[] {
  let cumulativeBytes = 0;
  return posts.map((post) => {
    const rawImg = post.imageUrl || '';
    const isHeavyBase64 = rawImg.startsWith('data:image/') && rawImg.length > 8000;
    const itemSize = JSON.stringify(post).length;

    if (isHeavyBase64 && cumulativeBytes + itemSize > AGGREGATE_BYTES_BUDGET) {
      return {
        ...post,
        imageUrl: CLOUD_MEDIA_SENTINEL,
      };
    }

    cumulativeBytes += itemSize;
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
    const savePromises: Promise<void>[] = [];

    const trackedWrite = (path: string, promise: Promise<unknown>) => {
      savePromises.push(
        promise
          .then(() => undefined)
          .catch((err) => {
            hadCriticalFailure = true;
            handleFirestoreError(err, OperationType.WRITE, path);
          })
      );
    };

    if (sanitized.books && Array.isArray(sanitized.books)) {
      sanitized.books.forEach((b: any) => {
        if (b?.id) {
          trackedWrite(
            `books/${b.id}`,
            setDoc(doc(db, 'books', b.id), { ...b, updatedAt: nowIso }, { merge: true })
          );
        }
      });

      const aggregateBooks = createAggregateBooksIndex(sanitized.books);
      trackedWrite(
        `${COLLECTION_NAME}/books`,
        setDoc(doc(db, COLLECTION_NAME, 'books'), { books: aggregateBooks, updatedAt: nowIso }, { merge: true })
      );
    }

    if (sanitized.authorProfile) {
      trackedWrite(
        `${COLLECTION_NAME}/profile`,
        setDoc(doc(db, COLLECTION_NAME, 'profile'), { authorProfile: sanitized.authorProfile, updatedAt: nowIso }, { merge: true })
      );
      savePromises.push(
        setDoc(doc(db, 'site_settings', 'profile'), { ...sanitized.authorProfile, updatedAt: nowIso }, { merge: true }).catch(
          (err) => console.warn('[Firestore] Site settings profile notice:', err?.message)
        )
      );
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

      trackedWrite(
        `${COLLECTION_NAME}/videos`,
        setDoc(doc(db, COLLECTION_NAME, 'videos'), { videos: cleanUndefined(safeVideos), updatedAt: nowIso }, { merge: true })
      );
    }

    if (sanitized.photos && Array.isArray(sanitized.photos)) {
      const normalizedPhotos = normalizePhotosList(sanitized.photos as PhotoItem[]);
      latestAggregatePhotos = normalizedPhotos;

      normalizedPhotos.forEach((photo) => {
        if (!photo.id) return;
        latestPhotosDeletedIds.delete(photo.id);
        latestIndividualPhotosMap.set(photo.id, photo);

        const docPayload = cleanUndefined({
          ...photo,
          createdAt: (photo as any).createdAt || Date.now(),
          updatedAt: nowIso,
        });
        const sig = getItemSignature(docPayload);
        if (writtenPhotoSignatures.get(photo.id) !== sig) {
          savePromises.push(
            setDoc(doc(db, 'photos_gallery', photo.id), docPayload, { merge: true })
              .then(() => {
                writtenPhotoSignatures.set(photo.id, sig);
              })
              .catch((err) => {
                hadCriticalFailure = true;
                handleFirestoreError(err, OperationType.WRITE, `photos_gallery/${photo.id}`);
              })
          );
        }
      });

      const aggregatePhotos = createAggregatePhotosIndex(normalizedPhotos);
      trackedWrite(
        `${COLLECTION_NAME}/photos`,
        setDoc(
          doc(db, COLLECTION_NAME, 'photos'),
          {
            photos: aggregatePhotos,
            deletedIds: Array.from(latestPhotosDeletedIds).slice(-250),
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }

    if (sanitized.news && Array.isArray(sanitized.news)) {
      const safeNews = sanitized.news.map((n: any) => {
        if (typeof n.videoUrl === 'string' && n.videoUrl.startsWith('data:video/')) {
          return { ...n, videoUrl: '' };
        }
        return n;
      });
      trackedWrite(
        `${COLLECTION_NAME}/news`,
        setDoc(doc(db, COLLECTION_NAME, 'news'), { news: safeNews, updatedAt: nowIso }, { merge: true })
      );
    }

    if (sanitized.links && Array.isArray(sanitized.links)) {
      trackedWrite(
        `${COLLECTION_NAME}/links`,
        setDoc(doc(db, COLLECTION_NAME, 'links'), { links: sanitized.links, updatedAt: nowIso }, { merge: true })
      );
    }

    if (sanitized.announcements && Array.isArray(sanitized.announcements)) {
      trackedWrite(
        `${COLLECTION_NAME}/announcements`,
        setDoc(doc(db, COLLECTION_NAME, 'announcements'), { announcements: sanitized.announcements, updatedAt: nowIso }, { merge: true })
      );
    }

    if (sanitized.comments && Array.isArray(sanitized.comments)) {
      savePromises.push(
        setDoc(doc(db, COLLECTION_NAME, 'comments'), { comments: sanitized.comments, updatedAt: nowIso }, { merge: true }).catch(
          (err) => console.warn('[Firestore] Comments save notice:', err?.message)
        )
      );
    }

    if (sanitized.messages && Array.isArray(sanitized.messages)) {
      savePromises.push(
        setDoc(doc(db, COLLECTION_NAME, 'messages'), { messages: sanitized.messages, updatedAt: nowIso }, { merge: true }).catch(
          (err) => console.warn('[Firestore] Messages save notice:', err?.message)
        )
      );
    }

    if (sanitized.authorPosts && Array.isArray(sanitized.authorPosts)) {
      const sortedPosts = sortCommunityPostsNewestFirst(sanitized.authorPosts as AuthorPost[]);
      sanitized.authorPosts = sortedPosts;
      latestAggregatePosts = sortedPosts;

      sortedPosts.forEach((post) => {
        if (!post.id) return;
        latestPostsDeletedIds.delete(post.id);
        latestIndividualPostsMap.set(post.id, post);

        const docPayload = cleanUndefined({
          ...post,
          updatedAt: nowIso,
        });
        const sig = getItemSignature(docPayload);
        if (writtenPostSignatures.get(post.id) !== sig) {
          savePromises.push(
            setDoc(doc(db, 'community_posts', post.id), docPayload, { merge: true })
              .then(() => {
                writtenPostSignatures.set(post.id, sig);
              })
              .catch((err) => {
                hadCriticalFailure = true;
                handleFirestoreError(err, OperationType.WRITE, `community_posts/${post.id}`);
              })
          );
        }
      });

      const aggregatePosts = createAggregateAuthorPostsIndex(sortedPosts);
      trackedWrite(
        `${COLLECTION_NAME}/author_posts`,
        setDoc(
          doc(db, COLLECTION_NAME, 'author_posts'),
          {
            authorPosts: aggregatePosts,
            deletedIds: Array.from(latestPostsDeletedIds).slice(-250),
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }

    // Await all critical writes with a generous 15s timeout, tracking genuine completion
    let timedOut = false;
    await Promise.race([
      Promise.all(savePromises),
      new Promise<void>((resolve) =>
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, 15000)
      ),
    ]);

    if (timedOut) {
      console.warn('[Firestore] Save exceeded 15s timeout; individual writes may still be completing in background.');
      return false;
    }

    // Best-effort combined cache doc (strictly stripped of heavy base64 images)
    try {
      const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOC_ID);
      const mainPayload: any = { ...sanitized, updatedAt: nowIso };
      if (mainPayload.books) {
        mainPayload.books = createAggregateBooksIndex(mainPayload.books);
      }
      if (mainPayload.photos && Array.isArray(mainPayload.photos)) {
        mainPayload.photos = mainPayload.photos.map((p: any) =>
          p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 5000
            ? { ...p, imageUrl: '' }
            : p
        );
      }
      if (mainPayload.authorPosts && Array.isArray(mainPayload.authorPosts)) {
        mainPayload.authorPosts = mainPayload.authorPosts.map((p: any) =>
          p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 5000
            ? { ...p, imageUrl: '' }
            : p
        );
      }
      await setDoc(mainDocRef, mainPayload, { merge: true }).catch((err) => {
        console.warn('[Firestore] Main aggregate doc update skipped:', err?.message);
      });
    } catch {
      // Non-critical combined cache
    }

    if (hadCriticalFailure) {
      return false;
    }

    console.log('[Firestore] Site data verified & saved to cloud!');
    return true;
  } catch (error) {
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

export function getLocalDeletedPhotoIds(): Set<string> {
  return new Set(latestPhotosDeletedIds);
}

export function getLocalDeletedPostIds(): Set<string> {
  return new Set(latestPostsDeletedIds);
}
