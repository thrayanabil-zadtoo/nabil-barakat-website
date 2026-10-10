import React from 'react';
import { Feather, Sparkles } from 'lucide-react';

const quotes = [
  'لا ننتقم.. فالثمرة الفاسدة تسقط وحدها، والحياة كفيلة بترتيب الأقدار والعدالة.',
  'الحب فعلٌ صادق، والمودة أسلوب حياة، وسلام الروح غاية المتقين.',
  'كنّا هنا.. وتركنا أثراً لا يمحوه غياب، فالكلمة الصادقة باقية أبد الدهر.',
  'في قلب كل عاشق حكاية، وفي عمق كل ألم بذرة وعي وبصيرة.',
  'القراءة ملاذ الأرواح، والصفحات وطن يسكنه من أدرك بهاء المعنى وسحر البيان.',
  'إن لم تكن نوراً لمن تحب، فلا تكن عتمة تطفئ قناديل روحه.',
  'بين الواقع والحلم خطوة إيمان.. ومن صدق في سعيه بلغ مبتغاه.',
];

export const PoeticMarquee: React.FC = () => {
  return (
    <div
      aria-label="شريط ومضات أدبية"
      className="relative w-full bg-[#051726] border-y border-[#dfa85b]/30 py-2.5 overflow-hidden text-white shadow-inner select-none"
    >
      {/* Subtle background golden ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#dfa85b]/10 via-transparent to-[#dfa85b]/10 pointer-events-none" />

      {/* Floating Feather Label (Fixed on Right in Arabic RTL) */}
      <div className="absolute right-0 top-0 bottom-0 z-10 px-3 bg-gradient-to-l from-[#051726] via-[#051726]/95 to-transparent flex items-center gap-1.5 text-xs font-bold text-[#dfa85b]">
        <Feather className="w-3.5 h-3.5 animate-pulse" />
        <span className="hidden sm:inline font-literary">ومضات أدبية:</span>
      </div>

      {/* Left Fade Scrim */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#051726] to-transparent z-10 pointer-events-none" />

      {/* Marquee Content */}
      <div className="flex overflow-hidden group">
        <div className="flex shrink-0 animate-marquee items-center gap-8 text-xs sm:text-sm font-literary pr-24 group-hover:[animation-play-state:paused]">
          {quotes.concat(quotes).map((q, idx) => (
            <div key={idx} className="flex items-center gap-4 text-slate-200">
              <span className="hover:text-amber-300 transition-colors cursor-default whitespace-nowrap">
                ❝ {q} ❞
              </span>
              <Sparkles className="w-3 h-3 text-[#dfa85b] shrink-0 opacity-80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
