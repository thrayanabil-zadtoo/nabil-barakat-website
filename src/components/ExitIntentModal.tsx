import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Smartphone,
  Download,
  Copy,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  Laptop,
  Share2,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const ExitIntentModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // Check if app is running in standalone mode (already installed)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Exit intent detection
  useEffect(() => {
    // Only show once per session
    const hasBeenShown = sessionStorage.getItem('nabil_exit_intent_shown');
    if (hasBeenShown) return;

    let timer: NodeJS.Timeout | null = null;

    // Desktop mouseleave (moving cursor toward address bar / close tab)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 15) {
        triggerModal();
      }
    };

    const triggerModal = () => {
      const alreadyShown = sessionStorage.getItem('nabil_exit_intent_shown');
      if (!alreadyShown) {
        sessionStorage.setItem('nabil_exit_intent_shown', 'true');
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    // Mobile fallback: after 45 seconds of reading if they scroll back to top
    let hasScrolledDeep = false;
    const handleScroll = () => {
      if (window.scrollY > 400) {
        hasScrolledDeep = true;
      } else if (hasScrolledDeep && window.scrollY < 50) {
        // Scrolled deep then returned to very top
        triggerModal();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Custom window trigger for author testing or quick open
    const handleManualTrigger = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-exit-intent-modal', handleManualTrigger);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-exit-intent-modal', handleManualTrigger);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  // 1. Add to Bookmarks Handler
  const handleAddToBookmarks = () => {
    const url = window.location.origin || 'https://nb.zadtoo.com';
    const title = 'الموقع الرسمي للكاتب أ. نبيل بركات';

    try {
      if ((window.external as any)?.AddFavorite) {
        (window.external as any).AddFavorite(url, title);
        return;
      }
    } catch {
      // ignore
    }

    // Copy URL to clipboard and show feedback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 4000);
      });
    } else {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 4000);
    }
  };

  // 2. Install PWA Handler
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
      return;
    }

    // Check device type for instructions
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    if (isIos) {
      setShowIosGuide(!showIosGuide);
      setShowAndroidGuide(false);
    } else {
      setShowAndroidGuide(!showAndroidGuide);
      setShowIosGuide(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className="relative w-full max-w-xl bg-gradient-to-br from-[#07243c] via-[#0a3052] to-[#041624] text-white rounded-2xl border-2 border-[#dfa85b]/40 shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5"
        dir="rtl"
      >
        {/* Decorative Golden Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#dfa85b]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
          title="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfa85b]/20 border border-[#dfa85b]/40 text-[#f5cd72] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>نسعد بتواصلك الدائم قبل المغادرة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-literary text-white tracking-wide">
            ابقَ على مقربة من جديد الكاتب نبيل بركات
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            اختر طريقتك المفضلة للوصول السريع إلى الروايات، الأمسيات الثقافية، وخدمة صانع السيرة الذاتية المجانية:
          </p>
        </div>

        {/* The Two Main Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          
          {/* ======================================================== */}
          {/* CARD 1: أضفنا للمفضلة ⭐                               */}
          {/* ======================================================== */}
          <div className="bg-white/5 hover:bg-white/10 transition-all border border-[#dfa85b]/40 hover:border-[#dfa85b] rounded-xl p-4 flex flex-col justify-between space-y-3 group shadow-md">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#dfa85b] to-[#b6872d] text-[#07243c] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Star className="w-6 h-6 fill-[#07243c]" />
              </div>
              <h3 className="font-bold text-base text-[#f5cd72] flex items-center gap-1.5">
                <span>أضفنا للمفضلة</span>
                <Bookmark className="w-4 h-4 text-[#dfa85b]" />
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                احفظ رابط الموقع في متصفحك للعودة السريعة لقراءة الفصول والمقالات في أي وقت.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAddToBookmarks}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#c5943b] hover:to-[#dfa85b] text-[#07243c] font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-[#07243c]" />
                    <span>تم نسخ الرابط للمفضلة!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>حفظ في المفضلة / نسخ الرابط</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-400 text-center leading-normal">
                💡 <span className="text-slate-300 font-semibold">اختصار سريع:</span> اضغط <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-[9px] font-mono text-white">Ctrl + D</kbd> بالحاسوب، أو خيار المشاركة بالهاتف.
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 2: تثبيت الموقع كتطبيق 📲                          */}
          {/* ======================================================== */}
          <div className="bg-white/5 hover:bg-white/10 transition-all border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-4 flex flex-col justify-between space-y-3 group shadow-md">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-emerald-300 flex items-center gap-1.5">
                <span>تثبيت الموقع</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تصفح خفيف وسريع بدون شريط عنوان وكأنه تطبيق رسمي مثبت على شاشة هاتفك أو حاسوبك.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {isInstalled ? (
                <div className="w-full py-2 px-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-inner">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>الموقع مُثبّت بالفعل على جهازك</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{deferredPrompt ? 'تثبيت فوري كتطبيق 📲' : 'تثبيت الموقع على الشاشة 📲'}</span>
                </button>
              )}

              <div className="text-[10px] text-slate-400 text-center leading-normal">
                ⚡ <span className="text-slate-300 font-semibold">بدون متجر تطبيقات:</span> خفيف الحجم ويعمل بدون استهلاك مساحة.
              </div>
            </div>
          </div>

        </div>

        {/* Guided Step Instructions (Expandable when clicked on mobile/unsupported prompt) */}
        {showIosGuide && (
          <div className="p-3 bg-white/10 rounded-xl border border-sky-400/40 text-xs space-y-1.5 animate-fade-in">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              <span>طريقة التثبيت على أجهزة iPhone / iPad (Safari):</span>
            </div>
            <ol className="list-decimal list-inside text-slate-200 text-[11px] space-y-1 pr-1">
              <li>اضغط على زر المشاركة <span className="inline-block px-1.5 py-0.5 bg-black/40 rounded border border-white/20">⎙ أو [↑]</span> في أسفل المتصفح.</li>
              <li>مرر للأسفل واختر <span className="text-[#f5cd72] font-bold">«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</span>.</li>
              <li>اضغط «إضافة» في الزاوية العلوية ليظهر التطبيق في شاشتك الرئيسية فوراً.</li>
            </ol>
          </div>
        )}

        {showAndroidGuide && (
          <div className="p-3 bg-white/10 rounded-xl border border-emerald-400/40 text-xs space-y-1.5 animate-fade-in">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>طريقة التثبيت على أجهزة Android / المتصفحات الأخرى:</span>
            </div>
            <ol className="list-decimal list-inside text-slate-200 text-[11px] space-y-1 pr-1">
              <li>اضغط على قائمة الخيارات بالمتصفح <span className="inline-block px-1.5 py-0.5 bg-black/40 rounded border border-white/20 font-mono">⋮</span> في أعلى المتصفح.</li>
              <li>اختر <span className="text-[#f5cd72] font-bold">«تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»</span>.</li>
              <li>أكد التثبيت وسيصبح الموقع متاحاً على شاشة هاتفك مثل التطبيقات.</li>
            </ol>
          </div>
        )}

        {/* Dismiss and Continue Browsing */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
          <span className="text-[11px] text-slate-400">
            الموقع الرسمي للأديب أ. نبيل بركات · nb.zadtoo.com
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-300 hover:text-white px-3 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer font-bold"
          >
            متابعة التصفح في الموقع ←
          </button>
        </div>

      </div>
    </div>
  );
};
