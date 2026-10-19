/**
 * Unified Cloud Video Upload Helper
 * Intelligently routes between:
 * 1. Express backend /api/upload-video (when running with server backend)
 * 2. Cloud Firestore Chunked Storage (when hosted on static Firebase Hosting like nb.zadtoo.com)
 * Guaranteed to never fail with "Unexpected token '<', <!doctype..."!
 */

import { uploadVideoToFirestoreChunks, VideoUploadResult } from './firestoreVideoStorage';

export type { VideoUploadResult };

export interface VideoUploadProgressCallback {
  (progress: number, stageText: string): void;
}

/**
 * Checks whether the current host is a purely static Firebase Hosting environment
 */
function isStaticFirebaseHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host === 'nb.zadtoo.com' ||
    host.endsWith('.web.app') ||
    host.endsWith('.firebaseapp.com')
  );
}

/**
 * Uploads a video file with live byte-level progress and guaranteed cloud persistence.
 */
export function uploadVideoToServer(
  file: File,
  onProgress?: VideoUploadProgressCallback
): Promise<VideoUploadResult> {
  const totalMb = (file.size / (1024 * 1024)).toFixed(1);

  if (file.size > 150 * 1024 * 1024) {
    const err = new Error('حجم ملف الفيديو يتجاوز الحد الأقصى المسموح به (150 ميجابايت)');
    if (onProgress) onProgress(0, 'حجم الملف كبير جداً');
    return Promise.reject(err);
  }

  // If on static Firebase Hosting (nb.zadtoo.com), route directly to Cloud Firestore Chunks
  if (isStaticFirebaseHost()) {
    console.log('[VideoUpload] Detected Firebase Hosting domain (nb.zadtoo.com). Using direct Cloud Firestore Chunked Storage.');
    return uploadVideoToFirestoreChunks(file, onProgress);
  }

  return new Promise((resolve, reject) => {
    if (onProgress) {
      onProgress(5, `بدء تهيئة الرفع السحابي لملف الفيديو (${totalMb} ميجابايت)...`);
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('video', file);

    // Track real network upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
        const rawPercent = Math.round((e.loaded / e.total) * 90);
        const percent = Math.min(92, Math.max(8, rawPercent));
        onProgress(
          percent,
          `جاري رفع ملف الفيديو فعلياً إلى السحابة... (${loadedMb} من ${totalMb} ميجابايت · ${percent}%)`
        );
      }
    };

    xhr.onload = () => {
      const responseText = xhr.responseText ? xhr.responseText.trim() : '';
      const contentType = xhr.getResponseHeader('content-type') || '';

      // Check if host returned HTML (like Firebase Hosting rewriting 404 to index.html)
      if (responseText.startsWith('<!') || contentType.includes('text/html') || xhr.status === 404) {
        console.warn('[VideoUpload] /api/upload-video returned HTML (static host detected). Falling back to Cloud Firestore Chunked Storage...');
        uploadVideoToFirestoreChunks(file, onProgress)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(responseText);
          if (res.success && res.url) {
            if (onProgress) {
              onProgress(100, `✓ اكتمل رفع وحفظ الفيديو سحابياً بنجاح! (${res.sizeMb} ميجابايت)`);
            }
            resolve({
              url: res.url,
              fileName: res.fileName,
              sizeMb: res.sizeMb,
            });
          } else {
            console.warn('[VideoUpload] Server response not successful, attempting Firestore fallback...', res.error);
            uploadVideoToFirestoreChunks(file, onProgress)
              .then(resolve)
              .catch(reject);
          }
        } catch {
          console.warn('[VideoUpload] JSON parse failed, falling back to Cloud Firestore Storage...');
          uploadVideoToFirestoreChunks(file, onProgress)
            .then(resolve)
            .catch(reject);
        }
      } else {
        console.warn(`[VideoUpload] Server status ${xhr.status}, falling back to Cloud Firestore Storage...`);
        uploadVideoToFirestoreChunks(file, onProgress)
          .then(resolve)
          .catch(reject);
      }
    };

    xhr.onerror = () => {
      console.warn('[VideoUpload] Network error on /api/upload-video, falling back to Cloud Firestore Storage...');
      uploadVideoToFirestoreChunks(file, onProgress)
        .then(resolve)
        .catch(reject);
    };

    xhr.ontimeout = () => {
      console.warn('[VideoUpload] Timeout on /api/upload-video, falling back to Cloud Firestore Storage...');
      uploadVideoToFirestoreChunks(file, onProgress)
        .then(resolve)
        .catch(reject);
    };

    xhr.open('POST', '/api/upload-video', true);
    // 45 seconds timeout before fallback
    xhr.timeout = 45 * 1000;
    xhr.send(formData);
  });
}
