import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Share2,
  MessageSquare,
  Send,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { BookReaderModal } from './BookReaderModal';
import { HeaderPhotoModal } from './HeaderPhotoModal';
import { HeaderAnnouncementBanner } from './HeaderAnnouncementBanner';
import { SiteStatisticsHub } from './SiteStatisticsHub';
import { AuthorFeedSection } from './AuthorFeedSection';
import { AddBookModal } from './AddBookModal';
import { AldiwanCertifiedBadge, AldiwanVerifiedIcon } from './AldiwanVerifiedBadge';
import { DesktopRightSidebar, DesktopLeftSidebar } from './DesktopCompanionSidebars';
import { Book, PhotoItem } from '../types';

export const HomeHero: React.FC = () => {
  const {
    authorProfile,
    books,
    videos,
    photos,
    news,
    links,
    comments,
    sendMessage,
    setActiveSection,
    isAuthorMode,
    setEditingVideo,
    setEditingNews,
    setEditingBook,
    setEditingPhoto,
    setIsAuthorMode,
    setIsAddBookModalOpen,
    openShareModal,
    openCommentModal,
    likeComment,
  } = useApp();

  // Contact Form State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMsg, setSenderMsg] = useState('');
  const [formSent, setFormSent] = useState(false);

  // Header Photo Customization Modal
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);

  // Selected Book for Reading Modal
  const [selectedBookForReading, setSelectedBookForReading] = useState<Book | null>(null);

  // Active Video in carousel
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const activeVideo = videos[currentVideoIdx] || videos[0];

  // Lightbox Photo state
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !senderMsg.trim()) return;

    sendMessage({
      senderName: senderName.trim(),
      email: senderEmail.trim(),
      subject: 'رسالة تواصل من الصفحة الرئيسية',
      message: senderMsg.trim(),
    });

    setSenderName('');
    setSenderEmail('');
    setSenderMsg('');
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4500);
  };

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  const visibleBooks = isAuthorMode
    ? books
    : books.filter((b) => (b.visibility || (b.id === 'book-5' ? 'cover_only' : 'public')) !== 'hidden');
  const featuredBooks = visibleBooks.slice(0, 4);
  const featuredNews = news.slice(0, 4);
  const featuredPhotos = photos.slice(0, 4);

  // Only approved comments are displayed publicly
  const approvedComments = comments.filter((c) => c.isApproved || c.status === 'approved');
  const latestComment = approvedComments[0];

  return (
    <div className="w-full pb-12" dir="rtl">
      
      {/* 1. HERO HEADER:
          - Desktop: Full Bleed Background Image with Text Overlayed On Top
          - Mobile & Tablet: Author Photo inside a Centered Circle with Dark Navy Gradient Background
      */}
      <section className="w-full relative overflow-hidden min-h-[500px] lg:min-h-[560px] flex items-center shadow-lg border-b border-[#07243c]/40">
        
        {/* Desktop Full Bleed Background Image (فقط على شاشات الكمبيوتر lg وأكبر) */}
        <div className="absolute inset-0 z-0">
          <img
            src={authorProfile.portraitImage || '/author.jpg'}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== '/author.jpg' && !target.src.endsWith('/author.jpg')) {
                target.src = '/author.jpg';
              }
            }}
            alt={`صورة الكاتب ${authorProfile.name}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[left_top] md:object-[22%_center] filter saturate-[0.98] contrast-[1.02] hidden lg:block"
          />

          {/* Mobile & Tablet Background: Luxury deep navy with subtle warm golden glow */}
          <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#061e33] via-[#07243c] to-[#041422]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#dfa85b]/20 via-transparent to-transparent" />
          </div>

          {/* Desktop Gradient Scrim Overlay */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-l from-[#07243c]/95 via-[#07243c]/85 via-50% to-[#07243c]/20 md:to-transparent" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#07243c]/80 via-transparent to-black/30" />
        </div>

        {/* Content Container:
            - Mobile & Tablet: Centered layout with circular portrait in the center
            - Desktop: Left-aligned visual with text on the right
        */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-12 py-10 sm:py-14 lg:py-20 flex flex-col justify-center items-center lg:items-start text-center lg:text-right">
          <div className="max-w-2xl space-y-4 flex flex-col items-center lg:items-start">
            
            {/* Mobile & Tablet Only: Centered Circular Portrait / صورة الكاتب داخل دائرة بالمنتصف للموبايل والتابلت */}
            <div className="lg:hidden flex flex-col items-center justify-center pb-3 pt-1">
              <div className="relative">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-[#dfa85b] shadow-2xl ring-4 ring-[#dfa85b]/30 bg-[#07243c]">
                  <img
                    src={authorProfile.portraitImage || '/author.jpg'}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== '/author.jpg' && !target.src.endsWith('/author.jpg')) {
                        target.src = '/author.jpg';
                      }
                    }}
                    alt={`صورة الكاتب ${authorProfile.name}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-[25%_15%]"
                  />
                </div>
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#dfa85b] to-[#c4924c] text-[#07243c] font-black text-xs shadow-md">
                  {authorProfile.name}
                </div>
              </div>
            </div>

            {/* Author Name */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-literary leading-tight drop-shadow-md flex items-center justify-center lg:justify-start gap-2.5 flex-wrap">
              <span>{authorProfile.name || 'أ. نبيل بركات'}</span>
              <AldiwanVerifiedIcon size={30} className="text-[#1D9BF0]" />
            </h1>

            {/* Literary Divider */}
            <div className="text-[#f5cd72] text-xl sm:text-2xl lg:text-3xl font-serif drop-shadow">✦</div>

            {/* Motto */}
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#f5cd72] font-literary drop-shadow-md leading-snug">
              حروفي مرآتي وصمتي قصيدة
            </p>

            {/* Association & Role */}
            <div className="space-y-2 text-center lg:text-right py-1">
              <p className="text-base sm:text-lg lg:text-xl font-bold text-[#dfa85b] drop-shadow-md">
                عضو الجمعية المصرية لكتاب القصة والرواية
              </p>

              {/* شاعر معتمد في الدِّيوَان مع علامة النجمة الزرقاء الموثقة بالحركات كما بالصورة */}
              <div className="flex items-center justify-center lg:justify-start pt-0.5">
                <AldiwanCertifiedBadge size="lg" variant="badge" theme="dark" />
              </div>

              <p className="text-sm sm:text-base lg:text-lg font-medium text-white/95 drop-shadow">
                روائي وشاعر
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
              <button
                onClick={() => setActiveSection('books')}
                className="px-6 py-3 rounded-xl bg-[#dfa85b] hover:bg-[#c99547] text-[#07243c] text-xs sm:text-sm font-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#07243c]" />
                <span>استكشف مؤلفاتي ({visibleBooks.length} مؤلفات)</span>
              </button>

              <button
                onClick={() => setActiveSection('licenses')}
                className="px-5 py-3 rounded-xl bg-[#dfa85b]/20 hover:bg-[#dfa85b]/30 text-[#f5cd72] border border-[#dfa85b]/50 backdrop-blur-md text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 hover:border-[#dfa85b] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#f5cd72]" />
                <span>تراخيص المؤلف</span>
              </button>

              <button
                onClick={() => setActiveSection('contact')}
                className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 hover:border-white/50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#f5cd72]" />
                <span>تواصل معي</span>
              </button>

              <button
                onClick={() =>
                  openShareModal({
                    title: `الموقع الرسمي للكاتب ${authorProfile.name}`,
                    description: authorProfile.motto,
                    type: 'general',
                  })
                }
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
                title="مشاركة الموقع"
              >
                <Share2 className="w-4 h-4 text-[#f5cd72]" />
                <span className="hidden sm:inline">مشاركة الموقع</span>
              </button>

              {/* Supervisor Edit Photo & Header */}
              {isAuthorMode && (
                <button
                  onClick={() => setIsHeaderModalOpen(true)}
                  className="px-4 py-3 rounded-xl bg-[#07375a]/90 hover:bg-[#07375a] text-[#f5cd72] border border-[#f5cd72]/40 text-xs font-bold transition flex items-center gap-1.5 shadow-md backdrop-blur-sm cursor-pointer"
                  title="تخصيص صورة الكاتب والبانر"
                >
                  <Camera className="w-4 h-4" />
                  <span>تعديل الصورة والبانر</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Floating Author Mode Badge at bottom left for quick editing */}
        {isAuthorMode && (
          <button
            onClick={() => setIsHeaderModalOpen(true)}
            className="absolute bottom-4 left-4 z-20 bg-[#07375a]/90 hover:bg-[#07375a] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md border border-[#dfa85b]/30 transition"
          >
            <Camera className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>تغيير صورة الهيدر</span>
          </button>
        )}

      </section>

      {/* Main Page Content Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">

        {/* 📢 Glowing Rotating Announcement Box: أسفل الهيدر وأسفل صورة الكاتب مباشرة */}
        <HeaderAnnouncementBanner />

        {/* 2. THREE-COLUMN CONTENT GRID (Desktop Sidebars flanking Center Feed) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMN 1: RIGHT SIDE (lg:col-span-3) - أحدث مؤلفاتي وفيديو والتراخيص (للكمبيوتر فقط وليس للموبايل) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <DesktopRightSidebar />
        </aside>

        {/* COLUMN 2: CENTER (lg:col-span-6) - منشورات وخواطر الكاتب */}
        <div className="w-full lg:col-span-6 min-w-0 space-y-4">
          <AuthorFeedSection />
        </div>

        {/* COLUMN 3: LEFT SIDE (lg:col-span-3) - تواصل معي والتعليقات والأخبار (للكمبيوتر فقط وليس للموبايل) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <DesktopLeftSidebar />
        </aside>

      </section>

      {/* Dynamic Master Site Statistics Hub (مؤشرات وإحصائيات الموقع التفاعلية) */}
      <SiteStatisticsHub />

      {/* 4. SCENIC QUOTE BANNER (Matching attached design: « الكتابة ليست مجرد حروف... بل حياة أخرى نعيشها ») */}
      <section className="rounded-xl p-6 text-center bg-gradient-to-r from-[#dcebf3] via-white to-[#fff8e7] border border-[#dce8ef] shadow-sm space-y-1.5">
        <p className="text-lg sm:text-xl font-black text-[#07375a] font-literary leading-relaxed">
          « {authorProfile.quoteBannerText || 'الكتابة ليست مجرد حروف... بل حياة أخرى نعيشها'} »
        </p>
        <div className="text-xs text-[#b6872d] font-bold flex items-center justify-center gap-1.5">
          <span>— {authorProfile.quoteBannerAuthor || 'نبيل بركات'}</span>
          <button
            onClick={() =>
              openShareModal({
                title: `اقتباس: "${authorProfile.quoteBannerText}" — الكاتب ${authorProfile.quoteBannerAuthor}`,
                type: 'quote',
              })
            }
            className="text-[#07375a] hover:underline mr-2 flex items-center gap-1 text-[11px]"
          >
            <Share2 className="w-3 h-3 text-[#d8a83e]" />
            <span>مشاركة الاقتباس</span>
          </button>
        </div>
      </section>

      </div> {/* End of max-w-7xl container */}

      {/* Lightbox Modal for Photo Gallery */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#07375a] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">{lightboxPhoto.title}</h3>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="text-white hover:text-[#d8a83e] text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              {lightboxPhoto.imageUrl ? (
                <img
                  src={lightboxPhoto.imageUrl}
                  alt={lightboxPhoto.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[60vh] object-contain rounded-xl"
                />
              ) : null}
              <p className="text-xs text-[#6f8291]">{lightboxPhoto.caption}</p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() =>
                    openShareModal({
                      title: lightboxPhoto.title,
                      description: lightboxPhoto.caption,
                      image: lightboxPhoto.imageUrl,
                      type: 'photo',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold text-[#07375a] flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#d8a83e]" />
                  <span>مشاركة الصورة</span>
                </button>
                <button
                  onClick={() =>
                    openCommentModal({
                      targetType: 'photo',
                      targetId: lightboxPhoto.id,
                      targetTitle: lightboxPhoto.title,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#07375a] text-white text-xs font-bold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>أضف تعليقاً</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reader Modal for Books */}
      {selectedBookForReading && (
        <BookReaderModal
          book={books.find((b) => b.id === selectedBookForReading.id) || selectedBookForReading}
          onClose={() => setSelectedBookForReading(null)}
        />
      )}

      {/* Header Photo Customization Modal */}
      <HeaderPhotoModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
      />

      {/* Add Book Modal for Supervisor */}
      <AddBookModal />

    </div>
  );
};
