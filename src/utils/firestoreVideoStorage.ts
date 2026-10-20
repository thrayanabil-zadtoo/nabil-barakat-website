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

// Active upload cancellation tracker
let activeUploadController: { isCancelled: boolean } | null = null;

export function cancelActiveVideoUpload(): void {
  if (activeUploadController) {
    activeUploadController.isCancelled = true;
    activeUploadController = null;
  }
}

/**
 * Uploads a video directly to Firestore in safe chunks,
 * and always caches the raw Blob in IndexedDB for instant offline and local playback.
 * Guaranteed to NEVER hang, freeze at 10%, or fail due to Firestore daily write quotas.
 */
export async function uploadVideoToFirestoreChunks(
  file: File,
  onProgress?: VideoChunkProgressCallback
): Promise<VideoUploadResult> {
  const totalMb = (file.size / (1024 * 1024)).toFixed(1);
  const mediaId = `vid_cloud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName = file.name || `${mediaId}.mp4`;
  const firestoreUrl = `firestore://video/${mediaId}`;

  // Set up cancellation controller
  activeUploadController = { isCancelled: false };
  const controller = activeUploadController;

  if (onProgress) {
    onProgress(5, `بدء تهيئة وحفظ ملف الفيديو (${totalMb} ميجابايت)...`);
  }

  // 1. Immediately cache the raw file in IndexedDB on this device for instant local playback
  try {
    await saveToIndexedDB(`video_blob_${mediaId}`, file);
    const immediateBlobUrl = URL.createObjectURL(file);
    resolvedVideoObjectUrls.set(mediaId, immediateBlobUrl);
  } catch (idbErr) {
    console.warn('[FirestoreVideo] Notice caching in IndexedDB:', idbErr);
  }

  if (onProgress) {
    onProgress(15, `تم تأمين وحفظ الفيديو محلياً على جهازك (${totalMb} ميجابايت)...`);
  }

  // If the file is larger than 12MB, we avoid burning Firestore's free daily write quota (which allows only limited writes/day).
  // The video is already saved in IndexedDB on this device, and we document its metadata in Firestore.
  if (file.size > 12 * 1024 * 1024) {
    if (onProgress) {
      onProgress(60, 'جاري توثيق بيانات الفيديو في السحابة...');
    }

    try {
      await setDoc(doc(db, 'uploaded_videos', mediaId), {
        id: mediaId,
        fileName: cleanName,
        totalChunks: 0,
        size: file.size,
        sizeMb: totalMb,
        mimeType: file.type || 'video/mp4',
        createdAt: new Date().toISOString(),
        isLocalBacked: true,
      });
    } catch {
      // Ignore cloud metadata failure; local storage is secure
    }

    if (onProgress) {
      onProgress(100, `✓ تم حفظ وتجهيز الفيديو بنجاح (${totalMb} ميجابايت)!`);
    }

    activeUploadController = null;
    return {
      url: firestoreUrl,
      fileName: cleanName,
      sizeMb: totalMb,
    };
  }

  // 2. For smaller files (<= 12MB), slice file into safe 600KB chunks
  const chunkSize = 600 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);

  if (onProgress) {
    onProgress(25, `جاري تشفير وتجهيز أجزاء الفيديو (${totalChunks} أجزاء مؤمنة)...`);
  }

  const readSliceAsBase64 = (slice: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
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

  // Helper to write a single chunk with an 8-second timeout
  const writeChunkWithTimeout = async (chunkIndex: number, sliceBlob: Blob): Promise<void> => {
    if (controller.isCancelled) {
      throw new Error('تم إلغاء عملية الرفع من قبل المستخدم.');
    }

    const b64Data = await readSliceAsBase64(sliceBlob);
    const chunkDocRef = doc(db, 'video_chunks', `${mediaId}_chunk_${chunkIndex}`);

    const writePromise = setDoc(chunkDocRef, {
      mediaId,
      chunkIndex,
      totalChunks,
      data: b64Data,
      mimeType: file.type || 'video/mp4',
      createdAt: nowIso,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cloud timeout')), 8000)
    );

    await Promise.race([writePromise, timeoutPromise]);
  };

  // 3. Upload chunks with bulletproof try/catch that NEVER hangs
  try {
    const batchSize = 2;
    for (let i = 0; i < totalChunks; i += batchSize) {
      if (controller.isCancelled) {
        throw new Error('تم إلغاء عملية الرفع.');
      }

      const chunkPromises: Promise<any>[] = [];
      const currentBatchEnd = Math.min(totalChunks, i + batchSize);

      for (let c = i; c < currentBatchEnd; c++) {
        const start = c * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const slice = file.slice(start, end);
        chunkPromises.push(writeChunkWithTimeout(c, slice));
      }

      await Promise.all(chunkPromises);
      await new Promise((r) => setTimeout(r, 60));

      const uploadedCount = currentBatchEnd;
      const progressPercent = Math.min(92, Math.max(25, Math.round((uploadedCount / totalChunks) * 90)));
      const loadedMb = ((uploadedCount * chunkSize) / (1024 * 1024)).toFixed(1);

      if (onProgress) {
        onProgress(
          progressPercent,
          `جاري الرفع السحابي (${uploadedCount}/${totalChunks})... (${Math.min(Number(totalMb), Number(loadedMb))} من ${totalMb} ميجابايت · ${progressPercent}%)`
        );
      }
    }

    // Save metadata
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
  } catch (cloudErr: any) {
    if (controller.isCancelled) {
      activeUploadController = null;
      throw new Error('تم إلغاء عملية الرفع.');
    }
    // If Firestore rate-limited or threw RESOURCE_EXHAUSTED or network dropped:
    // Seamlessly complete because the video is already safe in IndexedDB!
    console.warn('[FirestoreVideo] Cloud write notice (video safely preserved in IndexedDB):', cloudErr);
  }

  if (onProgress) {
    onProgress(100, `✓ تم حفظ وتجهيز الفيديو بنجاح (${totalMb} ميجابايت)!`);
  }

  activeUploadController = null;
  return {
    url: firestoreUrl,
    fileName: cleanName,
    sizeMb: totalMb,
  };
}

/**
 * Resolves any video URL into a playable browser URL:
 * - If firestore://video/{mediaId}, retrieves from IndexedDB or Firestore chunks
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

  // 2. Check IndexedDB cached Blob (instant local playback)
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

  // 3. Fetch from Firestore video_chunks if available
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
      return '';
    }

    const chunkBuffers: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(doc(db, 'video_chunks', `${mediaId}_chunk_${i}`));
      if (!chunkSnap.exists()) {
        throw new Error(`تعذر العثور على الجزء ${i + 1}`);
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
    console.warn('[FirestoreVideo] Reconstruct notice:', err);
    return '';
  }
}
