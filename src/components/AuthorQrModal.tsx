import React from 'react';
import { X, QrCode, Download, Share2, Copy, Check, ExternalLink, Sparkles, Feather } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSiteBaseUrl, getSiteDomain } from '../config/siteDomain';

interface AuthorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorQrModal: React.FC<AuthorQrModalProps> = ({ isOpen, onClose }) => {
  const { authorProfile, showToast } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const siteUrl = getSiteBaseUrl();
  const siteDomain = getSiteDomain();
  // High quality QR Code image with deep navy foreground
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(
    siteUrl
  )}&color=07243c&bgcolor=ffffff&margin=2`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      showToast(`تم نسخ رابط موقع الكاتب نبيل بركات بنجاح (${siteDomain})`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = 'Nabil_Barakat_Official_QR_Code.png';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('جاري تحميل رمز الباركود (QR Code)...');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `الموقع والمنصة الرسمية المعتمدة للكاتب والروائي أ. نبيل بركات:\n${siteUrl}\nتصفح الروايات والكتب ومتابعة أحدث الإصدارات.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-400/40 text-center"
      >
        {/* Header Header Pattern */}
        <div className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-[#dfa85b] shadow-inner mb-3">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-black font-literary flex items-center justify-center gap-1.5 text-white">
            <span>الباركود الرسمي (QR Code) للكاتب</span>
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
          </h3>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            أ. نبيل بركات · المنصة الرقمية المعتمدة
          </p>
        </div>

        {/* QR Code Presentation Box */}
        <div className="p-6 space-y-5">
          <div className="relative inline-block p-4 bg-gradient-to-br from-amber-50 to-slate-50 border-2 border-[#dfa85b] rounded-2xl shadow-md">
            <img
              src={qrImageUrl}
              alt="رمز QR لموقع الكاتب نبيل بركات"
              className="w-56 h-56 mx-auto rounded-xl shadow-inner bg-white p-2"
            />
            {/* Center Monogram Logo overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-[#07243c] border-2 border-amber-400 shadow-lg flex items-center justify-center text-[#dfa85b]">
                <Feather className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-[#07243c] font-mono">
              {siteDomain}
            </div>
            <p className="text-[11px] text-slate-500">
              امسح الرمز بكاميرا الجوال للانتقال المباشر للموقع الرسمي وتصفح الروايات
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-3 py-2 bg-gradient-to-r from-[#0b385e] to-[#07243c] hover:from-[#092b47] hover:to-[#051a2c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border border-amber-400/30"
            >
              <Download className="w-4 h-4 text-[#dfa85b]" />
              <span>تحميل الرمز PNG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة عبر واتساب (WhatsApp)</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
          حقوق الملكية الفكرية محفوظة للكاتب نبيل بركات © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
