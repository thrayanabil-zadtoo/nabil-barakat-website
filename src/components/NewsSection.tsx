import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NewsItem } from '../types';
import {
  Newspaper,
  Plus,
  X,
  Clock,
  BookOpen,
  Trash2,
  Share2,
  Edit2,
  MessageSquare,
  Pin,
  Image as ImageIcon,
  Video,
  Play,
  Upload,
  ExternalLink,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';
import { compressImage } from '../utils/imageCompressor';
import { parseVideoUrl } from '../utils/videoUtils';

export const NewsSection: React.FC = () => {
  const {
    news,
    addNews,
    isAuthorMode,
    deleteNews,
    showToast,
    setEditingNews,
    openShareModal,
    openCommentModal,
    togglePinNews,
    moveNewsOrder,
    setNewsPosition,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [readingArticle, setReadingArticle] = useState<NewsItem | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [confirmDeleteNewsId, setConfirmDeleteNewsId] = useState<string | null>(null);

  // New post form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('أخبار ونشاطات');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newCover, setNewCover] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newSource, setNewSource] = useState('المكتب الإعلامي للكاتب');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const categories = ['all', ...Array.from(new Set(news.map((n) => n.category)))];

  const filteredNews = news
    .filter((n) => (selectedCategory === 'all' ? true : n.category === selectedCategory))
    .filter((n) => {
      if (mediaFilter === 'image') return n.mediaType !== 'video';
      if (mediaFilter === 'video') return n.mediaType === 'video' || Boolean(n.videoUrl);
      return true;
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingMedia(true);
      const compressed = await compressImage(file, 1600, 1600, 0.84);
      setNewCover(compressed);
      showToast('تم تحميل الصورة بنجاح وتجهيزها للعرض');
    } catch {
      showToast('تعذر معالجة الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 45MB max
    if (file.size > 45 * 1024 * 1024) {
      showToast('حجم ملف الفيديو كبير جداً. يرجى اختيار فيديو بحجم أقل من 45 ميجابايت أو إضافة رابط تيكتوك/يوتيوب.');
      return;
    }

    try {
      setIsProcessingMedia(true);
      const reader = new FileReader();
      reader.onload = () => {
        setNewVideoUrl(reader.result as string);
        showToast('تم تحميل الفيديو من جهازك بنجاح!');
        setIsProcessingMedia(false);
      };
      reader.onerror = () => {
        showToast('فشل تحميل ملف الفيديو، يرجى التحقق من الصيغة');
        setIsProcessingMedia(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsProcessingMedia(false);
      showToast('حدث خطأ أثناء قراءة ملف الفيديو');
    }
  };

  const handleAddNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const detectedType: 'image' | 'video' = newMediaType === 'video' || Boolean(newVideoUrl.trim()) ? 'video' : 'image';

    addNews({
      title: newTitle.trim(),
      excerpt: newExcerpt.trim() || newContent.trim().substring(0, 130) + '...',
      content: newContent.trim(),
      category: newCategory,
      mediaType: detectedType,
      coverImage: newCover.trim() || undefined,
      videoUrl: newVideoUrl.trim() || undefined,
      source: newSource.trim() || 'المكتب الإعلامي للكاتب',
      readTime: '3 دقائق',
    });

    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setNewCover('');
    setNewVideoUrl('');
    setShowAddForm(false);
    showToast('تم نشر المادة في قسم "صورة في خبر" بنجاح!');
  };

  return (
    <div className="space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <span>توثيق أدبي وإعلامي بالصوت والصورة والكلمة</span>
            <span aria-hidden="true">·</span>
            <span>{news.length} مواد موثقة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
            صورة في خبر
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl">
            نافذة توثيقية ترصد بالصورة المعبرة، المقطع المرئي، والكلمة الرصينة مسيرة الكاتب أ. نبيل بركات ونشاطاته الأدبية ولقاءاته الثقافية وكواليس إصداراته.
          </p>
        </div>

        {/* Supervisor add button */}
        {isAuthorMode && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-xl transition shadow-sm whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>{showAddForm ? 'إلغاء' : 'إضافة مادة جديدة (صورة أو فيديو)'}</span>
          </button>
        )}
      </div>

      {/* Add News / Media Form Drawer */}
      {isAuthorMode && showAddForm && (
        <form
          onSubmit={handleAddNewsSubmit}
          className="p-6 rounded-2xl bg-white border-2 border-[#0b385e]/30 space-y-5 shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#0b385e] flex items-center gap-2 font-literary">
              <Newspaper className="w-5 h-5 text-[#c4924c]" />
              <span>إضافة مادة جديدة إلى «صورة في خبر»</span>
            </h3>
            <span className="text-xs text-[#64748b]">تظهر مباشرة لزوار الموقع</span>
          </div>

          {/* Media Type Selector */}
          <div className="bg-[#f0f5fa] p-3.5 rounded-xl flex flex-wrap items-center gap-3 border border-[#d6e2ed]">
            <span className="text-xs font-bold text-[#0b385e]">نوع المادة الإعلامية:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewMediaType('image')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  newMediaType === 'image'
                    ? 'bg-[#0b385e] text-white shadow-sm'
                    : 'bg-white text-[#475569] border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#dfa85b]" />
                <span>صورة مع خبر</span>
              </button>
              <button
                type="button"
                onClick={() => setNewMediaType('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  newMediaType === 'video'
                    ? 'bg-[#0b385e] text-white shadow-sm'
                    : 'bg-white text-[#475569] border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Video className="w-4 h-4 text-[#dfa85b]" />
                <span>فيديو مع خبر (رفع من الجهاز أو رابط)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-[#475569] mb-1 font-semibold">عنوان الخبر أو التوثيق</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: لقطة من الصالون الثقافي أثناء مناقشة رواية جديدة"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              >
                <option value="أخبار ونشاطات">أخبار ونشاطات</option>
                <option value="لقاءات وفعاليات">لقاءات وفعاليات</option>
                <option value="أخبار الإصدارات">أخبار الإصدارات</option>
                <option value="صومعة الكتابة">صومعة الكتابة</option>
                <option value="تغطيات صحفية">تغطيات صحفية</option>
                <option value="حفلات توقيع">حفلات توقيع</option>
              </select>
            </div>
          </div>

          {/* Media Upload Area */}
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1] space-y-3">
            {newMediaType === 'image' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b385e] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#c4924c]" />
                    <span>صورة الخبر (رفع مباشر من الجهاز أو رابط)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">يتم ضغط الصورة تلقائياً للحفاظ على السرعة</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold transition shadow-sm">
                    <Upload className="w-4 h-4 text-[#dfa85b]" />
                    <span>اختر صورة من جهازك (كمبيوتر / هاتف)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  <span className="text-xs text-slate-400 font-bold">أو</span>

                  <input
                    type="text"
                    value={newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder="ضع رابط الصورة هنا (URL)..."
                    className="flex-1 min-w-[220px] px-3 py-2 text-xs rounded-xl bg-white border border-[#cbd5e1] text-gray-900"
                  />
                </div>

                {newCover && (
                  <div className="relative inline-block mt-2 rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                    <img src={newCover} alt="معاينة" className="h-32 w-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewCover('')}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-xs hover:bg-rose-700 shadow"
                      title="إزالة الصورة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b385e] flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#c4924c]" />
                    <span>فيديو الخبر (رفع مباشر من الجهاز أو رابط تيكتوك / يوتيوب / MP4)</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold">يدعم ملفات MP4 و WebM وتيكتوك ويوتيوب</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] rounded-xl text-xs font-black transition shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>رفع ملف فيديو من الجهاز (MP4/WebM)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>

                  <span className="text-xs text-slate-400 font-bold">أو</span>

                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="رابط فيديو (تيكتوك، يوتيوب، أو رابط MP4 مباشر)..."
                    className="flex-1 min-w-[220px] px-3 py-2 text-xs rounded-xl bg-white border border-[#cbd5e1] text-gray-900"
                  />
                </div>

                {newVideoUrl && (
                  <div className="relative mt-2 max-w-sm rounded-xl overflow-hidden border border-slate-300 shadow bg-black aspect-video flex items-center justify-center">
                    {newVideoUrl.startsWith('data:video') || newVideoUrl.startsWith('blob:') || newVideoUrl.endsWith('.mp4') ? (
                      <video src={newVideoUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <div className="p-4 text-center text-white space-y-1">
                        <Play className="w-8 h-8 text-[#dfa85b] mx-auto" />
                        <span className="text-xs font-bold text-slate-200">تم التعرف على رابط الفيديو</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{newVideoUrl}</div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewVideoUrl('')}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-xs hover:bg-rose-700 shadow z-10"
                      title="إزالة الفيديو"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">المصدر أو الجهة</label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="المكتب الإعلامي / جريدة الفكر / توثيق خاص"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">المقدمة / الإيجاز الميداني</label>
              <input
                type="text"
                value={newExcerpt}
                onChange={(e) => setNewExcerpt(e.target.value)}
                placeholder="سطر أو سطرين يلخصان فكرة الصورة أو الفيديو..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#475569] mb-1 font-semibold">نص الخبر وتفاصيل الصورة / المقطع</label>
            <textarea
              required
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="اكتب هنا التفاصيل الكاملة، قصة الصورة، كواليس المقطع، والرسالة الأدبية المرافقة..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-gray-600 hover:text-black cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessingMedia}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isProcessingMedia ? 'جاري المعالجة...' : 'نشر في «صورة في خبر»'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs (All / Photos / Videos) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#d6e0ea] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setMediaFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              mediaFilter === 'all'
                ? 'bg-[#0b385e] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            الكل ({news.length})
          </button>
          <button
            onClick={() => setMediaFilter('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              mediaFilter === 'image'
                ? 'bg-[#0b385e] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>صورة في خبر</span>
          </button>
          <button
            onClick={() => setMediaFilter('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              mediaFilter === 'video'
                ? 'bg-[#0b385e] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>فيديو في خبر</span>
          </button>
        </div>

        {/* Category selector */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold hidden sm:inline">التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#f8fafc] border border-slate-300 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 outline-none font-bold"
            >
              <option value="all">جميع التصنيفات</option>
              {categories.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of "صورة في خبر" Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((item) => {
          const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
          const videoParsed = item.videoUrl ? parseVideoUrl(item.videoUrl) : null;

          return (
            <article
              key={item.id}
              className="gold-gilded-card group rounded-2xl bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Media Container */}
              <div className="relative aspect-[16/10] w-full bg-[#0a233a] overflow-hidden border-b border-[#e2e8f0]">
                {isVideo && item.videoUrl ? (
                  item.videoUrl.startsWith('data:video') || item.videoUrl.startsWith('blob:') || item.videoUrl.endsWith('.mp4') ? (
                    <video
                      src={item.videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : videoParsed?.embedUrl ? (
                    <iframe
                      src={videoParsed.embedUrl}
                      title={item.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      onClick={() => setReadingArticle(item)}
                      className="w-full h-full bg-gradient-to-br from-[#07243c] to-[#041524] p-4 flex flex-col items-center justify-center text-center text-white cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#dfa85b]/20 border border-[#dfa85b]/50 flex items-center justify-center text-[#dfa85b] mb-2 animate-pulse">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">فيديو في خبر</span>
                      <span className="text-[10px] text-[#dfa85b] mt-1">اضغط للمشاهدة والاطلاع</span>
                    </div>
                  )
                ) : item.coverImage ? (
                  <div
                    onClick={() => setReadingArticle(item)}
                    className="w-full h-full cursor-pointer relative group/img overflow-hidden"
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/img:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition flex items-end p-3 text-white text-xs font-bold gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                      <span>قراءة الخبر وتكبير الصورة</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setReadingArticle(item)}
                    className="w-full h-full bg-gradient-to-br from-[#0b385e] to-[#062035] flex items-center justify-center text-white/50 cursor-pointer p-6 text-center"
                  >
                    <Newspaper className="w-12 h-12 text-[#dfa85b]/40 mb-1" />
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#07243c]/85 text-[#dfa85b] backdrop-blur-sm border border-[#dfa85b]/30 shadow-xs flex items-center gap-1">
                    {isVideo ? (
                      <>
                        <Video className="w-3 h-3" />
                        <span>فيديو في خبر</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>صورة في خبر</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Pin Badge */}
                {item.isPinned && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-[#07243c] text-[10px] font-black shadow-sm z-10">
                    <Pin className="w-3 h-3 fill-current rotate-45" />
                    <span>مثبت</span>
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#64748b]">
                    <span className="text-[#0b385e] font-bold bg-[#edf4fb] px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
                      <Clock className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setReadingArticle(item)}
                    className="text-base font-bold text-[#0b385e] hover:underline cursor-pointer transition line-clamp-2 font-literary leading-snug"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                    {item.excerpt || item.content}
                  </p>

                  {/* Interaction Bar (المشاهدات، لايك قلب أحمر، التعليقات، والمشاركة) */}
                  <div className="pt-1">
                    <ContentInteractionBar
                      itemId={item.id}
                      itemTitle={`خبر: ${item.title}`}
                      itemType="news"
                      commentsCount={23}
                      itemDescription={item.excerpt || item.content}
                      compact={true}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#edf2f7] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                    <span className="font-semibold text-[#0b385e]">{item.source || 'المكتب الإعلامي'}</span>
                    <button
                      onClick={() => setReadingArticle(item)}
                      className="text-[#0b385e] hover:text-[#082a47] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#dfa85b]" />
                      <span>قراءة التفاصيل ←</span>
                    </button>
                  </div>

                  {/* Share & Comment & Supervisor Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          openShareModal({
                            title: `صورة في خبر: ${item.title}`,
                            description: item.excerpt,
                            image: item.coverImage,
                            type: 'news',
                          })
                        }
                        className="p-1.5 rounded-lg border border-[#dce8ef] text-[#07375a] hover:bg-slate-50 transition"
                        title="مشاركة"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#d8a83e]" />
                      </button>

                      <button
                        onClick={() =>
                          openCommentModal({
                            targetType: 'news',
                            targetId: item.id,
                            targetTitle: item.title,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#07375a] hover:bg-[#062b47] text-white text-[11px] font-bold flex items-center gap-1 transition"
                        title="إضافة تعليق"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>تعليق</span>
                      </button>
                    </div>

                    {isAuthorMode && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingNews(item)}
                          className="p-1.5 text-[#0b385e] hover:bg-[#f0f4f8] rounded-lg transition cursor-pointer"
                          title="تعديل المادة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteNewsId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300 animate-in fade-in">
                            <span className="text-[10px] font-bold text-rose-700">حذف؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteNews(item.id);
                                setConfirmDeleteNewsId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition shadow-xs cursor-pointer"
                              title="تأكيد الحذف النهائي"
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteNewsId(null)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] transition cursor-pointer"
                              title="إلغاء الحذف"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteNewsId(item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف هذه المادة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Supervisor Pin & Order */}
                  {isAuthorMode && (
                    <ItemOrderPinControls
                      isPinned={item.isPinned}
                      onTogglePin={() => togglePinNews(item.id)}
                      currentIndex={news.findIndex((n) => n.id === item.id)}
                      totalCount={news.length}
                      onMoveUp={() => moveNewsOrder(item.id, 'up')}
                      onMoveDown={() => moveNewsOrder(item.id, 'down')}
                      onSetPosition={(newPos) => setNewsPosition(item.id, newPos)}
                    />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Full Article Reading & Media Lightbox Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#07243c] text-white border-b border-[#051829]">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#dfa85b]" />
                <span className="text-xs font-bold text-amber-200">صورة في خبر · توثيق كامل</span>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Top Media */}
              {readingArticle.videoUrl ? (
                <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-200 shadow-md">
                  {readingArticle.videoUrl.startsWith('data:video') || readingArticle.videoUrl.startsWith('blob:') || readingArticle.videoUrl.endsWith('.mp4') ? (
                    <video src={readingArticle.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                  ) : (
                    <iframe
                      src={parseVideoUrl(readingArticle.videoUrl).embedUrl || readingArticle.videoUrl}
                      title={readingArticle.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : readingArticle.coverImage ? (
                <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md max-h-[420px] flex items-center justify-center">
                  <img
                    src={readingArticle.coverImage}
                    alt={readingArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full max-h-[420px] object-cover"
                  />
                </div>
              ) : null}

              {/* Title & Metadata */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="bg-[#edf4fb] text-[#0b385e] font-bold px-2.5 py-1 rounded-md">
                    {readingArticle.category}
                  </span>
                  <span>{readingArticle.date} · المصدر: {readingArticle.source || 'المكتب الإعلامي'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#07243c] font-literary leading-snug">
                  {readingArticle.title}
                </h1>
              </div>

              {/* Article Content */}
              <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line space-y-4">
                {readingArticle.content}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    openCommentModal({
                      targetType: 'news',
                      targetId: readingArticle.id,
                      targetTitle: readingArticle.title,
                    });
                  }}
                  className="px-4 py-2 bg-[#0b385e] hover:bg-[#082c4a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>أضف تعليقاً على هذا الخبر</span>
                </button>

                <button
                  onClick={() => setReadingArticle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <img
            src={enlargedImage}
            alt="تكبير"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};
