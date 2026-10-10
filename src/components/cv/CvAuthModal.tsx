import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Lock, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { CvUserAccount } from '../../types/cv';
import { saveCvUserSession } from '../../utils/cvStorage';

interface CvAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CvUserAccount) => void;
  isAr: boolean;
  cvFeesEnabled: boolean;
}

export const CvAuthModal: React.FC<CvAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAr,
  cvFeesEnabled,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailOrPhone.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' : 'Please enter email or phone');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال الاسم' : 'Please enter your name');
      return;
    }

    const user: CvUserAccount = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim() || (isAr ? 'مستخدم السيرة الذاتية' : 'CV User'),
      emailOrPhone: emailOrPhone.trim(),
      password: password.trim(),
      createdAt: new Date().toISOString(),
      isPro: true,
      savedCvIds: [],
    };

    saveCvUserSession(user);
    onSuccess(user);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0b385e] text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-[#dfa85b]" />
            <h3 className="font-bold text-base text-white">
              {isRegisterMode
                ? (isAr ? 'التسجيل المجاني لفتح كافة المزايا' : 'Free Registration - Unlock All Features')
                : (isAr ? 'تسجيل الدخول لحسابك' : 'Sign In to Your Account')}
            </h3>
          </div>
          <p className="text-xs text-sky-100 leading-relaxed">
            {cvFeesEnabled
              ? (isAr ? 'سجل حسابك للوصول إلى القوالب الاحترافية والذكاء الاصطناعي' : 'Sign up to access Pro templates & AI tools')
              : (isAr ? 'الخدمة مفتوحة ومجانية 100% بدون أي رسوم! سجل لحفظ وتعديل سيرتك الذاتية لاحقاً.' : '100% Free Service without fees! Sign up to save and edit your resume anytime.')}
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-sky-50/70 p-3.5 border-b border-sky-100 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'فتح جميع القوالب الاحترافية الستة (الشركات، الإبداعي، الأكاديمي)' : 'Unlock all 6 professional templates'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'مساعد الذكاء الاصطناعي لتحسين وصياغة السيرة المهنية' : 'AI Assistant for professional wording & polish'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'الاحتفاظ بالسيرة الذاتية للتعديل والتصدير حتى بعد شهر أو أكثر' : 'Permanent device & account storage for future edits'}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'الاسم الكريم *' : 'Your Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: عبد الله السعيد' : 'e.g. John Smith'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'البريد الإلكتروني أو رقم الهاتف *' : 'Email or Phone Number *'}
            </label>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder={isAr ? 'user@example.com أو 05xxxxxxxx' : 'user@example.com'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0b385e] hover:bg-[#07243c] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? 'تسجيل مجاني فوري (بدون أي رسوم)' : 'Instant Free Registration (No Fees)'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs text-[#0b385e] hover:underline font-semibold cursor-pointer"
            >
              {isRegisterMode
                ? (isAr ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign In')
                : (isAr ? 'مستخدم جديد؟ إنشاء حساب مجاناً' : 'New user? Create free account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
