import React from 'react';
import { CvData } from '../../types/cv';
import { CvPreview } from './CvPreview';
import { Sparkles, ArrowRight, Printer, Download, Share2 } from 'lucide-react';

interface CvPublicViewerProps {
  cv: CvData;
  onGoToMaker: () => void;
  onBackToAuthorSite: () => void;
}

export const CvPublicViewer: React.FC<CvPublicViewerProps> = ({
  cv,
  onGoToMaker,
  onBackToAuthorSite,
}) => {
  const isAr = cv.lang === 'ar';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. TOP STICKY PROMO BANNER AS REQUESTED BY USER */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#0b385e] via-[#0d4777] to-[#07243c] text-white px-4 py-3 shadow-md print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right rtl:sm:text-right ltr:sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#dfa85b] text-[#07243c] rounded-lg font-black text-xs shrink-0">
              C.V
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-[#dfa85b]" />
                <span>امتلك السيرة الذاتية مجاناً مع منصة C.V</span>
              </h2>
              <p className="text-[11px] text-sky-200">
                أنشئ سيرتك الذاتية الاحترافية بالعربية أو الإنجليزية خلال دقائق وبدون تسجيل.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToMaker}
              className="px-4 py-2 bg-[#dfa85b] hover:bg-[#c9954b] text-[#07243c] font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <span>أنشئ سيرتك الذاتية الآن مجاناً</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 border border-white/20"
              title="طباعة / تحميل PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">طباعة / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Return to author link */}
      <div className="bg-white/80 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-600 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span>معاينة إلكترونية رسمية للسيرة الذاتية</span>
          <button
            type="button"
            onClick={onBackToAuthorSite}
            className="text-[#0b385e] hover:underline font-bold"
          >
            العودة لموقع الكاتب أ. نبيل بركات ←
          </button>
        </div>
      </div>

      {/* 2. CV PREVIEW CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <CvPreview cv={cv} publicMode={true} />
      </main>
    </div>
  );
};
