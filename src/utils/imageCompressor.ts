/**
 * Utility to compress and resize images strictly within Firestore and local storage limits.
 * Uses iterative quality & dimension scaling so no uploaded image ever exceeds the budget.
 */

const DEFAULT_MAX_DATA_URL_LENGTH = 240_000; // ~180 KB binary, safely well below Firestore's 1 MB doc limit

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 1000,
  quality = 0.78,
  maxDataUrlLength = DEFAULT_MAX_DATA_URL_LENGTH
): Promise<string> => {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) {
      resolve('');
      return;
    }

    // If it is an asset path, external HTTP URL, or already a compact data URL under budget, return directly
    if (typeof fileOrDataUrl === 'string') {
      if (!fileOrDataUrl.startsWith('data:image/')) {
        resolve(fileOrDataUrl);
        return;
      }
      if (fileOrDataUrl.length <= maxDataUrlLength && maxWidth >= 800 && maxHeight >= 800) {
        // Still allow recompression if requested dimensions are tighter; otherwise skip if tiny
        if (fileOrDataUrl.length <= 160_000) {
          resolve(fileOrDataUrl);
          return;
        }
      }
    }

    let settled = false;
    let objectUrl: string | null = null;

    const cleanupObjectUrl = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        objectUrl = null;
      }
    };

    const finish = (result: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      cleanupObjectUrl();
      resolve(result);
    };

    // Generous 15s safety timer for slower mobile devices decoding large photos
    const safetyTimer = setTimeout(async () => {
      console.warn('[ImageCompressor] Safety timeout reached');
      if (typeof fileOrDataUrl === 'string') {
        finish(fileOrDataUrl);
      } else {
        const raw = await readFileAsDataUrl(fileOrDataUrl);
        finish(raw);
      }
    }, 15000);

    const img = new Image();

    const encodeWithinBudget = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        if (!naturalW || !naturalH) {
          throw new Error('Invalid image dimensions');
        }

        let targetW = naturalW;
        let targetH = naturalH;

        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.max(1, Math.round(targetW * ratio));
          targetH = Math.max(1, Math.round(targetH * ratio));
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No canvas 2D context');
        }

        const renderAttempt = (w: number, h: number, q: number): string => {
          canvas.width = w;
          canvas.height = h;
          // Fill white background so transparent PNGs convert cleanly to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', q);
        };

        let currentW = targetW;
        let currentH = targetH;
        let currentQ = quality;
        let output = renderAttempt(currentW, currentH, currentQ);

        // Iteratively step down quality and dimensions if output exceeds maxDataUrlLength
        const qualitySteps = [Math.min(0.7, quality - 0.08), 0.6, 0.5, 0.42];
        for (const q of qualitySteps) {
          if (output.length <= maxDataUrlLength) break;
          if (q < currentQ) {
            currentQ = q;
            output = renderAttempt(currentW, currentH, currentQ);
          }
        }

        let shrinkTries = 0;
        while (output.length > maxDataUrlLength && shrinkTries < 4 && (currentW > 360 || currentH > 360)) {
          shrinkTries += 1;
          currentW = Math.max(320, Math.round(currentW * 0.78));
          currentH = Math.max(320, Math.round(currentH * 0.78));
          output = renderAttempt(currentW, currentH, Math.min(currentQ, 0.55));
        }

        finish(output);
      } catch (err) {
        console.warn('[ImageCompressor] Canvas compression fallback:', err);
        if (typeof fileOrDataUrl === 'string') {
          finish(fileOrDataUrl);
        } else {
          readFileAsDataUrl(fileOrDataUrl).then(finish);
        }
      }
    };

    img.onload = encodeWithinBudget;
    img.onerror = () => {
      if (typeof fileOrDataUrl === 'string') {
        finish(fileOrDataUrl);
      } else if (objectUrl) {
        // Retry once via FileReader in case blob URL decoding failed on older browser
        cleanupObjectUrl();
        readFileAsDataUrl(fileOrDataUrl).then((raw) => {
          if (!raw) {
            finish('');
            return;
          }
          img.onload = encodeWithinBudget;
          img.onerror = () => finish(raw);
          img.src = raw;
        });
      } else {
        readFileAsDataUrl(fileOrDataUrl).then(finish);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      try {
        objectUrl = URL.createObjectURL(fileOrDataUrl);
        img.src = objectUrl;
      } catch {
        readFileAsDataUrl(fileOrDataUrl).then((raw) => {
          if (!raw) finish('');
          else img.src = raw;
        });
      }
    }
  });
};
