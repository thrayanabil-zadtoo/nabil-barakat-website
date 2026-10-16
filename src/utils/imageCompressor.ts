/**
 * Utility to compress and resize images before storing in state/localStorage/IndexedDB.
 * Prevents localStorage QuotaExceededError while maintaining high visual quality.
 */

export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 640,
  maxHeight = 900,
  quality = 0.72
): Promise<string> => {
  return new Promise((resolve) => {
    // Safety timeout: Never hang at 45% under any circumstances
    const safetyTimer = setTimeout(() => {
      console.warn('[ImageCompressor] Safety timeout reached, using direct fallback');
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    }, 4500);

    // If it's already an existing asset path or URL (not base64), return as is
    if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:image/')) {
      clearTimeout(safetyTimer);
      resolve(fileOrDataUrl);
      return;
    }

    const img = new Image();

    const processImage = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          clearTimeout(safetyTimer);
          if (typeof fileOrDataUrl === 'string') resolve(fileOrDataUrl);
          else {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(fileOrDataUrl);
          }
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(safetyTimer);
          if (typeof fileOrDataUrl === 'string') resolve(fileOrDataUrl);
          else {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(fileOrDataUrl);
          }
          return;
        }

        // High quality smooth resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        clearTimeout(safetyTimer);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('[ImageCompressor] Canvas compression error:', err);
        clearTimeout(safetyTimer);
        if (typeof fileOrDataUrl === 'string') resolve(fileOrDataUrl);
        else {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrDataUrl);
        }
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      clearTimeout(safetyTimer);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = (reader.result as string) || '';
      };
      reader.onerror = () => {
        clearTimeout(safetyTimer);
        resolve('');
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
