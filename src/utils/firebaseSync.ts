import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuthorProfile, Book, VideoItem, PhotoItem, NewsItem, LinkItem, AnnouncementItem, VisitorComment, VisitorMessage } from '../types';

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
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
}

const CONTENT_DOC_PATH = 'site_content';
const CONTENT_DOC_ID = 'main';

// Subscribe to real-time cloud updates
export function subscribeToCloudSiteData(onUpdate: (data: SyncedSiteData) => void): () => void {
  const docRef = doc(db, CONTENT_DOC_PATH, CONTENT_DOC_ID);
  
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SyncedSiteData;
        onUpdate(data);
      }
    },
    (error) => {
      console.warn('[Firestore] Sync subscription notice:', error.message);
    }
  );

  return unsubscribe;
}

// Fetch once from Firestore
export async function fetchCloudSiteData(): Promise<SyncedSiteData | null> {
  const docRef = doc(db, CONTENT_DOC_PATH, CONTENT_DOC_ID);
  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as SyncedSiteData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${CONTENT_DOC_PATH}/${CONTENT_DOC_ID}`);
    return null;
  }
}

// Save all or partial site data to Firestore
let syncTimeout: any = null;
export async function saveSiteDataToCloud(data: Partial<SyncedSiteData>): Promise<void> {
  const docRef = doc(db, CONTENT_DOC_PATH, CONTENT_DOC_ID);
  
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      try {
        const payload = {
          ...data,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, payload, { merge: true });
        console.log('[Firestore] Site data successfully saved to cloud.');
        resolve();
      } catch (error) {
        console.error('[Firestore] Failed to save to cloud:', error);
        resolve();
      }
    }, 400);
  });
}
