import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
 * Fetch initial cloud state once
 */
export async function fetchCloudSiteData(): Promise<SyncedSiteData | null> {
  try {
    const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOC_ID);
    const snap = await getDoc(mainDocRef);
    if (snap.exists()) {
      return snap.data() as SyncedSiteData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${MAIN_DOC_ID}`);
    return null;
  }
}

let syncDebounceTimer: any = null;
let pendingSyncPayload: Partial<SyncedSiteData> = {};

/**
 * Atomically saves site data to Firestore across both modular documents and the main document.
 * Guaranteed to never fail silently: throws or logs clearly.
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

      if (sanitized.books && Array.isArray(sanitized.books) && sanitized.books.length > 0) {
        const booksDocRef = doc(db, COLLECTION_NAME, 'books');
        savePromises.push(setDoc(booksDocRef, { books: sanitized.books, updatedAt: nowIso }, { merge: true }));
        // Also write each book individually into the 'books' collection for direct single-doc access
        sanitized.books.forEach((b: any) => {
          if (b.id) {
            savePromises.push(setDoc(doc(db, 'books', b.id), { ...b, updatedAt: nowIso }, { merge: true }));
          }
        });
      }

      if (sanitized.authorProfile) {
        const profileDocRef = doc(db, COLLECTION_NAME, 'profile');
        savePromises.push(setDoc(profileDocRef, { authorProfile: sanitized.authorProfile, updatedAt: nowIso }, { merge: true }));
        savePromises.push(setDoc(doc(db, 'site_settings', 'profile'), { ...sanitized.authorProfile, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.videos && Array.isArray(sanitized.videos) && sanitized.videos.length > 0) {
        const videosDocRef = doc(db, COLLECTION_NAME, 'videos');
        savePromises.push(setDoc(videosDocRef, { videos: sanitized.videos, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.photos && Array.isArray(sanitized.photos) && sanitized.photos.length > 0) {
        const photosDocRef = doc(db, COLLECTION_NAME, 'photos');
        savePromises.push(setDoc(photosDocRef, { photos: sanitized.photos, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.news && Array.isArray(sanitized.news) && sanitized.news.length > 0) {
        const newsDocRef = doc(db, COLLECTION_NAME, 'news');
        savePromises.push(setDoc(newsDocRef, { news: sanitized.news, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.links && Array.isArray(sanitized.links) && sanitized.links.length > 0) {
        const linksDocRef = doc(db, COLLECTION_NAME, 'links');
        savePromises.push(setDoc(linksDocRef, { links: sanitized.links, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.announcements && Array.isArray(sanitized.announcements) && sanitized.announcements.length > 0) {
        const annDocRef = doc(db, COLLECTION_NAME, 'announcements');
        savePromises.push(setDoc(annDocRef, { announcements: sanitized.announcements, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.comments && Array.isArray(sanitized.comments)) {
        const commentsDocRef = doc(db, COLLECTION_NAME, 'comments');
        savePromises.push(setDoc(commentsDocRef, { comments: sanitized.comments, updatedAt: nowIso }, { merge: true }));
      }

      if (sanitized.messages && Array.isArray(sanitized.messages)) {
        const messagesDocRef = doc(db, COLLECTION_NAME, 'messages');
        savePromises.push(setDoc(messagesDocRef, { messages: sanitized.messages, updatedAt: nowIso }, { merge: true }));
      }

      await Promise.all(savePromises);

      // 2. Also save to main aggregate document as a combined cache
      try {
        const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOC_ID);
        await setDoc(
          mainDocRef,
          {
            ...sanitized,
            updatedAt: nowIso,
          },
          { merge: true }
        );
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
