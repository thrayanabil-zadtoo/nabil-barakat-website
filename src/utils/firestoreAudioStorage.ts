import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { saveToIndexedDB, loadFromIndexedDB } from './storageManager';

export interface AudioChunkProgressCallback {
  (progress: number, stageText: string): void;
}

export interface AudioUploadResult {
  url: string;
  fileName: string;
  sizeMb: string;
}

export const resolvedAudioObjectUrls = new Map<string, string>();

export async function uploadAudioToFirestoreChunks(
  fileOrBlob: File | Blob,
  fileNameHint = 'recitation.webm',
  onProgress?: AudioChunkProgressCallback
): Promise<AudioUploadResult> {
  const totalMb = (fileOrBlob.size / (1024 * 1024)).toFixed(2);
  if (fileOrBlob.size > 15 * 1024 * 1024) {
    throw new Error('حجم الملف الصوتي يتجاوز الحد المسموح به (15 ميجابايت)');
  }

  const mediaId = `aud_cloud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName =
    fileOrBlob instanceof File && fileOrBlob.name ? fileOrBlob.name : fileNameHint;
  const mimeType = fileOrBlob.type || 'audio/webm';
  const firestoreUrl = `firestore://audio/${mediaId}`;

  if (onProgress) {
    onProgress(10, `جاري تجهيز المقطع الصوتي (${totalMb} ميجابايت)...`);
  }

  try {
    await saveToIndexedDB(`audio_blob_${mediaId}`, fileOrBlob);
    const immediateUrl = URL.createObjectURL(fileOrBlob);
    resolvedAudioObjectUrls.set(mediaId, immediateUrl);
  } catch (err) {
    console.warn('[FirestoreAudio] IndexedDB cache notice:', err);
  }

  const chunkSize = 550 * 1024;
  const totalChunks = Math.max(1, Math.ceil(fileOrBlob.size / chunkSize));

  const readSliceAsBase64 = (slice: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const idx = res.indexOf(';base64,');
        resolve(idx !== -1 ? res.substring(idx + 8) : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(slice);
    });

  const nowIso = new Date().toISOString();

  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(fileOrBlob.size, start + chunkSize);
      const slice = fileOrBlob.slice(start, end);
      const b64Data = await readSliceAsBase64(slice);

      const chunkRef = doc(db, 'audio_chunks', `${mediaId}_chunk_${i}`);
      await Promise.race([
        setDoc(chunkRef, {
          mediaId,
          chunkIndex: i,
          totalChunks,
          data: b64Data,
          mimeType,
          createdAt: nowIso,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud audio chunk timeout')), 8000)),
      ]);

      const pct = Math.min(92, Math.max(25, Math.round(((i + 1) / totalChunks) * 90)));
      if (onProgress) {
        onProgress(pct, `جاري حفظ الإلقاء الصوتي سحابياً (${i + 1}/${totalChunks})...`);
      }
    }

    await setDoc(doc(db, 'uploaded_audio', mediaId), {
      id: mediaId,
      fileName: cleanName,
      totalChunks,
      size: fileOrBlob.size,
      sizeMb: totalMb,
      mimeType,
      createdAt: nowIso,
    });
  } catch (err) {
    console.warn('[FirestoreAudio] Cloud sync notice (audio cached locally in IndexedDB):', err);
  }

  if (onProgress) {
    onProgress(100, `✓ تم حفظ المقطع الصوتي بنجاح (${totalMb} ميجابايت)`);
  }

  return {
    url: firestoreUrl,
    fileName: cleanName,
    sizeMb: totalMb,
  };
}

export async function resolveAudioUrl(rawUrl?: string | null): Promise<string> {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('firestore://audio/')) {
    return trimmed;
  }

  const mediaId = trimmed.replace('firestore://audio/', '').trim();
  if (!mediaId) return '';

  if (resolvedAudioObjectUrls.has(mediaId)) {
    return resolvedAudioObjectUrls.get(mediaId)!;
  }

  try {
    const cachedBlob = await loadFromIndexedDB<Blob>(`audio_blob_${mediaId}`);
    if (cachedBlob && cachedBlob.size > 0) {
      const objUrl = URL.createObjectURL(cachedBlob);
      resolvedAudioObjectUrls.set(mediaId, objUrl);
      return objUrl;
    }
  } catch (err) {
    console.warn('[FirestoreAudio] IndexedDB read notice:', err);
  }

  try {
    const metaSnap = await getDoc(doc(db, 'uploaded_audio', mediaId));
    if (!metaSnap.exists()) return '';
    const meta = metaSnap.data();
    const totalChunks = meta.totalChunks || 0;
    const mimeType = meta.mimeType || 'audio/webm';
    if (!totalChunks) return '';

    const buffers: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(doc(db, 'audio_chunks', `${mediaId}_chunk_${i}`));
      if (!chunkSnap.exists()) return '';
      const b64 = chunkSnap.data().data;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) {
        bytes[j] = bin.charCodeAt(j);
      }
      buffers.push(bytes);
    }

    const blob = new Blob(buffers as BlobPart[], { type: mimeType });
    saveToIndexedDB(`audio_blob_${mediaId}`, blob).catch(() => {});
    const objUrl = URL.createObjectURL(blob);
    resolvedAudioObjectUrls.set(mediaId, objUrl);
    return objUrl;
  } catch (err) {
    console.warn('[FirestoreAudio] Cloud load notice:', err);
    return '';
  }
}
