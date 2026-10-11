import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LinkItem } from '../types';
import { ContentInteractionBar } from './ContentInteractionBar';
import {
  Globe,
  Plus,
  ExternalLink,
  Book,
  Newspaper,
  Video,
  Twitter,
  Trash2,
  Send,
  Edit2,
  Share2,
  Sparkles,
} from 'lucide-react';

// Brand-specific SVG icons with authentic graphics
const BrandIcon: React.FC<{ type: LinkItem['iconType']; className?: string }> = ({ type, className = 'w-6 h-6' }) => {
  switch (type) {
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.897 2.897 0 0 1 2.308-4.639c.316 0 .622.051.908.146V9.429a6.34 6.34 0 0 0-.908-.066 6.342 6.342 0 1 0 6.338 6.342V8.654a8.196 8.196 0 0 0 4.77 1.523V6.732a4.814 4.814 0 0 1-1-.046z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case 'book':
      return <Book className={className} />;
    case 'newspaper':
      return <Newspaper className={className} />;
    default:
      return <Globe className={className} />;
  }
};

// Styling profiles for each brand with glowing radiant effects on hover
interface BrandStyle {
  cardHover: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonClass: string;
  glowAura: string;
}

const getBrandStyles = (type: LinkItem['iconType']): BrandStyle => {
  switch (type) {
    case 'tiktok':
      return {
        cardHover: 'hover:border-cyan-400 hover:shadow-[0_12px_36px_rgba(0,242,254,0.24)] hover:bg-gradient-to-br hover:from-white hover:via-[#f0fcfd] hover:to-[#e6f9fc]',
        iconBg: 'bg-[#000000] text-cyan-400 shadow-md shadow-cyan-500/20 border border-cyan-400/40',
        iconColor: 'text-white',
        badgeBg: 'bg-cyan-50',
        badgeText: 'text-cyan-900',
        badgeBorder: 'border-cyan-200',
        buttonClass: 'bg-black text-white hover:bg-slate-900 border border-cyan-400/50 shadow-sm',
        glowAura: 'from-cyan-400/10 to-rose-400/10',
      };
    case 'youtube':
      return {
        cardHover: 'hover:border-red-500 hover:shadow-[0_12px_36px_rgba(239,68,68,0.22)] hover:bg-gradient-to-br hover:from-white hover:via-red-50/40 hover:to-orange-50/30',
        iconBg: 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-500/25',
        iconColor: 'text-white',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-800',
        badgeBorder: 'border-red-200',
        buttonClass: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        glowAura: 'from-red-500/10 to-orange-500/10',
      };
    case 'instagram':
      return {
        cardHover: 'hover:border-pink-500 hover:shadow-[0_12px_36px_rgba(236,72,153,0.24)] hover:bg-gradient-to-br hover:from-white hover:via-pink-50/40 hover:to-purple-50/30',
        iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white shadow-md shadow-pink-500/25',
        iconColor: 'text-white',
        badgeBg: 'bg-pink-50',
        badgeText: 'text-pink-800',
        badgeBorder: 'border-pink-200',
        buttonClass: 'bg-gradient-to-r from-[#dc2743] to-[#bc1888] text-white hover:opacity-95 shadow-sm',
        glowAura: 'from-pink-500/10 to-purple-500/10',
      };
    case 'twitter':
      return {
        cardHover: 'hover:border-slate-800 hover:shadow-[0_12px_36px_rgba(15,23,42,0.20)] hover:bg-gradient-to-br hover:from-white hover:via-slate-50 hover:to-slate-100/60',
        iconBg: 'bg-black text-white shadow-md shadow-slate-900/20 border border-slate-800',
        iconColor: 'text-white',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-900',
        badgeBorder: 'border-slate-300',
        buttonClass: 'bg-black text-white hover:bg-slate-900 shadow-sm',
        glowAura: 'from-slate-700/10 to-slate-900/10',
      };
    case 'telegram':
      return {
        cardHover: 'hover:border-sky-400 hover:shadow-[0_12px_36px_rgba(56,189,248,0.26)] hover:bg-gradient-to-br hover:from-white hover:via-sky-50/50 hover:to-blue-50/30',
        iconBg: 'bg-gradient-to-br from-[#2AABEE] to-[#229ED9] text-white shadow-md shadow-sky-500/30',
        iconColor: 'text-white',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-800',
        badgeBorder: 'border-sky-200',
        buttonClass: 'bg-[#229ED9] text-white hover:bg-[#1d88bb] shadow-sm',
        glowAura: 'from-sky-400/15 to-blue-400/10',
      };
    case 'facebook':
      return {
        cardHover: 'hover:border-blue-600 hover:shadow-[0_12px_36px_rgba(37,99,235,0.22)] hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-indigo-50/30',
        iconBg: 'bg-gradient-to-br from-[#1877F2] to-[#0d65d9] text-white shadow-md shadow-blue-500/25',
        iconColor: 'text-white',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-800',
        badgeBorder: 'border-blue-200',
        buttonClass: 'bg-[#1877F2] text-white hover:bg-[#125ebd] shadow-sm',
        glowAura: 'from-blue-500/10 to-indigo-500/10',
      };
    case 'whatsapp':
      return {
        cardHover: 'hover:border-emerald-500 hover:shadow-[0_12px_36px_rgba(16,185,129,0.26)] hover:bg-gradient-to-br hover:from-white hover:via-emerald-50/50 hover:to-teal-50/30',
        iconBg: 'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md shadow-emerald-500/30',
        iconColor: 'text-white',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-200',
        buttonClass: 'bg-[#128C7E] text-white hover:bg-[#0e7065] shadow-sm',
        glowAura: 'from-emerald-400/15 to-teal-400/10',
      };
    case 'linkedin':
      return {
        cardHover: 'hover:border-blue-700 hover:shadow-[0_12px_36px_rgba(29,78,216,0.22)] hover:bg-gradient-to-br hover:from-white hover:via-blue-50/40 hover:to-indigo-50/30',
        iconBg: 'bg-gradient-to-br from-[#0A66C2] to-[#004182] text-white shadow-md shadow-blue-700/25',
        iconColor: 'text-white',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-900',
        badgeBorder: 'border-blue-200',
        buttonClass: 'bg-[#0A66C2] text-white hover:bg-[#084e96] shadow-sm',
        glowAura: 'from-blue-600/10 to-indigo-600/10',
      };
    case 'book':
      return {
        cardHover: 'hover:border-amber-500 hover:shadow-[0_12px_36px_rgba(245,158,11,0.26)] hover:bg-gradient-to-br hover:from-white hover:via-amber-50/50 hover:to-yellow-50/30',
        iconBg: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white shadow-md shadow-amber-500/25',
        iconColor: 'text-white',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-200',
        buttonClass: 'bg-[#d97706] text-white hover:bg-[#b45309] shadow-sm',
        glowAura: 'from-amber-400/15 to-yellow-400/10',
      };
    case 'newspaper':
      return {
        cardHover: 'hover:border-indigo-500 hover:shadow-[0_12px_36px_rgba(99,102,241,0.24)] hover:bg-gradient-to-br hover:from-white hover:via-indigo-50/40 hover:to-purple-50/30',
        iconBg: 'bg-gradient-to-br from-[#4f46e5] to-[#4338ca] text-white shadow-md shadow-indigo-500/25',
        iconColor: 'text-white',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-800',
        badgeBorder: 'border-indigo-200',
        buttonClass: 'bg-[#4f46e5] text-white hover:bg-[#4338ca] shadow-sm',
        glowAura: 'from-indigo-400/15 to-purple-400/10',
      };
    default:
      return {
        cardHover: 'hover:border-[#0b385e] hover:shadow-[0_12px_36px_rgba(11,56,94,0.24)] hover:bg-gradient-to-br hover:from-white hover:via-slate-50 hover:to-blue-50/40',
        iconBg: 'bg-gradient-to-br from-[#0b385e] to-[#07243c] text-[#dfa85b] shadow-md shadow-[#0b385e]/25',
        iconColor: 'text-[#dfa85b]',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-[#0b385e]',
        badgeBorder: 'border-slate-200',
        buttonClass: 'bg-[#0b385e] text-white hover:bg-[#07243c] shadow-sm',
        glowAura: 'from-blue-500/10 to-amber-500/10',
      };
  }
};

// Intelligent auto-detection of platform based on URL
const detectIconTypeFromUrl = (url: string, current: LinkItem['iconType']): LinkItem['iconType'] => {
  const low = url.toLowerCase();
  if (low.includes('tiktok.com')) return 'tiktok';
  if (low.includes('youtube.com') || low.includes('youtu.be')) return 'youtube';
  if (low.includes('instagram.com')) return 'instagram';
  if (low.includes('twitter.com') || low.includes('x.com')) return 'twitter';
  if (low.includes('t.me') || low.includes('telegram')) return 'telegram';
  if (low.includes('facebook.com') || low.includes('fb.com')) return 'facebook';
  if (low.includes('wa.me') || low.includes('whatsapp.com')) return 'whatsapp';
  if (low.includes('linkedin.com')) return 'linkedin';
  if (low.includes('goodreads.com')) return 'book';
  return current;
};

export const LinksSection: React.FC = () => {
  const {
    links,
    addLink,
    isAuthorMode,
    deleteLink,
    setEditingLink,
    openShareModal,
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmDeleteLinkId, setConfirmDeleteLinkId] = useState<string | null>(null);

  // New Link form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('منصات التواصل');
  const [newIcon, setNewIcon] = useState<LinkItem['iconType']>('globe');

  const categories = ['all', ...Array.from(new Set(links.map((l) => l.category)))];

  const filteredLinks = selectedCategory === 'all'
    ? links
    : links.filter((l) => l.category === selectedCategory);

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const resolvedIcon = detectIconTypeFromUrl(newUrl.trim(), newIcon);

    addLink({
      title: newTitle.trim(),
      url: newUrl.trim(),
      description: newDesc.trim() || 'رابط موثق معتمد للكاتب أ. نبيل بركات',
      category: newCategory,
      iconType: resolvedIcon,
    });

    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setShowAddForm(false);
    showToast('تمت إضافة الرابط الجديد بنجاح');
  };

  return (
    <div className="space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d6e0ea] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#c4924c] font-bold">
            <Sparkles className="w-4 h-4 text-[#dfa85b]" />
            <span>دليل المنصات والمواقع الشريكة</span>
            <span aria-hidden="true">·</span>
            <span>{links.length} روابط معتمدة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b385e] font-literary">
            دليل الروابط ومنصات التواصل
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] max-w-2xl">
            مجموعة مختارة من المنصات الرقمية الرسمية، صفحات المؤلف على شبكات التواصل، دور النشر الشريكة، والمصادر الأدبية والفكرية الموصى بها.
          </p>
        </div>

        {/* Supervisor add link button */}
        {isAuthorMode && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082c4a] rounded-xl transition shadow-sm whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#dfa85b]" />
            <span>{showAddForm ? 'إلغاء' : 'إضافة رابط أو منصة جديدة'}</span>
          </button>
        )}
      </div>

      {/* Add Link Form Drawer */}
      {isAuthorMode && showAddForm && (
        <form
          onSubmit={handleAddLinkSubmit}
          className="p-6 rounded-2xl bg-white border-2 border-[#0b385e]/30 space-y-4 shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#edf2f7] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#0b385e] flex items-center gap-2 font-literary">
              <Globe className="w-5 h-5 text-[#c4924c]" />
              <span>إضافة رابط أو منصة اجتماعية جديدة</span>
            </h3>
            <span className="text-xs text-[#64748b]">يظهر مباشرة لزوار الموقع</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">اسم المنصة أو الموقع</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: حساب تيكتوك الرسمي"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">الرابط الإلكتروني (URL)</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewUrl(val);
                  setNewIcon(detectIconTypeFromUrl(val, newIcon));
                }}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#475569] mb-1 font-semibold">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e]"
              >
                <option value="منصات التواصل">منصات التواصل</option>
                <option value="المواقع الرئيسية">المواقع الرئيسية</option>
                <option value="دور النشر والتوزيع">دور النشر والتوزيع</option>
                <option value="مؤسسات ثقافية">مؤسسات ثقافية</option>
              </select>
            </div>
          </div>

          {/* Social Platform Icon Selector */}
          <div>
            <label className="block text-xs text-[#475569] mb-2 font-semibold">اختر أيقونة المنصة الاجتماعية:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {[
                { type: 'tiktok' as const, label: 'تيكتوك' },
                { type: 'youtube' as const, label: 'يوتيوب' },
                { type: 'instagram' as const, label: 'إنستغرام' },
                { type: 'twitter' as const, label: 'تويتر / X' },
                { type: 'telegram' as const, label: 'تيليجرام' },
                { type: 'facebook' as const, label: 'فيسبوك' },
                { type: 'whatsapp' as const, label: 'واتساب' },
                { type: 'linkedin' as const, label: 'لينكد إن' },
                { type: 'book' as const, label: 'كتاب / ناشر' },
                { type: 'newspaper' as const, label: 'صحافة / مقالات' },
                { type: 'globe' as const, label: 'موقع ويب عام' },
              ].map((item) => {
                const isSelected = newIcon === item.type;
                const style = getBrandStyles(item.type);
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setNewIcon(item.type)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'border-[#0b385e] bg-[#f0f6fa] text-[#0b385e] shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center p-1 shrink-0 ${style.iconBg}`}>
                      <BrandIcon type={item.type} className="w-4 h-4 fill-current" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#475569] mb-1 font-semibold">وصف مقتضب للرابط</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="اكتب نبذة قصيرة عما يجده الزائر عند فتح هذا الرابط..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-gray-900 focus:outline-none focus:border-[#0b385e] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-gray-600 hover:text-black cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0b385e] hover:bg-[#082a47] rounded-xl transition cursor-pointer shadow-sm"
            >
              حفظ ونشر الرابط
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === c
                ? 'bg-[#0b385e] text-white shadow-xs'
                : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#d6e0ea]'
            }`}
          >
            {c === 'all' ? 'جميع الروابط' : c}
          </button>
        ))}
      </div>

      {/* Links Grid with Glowing Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLinks.map((link) => {
          const resolvedType = detectIconTypeFromUrl(link.url, link.iconType);
          const style = getBrandStyles(resolvedType);

          return (
            <div
              key={link.id}
              className={`relative p-5 rounded-2xl bg-white border border-[#d6e0ea] flex flex-col justify-between shadow-xs transition-all duration-300 group space-y-4 overflow-hidden ${style.cardHover}`}
            >
              {/* Subtle radiant glow ambient background */}
              <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br ${style.glowAura} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  {/* Brand Aesthetic Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 transition-transform duration-300 group-hover:scale-110 ${style.iconBg}`}>
                    <BrandIcon type={resolvedType} className="w-6 h-6 fill-current" />
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}>
                    {link.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0b385e] font-literary group-hover:text-slate-900 transition-colors">
                    {link.title}
                  </h3>

                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 mt-1">
                    {link.description}
                  </p>

                  {/* Interaction Bar (المشاهدات، لايك قلب أحمر، التعليقات، والمشاركة) */}
                  <div className="pt-1">
                    <ContentInteractionBar
                      itemId={link.id}
                      itemTitle={`رابط: ${link.title}`}
                      itemType="link"
                      commentsCount={20}
                      itemUrl={link.url}
                      itemDescription={link.description}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#edf2f7] flex items-center justify-between relative z-10">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs group/btn ${style.buttonClass}`}
                >
                  <span>زيارة المنصة</span>
                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </a>

                {/* Supervisor & Share Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `رابط: ${link.title}`,
                        url: link.url,
                        description: link.description,
                        type: 'link',
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#0b385e] hover:bg-slate-50 transition cursor-pointer"
                    title="مشاركة الرابط"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  {isAuthorMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingLink(link)}
                        className="p-1.5 text-[#0b385e] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="تعديل الرابط"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteLinkId === link.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300 animate-in fade-in">
                          <span className="text-[10px] font-bold text-rose-700">حذف؟</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteLink(link.id);
                              setConfirmDeleteLinkId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition shadow-xs cursor-pointer"
                            title="تأكيد حذف الرابط"
                          >
                            نعم
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLinkId(null)}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-[10px] transition cursor-pointer"
                            title="إلغاء"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLinkId(link.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="حذف الرابط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
