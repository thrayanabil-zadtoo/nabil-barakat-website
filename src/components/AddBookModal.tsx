import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, BookOpen, Upload, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

export const AddBookModal: React.FC = () => {
  const { isAddBookModalOpen, setIsAddBookModalOpen, addBook, processAndUploadImage, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [genre, setGenre] = useState('رواية أدبية');
  const [publisher, setPublisher] = useState('دار المعارف للنشر والتوزيع');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [pagesCount, setPagesCount] = useState<number>(280);
  const [isbn, setIsbn] = useState('');
  const [coverImage, setCoverImage] = useState('/src/assets/images/book_cover_heritage_1790501223547.jpg');
  const [description, setDescription] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  if (!isAddBookModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('يرجى إدخال عنوان الكتاب أو الرواية');
      return;
    }

    try {
      await addBook({
        title: title.trim(),
        subtitle: subtitle.trim() || 'رواية أدبية معاصرة',
        genre: genre.trim() || 'رواية',
        publisher: publisher.trim() || 'دار النشر والتوزيع',
        publicationYear: year.trim() || new Date().getFullYear().toString(),
        pagesCount: pagesCount || 200,
        isbn: isbn.trim() || '978-977-000-000-0',
        coverImage: coverImage.trim() || '/src/assets/images/book_cover_heritage_1790501223547.jpg',
        description: description.trim() || 'عمل أدبي وروائي شيق للأستاذ نبيل بركات، يغوص في أعماق المشاعر الإنسانية.',
        samplePages: [
          {
            pageNumber: 1,
            title: 'المقدمة والافتتاحية',
            content: description.trim() || 'تبدأ الحكاية من حيث تنتهي الكلمات وتبدأ نبضات الروح...',
          },
        ],
        tableOfContents: [
          { chapter: 'الاستهلال', pageNumber: 5 },
          { chapter: 'الفصل الأول: البدايات', pageNumber: 12 },
          { chapter: 'الفصل الثاني: التحولات', pageNumber: 48 },
        ],
        galleryImages: coverImage ? [coverImage] : [],
      });

      showToast(`✓ تم إضافة كتاب «${title.trim()}» بنجاح وحفظه سحابياً في المكتبة!`);
      // Reset form
      setTitle('');
      setSubtitle('');
      setDescription('');
      setIsbn('');
      setIsAddBookModalOpen(false);
    } catch (err: any) {
      showToast(`تعذر إضافة الكتاب: ${err?.message || 'خطأ غير متوقع'}`);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const uploadedUrl = await processAndUploadImage(file, {
        maxWidth: 720,
        maxHeight: 1080,
        quality: 0.8,
        category: 'المؤلفات والكتب',
        contextTitle: `غلاف: ${title || 'كتاب جديد'}`,
      });
      setCoverImage(uploadedUrl);
      showToast('✓ تم رفع صورة الغلاف وتعيينها للكتاب بنجاح');
    } catch (err: any) {
      showToast(err?.message || 'فشل رفع صورة الغلاف');
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#d6e0ea]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#0d4573] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-[#dfa85b]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-literary">إضافة كتاب أو رواية جديدة للمكتبة</h3>
              <p className="text-xs text-[#dbe5f0]">إدراج مؤلف جديد في قائمة إصدارات أ. نبيل بركات مع حفظ سحابي دائم</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddBookModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/90 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-gray-700 font-bold mb-1">
                عنوان الكتاب أو الرواية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: ترانيم الصمت، نبضات في الذاكرة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#0b385e] focus:ring-1 focus:ring-[#0b385e] outline-none text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">العنوان الفرعي أو التوصيف</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="مثال: رواية اجتماعية نفسية"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">التصنيف الأدبي</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none bg-white font-medium"
              >
                <option value="رواية أدبية">رواية أدبية</option>
                <option value="روايات اجتماعية">روايات اجتماعية</option>
                <option value="أدب نفسي وفلسفي">أدب نفسي وفلسفي</option>
                <option value="رواية رومانسية واقعية">رواية رومانسية واقعية</option>
                <option value="سيرة ذاتية وروائية">سيرة ذاتية وروائية</option>
                <option value="خواطر ومقالات">خواطر ومقالات</option>
                <option value="قصص قصيرة">قصص قصيرة</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">دار النشر</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="مثال: دار الشروق، دار المعارف..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">سنة الإصدار / النشر</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">عدد الصفحات</label>
              <input
                type="number"
                min="10"
                value={pagesCount}
                onChange={(e) => setPagesCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">الرقم الدولي (ISBN) اختياري</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-977-..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Book Cover Selection & Upload */}
          <div className="bg-[#f8fafc] p-3.5 sm:p-4 rounded-xl border border-[#d6e0ea] space-y-2.5">
            <label className="block text-[#0b385e] font-bold">صورة غلاف الكتاب</label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-20 h-28 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex-shrink-0 shadow-sm relative group">
                {coverImage ? (
                  <img src={coverImage} alt="معاينة الغلاف" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="رابط صورة الغلاف أو ارفع ملف من جهازك..."
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono"
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c] font-bold text-xs rounded-lg transition shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingCover ? 'جارٍ رفع الصورة...' : 'رفع غلاف من الهاتف أو الكمبيوتر'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCover}
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                  <span className="text-[11px] text-gray-500">يدعم JPG و PNG ويتم ضغطه وتحسينه تلقائياً</span>
                </div>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">نبذة عن الكتاب / الرواية</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة شيقة وموجزة عن أحداث الرواية أو فكرة الكتاب ومحاوره..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#0b385e] outline-none text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddBookModalOpen(false)}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0b385e] hover:bg-[#072a47] text-white font-bold transition shadow-md"
            >
              <Check className="w-4 h-4 text-[#dfa85b]" />
              <span>إضافة وحفظ في المكتبة الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
