import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem, Book } from '../types';
import {
  Film,
  Play,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Pin,
  Upload,
  Maximize2,
  X,
  BookOpen,
  ShieldCheck,
  RotateCw,
  Check,
  Youtube,
  ExternalLink,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { parseVideoUrl } from '../utils/videoUtils';

export const SPECIAL_CATEGORIES = [
  { id: 'cat-success', title: 'نجاحاتي', icon: '🏆', badge: 'إنجازات وتكريم' },
  { id: 'cat-biography', title: 'كتاب السيرة الروائية', icon: '📖', badge: 'سيرة ومسيرة' },
  { id: 'cat-outings', title: 'خروجات', icon: '🌿', badge: 'جولات ولقاءات' },
  { id: 'cat-lessons', title: 'دروس من الحياة', icon: '💡', badge: 'عِبر وتأملات' },
];

export const VideosSection: React.FC = () => {
  const {
    videos,
    addVideo,
    updateVideo,
    deleteVideo,
    togglePinVideo,
    moveVideoOrder,
    setVideoPosition,
    books,
    isAuthorMode,
    showToast,
    refreshAndBypassCache,
    autoRefreshEnabled,
    toggleAutoRefresh,
    processAndUploadVideo,
  } = useApp();

  // Active novel filter: 'all' or a specific book id or special category id
  const [selectedNovelId, setSelectedNovelId] = useState<string>('all');

  // Video modals state
  const [activeTheaterVideo, setActiveTheaterVideo] = useState<VideoItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVideoItem, setEditingVideoItem] = useState<VideoItem | null>(null);

  // Form Fields
  const [formNovelId, setFormNovelId] = useState<string>(() => books[0]?.id || 'book-1');
  const [formChapterNumber, setFormChapterNumber] = useState<number | ''>(1);
  const [formChapterTitle, setFormChapterTitle] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formVideoUrl, setFormVideoUrl] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDuration, setFormDuration] = useState<string>('02:30');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  // Selected Special Category if chosen
  const selectedSpecialCat = useMemo(() => {
    return SPECIAL_CATEGORIES.find((c) => c.id === selectedNovelId) || null;
  }, [selectedNovelId]);

  // Selected Novel Object for current tab (if a book is chosen)
  const selectedNovel = useMemo(() => {
    if (selectedNovelId === 'all' || selectedSpecialCat) return null;
    return books.find((b) => b.id === selectedNovelId) || null;
  }, [selectedNovelId, books, selectedSpecialCat]);

  // Special Categories with counts
  const specialCategoriesWithCounts = useMemo(() => {
    return SPECIAL_CATEGORIES.map((cat) => {
      const count = videos.filter((v) => {
        if (v.bookId === cat.id) return true;
        if (v.category === cat.title || v.bookTitle === cat.title) return true;
        if (v.title?.includes(cat.title)) return true;
        return false;
      }).length;
      return { ...cat, count };
    });
  }, [videos]);

  // Novels List with counts
  const novelsWithCounts = useMemo(() => {
    return books.map((book) => {
      const count = videos.filter((v) => {
        if (v.bookId === book.id) return true;
        if (v.title?.includes(book.title) || v.category?.includes(book.title)) return true;
        return false;
      }).length;
      return {
        book,
        count,
      };
    });
  }, [books, videos]);

  // Filtered and Sorted videos
  const displayedVideos = useMemo(() => {
    let list = videos;
    if (selectedSpecialCat) {
      list = videos.filter((v) => {
        if (v.bookId === selectedSpecialCat.id) return true;
        if (v.category === selectedSpecialCat.title || v.bookTitle === selectedSpecialCat.title) return true;
        if (v.title?.includes(selectedSpecialCat.title)) return true;
        return false;
      });
    } else if (selectedNovelId !== 'all') {
      const activeBook = books.find((b) => b.id === selectedNovelId);
      list = videos.filter((v) => {
        if (v.bookId === selectedNovelId) return true;
        if (activeBook && (v.title?.includes(activeBook.title) || v.category?.includes(activeBook.title))) {
          return true;
        }
        return false;
      });

      // Sort chapters sequentially
      return [...list].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const chA = a.chapterNumber || 999;
        const chB = b.chapterNumber || 999;
        return chA - chB;
      });
    }

    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [videos, selectedNovelId, selectedSpecialCat, books]);

  // Open modal in Add mode
  const handleOpenAddModal = (presetId?: string) => {
    const targetId = presetId || (selectedNovelId !== 'all' ? selectedNovelId : books[0]?.id || 'book-1');
    const targetBook = books.find((b) => b.id === targetId);
    const targetSpecialCat = SPECIAL_CATEGORIES.find((c) => c.id === targetId);
    const existingCount = videos.filter((v) => v.bookId === targetId).length;

    setEditingVideoItem(null);
    setFormNovelId(targetId);
    setFormChapterNumber(targetSpecialCat ? '' : existingCount + 1);
    setFormChapterTitle('');
    setFormTitle('');
    setFormVideoUrl('');
    setFormDescription(
      targetSpecialCat
        ? `مشهد مرئي وتأملات ضمن قسم «${targetSpecialCat.title}» بقلم الكاتب أ. نبيل بركات.`
        : targetBook
        ? `تجسيد مرئي ودرامي لفصول رواية «${targetBook.title}» بقلم الكاتب أ. نبيل بركات.`
        : ''
    );
    setFormDuration('02:30');
    setIsModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEditModal = (video: VideoItem) => {
    setEditingVideoItem(video);
    setFormNovelId(video.bookId || books[0]?.id || 'book-1');
    setFormChapterNumber(video.chapterNumber ?? '');
    setFormChapterTitle(video.chapterTitle || '');
    setFormTitle(video.title || '');
    setFormVideoUrl(video.url || video.videoFileUrl || '');
    setFormDescription(video.description || '');
    setFormDuration(video.duration || '02:30');
    setIsModalOpen(true);
  };

  // Handle form submission (Add or Edit)
  const handleSubmitVideoForm = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = formVideoUrl.trim();
    if (!rawUrl) {
      showToast('يرجى إدخال رابط الفيديو (مثل رابط YouTube أو Vimeo) أو رفع ملفه');
      return;
    }

    const assignedSpecialCat = SPECIAL_CATEGORIES.find((c) => c.id === formNovelId);
    const assignedBook = books.find((b) => b.id === formNovelId);
    const bookTitle = assignedSpecialCat ? assignedSpecialCat.title : (assignedBook ? assignedBook.title : 'مؤلفات نبيل بركات');
    const categoryName = assignedSpecialCat ? assignedSpecialCat.title : `رواية ${bookTitle}`;

    const cleanTitle =
      formTitle.trim() ||
      (assignedSpecialCat
        ? `${assignedSpecialCat.title} · ${formChapterTitle.trim() || 'مشهد مصور'}`
        : `رواية ${bookTitle} · ${formChapterTitle.trim() || (formChapterNumber ? `الفصل ${formChapterNumber}` : 'مشهد درامي')}`);

    const parsed = parseVideoUrl(rawUrl);
    const isStream = parsed.platform === 'youtube' || parsed.platform === 'vimeo' || parsed.platform === 'tiktok' || parsed.platform === 'drive';
    const finalUrl = parsed.cleanUrl || rawUrl;

    if (editingVideoItem) {
      // Update existing video
      updateVideo(editingVideoItem.id, {
        title: cleanTitle,
        url: finalUrl,
        videoFileUrl: isStream ? undefined : (finalUrl.startsWith('data:') ? finalUrl : editingVideoItem.videoFileUrl),
        platform: parsed.platform !== 'unknown' ? parsed.platform : 'direct',
        description: formDescription.trim() || `تجسيد مرئي ودرامي لـ «${bookTitle}» بقلم الكاتب أ. نبيل بركات.`,
        category: categoryName,
        duration: formDuration || '02:30',
        bookId: formNovelId,
        bookTitle,
        chapterNumber: formChapterNumber ? Number(formChapterNumber) : undefined,
        chapterTitle: formChapterTitle.trim() || undefined,
      });
      showToast(`✓ تم تحديث بيانات المشهد وحفظ رابط YouTube سحابياً!`);
    } else {
      // Add new video
      addVideo({
        title: cleanTitle,
        url: finalUrl,
        videoFileUrl: isStream ? undefined : (finalUrl.startsWith('data:') ? finalUrl : undefined),
        platform: parsed.platform !== 'unknown' ? parsed.platform : 'direct',
        description: formDescription.trim() || `تجسيد مرئي ودرامي ضمن «${bookTitle}» بقلم الكاتب أ. نبيل بركات.`,
        category: categoryName,
        duration: formDuration || '02:30',
        likesCount: '2.1K',
        commentsCount: '190',
        bookId: formNovelId,
        bookTitle,
        chapterNumber: formChapterNumber ? Number(formChapterNumber) : undefined,
        chapterTitle: formChapterTitle.trim() || undefined,
      });
      showToast(`✓ تم حفظ ونشر المشهد بنجاح ضمن «${bookTitle}» وتثبيته سحابياً!`);
    }

    // Switch view to this novel or category so the author sees the change immediately
    setSelectedNovelId(formNovelId);
    setIsModalOpen(false);
  };

  // Direct file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 22 * 1024 * 1024) {
      showToast(`تنبيه: حجم الملف (${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت) كبير. يفضل استخدام رابط YouTube للبث الفوري غير المحدود.`);
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingFile(true);
      const url = await processAndUploadVideo(file, {
        contextTitle: formTitle || 'مشهد روائي',
        bookId: formNovelId,
      });
      setFormVideoUrl(url);
      setIsUploadingFile(false);
      showToast('✓ تم تجهيز ملف الفيديو بنجاح');
    } catch (err: any) {
      setIsUploadingFile(false);
      showToast(err?.message || 'تعذر رفع الملف، يرجى المحاولة ثانية');
    } finally {
      e.target.value = '';
    }
  };

  // Live validation for input URL
  const parsedInputUrl = useMemo(() => {
    if (!formVideoUrl.trim()) return null;
    return parseVideoUrl(formVideoUrl.trim());
  }, [formVideoUrl]);

  return (
    <section className="space-y-8 py-4 sm:py-6" dir="rtl" aria-label="فيديو يجسد الروايات">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <span>الإنتاج المرئي والدرامي للمؤلفات الأدبية</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>مشاهدة حصرية مباشرة · محمي بعلامة مائية</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b385e] font-literary flex items-center gap-2.5">
            <Film className="w-8 h-8 text-[#dfa85b]" />
            <span>فيديو يجسد الروايات</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] max-w-3xl leading-relaxed">
            فضاء مرئي تفاعلي يجسد روايات ومؤلفات الكاتب والشاعر <span className="font-bold text-[#0b385e]">أ. نبيل بركات</span> عبر مشاهد وفصول درامية مصورة، مبثوثة مباشرة وبأعلى دقة من YouTube مع حفظ حقوق الملكية الفكرية.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Add video button - strictly supervisor only */}
          {isAuthorMode && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl text-xs transition shadow-sm hover:shadow cursor-pointer"
              title="إضافة مشهد أو فصل فيديو جديد"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة فيديو / مشهد جديد</span>
            </button>
          )}

          {/* Auto Refresh Toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border ${
              autoRefreshEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="تفعيل أو إيقاف التحديث التلقائي لمنع الكاش وجلب التعديلات فورا"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{autoRefreshEnabled ? 'تحديث تلقائي: نشط 🟢' : 'تحديث تلقائي: متوقف ⚪'}</span>
          </button>

          {/* Force bypass cache */}
          <button
            onClick={() => refreshAndBypassCache(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
            title="تحديث الصفحة فوراً ومسح كاش المتصفح"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>تحديث وتجاوز الكاش 🔄</span>
          </button>
        </div>
      </div>

      {/* Literary Motto Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#dfa85b]/20 to-amber-500/10 border border-[#dfa85b]/40 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
        <p className="text-base sm:text-xl font-bold text-[#0b385e] font-literary tracking-wide">
          «حكايات تلامس القلوب… وعِبر تبقى في العقول.»
        </p>
        <span className="text-xs text-[#8c6527] font-semibold mt-1 block">
          مشاهد وخواطر وتجارب إنسانية مصورة من مسيرة الكاتب أ. نبيل بركات
        </span>
      </div>

      {/* 2. Category & Novel Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <BookOpen className="w-4 h-4 text-[#dfa85b]" />
            <span>اختر الرواية أو القسم لمشاهدة فصولها ومقاطعها المصورة:</span>
          </div>
          <span className="text-[11px] text-slate-500">
            إجمالي الفيديوهات: <strong className="text-[#0b385e]">{videos.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {/* All Tab */}
          <button
            onClick={() => setSelectedNovelId('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedNovelId === 'all'
                ? 'bg-[#0b385e] text-white border-[#0b385e] shadow-md'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>كل الروايات والأقسام</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                selectedNovelId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {videos.length}
            </span>
          </button>

          {/* 4 Special Categories Tabs requested by user */}
          {specialCategoriesWithCounts.map((cat) => {
            const isSelected = selectedNovelId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedNovelId(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#dfa85b] text-[#07243c] border-[#dfa85b] shadow-md ring-2 ring-[#0b385e]/30'
                    : 'bg-amber-50/70 hover:bg-amber-100/70 text-[#0b385e] border-amber-200 shadow-2xs'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-black/15 text-[#07243c]'
                      : cat.count > 0
                      ? 'bg-amber-200/80 text-amber-900 font-bold'
                      : 'bg-white/80 text-slate-400'
                  }`}
                >
                  {cat.count > 0 ? `${cat.count}` : 'فارغ'}
                </span>
              </button>
            );
          })}

          <div className="w-px h-6 bg-slate-300 mx-1 shrink-0" />

          {/* Individual Novel Tabs */}
          {novelsWithCounts.map(({ book, count }) => {
            const isSelected = selectedNovelId === book.id;
            return (
              <button
                key={book.id}
                onClick={() => setSelectedNovelId(book.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0b385e] text-white border-[#0b385e] shadow-md ring-2 ring-[#dfa85b]/40'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                }`}
              >
                {book.coverImage && (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-5 h-7 object-cover rounded shadow-2xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <span>{book.title}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {count > 0 ? `${count} مقطع` : 'فارغ'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Category Highlight Card (When chosen) */}
      {selectedSpecialCat && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#0b385e]/5 to-slate-50 border border-[#dfa85b]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0b385e] to-[#dfa85b] flex items-center justify-center text-2xl shadow-md shrink-0">
            {selectedSpecialCat.icon}
          </div>
          <div className="flex-1 space-y-1 text-center sm:text-right">
            <span className="text-xs font-bold text-[#c4924c] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {selectedSpecialCat.badge}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#0b385e] font-literary">
              قسم: {selectedSpecialCat.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              «حكايات تلامس القلوب… وعِبر تبقى في العقول.» — مشاهد ومقاطع فيديو ملهمة للأستاذ نبيل بركات.
            </p>
          </div>
          {isAuthorMode && (
            <button
              onClick={() => handleOpenAddModal(selectedSpecialCat.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#dfa85b]" />
              <span>+ إضافة فيديو لهذا القسم</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Selected Novel Highlight Card (When a specific novel is chosen) */}
      {selectedNovel && (
        <div className="bg-gradient-to-r from-[#0b385e]/5 via-[#dfa85b]/10 to-slate-50 border border-[#dfa85b]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {selectedNovel.coverImage && (
            <img
              src={selectedNovel.coverImage}
              alt={selectedNovel.title}
              className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl shadow-md border border-white shrink-0"
            />
          )}
          <div className="flex-1 space-y-1.5 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#c4924c] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {selectedNovel.genre || 'رواية أدبية'}
              </span>
              {selectedNovel.publicationYear && (
                <span className="text-xs text-slate-500 font-mono">سنة النشر: {selectedNovel.publicationYear}</span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0b385e] font-literary">
              رواية «{selectedNovel.title}»
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed max-w-2xl">
              {selectedNovel.description || 'فصول درامية مصورة تجسد تفاصيل وشخصيات هذا العمل الأدبي.'}
            </p>
          </div>
          {isAuthorMode && (
            <div className="shrink-0 flex sm:flex-col gap-2">
              <button
                onClick={() => handleOpenAddModal(selectedNovel.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>+ تجسيد فصل جديد</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Videos Grid / Empty State */}
      {displayedVideos.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-slate-300 space-y-4 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
            <Film className="w-8 h-8 text-[#dfa85b]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="font-bold text-slate-800 text-base">
              {selectedSpecialCat
                ? `لا توجد مقاطع فيديو مضافة لقسم «${selectedSpecialCat.title}» بعد`
                : selectedNovel
                ? `لا توجد فصول فيديو مضافة لرواية «${selectedNovel.title}» بعد`
                : 'لا توجد فصول فيديو مضافة حتى الآن'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAuthorMode
                ? 'يمكنك كـ مشرف إضافة وتجسيد أول مشهد بالفيديو بسهولة بوضع رابط المقطع من YouTube (عادي أو شورتس) ليظهر فوراً في هذه القائمة.'
                : 'ترقبوا نشر فصول ومشاهد مرئية قريباً بإذن الله.'}
            </p>
          </div>
          {isAuthorMode && (
            <button
              onClick={() => handleOpenAddModal(selectedSpecialCat?.id || selectedNovel?.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة أول مشهد فيديو {selectedSpecialCat ? `لقسم «${selectedSpecialCat.title}»` : selectedNovel ? `لرواية «${selectedNovel.title}»` : ''}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVideos.map((video, index) => {
            const rawSource = video.url || video.videoFileUrl || '';
            const parsed = parseVideoUrl(rawSource);
            const isYouTube = parsed.platform === 'youtube';
            const novelTitle = video.bookTitle || video.category.replace('رواية', '').trim();

            return (
              <article
                key={video.id}
                className="gold-gilded-card group rounded-2xl bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200"
              >
                {/* Video Player Box */}
                <div
                  className="relative aspect-video w-full bg-black overflow-hidden flex flex-col items-center justify-center border-b border-slate-200 select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <SmartVideoPlayer
                    rawSrc={rawSource}
                    title={video.title}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />

                  {/* Copyright Watermark Badge */}
                  <div
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 pointer-events-none select-none z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs border border-white/15 text-white/90 shadow-md text-[10px] font-bold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa85b] animate-ping" />
                    <span>أ. نبيل بركات ©</span>
                  </div>

                  {/* Platform Indicator */}
                  {isYouTube && (
                    <div
                      aria-hidden="true"
                      className="absolute bottom-2.5 right-2.5 pointer-events-none select-none z-10 flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold shadow-sm"
                    >
                      <Youtube className="w-3 h-3" />
                      <span>{parsed.isShortLink || rawSource.includes('shorts') ? 'YouTube Shorts' : 'YouTube'}</span>
                    </div>
                  )}

                  {/* Theater Mode Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTheaterVideo(video)}
                    className="absolute top-2.5 left-2.5 bg-black/75 hover:bg-[#0b385e] text-white px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition flex items-center gap-1 shadow-md border border-white/20 cursor-pointer z-10"
                    title="تكبير المشغل"
                  >
                    <Maximize2 className="w-3 h-3 text-[#dfa85b]" />
                    <span>تكبير</span>
                  </button>
                </div>

                {/* Video Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Chapter & Novel/Category Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b385e] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <BookOpen className="w-3 h-3 text-[#dfa85b]" />
                        <span>
                          {video.category?.startsWith('رواية')
                            ? video.category
                            : video.bookTitle && !video.bookTitle.includes('نبيل بركات')
                            ? `رواية ${video.bookTitle}`
                            : video.category || 'مقطع أدبي'}
                        </span>
                      </span>

                      {video.chapterNumber && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          الفصل {video.chapterNumber}
                        </span>
                      )}

                      {video.isPinned && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                          <Pin className="w-3 h-3" />
                          <span>مثبت</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-[#0b385e] transition leading-snug">
                      {video.title}
                    </h3>

                    {/* Description */}
                    {video.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Meta: Duration, Date & Admin Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration || '02:30'}</span>
                      </span>
                      <span>{video.date}</span>
                    </div>

                    {/* Interaction Bar */}
                    <ContentInteractionBar
                      itemId={video.id}
                      itemTitle={video.title}
                      itemType="video"
                      itemUrl={rawSource}
                      itemDescription={video.description}
                    />

                    {/* Pin, Order and Edit Controls - Strictly Supervisor Only */}
                    {isAuthorMode && (
                      <div className="flex items-center justify-between pt-1 gap-1">
                        <ItemOrderPinControls
                          isPinned={!!video.isPinned}
                          currentIndex={index}
                          totalCount={displayedVideos.length}
                          onTogglePin={() => togglePinVideo(video.id)}
                          onMoveUp={() => moveVideoOrder(video.id, 'up')}
                          onMoveDown={() => moveVideoOrder(video.id, 'down')}
                          onSetPosition={(pos: number) => setVideoPosition(video.id, pos)}
                        />

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(video)}
                            className="p-1.5 text-slate-500 hover:text-[#0b385e] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="تعديل رابط الفيديو أو عنوانه"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(video.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="حذف هذا الفيديو"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-[#0b385e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="font-bold text-base font-literary">
                  {editingVideoItem ? 'تعديل بيانات ورابط المشهد' : 'إضافة وتجسيد فصل جديد باليوتيوب'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitVideoForm} className="p-5 space-y-4 text-xs">
              {/* Novel / Category Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">القسم أو الرواية التابع لها هذا الفيديو:</label>
                <select
                  value={formNovelId}
                  onChange={(e) => setFormNovelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-800 outline-none focus:border-[#dfa85b] focus:bg-white"
                >
                  <optgroup label="الأقسام والسلاسل الخاصة">
                    {SPECIAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.title} ({cat.badge})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="الروايات والمؤلفات">
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        رواية «{b.title}» ({b.genre || 'رواية'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Chapter Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الفصل (اختياري):</label>
                  <input
                    type="number"
                    min="1"
                    value={formChapterNumber}
                    onChange={(e) => setFormChapterNumber(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono outline-none focus:border-[#dfa85b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان الفصل أو المشهد:</label>
                  <input
                    type="text"
                    value={formChapterTitle}
                    onChange={(e) => setFormChapterTitle(e.target.value)}
                    placeholder="مثال: البدايات الغامضة"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 outline-none focus:border-[#dfa85b] focus:bg-white"
                  />
                </div>
              </div>

              {/* Video Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الفيديو الرئيسي (اختياري):</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="إذا تُرك فارغاً سيتم توليد اسم الرواية ورقم الفصل تلقائياً"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 outline-none focus:border-[#dfa85b] focus:bg-white"
                />
              </div>

              {/* YouTube / Video URL Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">رابط الفيديو (YouTube / Shorts / Vimeo / MP4):</label>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                    <Youtube className="w-3 h-3" />
                    <span>يُفضل YouTube لسرعة فائقة</span>
                  </span>
                </div>

                <input
                  type="text"
                  required
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/... أو https://youtube.com/shorts/..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono outline-none focus:border-[#dfa85b] focus:bg-white transition"
                />

                {/* Instant Link Validation Feedback */}
                {parsedInputUrl && (
                  <div className="text-[11px] p-2.5 rounded-xl border transition flex items-center gap-2">
                    {parsedInputUrl.platform === 'youtube' ? (
                      <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 w-full flex items-center gap-2 font-bold">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ تم التعرف على فيديو YouTube بنجاح (المعرف: {parsedInputUrl.videoId})</span>
                      </div>
                    ) : parsedInputUrl.platform !== 'unknown' ? (
                      <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 w-full flex items-center gap-2 font-bold">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ تم التعرف على منصة {parsedInputUrl.platform} بنجاح</span>
                      </div>
                    ) : (
                      <div className="text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-2 w-full flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>رابط ملف مباشر أو فيديو سحابي</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Preview Embed */}
                {parsedInputUrl?.embedUrl && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500">معاينة مباشرة للمشغل:</span>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-300">
                      <iframe
                        src={parsedInputUrl.embedUrl}
                        title="معاينة الفيديو"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                )}

                {/* Or File Upload */}
                <div className="pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition w-full justify-center">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingFile ? 'جاري معالجة الملف...' : 'أو رفع ملف MP4 من الجهاز (حتى 20 ميجابايت)'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      disabled={isUploadingFile}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المشهد وتفاصيل الفصل:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="اكتب نبذة عن هذا الفصل الروائي والمشهد الدرامي..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 outline-none focus:border-[#dfa85b] focus:bg-white resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المدة التقديرية (مثال 02:45):</label>
                <input
                  type="text"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="02:30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono outline-none focus:border-[#dfa85b] focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-black font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFile}
                  className="px-5 py-2.5 font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {editingVideoItem ? 'حفظ التعديلات سحابياً' : 'حفظ ونشر الفصل في السحابة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Theater / Fullscreen Modal */}
      {activeTheaterVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 space-y-3 p-4">
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="font-bold text-base line-clamp-1">{activeTheaterVideo.title}</h3>
              </div>
              <button
                onClick={() => setActiveTheaterVideo(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
              <SmartVideoPlayer
                rawSrc={activeTheaterVideo.url || activeTheaterVideo.videoFileUrl}
                title={activeTheaterVideo.title}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-white/80 text-xs space-y-1">
              <p className="leading-relaxed">{activeTheaterVideo.description}</p>
              <div className="text-[11px] text-[#dfa85b] font-bold">
                حقوق الملكية الفكرية محفوظة · الكاتب الروائي والشاعر أ. نبيل بركات ©
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-base text-slate-900">تأكيد حذف المشهد</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف هذا المشهد المرئي من قائمة الرواية؟ سيتم إزالته من السحابة أيضاً.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  deleteVideo(confirmDeleteId);
                  setConfirmDeleteId(null);
                  showToast('تم حذف مقطع الفيديو بنجاح');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
