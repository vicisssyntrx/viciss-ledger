export interface CardColorTheme {
  id: string;
  label: string;
  hex: string;
  cardClass: string;
  avatarClass: string;
}

export const CARD_COLORS: CardColorTheme[] = [
  {
    id: 'default',
    label: 'Espresso',
    hex: '#5c4838',
    cardClass:
      'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-700/50 shadow-xs',
    avatarClass:
      'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700',
  },
  {
    id: 'amber',
    label: 'Amber Gold',
    hex: '#d97706',
    cardClass:
      'bg-amber-100/90 dark:bg-[#2b1f14] border-amber-300 dark:border-amber-800/80 hover:border-amber-500 shadow-xs',
    avatarClass:
      'bg-amber-500/25 dark:bg-amber-500/30 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-600/50',
  },
  {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#059669',
    cardClass:
      'bg-emerald-100/90 dark:bg-[#132820] border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 shadow-xs',
    avatarClass:
      'bg-emerald-500/25 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600/50',
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    hex: '#2563eb',
    cardClass:
      'bg-blue-100/90 dark:bg-[#15233b] border-blue-300 dark:border-blue-800/80 hover:border-blue-500 shadow-xs',
    avatarClass:
      'bg-blue-500/25 dark:bg-blue-500/30 text-blue-900 dark:text-blue-300 border-blue-400 dark:border-blue-600/50',
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    hex: '#9333ea',
    cardClass:
      'bg-purple-100/90 dark:bg-[#271836] border-purple-300 dark:border-purple-800/80 hover:border-purple-500 shadow-xs',
    avatarClass:
      'bg-purple-500/25 dark:bg-purple-500/30 text-purple-900 dark:text-purple-300 border-purple-400 dark:border-purple-600/50',
  },
  {
    id: 'rose',
    label: 'Ruby Rose',
    hex: '#e11d48',
    cardClass:
      'bg-rose-100/90 dark:bg-[#2f1620] border-rose-300 dark:border-rose-800/80 hover:border-rose-500 shadow-xs',
    avatarClass:
      'bg-rose-500/25 dark:bg-rose-500/30 text-rose-900 dark:text-rose-300 border-rose-400 dark:border-rose-600/50',
  },
  {
    id: 'cyan',
    label: 'Cyan Teal',
    hex: '#0891b2',
    cardClass:
      'bg-cyan-100/90 dark:bg-[#12282e] border-cyan-300 dark:border-cyan-800/80 hover:border-cyan-500 shadow-xs',
    avatarClass:
      'bg-cyan-500/25 dark:bg-cyan-500/30 text-cyan-900 dark:text-cyan-300 border-cyan-400 dark:border-cyan-600/50',
  },
  {
    id: 'orange',
    label: 'Vibrant Coral',
    hex: '#ea580c',
    cardClass:
      'bg-orange-100/90 dark:bg-[#2d1b13] border-orange-300 dark:border-orange-800/80 hover:border-orange-500 shadow-xs',
    avatarClass:
      'bg-orange-500/25 dark:bg-orange-500/30 text-orange-900 dark:text-orange-300 border-orange-400 dark:border-orange-600/50',
  },
  {
    id: 'bronze',
    label: 'Warm Bronze',
    hex: '#92400e',
    cardClass:
      'bg-[#f5ebe1] dark:bg-[#261d18] border-[#dfcbba] dark:border-[#523d30] hover:border-[#ad8366] shadow-xs',
    avatarClass:
      'bg-[#ad8366]/25 dark:bg-[#ad8366]/30 text-[#684126] dark:text-[#f3dfce] border-[#ad8366]/50',
  },
];

export function getCardTheme(colorId?: string): CardColorTheme {
  if (!colorId || colorId === 'default') {
    return CARD_COLORS[0];
  }
  const found = CARD_COLORS.find((c) => c.id.toLowerCase() === colorId.toLowerCase());
  return found || CARD_COLORS[0];
}
