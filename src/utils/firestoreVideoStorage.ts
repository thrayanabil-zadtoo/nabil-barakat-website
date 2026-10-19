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
 * Uploads a video directly to Firestore in safe chunks (under 600KB each),
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

  // Maximum recommended limit for direct database-chunked upload to stay safely within free Firestore write quotas
  if (file.size > 22 * 1024 * 1024) {
    throw new Error(
      `حجم الفيديو (${totalMb} ميجابايت) كبير للرفع المباشر كأجزاء قاعدة بيانات مجانية. الحد الأقصى للملفات المباشرة هو 20 ميجابايت لتجنب تجاوز باقة السحابة. يُرجى وضع رابط الفيديو من YouTube أو Vimeo أو TikTok لبث غير محدود.`
    );
  }

  // Set up cancellation controller
  activeUploadController = { isCancelled: false };
  const controller = activeUploadController;

  if (onProgress) {
    onProgress(5, `بدء تهيئة الرفع السحابي للفيديو (${totalMb} ميجابايت)...`);
  }

  // 1. Immediately cache the raw file in IndexedDB on this device for instant local playback
  try {
    await saveToIndexedDB(`video_blob_${mediaId}`, file);
    const immediateBlobUrl = URL.createObjectURL(file);
    resolvedVideoObjectUrls.set(mediaId, immediateBlobUrl);
  } catch (idbErr) {
    console.warn('[FirestoreVideo] Notice caching in IndexedDB:', idbErr);
  }

  // 2. Slice file into safe 580KB chunks (reduces write calls by half compared to 380KB)
  const chunkSize = 580 * 1024; // 580KB binary -> ~773KB base64 (well under 1MB limit)
  const totalChunks = Math.ceil(file.size / chunkSize);

  if (onProgress) {
    onProgress(10, `جاري تشفير وتجهيز الفيديو (${totalChunks} أجزاء مؤمنة)...`);
  }

  // Helper to read a slice as base64
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

  // Helper to write a single chunk with a strict 12-second timeout and 1 retry
  const writeChunkWithTimeout = async (chunkIndex: number, sliceBlob: Blob, attempt = 1): Promise<void> => {
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
      setTimeout(() => reject(new Error('انتهت مهلة استجابة السحابة لهذا الجزء (يرجى التحقق من سرعة الاتصال)')), 12000)
    );

    try {
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err: any) {
      if (controller.isCancelled) throw new Error('تم إلغاء عملية الرفع.');

      const errMsg = String(err?.message || '');
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || err?.code === 'resource-exhausted') {
        throw new Error(
          'تجاوزت عمليات الرفع السحابي اليومية حد باقة Firebase المجانية. يُرجى وضع رابط الفيديو (YouTube أو Vimeo أو TikTok) في الخانة المخصصة ليعمل فوراً دون حدود.'
        );
      }

      if (attempt < 2) {
        console.warn(`[FirestoreVideo] Retrying chunk ${chunkIndex + 1} (attempt ${attempt + 1})...`);
        await new Promise((r) => setTimeout(r, 600));
        return writeChunkWithTimeout(chunkIndex, sliceBlob, attempt + 1);
      }
      throw err;
    }
  };

  // 3. Upload chunks sequentially in small batches of 2 with brief resting pauses to prevent rate-limiting
  const batchSize = 2;
  for (let i = 0; i < totalChunks; i += batchSize) {
    if (controller.isCancelled) {
      throw new Error('تم إلغاء عملية الرفع من قبل المستخدم.');
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

    // Small breather between network bursts
    await new Promise((r) => setTimeout(r, 70));

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
    onProgress(95, 'جاري توثيق وتثبيت بيانات الفيديو في السحابة...');
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

  activeUploadController = null;

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
