import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, User, Edit3, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSiteDomain } from '../config/siteDomain';

export type LegalTabType = 'privacy' | 'terms' | 'about';

interface LegalPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
}

interface LegalContent {
  privacyTitle: string;
  privacyBody: string;
  termsTitle: string;
  termsBody: string;
  aboutTitle: string;
  aboutBody: string;
  updatedAt: string;
}

const getDefaultLegalContent = (): LegalContent => {
  const domain = getSiteDomain();
  return {
    privacyTitle: 'سياسة الخصوصية وحماية بيانات الزوار',
    privacyBody: `نرحب بكم في المنصة والموقع الرسمي للكاتب والروائي أ. نبيل بركات (${domain}). نلتزم التزاماً كاملاً بحماية خصوصية زوارنا وقرائنا الكرام.

1. جمع البيانات واستخدامها:
- نحن لا نقوم بجمع أو مشاركة أي بيانات شخصية حساسة للزوار لأي جهات خارجية أو إعلانية.
- البيانات المحفوظة محلياً (مثل مواضع توقف القراءة، المفضلة، أو إعدادات خط القراءة) تحفظ على جهاز الزائر نفسه لغرض تحسين تجربة القراءة والتصفح واستئناف قراءة الكتب من حيث توقف.

2. التعليقات والرسائل:
- عند إرسال تعليق أو رسالة تواصل، يتم تخزين الاسم والبريد الإلكتروني المدخل لغرض التواصل والرد المباشر من الكاتب فقط ولا يتم نشرهما لأي طرف ثالث.

3. حماية الملكية الفكرية:
- جميع النصوص والمقالات والروايات واللوحات المنشورة في هذا الموقع محمية بموجب قوانين حماية الملكية الفكرية وحقوق النشر الدولية للمؤلف نبيل بركات.

4. التحديثات والتواصل:
- يحق لإدارة الموقع تحديث هذه السياسة وتعتبر نافذة بمجرد نشرها على الموقع المعتمد ${domain}.`,

    termsTitle: 'شروط وأحكام استخدام الموقع',
    termsBody: `أهلاً بكم في الموقع الرسمي للأستاذ نبيل بركات. استخدامكم لهذا الموقع يعني موافقتكم التامة على الشروط والضوابط الآتية:

1. حقوق النشر والملكية الأدبية:
- جميع الكتب والروايات، والمقاطع الأدبية، والصور، والمواد المرئية المنشورة ملكية حصرية للكاتب والروائي نبيل بركات، مسجلة ومرخصة رسمياً.
- يُحظر تماماً نسخ أو إعادة نشر أو استغلال أي محتوى تجارياً بدون إذن كتابي رسمي ومسبق من المؤلف.

2. الاقتباس والمشاركة:
- يُسمح فقط بمشاركة الاقتباسات الأدبية القصيرة باستخدام ميزة "مشاركة الصفحة كبطاقة مصممة" المعتمدة في الموقع مع الإبقاء على اسم الكاتب والرابط المعتمد ${domain}.

3. سلوك الزائر وقسم التعليقات:
- يجب أن تلتزم التعليقات والمشاركات بالاحترام والأدب والذوق العام، وتخضع التعليقات للمراجعة والاعتماد قبل النشر.

4. إخلاء المسؤولية:
- يسعى الموقع لتوفير أفضل تجربة قراءة وتصفح، وتعتبر الروابط المعتمدة فقط المنشورة في قسم "الروابط والمواقع" هي القنوات الرسمية التابعة للكاتب.`,

    aboutTitle: 'من نحن - سيرة ومسيرة الكاتب نبيل بركات',
    aboutBody: `الأستاذ نبيل بركات، كاتب روائي وشاعر وباحث أدبي، كرس قلمه وفكره لخدمة الأدب الإنساني الرفيع، واستكشاف أبعاد النفس البشرية، وقضايا الوعي والارتقاء الروحي والفكري.

مسيرة من العطاء الأدبي:
أثرى المكتبة العربية بعدد من المؤلفات والروايات المتميزة التي لاقت صدى واسعاً بين القراء والنقاد، ومن أبرزها:
- رواية «حكاية كل عاشق»: عمل روائي رومانسي فلسفي يغوص في أعماق الحب الإنساني وصدق المشاعر وتجليات الروح.
- كتاب «بين الواقع والحلم»: رحلة في عوالم الأمل والطموح وتجاوز التحديات الإنسانية.
- كتاب «الضربة التي لا تقصم ظهرك»: قراءة في الصمود وقوة الإرادة وتحويل الأزمات إلى دروب للنهوض والوعي.
- كتاب «كنّا هنا..»: تأملات شاعريّة وخواطر إنسانية بالغة العمق والشفافية.

رؤيتنا ورسالتنا:
أن تظل الكلمة الصادقة نوراً يضيء العقول، وبلسماً يلامس القلوب، ورسالة محبة ووعي تسمو بالإنسان في كل زمان ومكان.

الموقع والمنصة المعتمدة: ${domain}`,

    updatedAt: 'أكتوبر 2026',
  };
};

const STORAGE_KEY = 'zadtoo_legal_pages_content_v2';

export const LegalPagesModal: React.FC<LegalPagesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const { isAuthorMode, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [content, setContent] = useState<LegalContent>(() => getDefaultLegalContent());
  const [isEditing, setIsEditing] = useState(false);

  // Form edit state
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const currentDomain = getSiteDomain();
        if (parsed.privacyBody) parsed.privacyBody = parsed.privacyBody.replace(/nb\.zadtoo\.com/g, currentDomain);
        if (parsed.termsBody) parsed.termsBody = parsed.termsBody.replace(/nb\.zadtoo\.com/g, currentDomain);
        if (parsed.aboutBody) parsed.aboutBody = parsed.aboutBody.replace(/nb\.zadtoo\.com/g, currentDomain);
        setContent(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const getCurrentTitle = () => {
    if (activeTab === 'privacy') return content.privacyTitle;
    if (activeTab === 'terms') return content.termsTitle;
    return content.aboutTitle;
  };

  const getCurrentBody = () => {
    if (activeTab === 'privacy') return content.privacyBody;
    if (activeTab === 'terms') return content.termsBody;
    return content.aboutBody;
  };

  const handleStartEdit = () => {
    setEditTitle(getCurrentTitle());
    setEditBody(getCurrentBody());
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LegalContent = {
      ...content,
      privacyTitle: activeTab === 'privacy' ? editTitle : content.privacyTitle,
      privacyBody: activeTab === 'privacy' ? editBody : content.privacyBody,
      termsTitle: activeTab === 'terms' ? editTitle : content.termsTitle,
      termsBody: activeTab === 'terms' ? editBody : content.termsBody,
      aboutTitle: activeTab === 'about' ? editTitle : content.aboutTitle,
      aboutBody: activeTab === 'about' ? editBody : content.aboutBody,
      updatedAt: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
    };
    setContent(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setIsEditing(false);
    showToast('تم حفظ التعديلات على الصفحة القانونية بنجاح');
  };

  const handleResetDefaults = () => {
    const defaults = getDefaultLegalContent();
    setContent(defaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore
    }
    setIsEditing(false);
    showToast('تمت استعادة النصوص القانونية الأصلية');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-400/40 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[#dfa85b] shadow-inner">
              {activeTab === 'privacy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : activeTab === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-literary flex items-center gap-1.5 text-white">
                <span>{getCurrentTitle()}</span>
                <Sparkles className="w-4 h-4 text-[#dfa85b]" />
              </h2>
              <div className="text-[11px] text-amber-200/80 font-mono">
                الموقع الرسمي للكاتب أ. نبيل بركات · آخر تحديث: {content.updatedAt}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorMode && !isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="تعديل نصوص هذه الصفحة (خاص بالمشرف)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل الصفحة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto text-xs font-bold select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('about');
              setIsEditing(false);
            }}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-[#0b385e] text-[#0b385e] bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#0b385e]'
            }`}
          >
            <User className="w-4 h-4 text-[#dfa85b]" />
            <span>من نحن (سيرة الكاتب)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('privacy');
              setIsEditing(false);
            }}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#0b385e] text-[#0b385e] bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#0b385e]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#dfa85b]" />
            <span>سياسة الخصوصية</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('terms');
              setIsEditing(false);
            }}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#0b385e] text-[#0b385e] bg-white font-black shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#0b385e]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#dfa85b]" />
            <span>شروط الاستخدام</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الصفحة:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#07243c] outline-none focus:border-[#0b385e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  محتوى ونص الصفحة الكامل:
                </label>
                <textarea
                  required
                  rows={14}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm leading-relaxed text-slate-800 outline-none focus:border-[#0b385e] font-literary"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة النص الافتراضي الأصلي</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ ونشر التعديلات</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="prose prose-slate max-w-none text-right font-literary text-base sm:text-lg leading-relaxed sm:leading-loose text-[#1e293b] whitespace-pre-line select-none">
              {getCurrentBody()}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <div>
            المنصة الرسمية المعتمدة © {getSiteDomain()}
          </div>
          <div>
            جميع الحقوق محفوظة للكاتب نبيل بركات
          </div>
        </footer>
      </div>
    </div>
  );
};
