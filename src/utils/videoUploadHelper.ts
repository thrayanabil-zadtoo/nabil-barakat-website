/**
 * Real Video Upload Helper
 * Handles streaming multipart file uploads to the backend `/api/upload-video` endpoint,
 * providing real network upload progress (0% -> 100%) and permanent URL generation.
 */

export interface VideoUploadProgressCallback {
  (progress: number, stageText: string): void;
}

export interface VideoUploadResult {
  url: string;
  fileName: string;
  sizeMb: string;
}

/**
 * Uploads a real video file to the server with live byte-level network upload tracking.
 */
export function uploadVideoToServer(
  file: File,
  onProgress?: VideoUploadProgressCallback
): Promise<VideoUploadResult> {
  return new Promise((resolve, reject) => {
    const totalMb = (file.size / (1024 * 1024)).toFixed(1);

    if (file.size > 150 * 1024 * 1024) {
      const err = new Error('حجم ملف الفيديو يتجاوز الحد الأقصى المسموح به (150 ميجابايت)');
      if (onProgress) onProgress(0, 'حجم الملف كبير جداً');
      return reject(err);
    }

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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
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
            const msg = res.error || 'فشل معالجة ملف الفيديو على الخادم';
            if (onProgress) onProgress(0, msg);
            reject(new Error(msg));
          }
        } catch (e: any) {
          if (onProgress) onProgress(0, 'خطأ في قراءة رد الخادم');
          reject(e);
        }
      } else {
        const msg = `فشل الرفع السحابي (رمز الاستجابة: ${xhr.status})`;
        if (onProgress) onProgress(0, msg);
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      const msg = 'تعذر الاتصال بخادم رفع الفيديوهات، يرجى التحقق من اتصال الإنترنت.';
      if (onProgress) onProgress(0, msg);
      reject(new Error(msg));
    };

    xhr.ontimeout = () => {
      const msg = 'انتهت مهلة رفع الفيديو، يرجى التأكد من سرعة الاتصال وإعادة المحاولة.';
      if (onProgress) onProgress(0, msg);
      reject(new Error(msg));
    };

    xhr.open('POST', '/api/upload-video', true);
    // 5 minutes timeout for large video uploads
    xhr.timeout = 5 * 60 * 1000;
    xhr.send(formData);
  });
}
