import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export interface MusicTrack {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  icon: string;
  frequencies: number[];
  noteDurations: number[];
  waveform: OscillatorType;
  tempo: number;
}

export const musicTracks: MusicTrack[] = [
  {
    id: 'mon_amour',
    title: 'موسيقى مونامور (كونشيرتو أرانخويث)',
    subtitle: 'لحن العشق الخالد - Mon Amour / Concierto de Aranjuez',
    genre: 'كلاسيك رومانسي إسباني',
    icon: '🎸',
    // Melody notes (B3, E4, G4, F#4, E4, D#4, E4, F#4, B3...)
    frequencies: [246.94, 329.63, 392.00, 369.99, 329.63, 311.13, 329.63, 369.99, 246.94, 293.66, 329.63, 293.66, 261.63, 246.94, 220.00, 246.94],
    noteDurations: [0.6, 0.6, 0.9, 0.4, 0.6, 0.6, 1.2, 0.6, 0.6, 0.6, 0.9, 0.4, 0.6, 0.6, 0.8, 1.4],
    waveform: 'sine',
    tempo: 72,
  },
  {
    id: 'spanish_romance',
    title: 'رومانسية الجيتار الإسباني (Romanza)',
    subtitle: 'أنغام الجيتار الأندلسي الهادئة - Spanish Romance',
    genre: 'جيتار كلاسيكي هادئ',
    icon: '🌹',
    // Spanish Romance arpeggio melody
    frequencies: [329.63, 329.63, 329.63, 329.63, 293.66, 261.63, 261.63, 246.94, 220.00, 220.00, 246.94, 261.63, 293.66, 329.63, 293.66, 246.94],
    noteDurations: [0.5, 0.5, 0.5, 0.8, 0.4, 0.5, 0.5, 0.8, 0.5, 0.5, 0.5, 0.8, 0.5, 0.8, 0.5, 1.2],
    waveform: 'triangle',
    tempo: 80,
  },
  {
    id: 'soft_piano',
    title: 'ألحان البيانو الرومانسية الهادئة',
    subtitle: 'نغمات تأملية شاعريّة - Secret Whispers Piano',
    genre: 'بيانو رومانسي',
    icon: '🎹',
    frequencies: [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 261.63, 293.66, 349.23, 440.00, 493.88, 440.00, 349.23, 293.66, 261.63],
    noteDurations: [0.7, 0.7, 0.7, 1.0, 0.7, 0.7, 0.7, 1.2, 0.7, 0.7, 0.7, 1.0, 0.7, 0.7, 0.7, 1.4],
    waveform: 'sine',
    tempo: 68,
  },
  {
    id: 'arabic_oud',
    title: 'تقاسيم عود هادئة رومانسية',
    subtitle: 'شجن شرقي دافئ وروحانيات عربية أصيلة',
    genre: 'تقاسيم شرقية دافئة',
    icon: '🪕',
    // Bayati / Nahawand inspired melodic contour
    frequencies: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 329.63, 293.66, 261.63, 246.94, 220.00, 196.00, 220.00, 261.63, 246.94, 220.00],
    noteDurations: [0.6, 0.5, 0.6, 0.9, 0.6, 0.5, 0.8, 0.6, 0.6, 0.5, 0.9, 0.5, 0.6, 0.6, 0.8, 1.5],
    waveform: 'triangle',
    tempo: 65,
  },
  {
    id: 'ney_kanun',
    title: 'أنغام القانون والناي الشجية',
    subtitle: 'نفحات صوفية وخواطر أدبية عميقة',
    genre: 'تأمل أدبي هادئ',
    icon: '🎼',
    frequencies: [293.66, 329.63, 349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 246.94, 261.63, 293.66, 329.63, 293.66, 293.66],
    noteDurations: [0.8, 0.7, 0.8, 1.1, 0.8, 0.7, 0.8, 1.2, 0.8, 0.7, 0.8, 1.0, 0.8, 0.8, 1.0, 1.6],
    waveform: 'sine',
    tempo: 60,
  },
];

interface MusicContextType {
  isMusicPlaying: boolean;
  isPlaying: boolean;
  selectedTrackId: string;
  setSelectedTrackId: (id: string) => void;
  musicTracks: MusicTrack[];
  tracks: MusicTrack[];
  currentTrack: MusicTrack;
  toggleMusicPlay: () => void;
  togglePlay: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  musicVolume: number;
  volume: number;
  setMusicVolume: (volume: number) => void;
  setVolume: (volume: number) => void;
  isMusicMuted: boolean;
  isMuted: boolean;
  setIsMusicMuted: (muted: boolean) => void;
  setIsMuted: (muted: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('mon_amour');
  const [musicVolume, setMusicVolume] = useState<number>(0.35);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const currentNoteIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  const currentTrack = musicTracks.find((t) => t.id === selectedTrackId) || musicTracks[0];
  const currentTrackRef = useRef<MusicTrack>(currentTrack);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  // Master volume adjustment
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const vol = isMusicMuted ? 0 : musicVolume;
      try {
        masterGainRef.current.gain.setTargetAtTime(vol, audioCtxRef.current.currentTime, 0.05);
      } catch {
        // ignore
      }
    }
  }, [musicVolume, isMusicMuted]);

  // Initialize Audio Context on demand with warm acoustic filter
  const initAudio = () => {
    if (!audioCtxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();

        // Warm acoustic filter to soften digital edges
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, audioCtxRef.current.currentTime);
        filterRef.current = filter;

        const gain = audioCtxRef.current.createGain();
        gain.gain.setValueAtTime(isMusicMuted ? 0 : musicVolume, audioCtxRef.current.currentTime);
        filter.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        masterGainRef.current = gain;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  };

  // Play synthetic warm note sequence with seamless looping
  const playNextNote = useCallback((track: MusicTrack) => {
    if (!isPlayingRef.current || !audioCtxRef.current || !masterGainRef.current) return;

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const noteIdx = currentNoteIndexRef.current % track.frequencies.length;
    const freq = track.frequencies[noteIdx];
    const duration = track.noteDurations[noteIdx] || 0.6;

    try {
      // Create melodic voice
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = track.waveform;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Warm envelope (attack - decay - sustain - release)
      const attack = 0.08;
      const decay = duration * 0.4;
      const release = duration * 0.5;

      noteGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + attack);
      noteGain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + attack + decay);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + release);

      // Add subtle warm harmonic overtone (1 octave up, soft)
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      overtoneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + attack);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration * 0.8);

      // Connect to warm filter or master gain
      const destination = filterRef.current || masterGainRef.current;
      osc.connect(noteGain);
      overtoneOsc.connect(overtoneGain);
      noteGain.connect(destination);
      overtoneGain.connect(destination);

      osc.start(ctx.currentTime);
      overtoneOsc.start(ctx.currentTime);

      const stopTime = ctx.currentTime + duration + release + 0.1;
      osc.stop(stopTime);
      overtoneOsc.stop(stopTime);
    } catch (e) {
      console.warn('[MusicContext] Note error:', e);
    }

    currentNoteIndexRef.current = (currentNoteIndexRef.current + 1) % track.frequencies.length;

    // Schedule next note smoothly
    loopTimeoutRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) {
        playNextNote(currentTrackRef.current);
      }
    }, duration * 1000);
  }, []);

  const playMusic = useCallback(() => {
    initAudio();
    setIsMusicPlaying(true);
    isPlayingRef.current = true;
    currentNoteIndexRef.current = 0;

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().then(() => {
        if (isPlayingRef.current) {
          playNextNote(currentTrackRef.current);
        }
      }).catch(() => {
        if (isPlayingRef.current) {
          playNextNote(currentTrackRef.current);
        }
      });
    } else {
      playNextNote(currentTrackRef.current);
    }
  }, [playNextNote]);

  const pauseMusic = useCallback(() => {
    setIsMusicPlaying(false);
    isPlayingRef.current = false;
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const toggleMusicPlay = useCallback(() => {
    if (isPlayingRef.current) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [pauseMusic, playMusic]);

  // Restart loop if track changes while playing
  useEffect(() => {
    if (isPlayingRef.current) {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
      currentNoteIndexRef.current = 0;
      playNextNote(currentTrack);
    }
  }, [selectedTrackId, currentTrack, playNextNote]);

  // Clean up
  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        isMusicPlaying,
        isPlaying: isMusicPlaying,
        selectedTrackId,
        setSelectedTrackId,
        musicTracks,
        tracks: musicTracks,
        currentTrack,
        toggleMusicPlay,
        togglePlay: toggleMusicPlay,
        playMusic,
        pauseMusic,
        musicVolume,
        volume: musicVolume,
        setMusicVolume,
        setVolume: setMusicVolume,
        isMusicMuted,
        isMuted: isMusicMuted,
        setIsMusicMuted,
        setIsMuted: setIsMusicMuted,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
