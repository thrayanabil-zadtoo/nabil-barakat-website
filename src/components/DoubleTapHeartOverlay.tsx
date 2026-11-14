import React from 'react';

export interface FloatingHeartParticle {
  id: string;
  leftPercent: number;
  sizePx: number;
  delayMs: number;
  durationMs: number;
  risePx: number;
  swayPx: number;
  rotateDeg: number;
  color: string;
}

export interface HeartBurstEvent {
  id: string;
  originXPercent: number;
  originYPercent: number;
  particles: FloatingHeartParticle[];
}

const HEART_COLORS = [
  '#e11d48', // crimson rose
  '#f43f5e', // bright rose
  '#fb7185', // soft coral pink
  '#be123c', // deep ruby
  '#dfa85b', // literary gold accent
  '#fda4af', // blush petal
];

export function createHeartBurstEvent(
  originXPercent = 50,
  originYPercent = 48
): HeartBurstEvent {
  const id = `burst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const particleCount = 18;
  const particles: FloatingHeartParticle[] = Array.from({ length: particleCount }, (_, idx) => {
    const spreadSlot = (idx + 0.5) / particleCount;
    const jitter = (Math.random() - 0.5) * 9;
    const leftPercent = Math.min(94, Math.max(6, spreadSlot * 88 + 6 + jitter));
    const swayDir = idx % 2 === 0 ? 1 : -1;

    return {
      id: `${id}-p-${idx}`,
      leftPercent,
      sizePx: 16 + Math.round(Math.random() * 18), // 16px - 34px
      delayMs: Math.round((idx % 6) * 65 + Math.random() * 85), // staggered bottom-to-top stream
      durationMs: 1150 + Math.round(Math.random() * 580),
      risePx: -(240 + Math.round(Math.random() * 170)),
      swayPx: swayDir * (14 + Math.round(Math.random() * 24)),
      rotateDeg: swayDir * (8 + Math.round(Math.random() * 18)),
      color: HEART_COLORS[idx % HEART_COLORS.length],
    };
  });

  return {
    id,
    originXPercent: Math.min(82, Math.max(18, originXPercent)),
    originYPercent: Math.min(72, Math.max(24, originYPercent)),
    particles,
  };
}

interface DoubleTapHeartOverlayProps {
  bursts: HeartBurstEvent[];
}

export const DoubleTapHeartOverlay: React.FC<DoubleTapHeartOverlayProps> = ({ bursts }) => {
  if (bursts.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
    >
      {bursts.map((burst) => (
        <React.Fragment key={burst.id}>
          {/* Expanding Golden Halo Ring */}
          <div
            className="absolute w-24 h-24 rounded-full border-2 border-[#dfa85b]/80 bg-rose-500/15 animate-heart-ring-expand"
            style={{
              left: `${burst.originXPercent}%`,
              top: `${burst.originYPercent}%`,
            }}
          />

          {/* Big Center Popping Heart */}
          <div
            className="absolute animate-heart-big-pop drop-shadow-[0_10px_22px_rgba(225,29,72,0.48)]"
            style={{
              left: `${burst.originXPercent}%`,
              top: `${burst.originYPercent}%`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-24 h-24 sm:w-28 sm:h-28"
              fill="none"
            >
              <defs>
                <linearGradient id={`bigHeartGrad-${burst.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="50%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#9f1239" />
                </linearGradient>
              </defs>
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={`url(#bigHeartGrad-${burst.id})`}
                stroke="#fff1f2"
                strokeWidth="0.9"
              />
              {/* Soft specular highlight */}
              <path
                d="M7.2 6.3c-1.15.22-2.05 1.15-2.25 2.3"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Many Floating Hearts Rising from Bottom to Top & Fading */}
          {burst.particles.map((p) => (
            <div
              key={p.id}
              className="absolute bottom-2 animate-heart-float-up drop-shadow-[0_4px_8px_rgba(225,29,72,0.28)]"
              style={
                {
                  left: `${p.leftPercent}%`,
                  '--rise-y': `${p.risePx}px`,
                  '--sway-x': `${p.swayPx}px`,
                  '--rot-end': `${p.rotateDeg}deg`,
                  '--heart-scale': '1',
                  '--float-duration': `${p.durationMs}ms`,
                  '--float-delay': `${p.delayMs}ms`,
                } as React.CSSProperties
              }
            >
              <svg
                viewBox="0 0 24 24"
                style={{ width: p.sizePx, height: p.sizePx }}
                fill={p.color}
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="0.8"
                />
              </svg>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
