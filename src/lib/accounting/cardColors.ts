export interface CardColorTheme {
  id: string;
  label: string;
  hex: string;
  cardClass: string;
  avatarClass: string;
  cardStyle?: React.CSSProperties;
  avatarStyle?: React.CSSProperties;
}

export const CARD_COLORS: CardColorTheme[] = [
  {
    id: 'default',
    label: 'Espresso',
    hex: '#5c4838',
    cardClass:
      'border-stone-200 dark:border-stone-800 hover:border-amber-700/50 shadow-xs',
    avatarClass:
      'text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700',
    cardStyle: {
      backgroundColor: 'rgba(92, 72, 56, 0.08)',
      borderColor: 'rgba(92, 72, 56, 0.25)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(92, 72, 56, 0.25)',
      color: '#f5ede6',
      borderColor: 'rgba(92, 72, 56, 0.4)',
    },
  },
  {
    id: 'amber',
    label: 'Amber Gold',
    hex: '#d97706',
    cardClass:
      'border-amber-300 dark:border-amber-800/80 hover:border-amber-500 shadow-xs',
    avatarClass:
      'border-amber-400 dark:border-amber-600/50',
    cardStyle: {
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      borderColor: 'rgba(217, 119, 6, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(217, 119, 6, 0.3)',
      color: '#fef3c7',
      borderColor: 'rgba(217, 119, 6, 0.55)',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald Green',
    hex: '#059669',
    cardClass:
      'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 shadow-xs',
    avatarClass:
      'border-emerald-400 dark:border-emerald-600/50',
    cardStyle: {
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
      borderColor: 'rgba(5, 150, 105, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(5, 150, 105, 0.3)',
      color: '#d1fae5',
      borderColor: 'rgba(5, 150, 105, 0.55)',
    },
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    hex: '#2563eb',
    cardClass:
      'border-blue-300 dark:border-blue-800/80 hover:border-blue-500 shadow-xs',
    avatarClass:
      'border-blue-400 dark:border-blue-600/50',
    cardStyle: {
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      borderColor: 'rgba(37, 99, 235, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(37, 99, 235, 0.3)',
      color: '#dbeafe',
      borderColor: 'rgba(37, 99, 235, 0.55)',
    },
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    hex: '#9333ea',
    cardClass:
      'border-purple-300 dark:border-purple-800/80 hover:border-purple-500 shadow-xs',
    avatarClass:
      'border-purple-400 dark:border-purple-600/50',
    cardStyle: {
      backgroundColor: 'rgba(147, 51, 234, 0.12)',
      borderColor: 'rgba(147, 51, 234, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(147, 51, 234, 0.3)',
      color: '#f3e8ff',
      borderColor: 'rgba(147, 51, 234, 0.55)',
    },
  },
  {
    id: 'rose',
    label: 'Ruby Rose',
    hex: '#e11d48',
    cardClass:
      'border-rose-300 dark:border-rose-800/80 hover:border-rose-500 shadow-xs',
    avatarClass:
      'border-rose-400 dark:border-rose-600/50',
    cardStyle: {
      backgroundColor: 'rgba(225, 29, 72, 0.12)',
      borderColor: 'rgba(225, 29, 72, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(225, 29, 72, 0.3)',
      color: '#ffe4e6',
      borderColor: 'rgba(225, 29, 72, 0.55)',
    },
  },
  {
    id: 'cyan',
    label: 'Cyan Teal',
    hex: '#0891b2',
    cardClass:
      'border-cyan-300 dark:border-cyan-800/80 hover:border-cyan-500 shadow-xs',
    avatarClass:
      'border-cyan-400 dark:border-cyan-600/50',
    cardStyle: {
      backgroundColor: 'rgba(8, 145, 178, 0.12)',
      borderColor: 'rgba(8, 145, 178, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(8, 145, 178, 0.3)',
      color: '#cffafe',
      borderColor: 'rgba(8, 145, 178, 0.55)',
    },
  },
  {
    id: 'orange',
    label: 'Vibrant Coral',
    hex: '#ea580c',
    cardClass:
      'border-orange-300 dark:border-orange-800/80 hover:border-orange-500 shadow-xs',
    avatarClass:
      'border-orange-400 dark:border-orange-600/50',
    cardStyle: {
      backgroundColor: 'rgba(234, 88, 12, 0.12)',
      borderColor: 'rgba(234, 88, 12, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(234, 88, 12, 0.3)',
      color: '#ffedd5',
      borderColor: 'rgba(234, 88, 12, 0.55)',
    },
  },
  {
    id: 'bronze',
    label: 'Warm Bronze',
    hex: '#92400e',
    cardClass:
      'border-[#dfcbba] dark:border-[#523d30] hover:border-[#ad8366] shadow-xs',
    avatarClass:
      'border-[#ad8366]/50',
    cardStyle: {
      backgroundColor: 'rgba(146, 64, 14, 0.12)',
      borderColor: 'rgba(146, 64, 14, 0.35)',
    },
    avatarStyle: {
      backgroundColor: 'rgba(146, 64, 14, 0.3)',
      color: '#fef3c7',
      borderColor: 'rgba(146, 64, 14, 0.55)',
    },
  },
];

export function getCardTheme(colorId?: string): CardColorTheme {
  if (!colorId || colorId === 'default') {
    return CARD_COLORS[0];
  }
  const found = CARD_COLORS.find((c) => c.id.toLowerCase() === colorId.toLowerCase());
  return found || CARD_COLORS[0];
}
