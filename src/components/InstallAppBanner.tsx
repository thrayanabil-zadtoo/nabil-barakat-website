import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Copy,
  Check,
  Laptop,
  Bell,
  BellRing,
} from 'lucide-react';
import {
  OPEN_PWA_INSTALL_EVENT,
  usePWAInstall,
} from '../hooks/usePWAInstall';
import { getSiteDomain, getInstallPageUrl, copyTextToClipboard } from '../config/siteDomain';

export const InstallAppBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    notificationPermission,
    installNative,
    requestNotifications,
  } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const installUrl = getInstallPageUrl();
  const siteDomain = getSiteDomain();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener(OPEN_PWA_INSTALL_EVENT, handleOpen);
    return () => {
      window.removeEventListener(OPEN_PWA_INSTALL_EVENT, handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('nabil_barakat_pwa_dismissed', Date.now().toString());
    } catch {
      // ignore storage errors
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await installNative();
      if (outcome === 'accepted') {
        setIsOpen(false);
      }
    }
  };

  const handleCopySiteUrl = async () => {
    const ok = await copyTextToClipboard(installUrl);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  // Never render permanently or automatically on the screen; only open when triggered from menu/footer
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-br from-[#07243c] via-[#0a385c] to-[#051a2c] text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#dfa85b]/50 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#051a2c] border border-[#dfa85b]/60 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              <img
                src="/pwa-192x192.png"
                alt="أيقونة تطبيق أ. نبيل بركات"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 id="pwa-install-title" className="font-bold text-base text-[#f5cd72]">
                تثبيت موقع الكاتب أ. نبيل بركات
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                وصول فوري من شاشتك الرئيسية وتصفح سلس للمؤلفات والخدمات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content based on installation state & platform */}
        {isInstalled ? (
          <div className="space-y-3">
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-sm text-emerald-200">
                التطبيق مُثبّت بالفعل على جهازك
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك فتح الموقع مباشرة من أيقونة «نبيل بركات» على شاشتك الرئيسية في أي وقت.
              </p>
            </div>

            {notificationPermission === 'granted' ? (
              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-200">
                <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>إذن الإشعارات مفعّل تلقائياً لتلقي جديد القصائد والكتب.</span>
              </div>
            ) : notificationPermission === 'default' ? (
              <button
                type="button"
                onClick={() => void requestNotifications()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>تفعيل إذن الإشعارات الآن</span>
              </button>
            ) : notificationPermission === 'denied' ? (
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-100 leading-relaxed space-y-1">
                <p className="font-bold text-[#f5cd72] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>إذن الإشعارات مقفل من إعدادات الجهاز</span>
                </p>
                <p className="text-[11px] text-slate-200">
                  لتفعيله في الأندرويد: افتح <strong>إعدادات التطبيق ← الأذونات ← الإشعارات ← سماح</strong>.
                </p>
              </div>
            ) : null}
          </div>
        ) : isInstallable ? (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-[#dfa85b] shrink-0 mt-0.5" />
              <span>
                جهازك يدعم التثبيت الفوري. اضغط على زر التثبيت لإضافة أيقونة الموقع وطلب تفعيل الإشعارات تلقائياً فور التثبيت.
              </span>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق وتفعيل الإشعارات</span>
            </button>
          </div>
        ) : isIOS ? (
          <div className="border border-sky-400/30 text-xs text-slate-200 bg-black/30 p-3.5 rounded-xl space-y-2">
            <p className="font-bold text-[#f5cd72] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>طريقة التثبيت على أجهزة iPhone / iPad (Safari):</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
              <li>
                اضغط على زر المشاركة{' '}
                <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> في شريط متصفح Safari.
              </li>
              <li>
                اختر من القائمة{' '}
                <span className="font-bold text-white">«إضافة إلى الشاشة الرئيسية»</span>{' '}
                <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#dfa85b]" />.
              </li>
              <li>
                اضغط على <span className="font-bold text-white">«إضافة»</span> ليظهر تطبيق «نبيل بركات» على شاشتك.
              </li>
            </ol>
          </div>
        ) : (
          <div className="border border-emerald-400/30 text-xs text-slate-200 bg-black/30 p-3.5 rounded-xl space-y-2.5">
            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>خطوات التثبيت عبر متصفحك ({siteDomain}):</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed">
              <li>
                على الهاتف (Android Chrome): افتح قائمة المتصفح{' '}
                <span className="px-1.5 py-0.5 bg-white/10 rounded font-mono">⋮</span> ثم اختر{' '}
                <span className="font-bold text-[#f5cd72]">«تثبيت التطبيق»</span> أو{' '}
                <span className="font-bold text-[#f5cd72]">«إضافة إلى الشاشة الرئيسية»</span>.
              </li>
              <li>
                على الكمبيوتر (Chrome / Edge): اضغط على أيقونة التثبيت{' '}
                <span className="px-1.5 py-0.5 bg-white/10 rounded font-mono">⊕</span> في شريط العنوان بالأعلى.
              </li>
            </ol>

            <button
              type="button"
              onClick={handleCopySiteUrl}
              className="w-full mt-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-slate-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">تم نسخ رابط التثبيت المباشر</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>نسخ رابط التثبيت المباشر ({siteDomain}/install)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer link & dismiss */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
          <span className="font-mono text-[#f5cd72]">{siteDomain}</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
