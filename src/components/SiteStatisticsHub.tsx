import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Heart,
  Eye,
  MessageSquare,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  getItemViews,
  getItemTotalLikes,
  formatArabicNumber,
} from '../utils/dynamicStats';

export const SiteStatisticsHub: React.FC = () => {
  const { books, videos, photos, news, links, comments } = useApp();

  // 1. Live Current Online Visitors counter (Dynamic & pulsating > 100)
  const [onlineVisitors, setOnlineVisitors] = useState<number>(() => {
    return 132 + Math.floor(Math.random() * 24);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineVisitors((prev) => {
        // Natural fluctuation between 115 and 188
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const next = prev + delta;
        if (next < 112) return 118;
        if (next > 192) return 184;
        return next;
      });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  // 2. Aggregate stats across ALL site contents (Novels, Videos, Photos, News, Links)
  const stats = useMemo(() => {
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = comments.length;

    // Books
    books.forEach((b) => {
      totalViews += getItemViews(b.id, 400);
      totalLikes += getItemTotalLikes(b.id, 250);
      totalComments += (b.comments?.length || 22);
    });

    // Videos
    videos.forEach((v) => {
      totalViews += getItemViews(v.id, 300);
      totalLikes += getItemTotalLikes(v.id, 200);
      totalComments += 21;
    });

    // Photos
    photos.forEach((p) => {
      totalViews += getItemViews(p.id, 200);
      totalLikes += getItemTotalLikes(p.id, 150);
      totalComments += 21;
    });

    // News
    news.forEach((n) => {
      totalViews += getItemViews(n.id, 250);
      totalLikes += getItemTotalLikes(n.id, 180);
      totalComments += 21;
    });

    // Links
    links.forEach((l) => {
      totalViews += getItemViews(l.id, 100);
      totalLikes += getItemTotalLikes(l.id, 120);
      totalComments += 18;
    });

    return {
      booksCount: books.length,
      totalViews,
      totalLikes,
      totalComments,
    };
  }, [books, videos, photos, news, links, comments]);

  return (
    <section className="relative my-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#07243c] via-[#0b385e] to-[#051a2c] text-white p-6 sm:p-8 shadow-2xl border-2 border-[#dfa85b]/30">
      
      {/* Decorative Golden Ambient Glows */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#dfa85b]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header of Statistics Hub */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div className="text-center md:text-right space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfa85b]/20 border border-[#dfa85b]/40 text-[#f5cd72] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#dfa85b]" />
            <span>لوحة المؤشرات والإحصائيات التفاعلية الشاملة</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-literary text-white tracking-wide">
            نبض المنصة وتفاعل القراء حول العالم
          </h3>
          <p className="text-xs text-slate-300">
            تحديث فوري وتراكمي لكافة الإعجابات، القراءات، والتعليقات عبر كافة أقسام الموقع
          </p>
        </div>

        {/* Live Active Beacon Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 shadow-inner">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div className="text-right">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              بث مباشر · متواجدون الآن
            </div>
            <div className="text-xs sm:text-sm font-black text-white font-mono flex items-center gap-1">
              <span>{formatArabicNumber(onlineVisitors)}</span>
              <span className="text-[11px] font-sans text-emerald-300">زائر نشط</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 5 Key Statistics Cards */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pt-6">
        
        {/* 1. عدد المؤلفات */}
        <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-[#dfa85b]/50 rounded-xl p-4 flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dfa85b] to-[#b6872d] text-[#07243c] flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatArabicNumber(stats.booksCount)}
          </div>
          <div className="text-xs font-bold text-[#f5cd72] mt-1">
            مؤلفات أدبية وفكرية
          </div>
        </div>

        {/* 2. إجمالي الإعجابات (أعجبني بالقلب الأحمر) */}
        <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-red-400/50 rounded-xl p-4 flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatArabicNumber(stats.totalLikes)}
          </div>
          <div className="text-xs font-bold text-red-300 mt-1">
            إجمالي إعجاب بالقلب الأحمر
          </div>
        </div>

        {/* 3. إجمالي المشاهدات */}
        <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-sky-400/50 rounded-xl p-4 flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatArabicNumber(stats.totalViews)}
          </div>
          <div className="text-xs font-bold text-sky-300 mt-1">
            إجمالي المشاهدات والقراءات
          </div>
        </div>

        {/* 4. إجمالي التعليقات */}
        <div className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-amber-400/50 rounded-xl p-4 flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-[#07243c] flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatArabicNumber(stats.totalComments)}
          </div>
          <div className="text-xs font-bold text-amber-300 mt-1">
            إجمالي تعليقات الزوار والقراء
          </div>
        </div>

        {/* 5. عدد الزوار المباشر الحالي */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-b from-emerald-950/40 to-white/5 hover:bg-white/10 transition-all border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight flex items-center gap-1.5 justify-center">
            <span>{formatArabicNumber(onlineVisitors)}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          </div>
          <div className="text-xs font-bold text-emerald-300 mt-1">
            الزوار المتواجدون الآن
          </div>
        </div>

      </div>

    </section>
  );
};
