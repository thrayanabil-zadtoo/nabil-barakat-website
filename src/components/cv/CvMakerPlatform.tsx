import React, { useState, useEffect } from 'react';
import { CvData, CvTemplateId, CvLanguage, CvUserAccount } from '../../types/cv';
import {
  createDefaultCv,
  saveCvToDevice,
  loadCvFromDevice,
  getActiveCvUser,
  logoutCvUser,
} from '../../utils/cvStorage';
import { CvEditor } from './CvEditor';
import { CvPreview } from './CvPreview';
import { CvAuthModal } from './CvAuthModal';
import { useApp } from '../../context/AppContext';
import { exportCvToPdf } from '../../utils/pdfGenerator';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Globe,
  Share2,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lock,
  User,
  Home,
  BookOpen,
  Video,
  Image as ImageIcon,
  Newspaper,
  Link2,
  Mail,
  ShieldCheck,
  Eye,
  Layers,
  Zap,
  Check,
  Smartphone,
  Star,
  CloudDownload,
  HelpCircle,
  FileCheck,
  ChevronRight,
  QrCode,
  Save,
} from 'lucide-react';

export const CvMakerPlatform: React.FC = () => {
  const { setActiveSection, cvFeesEnabled, showToast } = useApp();

  // Active view: 'landing' (Default as requested by user) or 'builder'
  const [currentView, setCurrentView] = useState<'landing' | 'builder'>('landing');
  const [landingSection, setLandingSection] = useState<'home' | 'templates' | 'how' | 'faq'>('home');

  // Active CV state
  const [cv, setCv] = useState<CvData>(() => {
    const loaded = loadCvFromDevice();
    return loaded ? loaded.cv : createDefaultCv('ar');
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'preview'>('editor');
  const [userAccount, setUserAccount] = useState<CvUserAccount | null>(() => getActiveCvUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState<string | null>(null);

  // Device restoration info
  const [restoredDeviceAlert, setRestoredDeviceAlert] = useState<string | null>(() => {
    const loaded = loadCvFromDevice();
    if (loaded && loaded.meta && loaded.meta.cvName) {
      return `${loaded.meta.cvName}`;
    }
    return null;
  });

  // Mobile navigation drawer (showing author sections + return button)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-save to device on changes
  useEffect(() => {
    saveCvToDevice(cv);
  }, [cv]);

  const isAr = cv.lang === 'ar';
  const isProUser = true; // Fully 100% free for all visitors without registration

  const handleLanguageChange = (newLang: CvLanguage) => {
    setCv((prev) => ({
      ...prev,
      lang: newLang,
    }));
    setIsLanguageModalOpen(false);
    showToast(newLang === 'ar' ? 'تم اختيار اللغة العربية (RTL)' : 'Switched resume language to English (LTR)');
  };

  const handleStartBuilding = (preferredLang?: CvLanguage) => {
    if (preferredLang) {
      setCv((prev) => ({ ...prev, lang: preferredLang }));
    }
    setCurrentView('builder');
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTemplateSelect = (templateId: CvTemplateId) => {
    setCv((prev) => ({ ...prev, templateId }));
    setCurrentView('builder');
    setActiveTab('editor');
    showToast(isAr ? 'تم تطبيق القالب بنجاح' : 'Template applied successfully');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetCv = () => {
    if (window.confirm(isAr ? 'هل تود استعادة نموذج السيرة الافتراضي؟' : 'Reset to default sample resume?')) {
      const fresh = createDefaultCv(cv.lang);
      setCv(fresh);
      showToast(isAr ? 'تمت استعادة النموذج الافتراضي' : 'Default resume restored');
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgressText(isAr ? 'جاري تحضير ملف PDF عالي الجودة...' : 'Preparing high-resolution PDF...');
    try {
      const personName = cv.personalInfo.fullName || (cv.lang === 'ar' ? 'سيرة_ذاتية' : 'Resume');
      const fileName = `${personName.replace(/\s+/g, '_')}_CV`;
      
      const success = await exportCvToPdf({
        elementId: 'cv-printable-content',
        fileName,
        onProgress: (status) => setPdfProgressText(status),
      });

      if (success) {
        showToast(isAr ? 'تم تحميل ملف PDF وحفظه في جهازك بنجاح!' : 'PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast(isAr ? 'جاري فتح خيار الطباعة كبديل...' : 'Opening print dialog as fallback...');
      window.print();
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgressText(null);
      }, 1600);
    }
  };

  const handlePrint = () => {
    handleDownloadPdf();
  };

  // Author site sections for the hamburger menu
  const authorSections = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'books', label: 'المؤلفات', icon: BookOpen },
    { id: 'videos', label: 'فيديو يجسد الروايات', icon: Video },
    { id: 'photos', label: 'معرض الصور واللوحات', icon: ImageIcon },
    { id: 'news', label: 'صورة في خبر', icon: Newspaper },
    { id: 'links', label: 'الروابط والمواقع', icon: Link2 },
    { id: 'contact', label: 'تواصل معي', icon: Mail },
  ];

  const navigateToAuthorSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const templateCards: Array<{
    id: CvTemplateId;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    isPro: boolean;
    color: string;
  }> = [
    {
      id: 'modern',
      titleAr: 'قالب عصري (Modern)',
      titleEn: 'Modern Minimalist',
      descAr: 'شريط جانبي كحلي فخم مع تنظيم للمهارات ومعلومات الاتصال.',
      descEn: 'Sleek navy sidebar with structured skill badges.',
      isPro: false,
      color: 'from-[#0a2e4c] to-[#0f4672]',
    },
    {
      id: 'classic',
      titleAr: 'قالب كلاسيكي رسمي (Classic)',
      titleEn: 'Classic Formal',
      descAr: 'تصميم رسمي تقليدي رصين يناسب الجهات الحكومية والأكاديمية.',
      descEn: 'Traditional formal layout ideal for corporate & public sector.',
      isPro: false,
      color: 'from-slate-800 to-slate-900',
    },
    {
      id: 'simple',
      titleAr: 'قالب بسيط وأنيق (Simple)',
      titleEn: 'Simple Elegant',
      descAr: 'خفيف ومرتب مع فواصل ذهبية ولمسات هادئة ومساحات بيضاء واسعة.',
      descEn: 'Minimalist aesthetic with subtle golden accents.',
      isPro: false,
      color: 'from-amber-700 to-amber-900',
    },
    {
      id: 'corporate',
      titleAr: 'قالب احترافي للشركات (Corporate)',
      titleEn: 'Executive Corporate',
      descAr: 'ترويسة تنفيذية وبطاقات منظمة للخبرات وإنجازات القيادة.',
      descEn: 'Executive headers and clean experience timeline.',
      isPro: true,
      color: 'from-[#0b385e] to-sky-900',
    },
    {
      id: 'creative',
      titleAr: 'قالب إبداعي (Creative)',
      titleEn: 'Creative Bold',
      descAr: 'خطوط عصرية وتقسيم جريء يناسب المبدعين والمصممين والتقنيين.',
      descEn: 'Bold typography and asymmetric columns for creatives.',
      isPro: true,
      color: 'from-indigo-900 to-slate-900',
    },
    {
      id: 'academic',
      titleAr: 'قالب أكاديمي (Academic)',
      titleEn: 'Academic Scholar',
      descAr: 'مخصص للباحثين والأساتذة والأطباء مع تركيز على الأبحاث والشهادات.',
      descEn: 'Tailored for researchers, educators, and scholars.',
      isPro: true,
      color: 'from-emerald-900 to-slate-900',
    },
  ];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 selection:bg-sky-500/20">
      
      {/* 1. TOP HEADER (MATCHING THE SCREENSHOT EXACTLY) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo (Right side in RTL, matching screenshot) */}
          <div
            onClick={() => {
              setCurrentView('landing');
              setLandingSection('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm group-hover:bg-sky-700 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="font-black text-lg sm:text-xl text-[#0b385e] leading-tight flex items-center gap-1.5">
                <span>سيرتي</span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  C.V
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">سيرة ذاتية احترافية</span>
            </div>
          </div>

          {/* Center Navigation Links (Matching screenshot: الرئيسية, القوالب, كيف يعمل؟, الأسئلة الشائعة) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                setLandingSection('home');
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold transition rounded-lg cursor-pointer ${
                currentView === 'landing' && landingSection === 'home'
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الرئيسية
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                setLandingSection('templates');
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold transition rounded-lg cursor-pointer ${
                currentView === 'landing' && landingSection === 'templates'
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              القوالب
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                setLandingSection('how');
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold transition rounded-lg cursor-pointer ${
                currentView === 'landing' && landingSection === 'how'
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              كيف يعمل؟
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('landing');
                setLandingSection('faq');
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold transition rounded-lg cursor-pointer ${
                currentView === 'landing' && landingSection === 'faq'
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              الأسئلة الشائعة
            </button>

            {currentView === 'builder' && (
              <span className="px-2.5 py-1 text-xs font-black text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                منطقة إنشاء السيرة ✏️
              </span>
            )}
          </nav>

          {/* Left Controls (Language switcher, Author website link, Mobile hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher Button (Matching screenshot: English / عربي) */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1 ${
                  cv.lang === 'ar' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>عربي</span>
                <Globe className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1 ${
                  cv.lang === 'en' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>English</span>
                <span>🇬🇧</span>
              </button>
            </div>

            {/* Direct Return Button to Author Website (Desktop) */}
            <button
              type="button"
              onClick={() => navigateToAuthorSection('home')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0b385e] hover:bg-[#edf4fb] border border-[#0b385e]/30 rounded-lg transition cursor-pointer"
              title="العودة لموقع الكاتب أ. نبيل بركات"
            >
              <span>موقع الكاتب نبيل بركات</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>

            {/* If in Builder, show Quick Print/Download */}
            {currentView === 'builder' && (
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="hidden sm:flex px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-75"
                title="تحميل ملف PDF"
              >
                {isGeneratingPdf ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>تحميل PDF</span>
              </button>
            )}

            {/* Mobile Menu Hamburger (3 Lines - shows author sections + return button as requested) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="القائمة"
              title="القائمة وأقسام موقع الكاتب"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Drawer with Author Sections + Return */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-white border-t border-slate-800 p-4 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Direct button to author site */}
            <button
              type="button"
              onClick={() => navigateToAuthorSection('home')}
              className="w-full py-2.5 bg-[#dfa85b] text-[#07243c] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>العودة لصفحة الكاتب أ. نبيل بركات</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            {/* Internal navigation in CV platform */}
            <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800 py-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCurrentView('landing');
                  setLandingSection('home');
                }}
                className="p-2 bg-white/5 rounded-lg text-right font-bold text-sky-300"
              >
                الصفحة التعريفية
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleStartBuilding();
                }}
                className="p-2 bg-sky-600 rounded-lg text-right font-bold text-white"
              >
                بدء إنشاء السيرة ✏️
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCurrentView('landing');
                  setLandingSection('templates');
                }}
                className="p-2 bg-white/5 rounded-lg text-right text-slate-300"
              >
                معرض القوالب (6)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCurrentView('landing');
                  setLandingSection('faq');
                }}
                className="p-2 bg-white/5 rounded-lg text-right text-slate-300"
              >
                الأسئلة الشائعة
              </button>
            </div>

            {/* Author sections */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#dfa85b] uppercase tracking-wider block px-1">
                أقسام موقع الكاتب أ. نبيل بركات:
              </span>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {authorSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => navigateToAuthorSection(sec.id)}
                      className="flex items-center gap-2 p-2 rounded-lg text-xs text-slate-200 hover:bg-white/10 transition text-right cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#dfa85b]" />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. LANDING / INTRO VIEW (SHOWN INITIALLY MATCHING USER SCREENSHOT)       */}
      {/* ========================================================================= */}
      {currentView === 'landing' && (
        <div className="flex-1 space-y-12 sm:space-y-16 pb-16">
          
          {/* Quick Notice if User has a saved CV on this device */}
          {restoredDeviceAlert && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 font-medium">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    لديك سيرة ذاتية محفوظة مسبقاً على هذا الجهاز (<strong>{restoredDeviceAlert}</strong>).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartBuilding()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  متابعة التعديل أو التصدير فوراً ←
                </button>
              </div>
            </div>
          )}

          {/* HERO SECTION (MATCHING SCREENSHOT WITH HIGH FIDELITY) */}
          {landingSection === 'home' && (
            <>
              <section className="relative pt-8 sm:pt-14 pb-8 overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                    
                    {/* Right column in RTL / Content */}
                    <div className="lg:col-span-7 space-y-6 text-right rtl:text-right ltr:text-left">
                      <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a2e4c] tracking-tight leading-[1.25]">
                          أنشئ سيرتك الذاتية
                          <br />
                          <span className="text-sky-600">بشكل احترافي</span> خلال دقائق
                        </h1>

                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                          اختر قالبك المفضل، أضف بياناتك، واحصل على سيرة ذاتية جاهزة بصيغة PDF مع رمز QR لمشاركتها بسهولة.
                        </p>
                      </div>

                      {/* 4 Feature Badges (Matching Screenshot: سريع، قوالب، تحميل PDF، رمز QR) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">سريع وسهل الاستخدام</span>
                        </div>

                        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">قوالب احترافية متنوعة</span>
                        </div>

                        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Download className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">تحميل PDF بجودة عالية</span>
                        </div>

                        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">رمز QR للمشاركة</span>
                        </div>
                      </div>

                      {/* CTA Action Buttons (Matching Screenshot) */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {/* Primary Button: ابدأ الآن */}
                        <button
                          type="button"
                          onClick={() => handleStartBuilding()}
                          className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                        >
                          <span>ابدأ الآن</span>
                          <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-1 transition" />
                        </button>

                        {/* Secondary Button: اختر اللغة */}
                        <button
                          type="button"
                          onClick={() => setIsLanguageModalOpen(true)}
                          className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 rounded-full font-bold text-sm border border-slate-300 shadow-2xs transition flex items-center gap-2 cursor-pointer"
                        >
                          <Globe className="w-4 h-4 text-sky-600" />
                          <span>اختر اللغة ({cv.lang === 'ar' ? 'العربية' : 'English'})</span>
                        </button>
                      </div>
                    </div>

                    {/* Left column in RTL: Visual Mockup with Angled CV and Floating QR Code */}
                    <div className="lg:col-span-5 relative flex items-center justify-center">
                      <div className="relative w-full max-w-md">
                        
                        {/* Decorative Background Glow and Leaf Accent */}
                        <div className="absolute -inset-4 bg-gradient-to-tr from-sky-200/40 via-sky-100/30 to-emerald-100/30 rounded-3xl blur-xl -z-10"></div>
                        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-lg -z-10"></div>

                        {/* Angled CV Mockup Card */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 transform rotate-1 sm:rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden text-xs">
                          {/* Top part of CV Mockup */}
                          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <div className="w-12 h-12 rounded-full bg-[#0a2e4c] text-white flex items-center justify-center font-bold text-base shadow-xs">
                              أ
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-[#0a2e4c]">أحمد محمد علي</div>
                              <div className="text-[11px] text-sky-600 font-semibold">مهندس برمجيات وتطبيقات</div>
                            </div>
                          </div>

                          {/* Mini dummy sections matching the screenshot graphic */}
                          <div className="grid grid-cols-3 gap-3 pt-3">
                            <div className="col-span-2 space-y-2">
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-800 border-b pb-0.5">نبذة عني</div>
                                <p className="text-[9px] text-slate-500 leading-relaxed">
                                  متخصص في هندسة البرمجيات وبناء الحلول الرقمية ذات الكفاءة العالية.
                                </p>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-800 border-b pb-0.5">الخبرات العملية</div>
                                <div className="text-[9px] text-slate-700 font-semibold">مطور أول — شركة الحلول الذكية</div>
                                <div className="text-[8px] text-slate-400">2021 - حتى الآن</div>
                              </div>
                            </div>

                            <div className="col-span-1 bg-slate-50 p-2 rounded-lg space-y-2 border border-slate-100">
                              <div className="text-[10px] font-bold text-slate-800">المهارات</div>
                              <div className="space-y-1">
                                <div className="h-1 bg-sky-200 rounded-full w-full">
                                  <div className="h-1 bg-sky-600 rounded-full w-4/5"></div>
                                </div>
                                <div className="h-1 bg-sky-200 rounded-full w-full">
                                  <div className="h-1 bg-sky-600 rounded-full w-3/4"></div>
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-slate-800 pt-1">اللغات</div>
                              <div className="text-[8px] text-slate-600">العربية (الأم)</div>
                              <div className="text-[8px] text-slate-600">الإنجليزية (طليق)</div>
                            </div>
                          </div>
                        </div>

                        {/* Floating QR Code Badge (Matching screenshot with "اربط سيرتك برمز QR") */}
                        <div className="absolute -top-4 -left-4 sm:-left-6 bg-white p-3 rounded-2xl shadow-xl border border-sky-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                          <div className="w-16 h-16 bg-slate-50 rounded-lg p-1 border border-slate-200 flex items-center justify-center">
                            <QrCode className="w-14 h-14 text-[#07243c]" />
                          </div>
                          <span className="text-[9px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full mt-1.5 border border-sky-100 font-semibold dir-ltr">
                            nb.zadtoo.com#cv-123
                          </span>
                          <div className="mt-1 text-[9px] font-bold text-[#0b385e] flex items-center gap-1">
                            <span>اربط سيرتك برمز QR</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* FEATURES SECTION ("مميزاتنا" MATCHING SCREENSHOT) */}
              <section className="py-12 bg-white border-y border-slate-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0a2e4c]">
                      مميزاتنا
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      منصة صُممت لتمنحك أفضل تجربة في إنشاء وتصدير السير الذاتية الاحترافية
                    </p>
                  </div>

                  {/* 4 Cards (Matching screenshot: تحميل فوري, قوالب احترافية, متوافق مع جميع الأجهزة, بدون تسجيل) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: تحميل فوري */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                        <CloudDownload className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">تحميل فوري</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        احصل على ملف PDF جاهز للطباعة أو المشاركة.
                      </p>
                    </div>

                    {/* Card 2: قوالب احترافية */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                        <Star className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">قوالب احترافية</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        اختر من بين مجموعة من القوالب الحديثة والمناسبة لجميع المجالات.
                      </p>
                    </div>

                    {/* Card 3: متوافق مع جميع الأجهزة */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">متوافق مع جميع الأجهزة</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        تصميم متجاوب يعمل بكفاءة على الجوال والكمبيوتر.
                      </p>
                    </div>

                    {/* Card 4: بدون تسجيل */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">بدون تسجيل</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        استخدم الموقع مباشرة دون إنشاء حساب.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TEMPLATES SHOWCASE SECTION */}
          {(landingSection === 'templates' || landingSection === 'home') && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a2e4c]">
                    نماذج وقوالب السيرة الذاتية (6 تصاميم)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    اختر القالب الأنسب لتخصصك المهني، وادخل بياناتك مباشرة
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartBuilding()}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  بدء التعبئة الآن ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateCards.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className={`h-40 rounded-xl bg-gradient-to-br ${t.color} p-4 text-white flex flex-col justify-between shadow-inner group-hover:scale-[1.01] transition`}>
                      <div className="space-y-1">
                        <div className="w-20 h-2 bg-white/40 rounded"></div>
                        <div className="text-sm font-bold text-white">{isAr ? t.titleAr : t.titleEn}</div>
                      </div>
                      <div className="space-y-1 border-t border-white/20 pt-2 text-[10px] text-white/70">
                        <div className="w-full h-1.5 bg-white/30 rounded"></div>
                        <div className="w-3/4 h-1.5 bg-white/30 rounded"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900">{isAr ? t.titleAr : t.titleEn}</h4>
                        {t.isPro && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{isAr ? t.descAr : t.descEn}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTemplateSelect(t.id)}
                      className="w-full py-2 bg-slate-100 group-hover:bg-sky-600 group-hover:text-white text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>استخدام هذا القالب</span>
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HOW IT WORKS SECTION ("كيف يعمل؟") */}
          {(landingSection === 'how' || landingSection === 'home') && (
            <section className="bg-sky-50/50 py-12 border-t border-slate-200">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0a2e4c]">
                    كيف يعمل صانع السيرة الذاتية؟
                  </h2>
                  <p className="text-xs text-slate-500">
                    رحلة بسيطة في 3 خطوات للحصول على سيرتك الذاتية الجاهزة
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center mx-auto">
                      1
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">اختر اللغة والقالب</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      اختر بين العربية أو الإنجليزية مع القالب المناسب لمجالك المهني.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center mx-auto">
                      2
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">أدخل بياناتك وخبراتك</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      اكتب معلوماتك الشخصية، التعليم، والخبرات مع معاينة مباشرة وتلقائية.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center mx-auto">
                      3
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">حمّل PDF مع رمز QR</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      احصل على ملف PDF احترافي فوري ونظيف ومزود برمز QR الذكي.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleStartBuilding()}
                    className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    ابدأ الآن مجاناً ←
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* FAQ SECTION ("الأسئلة الشائعة") */}
          {(landingSection === 'faq' || landingSection === 'home') && (
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0a2e4c]">
                  الأسئلة الشائعة
                </h2>
                <p className="text-xs text-slate-500">
                  إجابات عن أكثر الاستفسارات حول الخدمة
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0b385e] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>هل الخدمة مجانية بالكامل؟</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pr-6">
                    نعم، الخدمة مجانية ويمكن لأي زائر إنشاء سيرته الذاتية وتحميل ملف PDF دون دفع أي رسوم.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0b385e] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>هل يلزم إنشاء حساب أو تسجيل دخول؟</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pr-6">
                    التسجيل غير ضروري إطلاقاً. يمكنك الدخول وإنشاء سيرتك وتحميلها فوراً. التسجيل متاح فقط لمن يريد حفظ سيرته الذاتية على الحساب واستخدام أدوات الذكاء الاصطناعي مجاناً.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0b385e] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>ماذا يحدث إذا أغلقت المتصفح وعدت بعد شهر؟</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pr-6">
                    يحتفظ الموقع ببيانات سيرتك الذاتية وبصمة جهازك في الذاكرة المحلية والكوكيز، لذلك عند عودتك من نفس الجهاز حتى بعد 30 يوماً ستجد سيرتك جاهزة للتعديل والتصدير.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0b385e] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>هل يظهر ملف الـ PDF أي علامات مائية أو روابط إعلانية؟</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pr-6">
                    لا، ملف الـ PDF نظيف تماماً وخالٍ من أي روابط ترويجية أو حقوق ملكية، ويحتوي فقط على بياناتك المهنية ورمز QR الذكي الخاص بك.
                  </p>
                </div>
              </div>
            </section>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BUILDER WORKSPACE (FORM EDITOR + LIVE PREVIEW)                        */}
      {/* ========================================================================= */}
      {currentView === 'builder' && (
        <div className="flex-1 flex flex-col">
          
          {/* Subheader Toolbar with Return to Landing Page */}
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 print:hidden">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              
              {/* Back to Landing Page Button */}
              <button
                type="button"
                onClick={() => setCurrentView('landing')}
                className="text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                <span>العودة للصفحة التعريفية للخدمة</span>
              </button>

              {/* Sub-Tabs: Editor / Templates / Mobile Preview */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تعديل البيانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>تغيير القالب ({templateCards.find((t) => t.id === cv.templateId)?.titleAr})</span>
                </button>

                {/* Mobile preview toggle */}
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`lg:hidden px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة حية</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 text-xs">
                {userAccount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-medium hidden sm:inline">
                      ✓ حساب نشط: {userAccount.emailOrPhone || userAccount.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        saveCvToDevice(cv);
                        showToast(isAr ? 'تم حفظ التعديلات على حسابك بنجاح' : 'Changes saved to your account');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-bold shadow-xs"
                      title="حفظ التعديلات الآن"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logoutCvUser();
                        setUserAccount(null);
                        showToast(isAr ? 'تم تسجيل الخروج بنجاح' : 'Logged out');
                      }}
                      className="text-slate-400 hover:text-red-500 px-1 py-1 text-[11px] cursor-pointer"
                      title="تسجيل الخروج"
                    >
                      خروج
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-gradient-to-r from-[#07243c] to-[#0b385e] hover:from-[#0b385e] hover:to-[#07243c] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-bold shadow-xs border border-[#dfa85b]/40 text-xs"
                    title="سجّل بريدك وكلمة المرور فقط لحفظ السيرة والتعديل لاحقاً من أي مكان"
                  >
                    <Save className="w-3.5 h-3.5 text-[#dfa85b]" />
                    <span>حفظ للتعديل لاحقاً 💾</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetCv}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer"
                  title="استعادة النموذج الأصلي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">استعادة النموذج</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Workspace Body */}
          <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            
            {/* TAB 1: EDITOR WITH LIVE SPLIT PREVIEW */}
            {activeTab === 'editor' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Editor */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-[#0b385e] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>{isAr ? 'نموذج إدخال وتعديل البيانات' : 'Resume Sections & Form'}</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('templates')}
                      className="text-xs text-sky-600 hover:underline font-bold"
                    >
                      {isAr ? 'تغيير القالب ←' : 'Change Template →'}
                    </button>
                  </div>

                  <CvEditor
                    cv={cv}
                    onChange={setCv}
                    isProUser={isProUser}
                    onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  />
                </div>

                {/* Live Preview Column (Sticky on Desktop) */}
                <div className="hidden lg:block lg:col-span-7 sticky top-24 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>{isAr ? 'معاينة حية ومباشرة (A4 Paper)' : 'Live Interactive Preview'}</span>
                    </span>

                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={handleDownloadPdf}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-75"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {pdfProgressText && (
                    <div className="p-2 bg-sky-50 text-sky-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-sky-200">
                      <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
                      <span>{pdfProgressText}</span>
                    </div>
                  )}

                  <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-1 rounded-xl shadow-inner bg-slate-200/50 p-3">
                    <CvPreview cv={cv} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEMPLATE SELECTOR IN BUILDER */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="text-center space-y-1 max-w-xl mx-auto">
                  <h2 className="text-xl font-bold text-[#0b385e]">
                    اختر قالباً جديداً لسيرتك الذاتية
                  </h2>
                  <p className="text-xs text-slate-500">
                    سيتم نقل جميع بياناتك المدخلة تلقائياً إلى القالب المختار
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templateCards.map((t) => {
                    const isSelected = cv.templateId === t.id;
                    const isLocked = t.isPro && !isProUser;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`bg-white rounded-2xl border-2 transition-all p-5 space-y-4 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-sky-600 ring-2 ring-sky-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2 py-0.5 bg-sky-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                            القالب الحالي
                          </div>
                        )}

                        <div className={`h-36 rounded-xl bg-gradient-to-br ${t.color} p-4 text-white flex flex-col justify-between shadow-inner`}>
                          <div className="space-y-1">
                            <div className="w-16 h-2 bg-white/40 rounded"></div>
                            <div className="text-xs font-bold text-white truncate">{isAr ? t.titleAr : t.titleEn}</div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{isAr ? t.titleAr : t.titleEn}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{isAr ? t.descAr : t.descEn}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTemplateSelect(t.id)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white'
                              : isLocked
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          {isSelected ? 'مستخدم حالياً' : 'تطبيق هذا القالب'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: MOBILE LIVE PREVIEW */}
            {activeTab === 'preview' && (
              <div className="lg:hidden space-y-4">
                {/* Download PDF Card for Mobile */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0a2e4c]">
                        {isAr ? 'جاهز لتحميل سيرتك الذاتية؟' : 'Ready to download your CV?'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isAr
                          ? 'احصل على ملف PDF حقيقي عالي الدقة ومناسب لجميع الهواتف والطباعة'
                          : 'Download high-quality A4 PDF directly to your device'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={handleDownloadPdf}
                      className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-75"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري تجهيز وتنزيل الـ PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>تحميل ملف PDF للجوال 📥</span>
                        </>
                      )}
                    </button>
                  </div>

                  {pdfProgressText && (
                    <div className="p-2.5 bg-sky-50 text-sky-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-sky-200 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-ping" />
                      <span>{pdfProgressText}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>تنزيل فوري ومباشر إلى ملفات هاتفك</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-slate-600 hover:text-sky-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>خيارات الطباعة</span>
                    </button>
                  </div>
                </div>

                {/* CV Mobile Paper Preview */}
                <div className="bg-slate-200/70 p-2 sm:p-4 rounded-2xl shadow-inner overflow-hidden flex justify-center">
                  <div className="w-full overflow-x-auto flex justify-center">
                    <div className="w-full max-w-[800px] shadow-sm rounded-xl overflow-hidden bg-white">
                      <CvPreview cv={cv} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Language Selection Modal (As requested: user chooses language then starts) */}
      {isLanguageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsLanguageModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-[#0a2e4c]">
                اختر لغة السيرة الذاتية
              </h3>
              <p className="text-xs text-slate-500">
                سيتم ضبط الاتجاه وتصميم القالب ليلائم اللغة المختارة
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  handleLanguageChange('ar');
                  handleStartBuilding('ar');
                }}
                className={`w-full p-4 rounded-xl border-2 text-right transition flex items-center justify-between cursor-pointer ${
                  cv.lang === 'ar' ? 'border-sky-600 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">🇪🇬 السيرة الذاتية بالعربية</div>
                  <div className="text-[11px] text-slate-500">اتجاه من اليمين إلى اليسار (RTL) مع خطوط عربية</div>
                </div>
                {cv.lang === 'ar' && <Check className="w-5 h-5 text-sky-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleLanguageChange('en');
                  handleStartBuilding('en');
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                  cv.lang === 'en' ? 'border-sky-600 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">🇬🇧 Resume in English</div>
                  <div className="text-[11px] text-slate-500">Left-to-Right (LTR) international format</div>
                </div>
                {cv.lang === 'en' && <Check className="w-5 h-5 text-sky-600" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsLanguageModalOpen(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Free Registration / Pro Unlock Modal */}
      <CvAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setUserAccount(user);
          showToast(isAr ? 'تم التسجيل وتفعيل كافة القوالب والمزايا بنجاح!' : 'Account registered, all Pro features unlocked!');
        }}
        isAr={isAr}
        cvFeesEnabled={Boolean(cvFeesEnabled)}
      />
    </div>
  );
};
