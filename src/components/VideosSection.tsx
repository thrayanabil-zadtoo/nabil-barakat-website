import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import {
  Video,
  Play,
  Plus,
  Trash2,
  Edit2,
  Share2,
  Sparkles,
  Pin,
  Upload,
  Film,
  Maximize2,
  X,
  BookOpen,
  ShieldCheck,
  Lock,
  Layers,
  ChevronLeft,
  Tv,
  Check,
} from 'lucide-react';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';
import { SmartVideoPlayer } from './SmartVideoPlayer';

export const VideosSection: React.FC = () => {
  const {
    videos,
    addVideo,
    isAuthorMode,
    deleteVideo,
    setEditingVideo,
    openShareModal,
    openCommentModal,
    togglePinVideo,
    moveVideoOrder,
    setVideoPosition,
    books,
    showToast,
    processAndUploadVideo,
  } = useApp();

  // Novel filter: 'all' or specific novel ID (e.g. 'book-1')
  const [selectedNovelId, setSelectedNovelId] = useState<string>('all');
  const [activeVideoModal, setActiveVideoModal] = useState<VideoItem | null>(null);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);

  // Add Video Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNovelId, setNewNovelId] = useState<string>(() => books[0]?.id || 'book-1');
  const [newChapterNumber, setNewChapterNumber] = useState<number | ''>(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [uploadedVideoData, setUploadedVideoData] = useState<string>('');
  const [directVideoUrl, setDirectVideoUrl] = useState<string>('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState('02:30');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // List of novels for filter tabs
  const novelList = useMemo(() => {
    return books.map((b) => ({
      id: b.id,
      title: b.title,
      cover: b.coverImage,
      videoCount: videos.filter((v) => v.bookId === b.id || v.title.includes(b.title) || v.category.includes(b.title)).length,
    }));
  }, [books, videos]);

  // Selected Novel Object
  const selectedNovel = useMemo(() => {
    if (selectedNovelId === 'all') return null;
    return books.find((b) => b.id === selectedNovelId) || null;
  }, [selectedNovelId, books]);

  // Filtered and Sorted Videos
  const filteredVideos = useMemo(() => {
    let list = videos;
    if (selectedNovelId !== 'all') {
      const currentBook = books.find((b) => b.id === selectedNovelId);
      list = videos.filter((v) => {
        if (v.bookId === selectedNovelId) return true;
        if (currentBook && (v.title.includes(currentBook.title) || v.category.includes(currentBook.title))) {
          return true;
        }
        return false;
      });
      // Sort chapters sequentially by chapter number if available
      return [...list].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const chA = a.chapterNumber || 999;
        const chB = b.chapterNumber || 999;
        return chA - chB;
      });
    }
    return list;
  }, [videos, selectedNovelId, books]);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      showToast('حجم ملف الفيديو أكبر من 150 ميجابايت. يُرجى اختيار ملف أصغر أو استخدام رابط الفيديو المباشر.');
      return;
    }

    try {
      setIsProcessingVideo(true);
      const videoUrl = await processAndUploadVideo(file, {
        contextTitle: newTitle || 'مشهد روائي',
        bookId: newNovelId,
      });
      setUploadedVideoData(videoUrl);
      setIsProcessingVideo(false);
    } catch (err: any) {
      setIsProcessingVideo(false);
      showToast(err?.message || 'تعذر رفع ملف الفيديو، يرجى المحاولة مرة أخرى');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('يرجى كتابة عنوان المشهد أو الفصل');
      return;
    }

    const finalVideoSource = uploadedVideoData || directVideoUrl.trim();

    if (!finalVideoSource) {
      showToast('يرجى رفع ملف الفيديو أو إدخال رابط المشهد');
      return;
    }

    const assignedBook = books.find((b) => b.id === newNovelId);
    const bookTitle = assignedBook ? assignedBook.title : 'مؤلفات نبيل بركات';

    addVideo({
      title: newTitle.trim(),
      url: finalVideoSource,
      videoFileUrl: uploadedVideoData || undefined,
      description: newDesc.trim() || `مشهد مرئي وتجسيد درامي لفصول رواية «${bookTitle}» بقلم الكاتب أ. نبيل بركات.`,
      category: `رواية ${bookTitle}`,
      platform: 'direct',
      duration: newDuration || '02:30',
      likesCount: '1.5K',
      commentsCount: '180',
      bookId: newNovelId,
      bookTitle,
      chapterNumber: newChapterNumber ? Number(newChapterNumber) : undefined,
      chapterTitle: newChapterTitle.trim() || undefined,
    });

    setNewTitle('');
    setUploadedVideoData('');
    setDirectVideoUrl('');
    setNewDesc('');
    setNewChapterTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 py-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <span>الإنتاج المرئي والدرامي للمؤلفات الأدبية</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>مشاهدة حصرية مباشرة · محمي بعلامة مائية</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b385e] font-literary flex items-center gap-2">
            <Film className="w-7 h-7 text-[#dfa85b]" />
            <span>فيديو يجسد الروايات</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] max-w-3xl leading-relaxed">
            مشاهد درامية وفصول مصورة تجسد روايات ومؤلفات الكاتب الروائي والشاعر <span className="font-bold text-[#0b385e]">أ. نبيل بركات</span>، تأخذك في رحلة بصرية حية داخل أعماق الشخصيات وحبكات الروايات. (مشاهدة حصرية مباشرة بدون تحميل لحفظ حقوق الملكية الفكرية).
          </p>
        </div>

        {/* Supervisor add video button */}
        {isAuthorMode && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>+ إضافة فصل / مشهد فيديو جديد</span>
          </button>
        )}
      </div>

      {/* Novel Filter Tabs (ضمن روايات) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span className="flex items-center gap-1.5 text-[#0b385e]">
            <BookOpen className="w-4 h-4 text-[#dfa85b]" />
            <span>اختر الرواية لمشاهدة فصولها المجسدة بالفيديو:</span>
          </span>
          <span>{filteredVideos.length} مشهد متوفر</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedNovelId('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedNovelId === 'all'
                ? 'bg-[#0b385e] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>كافة الروايات والمؤلفات ({videos.length})</span>
          </button>

          {novelList.map((novel) => {
            const isSelected = selectedNovelId === novel.id;
            return (
              <button
                key={novel.id}
                onClick={() => setSelectedNovelId(novel.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#dfa85b] text-[#07243c] font-black shadow-md border border-[#c4924c]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-[#07243c]' : 'text-[#c4924c]'}`} />
                <span>رواية «{novel.title}»</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-[#07243c] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {novel.videoCount} {novel.videoCount === 1 ? 'فصل' : 'فصول'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Novel Spotlight Card */}
      {selectedNovel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-[#0b385e] to-[#07243c] text-white flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-lg border border-[#dfa85b]/30">
          {selectedNovel.coverImage ? (
            <img
              src={selectedNovel.coverImage}
              alt={selectedNovel.title}
              className="w-20 h-28 object-cover rounded-xl shadow-md border-2 border-[#dfa85b]/50 shrink-0"
            />
          ) : (
            <div className="w-20 h-28 rounded-xl bg-white/10 border-2 border-[#dfa85b]/50 flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8 text-[#dfa85b]" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-right space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#dfa85b] font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
              <Tv className="w-3.5 h-3.5" />
              <span>مشاهد وفصول مجسدة حصرياً</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-literary">
              رواية «{selectedNovel.title}» — الفصول المجسدة مرئياً
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl line-clamp-2 leading-relaxed">
              {selectedNovel.description || selectedNovel.subtitle}
            </p>
          </div>
          <div className="shrink-0 text-center bg-white/10 p-3 rounded-xl border border-white/10">
            <div className="text-xl font-black text-[#dfa85b]">{filteredVideos.length}</div>
            <div className="text-[10px] text-slate-300">فصول مرئية</div>
          </div>
        </div>
      )}

      {/* Supervisor: Add New Video Chapter Form */}
      {showAddForm && isAuthorMode && (
        <form
          onSubmit={handleAddVideoSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#dfa85b]/50 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0b385e]">
              <Plus className="w-4 h-4 text-[#dfa85b]" />
              <span>إضافة وتجسيد فيديو جديد ضمن الروايات</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Novel Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اختر الرواية التي يتبع لها المشهد:
              </label>
              <select
                value={newNovelId}
                onChange={(e) => {
                  setNewNovelId(e.target.value);
                  const b = books.find((item) => item.id === e.target.value);
                  if (b && !newTitle) {
                    setNewTitle(`رواية ${b.title} · الفصل الأول`);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-bold text-[#0b385e] outline-none"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    رواية: {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الفصل / المشهد:
              </label>
              <input
                type="number"
                min="1"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(e.target.value ? Number(e.target.value) : '')}
                placeholder="1"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-bold text-center outline-none"
              />
            </div>

            {/* Chapter Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الفصل أو المشهد:
              </label>
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="مثال: الفصل الأول: البدايات الغامضة"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الفيديو الرئيسي:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: رواية وقعت في فخ شيماء · الفصل الأول"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مدة المقطع التقديرية:</label>
              <input
                type="text"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="02:30"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Video file or URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ملف الفيديو أو رابط البث المباشر (MP4 / YouTube / Vimeo):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 ${isProcessingVideo ? 'bg-amber-300 text-amber-900 pointer-events-none' : 'bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c]'} font-black text-xs rounded-xl transition shadow-sm`}>
                <Upload className={`w-4 h-4 ${isProcessingVideo ? 'animate-bounce' : ''}`} />
                <span>{isProcessingVideo ? 'جاري رفع وحفظ الفيديو سحابياً...' : 'رفع ملف فيديو من الجهاز (MP4/WebM)'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  className="hidden"
                  disabled={isProcessingVideo}
                  onChange={handleVideoFileUpload}
                />
              </label>

              <input
                type="text"
                value={directVideoUrl}
                onChange={(e) => setDirectVideoUrl(e.target.value)}
                placeholder="أو ضع رابط ملف فيديو مباشر (MP4)..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-mono outline-none"
              />
            </div>
            {uploadedVideoData && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">✓ تم رفع الفيديو وحفظه في السحابة: {uploadedVideoData}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUploadedVideoData('')}
                  className="text-slate-400 hover:text-rose-500 text-xs px-1.5 cursor-pointer shrink-0"
                  title="إلغاء الفيديو"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وصف موجز للمشهد الدرامي:</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="اكتب نبذة عن أحداث هذا المشهد وتطوره الروائي..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 resize-none outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-black cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessingVideo}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isProcessingVideo ? 'جاري المعالجة...' : 'حفظ ونشر الفصل في السحابة'}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Novel Video Chapters */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
          <Film className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">لا توجد فصول فيديو مضافة لهذه الرواية بعد</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            يمكن للمشرف إضافة وتجسيد فصول الرواية بالفيديو بالضغط على زر «+ إضافة فصل / مشهد فيديو جديد» بالأعلى.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const rawSource = video.videoFileUrl || video.url;
            const videoSource = (rawSource || '').trim();
            const novelTitle = video.bookTitle || video.category.replace('رواية', '').trim();

            return (
              <div
                key={video.id}
                className="gold-gilded-card group rounded-2xl bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200"
              >
                {/* Protected Video Player with Live Watermark */}
                <div
                  className="relative aspect-[16/10] w-full bg-black overflow-hidden flex flex-col items-center justify-center border-b border-slate-200 select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <SmartVideoPlayer
                    rawSrc={videoSource}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain bg-black"
                  />

                  {/* Copyright Watermark Badge (العلامة المائية لحفظ الحقوق عند البث والمشاهدة) */}
                  <div
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 pointer-events-none select-none z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs border border-white/15 text-white/90 shadow-md"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa85b] animate-ping" />
                    <span className="text-[10px] font-bold tracking-tight">
                      حقوق النشر محفوظة · أ. نبيل بركات ©
                    </span>
                  </div>

                  {/* Bottom Subtitle Watermark for Novel Chapter */}
                  <div
                    aria-hidden="true"
                    className="absolute bottom-11 right-2.5 pointer-events-none select-none z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs text-[9px] text-amber-300/90 font-mono"
                  >
                    <Lock className="w-2.5 h-2.5 text-[#dfa85b]" />
                    <span>مشاهدة حصرية فقط · رواية {novelTitle}</span>
                  </div>

                  {/* Theater Mode Button */}
                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(video)}
                    className="absolute top-2.5 left-2.5 bg-black/75 hover:bg-[#0b385e] text-white px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md transition flex items-center gap-1.5 shadow-md border border-white/20 cursor-pointer z-10"
                    title="تكبير المشغل في وضع المسرح"
                  >
                    <Maximize2 className="w-3 h-3 text-[#dfa85b]" />
                    <span>تكبير المشغل</span>
                  </button>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/75 text-white px-2 py-0.5 rounded text-[10px] font-mono tabular-nums z-10">
                    {video.duration || '02:30'}
                  </div>
                </div>

                {/* Video Info & Chapters Label */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    
                    {/* Chapter & Novel Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#07243c] font-black bg-[#dfa85b] px-2.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                          {video.chapterNumber ? `الفصل ${video.chapterNumber}` : 'مشهد روائي'}
                        </span>
                        <span className="text-[#0b385e] font-bold bg-[#edf4fb] px-2 py-0.5 rounded-md text-[11px]">
                          {novelTitle}
                        </span>
                        {video.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[#07243c] text-[10px] font-black shadow-2xs">
                            <Pin className="w-3 h-3 fill-current rotate-45" />
                            <span>مثبت</span>
                          </span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-[11px] text-slate-400">{video.date}</span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setActiveVideoModal(video)}
                      className="text-base font-bold text-[#0b385e] hover:text-[#dfa85b] cursor-pointer transition line-clamp-2 font-literary leading-snug"
                    >
                      {video.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                      {video.description}
                    </p>

                    {/* Interaction Bar */}
                    <div className="pt-2">
                      <ContentInteractionBar
                        itemId={video.id}
                        itemTitle={`فيديو يجسد الروايات: ${video.title}`}
                        itemType="video"
                        commentsCount={32}
                        itemUrl={video.url}
                        itemDescription={video.description}
                      />
                    </div>
                  </div>

                  {/* Footer: Protected Viewing Tag & Supervisor controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>مشاهدة فقط (التحميل معطل)</span>
                    </span>

                    {/* Supervisor Actions */}
                    {isAuthorMode && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingVideo(video)}
                          className="p-1.5 text-[#0b385e] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="تعديل الفيديو"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteVideoId === video.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300">
                            <span className="text-[10px] font-bold text-rose-700">حذف؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteVideo(video.id);
                                setConfirmDeleteVideoId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVideoId(null)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteVideoId(video.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف هذا الفصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Supervisor Pin & Order Controls */}
                  {isAuthorMode && (
                    <ItemOrderPinControls
                      isPinned={video.isPinned}
                      onTogglePin={() => togglePinVideo(video.id)}
                      currentIndex={videos.findIndex((v) => v.id === video.id)}
                      totalCount={videos.length}
                      onMoveUp={() => moveVideoOrder(video.id, 'up')}
                      onMoveDown={() => moveVideoOrder(video.id, 'down')}
                      onSetPosition={(newPos) => setVideoPosition(video.id, newPos)}
                    />
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Theater Modal Video Player with Watermark Overlay */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#071929] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0b385e] text-white">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#dfa85b]" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold truncate max-w-md font-literary">
                    {activeVideoModal.title}
                  </h3>
                  <div className="text-[11px] text-[#cbe0f0]">
                    تجسيد درامي لروايات أ. نبيل بركات · مشاهدة حصرية مباشرة
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-white hover:text-[#dfa85b] p-1.5 rounded-lg transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player in Theater Mode with Prominent Watermark */}
            <div
              className="relative aspect-[16/9] w-full bg-black flex items-center justify-center select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {(() => {
                const modalVideoSrc = (activeVideoModal.videoFileUrl || activeVideoModal.url || '').trim();
                if (!modalVideoSrc) {
                  return (
                    <div className="w-full aspect-video flex flex-col items-center justify-center bg-black text-slate-300 p-6 text-center">
                      <Film className="w-12 h-12 text-[#dfa85b] mb-2" />
                      <span className="text-sm font-bold">لا يوجد ملف فيديو متاح لهذا المشهد</span>
                    </div>
                  );
                }
                return (
                  <SmartVideoPlayer
                    rawSrc={modalVideoSrc}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                );
              })()}

              {/* Top-Right Watermark Seal */}
              <div
                aria-hidden="true"
                className="absolute top-4 right-4 pointer-events-none select-none z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#dfa85b] animate-ping" />
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#dfa85b] tracking-wide">
                    جميع الحقوق محفوظة للكاتب أ. نبيل بركات ©
                  </div>
                  <div className="text-[9px] text-slate-300">
                    بث مرئي محمي برمجياً · غير متاح للتحميل
                  </div>
                </div>
              </div>

              {/* Bottom-Right Watermark Chapter Banner */}
              <div
                aria-hidden="true"
                className="absolute bottom-16 right-4 pointer-events-none select-none z-20 px-3 py-1 rounded-lg bg-black/50 backdrop-blur-xs text-[10px] text-amber-200/90 font-mono border border-white/10"
              >
                {activeVideoModal.bookTitle ? `رواية: «${activeVideoModal.bookTitle}»` : 'فيديو يجسد الروايات'}
                {activeVideoModal.chapterNumber ? ` · الفصل ${activeVideoModal.chapterNumber}` : ''}
              </div>
            </div>

            {/* Details & Actions Footer */}
            <div className="p-5 bg-[#0a233a] border-t border-white/10 text-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#07243c] font-black bg-[#dfa85b] px-3 py-1 rounded-lg shadow-sm">
                    {activeVideoModal.chapterNumber ? `الفصل ${activeVideoModal.chapterNumber}` : 'مشهد روائي'}
                  </span>
                  <span className="text-xs text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                    {activeVideoModal.bookTitle || activeVideoModal.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `فيديو يجسد الروايات: ${activeVideoModal.title}`,
                        url: activeVideoModal.url,
                        description: activeVideoModal.description,
                        type: 'video',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>مشاركة المشهد</span>
                  </button>

                  <button
                    onClick={() =>
                      openCommentModal({
                        targetType: 'video',
                        targetId: activeVideoModal.id,
                        targetTitle: activeVideoModal.title,
                      })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>إضافة تعليق ومراجعة</span>
                  </button>
                </div>
              </div>

              {activeVideoModal.description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-literary">
                  {activeVideoModal.description}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
