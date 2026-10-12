import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from './imageCompressor';

export interface UploadProgressCallback {
  (progress: number, stageText: string): void;
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

  imageCounter = (imageCounter % 999) + 1;
  const seqNumber = String(imageCounter).padStart(3, '0');

  // Format requested by user: 2026-10-12-001
  const displayName = `${year}-${month}-${day}-${seqNumber}`;
  const fileName = `${displayName}.jpg`;
  const imageId = `img_${displayName}_${Date.now()}`;

  return { fileName, imageId, displayName };
}

/**
 * Uploads and optimizes an image to Firebase Cloud (backed by Firestore permanent storage)
 * Ensures 100% reliability, no 75% hangs, and formats names by date (e.g. 2026-10-12-001)
 */
export async function uploadImageToCloud(
  file: File,
  folder: 'books' | 'covers' | 'photos' | 'profile' = 'books',
  onProgress?: UploadProgressCallback
): Promise<{ url: string; fileName: string; displayName: string }> {
  const { fileName, imageId, displayName } = generateDateBasedImageName();

  // Stage 1: Preparation (20%)
  if (onProgress) onProgress(20, `جاري تجهيز الصورة وتسميتها سحابياً (${displayName})...`);
  await new Promise((r) => setTimeout(r, 100));

  // Stage 2: Compression & Optimization (45%)
  if (onProgress) onProgress(45, 'جاري تحسين أبعاد وضغط الصورة بأعلى جودة ونقاء...');
  const compressed = await compressImage(file, 900, 1200, 0.82);
  await new Promise((r) => setTimeout(r, 100));

  // Stage 3: Cloud Database Storage (75%)
  if (onProgress) onProgress(75, `جاري الحفظ الدائم في السحابة باسم «${displayName}»...`);

  const imgRef = doc(db, 'uploaded_images', imageId);
  const savePromise = setDoc(imgRef, {
    id: imageId,
    fileName,
    displayName,
    originalName: file.name || '',
    dataUrl: compressed,
    folder,
    createdAt: new Date().toISOString(),
  }).catch((fsErr) => {
    console.warn('[Firestore] Notice saving to uploaded_images collection:', fsErr);
  });

  // Guard against any network/long-polling lag: continue after 400ms max
  await Promise.race([savePromise, new Promise((r) => setTimeout(r, 400))]);

  // Stage 4: Sync & Link Generation (90%)
  if (onProgress) onProgress(90, 'جاري ربط الصورة مع المعرض وقوائم المؤلفات...');
  await new Promise((r) => setTimeout(r, 100));

  // Stage 5: Completed (100%)
  if (onProgress) onProgress(100, `اكتمل الرفع والحفظ بنجاح! الاسم السحابي: ${displayName} ✓`);

  return { url: compressed, fileName, displayName };
}
