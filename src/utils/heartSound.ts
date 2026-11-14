// Synthesizes a warm, crystalline chime sound via Web Audio API when a reader likes or double-taps a post.

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Plays a gentle, pleasant romantic chime arpeggio (F5 -> A5 -> C6 -> E6 -> G6)
 * with warm triangle/sine harmonics and soft exponential fade-out.
 */
export function playHeartLikeSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain to keep volume refined and soothing
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22, now);
    master.connect(ctx.destination);

    // Gentle lowpass filter for warm acoustic sparkle
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(0.7, now);
    filter.connect(master);

    // Warm major-9th ascending chime notes
    const notes = [
      { freq: 698.46, delay: 0.0, duration: 0.48, gain: 0.42 }, // F5
      { freq: 880.0, delay: 0.055, duration: 0.52, gain: 0.38 }, // A5
      { freq: 1046.5, delay: 0.11, duration: 0.58, gain: 0.36 }, // C6
      { freq: 1318.51, delay: 0.17, duration: 0.68, gain: 0.3 }, // E6
      { freq: 1567.98, delay: 0.23, duration: 0.78, gain: 0.22 }, // G6 shimmer
    ];

    notes.forEach(({ freq, delay, duration, gain }) => {
      const start = now + delay;

      // Primary pure sine tone
      const oscMain = ctx.createOscillator();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(freq, start);

      // Subtle harmonic shimmer one octave higher
      const oscHarmonic = ctx.createOscillator();
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2, start);

      const envMain = ctx.createGain();
      envMain.gain.setValueAtTime(0.0001, start);
      envMain.gain.linearRampToValueAtTime(gain, start + 0.014);
      envMain.gain.exponentialRampToValueAtTime(0.0008, start + duration);

      const envHarmonic = ctx.createGain();
      envHarmonic.gain.setValueAtTime(0.0001, start);
      envHarmonic.gain.linearRampToValueAtTime(gain * 0.16, start + 0.01);
      envHarmonic.gain.exponentialRampToValueAtTime(0.0004, start + duration * 0.55);

      oscMain.connect(envMain);
      oscHarmonic.connect(envHarmonic);
      envMain.connect(filter);
      envHarmonic.connect(filter);

      oscMain.start(start);
      oscHarmonic.start(start);
      oscMain.stop(start + duration + 0.04);
      oscHarmonic.stop(start + duration + 0.04);
    });
  } catch {
    // Gracefully ignore if browser audio policy or Web Audio is unavailable
  }
}
