import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AuthorPost } from '../types';
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Image as ImageIcon,
  Link2,
  Send,
  X,
  Sparkles,
  Clock,
  Pin,
  Search,
  Feather,
  Lock,
  Eye,
} from 'lucide-react';
import { COMMUNITY_COLOR_PRESETS, getCommunityColorPreset, sortCommunityPostsNewestFirst } from '../utils/communityPostColors';
import { getCommunityPostStats, formatArabicNumber } from '../utils/dynamicStats';
import { getCommunityPostShareUrl, buildShortShareExcerpt } from '../config/siteDomain';
import { AldiwanCertifiedBadge, AldiwanVerifiedIcon } from './AldiwanVerifiedBadge';
import { AuthorSeal } from './AuthorSeal';

export const CommunitySection: React.FC = () => {
  const {
    authorPosts,
    addAuthorPost,
    updateAuthorPost,
    deleteAuthorPost,
    toggleLikeAuthorPost,
    isAuthorMode,
    setIsLoginModalOpen,
    authorProfile,
    comments,
    addVisitorComment,
    approveComment,
    deleteVisitorComment,
    openShareModal,
    processAndUploadImage,
    showToast,
  } = useApp();

  // Composer State
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState('red'); // Default to red as requested by author
  const [category, setCategory] = useState<'قصيدة' | 'خاطرة' | 'مقال' | 'حكمة' | 'عام'>('قصيدة');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'poems' | 'colored' | 'thoughts' | 'images' | 'popular'>('all');

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<AuthorPost | null>(null);

  // Comments accordion state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [commentAuthorNames, setCommentAuthorNames] = useState<Record<string, string>>({});
  const [commentContents, setCommentContents] = useState<Record<string, string>>({});
  const [submittedCommentNotice, setSubmittedCommentNotice] = useState<Record<string, boolean>>({});

  // Scroll to shared ?post=<id> if opened via direct post link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('post');
    if (targetId) {
      setSearchQuery('');
      setActiveFilter('all');
      setHighlightedPostId(targetId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`community-post-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      const clearHighlight = setTimeout(() => setHighlightedPostId(null), 6000);
      return () => {
        clearTimeout(timer);
        clearTimeout(clearHighlight);
      };
    }
  }, [authorPosts.length]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) {
      showToast('يرجى كتابة نص القصيدة أو الخاطرة أولاً');
      return;
    }

    addAuthorPost({
      content: content.trim(),
      title: title.trim() || undefined,
      bgColor: selectedBg,
      category: category,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      linkText: linkText.trim() || undefined,
      isLiked: false,
    });

    // Reset Form
    setContent('');
    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
    showToast('✓ تم نشر القصيدة في قسم المجتمع بنجاح وحفظها سحابياً');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploaded = await processAndUploadImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        category: 'قسم المجتمع',
        contextTitle: 'صورة مرفقة بمنشور المجتمع الأدبي',
      });
      setImageUrl(uploaded);
      showToast('✓ تم رفع الصورة وإرفاقها بالمنشور بنجاح');
    } catch (err: any) {
      showToast(err?.message || 'تعذر رفع الصورة');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVisitorCommentSubmit = (postId: string, postTitle: string, e: React.FormEvent) => {
    e.preventDefault();
    const name = (commentAuthorNames[postId] || '').trim();
    const text = (commentContents[postId] || '').trim();

    if (!name || !text) {
      showToast('يرجى كتابة اسمك والتعليق الأدبي');
      return;
    }

    addVisitorComment({
      targetType: 'post',
      targetId: postId,
      targetTitle: `منشور: ${postTitle.slice(0, 30)}...`,
      targetSection: 'قسم المجتمع الأدبي',
      country: 'مصر',
      senderName: name,
      content: text,
    });

    setCommentContents((prev) => ({ ...prev, [postId]: '' }));
    setSubmittedCommentNotice((prev) => ({ ...prev, [postId]: true }));
    showToast('✓ شكراً لمشاركتك الأدبية! تم إرسال تعليقك وسيظهر فور اعتماده');
    setTimeout(() => {
      setSubmittedCommentNotice((prev) => ({ ...prev, [postId]: false }));
    }, 7000);
  };

  // Filter & Sort Posts: Newest First (الأحدث في البداية)
  const filteredPosts = (() => {
    const matched = authorPosts.filter((post) => {
      const textMatch =
        !searchQuery.trim() ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.category && post.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!textMatch) return false;

      if (activeFilter === 'poems') {
        return (
          post.category === 'قصيدة' ||
          post.content.includes('\n') ||
          post.content.includes('قصيد') ||
          post.content.includes('شعر')
        );
      }
      if (activeFilter === 'colored') {
        return post.bgColor && post.bgColor !== 'none';
      }
      if (activeFilter === 'thoughts') {
        return post.category === 'خاطرة' || post.category === 'حكمة';
      }
      if (activeFilter === 'images') {
        return !!post.imageUrl;
      }
      if (activeFilter === 'popular') {
        return getCommunityPostStats(post).likes >= 50;
      }

      return true;
    });

    const newestFirst = sortCommunityPostsNewestFirst(matched);
    if (activeFilter === 'popular') {
      return [...newestFirst].sort((a, b) => getCommunityPostStats(b).likes - getCommunityPostStats(a).likes);
    }
    return newestFirst;
  })();

  const selectedPresetObj = getCommunityColorPreset(selectedBg);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Banner: مجتمع نبيل بركات الأدبي */}
      <section className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#dfa85b]/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#dfa85b]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#dfa85b] shadow-xl shrink-0 bg-slate-900">
              <img
                src={authorProfile.portraitImage || '/author.jpg'}
                alt={authorProfile.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-red-700/90 text-white text-[9px] font-bold text-center py-0.5">
                المؤلف
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>قسم المجتمع الأدبي</span>
                </span>
                <AldiwanCertifiedBadge size="sm" variant="badge" theme="dark" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black font-literary text-white flex items-center gap-2">
                <span>مجتمع الكاتب والشاعر نبيل بركات</span>
                <AldiwanVerifiedIcon size={20} />
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                منصة أدبية وتفاعلية جامعة، تضم القصائد الشاعرية والخواطر ونبضات الفكر اليومية، مع فضاء مفتوح لنقاش القراء وتذوق الكلمات.
              </p>
            </div>
          </div>

          {/* Quick Info & Stats Badge */}
          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <div className="text-center px-2">
              <div className="text-lg font-black text-[#f5cd72]">{formatArabicNumber(authorPosts.length)}</div>
              <div className="text-[10px] text-slate-300">نص وقصيدة</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-lg font-black text-sky-300">
                {formatArabicNumber(authorPosts.reduce((acc, p) => acc + getCommunityPostStats(p).views, 0))}
              </div>
              <div className="text-[10px] text-slate-300">مشاهدة</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-lg font-black text-emerald-300">
                {formatArabicNumber(authorPosts.reduce((acc, p) => acc + getCommunityPostStats(p).likes, 0))}
              </div>
              <div className="text-[10px] text-slate-300">إعجاب وتفاعل</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Publisher Box: «ما يخطر في بالي» */}
      <section className="bg-white rounded-3xl border-2 border-[#d6e0ea] shadow-sm p-5 sm:p-6 space-y-4">
        {/* Supervisor Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg border border-red-200">
              ✍️
            </div>
            <div>
              <h3 className="font-extrabold text-[#07243c] text-base font-literary flex items-center gap-2">
                <span>صندوق الكتابة الأدبية: «ما يخطر في بالي»</span>
                {isAuthorMode && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    لوحة الكاتب نشطة
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                اكتب قصيدتك أو خاطرتك، اختر البطاقة الحمراء أو الملونة، لتُنشر فوراً في قسم المجتمع لكافة القراء
              </p>
            </div>
          </div>

          {!isAuthorMode && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs bg-[#07243c] hover:bg-[#0b385e] text-amber-300 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>دخول الكاتب للنشر</span>
            </button>
          )}
        </div>

        {/* If author mode is active, render interactive composer */}
        {isAuthorMode ? (
          <form onSubmit={handlePublish} className="space-y-4">
            {/* Title & Category selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان القصيدة أو الخاطرة (اختياري)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 bg-slate-50/50"
                />
              </div>
              <div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-red-600 bg-slate-50/50 cursor-pointer"
                >
                  <option value="قصيدة">📜 قصيدة شعريّة</option>
                  <option value="خاطرة">✒️ خاطرة أدبية</option>
                  <option value="حكمة">💡 حكمة وتأمل</option>
                  <option value="مقال">📰 مقال ونقد</option>
                  <option value="عام">💬 مشاركة عامة</option>
                </select>
              </div>
            </div>

            {/* Dynamic Textarea with Live Card Preview */}
            {selectedBg === 'none' ? (
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب أبيات القصيدة أو الخاطرة هنا بسطور واضحة ومتتالية..."
                className="w-full p-4 rounded-2xl border border-slate-300 text-sm sm:text-base leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600 resize-none font-literary"
              />
            ) : (
              <div className={`rounded-2xl p-6 sm:p-8 ${selectedPresetObj.class} shadow-inner min-h-[190px] flex flex-col items-center justify-center text-center transition-all duration-300 relative`}>
                <span className="absolute top-3 right-3 text-[11px] font-bold bg-black/30 text-white/90 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  معاينة البطاقة الملونة ({selectedPresetObj.label})
                </span>

                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب أبيات القصيدة أو الخاطرة الأدبية هنا... ستظهر بخط بارز وخلفية ملونة جذابة لجميع القراء"
                  className="w-full bg-transparent text-center text-white placeholder-white/70 font-literary text-lg sm:text-2xl font-bold focus:outline-none resize-none leading-relaxed border-0 select-text"
                />
              </div>
            )}

            {/* Attached Image Preview */}
            {imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-950 flex items-center justify-center">
                <img src={imageUrl} alt="مرفق بالمنشور" className="max-h-64 w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-3 left-3 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md cursor-pointer"
                  title="إزالة الصورة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Attached Link Box */}
            {showLinkInput && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    <span>إرفاق رابط خارجي أو مقال:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                />
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="عنوان الرابط (مثال: قصيدة منشورة بجريدة الأهرام، لقاء تلفزيوني...)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            )}

            {/* Color Swatches (Including RED prominently) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#07243c] flex items-center gap-1.5">
                  <span>اختر لون البطاقة (خاصة اللون الأحمر للقصائد):</span>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    الأحمر متاح الآن
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {selectedPresetObj.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {COMMUNITY_COLOR_PRESETS.map((preset) => {
                  const isSelected = selectedBg === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedBg(preset.id)}
                      className={`h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition transform cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-red-600 scale-105 shadow-md'
                          : 'opacity-85 hover:opacity-100 hover:scale-102'
                      } ${preset.id === 'none' ? 'bg-slate-100 border border-slate-300 text-slate-700' : preset.badgeBg}`}
                      title={preset.label}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${preset.preview}`} />
                      <span>{preset.id === 'red' ? 'أحمر ياقوتي ⭐' : preset.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Bar & Publish Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isUploadingImage ? 'جارٍ رفع الصورة...' : 'إرفاق صورة'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {/* Attach Link Button */}
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    showLinkInput ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span>رابط خارجي</span>
                </button>
              </div>

              {/* Publish Button */}
              <button
                type="submit"
                disabled={!content.trim() && !imageUrl.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 -rotate-45 text-amber-200" />
                <span>نشر فوري في قسم المجتمع ✨</span>
              </button>
            </div>
          </form>
        ) : (
          /* Reader Welcome Message */
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Feather className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                مرحباً بكم في مجتمع الكاتب أ. نبيل بركات. تصفحوا أحدث القصائد والخواطر وشاركونا تعليقاتكم وإعجابكم أسفل كل منشور.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في قصائد وخواطر المجتمع..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'poems', label: '📜 قصائد' },
              { id: 'colored', label: '🎨 بطاقات ملونة' },
              { id: 'thoughts', label: '💡 خواطر' },
              { id: 'images', label: '🖼️ مصورة' },
              { id: 'popular', label: '🔥 الأكثر تفاعلاً' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-bold text-[#07243c] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>الترتيب النشط: الأحدث في البداية</span>
          </span>
          <span className="font-bold text-slate-500">
            إجمالي المعروض: {filteredPosts.length}
          </span>
        </div>
      </section>

      {/* 4. Posts Feed */}
      <section className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl font-bold">
              📜
            </div>
            <h4 className="font-bold text-slate-800 text-base">لا توجد منشورات مطابقة للبحث حالياً</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'جرّب البحث بكلمات أخرى أو اختر تصفية مختلفة' : 'كن أول من يعلق أو يشارك في مجتمع الكاتب'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const presetObj = getCommunityColorPreset(post.bgColor);
            const isColorCard = post.bgColor && post.bgColor !== 'none';
            const postStats = getCommunityPostStats(post);
            const postComments = comments.filter((c) => c.targetType === 'post' && c.targetId === post.id);
            const approvedComments = postComments.filter((c) => c.isApproved);
            const isCommentsExpanded = expandedCommentsPostId === post.id;

            return (
              <article
                id={`community-post-${post.id}`}
                key={post.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
                  highlightedPostId === post.id
                    ? 'border-[#dfa85b] ring-2 ring-[#dfa85b] shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                {/* Post Top Meta */}
                <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={authorProfile.portraitImage || '/author.jpg'}
                      alt={authorProfile.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#dfa85b] shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-[#07243c] text-sm font-literary">
                          {authorProfile.name || 'أ. نبيل بركات'}
                        </span>
                        <AldiwanVerifiedIcon size={15} />
                        {post.category && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.2 rounded-full border border-red-200">
                            {post.category}
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" />
                            <span>مثبت</span>
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{post.date}</span>
                      </time>
                    </div>
                  </div>

                  {/* Supervisor Controls */}
                  {isAuthorMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteAuthorPost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="حذف المنشور"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Title if present */}
                {post.title && (
                  <div className="px-5 pt-3 pb-1">
                    <h3 className="text-base sm:text-lg font-black font-literary text-[#07243c]">
                      {post.title}
                    </h3>
                  </div>
                )}

                {/* Post Content */}
                {isColorCard ? (
                  /* Brilliant Color Card with Poetic Styling */
                  <div>
                    <div className={`p-8 sm:p-12 ${presetObj.class} text-center flex items-center justify-center min-h-[180px] shadow-inner select-text`}>
                      <p className="font-literary text-lg sm:text-2xl font-black leading-relaxed whitespace-pre-line tracking-wide drop-shadow-sm">
                        {post.content}
                      </p>
                    </div>
                    {(post.imageUrl || post.linkUrl) && (
                      <div className="p-4 space-y-3 bg-white">
                        {post.imageUrl && (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 bg-slate-900">
                            <img src={post.imageUrl} alt="مرفق" className="w-full h-full object-contain max-h-96" />
                          </div>
                        )}
                        {post.linkUrl && (
                          <a
                            href={post.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>{post.linkText || post.linkUrl}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Card */
                  <div className="p-5 space-y-3 select-text">
                    <p className="font-literary text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-line">
                      {post.content}
                    </p>

                    {post.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 bg-slate-900">
                        <img src={post.imageUrl} alt="مرفق" className="w-full h-full object-contain max-h-96" />
                      </div>
                    )}

                    {post.linkUrl && (
                      <a
                        href={post.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{post.linkText || post.linkUrl}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Interaction Footer Bar */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Views Counter */}
                    <div
                      className="flex items-center gap-1.5 text-slate-600 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs"
                      title="عدد المشاهدات"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span className="font-mono">{formatArabicNumber(postStats.views)}</span>
                      <span className="text-[11px] text-slate-500 font-medium">مشاهدة</span>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={() => toggleLikeAuthorPost(post.id)}
                      className={`flex items-center gap-1.5 transition font-bold cursor-pointer px-2.5 py-1 rounded-lg border ${
                        post.isLiked
                          ? 'text-rose-600 bg-rose-50 border-rose-200'
                          : 'text-slate-600 hover:text-rose-600 bg-white border-slate-200/80 hover:border-rose-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
                      <span className="font-mono">{formatArabicNumber(postStats.likes)}</span>
                    </button>

                    {/* Comments Toggle Button */}
                    <button
                      onClick={() =>
                        setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)
                      }
                      className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition font-bold cursor-pointer px-2 py-1"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>{approvedComments.length} تعليقات</span>
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() =>
                      openShareModal({
                        title: post.title
                          ? `${post.title} — مجتمع الكاتب نبيل بركات`
                          : `${post.category || 'منشور'} من مجتمع الكاتب نبيل بركات`,
                        description: buildShortShareExcerpt(post.content, 150),
                        url: getCommunityPostShareUrl(post.id),
                        image: post.imageUrl || authorProfile.portraitImage,
                        type: 'post',
                      })
                    }
                    className="flex items-center gap-1 text-slate-500 hover:text-[#07243c] transition font-bold cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#dfa85b]" />
                    <span>مشاركة</span>
                  </button>
                </div>

                {/* Accordion Comments Section */}
                {isCommentsExpanded && (
                  <div className="p-4 bg-[#fbfdfe] border-t border-slate-200 space-y-4">
                    {/* Comments List */}
                    <div className="space-y-2.5">
                      {approvedComments.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">
                          لا توجد تعليقات حتى الآن. كن أول من يترك بصمته الأدبية!
                        </p>
                      ) : (
                        approvedComments.map((c) => (
                          <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="font-bold text-[#07243c]">{c.senderName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Inline Comment Box */}
                    <form
                      onSubmit={(e) => handleVisitorCommentSubmit(post.id, post.title || post.content, e)}
                      className="space-y-2 pt-2 border-t border-slate-200"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={commentAuthorNames[post.id] || ''}
                          onChange={(e) =>
                            setCommentAuthorNames((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="اسمك الكريم..."
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-red-600"
                        />
                        <div className="sm:col-span-2 flex gap-1.5">
                          <input
                            type="text"
                            required
                            value={commentContents[post.id] || ''}
                            onChange={(e) =>
                              setCommentContents((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="اكتب تعليقك الأدبي أو انطباعك..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3 -rotate-45" />
                            <span>إرسال</span>
                          </button>
                        </div>
                      </div>

                      {submittedCommentNotice[post.id] && (
                        <p className="text-[11px] text-emerald-600 font-bold">
                          ✓ تم إرسال تعليقك بنجاح وسيعتمد قريباً
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
