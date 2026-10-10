import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageCompressor';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  Camera,
} from 'lucide-react';

interface HeaderPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeaderPhotoModal: React.FC<HeaderPhotoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { authorProfile, updateAuthorHeaderPhoto, updateAuthorProfile } = useApp();

  const [headerBanner, setHeaderBanner] = useState(
    authorProfile.headerBannerImage || authorProfile.heroLandscapeImage || ''
  );
  const [portraitImg, setPortraitImg] = useState(authorProfile.portraitImage || '');
  const [authorName, setAuthorName] = useState(authorProfile.name);
  const [authorTitle, setAuthorTitle] = useState(authorProfile.title);
  const [authorMotto, setAuthorMotto] = useState(authorProfile.motto);

  if (!isOpen) return null;

  // File Upload Handlers (converts local file to compressed base64 Data URL)
  const handlePortraitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.82);
        setPortraitImg(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1920, 1080, 0.82);
        setHeaderBanner(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = () => {
    updateAuthorHeaderPhoto(headerBanner, portraitImg);
    updateAuthorProfile({
      name: authorName,
      title: authorTitle,
      motto: authorMotto,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#d6e0ea] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b385e] to-[#082a47] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dfa85b]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">تخصيص صورة وبانر الهيدر الرئيسي</h3>
              <p className="text-xs text-blue-100/80">
                إمكانية رفع صورتك الشخصية الكاملة وتعديل بيانات البانر العلوي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Instructions note */}
          <div className="bg-[#f0f5fa] border border-[#cbdfeF] rounded-xl p-3.5 text-xs text-[#0b385e] leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#c4924c] shrink-0 mt-0.5" />
            <div>
              <strong>ملاحظة للمشرف والكاتب:</strong> يمكنك هنا رفع صورتك الشخصية الكاملة مباشرة من جهازك (كمبيوتر أو هاتف) لتظهر على يمين الهيدر بشكل كامل وطبيعي بدون أي إطار دائري، تماماً كما في التصميم المعتمد.
            </div>
          </div>

          {/* Upload Author Personal Full Photo */}
          <div className="space-y-3 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
            <label className="text-xs font-bold text-[#0b385e] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#c4924c]" />
                <span>صورتك الشخصية (تظهر كاملة في الهيدر بدون دائرة)</span>
              </span>
              <span className="text-[11px] text-[#64748b]">اختر ملفاً من جهازك أو ضع رابط صورة</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview */}
              <div className="w-32 h-36 rounded-xl overflow-hidden border-2 border-[#0b385e]/30 bg-slate-100 shrink-0 shadow-sm relative group">
                {portraitImg ? (
                  <img
                    src={portraitImg}
                    alt="صورة الكاتب"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>لا توجد صورة</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2.5 w-full">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border-2 border-dashed border-[#0b385e]/40 hover:border-[#0b385e] rounded-xl text-xs font-bold text-[#0b385e] hover:bg-slate-50 transition-colors shadow-xs">
                  <Upload className="w-4 h-4 text-[#c4924c]" />
                  <span>رفع صورتك الشخصية من جهازك (ملف JPG أو PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePortraitFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#64748b]">أو رابط مباشر للصورة:</span>
                  <input
                    type="text"
                    value={portraitImg}
                    onChange={(e) => setPortraitImg(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                    className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]"
                  />
                </div>

                {/* Quick Presets for author portrait */}
                <div className="pt-1.5 flex flex-wrap gap-2 text-[11px]">
                  <span className="text-[#64748b] self-center">نماذج سريعة:</span>
                  <button
                    type="button"
                    onClick={() => setPortraitImg('/author.jpg')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0b385e] border border-blue-200 transition"
                  >
                    الصورة الرسمية المعتمدة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortraitImg('/src/assets/images/author_banner_full_1790502930035.jpg')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#0b385e] border border-amber-200 transition"
                  >
                    البانر المتمدد الشامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortraitImg('/src/assets/images/author_real_portrait_1790502943069.jpg')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0b385e] border border-slate-300 transition"
                  >
                    بورتريه الكاتب
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upload or change Background Banner */}
          <div className="space-y-3 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
            <label className="text-xs font-bold text-[#0b385e] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#c4924c]" />
                <span>خلفية الهيدر البانورامية (المكتبة والكتب)</span>
              </span>
            </label>

            <div className="space-y-2.5">
              {headerBanner && (
                <div className="w-full h-24 rounded-xl overflow-hidden border border-[#cbd5e1] bg-slate-100">
                  <img
                    src={headerBanner}
                    alt="خلفية الهيدر"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#cbd5e1] hover:border-[#0b385e] rounded-xl text-xs font-bold text-[#0b385e] hover:bg-slate-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة خلفية جديدة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={headerBanner}
                  onChange={(e) => setHeaderBanner(e.target.value)}
                  placeholder="رابط صورة الخلفية..."
                  className="flex-1 bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b] focus:outline-none focus:border-[#0b385e]"
                />
              </div>
            </div>
          </div>

          {/* Texts in Header */}
          <div className="space-y-3 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-[#0b385e]">نصوص وعناوين الهيدر</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#64748b]">الاسم الكامل:</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#64748b]">اللقب / الصفة (مثل: الكاتب):</label>
                <input
                  type="text"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b]"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-[#64748b]">الشعار / العبارة الأدبية:</label>
                <input
                  type="text"
                  value={authorMotto}
                  onChange={(e) => setAuthorMotto(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs text-[#1e293b]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#1e293b]"
          >
            إلغاء
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPortraitImg('/author.jpg');
                setHeaderBanner('');
                updateAuthorHeaderPhoto('', '/author.jpg');
                updateAuthorProfile({
                  name: 'أ. نبيل بركات',
                  title: 'الكاتب',
                  motto: 'حروفي مرآتي وصمتي قصيدة',
                });
                onClose();
              }}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#0b385e] border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#c4924c]" />
              <span>اعتماد الهيدر المعتمد</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#0b385e] hover:bg-[#082a47] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>حفظ واعتماد هذا الهيدر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
