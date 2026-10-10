import React from 'react';
import { Pin, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';

interface ItemOrderPinControlsProps {
  isPinned?: boolean;
  onTogglePin: () => void;
  currentIndex: number;
  totalCount: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSetPosition?: (newPosition: number) => void;
  variant?: 'card' | 'row';
}

export const ItemOrderPinControls: React.FC<ItemOrderPinControlsProps> = ({
  isPinned = false,
  onTogglePin,
  currentIndex,
  totalCount,
  onMoveUp,
  onMoveDown,
  onSetPosition,
  variant = 'card',
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex flex-wrap items-center justify-between gap-1.5 p-1.5 rounded-xl border transition select-none ${
        isPinned
          ? 'bg-amber-500/10 border-amber-400/50 text-[#07243c]'
          : 'bg-slate-100/90 border-slate-200 text-slate-700'
      } ${variant === 'card' ? 'mt-2 text-xs' : 'text-xs'}`}
    >
      {/* Pin Toggle Button */}
      <button
        type="button"
        onClick={onTogglePin}
        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
          isPinned
            ? 'bg-amber-400 hover:bg-amber-500 text-[#07243c]'
            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
        }`}
        title={isPinned ? 'إلغاء التثبيت من المقدمة' : 'تثبيت هذا العنصر ليكون دائماً في المقدمة'}
      >
        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current rotate-45' : ''}`} />
        <span>{isPinned ? 'مثبت بالمقدمة 📌' : 'تثبيت بالصدارة'}</span>
      </button>

      {/* Position Rank & Ordering Buttons */}
      <div className="flex items-center gap-1">
        {/* Dropdown position selector (1, 2, 3...) */}
        {onSetPosition && totalCount > 1 && (
          <div className="relative flex items-center">
            <span className="text-[10px] text-slate-500 ml-1 font-bold">الترتيب:</span>
            <select
              value={currentIndex + 1}
              onChange={(e) => onSetPosition(Number(e.target.value))}
              className="bg-white text-[#0b385e] border border-slate-300 font-black text-xs rounded-lg px-2 py-0.5 outline-none cursor-pointer appearance-none pl-5 shadow-2xs"
              title="اختر الترتيب المباشر (الأول، الثاني، الثالث...)"
            >
              {[...Array(totalCount)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i === 0 ? 'الأول (1)' : i === 1 ? 'الثاني (2)' : i === 2 ? 'الثالث (3)' : `المركز ${i + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute left-1 pointer-events-none" />
          </div>
        )}

        {/* Up / Down Stepper Arrows */}
        {onMoveUp && (
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={onMoveUp}
            className="p-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="تقديم الترتيب خطوة للأمام"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}

        {onMoveDown && (
          <button
            type="button"
            disabled={currentIndex >= totalCount - 1}
            onClick={onMoveDown}
            className="p-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="تأخير الترتيب خطوة للخلف"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
