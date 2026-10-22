import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuthorPost } from '../types';
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Link2,
  Send,
  X,
  Upload,
  Sparkles,
  Check,
  CheckCircle,
  Clock,
  Pin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const COLOR_PRESETS: { id: string; label: string; class: string; preview: string }[] = [
  { id: 'none', label: 'بدون لون (أبيض)', class: 'bg-white text-slate-800', preview: 'bg-white border-2 border-slate-300' },
  { id: 'navy', label: 'أزرق ملكي كحلي', class: 'bg-gradient-to-br from-[#07243c] via-[#0b385e] to-[#0d4573] text-white', preview: 'bg-[#0b385e]' },
  { id: 'amber', label: 'عنبر أدبي مذهب', class: 'bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#dfa85b] text-white', preview: 'bg-[#b45309]' },
  { id: 'crimson', label: 'قرمزي كلاسيكي', class: 'bg-gradient-to-br from-[#4c0519] via-[#881337] to-[#be123c] text-white', preview: 'bg-[#881337]' },
  { id: 'emerald', label: 'زمردي عميق', class: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white', preview: 'bg-[#064e3b]' },
  { id: 'purple', label: 'بنفسجي شاعري', class: 'bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#7c3aed] text-white', preview: 'bg-[#4c1d95]' },
  { id: 'midnight', label: 'ليلي فاحم', class: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] text-white', preview: 'bg-[#0f172a]' },
];

export const AuthorFeedSection: React.FC = () => {
  const {
    authorPosts,
    addAuthorPost,
    updateAuthorPost,
    deleteAuthorPost,
    toggleLikeAuthorPost,
    isAuthorMode,
    authorProfile,
    comments,
    addVisitorComment,
    approveComment,
    deleteVisitorComment,
    openShareModal,
    processAndUploadImage,
    showToast,
  } = useApp();

  // Post composer state
  const [content, setContent] = useState('');
  const [selectedBg, setSelectedBg] = useState('none');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Edit existing post modal state
  const [editingPost, setEditingPost] = useState<AuthorPost | null>(null);

  // Active comment box toggle per post
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentAuthorNames, setCommentAuthorNames] = useState<Record<string, string>>({});
  const [commentContents, setCommentContents] = useState<Record<string, string>>({});
  const [submittedCommentNotice, setSubmittedCommentNotice] = useState<Record<string, boolean>>({});

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) {
      showToast('يرجى كتابة خاطرة أو منشور أو إضافة صورة');
      return;
    }

    addAuthorPost({
      content: content.trim(),
      bgColor: selectedBg,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      linkText: linkText.trim() || undefined,
      likesCount: 0,
      isLiked: false,
    });

    // Reset composer
    setContent('');
    setSelectedBg('none');
    setImageUrl('');
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
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
        category: 'منشورات الكاتب',
        contextTitle: 'صورة مرفقة بمنشور الكاتب',
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
      showToast('يرجى كتابة اسمك والتعليق');
      return;
    }

    addVisitorComment({
      targetType: 'post',
      targetId: postId,
      targetTitle: `منشور: ${postTitle.slice(0, 30)}...`,
      targetSection: 'منشورات وخواطر الكاتب',
      country: 'مصر',
      senderName: name,
      content: text,
    });

    // Clear input
    setCommentContents((prev) => ({ ...prev, [postId]: '' }));
    setSubmittedCommentNotice((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setSubmittedCommentNotice((prev) => ({ ...prev, [postId]: false }));
    }, 8000);
  };

  const selectedPresetObj = COLOR_PRESETS.find((c) => c.id === selectedBg) || COLOR_PRESETS[0];

  return (
    <div className="space-y-4" dir="rtl">
      {/* 1. Facebook-Style Composer (ONLY FOR SUPERVISOR) */}
      {isAuthorMode ? (
        <div className="bg-white rounded-2xl border border-[#d6e0ea] shadow-sm p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <img
              src={authorProfile.portraitImage || '/author.jpg'}
              alt={authorProfile.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#dfa85b] shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#0b385e] text-sm">أ. نبيل بركات</h4>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  لوحة نشر الخواطر والمنشورات ✍️
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                انشر ما يخطر ببالك ليظهر فوراً في منتصف الصفحة الرئيسية للزوار
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePublish} className="space-y-3">
            {/* Dynamic textarea based on selected background */}
            {selectedBg === 'none' ? (
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ما الذي يخطر ببالك اليوم يا أستاذ نبيل؟ اكتب خاطرة، فكرة، أو حكمة..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0b385e] resize-none"
              />
            ) : (
              <div className={`rounded-xl p-6 ${selectedPresetObj.class} shadow-inner min-h-[160px] flex items-center justify-center transition-all duration-300`}>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب خاطرتك الأدبية هنا بخلفية ملونة جذابة..."
                  className="w-full bg-transparent text-center text-white placeholder-white/70 font-literary text-lg sm:text-xl font-bold focus:outline-none resize-none leading-relaxed border-0"
                />
              </div>
            )}

            {/* Attached Image Preview */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group max-h-60 bg-black">
                <img src={imageUrl} alt="مرفق" className="w-full h-full object-contain max-h-60" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 left-2 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition cursor-pointer"
                  title="إزالة الصورة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Attached Link Inputs */}
            {showLinkInput && (
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>إرفاق رابط خارجي أو مقال:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkUrl('');
                      setLinkText('');
                    }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="نص الرابط (مثال: لقاء تلفزيوني، مقال منشور في جريدة...)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            )}

            {/* Facebook-like Color Swatches */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600">اختر لون أو بطاقة مسبقة لخاطرتك:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedBg(preset.id)}
                    className={`w-7 h-7 rounded-lg ${preset.preview} transition transform cursor-pointer ${
                      selectedBg === preset.id ? 'ring-2 ring-offset-2 ring-[#0b385e] scale-110 shadow-sm' : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {/* Upload Image Button */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isUploadingImage ? 'جارٍ الرفع...' : 'صورة'}</span>
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    showLinkInput ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span>رابط</span>
                </button>
              </div>

              {/* Publish Button */}
              <button
                type="submit"
                disabled={!content.trim() && !imageUrl.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#0b385e] hover:bg-[#072a47] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 -rotate-45 text-[#dfa85b]" />
                <span>نشر الخاطرة</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Visitor Welcome Banner */
        <div className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#dfa85b]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={authorProfile.portraitImage || '/author.jpg'}
              alt={authorProfile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#dfa85b] shadow-md shrink-0"
            />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-literary flex items-center gap-1.5">
                <span>منشورات وخواطر الكاتب أ. نبيل بركات</span>
                <Sparkles className="w-4 h-4 text-[#dfa85b]" />
              </h3>
              <p className="text-xs text-white/80">
                مساحة أدبية وفكرية حية لنبضات الكاتب، والتعليق متاح للجميع بعد المراجعة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FEED OF AUTHOR POSTS */}
      <div className="space-y-4">
        {authorPosts.map((post) => {
          const presetObj = COLOR_PRESETS.find((c) => c.id === post.bgColor) || COLOR_PRESETS[0];
          const isColorCard = post.bgColor && post.bgColor !== 'none';
          const postComments = comments.filter((c) => c.targetType === 'post' && c.targetId === post.id);
          const approvedComments = postComments.filter((c) => c.isApproved);
          const pendingComments = postComments.filter((c) => c.status === 'pending');
          const isCommentsExpanded = expandedCommentsPostId === post.id;

          return (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-[#d6e0ea] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Post Header */}
              <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={authorProfile.portraitImage || '/author.jpg'}
                    alt={authorProfile.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#dfa85b] shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0b385e] text-sm">أ. نبيل بركات</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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

                {/* Supervisor Controls on Post */}
                {isAuthorMode && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="p-1.5 text-slate-500 hover:text-[#0b385e] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="تعديل المنشور"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
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

              {/* Post Content */}
              {isColorCard ? (
                /* Facebook-style Color Card */
                <div className={`p-8 sm:p-10 ${presetObj.class} text-center flex items-center justify-center min-h-[170px] shadow-inner select-text`}>
                  <p className="font-literary text-lg sm:text-2xl font-bold leading-relaxed whitespace-pre-line tracking-wide">
                    {post.content}
                  </p>
                </div>
              ) : (
                /* Regular Text Post */
                <div className="p-4 space-y-3">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Attached Image */}
              {post.imageUrl && (
                <div className="border-t border-slate-100 max-h-96 overflow-hidden bg-slate-900">
                  <img
                    src={post.imageUrl}
                    alt="مرفق المنشور"
                    className="w-full h-full object-contain max-h-96 mx-auto"
                  />
                </div>
              )}

              {/* Attached Link Box */}
              {post.linkUrl && (
                <div className="p-4 pt-1">
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 transition group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0b385e] group-hover:underline truncate">
                          {post.linkText || post.linkUrl}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{post.linkUrl}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0b385e] shrink-0" />
                  </a>
                </div>
              )}

              {/* Interaction Bar */}
              <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Like Button */}
                <button
                  onClick={() => toggleLikeAuthorPost(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    post.isLiked
                      ? 'bg-rose-50 text-rose-600'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                  <span>{post.likesCount || 0}</span>
                </button>

                {/* Comment Toggle Button */}
                <button
                  onClick={() =>
                    setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-bold transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>{approvedComments.length} تعليقات</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() =>
                    openShareModal({
                      title: `خاطرة للأستاذ نبيل بركات: "${post.content.slice(0, 50)}..."`,
                      description: post.content,
                      image: post.imageUrl,
                      type: 'post',
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-bold transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#dfa85b]" />
                  <span>مشاركة</span>
                </button>
              </div>

              {/* COMMENTS ACCORDION SECTION (FOR EVERYONE) */}
              <div className="border-t border-slate-100 p-4 bg-[#fbfcfd] space-y-4">
                {/* Notice that comments require review */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    التعليق متاح لجميع الزوار الكرام، وتُنشر التعليقات فور مراجعتها واعتمادها من قبل أ. نبيل بركات حفظاً للذوق العام.
                  </span>
                </div>

                {/* Visitor Add Comment Form */}
                <form
                  onSubmit={(e) => handleVisitorCommentSubmit(post.id, post.content, e)}
                  className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={commentAuthorNames[post.id] || ''}
                      onChange={(e) =>
                        setCommentAuthorNames((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="اسمك أو صفتك (مثال: قارئ، أديب...)"
                      className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#0b385e]"
                    />
                    <span className="text-[10px] text-slate-400">اترك رأيك أو انطباعك</span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <textarea
                      rows={2}
                      required
                      value={commentContents[post.id] || ''}
                      onChange={(e) =>
                        setCommentContents((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="اكتب تعليقك هنا..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#0b385e] resize-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0b385e] hover:bg-[#072a47] text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer self-end"
                    >
                      <Send className="w-3.5 h-3.5 -rotate-45" />
                      <span>إرسال</span>
                    </button>
                  </div>

                  {submittedCommentNotice[post.id] && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم استلام تعليقك بنجاح! سيظهر هنا فور مراجعته واعتماده من قبل أ. نبيل بركات.</span>
                    </div>
                  )}
                </form>

                {/* Pending comments (VISIBLE TO SUPERVISOR FOR INSTANT MODERATION) */}
                {isAuthorMode && pendingComments.length > 0 && (
                  <div className="space-y-2 border border-amber-300 bg-amber-50/50 p-3 rounded-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200 pb-1.5">
                      <span>تعليقات جديدة بانتظار مراجعتك واعتمادك ({pendingComments.length}):</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">خاص بالمشرف</span>
                    </div>
                    {pendingComments.map((pc) => (
                      <div key={pc.id} className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-[#0b385e] flex items-center gap-1.5">
                            <span>{pc.senderName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">· {pc.date}</span>
                          </div>
                          <p className="text-slate-700 mt-1 leading-relaxed">"{pc.content}"</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => approveComment(pc.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>اعتماد ونشر</span>
                          </button>
                          <button
                            onClick={() => deleteVisitorComment(pc.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approved Comments List */}
                {approvedComments.length > 0 ? (
                  <div className="space-y-2.5">
                    {approvedComments.map((c) => (
                      <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0b385e] text-white flex items-center justify-center font-bold text-[10px]">
                              {c.senderName.charAt(0)}
                            </div>
                            <span className="font-bold text-[#0b385e]">{c.senderName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                          </div>
                          {isAuthorMode && (
                            <button
                              onClick={() => deleteVisitorComment(c.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="حذف التعليق"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed pr-8">{c.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-1">
                    كن أول من يشارك برأيه على هذه الخاطرة الأدبية!
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* 3. EDIT POST MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-[#0b385e] text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-[#dfa85b]" />
                <span>تعديل المنشور</span>
              </h4>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={4}
              value={editingPost.content}
              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#0b385e]"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">اللون المسبق:</span>
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setEditingPost({ ...editingPost, bgColor: preset.id })}
                    className={`w-6 h-6 rounded-md ${preset.preview} ${
                      editingPost.bgColor === preset.id ? 'ring-2 ring-[#0b385e]' : 'opacity-70'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  updateAuthorPost(editingPost.id, {
                    content: editingPost.content,
                    bgColor: editingPost.bgColor,
                  });
                  setEditingPost(null);
                }}
                className="px-5 py-1.5 bg-[#0b385e] text-white rounded-lg text-xs font-bold shadow hover:bg-[#082a47]"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
