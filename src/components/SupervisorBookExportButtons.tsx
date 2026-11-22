import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, FileText, Loader2, Lock } from 'lucide-react';
import { Book } from '../types';
import { useApp } from '../context/AppContext';
import { exportBookToPdf, exportBookToWord } from '../utils/bookExporter';

interface SupervisorBookExportButtonsProps {
  book: Book;
  variant?: 'compact' | 'card' | 'reader';
}

export const SupervisorBookExportButtons: React.FC<SupervisorBookExportButtonsProps> = ({
  book,
  variant = 'card',
}) => {
  const { isAuthorMode, authorProfile, showToast } = useApp();
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'word' | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Strict supervisor-only guard: never render or expose anything to visitors
  if (!isAuthorMode) {
    return null;
  }

  const handleExport = async (format: 'pdf' | 'word') => {
    if (!isAuthorMode || exportingFormat) return;

    setExportingFormat(format);
    setProgressPercent(5);
    setProgressText(
      format === 'pdf'
        ? `جاري تحضير ملف PDF لكتاب «${book.title}»...`
        : `جاري تحضير ملف Word لكتاب «${book.title}»...`
    );

    try {
      const options = {
        isAuthorMode,
        authorName: authorProfile?.name || 'أ. نبيل بركات',
        onProgress: (msg: string, pct?: number) => {
          setProgressText(msg);
          if (typeof pct === 'number') {
            setProgressPercent(pct);
          }
        },
      };

      if (format === 'pdf') {
        await exportBookToPdf(book, options);
        showToast(`✓ تم تنزيل ملف PDF للرواية «${book.title}» بجميع صفحاتها المنسقة`);
      } else {
        await exportBookToWord(book, options);
        showToast(`✓ تم تنزيل ملف Word (.docx) للرواية «${book.title}» بجميع صفحاتها المنسقة`);
      }
    } catch (err: any) {
      showToast(err?.message || 'تعذر تجهيز الملف للتحميل، يرجى المحاولة مرة أخرى');
    } finally {
      setExportingFormat(null);
      setProgressText('');
      setProgressPercent(0);
    }
  };

  const progressModal =
    exportingFormat && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] bg-[#07243c]/75 backdrop-blur-xs flex items-center justify-center p-4"
            dir="rtl"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dfa85b]/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#07243c] text-[#f5cd72] flex items-center justify-center shrink-0 border border-[#dfa85b]/40">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#c4924c]">
                    <Lock className="w-3 h-3" />
                    <span>تصدير حصري للمشرف</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#07243c] truncate">
                    {exportingFormat === 'pdf' ? 'جاري إنشاء ملف PDF منسق' : 'جاري إنشاء ملف Word (.docx) منسق'}
                  </h4>
                  <p className="text-xs text-slate-600 truncate">«{book.title}»</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      exportingFormat === 'pdf'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                        : 'bg-gradient-to-r from-[#0b385e] to-sky-500'
                    }`}
                    style={{ width: `${Math.max(8, Math.min(100, progressPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span className="truncate">{progressText}</span>
                  <span className="font-mono text-[#07243c] font-bold shrink-0 mr-2">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 leading-relaxed">
                يتم تجهيز كل صفحة من صفحات الرواية في صفحة مستقلة بنفس الترتيب والتنسيق العربي الكامل.
              </p>
            </div>
          </div>,
          document.body
        )
      : null;

  if (variant === 'compact') {
    return (
      <>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('pdf')}
            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded flex items-center gap-1 font-bold text-[10px] transition cursor-pointer disabled:opacity-60"
            title="تحميل الرواية كملف PDF منسق (للمشرف فقط)"
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileDown className="w-3 h-3" />
            )}
            <span>PDF</span>
          </button>
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('word')}
            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded flex items-center gap-1 font-bold text-[10px] transition cursor-pointer disabled:opacity-60"
            title="تحميل الرواية كملف Word منسق (للمشرف فقط)"
          >
            {exportingFormat === 'word' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            <span>Word</span>
          </button>
        </div>
        {progressModal}
      </>
    );
  }

  if (variant === 'reader') {
    return (
      <>
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="تحميل الرواية كاملة بملف PDF صفحة بصفحة (حصري للمشرف)"
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>تحميل PDF</span>
          </button>
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('word')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b385e] hover:bg-[#07243c] text-white text-[11px] font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="تحميل الرواية كاملة بملف Word صفحة بصفحة (حصري للمشرف)"
          >
            {exportingFormat === 'word' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#dfa85b]" />
            )}
            <span>تحميل Word</span>
          </button>
        </div>
        {progressModal}
      </>
    );
  }

  // Default 'card' variant for BooksSection
  return (
    <>
      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[#0b385e] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#c4924c]" />
          <span>تحميل النسخة المنسقة (حصري للمشرف فقط):</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>تحميل ملف PDF</span>
          </button>
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => handleExport('word')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0b385e] hover:bg-[#07243c] text-white text-[11px] font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {exportingFormat === 'word' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#dfa85b]" />
            )}
            <span>تحميل ملف Word</span>
          </button>
        </div>
      </div>
      {progressModal}
    </>
  );
};
