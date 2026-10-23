import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
          <WifiOff className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          You are currently offline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Viciss-Ledger requires an active network connection to process financial transactions accurately and synchronize ledgers securely.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Reconnecting</span>
          </Link>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <BrandLogo size="sm" showTagline={false} className="justify-center" />
        </div>
      </div>
    </div>
  );
}
