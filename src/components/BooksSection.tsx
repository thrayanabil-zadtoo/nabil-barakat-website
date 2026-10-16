import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { BookReaderModal } from './BookReaderModal';
import {
  BookOpen,
  List,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Edit2,
  Share2,
  Upload,
  Camera,
  CheckCircle,
  Maximize2,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Lock,
  Pin,
  Video,
  Play,
  Film,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';
import { compressImage } from '../utils/imageCompressor';
import { isVideoMedia } from '../utils/mediaUtils';

export const BooksSection: React.FC = () => {
  const {
    books,
    isAuthorMode,
    deleteBook,
    setIsAuthorMode,
    setIsLoginModalOpen,
    setEditingBook,
    openShareModal,
    openCommentModal,
    setBookCover,
    deleteBookGalleryImage,
    addBookGalleryImage,
    showToast,
    togglePinBook,
    moveBookOrder,
    setBookPosition,
    processAndUploadImage,
    copyToClipboardWithFeedback,
  } = useApp();
  const [selectedBookForReading, setSelectedBookForReading] = useState<Book | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [activeUploadBookId, setActiveUploadBookId] = useState<string | null>(null);
  const [activeGalleryUploadBookId, setActiveGalleryUploadBookId] = useState<string | null>(null);
  const [activeGalleryVideoUploadBookId, setActiveGalleryVideoUploadBookId] = useState<string | null>(null);
  const [isVideoUrlModalOpen, setIsVideoUrlModalOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTargetBookId, setVideoTargetBookId] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{
    book: Book;
    imageUrl: string;
    index: number;
  } | null>(null);
  const [isConfirmingGalleryDelete, setIsConfirmingGalleryDelete] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);

  const genres = ['all', ...Array.from(new Set(books.map((b) => b.genre)))];

  const filteredBooks = selectedGenre === 'all'
    ? books
    : books.filter((b) => b.genre === selectedGenre);

  const handleCoverUploadForBook = (bookId: string) => {
    setActiveUploadBookId(bookId);
    coverInputRef.current?.click();
  };

  const handleGalleryUploadForBook = (bookId: string) => {
    setActiveGalleryUploadBookId(bookId);
    galleryInputRef.current?.click();
  };

  const handleGalleryVideoUploadForBook = (bookId: string) => {
    setActiveGalleryVideoUploadBookId(bookId);
    galleryVideoInputRef.current?.click();
  };

  const onCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadBookId) return;
    try {
      const book = books.find((b) => b.id === activeUploadBookId);
      const bookTitle = book ? book.title : 'غلاف الكتاب';
      const uploadedUrl = await processAndUploadImage(file, {
        maxWidth: 640,
        maxHeight: 900,
        quality: 0.72,
        category: 'المؤلفات والكتب',
        contextTitle: `غلاف مؤلف: ${bookTitle}`,
        bookId: activeUploadBookId,
      });
      await setBookCover(activeUploadBookId, uploadedUrl);
    } catch {
      // Handled by processAndUploadImage
    }
    setActiveUploadBookId(null);
    e.target.value = '';
  };

  const onGalleryFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGalleryUploadBookId) return;
    try {
      const book = books.find((b) => b.id === activeGalleryUploadBookId);
      const bookTitle = book ? book.title : 'معرض الكتاب';
      const uploadedUrl = await processAndUploadImage(file, {
        maxWidth: 640,
        maxHeight: 900,
        quality: 0.72,
        category: 'المؤلفات والكتب',
        contextTitle: `معرض مؤلف: ${bookTitle}`,
        bookId: activeGalleryUploadBookId,
      });
      await addBookGalleryImage(activeGalleryUploadBookId, uploadedUrl);
    } catch {
      // Handled by processAndUploadImage
    }
    setActiveGalleryUploadBookId(null);
    e.target.value = '';
  };

  const onGalleryVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGalleryVideoUploadBookId) return;

    if (file.size > 80 * 1024 * 1024) {
      showToast('حجم الفيديو أكبر من 80 ميجابايت. يُرجى اختيار ملف فيديو أصغر أو مضغوط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      addBookGalleryImage(activeGalleryVideoUploadBookId, reader.result as string);
    };
    reader.onerror = () => {
      showToast('حدث خطأ أثناء قراءة ملف الفيديو');
    };
    reader.readAsDataURL(file);
    setActiveGalleryVideoUploadBookId(null);
    e.target.value = '';
  };

  const handleAddVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim() || !videoTargetBookId) return;
    addBookGalleryImage(videoTargetBookId, videoUrlInput.trim());
    setVideoUrlInput('');
    setVideoTargetBookId(null);
    setIsVideoUrlModalOpen(false);
  };

  const arabicBookNumbers = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];

  return (
    <div className="space-y-8 py-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <span>مؤلفات أدبية وفكرية معتمدة</span>
            <span aria-hidden="true">·</span>
            <span>{books.length} أعمال منشورة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
            مؤلفات وروايات الكاتب أ. نبيل بركات
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl">
            استعرض أغلفة الإصدارات، الصور والمخطوطات المرفقة، وفهرس المحتويات الكامل، وتصفح نماذج وصفحات مقروءة مباشرة.
          </p>
        </div>

        {/* Supervisor Action Button */}
        {isAuthorMode && (
          <button
            onClick={() => setIsAuthorMode(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-lg transition shadow-sm whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>إضافة كتاب جديد للمكتبة</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {genres.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-[#0b385e] text-white font-semibold shadow-sm'
                  : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#d6e0ea]'
              }`}
            >
              {g === 'all' ? 'جميع المؤلفات' : g}
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Inputs for Cover and Gallery upload */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCoverFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryFileSelected}
      />

      {/* Books Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBooks.map((book, index) => (
          <div
            key={book.id}
            className="gold-gilded-card rounded-2xl bg-white overflow-hidden p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-5"
          >
            <div className="space-y-4">
              
              {/* Meta row with Arabic Book Number */}
              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#0b385e]/10 text-[#0b385e] font-black text-xs">
                    المؤلف {arabicBookNumbers[index] || index + 1}
                  </span>
                  <span className="text-[#0b385e] font-bold">{book.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{book.publicationYear}</span>
                </div>
                <div className="font-mono tabular-nums text-[#0b385e] font-semibold">
                  {book.pagesCount} صفحة
                </div>
              </div>

              {/* Cover & Info */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative group shrink-0 mx-auto sm:mx-0">
                  <div
                    onClick={() => setSelectedBookForReading(book)}
                    className="book-3d-card relative cursor-pointer overflow-hidden rounded-xl shadow-lg border border-[#cbd5e1]"
                  >
                    <img
                      src={book.coverImage || '/src/assets/images/book_cover_heritage_1790501223547.jpg'}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="w-36 sm:w-40 aspect-[3/4] object-cover group-hover:scale-102 transition duration-300"
                    />
                    {/* 3D Spine Realistic Shadow */}
                    <div className="book-spine-effect" />
                    
                    <div className="absolute inset-0 bg-[#0b385e]/60 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                      <span className="text-xs font-semibold text-white bg-black/60 px-2.5 py-1 rounded">
                        تصفح وقراءة الكتاب
                      </span>
                    </div>
                  </div>

                  {/* Cover Change Button & Copy Link - Supervisor only */}
                  {isAuthorMode && (
                    <div className="mt-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleCoverUploadForBook(book.id)}
                        className="w-full text-[11px] font-bold text-[#c4924c] hover:text-[#0b385e] flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[#c4924c]/60 bg-[#fffdf9] hover:bg-[#fef9ec] transition cursor-pointer shadow-2xs"
                        title="إضافة أو تغيير صورة الغلاف لهذا الكتاب"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>تغيير صورة الغلاف</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboardWithFeedback(
                            book.coverImage,
                            `تم نسخ رابط غلاف كتاب «${book.title}» إلى الحافظة بنجاح`
                          )
                        }
                        className="w-full text-[10px] font-bold text-[#0b385e] hover:bg-[#eaf1f8] flex items-center justify-center gap-1 py-1 rounded-lg border border-[#cbd5e1] bg-white transition cursor-pointer"
                        title="نسخ رابط صورة الغلاف للمشرف"
                      >
                        <Copy className="w-3 h-3 text-[#c4924c]" />
                        <span>نسخ رابط الغلاف للمشرف</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-right">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      onClick={() => setSelectedBookForReading(book)}
                      className="text-xl font-bold text-[#0b385e] font-literary hover:underline cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    {book.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-[#07243c] text-xs font-black shadow-2xs">
                        <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
                        <span>مثبت في الصدارة 📌</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#c4924c] font-bold">
                    {book.subtitle}
                  </p>

                  <div className="text-[11px] text-[#64748b] space-y-0.5 pt-1">
                    <div>دار النشر: <span className="text-[#1e293b] font-medium">{book.publisher}</span></div>
                    {book.isbn && <div className="font-mono">الترقيم الدولي: <span className="text-[#1e293b] font-medium">{book.isbn}</span></div>}
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 pt-1">
                    {book.description}
                  </p>
                </div>
              </div>

              {/* Multiple Gallery Images & Videos Preview */}
              {(() => {
                const validGallery = (book.galleryImages || []).filter(
                  (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
                );
                return (
                  <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span className="flex items-center gap-1.5 font-medium text-[#0b385e]">
                        <ImageIcon className="w-3.5 h-3.5 text-[#dfa85b]" />
                        <span>معرض الصور والفيديوهات ({validGallery.length})</span>
                      </span>
                      {validGallery.length > 0 && (
                        <button
                          onClick={() => setEnlargedImage({ book, imageUrl: validGallery[0], index: 0 })}
                          className="text-[#c4924c] hover:underline flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>عرض وتكبير</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
                      {validGallery.map((mediaUrl, i) => {
                        const isVid = isVideoMedia(mediaUrl);
                        return (
                          <div key={i} className="relative group/thumb shrink-0">
                            <div
                              onClick={() => setEnlargedImage({ book, imageUrl: mediaUrl, index: i })}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-[#cbd5e1] cursor-pointer hover:border-[#0b385e] hover:shadow-md transition duration-200 relative bg-black flex items-center justify-center"
                              title={isVid ? 'اضغط لمشاهدة الفيديو' : 'اضغط لتكبير الصورة'}
                            >
                              {isVid ? (
                                <>
                                  <video
                                    src={mediaUrl}
                                    playsInline
                                    muted
                                    preload="metadata"
                                    className="w-full h-full object-cover opacity-80"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-bold text-amber-300 px-1 rounded">
                                    فيديو
                                  </span>
                                </>
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`${book.title} - صورة ${i + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* Supervisor only: Copy Link & Delete button */}
                            {isAuthorMode && (
                              <div className="absolute -top-1.5 -left-1.5 flex items-center gap-1 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboardWithFeedback(mediaUrl, 'تم نسخ رابط الوسائط إلى الحافظة بنجاح');
                                  }}
                                  className="w-5 h-5 bg-[#0b385e] hover:bg-[#07243c] text-[#dfa85b] rounded-full flex items-center justify-center text-[10px] shadow transition cursor-pointer font-bold"
                                  title="نسخ رابط هذه الصورة للمشرف"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBookGalleryImage(book.id, i);
                                  }}
                                  className="w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[10px] shadow transition cursor-pointer font-bold"
                                  title="حذف هذا العنصر من المعرض"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAuthorMode && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Add Image */}
                          <button
                            type="button"
                            onClick={() => handleGalleryUploadForBook(book.id)}
                            className="w-16 h-16 rounded-xl border-2 border-dashed border-[#c4924c] hover:bg-[#fffdf7] text-[#c4924c] flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition shadow-2xs"
                            title="إضافة صورة للمعرض"
                          >
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span>+ صورة</span>
                          </button>

                          {/* Add Video from device */}
                          <button
                            type="button"
                            onClick={() => handleGalleryVideoUploadForBook(book.id)}
                            className="w-16 h-16 rounded-xl border-2 border-dashed border-[#0b385e] hover:bg-[#edf4fb] text-[#0b385e] flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition shadow-2xs"
                            title="رفع ملف فيديو للمعرض (MP4/WebM)"
                          >
                            <Film className="w-4 h-4 mb-0.5 text-[#0b385e]" />
                            <span>+ فيديو</span>
                          </button>

                          {/* Video Link */}
                          <button
                            type="button"
                            onClick={() => {
                              setVideoTargetBookId(book.id);
                              setIsVideoUrlModalOpen(true);
                            }}
                            className="w-8 h-16 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 flex flex-col items-center justify-center text-[9px] cursor-pointer transition"
                            title="إضافة رابط فيديو مباشر"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Direct 1-Click Button to set Gallery Image as Cover - Supervisor ONLY */}
                    {isAuthorMode && validGallery.length > 0 && !isVideoMedia(validGallery[0]) && book.coverImage !== validGallery[0] && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBookCover(book.id, validGallery[0]);
                            showToast('تم اعتماد صورة المعرض كغلاف أساسي للكتاب بنجاح!');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#07243c] bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-[#b8802a] fill-[#b8802a]" />
                          <span>اعتماد الصورة المرفقة بالمعرض كغلاف أساسي للكتاب ★</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Table of contents snippet */}
              <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5">
                <div className="text-xs font-semibold text-[#0b385e] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5" />
                    <span>فهرس المحتويات ({book.tableOfContents.length} فصول):</span>
                  </span>
                  <button
                    onClick={() => setSelectedBookForReading(book)}
                    className="text-[11px] text-[#c4924c] hover:underline"
                  >
                    عرض الفهرس كاملاً
                  </button>
                </div>
                <div className="text-xs text-[#475569] space-y-1">
                  {book.tableOfContents.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[240px]">{item.chapter}</span>
                      <span className="font-mono text-[#64748b] tabular-nums">ص {item.pageNumber}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaction Bar (المشاهدات، لايك قلب أحمر، التعليقات، والمشاركة) */}
              <div className="pt-2">
                <ContentInteractionBar
                  itemId={book.id}
                  itemTitle={`رواية ${book.title}`}
                  itemType="book"
                  commentsCount={book.comments?.length || 24}
                  itemDescription={book.description}
                />
              </div>

            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#f1f5f9]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedBookForReading(book)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-lg transition shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>تصفح وقراءة الكتاب</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() =>
                    openShareModal({
                      title: `كتاب: ${book.title}`,
                      description: book.description,
                      image: book.coverImage,
                      type: 'book',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#475569] bg-white border border-[#cbd5e1] hover:border-[#0b385e] hover:text-[#0b385e] rounded-lg transition cursor-pointer"
                  title="مشاركة هذا الكتاب"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#c4924c]" />
                  <span>مشاركة</span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() =>
                    openCommentModal({
                      targetType: 'book',
                      targetId: book.id,
                      targetTitle: book.title,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0b385e] bg-[#f0f4f8] hover:bg-[#e2eaf2] rounded-lg transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إبداء رأي وتعليق</span>
                </button>
              </div>

              {/* Supervisor mode buttons */}
              {isAuthorMode && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingBook(book)}
                    className="p-1.5 text-[#0b385e] hover:bg-[#f0f4f8] rounded transition"
                    title="تعديل بيانات الكتاب"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                    title="حذف الكتاب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Supervisor Pin & Order Controls */}
            {isAuthorMode && (
              <div className="p-4 pt-0">
                <ItemOrderPinControls
                  isPinned={book.isPinned}
                  onTogglePin={() => togglePinBook(book.id)}
                  currentIndex={books.findIndex((b) => b.id === book.id)}
                  totalCount={books.length}
                  onMoveUp={() => moveBookOrder(book.id, 'up')}
                  onMoveDown={() => moveBookOrder(book.id, 'down')}
                  onSetPosition={(newPos) => setBookPosition(book.id, newPos)}
                />
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedBookForReading && (
        <BookReaderModal
          book={books.find((b) => b.id === selectedBookForReading.id) || selectedBookForReading}
          onClose={() => setSelectedBookForReading(null)}
        />
      )}

      {/* Enlarged Image Lightbox Modal (تكبير الصورة بجودة كاملة) */}
      {enlargedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#07243c] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#051a2c] border-b border-white/10 text-white">
              <div className="flex items-center gap-2.5">
                {isVideoMedia(enlargedImage.imageUrl) ? (
                  <Video className="w-5 h-5 text-[#dfa85b]" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[#dfa85b]" />
                )}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-literary">
                    {enlargedImage.book.title}
                  </h3>
                  <div className="text-[11px] text-slate-300">
                    {isVideoMedia(enlargedImage.imageUrl) ? 'فيديو من المعرض' : 'صورة من المعرض'} · عنصر {enlargedImage.index + 1}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnlargedImage(null)}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Media View (Image or Video) */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[350px]">
              {isVideoMedia(enlargedImage.imageUrl) ? (
                <video
                  src={enlargedImage.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-2xl bg-black"
                />
              ) : (
                <img
                  src={enlargedImage.imageUrl}
                  alt={enlargedImage.book.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
              )}

              {/* Navigation Arrows if book has multiple gallery images */}
              {(() => {
                const bookGallery = (enlargedImage.book.galleryImages || []).filter(
                  (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
                );
                if (bookGallery.length <= 1) return null;
                const prevIndex = (enlargedImage.index - 1 + bookGallery.length) % bookGallery.length;
                const nextIndex = (enlargedImage.index + 1) % bookGallery.length;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setEnlargedImage({
                        ...enlargedImage,
                        imageUrl: bookGallery[prevIndex],
                        index: prevIndex,
                      })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-lg cursor-pointer"
                      title="السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnlargedImage({
                        ...enlargedImage,
                        imageUrl: bookGallery[nextIndex],
                        index: nextIndex,
                      })}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20 shadow-lg cursor-pointer"
                      title="التالي"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-[#051a2c] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* SET AS BOOK COVER BUTTON - Supervisor only (Only for Images) */}
                {isAuthorMode && !isVideoMedia(enlargedImage.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookCover(enlargedImage.book.id, enlargedImage.imageUrl);
                      showToast(`تم اعتماد هذه الصورة بنجاح كغلاف أساسي لكتاب "${enlargedImage.book.title}"!`);
                      setEnlargedImage({
                        ...enlargedImage,
                        book: {
                          ...enlargedImage.book,
                          coverImage: enlargedImage.imageUrl,
                        }
                      });
                    }}
                    className="px-4 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
                    title="تعيين هذه الصورة كغلاف أساسي للكتاب"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>تعيين هذه الصورة كغلاف أساسي للكتاب ★</span>
                  </button>
                )}

                {/* Copy Image URL for Supervisor */}
                {isAuthorMode && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboardWithFeedback(
                        enlargedImage.imageUrl,
                        `تم نسخ رابط الصورة إلى الحافظة بنجاح`
                      )
                    }
                    className="px-3.5 py-2 bg-[#dfa85b]/20 hover:bg-[#dfa85b]/30 text-[#dfa85b] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-[#dfa85b]/40"
                    title="نسخ رابط هذه الصورة"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>نسخ رابط الصورة للمشرف</span>
                  </button>
                )}

                {/* Open in reader */}
                <button
                  type="button"
                  onClick={() => {
                    const b = enlargedImage.book;
                    setEnlargedImage(null);
                    setSelectedBookForReading(b);
                  }}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/15"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>تصفح وقراءة الكتاب</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isAuthorMode && (
                  isConfirmingGalleryDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/60 px-2.5 py-1 rounded-xl animate-in fade-in">
                      <span className="text-[11px] text-rose-300 font-bold">تأكيد الحذف؟</span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteBookGalleryImage(enlargedImage.book.id, enlargedImage.index);
                          setIsConfirmingGalleryDelete(false);
                          setEnlargedImage(null);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                      >
                        نعم، احذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingGalleryDelete(false)}
                        className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingGalleryDelete(true)}
                      className="px-3 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف من المعرض</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingGalleryDelete(false);
                    setEnlargedImage(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden inputs for uploading Cover, Gallery Images and Gallery Videos */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCoverFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryFileSelected}
      />
      <input
        ref={galleryVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={onGalleryVideoFileSelected}
      />

      {/* Direct Video URL Modal */}
      {isVideoUrlModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-[#0b385e] space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-[#0b385e] text-sm flex items-center gap-2">
                <Film className="w-4 h-4 text-[#dfa85b]" />
                <span>إضافة رابط فيديو لمعرض الكتاب</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoUrlModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVideoUrlSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط ملف الفيديو المباشر (Direct MP4 / WebM URL):
                </label>
                <input
                  type="url"
                  required
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://.../video.mp4"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0b385e] outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVideoUrlModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0b385e] text-white text-xs font-bold rounded-lg hover:bg-[#082a47] cursor-pointer shadow"
                >
                  إضافة الفيديو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
