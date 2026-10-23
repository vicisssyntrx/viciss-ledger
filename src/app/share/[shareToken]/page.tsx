'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Calendar,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { formatINR } from '@/lib/accounting/currency';

interface PublicLedgerData {
  person: {
    name: string;
    nickname?: string;
  };
  transactions: {
    id: string;
    transactionDate: string;
    type: string;
    description: string;
    category: string;
    amountPaise: number;
    balanceEffectPaise: number;
  }[];
  currentBalancePaise: number;
  status: 'OWED_TO_ME' | 'I_OWE' | 'SETTLED';
  statusLabel: string;
  formattedCurrentBalance: string;
  isSettled: boolean;
}

function PublicSharedLedgerContent() {
  const params = useParams();
  const shareToken = params?.shareToken as string;

  const [data, setData] = useState<PublicLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;

    async function fetchSharedLedger() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/share/${shareToken}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Shared ledger not found or access has been revoked.');
        }
        const json = await res.json();
        setData(json.ledger);
      } catch (err: any) {
        setError(err.message || 'Unable to access shared ledger');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSharedLedger();
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <BrandLogo size="md" showTagline={true} />
        <p className="text-xs text-slate-400 mt-4">Verifying secure shared ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Access Unavailable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error || 'This public ledger link does not exist, has expired, or has been revoked by the account owner.'}
          </p>
          <div className="pt-2">
            <BrandLogo size="sm" showTagline={false} className="justify-center" />
          </div>
        </div>
      </div>
    );
  }

  const isOwed = data.currentBalancePaise > 0;
  const iOwe = data.currentBalancePaise < 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Branding & Read-Only Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <BrandLogo size="md" showTagline={true} />

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Read-Only Statement</span>
            </span>
          </div>
        </div>

        {/* Ledger Statement Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Shared Statement For
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                {data.person.name}
              </h1>
              {data.person.nickname && (
                <span className="text-sm font-medium text-slate-400">
                  @{data.person.nickname}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left sm:text-right shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Current Statement Balance
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${
                  isOwed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : iOwe
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {data.formattedCurrentBalance}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isOwed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : iOwe
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isOwed
                    ? `You owe ₹${(data.currentBalancePaise / 100).toLocaleString('en-IN')}`
                    : iOwe
                    ? `Owed to you ₹${Math.abs(data.currentBalancePaise / 100).toLocaleString('en-IN')}`
                    : 'Settled'}
                </span>
              </div>
            </div>
          </div>

          {/* Statement Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <p>
              This is a personal financial ledger shared with you. Outstanding balances are
              automatically calculated from the transactions listed below.
            </p>
          </div>

          {/* Transaction History Table */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Shared Transaction History
            </h2>

            {data.transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No shared transactions recorded.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Type</th>
                      <th className="py-2.5 px-3.5">Description</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5 text-right">Amount</th>
                      <th className="py-2.5 px-3.5 text-right">Balance Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {data.transactions.map((tx) => {
                      const isPositive = tx.balanceEffectPaise > 0;
                      const isNegative = tx.balanceEffectPaise < 0;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                            {tx.transactionDate}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white">
                            {tx.description}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                            {tx.category}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatINR(tx.amountPaise)}
                          </td>
                          <td
                            className={`py-2.5 px-3.5 text-right font-semibold whitespace-nowrap ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatINR(tx.balanceEffectPaise, { showSign: true })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4">
          Powered by <span className="font-semibold text-slate-600 dark:text-slate-300">Viciss-Ledger</span> • Secure Personal Accounting
        </div>
      </div>
    </div>
  );
}

export default function PublicSharedLedgerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <BrandLogo size="md" showTagline={true} />
          <p className="text-xs text-slate-400 mt-4">Verifying secure shared ledger...</p>
        </div>
      }
    >
      <PublicSharedLedgerContent />
    </React.Suspense>
  );
}

