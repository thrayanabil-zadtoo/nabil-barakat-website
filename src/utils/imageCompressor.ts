/**
 * Utility to compress and resize images before storing in state/localStorage/IndexedDB.
 * Prevents localStorage QuotaExceededError while maintaining high visual quality.
 */

export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's already a small asset path (like /author.jpg or /src/assets/...), return as is
    if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:image/')) {
      resolve(fileOrDataUrl);
      return;
    }

    const img = new Image();

    const processImage = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback if canvas context fails
        if (typeof fileOrDataUrl === 'string') {
          resolve(fileOrDataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrDataUrl);
        }
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as optimized JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onload = processImage;
    img.onerror = () => {
      // Fallback
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
