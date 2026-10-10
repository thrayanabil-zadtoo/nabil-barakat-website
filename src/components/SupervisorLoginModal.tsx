import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

export const SupervisorLoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginAsSupervisor } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginAsSupervisor(username, password);
      if (!result.success) {
        setErrorMessage(result.error || 'بيانات الدخول غير صحيحة');
      } else {
        setUsername('');
        setPassword('');
      }
      setIsSubmitting(false);
    }, 300);
  };

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#041320]/80 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-[#07243c] border border-[#1b4b75] text-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-[#0b385e] to-[#07243c] border-b border-[#133e63]">
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 text-[#94b5d0] hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#dfa85b] to-[#f5cd72] text-[#07243c] flex items-center justify-center shadow-lg font-bold">
              <Lock className="w-6 h-6 text-[#07243c]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#dfa85b] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>فضاء خاص ومحمي</span>
              </div>
              <h2 className="text-xl font-black font-literary text-white">
                تسجيل دخول المشرف
              </h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Note informing registration is strictly closed */}
          <div className="p-3 rounded-xl bg-[#092d4b] border border-[#144773] text-xs text-[#cbe0f0] flex items-start gap-2.5 leading-relaxed">
            <Sparkles className="w-4 h-4 text-[#dfa85b] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#dfa85b]">إدارة محتوى الكاتب أ. نبيل بركات</p>
              <p className="text-[#94b5d0] text-[11px] mt-0.5">
                هذا النظام محمي وخاص بالمشرف لإدارة وتعديل المحتوى والكتب. التسجيل مغلق تماماً وغير متاح للعامة.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#e5edf5]">
              اسم المستخدم / البريد الإلكتروني للمشرف
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#7ba4c7]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="thrayanabil2026@gmail.com"
                dir="ltr"
                className="w-full bg-[#051c30] border border-[#1b4b75] focus:border-[#dfa85b] rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#e5edf5]">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#7ba4c7]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full bg-[#051c30] border border-[#1b4b75] focus:border-[#dfa85b] rounded-xl pr-9 pl-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7ba4c7] hover:text-[#dfa85b] transition cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/3 py-2.5 px-4 bg-transparent hover:bg-white/5 border border-[#1b4b75] text-[#94b5d0] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-[#dfa85b] to-[#c4924c] hover:from-[#c99547] hover:to-[#b0803c] text-[#07243c] font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'جارٍ التحقق...' : 'دخول المشرف'}</span>
            </button>
          </div>

          {/* Confirmation: No Registration Notice */}
          <div className="text-center pt-2 text-[11px] text-[#6b90b0] border-t border-[#133e63]/70">
            🔒 التسجيل مغلق تماماً · الدخول مقصور على المشرف المعتمد
          </div>

        </form>

      </div>
    </div>
  );
};
