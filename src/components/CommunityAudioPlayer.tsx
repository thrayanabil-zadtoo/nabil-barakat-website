import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Headphones, Loader2 } from 'lucide-react';
import { resolveAudioUrl } from '../utils/firestoreAudioStorage';

interface CommunityAudioPlayerProps {
  rawAudioUrl: string;
  durationHint?: string;
  title?: string;
}

const formatAudioTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const CommunityAudioPlayer: React.FC<CommunityAudioPlayerProps> = ({
  rawAudioUrl,
  durationHint,
  title = 'إلقاء صوتي بصوت الكاتب',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);

    resolveAudioUrl(rawAudioUrl)
      .then((src) => {
        if (!active) return;
        setResolvedSrc(src);
        if (!src) setHasError(true);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rawAudioUrl]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  };

  if (hasError && !resolvedSrc) {
    return null;
  }

  const progressMax = duration > 0 ? duration : 100;

  return (
    <div
      data-no-post-copy="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="mx-4 my-3 p-3 rounded-2xl bg-gradient-to-r from-[#07243c] via-[#0b385e] to-[#07243c] text-white border border-[#dfa85b]/45 shadow-sm select-none cursor-default"
      dir="rtl"
    >
      {resolvedSrc && (
        <audio
          ref={audioRef}
          src={resolvedSrc}
          preload="metadata"
          onLoadedMetadata={() => {
            if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
              setDuration(audioRef.current.duration);
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => setHasError(true)}
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isLoading || !resolvedSrc}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5cd72] to-[#dfa85b] hover:from-[#dfa85b] hover:to-[#c5943b] text-[#07243c] flex items-center justify-center shrink-0 shadow-md transition cursor-pointer disabled:opacity-50"
          title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل القراءة الصوتية'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-[#f5cd72] flex items-center gap-1.5 truncate">
              <Headphones className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-300 shrink-0">
              {formatAudioTime(currentTime)} / {duration > 0 ? formatAudioTime(duration) : durationHint || '00:00'}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={progressMax}
            step={0.1}
            value={Math.min(currentTime, progressMax)}
            onChange={handleSeek}
            disabled={!resolvedSrc || duration <= 0}
            className="w-full h-1.5 accent-[#dfa85b] bg-white/20 rounded-lg cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer shrink-0"
          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-[#dfa85b]" />}
        </button>
      </div>
    </div>
  );
};
