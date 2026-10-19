import React, { useState, useEffect } from 'react';
import { resolveVideoUrl, resolvedVideoObjectUrls } from '../utils/firestoreVideoStorage';
import { Film } from 'lucide-react';

interface SmartVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  rawSrc?: string | null;
  placeholderText?: string;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  src,
  rawSrc,
  placeholderText = 'مشهد روائي قيد التجهيز',
  className = 'w-full h-full object-contain bg-black',
  ...restProps
}) => {
  const originalSource = (rawSrc || (typeof src === 'string' ? src : '') || '').trim();

  // If already resolved in memory or regular URL, initialize immediately without layout flash
  const [playableSrc, setPlayableSrc] = useState<string>(() => {
    if (!originalSource) return '';
    if (!originalSource.startsWith('firestore://video/')) return originalSource;
    const mediaId = originalSource.replace('firestore://video/', '').trim();
    return resolvedVideoObjectUrls.get(mediaId) || '';
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!originalSource) return false;
    if (originalSource.startsWith('firestore://video/')) {
      const mediaId = originalSource.replace('firestore://video/', '').trim();
      return !resolvedVideoObjectUrls.has(mediaId);
    }
    return false;
  });

  useEffect(() => {
    let isCancelled = false;

    if (!originalSource) {
      setPlayableSrc('');
      setIsLoading(false);
      return;
    }

    if (!originalSource.startsWith('firestore://video/')) {
      setPlayableSrc(originalSource);
      setIsLoading(false);
      return;
    }

    const mediaId = originalSource.replace('firestore://video/', '').trim();
    if (resolvedVideoObjectUrls.has(mediaId)) {
      setPlayableSrc(resolvedVideoObjectUrls.get(mediaId)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveVideoUrl(originalSource)
      .then((resolved) => {
        if (!isCancelled) {
          setPlayableSrc(resolved);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[SmartVideoPlayer] Failed to resolve video source:', err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [originalSource]);

  if (!originalSource) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
        <Film className="w-8 h-8 text-[#dfa85b]/70 mb-1.5" />
        <span className="text-xs font-bold text-slate-200">{placeholderText}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">لم يُرفع ملف الفيديو بعد</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-amber-300 p-4 text-center">
        <Film className="w-7 h-7 text-[#dfa85b] animate-bounce mb-2" />
        <span className="text-xs font-bold">جاري تهيئة وبث المشهد السحابي...</span>
        <span className="text-[10px] text-amber-200/70 mt-1">يتم استرجاع فصول الفيديو المؤمنة</span>
      </div>
    );
  }

  return (
    <video
      src={playableSrc || undefined}
      className={className}
      {...restProps}
    />
  );
};
