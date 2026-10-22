import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AnnouncementItem } from '../types';
import {
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  X,
  Check,
  Megaphone,
  Layers,
} from 'lucide-react';

export const HeaderAnnouncementBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementActive,
    isAuthorMode,
    setActiveSection,
    showToast,
  } = useApp();

  // Filter only active announcements for display in revolving banner
  const activeAnnouncements = announcements.filter((a) => a.isActive);

  // Quick Upcoming Event («فعالية مرتقبة 🏛️») Helper
  const upcomingEvent = announcements.find(
    (a) => a.badge?.includes('فعالية مرتقبة') || a.id === 'ann-3' || a.title?.includes('الصالون الأدبي')
  );
  const isUpcomingEventActive = upcomingEvent ? !!upcomingEvent.isActive : false;

  const handleToggleUpcomingEvent = () => {
    if (upcomingEvent) {
      const next = !upcomingEvent.isActive;
      updateAnnouncement(upcomingEvent.id, { isActive: next });
      showToast(
        next
          ? '✓ تم إظهار «فعالية مرتقبة 🏛️» في الموقع'
          : '✓ تم إخفاء «فعالية مرتقبة 🏛️» من الموقع'
      );
    } else {
      addAnnouncement({
        badge: 'فعالية مرتقبة 🏛️',
        title: 'أمسية حوارية مفتوحة وتوقيع مؤلفات في الصالون الأدبي الثقافي',
        description: 'يسعد الكاتب بلقاء القراء والمهتمين بالأدب الرصين في نقاش تفاعلي حول مستقبل الرواية',
        linkText: 'التفاصيل والتواصل للمشاركة ↗',
        linkUrl: '#contact',
        glowColor: 'emerald',
        isActive: true,
        order: 3,
      });
      showToast('✓ تم إنشاء وتفعيل «فعالية مرتقبة 🏛️» في الموقع');
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);

  // Supervisor modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [formBadge, setFormBadge] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLinkText, setFormLinkText] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formGlowColor, setFormGlowColor] = useState<AnnouncementItem['glowColor']>('gold');
  const [formIsActive, setFormIsActive] = useState(true);

  // In-UI delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Keep index within bounds if items change
  useEffect(() => {
    if (activeAnnouncements.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= activeAnnouncements.length) {
      setCurrentIndex(0);
    }
  }, [activeAnnouncements.length, currentIndex]);

  // Flip trigger
  const goToSlide = (newIndex: number, direction: 'next' | 'prev' = 'next') => {
    if (activeAnnouncements.length <= 1 || isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFlipping(false);
    }, 320);
  };

  const handleNext = () => {
    if (activeAnnouncements.length <= 1) return;
    const nextIdx = (currentIndex + 1) % activeAnnouncements.length;
    goToSlide(nextIdx, 'next');
  };

  const handlePrev = () => {
    if (activeAnnouncements.length <= 1) return;
    const prevIdx = (currentIndex - 1 + activeAnnouncements.length) % activeAnnouncements.length;
    goToSlide(prevIdx, 'prev');
  };

  // Continuous auto-rotation every 5 seconds (flips continuously like a billboard)
  useEffect(() => {
    if (isPaused || activeAnnouncements.length <= 1 || showManageModal) return;

    timerRef.current = window.setInterval(() => {
      handleNext();
    }, 5200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, activeAnnouncements.length, showManageModal]);

  const currentItem = activeAnnouncements[currentIndex];

  if (!currentItem && !isAuthorMode) {
    return null;
  }

  // Color themes for the glowing box
  const getGlowStyles = (color?: AnnouncementItem['glowColor']) => {
    switch (color) {
      case 'cyan':
        return {
          boxGlow: 'shadow-[0_0_32px_rgba(6,182,212,0.32)] border-cyan-400/80',
          gradientBg: 'bg-gradient-to-r from-[#031a2c] via-[#05263f] to-[#041c2e]',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          linkBtn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
          auraColor: 'from-cyan-500/20 via-sky-500/10 to-transparent',
          accentText: 'text-cyan-300',
        };
      case 'emerald':
        return {
          boxGlow: 'shadow-[0_0_32px_rgba(16,185,129,0.32)] border-emerald-400/80',
          gradientBg: 'bg-gradient-to-r from-[#021f1d] via-[#052e2a] to-[#03211f]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          linkBtn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
          auraColor: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          accentText: 'text-emerald-300',
        };
      case 'crimson':
        return {
          boxGlow: 'shadow-[0_0_32px_rgba(244,63,94,0.32)] border-rose-400/80',
          gradientBg: 'bg-gradient-to-r from-[#240814] via-[#350d1e] to-[#260915]',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          linkBtn: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]',
          auraColor: 'from-rose-500/20 via-pink-500/10 to-transparent',
          accentText: 'text-rose-300',
        };
      case 'purple':
        return {
          boxGlow: 'shadow-[0_0_32px_rgba(168,85,247,0.32)] border-purple-400/80',
          gradientBg: 'bg-gradient-to-r from-[#190a2c] via-[#260f42] to-[#1b0b30]',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
          linkBtn: 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]',
          auraColor: 'from-purple-500/20 via-indigo-500/10 to-transparent',
          accentText: 'text-purple-300',
        };
      case 'gold':
      default:
        return {
          boxGlow: 'shadow-[0_0_32px_rgba(245,158,11,0.32)] border-amber-400/80',
          gradientBg: 'bg-gradient-to-r from-[#0a233a] via-[#0d2d4a] to-[#092035]',
          badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
          linkBtn: 'bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] shadow-[0_0_15px_rgba(223,168,91,0.4)]',
          auraColor: 'from-amber-400/20 via-yellow-500/10 to-transparent',
          accentText: 'text-amber-300',
        };
    }
  };

  const currentStyles = getGlowStyles(currentItem?.glowColor);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url?: string) => {
    if (!url) return;
    if (url.startsWith('#')) {
      e.preventDefault();
      const section = url.replace('#', '');
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setIsCreatingNew(false);
    setFormBadge(item.badge);
    setFormTitle(item.title);
    setFormDesc(item.description || '');
    setFormLinkText(item.linkText || '');
    setFormLinkUrl(item.linkUrl || '');
    setFormGlowColor(item.glowColor || 'gold');
    setFormIsActive(item.isActive);
    setShowManageModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsCreatingNew(true);
    setFormBadge('إعلان هام ✨');
    setFormTitle('');
    setFormDesc('');
    setFormLinkText('اضغط هنا للتفاصيل ↗');
    setFormLinkUrl('#');
    setFormGlowColor('gold');
    setFormIsActive(true);
    setShowManageModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (isCreatingNew) {
      addAnnouncement({
        badge: formBadge.trim() || 'إعلان ✨',
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        linkText: formLinkText.trim() || undefined,
        linkUrl: formLinkUrl.trim() || undefined,
        glowColor: formGlowColor,
        isActive: formIsActive,
      });
    } else if (editingItem) {
      updateAnnouncement(editingItem.id, {
        badge: formBadge.trim(),
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        linkText: formLinkText.trim() || undefined,
        linkUrl: formLinkUrl.trim() || undefined,
        glowColor: formGlowColor,
        isActive: formIsActive,
      });
    }

    setShowManageModal(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* GLOWING BOX CONTAINER */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`relative w-full rounded-2xl border-2 transition-all duration-500 overflow-hidden ${currentStyles.boxGlow} ${currentStyles.gradientBg}`}
      >
        {/* Subtle Ambient Pulse Light */}
        <div
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${currentStyles.auraColor} blur-3xl opacity-75 pointer-events-none animate-pulse`}
        />
        <div
          className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tl ${currentStyles.auraColor} blur-3xl opacity-75 pointer-events-none animate-pulse`}
        />

        {/* Supervisor Quick Toolbar Bar (Visible only to supervisor) */}
        {isAuthorMode && (
          <div className="relative z-20 bg-black/50 border-b border-white/10 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#dfa85b] flex items-center gap-1">
                <Settings className="w-3 h-3" />
                <span>تحكم المشرف بالإعلانات</span>
              </span>
              <span className="text-slate-400">
                (المعروض: {currentIndex + 1} من {activeAnnouncements.length})
              </span>
              {currentItem && !currentItem.isActive && (
                <span className="bg-rose-600/80 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                  معطل عن العامة
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة إعلان جديد</span>
              </button>

              {/* Quick Toggle for «فعالية مرتقبة 🏛️» */}
              <button
                type="button"
                onClick={handleToggleUpcomingEvent}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                  isUpcomingEventActive
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                }`}
                title="إخفاء أو إظهار «فعالية مرتقبة 🏛️» من الموقع"
              >
                {isUpcomingEventActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>فعالية مرتقبة 🏛️: {isUpcomingEventActive ? 'إخفاء' : 'إظهار'}</span>
              </button>

              {currentItem && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(currentItem)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/80 hover:bg-amber-500 text-slate-950 font-bold transition cursor-pointer shadow-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>

                  {deletingId === currentItem.id ? (
                    <div className="flex items-center gap-1 bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-500">
                      <span className="text-[10px] text-rose-200">حذف؟</span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteAnnouncement(currentItem.id);
                          setDeletingId(null);
                        }}
                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        نعم
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-1 py-0.5 text-slate-300 hover:text-white cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(currentItem.id)}
                      className="p-1 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 transition cursor-pointer"
                      title="حذف هذا الإعلان"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (activeAnnouncements.length > 0) {
                    openEditModal(activeAnnouncements[0]);
                  } else {
                    openCreateModal();
                  }
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer"
                title="إدارة قائمة الإعلانات"
              >
                <Layers className="w-3 h-3" />
                <span>إدارة الكل ({announcements.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* FLIPPING SCREEN CONTENT AREA */}
        {currentItem ? (
          <div
            className={`relative z-10 px-5 py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ease-out ${
              isFlipping
                ? flipDirection === 'next'
                  ? 'opacity-0 -translate-y-3 scale-98'
                  : 'opacity-0 translate-y-3 scale-98'
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            {/* Left/Middle Content: Badge + Title + Description */}
            <div className="flex-1 space-y-1.5 text-center md:text-right w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border backdrop-blur-sm shadow-xs ${currentStyles.badgeBg}`}
                >
                  <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>{currentItem.badge}</span>
                </span>

                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {isPaused ? '⏸ متوقف مؤقتاً للتصفح' : '🔄 يتغير بالتناوب'}
                </span>
              </div>

              {/* Announcement Title */}
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-literary leading-snug drop-shadow-sm">
                {currentItem.title}
              </h3>

              {/* Optional Description */}
              {currentItem.description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {currentItem.description}
                </p>
              )}
            </div>

            {/* Right: Action Link & Pagination Controls */}
            <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center gap-2.5 shrink-0 w-full md:w-auto">
              {/* Linked Button */}
              {currentItem.linkUrl && (
                <a
                  href={currentItem.linkUrl}
                  onClick={(e) => handleLinkClick(e, currentItem.linkUrl)}
                  target={currentItem.linkUrl.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all transform hover:scale-105 cursor-pointer whitespace-nowrap ${currentStyles.linkBtn}`}
                >
                  <span>{currentItem.linkText || 'معرفة التفاصيل والمسار'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Page Flipping Navigation Controls (Dots & Arrows) */}
              {activeAnnouncements.length > 1 && (
                <div className="flex items-center justify-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-inner">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="text-slate-300 hover:text-white p-0.5 rounded-full transition cursor-pointer"
                    aria-label="الإعلان السابق"
                    title="السابق"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex items-center gap-1.5 px-1">
                    {activeAnnouncements.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goToSlide(idx, idx > currentIndex ? 'next' : 'prev')}
                        className={`transition-all rounded-full cursor-pointer ${
                          idx === currentIndex
                            ? `w-4 h-1.5 ${currentStyles.accentText} bg-current shadow-xs`
                            : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`انتقال للإعلان رقم ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-slate-300 hover:text-white p-0.5 rounded-full transition cursor-pointer"
                    aria-label="الإعلان التالي"
                    title="التالي"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] text-slate-300 font-mono tabular-nums pr-1 border-r border-white/20">
                    {currentIndex + 1}/{activeAnnouncements.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-white/70 space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-[#dfa85b]" />
            <p className="text-sm font-bold">لا يوجد إعلانات منشورة حالياً</p>
            {isAuthorMode && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-1.5 bg-[#dfa85b] text-[#07243c] font-black text-xs rounded-xl hover:bg-[#c4924c] transition shadow cursor-pointer"
              >
                + إضافة أول إعلان الآن
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUPERVISOR MANAGEMENT MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border-2 border-[#0b385e]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0b385e] text-white">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-[#dfa85b]" />
                <h3 className="text-base font-bold font-literary">
                  {isCreatingNew ? 'إضافة إعلان نصي متوهج جديد' : 'تعديل الإعلان في الهيدر'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-white hover:text-[#dfa85b] p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List & Edit Form Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Existing Announcements Quick Switcher if editing */}
              {!isCreatingNew && announcements.length > 1 && (
                <div className="bg-[#f0f6fa] p-3 rounded-xl border border-[#d6e2ed] space-y-2">
                  <span className="font-bold text-[#0b385e] block">اختيار إعلان للتعديل عليه:</span>
                  <div className="flex flex-wrap gap-2">
                    {announcements.map((a, idx) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => openEditModal(a)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          editingItem?.id === a.id
                            ? 'bg-[#0b385e] text-white shadow-xs'
                            : 'bg-white text-slate-700 border hover:bg-slate-50'
                        }`}
                      >
                        <span>{idx + 1}. {a.badge}</span>
                        {!a.isActive && <span className="text-rose-600 text-[9px]">(معطل)</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      + جديد
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">شارة الإعلان (Badge)</label>
                  <input
                    type="text"
                    required
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="مثال: إصدار حديث ✨"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-[#f8fafc] text-gray-900 focus:outline-none focus:border-[#0b385e]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">لون التوهج والإشعاع</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'gold' as const, label: 'ذهبي مذهب', color: 'bg-amber-400' },
                      { id: 'cyan' as const, label: 'سيان مشع', color: 'bg-cyan-400' },
                      { id: 'emerald' as const, label: 'زمردي', color: 'bg-emerald-400' },
                      { id: 'crimson' as const, label: 'قرمزي', color: 'bg-rose-400' },
                      { id: 'purple' as const, label: 'بنفسجي', color: 'bg-purple-400' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormGlowColor(c.id)}
                        className={`p-1.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          formGlowColor === c.id
                            ? 'border-[#0b385e] bg-[#edf4fa] font-bold text-[#0b385e]'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${c.color} shadow-xs`} />
                        <span className="text-[10px] leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نص الإعلان الرئيسي (العنوان)</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: صدر حديثاً: الطبعة الجديدة من رواية بين الواقع والحلم متوفرة الآن..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#f8fafc] text-gray-900 font-semibold focus:outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تفاصيل إضافية مقتضبة (اختياري)</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="سطر إضافي يوضح موعد الفعالية أو مكان التواجد أو نبذة ترويجية..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-[#f8fafc] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نص زر الرابط</label>
                  <input
                    type="text"
                    value={formLinkText}
                    onChange={(e) => setFormLinkText(e.target.value)}
                    placeholder="مثال: تصفح وقراءة الرواية الآن ↗"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-[#f8fafc] text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرابط الموجه (URL أو قسم)</label>
                  <input
                    type="text"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://... أو رابط داخلي مثل #books أو #contact"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-[#f8fafc] text-gray-900 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    يمكن وضع رابط خارجي (موقع، تيكتوك، متجر) أو رابط داخلي مثل #books, #videos, #news
                  </span>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann-active-check"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0b385e] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="ann-active-check" className="font-bold text-slate-800 cursor-pointer">
                  تفعيل الإعلان (ظهوره للعامة ولزوار الموقع)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                {!isCreatingNew && editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteAnnouncement(editingItem.id);
                      setShowManageModal(false);
                    }}
                    className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف هذا الإعلان</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0b385e] hover:bg-[#082a47] text-white font-bold rounded-xl transition shadow cursor-pointer"
                  >
                    {isCreatingNew ? 'نشر الإعلان' : 'حفظ التعديلات'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
