import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Copy,
  Check,
  Laptop,
  Bell,
  BellRing,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';
import { getInstallPageUrl, getSiteDomain, copyTextToClipboard } from '../config/siteDomain';
import { AldiwanVerifiedIcon } from './AldiwanVerifiedBadge';

export const InstallAppPage: React.FC = () => {
  const { setActiveSection, showToast } = useApp();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInAppBrowser,
    isEmbeddedIframe,
    notificationPermission,
    installNative,
    requestNotifications,
  } = usePWAInstall();

  const [copiedInstallUrl, setCopiedInstallUrl] = useState(false);
  const [installingNow, setInstallingNow] = useState(false);

  const officialInstallUrl = getInstallPageUrl();
  const siteDomain = getSiteDomain();

  const handleInstallNow = async () => {
    if (installingNow) return;
    if (!isInstallable) {
      if (isIOS) {
        showToast('على الآيفون: اضغط زر المشاركة بالأسفل ثم «إضافة إلى الشاشة الرئيسية»');
      } else if (isEmbeddedIframe) {
        showToast('للتثبيت: افتح الرابط مباشرة في متصفح Chrome أو Safari خارج نافذة المعاينة');
      } else {
        showToast('من قائمة المتصفح (⋮) بالأعلى اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»');
      }
      return;
    }

    setInstallingNow(true);
    try {
      const outcome = await installNative();
      if (outcome === 'accepted') {
        showToast('✓ تم تثبيت تطبيق أ. نبيل بركات بنجاح!');
      } else if (outcome === 'dismissed') {
        showToast('تم إلغاء نافذة التثبيت، يمكنك الضغط مرة أخرى للتثبيت في أي وقت');
      }
    } finally {
      setInstallingNow(false);
    }
  };

  const handleCopyInstallUrl = async () => {
    const ok = await copyTextToClipboard(officialInstallUrl);
    if (ok) {
      setCopiedInstallUrl(true);
      showToast('✓ تم نسخ رابط التثبيت المباشر بنجاح');
      setTimeout(() => setCopiedInstallUrl(false), 3000);
    }
  };

  return (
    <div dir="rtl" className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-gradient-to-br from-[#07243c] via-[#0a385c] to-[#051a2c] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dfa85b]/50 space-y-6">
        {/* Identity Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right border-b border-white/10 pb-5">
          <div className="w-20 h-20 rounded-2xl bg-[#051a2c] border-2 border-[#dfa85b] flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
            <img
              src="/pwa-192x192.png"
              alt="أيقونة تطبيق الكاتب أ. نبيل بركات"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dfa85b]/15 border border-[#dfa85b]/40 text-[#f5cd72] text-[11px] font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>التثبيت المباشر للتطبيق الرسمي</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-literary flex items-center justify-center sm:justify-start gap-2">
              <span>تطبيق الكاتب أ. نبيل بركات</span>
              <AldiwanVerifiedIcon size={20} />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              احصل على وصول مباشر وسريع من شاشتك الرئيسية للمؤلفات والقصائد ومجتمع الكاتب مع تنبيهات فورية لكل جديد.
            </p>
          </div>
        </div>

        {/* Embedded Preview Frame Notice */}
        {isEmbeddedIframe && !isInstalled && (
          <div className="bg-sky-950/70 border border-sky-400/50 rounded-2xl p-4 space-y-2 text-xs text-sky-100 leading-relaxed">
            <div className="font-bold text-[#f5cd72] flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ملاحظة: المتصفح لا يظهر نافذة التثبيت داخل إطار المعاينة</span>
            </div>
            <p>
              لرؤية رسالة الموافقة على التثبيت وتثبيت التطبيق على هاتفك أو جهازك، انسخ الرابط الرسمي التالي وافتحه في نافذة متصفح مستقلة (Chrome أو Safari).
            </p>
          </div>
        )}

        {/* In-App Browser Warning (WhatsApp / Facebook / Instagram WebView) */}
        {isInAppBrowser && !isInstalled && (
          <div className="bg-amber-950/70 border border-amber-400/50 rounded-2xl p-4 space-y-2 text-xs text-amber-100 leading-relaxed">
            <div className="font-bold text-[#f5cd72] flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>أنت تفتح الرابط داخل متصفح تطبيق مراسلة</span>
            </div>
            <p>
              متصفحات التطبيقات (مثل واتساب أو فيسبوك) تمنع نافذة التثبيت المباشر. اضغط على نقاط القائمة <strong>⋮</strong> بالأعلى واختر <strong>«الفتح في Chrome»</strong> أو <strong>«الفتح في Safari»</strong>، أو انسخ الرابط التالي وافتحه في متصفحك الأساسي:
            </p>
          </div>
        )}

        {/* Primary Install State */}
        {isInstalled ? (
          <div className="space-y-4">
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-base text-emerald-200">
                التطبيق مُثبّت بالفعل على جهازك
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك فتحه مباشرة من أيقونة «نبيل بركات» على شاشتك الرئيسية في أي وقت.
              </p>
            </div>

            {notificationPermission === 'granted' ? (
              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-200">
                <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>إذن الإشعارات مفعّل تلقائياً لتصلك أحدث القصائد والمنشورات والكتب.</span>
              </div>
            ) : notificationPermission === 'default' ? (
              <button
                type="button"
                onClick={() => void requestNotifications()}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>تفعيل إذن الإشعارات الآن</span>
              </button>
            ) : notificationPermission === 'denied' ? (
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-100 leading-relaxed space-y-1">
                <p className="font-bold text-[#f5cd72] flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  <span>إذن الإشعارات مقفل حالياً من إعدادات الهاتف</span>
                </p>
                <p>
                  لتفعيله في أندرويد: افتح <strong>إعدادات التطبيق ← الأذونات ← الإشعارات ← سماح</strong>.
                </p>
              </div>
            ) : null}
          </div>
        ) : isInstallable ? (
          <div className="space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 leading-relaxed flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                الرابط جاهز! المتصفح يتطلب ضغطة واحدة على الزر التالي لإظهار رسالة الموافقة على التثبيت وتفعيل الإشعارات تلقائياً.
              </span>
            </div>

            <button
              type="button"
              disabled={installingNow}
              onClick={handleInstallNow}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-black text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer disabled:opacity-70 animate-pulse"
            >
              <Download className="w-5 h-5" />
              <span>{installingNow ? 'جاري إظهار رسالة الموافقة...' : 'اضغط هنا لتثبيت التطبيق والموافقة الآن'}</span>
            </button>
          </div>
        ) : isIOS ? (
          <div className="border border-sky-400/30 text-xs sm:text-sm text-slate-200 bg-black/30 p-4 rounded-2xl space-y-2.5">
            <p className="font-bold text-[#f5cd72] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>خطوات التثبيت على أجهزة iPhone / iPad (متصفح Safari):</span>
            </p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                اضغط على زر المشاركة{' '}
                <Share className="w-4 h-4 inline mx-0.5 text-sky-400" /> في شريط متصفح Safari.
              </li>
              <li>
                اختر{' '}
                <span className="font-bold text-white">«إضافة إلى الشاشة الرئيسية»</span>{' '}
                <PlusSquare className="w-4 h-4 inline mx-0.5 text-[#dfa85b]" />.
              </li>
              <li>
                اضغط <span className="font-bold text-white">«إضافة»</span> ليثبت التطبيق وتظهر أيقونته على شاشتك.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-sky-400/30 text-xs sm:text-sm text-slate-200 bg-black/30 p-4 rounded-2xl space-y-3">
              <p className="font-bold text-[#f5cd72] flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>تثبيت التطبيق مباشرة عبر المتصفح ({siteDomain}):</span>
              </p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  على الهاتف (Android Chrome): افتح قائمة المتصفح{' '}
                  <span className="px-1.5 py-0.5 bg-white/10 rounded font-mono">⋮</span> ثم اضغط{' '}
                  <span className="font-bold text-white">«تثبيت التطبيق»</span> أو{' '}
                  <span className="font-bold text-white">«إضافة إلى الشاشة الرئيسية»</span>.
                </li>
                <li>
                  على الكمبيوتر (Chrome / Edge): اضغط على أيقونة التثبيت{' '}
                  <span className="px-1.5 py-0.5 bg-white/10 rounded font-mono">⊕</span> في شريط العنوان بالأعلى.
                </li>
              </ol>
              <p className="text-[11px] text-amber-200/90 pt-1">
                إذا كان التطبيق مثبتاً بالفعل على جهازك أو تم رفض التثبيت مسبقاً، لن يظهر المتصفح رسالة التثبيت التلقائية مجدداً، ويمكنك إضافته يدوياً من قائمة المتصفح (⋮).
              </p>
            </div>

            <button
              type="button"
              onClick={handleInstallNow}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق عبر المتصفح</span>
            </button>
          </div>
        )}

        {/* Direct Shareable Install URL Box */}
        <div className="bg-black/30 border border-white/15 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold text-[#f5cd72]">رابط التثبيت المباشر الرسمي:</span>
            <span className="font-mono text-[11px] text-slate-400">{siteDomain}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-sky-200 dir-ltr truncate select-all">
              {officialInstallUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyInstallUrl}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
            >
              {copiedInstallUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>نسخ رابط التثبيت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveSection('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>دخول الموقع الرسمي</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('community');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#dfa85b]/20 hover:bg-[#dfa85b]/30 border border-[#dfa85b]/40 text-xs font-bold text-[#f5cd72] transition cursor-pointer"
          >
            <span>قسم المجتمع والقصائد</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
