import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0b385e] border border-[#dfa85b] shadow-2xl text-white text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CheckCircle2 className="w-5 h-5 text-[#dfa85b] shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};
