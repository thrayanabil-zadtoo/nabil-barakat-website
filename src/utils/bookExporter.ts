import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { Book, SamplePageItem, TableOfContentItem } from '../types';
import { initialBooks } from '../data/initialData';
import { isVideoMedia } from './mediaUtils';
import { getSiteDomain } from '../config/siteDomain';

export interface BookExportOptions {
  isAuthorMode: boolean;
  authorName?: string;
  onProgress?: (message: string, percent?: number) => void;
}

interface LoadedExportImage {
  dataUrl: string;
  bytes: Uint8Array;
  width: number;
  height: number;
}

const ARABIC_WORD_FONT = {
  name: 'Arial',
  ascii: 'Arial',
  hAnsi: 'Arial',
  cs: 'Arial',
  eastAsia: 'Arial',
};

const sanitizeFileName = (name: string): string => {
  const cleaned = (name || 'رواية')
    .replace(/[/\\?%*:|"<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'رواية_أدبية';
};

const resolveBookContent = (book: Book): {
  title: string;
  subtitle: string;
  genre: string;
  publisher: string;
  publicationYear: string;
  isbn: string;
  depositNumber: string;
  description: string;
  coverImage: string;
  tableOfContents: TableOfContentItem[];
  samplePages: SamplePageItem[];
  pagesCount: number;
} => {
  const fallbackBook = initialBooks.find((b) => b.id === book.id);
  const samplePages =
    book.samplePages && book.samplePages.length > 0
      ? book.samplePages
      : fallbackBook?.samplePages || [];
  const tableOfContents =
    book.tableOfContents && book.tableOfContents.length > 0
      ? book.tableOfContents
      : fallbackBook?.tableOfContents || [];

  return {
    title: book.title || 'عمل أدبي',
    subtitle: book.subtitle || '',
    genre: book.genre || 'رواية أدبية',
    publisher: book.publisher || 'الكاتب أ. نبيل بركات',
    publicationYear: book.publicationYear || new Date().getFullYear().toString(),
    isbn: book.isbn || '',
    depositNumber: book.depositNumber || '',
    description: book.description || '',
    coverImage: book.coverImage || fallbackBook?.coverImage || '',
    tableOfContents,
    samplePages,
    pagesCount: book.pagesCount || samplePages.length,
  };
};

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    URL.revokeObjectURL(url);
  }, 5000);
};

const canvasToLoadedImage = async (
  img: HTMLImageElement,
  maxDimension = 960
): Promise<LoadedExportImage | null> => {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) return null;

  const scale = Math.min(1, maxDimension / Math.max(naturalW, naturalH));
  const width = Math.max(1, Math.round(naturalW * scale));
  const height = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
  );
  if (!blob) return null;

  const buffer = await blob.arrayBuffer();
  return {
    dataUrl,
    bytes: new Uint8Array(buffer),
    width,
    height,
  };
};

const loadImageElement = (src: string, useCrossOrigin: boolean): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCrossOrigin) {
      img.crossOrigin = 'anonymous';
    }
    const timer = window.setTimeout(() => reject(new Error('Image load timeout')), 12000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Image load failed'));
    };
    img.src = src;
  });
};

const loadImageForExport = async (rawUrl?: string): Promise<LoadedExportImage | null> => {
  if (!rawUrl || !rawUrl.trim() || isVideoMedia(rawUrl)) return null;
  const src = rawUrl.trim();

  // 1. Direct data URL
  if (src.startsWith('data:image/')) {
    try {
      const img = await loadImageElement(src, false);
      return await canvasToLoadedImage(img);
    } catch {
      return null;
    }
  }

  // 2. Fetch as Blob (cleanest for same-origin and CORS-enabled CDN images)
  try {
    const response = await fetch(src, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(blob);
        try {
          const img = await loadImageElement(objectUrl, false);
          return await canvasToLoadedImage(img);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }
  } catch {
    // Fallback below
  }

  // 3. Fallback direct Image element with crossOrigin anonymous
  try {
    const img = await loadImageElement(src, true);
    return await canvasToLoadedImage(img);
  } catch {
    return null;
  }
};

const preloadBookImages = async (
  coverImage: string,
  pages: SamplePageItem[]
): Promise<Map<string, LoadedExportImage>> => {
  const uniqueUrls = Array.from(
    new Set(
      [coverImage, ...pages.map((p) => p.image || '')]
        .map((u) => u.trim())
        .filter((u) => Boolean(u) && !isVideoMedia(u))
    )
  );

  const map = new Map<string, LoadedExportImage>();
  await Promise.all(
    uniqueUrls.map(async (url) => {
      const loaded = await loadImageForExport(url);
      if (loaded) {
        map.set(url, loaded);
      }
    })
  );
  return map;
};

const fitImageDimensions = (
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  return {
    width: Math.max(1, Math.round(naturalWidth * ratio)),
    height: Math.max(1, Math.round(naturalHeight * ratio)),
  };
};

const rtlRun = (
  text: string,
  options: {
    size?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
  } = {}
): TextRun => {
  const size = options.size ?? 26;
  return new TextRun({
    text,
    rightToLeft: true,
    font: ARABIC_WORD_FONT,
    size,
    sizeComplexScript: size,
    bold: options.bold,
    italics: options.italics,
    color: options.color ?? '1E293B',
  });
};

/**
 * Generates and downloads a structured Arabic RTL Word (.docx) file for a novel/book.
 * Strictly restricted to supervisor mode. Maps every site page 1-to-1 to its own Word page.
 */
export const exportBookToWord = async (
  book: Book,
  options: BookExportOptions
): Promise<void> => {
  if (!options.isAuthorMode) {
    throw new Error('هذه الميزة مخصصة للمشرف فقط.');
  }

  const authorName = options.authorName || 'أ. نبيل بركات';
  const resolved = resolveBookContent(book);
  const { onProgress } = options;

  onProgress?.('جاري تحضير الغلاف والصور لمستند Word...', 10);
  const imageCache = await preloadBookImages(resolved.coverImage, resolved.samplePages);
  const coverLoaded = resolved.coverImage ? imageCache.get(resolved.coverImage) : undefined;

  const children: (Paragraph | Table)[] = [];

  // ------------------------------------------------------------------
  // PAGE 1: COVER & OFFICIAL COPYRIGHT METADATA
  // ------------------------------------------------------------------
  children.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 200 },
      children: [
        rtlRun(`الموقع الرسمي للكاتب ${authorName}`, {
          size: 24,
          bold: true,
          color: 'B47B2B',
        }),
      ],
    })
  );

  if (coverLoaded) {
    const dims = fitImageDimensions(coverLoaded.width, coverLoaded.height, 260, 360);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 240 },
        children: [
          new ImageRun({
            type: 'jpg',
            data: coverLoaded.bytes,
            transformation: dims,
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        rtlRun(resolved.title, {
          size: 48,
          bold: true,
          color: '07243C',
        }),
      ],
    })
  );

  if (resolved.subtitle) {
    children.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          rtlRun(resolved.subtitle, {
            size: 28,
            bold: true,
            color: 'B47B2B',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: 'DFA85B', space: 12 },
      },
      children: [
        rtlRun(`تأليف: ${authorName} · ${resolved.genre}`, {
          size: 24,
          color: '475569',
        }),
      ],
    })
  );

  if (resolved.description) {
    children.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 160, after: 240, line: 340 },
        children: [
          rtlRun(resolved.description, {
            size: 24,
            color: '334155',
          }),
        ],
      })
    );
  }

  const metaLines: string[] = [
    `دار النشر: ${resolved.publisher}`,
    `سنة الإصدار: ${resolved.publicationYear}`,
    resolved.depositNumber ? `رقم الإيداع القانوني: ${resolved.depositNumber}` : '',
    resolved.isbn ? `الترقيم الدولي (ISBN): ${resolved.isbn}` : '',
    `عدد الصفحات الموثقة: ${resolved.samplePages.length} صفحة منشورة (النسخة الكاملة: ${resolved.pagesCount} صفحة)`,
    `جميع حقوق الملكية الفكرية محفوظة للكاتب ${authorName} © (${getSiteDomain()})`,
  ].filter(Boolean);

  metaLines.forEach((line, idx) => {
    children.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
        spacing: {
          before: idx === 0 ? 120 : 40,
          after: idx === metaLines.length - 1 ? 120 : 40,
          line: 300,
        },
        indent: { start: 180, end: 180 },
        children: [
          rtlRun(line, {
            size: 21,
            bold: idx === metaLines.length - 1,
            color: idx === metaLines.length - 1 ? '07243C' : '475569',
          }),
        ],
      })
    );
  });

  // ------------------------------------------------------------------
  // PAGE 2: TABLE OF CONTENTS (IF AVAILABLE)
  // ------------------------------------------------------------------
  if (resolved.tableOfContents.length > 0) {
    onProgress?.('جاري تنسيق فهرس الفصول والمحتويات...', 22);
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: 'DFA85B', space: 8 },
        },
        children: [
          rtlRun('فهرس الرواية والمحتويات', {
            size: 36,
            bold: true,
            color: '07243C',
          }),
        ],
      })
    );

    const tocRows = resolved.tableOfContents.map((toc, idx) => {
      const fill = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 80, after: toc.summary ? 30 : 80 },
                children: [
                  rtlRun(toc.chapter, {
                    size: 23,
                    bold: true,
                    color: '07243C',
                  }),
                ],
              }),
              ...(toc.summary
                ? [
                    new Paragraph({
                      bidirectional: true,
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 80 },
                      children: [
                        rtlRun(toc.summary, {
                          size: 19,
                          color: '64748B',
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.LEFT,
                spacing: { before: 80, after: 80 },
                children: [
                  rtlRun(`صفحة ${toc.pageNumber}`, {
                    size: 21,
                    bold: true,
                    color: 'B47B2B',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        visuallyRightToLeft: true,
        rows: tocRows,
      })
    );
  }

  // ------------------------------------------------------------------
  // PAGES 3..N: 1-TO-1 MAPPING OF EVERY WEBSITE PAGE TO ITS OWN WORD PAGE
  // ------------------------------------------------------------------
  const pages = resolved.samplePages;
  if (pages.length === 0) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [
          rtlRun('لم يتم إضافة صفحات نصية لهذه الرواية بعد.', {
            size: 26,
            color: '64748B',
          }),
        ],
      })
    );
  } else {
    pages.forEach((page, pageIdx) => {
      const pct = 25 + Math.round(((pageIdx + 1) / pages.length) * 60);
      onProgress?.(`جاري إنشاء صفحة ${pageIdx + 1} من ${pages.length} في ملف Word...`, pct);

      const rawText = (page.content || '').trim();
      const lines = rawText ? rawText.split(/\r?\n/) : [];
      const loadedPageImg = page.image ? imageCache.get(page.image.trim()) : undefined;

      // Adapt density so long pages still stay cleanly on their own Word page
      const isVeryDense =
        rawText.length > 1650 ||
        lines.length > 26 ||
        (Boolean(loadedPageImg) && rawText.length > 850);
      const bodyFontSize = isVeryDense ? 22 : 26; // 11pt vs 13pt
      const bodyLineSpacing = isVeryDense ? 285 : 350;
      const paraAfterSpacing = isVeryDense ? 55 : 100;

      // Top page tag (ALWAYS starts on a brand-new Word page)
      children.push(
        new Paragraph({
          pageBreakBefore: true,
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 70 },
          children: [
            rtlRun(`صفحة ${page.pageNumber}`, {
              size: 20,
              bold: true,
              color: 'B47B2B',
            }),
            rtlRun(`  ·  ${resolved.title}`, {
              size: 19,
              color: '64748B',
            }),
          ],
        })
      );

      // Page title with gold underline
      children.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 20, after: isVeryDense ? 130 : 190 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 10, color: 'DFA85B', space: 6 },
          },
          children: [
            rtlRun(page.title || `صفحة ${page.pageNumber}`, {
              size: isVeryDense ? 30 : 34,
              bold: true,
              color: '07243C',
            }),
          ],
        })
      );

      // Optional page illustration
      if (loadedPageImg) {
        const dims = fitImageDimensions(
          loadedPageImg.width,
          loadedPageImg.height,
          isVeryDense ? 240 : 320,
          isVeryDense ? 190 : 250
        );
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: isVeryDense ? 110 : 170 },
            children: [
              new ImageRun({
                type: 'jpg',
                data: loadedPageImg.bytes,
                transformation: dims,
              }),
            ],
          })
        );
      }

      // Page prose/poetry lines
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(
            new Paragraph({
              bidirectional: true,
              spacing: { before: 0, after: isVeryDense ? 40 : 80 },
              children: [],
            })
          );
          return;
        }

        const useJustify = trimmed.length > 75;
        children.push(
          new Paragraph({
            bidirectional: true,
            alignment: useJustify ? AlignmentType.JUSTIFIED : AlignmentType.RIGHT,
            spacing: {
              before: 0,
              after: paraAfterSpacing,
              line: bodyLineSpacing,
            },
            children: [
              rtlRun(trimmed, {
                size: bodyFontSize,
                color: '1E293B',
              }),
            ],
          })
        );
      });
    });
  }

  onProgress?.('جاري تجميع وضغط ملف Word (.docx)...', 90);

  const doc = new Document({
    title: resolved.title,
    creator: authorName,
    description: resolved.description || resolved.subtitle,
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: {
              width: 11906, // A4 width (210mm) in twips
              height: 16838, // A4 height (297mm) in twips
            },
            margin: {
              top: 900,
              bottom: 900,
              left: 1080,
              right: 1080,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 4 },
                },
                children: [
                  rtlRun(`${resolved.title}  ·  بقلم ${authorName}`, {
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0', space: 4 },
                },
                children: [
                  rtlRun(`جميع الحقوق محفوظة للكاتب ${authorName} © · صفحة المستند `, {
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: ARABIC_WORD_FONT,
                    size: 18,
                    sizeComplexScript: 18,
                    color: '07243C',
                    bold: true,
                  }),
                  rtlRun(' من ', { size: 18, color: '64748B' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: ARABIC_WORD_FONT,
                    size: 18,
                    sizeComplexScript: 18,
                    color: '07243C',
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${sanitizeFileName(resolved.title)}.docx`;
  triggerBlobDownload(blob, fileName);
  onProgress?.(`تم تحميل ملف Word «${fileName}» بنجاح!`, 100);
};

// ------------------------------------------------------------------
// PDF RENDERING HELPERS (OFFSCREEN A4 DOM -> HTML2CANVAS-PRO -> JSPDF)
// ------------------------------------------------------------------
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createA4SheetShell = (): HTMLDivElement => {
  const sheet = document.createElement('div');
  sheet.dir = 'rtl';
  sheet.style.cssText = `
    width: 794px;
    height: 1123px;
    background: #ffffff;
    color: #1e293b;
    font-family: 'Amiri', 'Tajawal', Arial, sans-serif;
    box-sizing: border-box;
    padding: 36px 44px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `;
  return sheet;
};

const addDecorativeBorderFrame = (sheet: HTMLDivElement) => {
  const frame = document.createElement('div');
  frame.style.cssText = `
    position: absolute;
    inset: 16px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    pointer-events: none;
  `;
  const innerAccent = document.createElement('div');
  innerAccent.style.cssText = `
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(223, 168, 91, 0.35);
    border-radius: 7px;
    pointer-events: none;
  `;
  frame.appendChild(innerAccent);
  sheet.appendChild(frame);
};

const buildCoverSheet = (
  resolved: ReturnType<typeof resolveBookContent>,
  authorName: string,
  coverDataUrl?: string
): HTMLDivElement => {
  const sheet = createA4SheetShell();
  sheet.style.background = 'linear-gradient(180deg, #ffffff 0%, #fffdf8 100%)';
  addDecorativeBorderFrame(sheet);

  const metaRows = [
    { label: 'دار النشر', value: resolved.publisher },
    { label: 'سنة الإصدار', value: resolved.publicationYear },
    ...(resolved.depositNumber ? [{ label: 'رقم الإيداع القانوني', value: resolved.depositNumber }] : []),
    ...(resolved.isbn ? [{ label: 'الترقيم الدولي (ISBN)', value: resolved.isbn }] : []),
    {
      label: 'الصفحات الموثقة',
      value: `${resolved.samplePages.length} صفحة (النسخة الكاملة: ${resolved.pagesCount} صفحة)`,
    },
  ];

  const content = document.createElement('div');
  content.style.cssText = `
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    padding: 20px 18px;
  `;

  content.innerHTML = `
    <div style="width: 100%;">
      <div style="display:inline-block;padding:6px 18px;border-radius:999px;background:#07243c;color:#f5cd72;font-size:13px;font-weight:700;border:1px solid #dfa85b;">
        الموقع الرسمي للكاتب الروائي والشاعر ${escapeHtml(authorName)}
      </div>
    </div>

    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
      ${
        coverDataUrl
          ? `<div style="padding:8px;background:#ffffff;border:2px solid #dfa85b;border-radius:14px;box-shadow:0 12px 28px rgba(7,36,60,0.14);">
              <img src="${coverDataUrl}" style="display:block;max-width:255px;max-height:365px;width:auto;height:auto;border-radius:8px;object-fit:contain;" />
            </div>`
          : ''
      }
      <div style="space-y:8px;max-width:620px;">
        <h1 style="margin:0;font-size:34px;line-height:1.35;font-weight:800;color:#07243c;">
          ${escapeHtml(resolved.title)}
        </h1>
        ${
          resolved.subtitle
            ? `<p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#b47b2b;">${escapeHtml(resolved.subtitle)}</p>`
            : ''
        }
        <p style="margin:8px 0 0;font-size:14px;color:#475569;font-family:'Tajawal',Arial,sans-serif;">
          بقلم: <strong style="color:#07243c;">${escapeHtml(authorName)}</strong> · ${escapeHtml(resolved.genre)}
        </p>
      </div>
      <div style="width:140px;height:2px;background:linear-gradient(90deg,transparent,#dfa85b,transparent);"></div>
      ${
        resolved.description
          ? `<p style="margin:0;max-width:610px;font-size:15px;line-height:1.8;color:#334155;text-align:justify;text-align-last:center;">
              ${escapeHtml(resolved.description)}
            </p>`
          : ''
      }
    </div>

    <div style="width:100%;max-width:620px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px 18px;text-align:right;font-family:'Tajawal',Arial,sans-serif;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;color:#334155;">
        ${metaRows
          .map(
            (r) =>
              `<div><span style="color:#64748b;font-weight:600;">${escapeHtml(r.label)}:</span> <strong style="color:#07243c;">${escapeHtml(r.value)}</strong></div>`
          )
          .join('')}
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;font-weight:700;color:#07243c;text-align:center;">
        جميع الحقوق محفوظة للكاتب ${escapeHtml(authorName)} © · ${escapeHtml(getSiteDomain())}
      </div>
    </div>
  `;

  sheet.appendChild(content);
  return sheet;
};

const buildTocSheets = (
  resolved: ReturnType<typeof resolveBookContent>,
  authorName: string
): HTMLDivElement[] => {
  if (resolved.tableOfContents.length === 0) return [];

  const ITEMS_PER_SHEET = 11;
  const chunks: TableOfContentItem[][] = [];
  for (let i = 0; i < resolved.tableOfContents.length; i += ITEMS_PER_SHEET) {
    chunks.push(resolved.tableOfContents.slice(i, i + ITEMS_PER_SHEET));
  }

  return chunks.map((chunk, chunkIdx) => {
    const sheet = createA4SheetShell();
    addDecorativeBorderFrame(sheet);

    const inner = document.createElement('div');
    inner.style.cssText = `
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px 16px;
    `;

    inner.innerHTML = `
      <div style="border-bottom:2px solid #dfa85b;padding-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <h2 style="margin:0;font-size:24px;font-weight:800;color:#07243c;">
          فهرس الرواية والفصول ${chunks.length > 1 ? `(${chunkIdx + 1} / ${chunks.length})` : ''}
        </h2>
        <span style="font-size:13px;font-weight:700;color:#b47b2b;">${escapeHtml(resolved.title)}</span>
      </div>

      <div style="flex:1;padding:18px 0;display:flex;flex-direction:column;gap:10px;">
        ${chunk
          .map(
            (item, idx) => `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:10px 14px;border-radius:10px;background:${
              idx % 2 === 0 ? '#f8fafc' : '#ffffff'
            };border:1px solid #e2e8f0;">
              <div style="flex:1;text-align:right;">
                <div style="font-size:16px;font-weight:700;color:#07243c;line-height:1.45;">
                  ${escapeHtml(item.chapter)}
                </div>
                ${
                  item.summary
                    ? `<div style="font-size:12.5px;color:#64748b;margin-top:3px;font-family:'Tajawal',Arial,sans-serif;">
                        ${escapeHtml(item.summary)}
                      </div>`
                    : ''
                }
              </div>
              <div style="shrink:0;padding:4px 12px;border-radius:8px;background:#07243c;color:#f5cd72;font-size:12px;font-weight:700;white-space:nowrap;font-family:'Tajawal',Arial,sans-serif;">
                صفحة ${item.pageNumber}
              </div>
            </div>
          `
          )
          .join('')}
      </div>

      <div style="border-top:1px solid #e2e8f0;padding-top:8px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#64748b;font-family:'Tajawal',Arial,sans-serif;">
        <span>© جميع الحقوق محفوظة للكاتب ${escapeHtml(authorName)}</span>
        <span>فهرس المحتويات</span>
      </div>
    `;

    sheet.appendChild(inner);
    return sheet;
  });
};

const renderSingleNovelPageSheet = (
  resolved: ReturnType<typeof resolveBookContent>,
  authorName: string,
  page: SamplePageItem,
  paragraphs: string[],
  imageDataUrl: string | undefined,
  fontSizePx: number,
  lineHeight: number,
  paraGapPx: number,
  imgMaxHeightPx: number,
  isContinuation = false
): { sheet: HTMLDivElement; bodyBox: HTMLDivElement } => {
  const sheet = createA4SheetShell();
  addDecorativeBorderFrame(sheet);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 14px;
    box-sizing: border-box;
  `;

  // Top Header
  const headerEl = document.createElement('div');
  headerEl.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
    margin-bottom: 12px;
    flex-shrink: 0;
  `;
  headerEl.innerHTML = `
    <span style="font-size:12.5px;font-weight:700;color:#475569;font-family:'Tajawal',Arial,sans-serif;">
      ${escapeHtml(resolved.title)}
    </span>
    <span style="padding:3px 12px;border-radius:999px;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;font-size:12px;font-weight:800;font-family:'Tajawal',Arial,sans-serif;">
      صفحة ${page.pageNumber}${isContinuation ? ' (تتمة)' : ''}
    </span>
  `;

  // Main Body Box (measured for overflow auto-fit!)
  const bodyBox = document.createElement('div');
  bodyBox.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const titleEl = document.createElement('h2');
  titleEl.style.cssText = `
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #dfa85b;
    font-size: ${Math.max(18, Math.round(fontSizePx + 4))}px;
    line-height: 1.4;
    font-weight: 800;
    color: #07243c;
    flex-shrink: 0;
  `;
  titleEl.textContent = isContinuation
    ? `${page.title || `صفحة ${page.pageNumber}`} (تتمة)`
    : page.title || `صفحة ${page.pageNumber}`;
  bodyBox.appendChild(titleEl);

  if (imageDataUrl && !isContinuation) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = `
      display: flex;
      justify-content: center;
      margin: 2px 0 12px 0;
      flex-shrink: 0;
    `;
    const imgEl = document.createElement('img');
    imgEl.src = imageDataUrl;
    imgEl.style.cssText = `
      max-width: 100%;
      max-height: ${imgMaxHeightPx}px;
      width: auto;
      height: auto;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      object-fit: contain;
    `;
    imgWrap.appendChild(imgEl);
    bodyBox.appendChild(imgWrap);
  }

  const textFlow = document.createElement('div');
  textFlow.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${paraGapPx}px;
    font-size: ${fontSizePx}px;
    line-height: ${lineHeight};
    color: #1e293b;
  `;

  paragraphs.forEach((pText) => {
    const p = document.createElement('p');
    p.style.cssText = `
      margin: 0;
      text-align: ${pText.length > 75 ? 'justify' : 'right'};
      word-break: break-word;
    `;
    p.textContent = pText;
    textFlow.appendChild(p);
  });
  bodyBox.appendChild(textFlow);

  // Bottom Footer
  const footerEl = document.createElement('div');
  footerEl.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-top: 12px;
    font-size: 11px;
    color: #64748b;
    font-family: 'Tajawal', Arial, sans-serif;
    flex-shrink: 0;
  `;
  footerEl.innerHTML = `
    <span>© جميع الحقوق محفوظة للكاتب ${escapeHtml(authorName)}</span>
    <span style="font-weight:700;color:#07243c;">صفحة ${page.pageNumber}</span>
  `;

  wrapper.appendChild(headerEl);
  wrapper.appendChild(bodyBox);
  wrapper.appendChild(footerEl);
  sheet.appendChild(wrapper);

  return { sheet, bodyBox };
};

const buildFittedSheetsForNovelPage = (
  stage: HTMLDivElement,
  resolved: ReturnType<typeof resolveBookContent>,
  authorName: string,
  page: SamplePageItem,
  imageDataUrl?: string
): HTMLDivElement[] => {
  const rawParagraphs = (page.content || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [''];

  // Step down typography smoothly so 1 site page fits cleanly onto 1 A4 PDF page
  const presets = [
    { font: 17.5, lineHeight: 1.85, gap: 10, imgH: 270 },
    { font: 16, lineHeight: 1.75, gap: 8, imgH: 240 },
    { font: 14.5, lineHeight: 1.68, gap: 7, imgH: 220 },
    { font: 13.5, lineHeight: 1.6, gap: 6, imgH: 200 },
    { font: 12.2, lineHeight: 1.52, gap: 5, imgH: 180 },
    { font: 11.2, lineHeight: 1.46, gap: 4, imgH: 165 },
  ];

  for (const preset of presets) {
    stage.innerHTML = '';
    const { sheet, bodyBox } = renderSingleNovelPageSheet(
      resolved,
      authorName,
      page,
      paragraphs,
      imageDataUrl,
      preset.font,
      preset.lineHeight,
      preset.gap,
      preset.imgH,
      false
    );
    stage.appendChild(sheet);

    if (bodyBox.scrollHeight <= bodyBox.clientHeight + 2) {
      stage.innerHTML = '';
      return [sheet];
    }
  }

  // Fallback for ultra-long author-added pages: cleanly paginate remaining paragraphs across continuation sheets
  const fallbackPreset = presets[presets.length - 1];
  const sheets: HTMLDivElement[] = [];
  let cursor = 0;
  let isCont = false;

  while (cursor < paragraphs.length) {
    let take = paragraphs.length - cursor;
    let chosenSheet: HTMLDivElement | null = null;

    while (take > 1) {
      stage.innerHTML = '';
      const slice = paragraphs.slice(cursor, cursor + take);
      const { sheet, bodyBox } = renderSingleNovelPageSheet(
        resolved,
        authorName,
        page,
        slice,
        imageDataUrl,
        fallbackPreset.font,
        fallbackPreset.lineHeight,
        fallbackPreset.gap,
        fallbackPreset.imgH,
        isCont
      );
      stage.appendChild(sheet);
      if (bodyBox.scrollHeight <= bodyBox.clientHeight + 2) {
        chosenSheet = sheet;
        break;
      }
      take = Math.max(1, Math.floor(take * 0.78));
    }

    if (!chosenSheet) {
      stage.innerHTML = '';
      const { sheet } = renderSingleNovelPageSheet(
        resolved,
        authorName,
        page,
        [paragraphs[cursor]],
        imageDataUrl,
        fallbackPreset.font,
        fallbackPreset.lineHeight,
        fallbackPreset.gap,
        fallbackPreset.imgH,
        isCont
      );
      chosenSheet = sheet;
      take = 1;
    }

    stage.innerHTML = '';
    sheets.push(chosenSheet);
    cursor += take;
    isCont = true;
  }

  return sheets;
};

/**
 * Generates and downloads a formatted Arabic RTL A4 PDF file for a novel/book.
 * Strictly restricted to supervisor mode. Maps every site page cleanly into crisp A4 pages.
 */
export const exportBookToPdf = async (
  book: Book,
  options: BookExportOptions
): Promise<void> => {
  if (!options.isAuthorMode) {
    throw new Error('هذه الميزة مخصصة للمشرف فقط.');
  }

  const authorName = options.authorName || 'أ. نبيل بركات';
  const resolved = resolveBookContent(book);
  const { onProgress } = options;

  onProgress?.('جاري تحضير الخطوط والصور لملف PDF...', 6);

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness warning
    }
  }

  const imageCache = await preloadBookImages(resolved.coverImage, resolved.samplePages);
  const coverLoaded = resolved.coverImage ? imageCache.get(resolved.coverImage) : undefined;

  const stage = document.createElement('div');
  stage.dir = 'rtl';
  stage.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: 794px;
    z-index: -1;
    pointer-events: none;
    background: #ffffff;
  `;
  document.body.appendChild(stage);

  try {
    const allSheets: HTMLDivElement[] = [];

    // 1. Cover Sheet
    allSheets.push(buildCoverSheet(resolved, authorName, coverLoaded?.dataUrl));

    // 2. Table of Contents Sheet(s)
    const tocSheets = buildTocSheets(resolved, authorName);
    allSheets.push(...tocSheets);

    // 3. Every Novel Page -> Dedicated A4 Sheet(s)
    resolved.samplePages.forEach((page) => {
      const pageImg = page.image ? imageCache.get(page.image.trim()) : undefined;
      const pageSheets = buildFittedSheetsForNovelPage(
        stage,
        resolved,
        authorName,
        page,
        pageImg?.dataUrl
      );
      allSheets.push(...pageSheets);
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < allSheets.length; i++) {
      const pct = 15 + Math.round(((i + 1) / allSheets.length) * 80);
      onProgress?.(`جاري تصدير صفحة ${i + 1} من ${allSheets.length} إلى PDF...`, pct);

      const sheet = allSheets[i];
      stage.innerHTML = '';
      stage.appendChild(sheet);

      // Brief yield to keep browser responsive and ensure images/layout settle
      await new Promise<void>((resolve) => window.setTimeout(resolve, 14));

      const canvas = await html2canvas(sheet, {
        scale: 1.75,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    onProgress?.('جاري حفظ وتنزيل ملف PDF...', 98);
    const pdfBlob = pdf.output('blob');
    const fileName = `${sanitizeFileName(resolved.title)}.pdf`;
    triggerBlobDownload(pdfBlob, fileName);
    onProgress?.(`تم تحميل ملف PDF «${fileName}» بنجاح!`, 100);
  } finally {
    if (stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
  }
};
