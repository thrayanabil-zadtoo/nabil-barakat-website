import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PhotoItem } from '../types';
import { Image as ImageIcon, Plus, X, MapPin, Trash2, Maximize2, Edit2, Share2, MessageSquare, Video, Play, Upload, Pin, Copy, Check, Film } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';
import { ItemOrderPinControls } from './ItemOrderPinControls';
import { ContentInteractionBar } from './ContentInteractionBar';
import { compressImage } from '../utils/imageCompressor';

export const PhotosSection: React.FC = () => {
  const {
    photos,
    addPhoto,
    isAuthorMode,
    deletePhoto,
    setEditingPhoto,
    openShareModal,
    openCommentModal,
    showToast,
    togglePinPhoto,
    movePhotoOrder,
    setPhotoPosition,
    processAndUploadImage,
    copyToClipboardWithFeedback,
  } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<PhotoItem | null>(null);

  // New item form state (supporting photo OR video)
  const [showAddForm, setShowAddForm] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newCategory, setNewCategory] = useState('مستودع الوسائط الحرة (لحين الحاجة)');
  const [newLocation, setNewLocation] = useState('مستودع الوسائط العام');

  const defaultCategories = ['مستودع الوسائط الحرة (لحين الحاجة)', 'حفلات توقيع', 'ندوات ومؤتمرات', 'صومعة الكاتب'];
  const categories = ['all', ...Array.from(new Set([...defaultCategories, ...photos.map((p) => p.category)]))];

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter((p) => p.category === selectedCategory);

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (mediaType === 'image' && !newImageUrl.trim()) {
      showToast('يرجى اختيار صورة أو إدخال رابطها');
      return;
    }
    if (mediaType === 'video' && !newVideoUrl.trim() && !newImageUrl.trim()) {
      showToast('يرجى إدخال رابط مقطع الفيديو أو رفعه');
      return;
    }

    addPhoto({
      title: newTitle.trim(),
      caption: newCaption.trim(),
      imageUrl: newImageUrl.trim() || '/src/assets/images/cultural_salon_event_1790501249700.jpg',
      category: newCategory,
      location: newLocation.trim() || 'صومعة الكاتب',
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
      mediaType,
      videoUrl: mediaType === 'video' ? newVideoUrl.trim() : undefined,
    });

    showToast(mediaType === 'video' ? 'تمت إضافة مقطع الفيديو إلى المعرض بنجاح' : 'تمت إضافة الصورة إلى الألبوم بنجاح');
    setNewTitle('');
    setNewCaption('');
    setNewImageUrl('');
    setNewVideoUrl('');
    setMediaType('image');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <span>الذاكرة البصرية والمشاهد التوثيقية</span>
            <span aria-hidden="true">·</span>
            <span>{photos.length} لقطة محفوظة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
            ألبوم صور ومناسبات الكاتب أ. نبيل بركات
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl">
            توثيق بصري لمحطات من مسيرة الكاتب: حفلات توقيع الكتب، الندوات الفكرية، والمشاهد الأثيرة في صومعة الكتابة.
          </p>
        </div>

        {/* Supervisor add photo button */}
        {isAuthorMode && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-lg transition shadow-sm whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>{showAddForm ? 'إلغاء' : 'إضافة صورة جديدة للألبوم'}</span>
          </button>
        )}
      </div>

      {/* Add Photo or Video Form Drawer */}
      {isAuthorMode && showAddForm && (
        <form
          onSubmit={handleAddPhotoSubmit}
          className="p-6 rounded-2xl bg-white border border-[#0b385e] space-y-4 shadow-md animate-in fade-in duration-200"
        >
          <div className="flex flex-wrap items-center justify-between border-b border-[#edf2f7] pb-3 gap-2">
            <h3 className="text-sm font-bold text-[#0b385e] flex items-center gap-2">
              {mediaType === 'video' ? <Video className="w-4 h-4 text-[#dfa85b]" /> : <ImageIcon className="w-4 h-4 text-[#c4924c]" />}
              <span>{mediaType === 'video' ? 'إضافة مقطع فيديو جديد لمعرض الصور' : 'إضافة صورة توثيقية جديدة للألبوم'}</span>
            </h3>

            {/* MediaType Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f1f5f9] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  mediaType === 'image' ? 'bg-[#0b385e] text-white shadow-xs' : 'text-[#475569] hover:text-[#0b385e]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صورة</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  mediaType === 'video' ? 'bg-[#0b385e] text-white shadow-xs' : 'text-[#475569] hover:text-[#0b385e]'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-[#dfa85b]" />
                <span>مقطع فيديو</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">
                {mediaType === 'video' ? 'عنوان مقطع الفيديو' : 'عنوان الصورة / المناسبة'}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={mediaType === 'video' ? 'مثال: كلمة الكاتب في افتتاح المعرض الدولي' : 'مثال: ندوة السرد العربي في مجمع الفنون'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            {mediaType === 'video' ? (
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">رابط الفيديو (YouTube أو TikTok أو رابط مباشر)</label>
                <input
                  type="text"
                  required
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/... أو https://www.tiktok.com/..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-[#475569] mb-1 font-semibold">رابط الصورة أو رفعها من الجهاز</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="/src/assets/images/... أو رابط خارجي"
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                  />
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع سحابي</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploaded = await processAndUploadImage(file, {
                            maxWidth: 1280,
                            maxHeight: 1280,
                            quality: 0.82,
                            category: newCategory,
                            contextTitle: newTitle || 'صورة توثيقية في المعرض',
                          });
                          setNewImageUrl(uploaded);
                        } catch {
                          // Handled by processAndUploadImage
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">المكان / القاعة</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="قاعة المحاضرات الكبرى"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              >
                <option value="حفلات توقيع">حفلات توقيع</option>
                <option value="ندوات وملتقيات">ندوات وملتقيات</option>
                <option value="في صومعة الكاتب">في صومعة الكاتب</option>
                <option value="المؤلفات والكتب">المؤلفات والكتب</option>
                <option value="مقاطع مرئية">مقاطع مرئية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#475569] mb-1 font-semibold">شرح أو تعليق مصاحب</label>
            <textarea
              rows={2}
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="اكتب شرحاً توثيقياً مختصراً..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-gray-600 hover:text-black cursor-pointer font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-lg transition cursor-pointer"
            >
              {mediaType === 'video' ? 'حفظ مقطع الفيديو في المعرض' : 'حفظ الصورة في الألبوم'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === c
                ? 'bg-[#0b385e] text-white font-semibold shadow-sm'
                : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#d6e0ea]'
            }`}
          >
            {c === 'all' ? 'جميع الصور' : c}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="gold-gilded-card group rounded-2xl bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
          >
            {/* Image or Video Container with Lightbox Trigger */}
            <div
              className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer"
              onClick={() => setActiveLightboxPhoto(photo)}
            >
              {photo.imageUrl ? (
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-1" />
                  <span className="text-xs">صورة المعرض</span>
                </div>
              )}

              {/* Photo Top Corner Quick Delete (Supervisor Mode) */}
              {isAuthorMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePhoto(photo.id);
                  }}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition transform hover:scale-110 cursor-pointer"
                  title="حذف الصورة من المعرض"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Video Badge if media is video */}
              {(photo.mediaType === 'video' || photo.videoUrl) && (
                <div className="absolute top-3 left-3 bg-[#07243c]/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs border border-white/20">
                  <Play className="w-3 h-3 text-[#dfa85b] fill-[#dfa85b]" />
                  <span>مقطع فيديو</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-4">
                {(photo.mediaType === 'video' || photo.videoUrl) ? (
                  <div className="w-12 h-12 rounded-full bg-[#dfa85b] text-[#07243c] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                    <Play className="w-6 h-6 fill-current mr-0.5" />
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white bg-[#0b385e]/80 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>عرض بالحجم الكامل</span>
                  </span>
                )}
              </div>
            </div>

            {/* Photo Info */}
            <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0b385e] font-bold">{photo.category}</span>
                    {photo.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[#07243c] text-[10px] font-black shadow-2xs">
                        <Pin className="w-3 h-3 fill-current rotate-45" />
                        <span>مثبت في المقدمة</span>
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums">{photo.date}</span>
                </div>
                <h3
                  onClick={() => setActiveLightboxPhoto(photo)}
                  className="text-sm font-bold text-[#0b385e] hover:underline cursor-pointer transition line-clamp-1"
                >
                  {photo.title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
                  {photo.caption}
                </p>

                {/* Interaction Bar (المشاهدات، لايك قلب أحمر، التعليقات، والمشاركة) */}
                <div className="pt-1">
                  <ContentInteractionBar
                    itemId={photo.id}
                    itemTitle={`صورة: ${photo.title}`}
                    itemType="photo"
                    commentsCount={22}
                    itemDescription={photo.caption}
                    compact={true}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#edf2f7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  {/* Share Button */}
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `${photo.mediaType === 'video' ? 'فيديو' : 'صورة'}: ${photo.title}`,
                        description: photo.caption,
                        image: photo.imageUrl,
                        type: photo.mediaType === 'video' ? 'video' : 'photo',
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-[#475569] hover:text-[#0b385e] border border-[#cbd5e1] hover:border-[#0b385e] px-2 py-1 rounded-lg transition"
                    title="مشاركة"
                  >
                    <Share2 className="w-3 h-3 text-[#c4924c]" />
                    <span>مشاركة</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() =>
                      openCommentModal({
                        targetType: 'photo',
                        targetId: photo.id,
                        targetTitle: photo.title,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-[#0b385e] bg-[#f0f4f8] hover:bg-[#e2eaf2] px-2 py-1 rounded-lg transition font-medium"
                    title="تعليق"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>تعليق</span>
                  </button>

                  {/* Copy Link Button for using media later */}
                  <button
                    type="button"
                    onClick={() => {
                      const urlToCopy = photo.videoUrl || photo.imageUrl;
                      navigator.clipboard.writeText(urlToCopy);
                      setCopiedId(photo.id);
                      showToast('تم نسخ رابط الوسائط إلى الحافظة للاستخدام في أي خبر أو كتاب لاحقاً');
                      setTimeout(() => setCopiedId(null), 2500);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#0b385e] border border-slate-200 hover:border-[#0b385e] px-2 py-1 rounded-lg transition cursor-pointer"
                    title="نسخ رابط الوسائط لاستخدامه لاحقاً"
                  >
                    {copiedId === photo.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#c4924c]" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1 truncate max-w-[140px] text-[11px]">
                  <MapPin className="w-3 h-3 text-[#c4924c] shrink-0" />
                  <span className="truncate">{photo.location}</span>
                </div>

                {isAuthorMode && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingPhoto(photo)}
                      className="p-1 text-[#0b385e] hover:bg-slate-100 rounded"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Supervisor Pin & Order Controls */}
              {isAuthorMode && (
                <ItemOrderPinControls
                  isPinned={photo.isPinned}
                  onTogglePin={() => togglePinPhoto(photo.id)}
                  currentIndex={photos.findIndex((p) => p.id === photo.id)}
                  totalCount={photos.length}
                  onMoveUp={() => movePhotoOrder(photo.id, 'up')}
                  onMoveDown={() => movePhotoOrder(photo.id, 'down')}
                  onSetPosition={(newPos) => setPhotoPosition(photo.id, newPos)}
                />
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] bg-[#0b385e] text-white">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {activeLightboxPhoto.mediaType === 'video' ? (
                    <span className="bg-[#dfa85b] text-[#07243c] text-[10px] font-black px-2 py-0.5 rounded">فيديو</span>
                  ) : null}
                  <h3 className="text-base font-bold">
                    {activeLightboxPhoto.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#cbe0f0]">
                  <span>{activeLightboxPhoto.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLightboxPhoto.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    openShareModal({
                      title: `${activeLightboxPhoto.mediaType === 'video' ? 'فيديو' : 'صورة'}: ${activeLightboxPhoto.title}`,
                      description: activeLightboxPhoto.caption,
                      image: activeLightboxPhoto.imageUrl,
                      type: activeLightboxPhoto.mediaType === 'video' ? 'video' : 'photo',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>مشاركة</span>
                </button>
                <button
                  onClick={() =>
                    openCommentModal({
                      targetType: 'photo',
                      targetId: activeLightboxPhoto.id,
                      targetTitle: activeLightboxPhoto.title,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>أضف تعليقاً</span>
                </button>

                {isAuthorMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const title = activeLightboxPhoto.title;
                      deletePhoto(activeLightboxPhoto.id);
                      setActiveLightboxPhoto(null);
                      showToast(`تم حذف "${title}" من المعرض بنجاح`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="حذف هذه الصورة من المعرض نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveLightboxPhoto(null)}
                  className="p-2 text-white hover:text-[#dfa85b] rounded-lg cursor-pointer"
                  title="إغلاق العرض"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* High-Res View or Video Player Container */}
            <div className="relative max-h-[75vh] flex items-center justify-center bg-black overflow-hidden p-2 min-h-[300px]">
              {activeLightboxPhoto.mediaType === 'video' || activeLightboxPhoto.videoUrl ? (
                (() => {
                  const vUrl = activeLightboxPhoto.videoUrl || '';
                  const parsed = parseVideoUrl(vUrl);
                  if (parsed.platform === 'youtube' && parsed.embedUrl) {
                    return (
                      <div className="w-full aspect-video max-h-[70vh]">
                        <iframe
                          src={parsed.embedUrl}
                          title={activeLightboxPhoto.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-lg"
                        />
                      </div>
                    );
                  }
                  const resolvedVideoSrc = (vUrl || activeLightboxPhoto.imageUrl || '').trim();
                  if (!resolvedVideoSrc) {
                    return (
                      <div className="text-center text-slate-400 py-12">
                        <Film className="w-10 h-10 mx-auto mb-2 text-[#dfa85b]" />
                        <span className="text-xs">لا يوجد ملف فيديو متاح</span>
                      </div>
                    );
                  }
                  return (
                    <video
                      src={resolvedVideoSrc}
                      controls
                      autoPlay
                      className="max-h-[68vh] w-auto max-w-full rounded-lg shadow-2xl"
                    />
                  );
                })()
              ) : activeLightboxPhoto.imageUrl ? (
                <img
                  src={activeLightboxPhoto.imageUrl}
                  alt={activeLightboxPhoto.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[68vh] w-auto object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#dfa85b]" />
                  <span className="text-xs">لا توجد صورة متاحة</span>
                </div>
              )}
            </div>

            {/* Caption & Details Footer */}
            <div className="p-4 bg-white border-t border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-[#475569] leading-relaxed max-w-2xl">
                {activeLightboxPhoto.caption}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const urlToCopy = activeLightboxPhoto.videoUrl || activeLightboxPhoto.imageUrl;
                    copyToClipboardWithFeedback(urlToCopy, 'تم نسخ رابط الصورة إلى الحافظة بنجاح');
                  }}
                  className="px-3 py-1.5 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="نسخ رابط الوسائط للمشرف"
                >
                  <Copy className="w-3.5 h-3.5 text-[#dfa85b]" />
                  <span>نسخ رابط الصورة للمشرف</span>
                </button>
                <div className="font-mono text-[#64748b] tabular-nums">
                  {activeLightboxPhoto.date}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
