export interface PersonColorConfig {
  id: string;
  label: string;
  hex: string;
  borderClass: string;
  avatarBgClass: string;
  badgeBgClass: string;
  ringClass: string;
}

export const PERSON_COLORS: PersonColorConfig[] = [
  {
    id: 'amber',
    label: 'Amber Gold',
    hex: '#f59e0b',
    borderClass: 'border-l-4 border-l-amber-500',
    avatarBgClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    badgeBgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    ringClass: 'ring-amber-500',
  },
  {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#10b981',
    borderClass: 'border-l-4 border-l-emerald-500',
    avatarBgClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    badgeBgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    ringClass: 'ring-emerald-500',
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    hex: '#3b82f6',
    borderClass: 'border-l-4 border-l-blue-500',
    avatarBgClass: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    badgeBgClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    ringClass: 'ring-blue-500',
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    hex: '#a855f7',
    borderClass: 'border-l-4 border-l-purple-500',
    avatarBgClass: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
    badgeBgClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    ringClass: 'ring-purple-500',
  },
  {
    id: 'rose',
    label: 'Ruby Rose',
    hex: '#f43f5e',
    borderClass: 'border-l-4 border-l-rose-500',
    avatarBgClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
    badgeBgClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    ringClass: 'ring-rose-500',
  },
  {
    id: 'cyan',
    label: 'Cyan Teal',
    hex: '#06b6d4',
    borderClass: 'border-l-4 border-l-cyan-500',
    avatarBgClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    badgeBgClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    ringClass: 'ring-cyan-500',
  },
  {
    id: 'orange',
    label: 'Vibrant Coral',
    hex: '#f97316',
    borderClass: 'border-l-4 border-l-orange-500',
    avatarBgClass: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    badgeBgClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    ringClass: 'ring-orange-500',
  },
  {
    id: 'bronze',
    label: 'Warm Bronze',
    hex: '#ad8366',
    borderClass: 'border-l-4 border-l-[#ad8366]',
    avatarBgClass: 'bg-amber-900/30 text-[#d8c7b8] border-[#ad8366]/40',
    badgeBgClass: 'bg-amber-900/20 text-[#d8c7b8] border-[#ad8366]/30',
    ringClass: 'ring-[#ad8366]',
  },
];

export function getPersonColorConfig(colorId?: string): PersonColorConfig {
  if (!colorId) {
    return PERSON_COLORS[0]; // Default Amber Gold
  }
  const found = PERSON_COLORS.find((c) => c.id.toLowerCase() === colorId.toLowerCase());
  return found || PERSON_COLORS[0];
}
