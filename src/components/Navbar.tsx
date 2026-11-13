import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Home,
  BookOpen,
  Video,
  Image as ImageIcon,
  Newspaper,
  Link2,
  Mail,
  Lock,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Settings,
  FileText,
  Users,
  Smartphone,
  Download,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    isAuthorMode,
    setIsAdminPanelOpen,
    setIsLoginModalOpen,
    logoutSupervisor,
    messages,
  } = useApp();

  const { isInstalled, triggerInstall } = usePWAInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const unreadMessagesCount = messages.filter((m) => m.status === 'unread').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'community', label: 'المجتمع', icon: Users },
    { id: 'books', label: 'المؤلفات', icon: BookOpen },
    { id: 'licenses', label: 'تراخيص المؤلف', icon: ShieldCheck },
    { id: 'videos', label: 'فيديو يجسد الروايات', icon: Video },
    { id: 'photos', label: 'معرض الصور واللوحات', icon: ImageIcon },
    { id: 'news', label: 'صورة في خبر', icon: Newspaper },
    { id: 'links', label: 'الروابط والمواقع', icon: Link2 },
    { id: 'contact', label: 'تواصل معي', icon: Mail },
    { id: 'cv', label: 'خدمة مجانية C.V', icon: FileText, highlight: true },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInstallAction = () => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    void triggerInstall();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a385c] text-white shadow-md border-b border-[#082a47]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Navigation Tabs (Right to Left matching user's screenshot) */}
        <nav className="hidden md:flex items-center gap-1.5 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-all rounded-lg cursor-pointer ${
                  isActive
                    ? 'bg-[#dfa85b] text-[#092b45] font-bold shadow-sm'
                    : item.highlight
                    ? 'bg-[#dfa85b]/15 text-[#dfa85b] hover:bg-[#dfa85b]/25 border border-[#dfa85b]/40 font-bold'
                    : 'text-[#e5edf5] hover:text-white hover:bg-[#0f4672]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight && !isActive ? 'text-[#dfa85b]' : ''}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#dfa85b] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile menu toggle (Three-bars hamburger) */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#e5edf5] hover:text-white cursor-pointer"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-sm text-[#f6ebd9]">الكاتب أ. نبيل بركات</span>
        </div>

        {/* Left Side: Supervisor Controls + Desktop Three-Bars Menu */}
        <div className="flex items-center gap-1.5">

          {/* Supervisor Specific Controls */}
          {isAuthorMode && (
            <>
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border bg-[#dfa85b] border-[#c4924c] text-[#092b45] shadow transition cursor-pointer"
                title="لوحة تحكم المشرف وإدارة المحتوى"
              >
                <Settings className="w-3.5 h-3.5 text-[#092b45]" />
                <span>لوحة التحكم</span>
                {unreadMessagesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                )}
              </button>
              <button
                onClick={logoutSupervisor}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 transition cursor-pointer"
                title="تسجيل خروج المشرف وقفل الصلاحيات"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </>
          )}

          {/* Desktop Three-Bars Hamburger Menu (contains PWA Install command) */}
          <div className="hidden md:block relative" ref={desktopMenuRef}>
            <button
              type="button"
              onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
              className="p-2 rounded-lg text-[#e5edf5] hover:text-white hover:bg-[#0f4672] border border-white/15 transition cursor-pointer flex items-center justify-center"
              aria-label="القائمة السريعة وتثبيت التطبيق"
              title="القائمة السريعة وتثبيت الموقع كتطبيق"
            >
              {desktopMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {desktopMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-[#07243c] border border-[#dfa85b]/40 rounded-xl shadow-2xl p-2 space-y-1.5 z-50">
                <button
                  type="button"
                  onClick={handleInstallAction}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isInstalled
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gradient-to-r from-[#dfa85b] to-[#c5943b] hover:from-[#ecc07d] hover:to-[#d3a043] text-[#07243c] shadow-sm'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isInstalled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Smartphone className="w-4 h-4 shrink-0" />
                    )}
                    <span>{isInstalled ? 'الموقع مُثبّت بالفعل كتطبيق' : 'تثبيت الموقع كتطبيق'}</span>
                  </span>
                  {!isInstalled && <Download className="w-3.5 h-3.5 shrink-0" />}
                </button>

                {!isAuthorMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#cbe0f0] hover:bg-[#0f4672] hover:text-white transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>دخول المشرف</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Three-bars menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#082e4d] border-b border-[#06223b] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                  isActive
                    ? 'bg-[#dfa85b] text-[#092b45] font-bold'
                    : 'text-[#e5edf5] hover:bg-[#0e426d]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* PWA Install Command inside the Three-Bars Mobile Menu */}
          <div className="pt-2 mt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleInstallAction}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                isInstalled
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-[#dfa85b] to-[#c5943b] text-[#07243c] shadow-md'
              }`}
            >
              <span className="flex items-center gap-2">
                {isInstalled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                <span>{isInstalled ? 'الموقع مُثبّت بالفعل كتطبيق' : 'تثبيت الموقع كتطبيق'}</span>
              </span>
              {!isInstalled && <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
