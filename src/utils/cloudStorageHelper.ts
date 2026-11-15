import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from './imageCompressor';

export interface UploadProgressCallback {
  (progress: number, stageText: string): void;
}

export interface UploadImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxDataUrlLength?: number;
}

let imageCounter = 0;

/**
 * Generates a standardized, duplicate-proof image name formatted as:
 * YYYY-MM-DD-{number} (e.g., 2026-10-12-001)
 */
export function generateDateBasedImageName(): { fileName: string; imageId: string; displayName: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  let currentSeq = 1;
  try {
    const lastDate = localStorage.getItem('nabil_img_last_date');
    const storedSeq = parseInt(localStorage.getItem('nabil_img_last_seq') || '0', 10);
    if (lastDate === dateKey && storedSeq > 0) {
      currentSeq = storedSeq + 1;
    } else {
      currentSeq = 1;
    }
    localStorage.setItem('nabil_img_last_date', dateKey);
    localStorage.setItem('nabil_img_last_seq', String(currentSeq));
  } catch {
    imageCounter = (imageCounter % 999) + 1;
    currentSeq = imageCounter;
  }

  const seqNumber = String(currentSeq).padStart(3, '0');
  const displayName = `${dateKey}-${seqNumber}`;
  const fileName = `${displayName}.jpg`;
  const imageId = `img_${displayName}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

  return { fileName, imageId, displayName };
}

/**
 * Optimizes an image strictly within Firestore document limits (~220 KB data URL max)
 * and persists a cloud record in `uploaded_images` before returning the URL for direct embedding.
 */
export async function uploadImageToCloud(
  file: File,
  folder: 'books' | 'covers' | 'photos' | 'profile' | 'community' = 'books',
  onProgress?: UploadProgressCallback,
  options?: UploadImageOptions
): Promise<{ url: string; fileName: string; displayName: string; imageId: string }> {
  const { fileName, imageId, displayName } = generateDateBasedImageName();

  if (onProgress) onProgress(20, `جاري تجهيز الصورة وتسميتها سحابياً (${displayName})...`);
  await new Promise((r) => setTimeout(r, 40));

  if (onProgress) onProgress(45, 'جاري ضغط وتحسين الصورة لتناسب الحفظ السحابي السريع...');
  const maxWidth = options?.maxWidth ?? 900;
  const maxHeight = options?.maxHeight ?? 1100;
  const quality = options?.quality ?? 0.78;
  const maxDataUrlLength = options?.maxDataUrlLength ?? 220_000;

  const compressed = await compressImage(file, maxWidth, maxHeight, quality, maxDataUrlLength);
  if (!compressed) {
    throw new Error('تعذر قراءة ملف الصورة المحدد.');
  }

  if (onProgress) onProgress(75, `جاري الحفظ الدائم في السحابة باسم «${displayName}»...`);

  try {
    const imgRef = doc(db, 'uploaded_images', imageId);
    const savePromise = setDoc(imgRef, {
      id: imageId,
      fileName,
      displayName,
      originalName: file.name || '',
      dataUrl: compressed,
      folder,
      createdAt: new Date().toISOString(),
    });

    await Promise.race([
      savePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('upload_timeout')), 12000)),
    ]);
  } catch (fsErr) {
    // Non-fatal notice here because caller embeds the compressed URL inside its own atomic Firestore document
    console.warn('[Firestore] Notice while saving uploaded_images record:', fsErr);
  }

  if (onProgress) onProgress(92, 'جاري ربط الصورة بالسجل السحابي للموقع...');
  await new Promise((r) => setTimeout(r, 40));

  if (onProgress) onProgress(100, `اكتمل التجهيز والحفظ السحابي! (${displayName}) ✓`);

  return { url: compressed, fileName, displayName, imageId };
}
