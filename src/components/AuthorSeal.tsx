import React from 'react';
import { Feather, ShieldCheck, Sparkles } from 'lucide-react';
import { getSiteDomain } from '../config/siteDomain';

interface AuthorSealProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const AuthorSeal: React.FC<AuthorSealProps> = ({ size = 'md', showText = true }) => {
  const siteDomain = getSiteDomain();
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  return (
    <div className="inline-flex items-center gap-3 select-none py-1">
      {/* Golden Circular Seal Stamp */}
      <div className={`relative ${sizeClasses[size]} rounded-full p-1 bg-gradient-to-tr from-[#996515] via-[#dfa85b] to-[#ffd700] shadow-md flex items-center justify-center shrink-0 border border-amber-300/40`}>
        {/* Inner concentric ring */}
        <div className="w-full h-full rounded-full bg-[#07243c] border border-dashed border-amber-300/60 p-1 flex flex-col items-center justify-center text-center text-amber-200">
          <Feather className="w-3.5 h-3.5 text-amber-400 -rotate-45" />
          <span className="text-[8px] font-black text-white font-literary tracking-wider leading-none mt-0.5">
            نبيل بركات
          </span>
          <span className="text-[6px] text-amber-400 font-mono tracking-tighter mt-0.5">
            {siteDomain}
          </span>
        </div>

        {/* Small golden glow particle */}
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-300" />
      </div>

      {showText && (
        <div className="space-y-0.5 text-right">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#0b385e] font-literary">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>الختم الأدبي المعتمد للكاتب نبيل بركات</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            الموقع الرسمي والمنصة المعتمدة للمؤلفات © {siteDomain}
          </p>
        </div>
      )}
    </div>
  );
};
