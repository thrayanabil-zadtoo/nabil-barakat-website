import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AuthorPost } from '../types';
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Link2,
  Send,
  Sparkles,
  Clock,
  Pin,
  Search,
  Eye,
  Copy,
  Check,
  ImageDown,
} from 'lucide-react';
import { getCommunityColorPreset, sortCommunityPostsNewestFirst } from '../utils/communityPostColors';
import { getCommunityPostStats, formatArabicNumber } from '../utils/dynamicStats';
import {
  getCommunityPostShareUrl,
  buildShortShareExcerpt,
} from '../config/siteDomain';
import { AldiwanCertifiedBadge, AldiwanVerifiedIcon } from './AldiwanVerifiedBadge';
import { CommunityAudioPlayer } from './CommunityAudioPlayer';
import { CommunityQuoteCardModal } from './CommunityQuoteCardModal';
import { DoubleTapHeartOverlay } from './DoubleTapHeartOverlay';
import { useCommunityPostInteractions } from '../hooks/useCommunityPostInteractions';

export const CommunitySection: React.FC = () => {
  const {
    authorPosts,
    deleteAuthorPost,
    toggleLikeAuthorPost,
    recordPostView,
    isAuthorMode,
    authorProfile,
    comments,
    addVisitorComment,
    openShareModal,
    showToast,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'poems' | 'colored' | 'thoughts' | 'images' | 'popular'>('all');

  // Quote Card Modal State
  const [quoteCardPost, setQuoteCardPost] = useState<AuthorPost | null>(null);

  // Comments accordion state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const feedContainerRef = useRef<HTMLElement | null>(null);
  const [commentAuthorNames, setCommentAuthorNames] = useState<Record<string, string>>({});
  const [commentContents, setCommentContents] = useState<Record<string, string>>({});
  const [submittedCommentNotice, setSubmittedCommentNotice] = useState<Record<string, boolean>>({});

  const {
    copiedPostId,
    pressingPostId,
    burstsByPost,
    recentlyPoppedLikeId,
    handlePostPointerDown,
    handlePostPointerMove,
    handlePostPointerUp,
    handlePostPointerCancel,
    handlePostDoubleClick,
    handlePostContextMenu,
    handleLikeButtonClick,
    registerPostViewObserver,
  } = useCommunityPostInteractions({
    authorName: authorProfile.name || 'أ. نبيل بركات',
    toggleLikeAuthorPost,
    recordPostView,
    showToast,
  });

  const focusSpecificPost = (targetId: string) => {
    if (!targetId) return;
    setSearchQuery('');
    setActiveFilter('all');
    setHighlightedPostId(targetId);
    setTimeout(() => {
      const el = document.getElementById(`community-post-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 220);
    setTimeout(() => {
      setHighlightedPostId((prev) => (prev === targetId ? null : prev));
    }, 6000);
  };

  // Scroll to shared ?post=<id> if opened via direct post link or sidebar selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('post');
    if (targetId) {
      focusSpecificPost(targetId);
    }

    const handleFocusEvent = (ev: Event) => {
      const customEv = ev as CustomEvent<{ postId?: string }>;
      if (customEv.detail?.postId) {
        focusSpecificPost(customEv.detail.postId);
      }
    };
    window.addEventListener('nb:focus-post', handleFocusEvent);
    return () => window.removeEventListener('nb:focus-post', handleFocusEvent);
  }, [authorPosts.length]);


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

  const visiblePostIdsKey = filteredPosts.map((p) => p.id).join(',');
  useEffect(() => {
    return registerPostViewObserver(feedContainerRef.current);
  }, [registerPostViewObserver, visiblePostIdsKey]);

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

      {/* 2. Search & Filter Bar */}
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
      <section ref={feedContainerRef} className="space-y-5">
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
                data-post-id={post.id}
                key={post.id}
                onPointerDown={(e) => handlePostPointerDown(e, post)}
                onPointerMove={handlePostPointerMove}
                onPointerUp={(e) => handlePostPointerUp(e, post)}
                onPointerCancel={handlePostPointerCancel}
                onPointerLeave={handlePostPointerCancel}
                onDoubleClick={(e) => handlePostDoubleClick(e, post)}
                onContextMenu={handlePostContextMenu}
                title="اضغط مرتين للإعجاب ♥ أو اضغط مطولاً لنسخ المنشور بالكامل"
                className={`relative touch-manipulation bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md select-none no-word-select ${
                  copiedPostId === post.id
                    ? 'border-emerald-500 ring-2 ring-emerald-400/70 shadow-lg'
                    : pressingPostId === post.id
                    ? 'scale-[0.99] border-[#dfa85b] ring-2 ring-[#dfa85b]/50'
                    : highlightedPostId === post.id
                    ? 'border-[#dfa85b] ring-2 ring-[#dfa85b] shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                {/* Double-Tap Heart & Floating Hearts Overlay */}
                <DoubleTapHeartOverlay bursts={burstsByPost[post.id] || []} />
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

                  {/* Quick Copy Hint & Supervisor Controls */}
                  <div className="flex items-center gap-2">
                    {copiedPostId === post.id ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs animate-fade-in">
                        <Check className="w-3.5 h-3.5" />
                        <span>تم النسخ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                        <Copy className="w-3 h-3" />
                        <span>مرتين للإعجاب · مطولاً للنسخ</span>
                      </span>
                    )}

                    {isAuthorMode && (
                      <button
                        onClick={() => deleteAuthorPost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="حذف المنشور"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                    <div className={`p-8 sm:p-12 ${presetObj.class} text-center flex items-center justify-center min-h-[180px] shadow-inner select-none no-word-select`}>
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
                  <div className="p-5 space-y-3 select-none no-word-select">
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

                {/* Audio Recitation Player */}
                {post.audioUrl && (
                  <CommunityAudioPlayer
                    rawAudioUrl={post.audioUrl}
                    durationHint={post.audioDuration}
                    title={post.title ? `إلقاء صوتي: ${post.title}` : 'إلقاء صوتي بصوت الكاتب أ. نبيل بركات'}
                  />
                )}

                {/* Interaction Footer Bar */}
                <div
                  data-no-post-copy="true"
                  className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2 cursor-default"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Views Counter */}
                    <div
                      className="flex items-center gap-1.5 text-slate-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs"
                      title="عدد المشاهدات"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span className="font-mono tabular-nums">{formatArabicNumber(postStats.views)}</span>
                      <span className="text-[11px] text-slate-500 font-medium">مشاهدة</span>
                    </div>

                    {/* Interactive Like Button */}
                    <button
                      type="button"
                      aria-pressed={Boolean(post.isLiked)}
                      onClick={(e) => handleLikeButtonClick(post, e)}
                      className={`flex items-center gap-1.5 transition-all duration-200 font-bold cursor-pointer px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                        post.isLiked
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600 shadow-sm shadow-rose-500/25'
                          : 'text-slate-700 hover:text-rose-600 bg-white border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/70'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform duration-200 ${
                          recentlyPoppedLikeId === post.id ? 'animate-like-btn-pop' : ''
                        } ${post.isLiked ? 'fill-white text-white' : 'text-rose-500'}`}
                      />
                      <span className="font-mono tabular-nums">{formatArabicNumber(postStats.likes)}</span>
                      <span className="text-[11px]">{post.isLiked ? 'أعجبك' : 'إعجاب'}</span>
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

                  {/* Share & Quote Card Buttons */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setQuoteCardPost(post)}
                      className="flex items-center gap-1 text-[#07243c] bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition font-bold cursor-pointer"
                      title="حفظ القصيدة كصورة أنيقة للمشاركة"
                    >
                      <ImageDown className="w-3.5 h-3.5 text-[#c5943b]" />
                      <span>صورة للمشاركة</span>
                    </button>

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
                </div>

                {/* Accordion Comments Section */}
                {isCommentsExpanded && (
                  <div
                    data-no-post-copy="true"
                    className="p-4 bg-[#fbfdfe] border-t border-slate-200 space-y-4 cursor-default select-text"
                  >
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

      {/* Quote Card Image Generator Modal */}
      <CommunityQuoteCardModal
        post={quoteCardPost}
        authorName={authorProfile.name || 'أ. نبيل بركات'}
        authorPortrait={authorProfile.portraitImage || '/author.jpg'}
        onClose={() => setQuoteCardPost(null)}
        onToast={showToast}
      />
    </div>
  );
};
