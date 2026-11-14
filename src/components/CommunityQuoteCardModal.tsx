import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Sparkles, Check } from 'lucide-react';
import { AuthorPost } from '../types';
import { getSiteDomain } from '../config/siteDomain';

interface CommunityQuoteCardModalProps {
  post: AuthorPost | null;
  authorName: string;
  authorPortrait?: string;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const CARD_PALETTES: Record<string, { bgTop: string; bgBottom: string; text: string; accent: string; sub: string }> = {
  red: { bgTop: '#991b1b', bgBottom: '#7f1d1d', text: '#ffffff', accent: '#f5cd72', sub: '#fecaca' },
  crimson: { bgTop: '#be123c', bgBottom: '#881337', text: '#ffffff', accent: '#fde68a', sub: '#fecdd3' },
  ruby: { bgTop: '#b91c1c', bgBottom: '#9f1239', text: '#ffffff', accent: '#f5cd72', sub: '#fee2e2' },
  navy: { bgTop: '#07243c', bgBottom: '#0b385e', text: '#ffffff', accent: '#dfa85b', sub: '#cbd5e1' },
  amber: { bgTop: '#92400e', bgBottom: '#78350f', text: '#ffffff', accent: '#fef08a', sub: '#fde68a' },
  purple: { bgTop: '#5b21b6', bgBottom: '#4c1d95', text: '#ffffff', accent: '#f5cd72', sub: '#ddd6fe' },
  emerald: { bgTop: '#065f46', bgBottom: '#064e3b', text: '#ffffff', accent: '#fde68a', sub: '#a7f3d0' },
  midnight: { bgTop: '#0f172a', bgBottom: '#020617', text: '#ffffff', accent: '#dfa85b', sub: '#cbd5e1' },
  none: { bgTop: '#07243c', bgBottom: '#0a3152', text: '#ffffff', accent: '#dfa85b', sub: '#cbd5e1' },
};

function wrapArabicLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      if (lines.length > 0 && lines.length < maxLines) {
        lines.push('');
      }
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          if (lines.length >= maxLines) break;
        }
        currentLine = word;
      }
    }

    if (lines.length >= maxLines) break;
    if (currentLine) {
      lines.push(currentLine);
      if (lines.length >= maxLines) break;
    }
  }

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last && !last.endsWith('...')) {
      lines[maxLines - 1] = last.length > 6 ? `${last.slice(0, -2)}...` : last;
    }
  }

  return lines;
}

export const CommunityQuoteCardModal: React.FC<CommunityQuoteCardModalProps> = ({
  post,
  authorName,
  authorPortrait,
  onClose,
  onToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectMode, setAspectMode] = useState<'portrait' | 'square'>('portrait');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (!post) return;
    let cancelled = false;

    const renderCard = async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Ignore font wait failure
      }

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const width = 1080;
      const height = aspectMode === 'portrait' ? 1350 : 1080;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const palette = CARD_PALETTES[post.bgColor || 'none'] || CARD_PALETTES.navy;

      // 1. Rich Background Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, palette.bgTop);
      grad.addColorStop(1, palette.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric radial glow
      const glow = ctx.createRadialGradient(width * 0.5, height * 0.42, 40, width * 0.5, height * 0.42, width * 0.6);
      glow.addColorStop(0, 'rgba(223, 168, 91, 0.14)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 2. Golden Literary Frames
      ctx.strokeStyle = 'rgba(223, 168, 91, 0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(44, 44, width - 88, height - 88);

      ctx.strokeStyle = 'rgba(223, 168, 91, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // Decorative corner accents
      const cornerLen = 42;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 5;
      const corners = [
        [44, 44, 1, 1],
        [width - 44, 44, -1, 1],
        [44, height - 44, 1, -1],
        [width - 44, height - 44, -1, -1],
      ];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * cornerLen);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * cornerLen, cy);
        ctx.stroke();
      });

      // 3. Top Header Badge
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = palette.accent;
      ctx.font = 'bold 28px "Tajawal", sans-serif';
      const categoryLabel = post.category ? `✦ ${post.category} ✦` : '✦ من مجتمع الكاتب ✦';
      ctx.fillText(categoryLabel, width / 2, 128);

      if (post.title) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 42px "Amiri", "Traditional Arabic", serif';
        ctx.fillText(post.title.trim(), width / 2, 195);
      }

      // Opening ornamental quote mark
      ctx.fillStyle = 'rgba(223, 168, 91, 0.35)';
      ctx.font = 'bold 120px "Amiri", serif';
      ctx.fillText('«', width - 130, post.title ? 290 : 250);
      ctx.fillText('»', 130, height - 265);

      // 4. Main Poetic Content (auto-scaled)
      const contentTop = post.title ? 255 : 210;
      const contentBottom = height - 295;
      const availableHeight = contentBottom - contentTop;
      const textWidthLimit = width - 190;

      let fontSize = post.content.length > 260 ? 38 : post.content.length > 140 ? 46 : 54;
      let lines: string[] = [];
      let lineHeight = fontSize * 1.65;

      while (fontSize >= 28) {
        ctx.font = `bold ${fontSize}px "Amiri", "Traditional Arabic", serif`;
        lineHeight = fontSize * 1.62;
        const maxLines = Math.max(4, Math.floor(availableHeight / lineHeight));
        lines = wrapArabicLines(ctx, post.content, textWidthLimit, maxLines);
        if (lines.length * lineHeight <= availableHeight) {
          break;
        }
        fontSize -= 4;
      }

      const totalBlockHeight = lines.length * lineHeight;
      let startY = contentTop + (availableHeight - totalBlockHeight) / 2 + fontSize * 0.75;

      ctx.fillStyle = palette.text;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.font = `bold ${fontSize}px "Amiri", "Traditional Arabic", serif`;

      for (const line of lines) {
        if (line) {
          ctx.fillText(line, width / 2, startY);
        }
        startY += lineHeight;
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // 5. Divider above Author Footer
      const footerLineY = height - 235;
      ctx.strokeStyle = 'rgba(223, 168, 91, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(160, footerLineY);
      ctx.lineTo(width - 160, footerLineY);
      ctx.stroke();

      // 6. Author Portrait Circle (if loadable) + Signature & Official Domain
      const drawAuthorFooter = () => {
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';

        ctx.fillStyle = palette.accent;
        ctx.font = 'bold 34px "Amiri", "Traditional Arabic", serif';
        ctx.fillText(authorName || 'أ. نبيل بركات', width / 2, height - 155);

        ctx.fillStyle = palette.sub;
        ctx.font = '500 22px "Tajawal", sans-serif';
        ctx.fillText('روائي وشاعر · عضو الجمعية المصرية لكتاب القصة والرواية', width / 2, height - 115);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 21px "Tajawal", monospace';
        ctx.fillText(getSiteDomain(), width / 2, height - 76);

        if (!cancelled) {
          try {
            setDataUrl(canvas.toDataURL('image/png'));
          } catch {
            // Fallback if canvas tainted
          }
        }
      };

      if (authorPortrait) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          const r = 36;
          const cx = width / 2;
          const cy = footerLineY;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();

          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          drawAuthorFooter();
        };
        img.onerror = () => {
          drawAuthorFooter();
        };
        img.src = authorPortrait;
      } else {
        drawAuthorFooter();
      }
    };

    void renderCard();

    return () => {
      cancelled = true;
    };
  }, [post, aspectMode, authorName, authorPortrait]);

  if (!post) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    try {
      const url = dataUrl || canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `nabil-barakat-${post.id}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast('✓ تم حفظ صورة القصيدة بجودة عالية للمشاركة');
    } catch {
      onToast('تعذر تحميل الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  const handleNativeShareImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof navigator === 'undefined' || !navigator.share) {
      handleDownload();
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        handleDownload();
        return;
      }
      const file = new File([blob], `nabil-barakat-${post.id}.png`, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: post.title || 'مقتطف أدبي — أ. نبيل بركات',
            text: `${post.content.slice(0, 120)}...\n\n— ${authorName}`,
          });
          return;
        }
      } catch {
        // User cancelled or unsupported
      }
      handleDownload();
    }, 'image/png');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dfa85b]/40 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#07243c] to-[#0b385e] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <h3 className="font-bold text-sm sm:text-base font-literary">
              بطاقة مشاركة القصيدة كصورة جاهزة
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Format Toggle */}
          <div className="flex items-center justify-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setAspectMode('portrait')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                aspectMode === 'portrait'
                  ? 'bg-[#07243c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#07243c]'
              }`}
            >
              بطاقة طولية (إنستغرام وواتساب 4:5)
            </button>
            <button
              type="button"
              onClick={() => setAspectMode('square')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                aspectMode === 'square'
                  ? 'bg-[#07243c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#07243c]'
              }`}
            >
              بطاقة مربعة (فيسبوك وإكس 1:1)
            </button>
          </div>

          {/* Canvas Preview */}
          <div className="flex justify-center bg-slate-100 rounded-2xl p-3 border border-slate-200">
            <canvas
              ref={canvasRef}
              className="max-h-[48vh] w-auto rounded-xl shadow-lg border border-[#dfa85b]/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#c5943b] hover:to-[#dfa85b] text-[#07243c] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              {isDownloading ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{isDownloading ? 'تم الحفظ بنجاح!' : 'تنزيل الصورة (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShareImage}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#07243c] hover:bg-[#0b385e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#dfa85b]" />
              <span>مشاركة الصورة مباشرة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
