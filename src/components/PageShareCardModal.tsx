import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
import { getSiteDomain, getSiteBaseUrl } from '../config/siteDomain';

interface PageShareCardModalProps {
  bookTitle: string;
  pageTitle: string;
  pageNumber: number;
  pageContent: string;
  pageImage?: string;
  onClose: () => void;
}

export const PageShareCardModal: React.FC<PageShareCardModalProps> = ({
  bookTitle,
  pageTitle,
  pageNumber,
  pageContent,
  pageImage,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'luxuryDark' | 'parchment'>('luxuryDark');

  // Generate Card on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions for social media (1080 x 1350 vertical card)
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const isDark = theme === 'luxuryDark';

    // 1. Background
    if (isDark) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#071d30');
      grad.addColorStop(0.5, '#051422');
      grad.addColorStop(1, '#020b14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fffdfa');
      grad.addColorStop(0.5, '#f7f2e7');
      grad.addColorStop(1, '#eee6d5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Borders & Ornaments
    ctx.lineWidth = 4;
    ctx.strokeStyle = isDark ? '#dfa85b' : '#c4924c';
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark ? 'rgba(223, 168, 91, 0.4)' : 'rgba(196, 146, 76, 0.4)';
    ctx.strokeRect(55, 55, width - 110, height - 110);

    // Corner decorative markers
    const drawCorner = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = isDark ? '#dfa85b' : '#c4924c';
      ctx.fillRect(-15, -15, 30, 4);
      ctx.fillRect(-15, -15, 4, 30);
      ctx.restore();
    };
    drawCorner(55, 55, 0);
    drawCorner(width - 55, 55, Math.PI / 2);
    drawCorner(width - 55, height - 55, Math.PI);
    drawCorner(55, height - 55, -Math.PI / 2);

    // 3. Top Header
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    // Top subtitle
    ctx.fillStyle = isDark ? '#dfa85b' : '#9c7333';
    ctx.font = 'bold 26px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('✦ ومضات وفصول أدبية مختارة ✦', width / 2, 120);

    // Book Title
    ctx.fillStyle = isDark ? '#ffffff' : '#07243c';
    ctx.font = 'bold 44px "Amiri", "Traditional Arabic", serif';
    ctx.fillText(`من كتاب: «${bookTitle}»`, width / 2, 180);

    // Page Title
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.font = '30px "Amiri", "Traditional Arabic", serif';
    ctx.fillText(`${pageTitle}  ·  الصفحة ${pageNumber}`, width / 2, 230);

    // Decorative divider line
    ctx.beginPath();
    ctx.moveTo(width / 2 - 250, 260);
    ctx.lineTo(width / 2 + 250, 260);
    ctx.strokeStyle = isDark ? '#dfa85b' : '#c4924c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Page Content (Word Wrap)
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
    ctx.font = '34px "Amiri", "Traditional Arabic", serif';
    const maxWidth = width - 200;
    const lineHeight = 58;

    // Clean and truncate text if too long for one social card
    const words = pageContent.split(/\s+/);
    let line = '';
    const lines: string[] = [];
    const maxLines = pageImage ? 9 : 13;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
        if (lines.length >= maxLines) {
          lines.push('...');
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line && lines.length < maxLines) {
      lines.push(line.trim());
    }

    let startY = 340;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, startY);
      startY += lineHeight;
    }

    // 5. Footer Copyright & Official Website (Prominent as requested)
    const footerY = height - 190;
    ctx.beginPath();
    ctx.moveTo(100, footerY);
    ctx.lineTo(width - 100, footerY);
    ctx.strokeStyle = isDark ? 'rgba(223, 168, 91, 0.4)' : 'rgba(196, 146, 76, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Author Name
    ctx.fillStyle = isDark ? '#ffffff' : '#07243c';
    ctx.font = 'bold 36px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('بقلم الكاتب الروائي والشاعر: أ. نبيل بركات', width / 2, footerY + 50);

    // Official Link - Emphasized in gold box
    ctx.fillStyle = isDark ? '#dfa85b' : '#b47b2c';
    ctx.font = 'bold 34px "Amiri", "Traditional Arabic", serif';
    ctx.fillText(`الموقع الرسمي المعتمد: ${getSiteDomain()}`, width / 2, footerY + 105);

    // Copyright notice
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '22px sans-serif';
    ctx.fillText('جميع الحقوق محفوظة © للكاتب نبيل بركات · يحظر الاقتباس التجاري دون إذن مسبق', width / 2, footerY + 145);

    // Export image url
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (e) {
      console.error('Canvas export error:', e);
    }
  }, [bookTitle, pageTitle, pageNumber, pageContent, pageImage, theme]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `nabil_barakat_${bookTitle.replace(/\s+/g, '_')}_p${pageNumber}.png`;
    link.href = imageUrl;
    link.click();
  };

  const shareText = `من روائع الكاتب الروائي أ. نبيل بركات في كتابه «${bookTitle}» (صفحة ${pageNumber}):\n\n"${pageContent.slice(0, 180)}..."\n\nللقراءة الكاملة على الموقع الرسمي المعتمد:\n${getSiteBaseUrl()}`;

  const handleCopyTextAndLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#07243c] border border-amber-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#051a2c] border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#dfa85b]" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-literary">
                بطاقة مشاركة الصفحة مع حفظ الحقوق
              </h3>
              <div className="text-[11px] text-amber-300">
                باسم الكاتب أ. نبيل بركات والرابط المعتمد {getSiteDomain()}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#092c48] border-b border-white/10 text-xs">
          <span className="text-slate-300 font-medium">نمط تصميم البطاقة:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('luxuryDark')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                theme === 'luxuryDark'
                  ? 'bg-[#dfa85b] text-[#07243c]'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              النمط الملكي الداكن
            </button>
            <button
              onClick={() => setTheme('parchment')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                theme === 'parchment'
                  ? 'bg-[#dfa85b] text-[#07243c]'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              نمط الورق العتيق
            </button>
          </div>
        </div>

        {/* Canvas / Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/40 min-h-[300px]">
          <canvas ref={canvasRef} className="hidden" />
          {imageUrl ? (
            <div className="relative max-w-xs sm:max-w-sm rounded-xl overflow-hidden shadow-2xl border border-amber-400/30">
              <img
                src={imageUrl}
                alt="بطاقة الصفحة الأدبية"
                className="w-full h-auto object-contain"
              />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              جارٍ إنشاء وتصميم بطاقة المشاركة الأدبية...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#051a2c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الصورة (PNG)</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>منصة X (تويتر)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTextAndLink}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/15"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص والرابط'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
