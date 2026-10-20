import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Trash2, Edit2, Video, Image as ImageIcon, BookOpen, Newspaper, Globe, Upload, Copy, Film } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { parseVideoUrl } from '../utils/videoUtils';

export const InlineEditModal: React.FC = () => {
  const {
    editingVideo,
    setEditingVideo,
    updateVideo,
    editingPhoto,
    setEditingPhoto,
    updatePhoto,
    editingBook,
    setEditingBook,
    updateBook,
    editingNews,
    setEditingNews,
    updateNews,
    editingLink,
    setEditingLink,
    updateLink,
    books,
    processAndUploadImage,
    processAndUploadVideo,
    showToast,
    copyToClipboardWithFeedback,
  } = useApp();

  // Video local edit state
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vCategory, setVCategory] = useState('');
  const [vDuration, setVDuration] = useState('');
  const [vLikes, setVLikes] = useState('');
  const [vComments, setVComments] = useState('');
  const [vBookId, setVBookId] = useState('');
  const [vBookTitle, setVBookTitle] = useState('');
  const [vChapterNumber, setVChapterNumber] = useState<number | ''>('');
  const [vChapterTitle, setVChapterTitle] = useState('');

  // Photo local edit state
  const [pTitle, setPTitle] = useState('');
  const [pCaption, setPCaption] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pCategory, setPCategory] = useState('');

  // Book local edit state
  const [bTitle, setBTitle] = useState('');
  const [bSubtitle, setBSubtitle] = useState('');
  const [bCover, setBCover] = useState('');
  const [bGalleryImages, setBGalleryImages] = useState<string[]>([]);
  const [bPublisher, setBPublisher] = useState('');
  const [bYear, setBYear] = useState('');
  const [bPages, setBPages] = useState(300);
  const [bGenre, setBGenre] = useState('');
  const [bDesc, setBDesc] = useState('');

  // News local edit state
  const [nTitle, setNTitle] = useState('');
  const [nExcerpt, setNExcerpt] = useState('');
  const [nContent, setNContent] = useState('');
  const [nCover, setNCover] = useState('');
  const [nMediaType, setNMediaType] = useState<'image' | 'video'>('image');
  const [nVideoUrl, setNVideoUrl] = useState('');
  const [nCategory, setNCategory] = useState('');

  // Link local edit state
  const [lTitle, setLTitle] = useState('');
  const [lUrl, setLUrl] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lCategory, setLCategory] = useState('');

  // Populate when editing starts
  useEffect(() => {
    if (editingVideo) {
      setVTitle(editingVideo.title);
      setVUrl(editingVideo.url);
      setVDesc(editingVideo.description);
      setVCategory(editingVideo.category);
      setVDuration(editingVideo.duration || '02:30');
      setVLikes(editingVideo.likesCount || '1.2K');
      setVComments(editingVideo.commentsCount || '156');
      setVBookId(editingVideo.bookId || '');
      setVBookTitle(editingVideo.bookTitle || '');
      setVChapterNumber(editingVideo.chapterNumber ?? '');
      setVChapterTitle(editingVideo.chapterTitle || '');
    }
  }, [editingVideo]);

  useEffect(() => {
    if (editingPhoto) {
      setPTitle(editingPhoto.title);
      setPCaption(editingPhoto.caption);
      setPUrl(editingPhoto.imageUrl);
      setPLocation(editingPhoto.location);
      setPCategory(editingPhoto.category);
    }
  }, [editingPhoto]);

  useEffect(() => {
    if (editingBook) {
      setBTitle(editingBook.title);
      setBSubtitle(editingBook.subtitle);
      setBCover(editingBook.coverImage);
      setBGalleryImages(
        (editingBook.galleryImages || []).filter(
          (img) => !img.includes('book_reality_dream') && !img.includes('cultural_salon_event')
        )
      );
      setBPublisher(editingBook.publisher);
      setBYear(editingBook.publicationYear);
      setBPages(editingBook.pagesCount);
      setBGenre(editingBook.genre);
      setBDesc(editingBook.description);
    }
  }, [editingBook]);

  useEffect(() => {
    if (editingNews) {
      setNTitle(editingNews.title);
      setNExcerpt(editingNews.excerpt);
      setNContent(editingNews.content);
      setNCover(editingNews.coverImage || '');
      setNMediaType(editingNews.mediaType || (editingNews.videoUrl ? 'video' : 'image'));
      setNVideoUrl(editingNews.videoUrl || '');
      setNCategory(editingNews.category);
    }
  }, [editingNews]);

  useEffect(() => {
    if (editingLink) {
      setLTitle(editingLink.title);
      setLUrl(editingLink.url);
      setLDesc(editingLink.description);
      setLCategory(editingLink.category);
    }
  }, [editingLink]);

  const isOpen = Boolean(editingVideo || editingPhoto || editingBook || editingNews || editingLink);
  if (!isOpen) return null;

  const handleClose = () => {
    setEditingVideo(null);
    setEditingPhoto(null);
    setEditingBook(null);
    setEditingNews(null);
    setEditingLink(null);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    const cleanSource = vUrl.trim();
    const parsed = parseVideoUrl(cleanSource);
    const finalUrl = parsed.cleanUrl || cleanSource;
    const isStreamPlatform = parsed.platform === 'youtube' || parsed.platform === 'vimeo' || parsed.platform === 'tiktok' || parsed.platform === 'drive';

    updateVideo(editingVideo.id, {
      title: vTitle,
      url: finalUrl,
      videoFileUrl: isStreamPlatform ? undefined : (finalUrl.startsWith('data:') ? finalUrl : editingVideo.videoFileUrl),
      platform: parsed.platform || 'direct',
      description: vDesc,
      category: vCategory,
      duration: vDuration,
      likesCount: vLikes,
      commentsCount: vComments,
      bookId: vBookId || undefined,
      bookTitle: vBookTitle || undefined,
      chapterNumber: vChapterNumber ? Number(vChapterNumber) : undefined,
      chapterTitle: vChapterTitle.trim() || undefined,
    });
    setEditingVideo(null);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    updatePhoto(editingPhoto.id, {
      title: pTitle,
      caption: pCaption,
      imageUrl: pUrl,
      location: pLocation,
      category: pCategory,
    });
    setEditingPhoto(null);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    updateBook(editingBook.id, {
      title: bTitle,
      subtitle: bSubtitle,
      coverImage: bCover,
      galleryImages: bGalleryImages,
      publisher: bPublisher,
      publicationYear: bYear,
      pagesCount: Number(bPages),
      genre: bGenre,
      description: bDesc,
    });
    setEditingBook(null);
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    updateNews(editingNews.id, {
      title: nTitle,
      excerpt: nExcerpt,
      content: nContent,
      coverImage: nCover || '',
      videoUrl: nVideoUrl || '',
      mediaType: nMediaType,
      category: nCategory,
    });
    setEditingNews(null);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    updateLink(editingLink.id, {
      title: lTitle,
      url: lUrl,
      description: lDesc,
      category: lCategory,
    });
    setEditingLink(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#0b385e] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-[#0b385e] text-white">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-[#dfa85b]" />
            <h3 className="text-sm font-bold">
              {editingVideo && 'تعديل بيانات الفيديو (وضع المشرف)'}
              {editingPhoto && 'تعديل بيانات الصورة (وضع المشرف)'}
              {editingBook && 'تعديل بيانات الكتاب (وضع المشرف)'}
              {editingNews && 'تعديل مادة في «صورة في خبر» (وضع المشرف)'}
              {editingLink && 'تعديل بيانات الرابط (وضع المشرف)'}
            </h3>
          </div>
          <button onClick={handleClose} className="p-1 hover:text-[#dfa85b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-4 text-xs">
          
          {/* EDIT VIDEO */}
          {editingVideo && (
            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="font-bold text-[#0b385e] text-xs flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#dfa85b]" />
                  <span>تخصيص المشهد ضمن روايات الكاتب (فيديو يجسد الروايات)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">الرواية المرتبطة</label>
                    <select
                      value={vBookId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setVBookId(bId);
                        const found = books.find((b) => b.id === bId);
                        if (found) {
                          setVBookTitle(found.title);
                          setVCategory(`رواية ${found.title}`);
                        } else {
                          setVBookTitle('');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-[#0b385e] outline-none"
                    >
                      <option value="">-- عام / غير مرتبط برواية --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          رواية: {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">رقم الفصل</label>
                    <input
                      type="number"
                      min="1"
                      value={vChapterNumber}
                      onChange={(e) => setVChapterNumber(e.target.value ? Number(e.target.value) : '')}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-center font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">عنوان الفصل أو المشهد</label>
                    <input
                      type="text"
                      value={vChapterTitle}
                      onChange={(e) => setVChapterTitle(e.target.value)}
                      placeholder="مثال: البدايات الغامضة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">عنوان الفيديو الكامل</label>
                <input
                  type="text"
                  required
                  value={vTitle}
                  onChange={(e) => setVTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0b385e] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ملف أو رابط الفيديو</label>
                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black text-xs rounded-lg transition shadow-sm w-full justify-center">
                    <Upload className="w-4 h-4" />
                    <span>رفع ملف فيديو جديد من الجهاز (MP4/WebM)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 150 * 1024 * 1024) {
                          showToast('حجم ملف الفيديو يتجاوز 150 ميجابايت.');
                          return;
                        }
                        try {
                          const videoUrl = await processAndUploadVideo(file, {
                            contextTitle: vTitle || 'مشهد روائي',
                            bookId: vBookId,
                          });
                          setVUrl(videoUrl);
                        } catch (err: any) {
                          showToast(err?.message || 'تعذر رفع ملف الفيديو');
                        } finally {
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={vUrl}
                    onChange={(e) => setVUrl(e.target.value)}
                    placeholder="رابط مباشر لملف الفيديو أو ملف مرفوع..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#0b385e] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الإعجابات</label>
                  <input
                    type="text"
                    value={vLikes}
                    onChange={(e) => setVLikes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">المدة</label>
                  <input
                    type="text"
                    value={vDuration}
                    onChange={(e) => setVDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">وصف الفيديو</label>
                <textarea
                  rows={3}
                  value={vDesc}
                  onChange={(e) => setVDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-lg"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          )}

          {/* EDIT PHOTO */}
          {editingPhoto && (
            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">عنوان الصورة / المناسبة</label>
                <input
                  type="text"
                  required
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">رابط الصورة (URL أو رفع سحابي من الجهاز)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={pUrl}
                    onChange={(e) => setPUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none text-xs"
                    placeholder="رابط الصورة أو مسارها..."
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboardWithFeedback(pUrl, 'تم نسخ رابط الصورة إلى الحافظة')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                    title="نسخ الرابط"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <label className="cursor-pointer px-3 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-lg text-xs font-bold whitespace-nowrap">
                    رفع صورة
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
                            contextTitle: pTitle || 'صورة في المعرض',
                          });
                          setPUrl(uploaded);
                        } catch {
                          // Handled
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">المكان</label>
                  <input
                    type="text"
                    value={pLocation}
                    onChange={(e) => setPLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">تعليق أو سياق الصورة</label>
                <textarea
                  rows={3}
                  value={pCaption}
                  onChange={(e) => setPCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-lg"
                >
                  حفظ تعديلات الصورة
                </button>
              </div>
            </form>
          )}

          {/* EDIT BOOK */}
          {editingBook && (
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">عنوان الكتاب</label>
                  <input
                    type="text"
                    required
                    value={bTitle}
                    onChange={(e) => setBTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">العنوان الفرعي</label>
                  <input
                    type="text"
                    value={bSubtitle}
                    onChange={(e) => setBSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">صورة الغلاف (رابط أو رفع سحابي من الجهاز)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={bCover}
                    onChange={(e) => setBCover(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none text-xs"
                    placeholder="رابط الصورة أو مسارها"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboardWithFeedback(bCover, 'تم نسخ رابط الغلاف إلى الحافظة')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                    title="نسخ الرابط"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <label className="cursor-pointer px-3 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] border border-[#dfa85b] rounded-lg text-xs font-bold whitespace-nowrap">
                    رفع صورة
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploaded = await processAndUploadImage(file, {
                            maxWidth: 640,
                            maxHeight: 900,
                            quality: 0.72,
                            category: 'المؤلفات والكتب',
                            contextTitle: `غلاف: ${bTitle || 'كتاب'}`,
                          });
                          setBCover(uploaded);
                        } catch {
                          // Handled
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  معرض الصور واللوحات المرفقة للكتاب ({bGalleryImages.length})
                </label>
                <div className="space-y-2">
                  {bGalleryImages.filter((img) => Boolean(img && img.trim())).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-gray-200 rounded-lg">
                      {bGalleryImages.filter((img) => Boolean(img && img.trim())).map((img, i) => (
                        <div key={i} className="relative group/gthumb">
                          <img src={img} alt="" className="w-16 h-16 object-cover rounded-md border" />
                          <button
                            type="button"
                            onClick={() => copyToClipboardWithFeedback(img, 'تم نسخ رابط الصورة')}
                            className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#0b385e] hover:bg-[#07243c] text-[#dfa85b] rounded-full flex items-center justify-center text-[10px] shadow cursor-pointer font-bold"
                            title="نسخ الرابط"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow cursor-pointer"
                            title="حذف هذه الصورة من الكتاب"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ إضافة صورة / لوحة إلى المعرض (رفع سحابي)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploaded = await processAndUploadImage(file, {
                            maxWidth: 640,
                            maxHeight: 900,
                            quality: 0.72,
                            category: 'المؤلفات والكتب',
                            contextTitle: `لوحة / ملحق كتاب: ${bTitle || 'كتاب'}`,
                          });
                          setBGalleryImages((prev) => [...prev, uploaded]);
                        } catch {
                          // Handled
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">دار النشر</label>
                  <input
                    type="text"
                    value={bPublisher}
                    onChange={(e) => setBPublisher(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">السنة</label>
                  <input
                    type="text"
                    value={bYear}
                    onChange={(e) => setBYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">عدد الصفحات</label>
                  <input
                    type="number"
                    value={bPages}
                    onChange={(e) => setBPages(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">وصف الكتاب</label>
                <textarea
                  rows={3}
                  value={bDesc}
                  onChange={(e) => setBDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-lg"
                >
                  حفظ تعديلات الكتاب
                </button>
              </div>
            </form>
          )}

          {/* EDIT NEWS */}
          {editingNews && (
            <form onSubmit={handleSaveNews} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">عنوان المادة أو التوثيق</label>
                <input
                  type="text"
                  required
                  value={nTitle}
                  onChange={(e) => setNTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              {/* Media Type Toggle */}
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border">
                <span className="font-bold text-slate-700">نوع المادة:</span>
                <button
                  type="button"
                  onClick={() => setNMediaType('image')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    nMediaType === 'image' ? 'bg-[#0b385e] text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  صورة
                </button>
                <button
                  type="button"
                  onClick={() => setNMediaType('video')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    nMediaType === 'video' ? 'bg-[#0b385e] text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  فيديو
                </button>
              </div>

              {nMediaType === 'image' ? (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">صورة الخبر</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={nCover}
                      onChange={(e) => setNCover(e.target.value)}
                      placeholder="رابط الصورة أو ارفع من الجهاز"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border rounded-lg font-bold text-slate-700 flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const comp = await compressImage(file, 1600, 1600, 0.84);
                            setNCover(comp);
                          } catch {
                            // ignore
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-bold mb-1">فيديو الخبر (ملف أو رابط)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={nVideoUrl}
                      onChange={(e) => setNVideoUrl(e.target.value)}
                      placeholder="رابط فيديو (تيكتوك / يوتيوب / MP4) أو ارفع من الجهاز"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-black rounded-lg flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع ملف فيديو</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 150 * 1024 * 1024) {
                            showToast('حجم ملف الفيديو يتجاوز 150 ميجابايت.');
                            return;
                          }
                          try {
                            const videoUrl = await processAndUploadVideo(file, {
                              contextTitle: nTitle || 'فيديو الخبر',
                            });
                            setNVideoUrl(videoUrl);
                            setNMediaType('video');
                          } catch (err: any) {
                            showToast(err?.message || 'تعذر رفع ملف الفيديو');
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={nCategory}
                    onChange={(e) => setNCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">الإيجاز (Excerpt)</label>
                  <input
                    type="text"
                    value={nExcerpt}
                    onChange={(e) => setNExcerpt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نص الخبر والتفاصيل</label>
                <textarea
                  rows={5}
                  value={nContent}
                  onChange={(e) => setNContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  حفظ تعديلات «صورة في خبر»
                </button>
              </div>
            </form>
          )}

          {/* EDIT LINK */}
          {editingLink && (
            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم الموقع أو الرابط</label>
                <input
                  type="text"
                  required
                  value={lTitle}
                  onChange={(e) => setLTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">الرابط الإلكتروني (URL)</label>
                <input
                  type="url"
                  required
                  value={lUrl}
                  onChange={(e) => setLUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">الوصف</label>
                <input
                  type="text"
                  value={lDesc}
                  onChange={(e) => setLDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-lg"
                >
                  حفظ تعديلات الرابط
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
