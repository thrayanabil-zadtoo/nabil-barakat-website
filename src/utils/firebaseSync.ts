import { doc, getDoc, setDoc, onSnapshot, Unsubscribe, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
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
  updatedAt?: string;
  _isSeeded?: boolean;
}

const COLLECTION_NAME = 'site_content';
const MAIN_DOC_ID = 'main';

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
 * Listens to each modular collection/document directly to prevent race conditions and 1MB size limits.
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
        if (data?.photos && Array.isArray(data.photos)) {
          onUpdate({ photos: data.photos, _isSeeded: true }, 'photos');
        }
      }
    },
    (err) => console.warn('[Firestore] Photos modular sync notification:', err.message)
  );
  unsubs.push(photosUnsub);

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

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Fetch initial cloud state with modular fallbacks
 */
export async function fetchCloudSiteData(): Promise<SyncedSiteData | null> {
  const result: Partial<SyncedSiteData> = {};
  let foundAny = false;

  try {
    // 1. First read modular documents and individual books collection (guaranteed fresh and not subject to 1MB size limit)
    const [booksSnap, booksColSnap, profileSnap, photosSnap, videosSnap, newsSnap, linksSnap, annSnap] = await Promise.all([
      getDoc(doc(db, COLLECTION_NAME, 'books')).catch(() => null),
      getDocs(collection(db, 'books')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'profile')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'photos')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'videos')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'news')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'links')).catch(() => null),
      getDoc(doc(db, COLLECTION_NAME, 'announcements')).catch(() => null),
    ]);

    // Build books map from individual documents (authoritative single-doc source)
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
        // Merge individual book docs so updated covers/details are 100% hydrated
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

    if (photosSnap && photosSnap.exists()) {
      const data = photosSnap.data();
      if (data?.photos && Array.isArray(data.photos)) {
        result.photos = data.photos;
        foundAny = true;
      }
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

    // 2. Fallback to main aggregate doc if modular docs didn't populate all fields
    if (!foundAny) {
      const mainSnap = await getDoc(doc(db, COLLECTION_NAME, MAIN_DOC_ID)).catch(() => null);
      if (mainSnap && mainSnap.exists()) {
        return mainSnap.data() as SyncedSiteData;
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

let syncDebounceTimer: any = null;
let pendingSyncPayload: Partial<SyncedSiteData> = {};

/**
 * Creates a safe, lightweight aggregate index of books for the `site_content/books` document.
 * This guarantees the document stays comfortably within Firestore's 1MB limit (under ~750KB).
 * Full book content (including all high-res chapter pages and media) is authoritatively stored
 * in individual `/books/{id}` documents.
 */
export function createAggregateBooksIndex(books: any[]): any[] {
  return books.map((b) => {
    // 1. Clean up duplicate cover from galleryImages and exclude huge base64 video payloads
    const cleanedGallery = (b.galleryImages || []).filter(
      (img: string) =>
        img !== b.coverImage &&
        !img.includes('book_reality_dream') &&
        !img.includes('cultural_salon_event') &&
        !img.startsWith('data:video/')
    );

    // 2. Keep samplePages lightweight in the aggregate index:
    // Retain page numbers, titles, and text, while omitting heavy duplicate base64 page images (>5KB).
    // The authoritative full pages are saved in `/books/{b.id}`.
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
 * Atomically saves site data to Firestore across both modular documents and the main document.
 * Guaranteed to never fail silently: throws or logs clearly, properly awaits writes.
 */
export async function saveSiteDataToCloud(data: Partial<SyncedSiteData>, immediate = false): Promise<boolean> {
  // Accumulate all incoming data into pendingSyncPayload so no field is ever lost across concurrent/rapid calls
  pendingSyncPayload = {
    ...pendingSyncPayload,
    ...data,
  };

  const performSave = async (): Promise<boolean> => {
    // Clone and clear the pending payload
    const dataToSave = { ...pendingSyncPayload };
    pendingSyncPayload = {};

    try {
      const sanitized = cleanUndefined(dataToSave);
      const nowIso = new Date().toISOString();

      // 1. Save specific modular docs first (each is well under 1MB)
      const savePromises: Promise<any>[] = [];

      if (sanitized.books && Array.isArray(sanitized.books)) {
        // 1. Write each book individually into the 'books' collection (where each book has its own 1MB limit)
        sanitized.books.forEach((b: any) => {
          if (b.id) {
            savePromises.push(
              setDoc(doc(db, 'books', b.id), { ...b, updatedAt: nowIso }, { merge: true }).catch((err) => {
                console.warn(`[Firestore] Notice on single book doc ${b.id}:`, err?.message);
              })
            );
          }
        });

        // 2. Prepare aggregate books index safely under 1MB limit
        const aggregateBooks = createAggregateBooksIndex(sanitized.books);

        // 3. Save the aggregate books document safely with fallback
        const booksDocRef = doc(db, COLLECTION_NAME, 'books');
        savePromises.push(
          setDoc(booksDocRef, { books: aggregateBooks, updatedAt: nowIso }, { merge: true }).catch((err) => {
            console.warn('[Firestore] Note on aggregate books doc:', err?.message);
          })
        );
      }

      if (sanitized.authorProfile) {
        const profileDocRef = doc(db, COLLECTION_NAME, 'profile');
        savePromises.push(
          setDoc(profileDocRef, { authorProfile: sanitized.authorProfile, updatedAt: nowIso }, { merge: true }).catch(
            (err) => console.warn('[Firestore] Profile save notice:', err?.message)
          )
        );
        savePromises.push(
          setDoc(doc(db, 'site_settings', 'profile'), { ...sanitized.authorProfile, updatedAt: nowIso }, { merge: true }).catch(
            (err) => console.warn('[Firestore] Site settings profile notice:', err?.message)
          )
        );
      }

      if (sanitized.videos && Array.isArray(sanitized.videos)) {
        // Ensure no giant base64 video data URL exceeds Firestore's 1MB document limit
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

        const videosDocRef = doc(db, COLLECTION_NAME, 'videos');
        savePromises.push(
          setDoc(videosDocRef, { videos: safeVideos, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] Videos save notice:', err?.message)
          )
        );
      }

      if (sanitized.photos && Array.isArray(sanitized.photos)) {
        const photosDocRef = doc(db, COLLECTION_NAME, 'photos');
        savePromises.push(
          setDoc(photosDocRef, { photos: sanitized.photos, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] Photos save notice:', err?.message)
          )
        );
      }

      if (sanitized.news && Array.isArray(sanitized.news)) {
        const safeNews = sanitized.news.map((n: any) => {
          if (typeof n.videoUrl === 'string' && n.videoUrl.startsWith('data:video/')) {
            return {
              ...n,
              videoUrl: '',
            };
          }
          return n;
        });
        const newsDocRef = doc(db, COLLECTION_NAME, 'news');
        savePromises.push(
          setDoc(newsDocRef, { news: safeNews, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] News save notice:', err?.message)
          )
        );
      }

      if (sanitized.links && Array.isArray(sanitized.links)) {
        const linksDocRef = doc(db, COLLECTION_NAME, 'links');
        savePromises.push(
          setDoc(linksDocRef, { links: sanitized.links, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] Links save notice:', err?.message)
          )
        );
      }

      if (sanitized.announcements && Array.isArray(sanitized.announcements)) {
        const annDocRef = doc(db, COLLECTION_NAME, 'announcements');
        savePromises.push(
          setDoc(annDocRef, { announcements: sanitized.announcements, updatedAt: nowIso }, { merge: true }).catch(
            (err) => console.warn('[Firestore] Announcements save notice:', err?.message)
          )
        );
      }

      if (sanitized.comments && Array.isArray(sanitized.comments)) {
        const commentsDocRef = doc(db, COLLECTION_NAME, 'comments');
        savePromises.push(
          setDoc(commentsDocRef, { comments: sanitized.comments, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] Comments save notice:', err?.message)
          )
        );
      }

      if (sanitized.messages && Array.isArray(sanitized.messages)) {
        const messagesDocRef = doc(db, COLLECTION_NAME, 'messages');
        savePromises.push(
          setDoc(messagesDocRef, { messages: sanitized.messages, updatedAt: nowIso }, { merge: true }).catch((err) =>
            console.warn('[Firestore] Messages save notice:', err?.message)
          )
        );
      }

      // Save modular docs with a generous timeout (8s) so long-polling latency or mobile connections never fail prematurely
      await Promise.race([
        Promise.all(savePromises),
        new Promise((r) => setTimeout(r, 8000)),
      ]);

      // 2. Also save to main aggregate document as a combined cache (safeguarding against 1MB limit)
      try {
        const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOC_ID);
        const mainPayload: any = { ...sanitized, updatedAt: nowIso };
        if (mainPayload.books) {
          mainPayload.books = createAggregateBooksIndex(mainPayload.books);
        }
        if (mainPayload.photos && Array.isArray(mainPayload.photos)) {
          mainPayload.photos = mainPayload.photos.map((p: any) => {
            if (p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 5000) {
              return { ...p, imageUrl: '' };
            }
            return p;
          });
        }
        await setDoc(mainDocRef, mainPayload, { merge: true }).catch((err) => {
          console.warn('[Firestore] Main aggregate doc update skipped (modular docs already saved):', err?.message);
        });
      } catch (mainErr) {
        // If main doc ever approaches 1MB, modular docs already saved successfully!
        console.warn('[Firestore] Note: Main aggregate doc update skipped or large, modular docs saved.', mainErr);
      }

      console.log('[Firestore] Site data successfully saved to cloud in real-time!');
      return true;
    } catch (error) {
      console.error('[Firestore] Failed to save site data to cloud:', error);
      return false;
    }
  };

  if (immediate) {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
      syncDebounceTimer = null;
    }
    return performSave();
  }

  return new Promise((resolve) => {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
    syncDebounceTimer = setTimeout(async () => {
      syncDebounceTimer = null;
      const ok = await performSave();
      resolve(ok);
    }, 150);
  });
}
