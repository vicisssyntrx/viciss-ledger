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
    label: 'Default Espresso',
    hex: '#30241c',
    cardClass:
      'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-700/40 dark:hover:border-amber-700/50 shadow-2xs',
    avatarClass:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  {
    id: 'amber',
    label: 'Amber Gold',
    hex: '#f59e0b',
    cardClass:
      'bg-amber-50/60 dark:bg-gradient-to-br dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 border-amber-300/80 dark:border-amber-500/40 hover:border-amber-500/70 shadow-amber-950/20',
    avatarClass:
      'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  },
  {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#10b981',
    cardClass:
      'bg-emerald-50/60 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 border-emerald-300/80 dark:border-emerald-500/40 hover:border-emerald-500/70 shadow-emerald-950/20',
    avatarClass:
      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    hex: '#3b82f6',
    cardClass:
      'bg-blue-50/60 dark:bg-gradient-to-br dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 border-blue-300/80 dark:border-blue-500/40 hover:border-blue-500/70 shadow-blue-950/20',
    avatarClass:
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    hex: '#a855f7',
    cardClass:
      'bg-purple-50/60 dark:bg-gradient-to-br dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20 border-purple-300/80 dark:border-purple-500/40 hover:border-purple-500/70 shadow-purple-950/20',
    avatarClass:
      'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
  },
  {
    id: 'rose',
    label: 'Ruby Rose',
    hex: '#f43f5e',
    cardClass:
      'bg-rose-50/60 dark:bg-gradient-to-br dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20 border-rose-300/80 dark:border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20',
    avatarClass:
      'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
  },
  {
    id: 'cyan',
    label: 'Cyan Teal',
    hex: '#06b6d4',
    cardClass:
      'bg-cyan-50/60 dark:bg-gradient-to-br dark:from-cyan-950/40 dark:via-slate-900 dark:to-cyan-950/20 border-cyan-300/80 dark:border-cyan-500/40 hover:border-cyan-500/70 shadow-cyan-950/20',
    avatarClass:
      'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'orange',
    label: 'Vibrant Coral',
    hex: '#f97316',
    cardClass:
      'bg-orange-50/60 dark:bg-gradient-to-br dark:from-orange-950/40 dark:via-slate-900 dark:to-orange-950/20 border-orange-300/80 dark:border-orange-500/40 hover:border-orange-500/70 shadow-orange-950/20',
    avatarClass:
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40',
  },
  {
    id: 'bronze',
    label: 'Warm Bronze',
    hex: '#ad8366',
    cardClass:
      'bg-amber-900/10 dark:bg-gradient-to-br dark:from-amber-950/50 dark:via-slate-900 dark:to-[#322319]/40 border-[#ad8366]/40 hover:border-[#ad8366]/70 shadow-amber-950/30',
    avatarClass:
      'bg-[#ad8366]/20 text-[#8c6449] dark:text-[#e5d1c2] border-[#ad8366]/40',
  },
];

export function getCardTheme(colorId?: string): CardColorTheme {
  if (!colorId || colorId === 'default') {
    return CARD_COLORS[0];
  }
  const found = CARD_COLORS.find((c) => c.id.toLowerCase() === colorId.toLowerCase());
  return found || CARD_COLORS[0];
}
