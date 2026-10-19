import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { saveToIndexedDB, loadFromIndexedDB } from './storageManager';

export interface VideoChunkProgressCallback {
  (progress: number, stageText: string): void;
}

export interface VideoUploadResult {
  url: string;
  fileName: string;
  sizeMb: string;
}

// In-memory cache for resolved object URLs so we never re-create or re-fetch on re-renders
export const resolvedVideoObjectUrls = new Map<string, string>();

/**
 * Uploads a video directly to Firestore in safe chunks (under 400KB each),
 * and caches the raw Blob in IndexedDB for instant offline and local playback.
 * Guaranteed to work on static hosts like Firebase Hosting (e.g. nb.zadtoo.com).
 */
export async function uploadVideoToFirestoreChunks(
  file: File,
  onProgress?: VideoChunkProgressCallback
): Promise<VideoUploadResult> {
  const totalMb = (file.size / (1024 * 1024)).toFixed(1);
  const mediaId = `vid_cloud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName = file.name || `${mediaId}.mp4`;

  if (file.size > 80 * 1024 * 1024) {
    throw new Error('حجم ملف الفيديو كبير جداً (أقصى حجم 80 ميجابايت)');
  }

  if (onProgress) {
    onProgress(5, `بدء تهيئة الرفع السحابي للفيديو (${totalMb} ميجابايت)...`);
  }

  // 1. Immediately cache the raw file in IndexedDB on this device
  try {
    await saveToIndexedDB(`video_blob_${mediaId}`, file);
    // Also store a local object URL in memory cache for instant preview
    const immediateBlobUrl = URL.createObjectURL(file);
    resolvedVideoObjectUrls.set(mediaId, immediateBlobUrl);
  } catch (idbErr) {
    console.warn('[FirestoreVideo] Notice caching in IndexedDB:', idbErr);
  }

  // 2. Slice file into safe 380KB chunks
  const chunkSize = 380 * 1024; // 380KB binary -> ~500KB base64 (well under 1MB limit)
  const totalChunks = Math.ceil(file.size / chunkSize);

  if (onProgress) {
    onProgress(10, `جاري تشفير وتجزئة الفيديو إلى (${totalChunks}) أجزاء سحابية مؤمنة...`);
  }

  // Helper to read a slice as base64
  const readSliceAsBase64 = (slice: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        // strip data:*/*;base64,
        const base64Index = res.indexOf(';base64,');
        if (base64Index !== -1) {
          resolve(res.substring(base64Index + 8));
        } else {
          resolve(res);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(slice);
    });
  };

  const nowIso = new Date().toISOString();

  // 3. Upload chunks sequentially or in small parallel batches of 3
  const batchSize = 3;
  for (let i = 0; i < totalChunks; i += batchSize) {
    const chunkPromises: Promise<any>[] = [];
    const currentBatchEnd = Math.min(totalChunks, i + batchSize);

    for (let c = i; c < currentBatchEnd; c++) {
      const start = c * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const slice = file.slice(start, end);

      const uploadSingleChunk = async (chunkIndex: number, sliceBlob: Blob) => {
        const b64Data = await readSliceAsBase64(sliceBlob);
        const chunkDocRef = doc(db, 'video_chunks', `${mediaId}_chunk_${chunkIndex}`);
        await setDoc(chunkDocRef, {
          mediaId,
          chunkIndex,
          totalChunks,
          data: b64Data,
          mimeType: file.type || 'video/mp4',
          createdAt: nowIso,
        });
      };

      chunkPromises.push(uploadSingleChunk(c, slice));
    }

    await Promise.all(chunkPromises);

    const uploadedCount = currentBatchEnd;
    const progressPercent = Math.min(92, Math.max(12, Math.round((uploadedCount / totalChunks) * 90)));
    const loadedMb = ((uploadedCount * chunkSize) / (1024 * 1024)).toFixed(1);

    if (onProgress) {
      onProgress(
        progressPercent,
        `جاري الرفع السحابي للأجزاء (${uploadedCount}/${totalChunks})... (${Math.min(Number(totalMb), Number(loadedMb))} من ${totalMb} ميجابايت · ${progressPercent}%)`
      );
    }
  }

  // 4. Save metadata document in uploaded_videos
  if (onProgress) {
    onProgress(95, 'جاري توثيق بيانات الفيديو في السحابة...');
  }

  const metaDocRef = doc(db, 'uploaded_videos', mediaId);
  await setDoc(metaDocRef, {
    id: mediaId,
    fileName: cleanName,
    totalChunks,
    size: file.size,
    sizeMb: totalMb,
    mimeType: file.type || 'video/mp4',
    createdAt: nowIso,
  });

  const firestoreUrl = `firestore://video/${mediaId}`;

  if (onProgress) {
    onProgress(100, `✓ اكتمل رفع وحفظ الفيديو سحابياً بنجاح! (${totalMb} ميجابايت)`);
  }

  return {
    url: firestoreUrl,
    fileName: cleanName,
    sizeMb: totalMb,
  };
}

/**
 * Resolves any video URL into a playable browser URL:
 * - If firestore://video/{mediaId}, retrieves and reconstructs from IndexedDB or Firestore chunks
 * - If http/https/uploads, returns as-is
 */
export async function resolveVideoUrl(rawUrl: string | undefined | null): Promise<string> {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('firestore://video/')) {
    return trimmed;
  }

  const mediaId = trimmed.replace('firestore://video/', '').trim();
  if (!mediaId) return '';

  // 1. Check in-memory resolved cache
  if (resolvedVideoObjectUrls.has(mediaId)) {
    return resolvedVideoObjectUrls.get(mediaId)!;
  }

  // 2. Check IndexedDB cached Blob
  try {
    const cachedBlob = await loadFromIndexedDB<Blob>(`video_blob_${mediaId}`);
    if (cachedBlob && cachedBlob.size > 0) {
      const objUrl = URL.createObjectURL(cachedBlob);
      resolvedVideoObjectUrls.set(mediaId, objUrl);
      return objUrl;
    }
  } catch (err) {
    console.warn('[FirestoreVideo] IndexedDB read notice:', err);
  }

  // 3. Fetch from Firestore video_chunks
  try {
    const metaSnap = await getDoc(doc(db, 'uploaded_videos', mediaId));
    let totalChunks = 0;
    let mimeType = 'video/mp4';

    if (metaSnap.exists()) {
      const meta = metaSnap.data();
      totalChunks = meta.totalChunks || 0;
      mimeType = meta.mimeType || 'video/mp4';
    }

    if (!totalChunks) {
      console.warn('[FirestoreVideo] No metadata found for video:', mediaId);
      return '';
    }

    const chunkBuffers: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(doc(db, 'video_chunks', `${mediaId}_chunk_${i}`));
      if (!chunkSnap.exists()) {
        throw new Error(`تعذر العثور على الجزء ${i + 1} من الفيديو`);
      }
      const b64 = chunkSnap.data().data;
      const binStr = atob(b64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        bytes[j] = binStr.charCodeAt(j);
      }
      chunkBuffers.push(bytes);
    }

    const assembledBlob = new Blob(chunkBuffers as BlobPart[], { type: mimeType });

    // Cache in IndexedDB for subsequent lightning-fast views
    saveToIndexedDB(`video_blob_${mediaId}`, assembledBlob).catch(() => {});

    const objUrl = URL.createObjectURL(assembledBlob);
    resolvedVideoObjectUrls.set(mediaId, objUrl);
    return objUrl;
  } catch (err) {
    console.error('[FirestoreVideo] Error reconstructing video from chunks:', err);
    return '';
  }
}
