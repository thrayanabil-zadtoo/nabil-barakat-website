import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Lock, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { CvUserAccount } from '../../types/cv';
import { saveCvUserSession } from '../../utils/cvStorage';

interface CvAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CvUserAccount) => void;
  isAr: boolean;
  cvFeesEnabled?: boolean;
}

export const CvAuthModal: React.FC<CvAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAr,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter a password');
      return;
    }

    const user: CvUserAccount = {
      id: 'usr_' + Date.now().toString(36),
      name: email.split('@')[0] || (isAr ? 'مستخدم السيرة الذاتية' : 'CV User'),
      emailOrPhone: email.trim(),
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
                ? (isAr ? 'حفظ السيرة الذاتية للتعديل لاحقاً' : 'Save Resume for Future Edits')
                : (isAr ? 'تسجيل الدخول لتعديل سيرتك' : 'Sign In to Edit Your Resume')}
            </h3>
          </div>
          <p className="text-xs text-sky-100 leading-relaxed">
            {isAr
              ? 'الخدمة مجانية بالكامل. ضع الإيميل وكلمة المرور فقط لحفظ بياناتك والرجوع لتعديلها في أي وقت (بدون الحاجة لحساب جوجل أو تأكيد).'
              : '100% Free Service. Enter your email and password only to save and edit your resume anytime (no Google or verification required).'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-sky-50/70 p-3.5 border-b border-sky-100 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'الخدمة مجانية 100% لكافة القوالب وتوليد الـ PDF' : '100% Free for all templates and PDF exports'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isAr ? 'إمكانية الرجوع وتعديل سيرتك من أي جهاز وبأي وقت' : 'Resume saved permanently for future updates'}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0b385e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'كلمة المرور *' : 'Password *'}
            </label>
            <input
              type="password"
              required
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
                <span>{isAr ? 'حفظ السيرة ومتابعة التعديل لاحقاً' : 'Save Resume & Edit Later'}</span>
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
                ? (isAr ? 'لديك حساب سابق؟ تسجيل الدخول' : 'Already have an account? Sign In')
                : (isAr ? 'حفظ بريد جديد؟ تسجيل' : 'Save new email? Register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
