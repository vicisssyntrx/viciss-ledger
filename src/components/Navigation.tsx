'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  PlusCircle,
  UserPlus,
  Moon,
  Sun,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getCurrentOwner, ownerSignOut } from '@/lib/supabase/client';

interface NavigationProps {
  onOpenAddTransaction?: () => void;
  onOpenAddPerson?: () => void;
}

export function Navigation({
  onOpenAddTransaction,
  onOpenAddPerson,
}: NavigationProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [owner, setOwner] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    getCurrentOwner().then(setOwner);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    await ownerSignOut();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'People', href: '/people', icon: Users },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isPublicShare = pathname.startsWith('/share');
  const isLoginPage = pathname === '/login';
  if (isPublicShare || isLoginPage) {
    return null; // Public share and login pages do not display private navigation
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 shrink-0 justify-between min-h-screen">
        <div className="flex flex-col gap-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo size="md" showTagline={true} />
          </Link>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onOpenAddTransaction}
              className="btn-premium-brown w-full py-2.5 px-3 rounded-xl text-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Record Transaction</span>
            </button>
            <button
              onClick={onOpenAddPerson}
              className="btn-premium-brown-outline w-full py-2 px-3 rounded-xl text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Add New Person</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-2">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-950/15 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold border-l-2 border-amber-600 dark:border-amber-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Account status */}
        <div className="flex flex-col gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
          {/* Owner Account Card / Login Button */}
          {owner ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-300 dark:border-amber-800">
                  {owner.email.substring(0, 1).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-200 block truncate" title={owner.email}>
                    {owner.email}
                  </span>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Owner Active</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Log Out"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span>Owner Sign In</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Theme</span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
          <div className="px-2 text-[11px] text-slate-400 dark:text-slate-500">
            Viciss-Ledger v1.0.0
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shrink-0">
        <Link href="/" className="shrink-0">
          <BrandLogo size="sm" showTagline={false} />
        </Link>
        <div className="flex items-center gap-1.5">
          {owner ? (
            <button
              onClick={handleSignOut}
              title="Log Out"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/login"
              title="Sign In"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            onClick={onOpenAddTransaction}
            className="btn-premium-brown px-3 py-1.5 rounded-lg text-xs"
            title="Record Transaction"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline text-xs">Record</span>
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around pt-2 pb-safe px-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-[11px] font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
