import React, { useState } from 'react';
import { Heart, Eye, MessageSquare, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getItemViews,
  getItemTotalLikes,
  isItemLikedByUser,
  toggleItemLike,
  formatArabicNumber,
} from '../utils/dynamicStats';

interface ContentInteractionBarProps {
  itemId: string;
  itemTitle: string;
  itemType: 'book' | 'video' | 'photo' | 'news' | 'link' | 'general';
  commentsCount?: number;
  itemUrl?: string;
  itemDescription?: string;
  className?: string;
  compact?: boolean;
}

export const ContentInteractionBar: React.FC<ContentInteractionBarProps> = ({
  itemId,
  itemTitle,
  itemType,
  commentsCount = 24,
  itemUrl,
  itemDescription,
  className = '',
  compact = false,
}) => {
  const { openShareModal, openCommentModal, showToast } = useApp();
  const [isLiked, setIsLiked] = useState<boolean>(() => isItemLikedByUser(itemId));
  const [likesCount, setLikesCount] = useState<number>(() => getItemTotalLikes(itemId));
  const [viewsCount] = useState<number>(() => getItemViews(itemId));
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextLiked = toggleItemLike(itemId);
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(1000, prev - 1)));

    if (nextLiked) {
      setIsHeartAnimating(true);
      setTimeout(() => setIsHeartAnimating(false), 600);
      showToast('شكراً لتفاعلك! تمت إضافة إعجابك بالقلب الأحمر ❤️');
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openCommentModal({
      targetType: itemType === 'link' ? 'general' : itemType,
      targetId: itemId,
      targetTitle: itemTitle,
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openShareModal({
      title: itemTitle,
      type: itemType,
      url: itemUrl,
      description: itemDescription,
    });
  };

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-1.5 pt-2 text-[11px] text-slate-600 border-t border-slate-100 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Views */}
        <div
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
          title="عدد المشاهدات والقراءات"
        >
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-mono font-bold text-[10px] sm:text-xs">
            {formatArabicNumber(viewsCount)}
          </span>
        </div>

        {/* Red Heart Likes */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`flex items-center gap-1 transition-all cursor-pointer group px-1.5 py-0.5 rounded-md ${
            isLiked ? 'text-red-600 bg-red-50' : 'text-slate-600 hover:text-red-500 hover:bg-slate-50'
          }`}
          title={isLiked ? 'إلغاء الإعجاب' : 'إعجاب بالقلب الأحمر'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${
              isLiked
                ? 'fill-red-500 text-red-500 scale-110'
                : 'text-red-500/80 group-hover:scale-110'
            } ${isHeartAnimating ? 'scale-125 animate-ping' : ''}`}
          />
          <span className="font-mono font-bold text-[10px] sm:text-xs text-red-600">
            {formatArabicNumber(likesCount)}
          </span>
        </button>

        {/* Comments */}
        <button
          type="button"
          onClick={handleCommentClick}
          className="flex items-center gap-1 text-slate-600 hover:text-amber-700 transition cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-50"
          title="عرض وإضافة تعليق"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-mono font-bold text-[10px] sm:text-xs">
            {formatArabicNumber(commentsCount)}
          </span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex items-center gap-1 text-[#0b385e] hover:text-[#dfa85b] transition cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-50 font-bold"
          title="مشاركة هذا المحتوى"
        >
          <Share2 className="w-3.5 h-3.5 text-[#0b385e]" />
          <span className="text-[10px]">مشاركة</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs shadow-xs ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Views */}
      <div
        className="flex items-center gap-1.5 text-slate-600 font-medium px-2 py-1 rounded-lg bg-white border border-slate-100 shadow-2xs"
        title="إجمالي عدد المشاهدات والقراءات"
      >
        <Eye className="w-4 h-4 text-sky-600" />
        <span className="text-[11px] text-slate-400">مشاهدة:</span>
        <span className="font-mono font-black text-slate-700">
          {formatArabicNumber(viewsCount)}
        </span>
      </div>

      {/* Red Heart Likes */}
      <button
        type="button"
        onClick={handleLikeClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-all shadow-2xs cursor-pointer ${
          isLiked
            ? 'bg-red-50/90 border-red-200 text-red-600 shadow-sm'
            : 'bg-white border-slate-100 text-slate-700 hover:text-red-600 hover:border-red-100'
        }`}
        title={isLiked ? 'أعجبك هذا المحتوى' : 'اضغط للإعجاب بالقلب الأحمر'}
      >
        <Heart
          className={`w-4 h-4 transition-transform ${
            isLiked
              ? 'fill-red-500 text-red-500 scale-110 drop-shadow-xs'
              : 'text-red-500 group-hover:scale-110'
          } ${isHeartAnimating ? 'scale-125 animate-bounce' : ''}`}
        />
        <span className="text-[11px] text-slate-500">أعجبني:</span>
        <span className="font-mono font-black text-red-600">
          {formatArabicNumber(likesCount)}
        </span>
      </button>

      {/* Comments */}
      <button
        type="button"
        onClick={handleCommentClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-700 hover:text-amber-800 hover:border-amber-200 font-bold transition shadow-2xs cursor-pointer"
        title="عرض التعليقات وإضافة رأيك"
      >
        <MessageSquare className="w-4 h-4 text-amber-600" />
        <span className="text-[11px] text-slate-500">تعليقات:</span>
        <span className="font-mono font-black text-slate-800">
          {formatArabicNumber(commentsCount)}
        </span>
      </button>

      {/* Share Button */}
      <button
        type="button"
        onClick={handleShareClick}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#0b385e] to-[#07253d] hover:from-[#082a47] hover:to-[#0b385e] text-[#dfa85b] font-bold text-xs shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer mr-auto"
        title="مشاركة هذا المحتوى عبر وسائل التواصل"
      >
        <Share2 className="w-3.5 h-3.5 text-[#dfa85b]" />
        <span>مشاركة</span>
      </button>
    </div>
  );
};
