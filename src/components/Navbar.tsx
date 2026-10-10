import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    isAuthorMode,
    setIsAuthorMode,
    setIsAdminPanelOpen,
    setIsLoginModalOpen,
    logoutSupervisor,
    messages,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadMessagesCount = messages.filter((m) => m.status === 'unread').length;

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'books', label: 'المؤلفات', icon: BookOpen },
    { id: 'videos', label: 'الفيديوهات', icon: Video },
    { id: 'photos', label: 'معرض الوسائط', icon: ImageIcon },
    { id: 'news', label: 'صورة في خبر', icon: Newspaper },
    { id: 'links', label: 'الروابط والمواقع', icon: Link2 },
    { id: 'contact', label: 'تواصل معي', icon: Mail },
    { id: 'cv', label: 'خدمة مجانية C.V', icon: FileText, highlight: true },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#e5edf5] hover:text-white"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-sm text-[#f6ebd9]">الكاتب أ. نبيل بركات</span>
        </div>

        {/* Left Side: "موقع خاص" (Private Site & Supervisor Login / Panel Button) */}
        <div className="flex items-center gap-2">
          {isAuthorMode ? (
            <div className="flex items-center gap-1.5">
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
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#10436d] bg-[#082c49] text-[#e5edf5] hover:bg-[#0f4470] hover:text-white transition shadow-sm cursor-pointer"
              title="تسجيل دخول المشرف (موقع خاص)"
            >
              <Lock className="w-3.5 h-3.5 text-[#dfa85b]" />
              <span>موقع خاص (دخول المشرف)</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#082e4d] border-b border-[#06223b] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium ${
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
        </div>
      )}
    </header>
  );
};
