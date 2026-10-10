import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getSiteBaseUrl } from '../config/siteDomain';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalItem, closeShareModal, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!shareModalItem) return null;

  const officialDomain = getSiteBaseUrl();
  const currentUrl = shareModalItem.url || officialDomain;
  const shareTitle = shareModalItem.title;
  const shareText = `${shareTitle} - الكاتب الروائي أ. نبيل بركات\nالموقع الرسمي المعتمد: ${officialDomain}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showToast('تم نسخ الرابط بنجاح إلى الحافظة!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('تعذر النسخ التلقائي، يمكنك نسخ الرابط يدوياً');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `الموقع الرسمي للكاتب أ. نبيل بركات: ${shareTitle}`,
          url: currentUrl,
        });
        closeShareModal();
      } catch {
        // User cancelled or failed
      }
    }
  };

  // Social URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'book':
        return 'مؤلف وكتاب';
      case 'video':
        return 'مقطع فيديو';
      case 'photo':
        return 'صورة من المعرض';
      case 'news':
        return 'مقال وخبر أدبي';
      default:
        return 'محتوى أدبي';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
      onClick={closeShareModal}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#d6e0ea]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b385e] to-[#082a47] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dfa85b]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">مشاركة المحتوى</h3>
              <p className="text-xs text-blue-100/70">{getTypeLabel(shareModalItem.type)}</p>
            </div>
          </div>
          <button
            onClick={closeShareModal}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 space-y-5">
          <div className="bg-[#f4f7fb] border border-[#dbe5f0] rounded-xl p-3.5 flex items-start gap-3">
            {shareModalItem.image ? (
              <img
                src={shareModalItem.image}
                alt={shareTitle}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#c4d4e5]"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#0b385e]/10 flex items-center justify-center shrink-0 text-[#0b385e]">
                <Share2 className="w-7 h-7" />
              </div>
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-bold text-[#0b385e] text-sm leading-snug truncate">
                {shareTitle}
              </h4>
              {shareModalItem.description && (
                <p className="text-xs text-[#64748b] line-clamp-2">
                  {shareModalItem.description}
                </p>
              )}
              <span className="inline-block text-[11px] text-[#c4924c] font-medium">
                الكاتب أ. نبيل بركات
              </span>
            </div>
          </div>

          {/* Direct Copy Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#334155]">رابط المشاركة المباشر</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#475569] font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0b385e] text-white hover:bg-[#082a47]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#334155] block">المشاركة السريعة عبر:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 transition-all text-xs font-semibold gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>واتساب</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/70 text-sky-800 transition-all text-xs font-semibold gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 -rotate-45" />
                </div>
                <span>تيليجرام</span>
              </a>

              {/* X / Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-800 transition-all text-xs font-semibold gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform font-bold text-xs">
                  𝕏
                </div>
                <span>منصة إكس</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 transition-all text-xs font-semibold gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform font-bold text-sm">
                  f
                </div>
                <span>فيسبوك</span>
              </a>
            </div>
          </div>

          {/* Native Share on Supported Devices */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-[#cbd5e1] text-[#0b385e] text-xs font-bold hover:bg-[#f1f5f9] flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>مشاركة عبر تطبيقات أخرى على جهازك</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
