import React, { useState } from 'react';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  Minimize2,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const RomanticMusicPlayer: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    selectedTrackId,
    setSelectedTrackId,
    currentTrack,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    tracks,
  } = useMusic();

  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  return (
    <div className="fixed bottom-5 left-5 z-60 print:hidden font-sans select-none animate-in fade-in duration-300">
      {isMinimized ? (
        /* Minimized Floating Button */
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl transition transform hover:scale-105 cursor-pointer border ${
            isPlaying
              ? 'bg-[#07243c] text-[#dfa85b] border-amber-400/50 shadow-amber-900/30'
              : 'bg-[#0b385e] text-white border-white/20 hover:bg-[#07243c]'
          }`}
          title="تشغيل الموسيقى الرومانسية الهادئة بدون غناء"
        >
          <div className="relative">
            <Music className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-[#dfa85b]' : 'text-slate-300'}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-xs font-bold whitespace-nowrap">
            {isPlaying ? currentTrack.title.split(' ')[0] + ' ' + currentTrack.title.split(' ')[1] : 'موسيقى هادئة للقراءة'}
          </span>
          <span className="text-[11px] opacity-75">{currentTrack.icon}</span>
        </button>
      ) : (
        /* Full Floating Romantic Music Player */
        <div className="w-80 bg-[#07243c]/95 backdrop-blur-md border border-amber-400/40 rounded-2xl shadow-2xl p-4 text-white space-y-3.5 animate-in slide-in-from-bottom-3 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-[#dfa85b] flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-literary">
                  <span>موسيقى أدبية ناعمة ورومانسية</span>
                  <Sparkles className="w-3 h-3 text-[#dfa85b]" />
                </h4>
                <div className="text-[10px] text-amber-200/80">
                  موسيقى نقية هادئة بدون غناء لمرافقة القراءة
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="تصغير المشغل"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Track Selection Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-300 font-medium">
              اختر المقطوعة الموسيقية:
            </label>
            <div className="relative">
              <select
                value={selectedTrackId}
                onChange={(e) => {
                  setSelectedTrackId(e.target.value);
                  if (!isPlaying) togglePlay();
                }}
                className="w-full bg-[#051829] text-white text-xs font-bold rounded-xl px-3 py-2 border border-white/20 outline-none focus:border-amber-400 cursor-pointer appearance-none pl-8"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#07243c] text-white py-1">
                    {t.icon} {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="text-[10px] text-[#dfa85b] px-1 font-mono">
              النوع: {currentTrack.genre}
            </div>
          </div>

          {/* Playback Controls & Animated Wave */}
          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5">
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-amber-400 text-[#07243c] hover:bg-amber-300'
                  : 'bg-[#dfa85b] text-[#07243c] hover:bg-[#c4924c]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>تشغيل الموسيقى</span>
                </>
              )}
            </button>

            {/* Audio Wave Visualizer */}
            <div className="flex items-center gap-1 h-5 px-2">
              {[40, 75, 55, 90, 60, 80, 45].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: isPlaying ? `${h}%` : '20%',
                    transition: 'height 0.2s ease-in-out',
                  }}
                  className={`w-1 rounded-full ${
                    isPlaying ? 'bg-[#dfa85b] animate-pulse' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Volume Slider & Mute */}
          <div className="flex items-center gap-2.5 text-xs px-1 text-slate-300">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-300 hover:text-white transition cursor-pointer"
              title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#dfa85b]" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full accent-[#dfa85b] cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              title={`مستوى الصوت: ${Math.round(volume * 100)}%`}
            />
            <span className="font-mono text-[10px] text-slate-400 tabular-nums w-8 text-left">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
