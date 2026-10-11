import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import {
  Video,
  Play,
  Plus,
  Trash2,
  Heart,
  MessageSquare,
  Edit2,
  Eye,
  Share2,
  Sparkles,
  Pin,
  Upload,
  Film,
  Maximize2,
  X,
} from 'lucide-react';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';

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
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVideoModal, setActiveVideoModal] = useState<VideoItem | null>(null);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);

  // New Video Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [uploadedVideoData, setUploadedVideoData] = useState<string>('');
  const [directVideoUrl, setDirectVideoUrl] = useState<string>('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('خواطر أدبية');
  const [newDuration, setNewDuration] = useState('01:28');
  const [newLikes, setNewLikes] = useState('1.2K');
  const [newComments, setNewComments] = useState('156');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const categories = ['all', ...Array.from(new Set(videos.map((v) => v.category)))];

  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter((v) => v.category === selectedCategory);

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      showToast('تنبيه: حجم ملف الفيديو كبير. للحفظ السحابي الدائم لجميع الزوار، يُفضل إدخال رابط الفيديو (YouTube أو Vimeo أو رابط MP4 مباشر).');
    }

    try {
      setIsProcessingVideo(true);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedVideoData(reader.result as string);
        showToast('تم تحميل وتجهيز ملف الفيديو بنجاح! يمكنك الآن مشاهدة المعاينة وحفظه.');
        setIsProcessingVideo(false);
      };
      reader.onerror = () => {
        showToast('تعذر قراءة ملف الفيديو');
        setIsProcessingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsProcessingVideo(false);
      showToast('حدث خطأ أثناء معالجة ملف الفيديو');
    }
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const finalVideoSource = uploadedVideoData || directVideoUrl.trim();

    if (!finalVideoSource) {
      showToast('يرجى رفع ملف فيديو من جهازك أو وضع رابط ملف فيديو مباشر');
      return;
    }

    addVideo({
      title: newTitle.trim(),
      url: finalVideoSource,
      videoFileUrl: uploadedVideoData || undefined,
      description: newDesc.trim() || 'تسجيل مرئي أدبي وفكري للأستاذ نبيل بركات',
      category: newCategory,
      platform: 'direct',
      duration: newDuration || '01:28',
      likesCount: newLikes || '1.2K',
      commentsCount: newComments || '156',
    });

    setNewTitle('');
    setUploadedVideoData('');
    setDirectVideoUrl('');
    setNewDesc('');
    setShowAddForm(false);
    showToast('تمت إضافة ونشر الفيديو بنجاح!');
  };

  return (
    <div className="space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <span>المكتبة المرئية للأستاذ نبيل بركات</span>
            <span aria-hidden="true">·</span>
            <span>{videos.length} مقاطع مسجلة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
            فيديوهات ومرئيات الكاتب أ. نبيل بركات
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl">
            مجموعة مختارة من الندوات، القراءات، والخواطر المصورة المسجلة بدقة عالية مع مشغل فيديو متطور مدمج داخل الموقع.
          </p>
        </div>

        {/* Supervisor add video button */}
        {isAuthorMode && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-xl transition shadow-sm whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>{showAddForm ? 'إلغاء' : 'رفع فيديو جديد'}</span>
          </button>
        )}
      </div>

      {/* Add Video Form Drawer (Direct Upload Only) */}
      {isAuthorMode && showAddForm && (
        <form
          onSubmit={handleAddVideoSubmit}
          className="p-6 rounded-2xl bg-white border-2 border-[#0b385e]/30 space-y-5 shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#0b385e] flex items-center gap-2 font-literary">
              <Upload className="w-5 h-5 text-[#c4924c]" />
              <span>رفع مقطع فيديو جديد من جهازك</span>
            </h3>
            <span className="text-xs text-[#64748b]">يتم حفظه وتشغيله مباشرة بجودة فائقة</span>
          </div>

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="block text-xs text-[#475569] font-bold">ملف الفيديو (MP4 / WebM / QuickTime):</label>
            
            <div className="border-2 border-dashed border-[#0b385e]/40 rounded-2xl p-6 text-center bg-[#f8fafc] hover:bg-[#f0f6fa] transition flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0b385e]/10 text-[#0b385e] flex items-center justify-center">
                <Film className="w-7 h-7 text-[#dfa85b]" />
              </div>

              <div>
                <p className="text-sm font-bold text-[#0b385e]">
                  {uploadedVideoData ? '✓ تم رفع وتجهيز الفيديو بنجاح' : 'انقر لاختيار مقطع فيديو من الهاتف أو الكمبيوتر'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">يدعم ملفات MP4 و WebM و MOV حتى 80 ميجابايت</p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black text-xs rounded-xl transition shadow-md">
                <Upload className="w-4 h-4" />
                <span>{uploadedVideoData ? 'تغيير ملف الفيديو' : 'اختيار ملف الفيديو'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  className="hidden"
                  onChange={handleVideoFileUpload}
                />
              </label>

              {isProcessingVideo && (
                <p className="text-xs text-[#0b385e] font-bold animate-pulse">
                  جاري قراءة ومعالجة ملف الفيديو... يُرجى الانتظار
                </p>
              )}
            </div>

            {/* Video Preview if Uploaded */}
            {uploadedVideoData && (
              <div className="mt-3 p-3 bg-black rounded-xl overflow-hidden max-w-sm mx-auto shadow-md">
                <span className="text-[11px] text-white/80 block mb-1 text-center font-bold">معاينة الفيديو المرفوع:</span>
                <video
                  src={uploadedVideoData}
                  controls
                  playsInline
                  className="w-full aspect-video rounded-lg object-contain bg-black"
                />
              </div>
            )}

            {/* Optional Direct Video URL */}
            <div className="pt-2">
              <label className="block text-xs text-[#475569] mb-1 font-semibold">
                أو أدخل رابط ملف فيديو مباشر (Direct MP4 URL):
              </label>
              <input
                type="url"
                value={directVideoUrl}
                onChange={(e) => setDirectVideoUrl(e.target.value)}
                placeholder="https://.../video.mp4"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">عنوان الفيديو أو الخاطرة</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: رسالة أمل وسعي دائم"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">التصنيف الأدبي</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              >
                <option value="خواطر أدبية">خواطر أدبية</option>
                <option value="قراءات في المؤلفات">قراءات في المؤلفات</option>
                <option value="نصائح في الكتابة">نصائح في الكتابة</option>
                <option value="أمسيات وندوات">أمسيات وندوات</option>
                <option value="حوارات فكرية">حوارات فكرية</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">المدة التقريبية</label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="01:28"
                  className="w-full px-2 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">الإعجابات</label>
                <input
                  type="text"
                  value={newLikes}
                  onChange={(e) => setNewLikes(e.target.value)}
                  placeholder="1.2K"
                  className="w-full px-2 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">التعليقات</label>
                <input
                  type="text"
                  value={newComments}
                  onChange={(e) => setNewComments(e.target.value)}
                  placeholder="156"
                  className="w-full px-2 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 text-center"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#475569] mb-1 font-semibold">وصف مقتضب للفيديو</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="اكتب نبذة عن موضوع هذا المقطع الأدبي أو الفكري..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
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
              disabled={isProcessingVideo}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isProcessingVideo ? 'جاري التحميل...' : 'حفظ ونشر الفيديو'}
            </button>
          </div>
        </form>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#0b385e] text-white shadow-xs'
                : 'bg-white text-[#475569] border border-[#dce8ef] hover:bg-[#f1f5f9]'
            }`}
          >
            {cat === 'all' ? 'جميع المقاطع' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => {
          const videoSource = video.videoFileUrl || video.url;

          return (
            <div
              key={video.id}
              className="gold-gilded-card group rounded-2xl bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200"
            >
              {/* Native High-Performance HTML5 Video Player */}
              <div className="relative aspect-[16/10] w-full bg-black overflow-hidden flex flex-col items-center justify-center border-b border-slate-200">
                <video
                  src={videoSource}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                />

                {/* Theater Mode Button Overlay */}
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(video)}
                  className="absolute top-2.5 left-2.5 bg-black/75 hover:bg-[#0b385e] text-white px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md transition flex items-center gap-1.5 shadow-md border border-white/20 cursor-pointer"
                  title="تكبير الفيديو في شاشة كاملة"
                >
                  <Maximize2 className="w-3 h-3 text-[#dfa85b]" />
                  <span>تكبير المشغل</span>
                </button>

                <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums">
                  {video.duration || '01:28'}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#64748b]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#0b385e] font-bold bg-[#edf4fb] px-2 py-0.5 rounded-md">{video.category}</span>
                      {video.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[#07243c] text-[10px] font-black shadow-2xs">
                          <Pin className="w-3 h-3 fill-current rotate-45" />
                          <span>مثبت</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums text-[11px]">{video.date}</span>
                  </div>

                  <h3
                    onClick={() => setActiveVideoModal(video)}
                    className="text-base font-bold text-[#0b385e] hover:underline cursor-pointer transition line-clamp-2 font-literary leading-snug"
                  >
                    {video.title}
                  </h3>

                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                    {video.description}
                  </p>

                  {/* Interaction Bar (المشاهدات، لايك قلب أحمر، التعليقات، والمشاركة) */}
                  <div className="pt-2">
                    <ContentInteractionBar
                      itemId={video.id}
                      itemTitle={`فيديو: ${video.title}`}
                      itemType="video"
                      commentsCount={24}
                      itemUrl={video.url}
                      itemDescription={video.description}
                    />
                  </div>
                </div>

                {/* Footer Controls: Supervisor Actions */}
                <div className="pt-2 border-t border-[#edf2f7] flex items-center justify-between">
                  <div className="text-[11px] text-[#64748b]">
                    <span>تسجيل مرئي فكري وأدبي</span>
                  </div>

                  {/* Supervisor Edit & Delete */}
                  {isAuthorMode && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingVideo(video)}
                        className="p-1.5 text-[#0b385e] hover:bg-[#f0f4f8] rounded-lg transition cursor-pointer"
                        title="تعديل الفيديو"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteVideoId === video.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300 animate-in fade-in">
                          <span className="text-[10px] font-bold text-rose-700">حذف؟</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteVideo(video.id);
                              setConfirmDeleteVideoId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition shadow-xs cursor-pointer"
                            title="تأكيد حذف الفيديو"
                          >
                            نعم
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteVideoId(null)}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] transition cursor-pointer"
                            title="إلغاء الحذف"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteVideoId(video.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="حذف الفيديو"
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

      {/* Fullscreen Theater Modal Video Player */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#071929] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0b385e] text-white">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="text-sm sm:text-base font-bold truncate max-w-md font-literary">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-white hover:text-[#dfa85b] p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player in Theater Mode */}
            <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoFileUrl || activeVideoModal.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details & Actions Footer */}
            <div className="p-5 bg-[#0a233a] border-t border-white/10 text-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#dfa85b] font-bold bg-[#dfa85b]/10 px-2.5 py-1 rounded-md border border-[#dfa85b]/30">
                  {activeVideoModal.category}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `فيديو: ${activeVideoModal.title}`,
                        url: activeVideoModal.url,
                        description: activeVideoModal.description,
                        type: 'video',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>مشاركة</span>
                  </button>

                  <button
                    onClick={() =>
                      openCommentModal({
                        targetType: 'video',
                        targetId: activeVideoModal.id,
                        targetTitle: activeVideoModal.title,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إضافة تعليق</span>
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
