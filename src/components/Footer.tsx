import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, LogOut, Settings, QrCode, ShieldCheck, FileText, User, Sparkles, Download, Bookmark } from 'lucide-react';
import { LegalPagesModal, LegalTabType } from './LegalPagesModal';
import { AuthorQrModal } from './AuthorQrModal';
import { AuthorSeal } from './AuthorSeal';
import { getSiteDomain } from '../config/siteDomain';
import { downloadFileSafely } from '../utils/downloadHelper';

export const Footer: React.FC = () => {
  const {
    setActiveSection,
    isAuthorMode,
    setIsAdminPanelOpen,
    setIsLoginModalOpen,
    logoutSupervisor,
    showToast,
  } = useApp();

  const [legalModalTab, setLegalModalTab] = useState<LegalTabType | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-[#051a2c] text-[#dbe7ee] border-t border-amber-400/30 pt-8 pb-6 mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Top Section: Author Seal & Motto & Navigation */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <AuthorSeal size="sm" showText={true} />
            </div>

            {/* Legal & About Links Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('licenses');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-amber-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer bg-amber-400/10 border border-amber-400/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>تراخيص المؤلف والتوثيق</span>
              </button>

              <button
                type="button"
                onClick={() => setLegalModalTab('about')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-amber-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>من نحن (سيرة الكاتب)</span>
              </button>

              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-amber-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>سياسة الخصوصية</span>
              </button>

              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-amber-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>شروط الاستخدام</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-400/30 hover:from-amber-400/30 hover:to-amber-400/40 text-amber-300 border border-amber-400/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="عرض الباركود الرسمي للكاتب لمشاركته أو تحميله"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-300" />
                <span>الباركود الرسمي (QR)</span>
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-exit-intent-modal'))}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="أضفنا للمفضلة أو ثبّت الموقع كتطبيق على جهازك"
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
                <span>أضفنا للمفضلة / تثبيت الموقع ⭐</span>
              </button>
            </div>
          </div>

          {/* Bottom Line: Copyright, Motto, and Supervisor Login */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
            
            {/* Copyright */}
            <div className="flex items-center gap-2 flex-wrap text-center sm:text-right">
              <span>© {new Date().getFullYear()} الكاتب والروائي أ. نبيل بركات — جميع الحقوق محفوظة</span>
              <span className="text-[#f5cd72] font-mono font-bold">· {getSiteDomain()}</span>
            </div>

            {/* Supervisor Action Button */}
            <div className="flex items-center gap-4 text-[#dbe7ee]">
              <span className="font-literary text-xs sm:text-sm text-[#f5cd72] hidden lg:inline">
                حروفي مرآتي وصمتي قصيدة
              </span>

              <div>
                {isAuthorMode ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        downloadFileSafely(
                          '/Nabil_Barakat_Website_Production_Ready.zip',
                          'Nabil_Barakat_Website_Production_Ready.zip',
                          showToast
                        );
                      }}
                      className="border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                      title="تحميل ملف الموقع المجهز للنشر على الاستضافة"
                    >
                      <Download className="w-3 h-3 text-emerald-300" />
                      <span className="hidden sm:inline">تحميل ZIP الاستضافة</span>
                      <span className="sm:hidden">ZIP</span>
                    </button>
                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="border border-[#e7c76d] text-[#f5cd72] hover:bg-[#ffffff14] px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="فتح لوحة التحكم"
                    >
                      <Settings className="w-3 h-3 text-[#f5cd72]" />
                      <span>لوحة التحكم</span>
                    </button>
                    <button
                      onClick={logoutSupervisor}
                      className="border border-rose-400/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="تسجيل خروج المشرف"
                    >
                      <LogOut className="w-3 h-3 text-rose-400" />
                      <span>خروج</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="border border-[#e7c76d] text-[#f5cd72] hover:bg-[#ffffff14] px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="تسجيل دخول المشرف (موقع خاص)"
                  >
                    <Lock className="w-3 h-3 text-[#f5cd72]" />
                    <span>دخول المشرف (موقع خاص)</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </footer>

      {/* Legal & About Pages Modal */}
      {legalModalTab && (
        <LegalPagesModal
          isOpen={true}
          initialTab={legalModalTab}
          onClose={() => setLegalModalTab(null)}
        />
      )}

      {/* Author QR Code Modal */}
      {isQrModalOpen && (
        <AuthorQrModal
          isOpen={true}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}
    </>
  );
};
