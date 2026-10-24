import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { BookReaderModal } from './BookReaderModal';
import { AuthorSeal } from './AuthorSeal';
import {
  ShieldCheck,
  BookOpen,
  FileText,
  Barcode,
  CheckCircle2,
  Calendar,
  Building,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  UserCheck,
  Info,
} from 'lucide-react';

export const AuthorLicensesSection: React.FC = () => {
  const { books, isAuthorMode, updateBook, showToast } = useApp();
  const [selectedBookForReading, setSelectedBookForReading] = useState<Book | null>(null);

  // Quick edit modal state for supervisor
  const [editingLicenseBook, setEditingLicenseBook] = useState<Book | null>(null);
  const [tempDepositNumber, setTempDepositNumber] = useState('');
  const [tempIsbn, setTempIsbn] = useState('');
  const [tempPublisher, setTempPublisher] = useState('');
  const [tempYear, setTempYear] = useState('');

  const handleStartEdit = (b: Book) => {
    setEditingLicenseBook(b);
    setTempDepositNumber(b.depositNumber || '');
    setTempIsbn(b.isbn || '');
    setTempPublisher(b.publisher || '');
    setTempYear(b.publicationYear || '');
  };

  const handleSaveLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicenseBook) return;

    updateBook(editingLicenseBook.id, {
      depositNumber: tempDepositNumber.trim(),
      isbn: tempIsbn.trim(),
      publisher: tempPublisher.trim(),
      publicationYear: tempYear.trim(),
    });

    showToast(`تم حفظ وتحديث بيانات الترخيص لكتاب «${editingLicenseBook.title}»`);
    setEditingLicenseBook(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION HEADER & OFFICIAL REGISTRATION BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07243c] via-[#0b385e] to-[#051a2c] text-white p-6 sm:p-10 shadow-xl border border-[#dfa85b]/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#dfa85b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-right max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfa85b]/15 border border-[#dfa85b]/40 text-[#f5cd72] text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#dfa85b]" />
              <span>التوثيق الرسمي وحقوق الملكية الفكرية</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-literary tracking-wide">
              تراخيص المؤلف والتوثيق القانوني
            </h1>

            {/* Author Profile Note as specifically requested */}
            <div className="pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-right space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-[#f5cd72] text-sm sm:text-base font-bold">
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <span>هذه المؤلفات الأدبية من تأليف:</span>
                </div>
                <p className="text-base sm:text-xl font-bold text-white pr-7">
                  الكاتب أ. نبيل بركات
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-sky-100 pr-7 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>فلسطيني · مواليد 1969</span>
                  </span>
                  <span>·</span>
                  <span className="text-[#f5cd72] font-semibold">
                    عضو الجمعية المصرية لكتاب القصة والرواية
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed pt-1">
              جميع المؤلفات والروايات المنشورة أدناه مسجلة رسمياً ومحمية قانونياً بأرقام الإيداع المعتمدة والترقيم الدولي الموحد (ISBN). يُمكنك الضغط على أي كتاب لتصفح فصوله وقراءة نصوصه كاملة.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-3">
            <AuthorSeal size="lg" showText={true} />
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#f5cd72] block">سجل الحماية الفكرية</span>
              <span className="text-[10px] text-slate-300 font-mono">جمهورية مصر العربية · الهيئة العامة للكتاب</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY COUNTER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#07243c]" />
          </div>
          <div>
            <div className="text-xs text-[#64748b] font-medium">عدد المؤلفات</div>
            <div className="text-lg font-black text-[#07243c] font-mono">{books.length} كتب وروايات</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-[#64748b] font-medium">حالة التوثيق</div>
            <div className="text-sm font-bold text-emerald-700">مسجل ومحمي رسمياً</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <Barcode className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-[#64748b] font-medium">الترقيم الدولي</div>
            <div className="text-sm font-bold text-sky-900 font-mono">نظام ISBN الدولي</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xs text-[#64748b] font-medium">دار النشر والتوزيع</div>
            <div className="text-sm font-bold text-purple-900">مؤسسة دار الهلال للنشر</div>
          </div>
        </div>
      </div>

      {/* THE 4 BOOKS LICENSES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {books.map((book, index) => {
          const isDepositReady = book.depositNumber && !book.depositNumber.includes('قيد');
          return (
            <div
              key={book.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-[#dfa85b]/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Header & Content */}
              <div className="p-5 sm:p-7 space-y-5">
                
                {/* Top Badge & Book Number */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#07243c] text-[#dfa85b] font-black text-xs flex items-center justify-center font-mono shadow-xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#07243c]">
                      توثيق كتاب رسمي
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDepositReady ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>معتمد ومسجل</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>قيد استكمال الإيداع</span>
                      </span>
                    )}

                    {isAuthorMode && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(book)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-[#07243c] hover:text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="تعديل بيانات الترخيص ورقم الإيداع والترقيم الدولي"
                      >
                        <Edit2 className="w-3 h-3 text-[#c4924c]" />
                        <span>تعديل</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Book Details Layout: Cover + Information */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  
                  {/* Book Cover with Click to Read Hover Effect */}
                  <div
                    onClick={() => setSelectedBookForReading(book)}
                    className="relative shrink-0 w-32 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all cursor-pointer border border-slate-200 bg-slate-100"
                    title={`اضغط لتصفح وقراءة «${book.title}»`}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-3 text-white text-center">
                      <BookOpen className="w-6 h-6 text-[#dfa85b] mb-1 animate-bounce" />
                      <span className="text-xs font-bold text-[#f5cd72]">تصفح الرواية</span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <h2
                        onClick={() => setSelectedBookForReading(book)}
                        className="text-lg sm:text-xl font-bold text-[#07243c] hover:text-[#0b385e] transition cursor-pointer font-literary"
                      >
                        {book.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-0.5">
                        {book.subtitle}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#475569]">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Building className="w-3 h-3 text-[#c4924c]" />
                        <span>{book.publisher || 'مؤسسة دار الهلال للنشر'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3 h-3 text-[#c4924c]" />
                        <span>{book.publicationYear || '2025'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Layers className="w-3 h-3 text-[#c4924c]" />
                        <span>{book.pagesCount} صفحة</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </div>

                {/* OFFICIAL NUMBERS BOX: DEPOSIT & ISBN */}
                <div className="space-y-2 pt-2">
                  
                  {/* 1. Legal Deposit Number */}
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border border-amber-200/80 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-amber-900">
                        رقم الإيداع القانوني
                      </div>
                      <div className="text-xs sm:text-sm font-black text-[#07243c] font-mono dir-ltr truncate">
                        {book.depositNumber || 'قيد الاستكمال والتزويد'}
                      </div>
                    </div>
                  </div>

                  {/* 2. International Standard Book Number (ISBN) */}
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 border border-sky-200/80 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0">
                      <Barcode className="w-4 h-4 text-sky-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-sky-900">
                        الترقيم الدولي الموحد (ISBN)
                      </div>
                      <div className="text-xs sm:text-sm font-black text-[#07243c] font-mono dir-ltr truncate">
                        {book.isbn || 'قيد الاستكمال'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Button to browse and read novel */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-[#64748b]">
                  متاح للقراءة الكاملة والاستماع الصوتي
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedBookForReading(book)}
                  className="px-5 py-2.5 rounded-xl bg-[#07243c] hover:bg-[#0b385e] text-[#f5cd72] hover:text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 border border-[#dfa85b]/40"
                >
                  <BookOpen className="w-4 h-4 text-[#dfa85b]" />
                  <span>تصفح وقراءة الرواية الآن</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUPERVISOR QUICK EDIT MODAL */}
      {editingLicenseBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#07243c]">
                  تعديل ترخيص: {editingLicenseBook.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLicenseBook(null)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLicense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الإيداع القانوني
                </label>
                <input
                  type="text"
                  placeholder="مثال: 19024 / 2025"
                  value={tempDepositNumber}
                  onChange={(e) => setTempDepositNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الترقيم الدولي الموحد (ISBN)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 978-977-07-2058-5"
                  value={tempIsbn}
                  onChange={(e) => setTempIsbn(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    دار النشر
                  </label>
                  <input
                    type="text"
                    value={tempPublisher}
                    onChange={(e) => setTempPublisher(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سنة النشر
                  </label>
                  <input
                    type="text"
                    value={tempYear}
                    onChange={(e) => setTempYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingLicenseBook(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#07243c] hover:bg-[#0b385e] rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL NOVEL READER MODAL WHEN BROWSE IS CLICKED */}
      {selectedBookForReading && (
        <BookReaderModal
          book={selectedBookForReading}
          onClose={() => setSelectedBookForReading(null)}
        />
      )}
    </div>
  );
};
