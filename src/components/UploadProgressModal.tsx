import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Copy, Upload, X, Cloud, Sparkles, ExternalLink } from 'lucide-react';
import { isVideoMedia } from '../utils/mediaUtils';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { cancelActiveVideoUpload } from '../utils/firestoreVideoStorage';

export const UploadProgressModal: React.FC = () => {
  const { uploadStatus, setUploadStatus, copyToClipboardWithFeedback } = useApp();
  const [copied, setCopied] = useState(false);

  if (!uploadStatus) return null;

  const { isUploading, progress, fileName, stage, stageText, resultUrl } = uploadStatus;

  const handleCopy = () => {
    if (!resultUrl) return;
    copyToClipboardWithFeedback(resultUrl, 'تم نسخ رابط الصورة إلى الحافظة بنجاح للاستخدام في أي مكان');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    if (stage !== 'completed') {
      cancelActiveVideoUpload();
    }
    setUploadStatus(null);
    setCopied(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed bottom-6 left-6 z-70 max-w-md w-[calc(100vw-3rem)] sm:w-96 bg-[#07243c]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-[#dfa85b]/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      dir="rtl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#051a2c] border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-bold text-[#dfa85b]">
          {stage === 'completed' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
          ) : (
            <Cloud className="w-4 h-4 animate-pulse text-[#dfa85b]" />
          )}
          <span>
            {stage === 'completed' ? 'اكتمل الرفع السحابي بنجاح' : 'مؤشر الرفع والمعالجة السحابية'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-white transition p-1 rounded-lg cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        {/* File name & status */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="truncate max-w-[220px] font-mono text-[11px] text-slate-200">
              {fileName || 'ملف وسائط'}
            </span>
            <span className="font-bold text-amber-300 tabular-nums">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                stage === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 via-[#dfa85b] to-amber-300 animate-pulse'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-0.5">
            {stage === 'completed' ? (
              <span className="text-emerald-400 font-bold">✓ {stageText}</span>
            ) : (
              <span className="text-amber-200/90">{stageText}</span>
            )}
          </p>
        </div>

        {/* Thumbnail preview if available */}
        {resultUrl && (() => {
          const isVideo = isVideoMedia(resultUrl) || Boolean(fileName && isVideoMedia(fileName));
          return (
            <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 relative flex items-center justify-center">
                {isVideo ? (
                  <SmartVideoPlayer
                    rawSrc={resultUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={resultUrl}
                    alt="معاينة الملف المرفوع"
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideo && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px]">▶</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] text-slate-400 block">
                  {isVideo ? 'رابط الفيديو السحابي المحفوظ:' : 'رابط الصورة السحابي للمشرف:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={resultUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-2 py-1 rounded bg-black/40 text-[10px] font-mono text-slate-200 border border-white/10 truncate focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#dfa85b] hover:bg-[#c4924c] text-[#07243c]'
                    }`}
                    title="نسخ الرابط"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-400">
            {stage === 'completed'
              ? 'تم الحفظ بنجاح ومتاح الآن في الموقع'
              : 'جاري الحفظ والرفع السحابي...'}
          </span>

          <div className="flex items-center gap-2">
            {stage !== 'completed' && (
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                إلغاء الرفع ✕
              </button>
            )}
            {stage === 'completed' && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                تم
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
