export interface ColorPreset {
  id: string;
  label: string;
  class: string;
  preview: string;
  badgeBg: string;
}

export const COMMUNITY_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'red',
    label: 'أحمر ياقوتي ناصع (شاعري)',
    class: 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800 text-white',
    preview: 'bg-red-600 border border-red-700',
    badgeBg: 'bg-red-600 text-white',
  },
  {
    id: 'crimson',
    label: 'عنابي / قرمزي كلاسيكي',
    class: 'bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] text-white',
    preview: 'bg-[#991b1b] border border-[#7f1d1d]',
    badgeBg: 'bg-[#991b1b] text-white',
  },
  {
    id: 'ruby',
    label: 'ياقوتي داكن فخم',
    class: 'bg-gradient-to-br from-[#4c0519] via-[#881337] to-[#be123c] text-white',
    preview: 'bg-[#881337] border border-[#4c0519]',
    badgeBg: 'bg-[#881337] text-white',
  },
  {
    id: 'navy',
    label: 'أزرق ملكي كحلي',
    class: 'bg-gradient-to-br from-[#07243c] via-[#0b385e] to-[#0d4573] text-white',
    preview: 'bg-[#0b385e] border border-[#07243c]',
    badgeBg: 'bg-[#0b385e] text-white',
  },
  {
    id: 'amber',
    label: 'عنبر أدبي مذهب',
    class: 'bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#dfa85b] text-white',
    preview: 'bg-[#b45309] border border-[#78350f]',
    badgeBg: 'bg-[#b45309] text-white',
  },
  {
    id: 'emerald',
    label: 'زمردي عميق',
    class: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white',
    preview: 'bg-[#064e3b] border border-[#022c22]',
    badgeBg: 'bg-[#064e3b] text-white',
  },
  {
    id: 'purple',
    label: 'بنفسجي شاعري',
    class: 'bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#7c3aed] text-white',
    preview: 'bg-[#4c1d95] border border-[#2e1065]',
    badgeBg: 'bg-[#4c1d95] text-white',
  },
  {
    id: 'midnight',
    label: 'ليلي فاحم',
    class: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] text-white',
    preview: 'bg-[#0f172a] border border-black',
    badgeBg: 'bg-[#0f172a] text-white',
  },
  {
    id: 'none',
    label: 'بدون لون (أبيض نقي كلاسيكي)',
    class: 'bg-white text-slate-800',
    preview: 'bg-white border-2 border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
  },
];

/**
 * Resolves color id to preset object with smart fallbacks for any red variation
 */
export function getCommunityColorPreset(colorId?: string): ColorPreset {
  if (!colorId || colorId === 'none') {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'none')!;
  }

  const normalized = String(colorId).trim().toLowerCase();

  // Smart matching for red/ruby/crimson variants
  if (
    normalized === 'red' ||
    normalized === 'ahmar' ||
    normalized === 'أحمر' ||
    normalized.includes('red') ||
    normalized.includes('rose')
  ) {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'red')!;
  }

  if (
    normalized === 'crimson' ||
    normalized === 'عنابي' ||
    normalized === 'قرمزي' ||
    normalized.includes('crimson')
  ) {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'crimson')!;
  }

  if (normalized === 'ruby' || normalized === 'ياقوتي') {
    return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'ruby')!;
  }

  const exactMatch = COMMUNITY_COLOR_PRESETS.find((c) => c.id === normalized);
  if (exactMatch) return exactMatch;

  // Fallback to red if it was a color card attempt, or white
  return COMMUNITY_COLOR_PRESETS.find((c) => c.id === 'red') || COMMUNITY_COLOR_PRESETS[0];
}
