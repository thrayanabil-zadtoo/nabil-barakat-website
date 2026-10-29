import React from 'react';

interface AldiwanBadgeIconProps {
  size?: number;
  className?: string;
}

/**
 * علامة النجمة / الشارة الزرقاء الموثقة كما في منصة الدِّيوَان وحساب الكاتب المعتمد
 */
export const AldiwanVerifiedIcon: React.FC<AldiwanBadgeIconProps> = ({
  size = 18,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle drop-shadow-xs ${className}`}
      aria-label="شاعر معتمد وموثق في الدِّيوَان"
    >
      <title>شاعر معتمد وموثق في الدِّيوَان</title>
      {/* 12-Point Scalloped Verified Star in Aldiwan / Twitter Blue */}
      <path
        d="M12 1.5L14.34 3.73L17.51 3.51L18.73 6.47L21.67 7.74L21.57 10.93L23.5 13.5L21.57 16.07L21.67 19.26L18.73 20.53L17.51 23.49L14.34 23.27L12 25.5L9.66 23.27L6.49 23.49L5.27 20.53L2.33 19.26L2.43 16.07L0.5 13.5L2.43 10.93L2.33 7.74L5.27 6.47L6.49 3.51L9.66 3.73L12 1.5Z"
        transform="scale(0.88) translate(1.6, -0.6)"
        fill="#1D9BF0"
      />
      {/* Crisp White Checkmark inside */}
      <path
        d="M8.2 12.2L10.8 14.8L15.8 9.8"
        stroke="#FFFFFF"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface AldiwanTagProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'badge' | 'subtle';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

/**
 * شارة: «شاعر معتمد في الدِّيْـوَانِ» مع علامة النجمة الزرقاء الموثقة
 * تدعم التباين العالي سواء على الخلفيات الفاتحة أو الداكنة
 */
export const AldiwanCertifiedBadge: React.FC<AldiwanTagProps> = ({
  size = 'md',
  variant = 'badge',
  theme = 'light',
  className = '',
}) => {
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 22 : 18;
  const textSize =
    size === 'sm'
      ? 'text-xs'
      : size === 'lg'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  const isDark = theme === 'dark';

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full select-none font-bold ${textSize} transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-sky-500/20 via-[#1D9BF0]/25 to-sky-500/20 border border-[#1D9BF0]/50 text-sky-200 shadow-xs backdrop-blur-xs'
            : 'bg-gradient-to-r from-sky-50 via-sky-100/70 to-blue-50 border border-[#1D9BF0]/50 text-[#0369a1] shadow-2xs'
        } ${className}`}
        title="عضوية شاعر موثّق · أنت شاعر معتمد في الدِّيْـوَانِ"
      >
        <AldiwanVerifiedIcon size={iconSize} />
        <span>
          شاعر معتمد في{' '}
          <strong
            className={`font-black font-literary ${
              isDark ? 'text-white' : 'text-[#07243c]'
            }`}
          >
            الدِّيْـوَانِ
          </strong>
        </span>
      </div>
    );
  }

  if (variant === 'gold') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold ${textSize} select-none ${
          isDark
            ? 'text-[#f5cd72] drop-shadow-md'
            : 'text-amber-800'
        } ${className}`}
        title="عضوية شاعر موثّق · أنت شاعر معتمد في الدِّيْـوَانِ"
      >
        <AldiwanVerifiedIcon size={iconSize} />
        <span>
          شاعر معتمد في{' '}
          <strong
            className={`font-black font-literary ${
              isDark ? 'text-white' : 'text-[#07243c]'
            }`}
          >
            الدِّيْـوَانِ
          </strong>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-semibold ${textSize} select-none ${
        isDark
          ? 'text-sky-200'
          : 'text-[#0369a1]'
      } ${className}`}
      title="عضوية شاعر موثّق · أنت شاعر معتمد في الدِّيْـوَانِ"
    >
      <AldiwanVerifiedIcon size={iconSize} />
      <span>
        شاعر معتمد في{' '}
        <strong
          className={`font-black font-literary ${
            isDark ? 'text-white' : 'text-[#07243c]'
          }`}
        >
          الدِّيْـوَانِ
        </strong>
      </span>
    </div>
  );
};
