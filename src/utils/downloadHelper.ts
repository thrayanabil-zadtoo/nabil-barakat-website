/**
 * Universal Safe File Downloader
 * Fetches the binary file completely as a Blob before saving,
 * preventing corrupted, truncated, or HTML error page downloads in iframes.
 */
export const downloadFileSafely = async (
  fileUrl: string,
  fileName: string,
  onProgress?: (msg: string) => void,
  onComplete?: () => void,
  onError?: (err: Error) => void
): Promise<boolean> => {
  try {
    onProgress?.(`جاري تنزيل ملف "${fileName}"... يرجى الانتظار ثوانٍ`);
    
    // Cache bust query to ensure fresh binary
    const separator = fileUrl.includes('?') ? '&' : '?';
    const targetUrl = `${fileUrl}${separator}t=${Date.now()}`;

    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`تعذر تحميل الملف من السيرفر (كود الخطأ: ${response.status})`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('الملف المستلم هو صفحة ويب وليس أرشيف ZIP صالح. يرجى إعادة المحاولة.');
    }

    const blob = await response.blob();
    
    // Check if zip is unexpectedly small (< 50KB)
    if (fileName.endsWith('.zip') && blob.size < 50000) {
      throw new Error('حجم الملف المحمل غير مكتمل. يرجى المحاولة مرة أخرى.');
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up memory
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 15000);

    onProgress?.(`تم تحميل ملف "${fileName}" بنجاح في جهازك!`);
    onComplete?.();
    return true;
  } catch (error: any) {
    console.error('[DownloadHelper] Error downloading:', error);
    
    // Fallback: try direct link
    try {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fileUrl;
      fallbackLink.download = fileName;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } catch {
      // ignore
    }

    onError?.(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};
