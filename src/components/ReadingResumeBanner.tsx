import React, { useState, useEffect } from 'react';
import { BookOpen, X, Sparkles, ChevronLeft, Bookmark } from 'lucide-react';
import { getReadingProgress, clearReadingProgress, ReadingBookmark } from '../utils/deviceDetector';

interface ReadingResumeBannerProps {
  onResumeReading: (bookmark: ReadingBookmark) => void;
}

export const ReadingResumeBanner: React.FC<ReadingResumeBannerProps> = ({ onResumeReading }) => {
  const [bookmark, setBookmark] = useState<ReadingBookmark | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initial check
    const current = getReadingProgress();
    setBookmark(current);

    // Listen for bookmark updates
    const handleBookmarkUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ReadingBookmark | null>;
      setBookmark(customEvent.detail);
      setIsDismissed(false);
    };

    window.addEventListener('zadtoo_reading_bookmark_updated', handleBookmarkUpdate);
    return () => window.removeEventListener('zadtoo_reading_bookmark_updated', handleBookmarkUpdate);
  }, []);

  if (!bookmark || isDismissed) return null;

  return (
    <aside
      aria-label="استئناف القراءة السابقة"
      className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white border-b border-amber-400/30 shadow-lg px-4 py-2.5 transition-all duration-300 relative z-30"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Left: Device Recognition + Where Reader Stopped */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[#dfa85b] shrink-0 shadow-inner">
            <Bookmark className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مرحباً بك مجدداً! يمكنك استئناف القراءة حيث توقفت سابقاً:</span>
              </span>
            </div>

            <p className="text-[12px] text-slate-200 flex items-center gap-1.5 flex-wrap">
              <span>كتاب</span>
              <strong className="text-white font-bold underline decoration-amber-400">«{bookmark.bookTitle}»</strong>
              <span>- {bookmark.pageTitle}</span>
              <span className="text-amber-300 font-mono font-bold">
                (صفحة {bookmark.pageNumber} من {bookmark.totalPages} · إنجاز {bookmark.percent}%)
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 mr-auto">
          <button
            type="button"
            onClick={() => onResumeReading(bookmark)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-[#dfa85b] hover:from-amber-300 hover:to-[#c4924c] text-[#07243c] font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            title="الانتقال فوراً إلى آخر صفحة توقفت عندها في القراءة مع تشغيل الموسيقى المرافقة"
          >
            <BookOpen className="w-4 h-4 fill-current" />
            <span>متابعة القراءة فوراً من حيث توقفت</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="إغلاق التنبيه مؤقتاً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
