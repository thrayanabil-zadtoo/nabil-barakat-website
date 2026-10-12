/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MusicProvider } from './context/MusicContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeHero } from './components/HomeHero';
import { BooksSection } from './components/BooksSection';
import { VideosSection } from './components/VideosSection';
import { NewsSection } from './components/NewsSection';
import { LinksSection } from './components/LinksSection';
import { ContactAndGuestbookSection } from './components/ContactAndGuestbookSection';
import { AuthorAdminModal } from './components/AuthorAdminModal';
import { InlineEditModal } from './components/InlineEditModal';
import { ShareModal } from './components/ShareModal';
import { UniversalCommentModal } from './components/UniversalCommentModal';
import { SupervisorLoginModal } from './components/SupervisorLoginModal';
import { Toast } from './components/Toast';
import { UploadProgressModal } from './components/UploadProgressModal';
import { PoeticMarquee } from './components/PoeticMarquee';
import { HeaderAnnouncementBanner } from './components/HeaderAnnouncementBanner';
import { ReadingResumeBanner } from './components/ReadingResumeBanner';
import { BookReaderModal } from './components/BookReaderModal';
import { ReadingBookmark } from './utils/deviceDetector';
import { useMusic } from './context/MusicContext';
import { Book } from './types';
import { ShieldCheck, Lock, LogOut, Eye, CheckCircle2 } from 'lucide-react';
import { PhotosSection } from './components/PhotosSection';
import { CvMakerPlatform } from './components/cv/CvMakerPlatform';
import { CvPublicViewer } from './components/cv/CvPublicViewer';
import { getPublicCvRecord, createDefaultCv } from './utils/cvStorage';

const MainContent: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    books,
    isAuthorMode,
    isSupervisorLoggedIn,
    isVisitorPreviewMode,
    toggleVisitorPreview,
    setIsLoginModalOpen,
    logoutSupervisor,
    authorProfile,
  } = useApp();

  const { playMusic } = useMusic();

  const [activeResumeBook, setActiveResumeBook] = React.useState<{
    book: Book;
    pageIndex: number;
  } | null>(null);

  // Check if public CV QR link was opened
  const [publicCvId, setPublicCvId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#cv-')) {
      return window.location.hash.replace('#cv-', '');
    }
    return null;
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#cv-')) {
        setPublicCvId(window.location.hash.replace('#cv-', ''));
      } else {
        setPublicCvId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleResumeReading = (bookmark: ReadingBookmark) => {
    const targetBook = books.find((b) => b.id === bookmark.bookId) || books[0];
    if (targetBook) {
      setActiveResumeBook({
        book: targetBook,
        pageIndex: bookmark.pageIndex,
      });
      playMusic();
    }
  };

  // 1. PUBLIC CV QR VIEW (When someone scans the QR code on a CV)
  if (publicCvId) {
    const publicCv = getPublicCvRecord(publicCvId) || createDefaultCv('ar');
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <CvPublicViewer
          cv={publicCv}
          onGoToMaker={() => {
            window.location.hash = '';
            setPublicCvId(null);
            setActiveSection('cv');
          }}
          onBackToAuthorSite={() => {
            window.location.hash = '';
            setPublicCvId(null);
            setActiveSection('home');
          }}
        />
        <Footer />
      </div>
    );
  }

  // 2. DEDICATED CV MAKER SECTION (Separate Header, author footer, mobile menu with author sections + return)
  if (activeSection === 'cv') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
        <CvMakerPlatform />
        <Toast />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] text-[#1f2937] font-sans selection:bg-[#dfa85b]/40 selection:text-[#0b385e]">
      
      {/* Top Notification / Supervisor Quick Status Bar */}
      <div className="bg-[#07243c] border-b border-[#051c2f] px-4 py-1.5 text-[11px] text-[#cbe0f0]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>الموقع الرسمي للكاتب أ. نبيل بركات · عضو الجمعية المصرية لكتاب القصة والرواية</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[#94b5d0]">
              المراسلة والتعليقات مفعلة للزوار
            </span>
            {isSupervisorLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="bg-[#dfa85b] text-[#07243c] font-black px-2 py-0.5 rounded text-[10px]">
                  المشرف: أ. نبيل بركات
                </span>

                <button
                  type="button"
                  onClick={toggleVisitorPreview}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                    isVisitorPreviewMode
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-[#cbe0f0] border-white/20'
                  }`}
                  title={
                    isVisitorPreviewMode
                      ? 'العودة لتفعيل أدوات وتعديلات المشرف'
                      : 'إخفاء أدوات المشرف لمعاينة ما يراه الزوار والعامة'
                  }
                >
                  <Eye className="w-3 h-3 text-[#dfa85b]" />
                  <span>{isVisitorPreviewMode ? 'العودة لوضع المشرف ✏️' : 'معاينة كزائر (إخفاء التعديلات)'}</span>
                </button>

                <button
                  onClick={logoutSupervisor}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 transition cursor-pointer"
                  title="تسجيل خروج المشرف وقفل الصلاحيات"
                >
                  <LogOut className="w-2.5 h-2.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Supervisor Mode Explanation Banner */}
      {isSupervisorLoggedIn && !isVisitorPreviewMode && (
        <div className="bg-amber-50/95 border-b border-amber-200/80 px-4 py-1.5 text-center text-xs text-amber-900 font-medium flex items-center justify-center gap-2 shadow-2xs">
          <span>أنت الآن في <strong>وضع المشرف</strong>: أزرار التعديل وتغيير الأغلفة وإضافة الصور ظاهرة لك فقط، ومخفية تماماً عن الزوار والعامة.</span>
          <button
            onClick={toggleVisitorPreview}
            className="text-[11px] font-bold text-[#0b385e] hover:underline cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            <span>معاينة الموقع كزائر عام</span>
          </button>
        </div>
      )}

      {/* Visitor Preview Active Banner */}
      {isSupervisorLoggedIn && isVisitorPreviewMode && (
        <div className="bg-sky-700 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-inner">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>معاينة الزائر نشطة: هكذا يظهر الموقع للعامة تماماً بدون أي أزرار تعديل أو تغيير أغلفة.</span>
          </div>
          <button
            onClick={toggleVisitorPreview}
            className="px-2.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded font-black transition cursor-pointer shadow-xs text-[11px]"
          >
            العودة لوضع المشرف ✏️
          </button>
        </div>
      )}

      {/* Smart Reading Bookmark Resume Banner (تنبيه التعرّف على جهاز القارئ واستئناف القراءة) */}
      <ReadingResumeBanner onResumeReading={handleResumeReading} />

      {/* Main Navigation Bar */}
      <Navbar />

      {/* Poetic Ribbon Marquee (شريط ومضات أدبية متحرك بانسيابية شاعريّة) */}
      <PoeticMarquee />

      {/* Main Body Content */}
      <main className="flex-1 w-full">
        {activeSection === 'home' ? (
          <HomeHero />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 space-y-6">
            <HeaderAnnouncementBanner />
            {activeSection === 'books' && <BooksSection />}
            {activeSection === 'videos' && <VideosSection />}
            {activeSection === 'photos' && <PhotosSection />}
            {activeSection === 'news' && <NewsSection />}
            {activeSection === 'links' && <LinksSection />}
            {activeSection === 'contact' && <ContactAndGuestbookSection />}
          </div>
        )}
      </main>

      {/* Supervisor Control Panel Modal */}
      <AuthorAdminModal />

      {/* Supervisor Secure Login Modal */}
      <SupervisorLoginModal />

      {/* Supervisor Direct Inline Edit Modal */}
      <InlineEditModal />

      {/* Universal Share Modal */}
      <ShareModal />

      {/* Universal Comment Modal with Math Verification */}
      <UniversalCommentModal />

      {/* Floating Feedback Toast */}
      <Toast />

      {/* Cloud Upload Visual Progress Indicator */}
      <UploadProgressModal />

      {/* Resume Reading Active Book Modal */}
      {activeResumeBook && (
        <BookReaderModal
          book={activeResumeBook.book}
          initialPageIndex={activeResumeBook.pageIndex}
          onClose={() => setActiveResumeBook(null)}
        />
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MusicProvider>
        <MainContent />
      </MusicProvider>
    </AppProvider>
  );
}
