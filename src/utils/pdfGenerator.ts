import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  fileName?: string;
  elementId?: string;
  onProgress?: (status: string) => void;
}

/**
 * Robust, mobile-tested PDF generator that works inside mobile Chrome,
 * Safari, and iframes by rendering directly to high-res canvas and triggering
 * a real .pdf file download to the phone's Downloads folder.
 * Uses html2canvas-pro which supports Tailwind v4 oklch(), lab(), and modern CSS colors.
 */
export const exportCvToPdf = async (options: PdfExportOptions = {}): Promise<boolean> => {
  const {
    fileName = 'My_CV',
    elementId = 'cv-printable-content',
    onProgress,
  } = options;

  try {
    onProgress?.('جاري تحضير وتجهيز ملف الـ PDF...');
    
    // Find target container
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element #${elementId} not found, falling back to window.print()`);
      window.print();
      return true;
    }

    onProgress?.('جاري معالجة النصوص وتنسيق جودة A4...');

    // html2canvas-pro capture options (supports oklch, lab, lch, oklab colors)
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(elementId);
        if (target) {
          target.style.maxHeight = 'none';
          target.style.overflow = 'visible';
        }
      },
    });

    onProgress?.('جاري إنشاء ملف PDF وتنزيله إلى جهازك...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height to maintain aspect ratio
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Add subsequent pages if content exceeds 1 page
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // Sanitize file name
    const cleanFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'CV_Resume';
    
    // Trigger download
    pdf.save(`${cleanFileName}.pdf`);
    onProgress?.('تم تحميل ملف الـ PDF بنجاح!');
    return true;
  } catch (err) {
    console.error('PDF export via canvas failed, falling back to native print:', err);
    onProgress?.('جاري فتح نافذة الطباعة كخيار بديل...');
    window.print();
    return false;
  }
};
