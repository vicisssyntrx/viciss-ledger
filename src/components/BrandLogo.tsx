import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  inverted?: boolean;
}

export function BrandLogo({ className = '', size = 'md', showTagline = false, inverted = false }: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Icon using user-uploaded high-res metallic VS logo */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-md shadow-slate-900/10 border border-amber-900/30 dark:border-amber-500/20 bg-slate-900`}
      >
        <img
          src="/logo-dark.png"
          alt="Viciss-Ledger Logo"
          className={`w-full h-full object-cover ${inverted ? 'block' : 'hidden dark:block'}`}
        />
        {!inverted && (
          <img
            src="/logo-light.png"
            alt="Viciss-Ledger Logo"
            className="w-full h-full object-cover block dark:hidden"
          />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold tracking-tight ${inverted ? 'text-white' : 'text-slate-900 dark:text-white'} ${textSizes[size]}`}>
            Viciss<span className="text-emerald-500 dark:text-emerald-400">-Ledger</span>
          </span>
          <span className="rounded bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
            INR
          </span>
        </div>
        {showTagline && (
          <span className={`text-xs font-normal ${inverted ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Every Transaction. Every Balance. One Place.
          </span>
        )}
      </div>
    </div>
  );
}
