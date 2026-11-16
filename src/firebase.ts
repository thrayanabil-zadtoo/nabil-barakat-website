import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Force HTTP long-polling so preview iframes, proxies, and mobile WebViews connect immediately without 10s WebChannel timeouts
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Export storage and auth
export const storage = getStorage(app);
export const auth = getAuth(app);

// Validate connection to Firestore server non-blockingly on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Retry once after brief cold-start delay before reporting offline
      await new Promise((r) => setTimeout(r, 1500));
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        return;
      } catch (retryErr) {
        if (retryErr instanceof Error && retryErr.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    }
  }
}
void testConnection();

export default app;
