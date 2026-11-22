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
  Sparkles,
  Camera,
  ExternalLink,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  Newspaper,
  Link2,
  Maximize2,
  Film,
  Headphones,
  ShieldCheck,
  Mail,
  Star,
  Bookmark,
  FileText,
  QrCode,
  Users,
  Smartphone,
  Download,
  Eye,
  Flame,
} from 'lucide-react';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { ContentInteractionBar } from './ContentInteractionBar';
import { AldiwanVerifiedIcon, AldiwanCertifiedBadge } from './AldiwanVerifiedBadge';
import { AuthorSeal } from './AuthorSeal';
import { BookReaderModal } from './BookReaderModal';
import { Book, PhotoItem } from '../types';
import { formatArabicNumber, getCommunityPostStats } from '../utils/dynamicStats';
import { openPWAInstallDialog } from '../hooks/usePWAInstall';

/**
 * =========================================================================
 * 1. العمود الأيمن التفاعلي للكمبيوتر (Desktop Right Companion Sidebar)
 * =========================================================================
 */
export const DesktopRightSidebar: React.FC = () => {
  const {
    books,
    videos,
    photos,
    authorProfile,
    setActiveSection,
    isAuthorMode,
    setIsAddBookModalOpen,
    openShareModal,
  } = useApp();

  const [selectedBookForReading, setSelectedBookForReading] = useState<Book | null>(null);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  const activeVideo = videos[currentVideoIdx] || videos[0];
  const visibleBooks = isAuthorMode ? books : books.filter((b) => (b.visibility || (b.id === 'book-5' ? 'cover_only' : 'public')) !== 'hidden');
  const featuredBooks = visibleBooks.slice(0, 4);

  return (
    <div className="space-y-4 select-none" dir="rtl">
      
      {/* 1. بطاقة الهوية الأدبية الرسمية للكاتب */}
      <div className="bg-white rounded-2xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-100">
            <img
              src={authorProfile?.portraitImage || '/author.jpg'}
              alt={authorProfile?.name || 'أ. نبيل بركات'}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-[#07243c]/85 text-[9px] text-[#f5cd72] font-bold text-center py-0.5">
              المؤلف
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-sm sm:text-base text-[#07243c] font-literary truncate flex items-center gap-1.5">
              <span>{authorProfile?.name || 'الكاتب أ. نبيل بركات'}</span>
              <AldiwanVerifiedIcon size={16} />
            </h3>
            <p className="text-[11px] font-bold text-amber-700 leading-tight mt-0.5">
              عضو الجمعية المصرية لكتاب القصة والرواية
            </p>
            <div className="mt-1">
              <AldiwanCertifiedBadge size="sm" variant="badge" theme="light" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              روائي وشاعر
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-gradient-to-r from-amber-50 to-slate-50 rounded-xl border border-amber-200/60 text-center">
          <p className="text-xs font-literary text-[#07243c] font-bold">
            « {authorProfile?.motto || 'حروفي مرآتي وصمتي قصيدة'} »
          </p>
        </div>

        <div className="flex items-center justify-center pt-0.5">
          <AuthorSeal size="sm" showText={true} />
        </div>
      </div>

      {/* 2. أحدث مؤلفاتي ورواياتي */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">أحدث مؤلفاتي</h3>
          </div>
          <div className="flex items-center gap-2">
            {isAuthorMode && (
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(true)}
                className="text-[11px] bg-[#07375a] text-white px-2 py-0.5 rounded hover:bg-[#062b47] cursor-pointer"
              >
                + إضافة كتاب
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveSection('books');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs text-[#50738b] hover:text-[#07375a] flex items-center gap-0.5 font-medium cursor-pointer"
            >
              <span>عرض الكل</span>
              <span>←</span>
            </button>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {featuredBooks.map((book) => (
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
                  className="w-full aspect-3/4 object-cover group-hover:scale-105 transition duration-300"
                />
                {!isAuthorMode && (book.visibility || (book.id === 'book-5' ? 'cover_only' : 'public')) === 'cover_only' && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-400 text-[#07243c] text-[9px] font-black shadow">
                    قريباً
                  </span>
                )}
                <div className="book-spine-effect" />

                <button
                  type="button"
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

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedBookForReading(book)}
                  className="flex-1 py-1 text-[10px] font-bold bg-[#07375a] hover:bg-[#062b47] text-white rounded transition shadow-2xs cursor-pointer"
                >
                  تصفح
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBookForReading(book)}
                  className="px-2 py-1 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-slate-950 rounded transition shadow-2xs cursor-pointer flex items-center justify-center gap-0.5 border border-amber-300"
                  title="استماع صوتي للرواية"
                >
                  <Headphones className="w-2.5 h-2.5 text-rose-700 fill-current" />
                  <span>استمع</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. فيديو يجسد الروايات */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">فيديو يجسد الروايات</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSection('videos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
                  <div className="aspect-video w-full rounded-xl bg-slate-900 border border-[#1e293b] flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                    <Film className="w-6 h-6 text-[#dfa85b]/70 mb-1" />
                    <span className="text-[11px] font-bold text-slate-200">مشهد روائي قيد التجهيز</span>
                  </div>
                );
              }
              return (
                <div
                  className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#1e293b] shadow select-none"
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

              {/* Playlist of other video chapters */}
              {videos.length > 1 && (
                <div className="pt-2 border-t border-[#edf2f7] space-y-1.5">
                  <div className="text-[10px] font-bold text-[#07375a] flex items-center justify-between">
                    <span>مشاهد وفصول أخرى من الروايات:</span>
                    <span className="text-[9px] text-[#50738b]">{videos.length} مقاطع</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {videos.slice(0, 4).map((v, idx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCurrentVideoIdx(idx)}
                        className={`w-full p-1.5 rounded-lg text-right flex items-center justify-between text-xs transition cursor-pointer ${
                          currentVideoIdx === idx
                            ? 'bg-[#07375a] text-white font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Play className={`w-3 h-3 shrink-0 ${currentVideoIdx === idx ? 'text-[#dfa85b]' : 'text-slate-400'}`} />
                          <span className="truncate text-[11px]">{v.title}</span>
                        </div>
                        {currentVideoIdx === idx && (
                          <span className="text-[9px] text-amber-300 font-bold shrink-0">يعمل الآن</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. التراخيص والعضويات الرسمية والأرقام الدولية */}
      <div className="bg-gradient-to-br from-[#07243c] via-[#093254] to-[#041523] text-white rounded-xl border border-[#dfa85b]/40 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#dfa85b]" />
            <h3 className="text-sm font-bold text-[#f5cd72]">التراخيص والاعتماد الرسمي</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            موثق رسمياً ✓
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="text-[#dfa85b]">🏛️</span>
              <span>عضو الجمعية المصرية لكتاب القصة والرواية</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              عضوية رسمية مسجلة وفاعلة في اتحاد كتاب القصة والرواية.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <AldiwanVerifiedIcon className="w-3.5 h-3.5" />
              <span>شاعر معتمد في الدِّيْـوَانِ</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              حساب موثق وشاعر معتمد في الموسوعة الشعرية الكبرى (الديوان).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveSection('licenses');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#c5943b] hover:to-[#dfa85b] text-[#07243c] font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>أرقام الإيداع (ISBN) والتراخيص ←</span>
        </button>
      </div>

      {/* 5. معرض الصور والفعاليات الثقافية */}
      {photos.length > 0 && (
        <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#07375a]" />
              <h3 className="text-sm font-bold text-[#07375a]">معرض الصور والفعاليات</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSection('photos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs text-[#50738b] hover:text-[#07375a] flex items-center gap-0.5 font-medium cursor-pointer"
            >
              <span>عرض الألبوم</span>
              <span>←</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {photos.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => setLightboxPhoto(p)}
                className="group relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:shadow-md transition"
                title={p.title}
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[10px] text-white font-bold truncate">{p.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. رواية مختارة للقراءة الفورية */}
      {visibleBooks.length > 0 && (
        <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-[#07375a]">إصدار أدبي مختار</h3>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
              قراءة رقمية
            </span>
          </div>

          {(() => {
            const publicBooks = visibleBooks.filter((b) => (b.visibility || (b.id === 'book-5' ? 'cover_only' : 'public')) === 'public');
            const spotlightBook = publicBooks[1] || publicBooks[0] || visibleBooks[0];
            return (
              <div className="space-y-2.5">
                <div className="flex gap-3 items-center">
                  <div
                    className="w-16 h-22 rounded-lg overflow-hidden shadow-md shrink-0 border border-slate-200 cursor-pointer"
                    onClick={() => setSelectedBookForReading(spotlightBook)}
                  >
                    <img
                      src={spotlightBook.coverImage || '/src/assets/images/book_cover_heritage_1790501223547.jpg'}
                      alt={spotlightBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4
                      onClick={() => setSelectedBookForReading(spotlightBook)}
                      className="text-xs font-bold text-[#07375a] hover:underline cursor-pointer truncate"
                    >
                      {spotlightBook.title}
                    </h4>
                    <p className="text-[10px] text-[#6f8291] line-clamp-2 leading-relaxed">
                      {spotlightBook.description || spotlightBook.subtitle}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#50738b]">
                      <span>{spotlightBook.pagesCount || 180} صفحة</span>
                      <span>·</span>
                      <span className="text-amber-600 font-bold">متاح مجاناً</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBookForReading(spotlightBook)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#07375a] hover:bg-[#05263f] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>اقرأ فصول الرواية الآن 📖</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* 7. نبض صوتي وشعري */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-[#07375a]">نبض صوتي وشعري</h3>
          </div>
          <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
            إلقاء صوتي
          </span>
        </div>

        <p className="text-[11px] text-[#6f8291] leading-relaxed">
          استمع إلى مقاطع ملقاة بأداء شاعري معبّر من ديوان وروايات الكاتب.
        </p>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#07375a] truncate">حروفي مرآتي وصمتي قصيدة</div>
              <div className="text-[10px] text-slate-500">أ. نبيل بركات</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = visibleBooks.find((b) => (b.visibility || (b.id === 'book-5' ? 'cover_only' : 'public')) === 'public') || visibleBooks[0];
              if (target) setSelectedBookForReading(target);
            }}
            className="px-2.5 py-1 text-[11px] bg-[#07375a] hover:bg-[#05263f] text-white rounded-md font-bold transition shrink-0 cursor-pointer"
          >
            استمع الآن
          </button>
        </div>
      </div>

      {/* 8. STICKY DESKTOP COMPANION: تضمن بقاء العمود الأيمن ممتلئاً مهما طالت المحتويات في المنتصف */}
      <div className="hidden lg:block lg:sticky lg:top-20 z-10 space-y-3">
        <div className="bg-gradient-to-br from-[#07243c] to-[#0b385e] text-white rounded-xl p-4 border border-[#dfa85b]/40 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#dfa85b]" />
            <h4 className="text-xs font-bold text-[#f5cd72]">مكتبة نبيل بركات الرقمية</h4>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            تصفح كافة المؤلفات، الروايات، والمقاطع المرئية بحرية كاملة مع دعم القراءة الرقمية.
          </p>
          <div className="pt-1 flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveSection('books');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition text-right flex items-center justify-between cursor-pointer"
            >
              <span>استعراض كافة الكتب ({visibleBooks.length})</span>
              <span>←</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('community');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold transition text-right flex items-center justify-between cursor-pointer border border-red-400/40"
            >
              <span>قسم المجتمع والقصائد 🌟</span>
              <span>←</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection('licenses');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition text-right flex items-center justify-between cursor-pointer"
            >
              <span>التراخيص وأرقام الإيداع</span>
              <span>←</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Reader Modal */}
      {selectedBookForReading && (
        <BookReaderModal
          book={books.find((b) => b.id === selectedBookForReading.id) || selectedBookForReading}
          onClose={() => setSelectedBookForReading(null)}
        />
      )}

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
                type="button"
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


/**
 * =========================================================================
 * 2. العمود الأيسر التفاعلي للكمبيوتر (Desktop Left Companion Sidebar)
 * =========================================================================
 */
export const DesktopLeftSidebar: React.FC = () => {
  const {
    comments,
    news,
    links,
    sendMessage,
    openCommentModal,
    openShareModal,
    likeComment,
    setActiveSection,
    books,
    authorPosts,
    openCommunityPost,
  } = useApp();

  // Contact Form State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMsg, setSenderMsg] = useState('');
  const [formSent, setFormSent] = useState(false);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const approvedComments = comments.filter((c) => c.isApproved || c.status === 'approved');
  const featuredNews = news.slice(0, 3);

  const topCommunityPosts = [...authorPosts]
    .map((post) => ({
      post,
      stats: getCommunityPostStats(post),
    }))
    .sort((a, b) => (b.stats.views + b.stats.likes * 2) - (a.stats.views + a.stats.likes * 2))
    .slice(0, 3);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !senderMsg.trim()) return;

    sendMessage({
      senderName: senderName.trim(),
      email: senderEmail.trim(),
      subject: 'رسالة تواصل من القائمة الجانبية للموقع',
      message: senderMsg.trim(),
    });

    setSenderName('');
    setSenderEmail('');
    setSenderMsg('');
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4500);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-4 select-none" dir="rtl">

      {/* 0. أكثر 3 قصائد ومنشورات قراءة وإعجاباً */}
      {topCommunityPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-[#07375a]">الأكثر قراءة وإعجاباً</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSection('community');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[11px] text-[#50738b] hover:text-[#07375a] font-medium cursor-pointer"
            >
              <span>المجتمع ←</span>
            </button>
          </div>

          <div className="space-y-2">
            {topCommunityPosts.map(({ post, stats }, idx) => (
              <button
                key={post.id}
                type="button"
                onClick={() => openCommunityPost(post.id)}
                className="w-full text-right p-2.5 rounded-xl bg-slate-50/90 hover:bg-amber-50/70 border border-slate-200/80 hover:border-[#dfa85b]/60 transition space-y-1.5 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-[#dfa85b] text-[#07243c]'
                          : idx === 1
                          ? 'bg-[#07375a] text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#07375a] group-hover:underline truncate font-literary">
                      {post.title || post.content.split('\n')[0]}
                    </span>
                  </div>
                  {post.audioUrl && (
                    <span title="يحتوي على إلقاء صوتي" className="shrink-0">
                      <Headphones className="w-3.5 h-3.5 text-rose-600" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#60798b] line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-bold text-sky-700">
                      <Eye className="w-3 h-3" />
                      <span className="font-mono">{formatArabicNumber(stats.views)}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <Heart className="w-3 h-3 fill-rose-500" />
                      <span className="font-mono">{formatArabicNumber(stats.likes)}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c5943b]">
                    {post.category || 'قصيدة'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. نموذج تواصل مباشر مع الكاتب */}
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

      {/* 2. سجل زوار الموقع وكلمات القراء */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">سجل الزوار والقراء</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              openCommentModal({
                targetType: 'general',
                targetTitle: 'سجل زوار الموقع',
              })
            }
            className="text-[11px] text-[#d8a83e] hover:underline font-bold cursor-pointer"
          >
            + أضف كلمة
          </button>
        </div>

        {approvedComments.length > 0 ? (
          <div className="space-y-2.5">
            {approvedComments.slice(0, 3).map((c) => (
              <div key={c.id} className="space-y-1 text-xs border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-[#07375a] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                      {c.senderName.charAt(0)}
                    </div>
                    <div className="font-bold text-[#143b59] text-[11px]">{c.senderName}</div>
                    {c.country && (
                      <span className="text-[9px] text-[#6f8291]">({c.country})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => likeComment(c.id)}
                    className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <Heart className="w-3 h-3 fill-rose-50" />
                    <span>{c.likesCount || 0}</span>
                  </button>
                </div>

                <p className="text-[#60798b] text-[11px] leading-relaxed bg-[#f8fafc] p-2 rounded-md border border-[#eef2f6]">
                  "{c.content}"
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setActiveSection('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-center text-[11px] text-[#07375a] hover:underline font-bold pt-1 block"
            >
              استعراض كافة كلمات القراء ({approvedComments.length}) ←
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center py-2">
            كن أول من يترك كلمة للأديب في سجل الزوار.
          </div>
        )}
      </div>

      {/* 3. صورة في خبر ومقالات صحفية */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">صورة في خبر ومقالات</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSection('news');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[11px] text-[#50738b] hover:text-[#07375a] flex items-center font-medium cursor-pointer"
          >
            <span>عرض الكل ←</span>
          </button>
        </div>

        <div className="space-y-2">
          {featuredNews.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveSection('news');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex gap-2.5 items-center cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-[#dce8ef]">
                {Boolean(item.coverImage) ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                    <Newspaper className="w-3.5 h-3.5" />
                  </div>
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

      {/* 4. خدمة صانع السيرة الذاتية المجانية */}
      <div className="bg-gradient-to-br from-[#07243c] via-[#093254] to-[#041523] text-white rounded-xl border border-[#dfa85b]/40 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#dfa85b]" />
            <h3 className="text-sm font-bold text-[#f5cd72]">صانع السيرة الذاتية</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            مجاناً 100%
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          خدمة ذكية مقدمة مجاناً لكافة زوار الموقع لتصميم سيرة ذاتية احترافية بدون تسجيل مسبق، مع قوالب عصرية وتصدير PDF فوري.
        </p>

        <button
          type="button"
          onClick={() => {
            setActiveSection('cv');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#c5943b] hover:to-[#dfa85b] text-[#07243c] font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ابدأ تصميم سيرتك الآن مجاناً ←</span>
        </button>
      </div>

      {/* 5. حكمة ومقتطف أدبي */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2">
          <div className="flex items-center gap-1.5">
            <Feather className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">حكمة اليوم الأدبية</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              openShareModal({
                title: '«الكلمة الصادقة كالشجرة الطيبة، تمتد جذورها في وجدان القارئ وتهب ثمارها للأجيال» — نبيل بركات',
                type: 'quote',
              })
            }
            className="text-[11px] text-[#d8a83e] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>مشاركة</span>
          </button>
        </div>

        <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#edf2f7] space-y-1">
          <p className="text-xs text-[#07375a] font-literary italic leading-relaxed text-center">
            « الكلمة الصادقة كالشجرة الطيبة، تمتد جذورها في وجدان القارئ وتهب ثمارها للأجيال »
          </p>
          <div className="text-[10px] text-[#6f8291] text-left font-bold font-literary">
            — أ. نبيل بركات
          </div>
        </div>
      </div>

      {/* 6. شبكة الروابط والمواقع الهامة */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2.5">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">الروابط والمواقع</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSection('links');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[11px] text-[#50738b] hover:text-[#07375a] flex items-center font-medium cursor-pointer"
          >
            <span>عرض الكل ←</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {links.slice(0, 6).map((l) => (
            <a
              key={l.id}
              href={l.url}
              target={l.url.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="border border-[#e1e9ee] rounded-lg p-2 text-right no-underline text-[#07375a] hover:border-[#07375a] hover:bg-[#f6f9fb] transition flex items-center gap-1.5 text-xs font-bold truncate group"
            >
              <span className="text-[#d8a83e] shrink-0">🔗</span>
              <span className="truncate text-[11px]">{l.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* 7. النشرة الثقافية البريدية */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[#edf2f7] pb-2">
          <Mail className="w-4 h-4 text-[#07375a]" />
          <div>
            <h3 className="text-sm font-bold text-[#07375a]">النشرة الثقافية</h3>
            <p className="text-[10px] text-[#6f8291]">جديد الروايات والأمسيات</p>
          </div>
        </div>

        <form onSubmit={handleNewsletterSubmit} className="space-y-2">
          <input
            type="email"
            required
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="أدخل بريدك الإلكتروني..."
            className="w-full bg-[#fbfdfe] border border-[#d7e3ea] rounded-lg px-3 py-1.5 text-xs text-[#143b59] focus:outline-none focus:border-[#07375a]"
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-[#07375a] hover:bg-[#062b47] text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {newsletterSuccess ? '✓ تم الاشتراك بنجاح!' : 'اشترك مجاناً'}
          </button>
        </form>
      </div>

      {/* 8. الباركود الرسمي لمشاركة المنصة */}
      <div className="bg-white rounded-xl border border-[#dce8ef] p-4 shadow-sm space-y-2 text-center">
        <div className="flex items-center justify-between border-b border-[#edf2f7] pb-2 text-right">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#07375a]" />
            <h3 className="text-sm font-bold text-[#07375a]">الباركود الرسمي</h3>
          </div>
          <span className="text-[10px] text-[#6f8291]">للمشاركة السريعة</span>
        </div>
        <p className="text-[11px] text-[#6f8291]">
          امسح الكود بكاميرا هاتفك للوصول المباشر ومشاركة المنصة
        </p>
        <div className="flex justify-center py-1">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-2xs">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://nb.zadtoo.com')}&color=07243c&bgcolor=ffffff`}
              alt="QR Code"
              className="w-20 h-20"
            />
          </div>
        </div>
      </div>

      {/* 9. STICKY DESKTOP COMPANION: تضمن بقاء العمود الأيسر ممتلئاً مهما طالت المحتويات في المنتصف */}
      <div className="hidden lg:block lg:sticky lg:top-20 z-10 space-y-3">
        <div className="bg-gradient-to-br from-[#07243c] to-[#041624] text-white rounded-xl p-4 border border-[#dfa85b]/40 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#dfa85b]" />
              <h4 className="text-xs font-bold text-[#f5cd72]">تثبيت الموقع كتطبيق</h4>
            </div>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            ثبّت منصة الكاتب أ. نبيل بركات كتطبيق خفيف على جهازك للوصول الفوري بضغطة زر.
          </p>

          <button
            type="button"
            onClick={openPWAInstallDialog}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت الموقع كتطبيق</span>
          </button>

          <div className="pt-2 border-t border-white/10 flex justify-center">
            <AuthorSeal size="sm" showText={false} />
          </div>
        </div>
      </div>

    </div>
  );
};
