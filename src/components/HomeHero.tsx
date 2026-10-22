import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Play,
  Share2,
  MessageSquare,
  Send,
  Heart,
  Feather,
  Plus,
  Edit2,
  Sparkles,
  Camera,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  Newspaper,
  Link2,
  Maximize2,
  Pin,
  Film,
} from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';
import { BookReaderModal } from './BookReaderModal';
import { HeaderPhotoModal } from './HeaderPhotoModal';
import { HeaderAnnouncementBanner } from './HeaderAnnouncementBanner';
import { SiteStatisticsHub } from './SiteStatisticsHub';
import { ContentInteractionBar } from './ContentInteractionBar';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { AuthorFeedSection } from './AuthorFeedSection';
import { AddBookModal } from './AddBookModal';
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

  const featuredBooks = books.slice(0, 4);
  const featuredNews = news.slice(0, 3);
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
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-literary leading-tight drop-shadow-md">
              {authorProfile.name || 'أ. نبيل بركات'}
            </h1>

            {/* Literary Divider */}
            <div className="text-[#f5cd72] text-xl sm:text-2xl lg:text-3xl font-serif drop-shadow">✦</div>

            {/* Motto */}
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#f5cd72] font-literary drop-shadow-md leading-snug">
              حروفي مرآتي وصمتي قصيدة
            </p>

            {/* Association & Role */}
            <div className="space-y-1.5 text-center lg:text-right py-1">
              <p className="text-base sm:text-lg lg:text-xl font-bold text-[#dfa85b] drop-shadow-md">
                عضو الجمعية المصرية لكتاب القصة والرواية
              </p>
              <p className="text-sm sm:text-base lg:text-lg font-medium text-white/95 drop-shadow">
                كاتب وروائي ومفكر
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
              <button
                onClick={() => setActiveSection('books')}
                className="px-6 py-3 rounded-xl bg-[#dfa85b] hover:bg-[#c99547] text-[#07243c] text-xs sm:text-sm font-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#07243c]" />
                <span>استكشف مؤلفاتي ({books.length} مؤلفات)</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">

        {/* 📢 Glowing Rotating Announcement Box: أسفل الهيدر وأسفل صورة الكاتب مباشرة */}
        <HeaderAnnouncementBanner />

        {/* 2. QUICK NAVIGATION GRID (6 Items matching attached design) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 📚 مؤلفاتي */}
        <button
          onClick={() => setActiveSection('books')}
          className="p-3.5 rounded-xl bg-[#07375a] text-white shadow-md hover:bg-[#062b47] transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#d8a83e]" />
          </div>
          <div>
            <div className="text-sm font-bold">مؤلفاتي</div>
            <div className="text-[11px] text-[#dce8ef]">كتبي وإصداراتي</div>
          </div>
        </button>

        {/* ▶ فيديو يجسد الروايات */}
        <button
          onClick={() => setActiveSection('videos')}
          className="p-3.5 rounded-xl bg-white border border-[#dce8ef] text-[#07375a] shadow-sm hover:border-[#07375a] hover:shadow transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-[#07375a]" />
          </div>
          <div>
            <div className="text-sm font-bold">فيديو يجسد الروايات</div>
            <div className="text-[11px] text-[#6f8291]">فصول الروايات المرئية</div>
          </div>
        </button>

        {/* ▣ صوري */}
        <button
          onClick={() => setActiveSection('photos')}
          className="p-3.5 rounded-xl bg-white border border-[#dce8ef] text-[#07375a] shadow-sm hover:border-[#07375a] hover:shadow transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5 text-[#07375a]" />
          </div>
          <div>
            <div className="text-sm font-bold">صوري</div>
            <div className="text-[11px] text-[#6f8291]">معرض الصور</div>
          </div>
        </button>

        {/* ▤ أخباري */}
        <button
          onClick={() => setActiveSection('news')}
          className="p-3.5 rounded-xl bg-white border border-[#dce8ef] text-[#07375a] shadow-sm hover:border-[#07375a] hover:shadow transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center shrink-0">
            <Newspaper className="w-5 h-5 text-[#07375a]" />
          </div>
          <div>
            <div className="text-sm font-bold">أخباري</div>
            <div className="text-[11px] text-[#6f8291]">آخر الأخبار والكتابات</div>
          </div>
        </button>

        {/* 🔗 الروابط والمواقع */}
        <button
          onClick={() => setActiveSection('links')}
          className="p-3.5 rounded-xl bg-white border border-[#dce8ef] text-[#07375a] shadow-sm hover:border-[#07375a] hover:shadow transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-[#07375a]" />
          </div>
          <div>
            <div className="text-sm font-bold">الروابط والمواقع</div>
            <div className="text-[11px] text-[#6f8291]">مواقع وحسابات مهمة</div>
          </div>
        </button>

        {/* 💬 تواصل معي */}
        <button
          onClick={() => setActiveSection('contact')}
          className="p-3.5 rounded-xl bg-white border border-[#dce8ef] text-[#07375a] shadow-sm hover:border-[#07375a] hover:shadow transition-all flex items-center gap-3 text-right"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-[#07375a]" />
          </div>
          <div>
            <div className="text-sm font-bold">تواصل معي</div>
            <div className="text-[11px] text-[#6f8291]">رسائل وتعليقات</div>
          </div>
        </button>
      </section>

      {/* 3. THREE-COLUMN CONTENT GRID (Right: Books & Videos | Center: Author Facebook Publisher & Feed | Left: Contact, Comments, News & Links) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMN 1: RIGHT SIDE (lg:col-span-3) - أحدث مؤلفاتي وفيديو يجسد الروايات */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Section: أحدث مؤلفاتي */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#07375a]" />
                <h3 className="text-sm font-bold text-[#07375a]">أحدث مؤلفاتي</h3>
              </div>
              <div className="flex items-center gap-2">
                {isAuthorMode && (
                  <button
                    onClick={() => setIsAddBookModalOpen(true)}
                    className="text-[11px] bg-[#07375a] text-white px-2 py-0.5 rounded hover:bg-[#062b47] cursor-pointer"
                  >
                    + إضافة كتاب
                  </button>
                )}
                <button
                  onClick={() => setActiveSection('books')}
                  className="text-xs text-[#50738b] hover:text-[#07375a] flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  <span>عرض الكل</span>
                  <span>←</span>
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {featuredBooks.slice(0, 4).map((book) => (
                <div
                  key={book.id}
                  className="group flex flex-col justify-between text-center space-y-1"
                >
                  <div
                    className="book-3d-card relative cursor-pointer overflow-hidden rounded-lg border border-[#cbd5e1] shadow-sm transition"
                    onClick={() => setSelectedBookForReading(book)}
                  >
                    <img
                      src={book.coverImage || '/src/assets/images/book_cover_heritage_1790501223547.jpg'}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="book-spine-effect" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openShareModal({
                          title: `كتاب: ${book.title}`,
                          description: book.description,
                          image: book.coverImage,
                          type: 'book',
                        });
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                      title="مشاركة"
                    >
                      <Share2 className="w-2.5 h-2.5 text-[#d8a83e]" />
                    </button>
                  </div>

                  <div>
                    <h4
                      onClick={() => setSelectedBookForReading(book)}
                      className="text-[11px] font-bold text-[#07375a] truncate hover:underline cursor-pointer"
                      title={book.title}
                    >
                      {book.title}
                    </h4>
                    <p className="text-[9px] text-[#6f8291] truncate">
                      {book.subtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBookForReading(book)}
                    className="w-full py-0.5 text-[10px] font-semibold bg-[#07375a] hover:bg-[#062b47] text-white rounded transition shadow-2xs cursor-pointer"
                  >
                    تصفح
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: فيديو يجسد الروايات */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#07375a]" />
                <h3 className="text-sm font-bold text-[#07375a]">فيديو يجسد الروايات</h3>
              </div>
              <button
                onClick={() => setActiveSection('videos')}
                className="text-xs text-[#50738b] hover:text-[#07375a] flex items-center gap-0.5 font-medium cursor-pointer"
              >
                <span>كل المشاهد</span>
                <span>←</span>
              </button>
            </div>

            {activeVideo && (
              <div className="space-y-2">
                {(() => {
                  const rawSrc = activeVideo.url || activeVideo.videoFileUrl;
                  const videoSrc = (rawSrc || '').trim();
                  if (!videoSrc) {
                    return (
                      <div className="aspect-[16/9] w-full rounded-xl bg-slate-900 border border-[#1e293b] flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                        <Film className="w-6 h-6 text-[#dfa85b]/70 mb-1" />
                        <span className="text-[11px] font-bold text-slate-200">مشهد روائي قيد التجهيز</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#1e293b] shadow select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <SmartVideoPlayer
                        rawSrc={videoSrc}
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain bg-black"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute top-2 right-2 pointer-events-none select-none z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs border border-white/15 text-white/90 shadow-md text-[9px] font-bold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dfa85b] animate-ping" />
                        <span>أ. نبيل بركات ©</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#07375a] truncate">
                    {activeVideo.title}
                  </h4>
                  <p className="text-[10px] text-[#6f8291] line-clamp-2">
                    {activeVideo.description}
                  </p>

                  <div className="pt-1 border-t border-[#edf2f7]">
                    <ContentInteractionBar
                      itemId={activeVideo.id}
                      itemTitle={`فيديو: ${activeVideo.title}`}
                      itemType="video"
                      commentsCount={24}
                      itemUrl={activeVideo.url}
                      itemDescription={activeVideo.description}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* COLUMN 2: CENTER (lg:col-span-6) - منشورات وخواطر الكاتب (كمثل فيسبوك للمشرف والتعليق للجميع) */}
        <div className="lg:col-span-6 space-y-4">
          <AuthorFeedSection />
        </div>

        {/* COLUMN 3: LEFT SIDE (lg:col-span-3) - تواصل معي + آخر التعليقات + الأخبار + الروابط */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card: تواصل معي */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#edf2f7] pb-2">
              <Send className="w-4 h-4 text-[#07375a] -rotate-45" />
              <div>
                <h3 className="text-sm font-bold text-[#07375a]">تواصل معي</h3>
                <p className="text-[11px] text-[#6f8291]">يسعدني تواصلك واقتراحاتك</p>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-2.5">
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="الاسم"
                className="w-full bg-[#fbfdfe] border border-[#d7e3ea] rounded-lg px-3 py-2 text-xs text-[#143b59] focus:outline-none focus:border-[#07375a]"
              />
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full bg-[#fbfdfe] border border-[#d7e3ea] rounded-lg px-3 py-2 text-xs text-[#143b59] focus:outline-none focus:border-[#07375a]"
              />
              <textarea
                required
                rows={2}
                value={senderMsg}
                onChange={(e) => setSenderMsg(e.target.value)}
                placeholder="الرسالة..."
                className="w-full bg-[#fbfdfe] border border-[#d7e3ea] rounded-lg px-3 py-2 text-xs text-[#143b59] focus:outline-none focus:border-[#07375a] resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#07375a] hover:bg-[#062b47] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 -rotate-45" />
                <span>إرسال الرسالة</span>
              </button>
              {formSent && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 text-center font-medium flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم إرسال رسالتك بنجاح</span>
                </div>
              )}
            </form>
          </div>

          {/* Card: آخر التعليقات */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#07375a]" />
                <h3 className="text-sm font-bold text-[#07375a]">آخر التعليقات</h3>
              </div>
              <button
                onClick={() =>
                  openCommentModal({
                    targetType: 'general',
                    targetTitle: 'سجل زوار الموقع',
                  })
                }
                className="text-[11px] text-[#d8a83e] hover:underline font-bold cursor-pointer"
              >
                + إضافة تعليق
              </button>
            </div>

            {latestComment ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#07375a] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {latestComment.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#143b59]">{latestComment.senderName}</div>
                      {latestComment.country && (
                        <div className="text-[10px] text-[#6f8291]">{latestComment.country}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => likeComment(latestComment.id)}
                    className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-50" />
                    <span>{latestComment.likesCount || 0}</span>
                  </button>
                </div>

                <p className="text-[#60798b] text-xs leading-relaxed bg-[#f8fafc] p-2.5 rounded-lg border border-[#eef2f6]">
                  "{latestComment.content}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#7890a0] pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {latestComment.date}
                  </span>
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `تعليق من ${latestComment.senderName}: "${latestComment.content}"`,
                        type: 'general',
                      })
                    }
                    className="text-[#07375a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3 text-[#d8a83e]" />
                    <span>مشاركة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-3">
                لا توجد تعليقات منشورة بعد.
              </div>
            )}
          </div>

          {/* Card: صورة في خبر */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-[#07375a]" />
                <h3 className="text-sm font-bold text-[#07375a]">صورة في خبر</h3>
              </div>
              <button
                onClick={() => setActiveSection('news')}
                className="text-[11px] text-[#50738b] hover:text-[#07375a] flex items-center font-medium cursor-pointer"
              >
                <span>عرض الكل ←</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {featuredNews.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveSection('news')}
                  className="group flex gap-2.5 items-center cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-[#dce8ef]">
                    {Boolean(item.coverImage) && (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#07375a] group-hover:underline truncate">
                      {item.title}
                    </h4>
                    <time className="text-[10px] text-[#7890a0] block pt-0.5 font-mono">
                      {item.date}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: الروابط والمواقع */}
          <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#07375a]" />
                <h3 className="text-sm font-bold text-[#07375a]">الروابط والمواقع</h3>
              </div>
              <button
                onClick={() => setActiveSection('links')}
                className="text-[11px] text-[#50738b] hover:text-[#07375a] flex items-center font-medium cursor-pointer"
              >
                <span>عرض الكل ←</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {links.slice(0, 4).map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target={l.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="border border-[#e1e9ee] rounded-lg p-2 text-right no-underline text-[#07375a] hover:border-[#07375a] hover:bg-[#f6f9fb] transition flex items-center gap-1.5 text-xs font-bold truncate group"
                >
                  <span className="text-[#d8a83e] shrink-0">🔗</span>
                  <span className="truncate">{l.title}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

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
