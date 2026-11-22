import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Auto-detect long-polling only when needed (avoids forced long-polling stalls on standard HTTP/2 networks
// while still falling back automatically inside restrictive proxies or embedded iframes).
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    experimentalLongPollingOptions: {
      timeoutSeconds: 20,
    },
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Export storage and auth
export const storage = getStorage(app);
export const auth = getAuth(app);

// Validate connection to Firestore server non-blockingly on boot
async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    window.addEventListener(
      'online',
      () => {
        void testConnection();
      },
      { once: true }
    );
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      // Retry once after brief cold-start delay before reporting offline
      await new Promise((r) => setTimeout(r, 2500));
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        return;
      } catch (retryErr) {
        if (retryErr instanceof Error && retryErr.message.includes('the client is offline')) {
          console.warn('Firestore backend temporarily unreachable; operating with local cache until connection resumes.');
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    void testConnection();
  }, 500);
}

export default app;
