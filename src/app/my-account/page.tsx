'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  History,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Info,
  Users,
  ChevronRight,
  PiggyBank,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { TransactionModal } from '@/components/TransactionModal';
import { PersonModal } from '@/components/PersonModal';
import { formatINR } from '@/lib/accounting/currency';
import { getCardTheme } from '@/lib/accounting/cardColors';
import { Person } from '@/lib/accounting/types';

interface MyAccountData {
  settings: {
    initialBalancePaise: number;
    manualAdjustmentsPaise: number;
    history: Array<{
      id: string;
      type: 'CREDIT' | 'DEBIT' | 'SET';
      amountPaise: number;
      description: string;
      createdAt: string;
    }>;
  };
  myPersonalFundsPaise: number;
  totalInflowsPaise: number;
  totalOutflowsPaise: number;
  netLedgerMovementPaise: number;
  totalOthersHeldPaise: number;
  totalPresentAccountBalancePaise: number;
  breakdown: Array<{
    personId: string;
    name: string;
    color?: string;
    inflowPaise: number;
    outflowPaise: number;
    netContributionPaise: number;
    txCount: number;
  }>;
}

export default function MyAccountPage() {
  const [data, setData] = useState<MyAccountData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Adjustment Modal / Form State
  const [adjustmentType, setAdjustmentType] = useState<'CREDIT' | 'DEBIT' | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDesc, setAdjDesc] = useState('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);

  // Edit Base Funds state
  const [isEditingBase, setIsEditingBase] = useState(false);
  const [baseInput, setBaseInput] = useState('');

  // Global modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  const fetchAccountData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [acctRes, peopleRes] = await Promise.all([
        fetch('/api/my-account'),
        fetch('/api/people'),
      ]);
      if (!acctRes.ok) {
        throw new Error('Failed to load account details');
      }
      const json = await acctRes.json();
      setData(json);
      setBaseInput((json.settings.initialBalancePaise / 100).toFixed(2));

      if (peopleRes.ok) {
        const pJson = await peopleRes.json();
        setPeople(pJson.rawPeople || pJson.people || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching account');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const handleSaveBaseFunds = async () => {
    const val = parseFloat(baseInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      const res = await fetch('/api/my-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_INITIAL',
          amountRupees: val,
          description: 'Updated personal baseline funds',
        }),
      });
      if (res.ok) {
        setIsEditingBase(false);
        fetchAccountData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentType) return;
    const val = parseFloat(adjAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }

    setIsSubmittingAdj(true);
    try {
      const res = await fetch('/api/my-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: adjustmentType,
          amountRupees: val,
          description: adjDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setAdjustmentType(null);
        setAdjAmount('');
        setAdjDesc('');
        fetchAccountData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to apply adjustment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      <Navigation
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Wallet className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                My Bank & Account Balance
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real cash in your bank account, separating your personal money from funds held on behalf of others.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdjustmentType('CREDIT')}
              className="btn-premium-brown px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Credit My Funds</span>
            </button>
            <button
              onClick={() => setAdjustmentType('DEBIT')}
              className="btn-premium-brown-outline px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 text-rose-400" />
              <span>Debit My Funds</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Calculating actual account balance & breakdown...
          </div>
        ) : error || !data ? (
          <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
            {error || 'Unable to compute balance'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* HERO: TOTAL PRESENT ACCOUNT BALANCE */}
            <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-900/40 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Total Present Bank / Cash Balance
                    </span>
                    <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-1.5 font-mono">
                      {formatINR(data.totalPresentAccountBalancePaise)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 max-w-xl">
                      This represents the exact amount of money currently residing in your bank account, taking into account your personal capital plus all funds deposited by others.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 shrink-0 flex flex-col gap-2 min-w-[220px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">My Own Money:</span>
                      <span className="font-bold font-mono text-emerald-400">
                        {formatINR(data.myPersonalFundsPaise)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Others&apos; Money Held:</span>
                      <span className="font-bold font-mono text-amber-400">
                        {formatINR(data.totalOthersHeldPaise)}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Total in Account:</span>
                      <span className="font-mono text-white">
                        {formatINR(data.totalPresentAccountBalancePaise)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* THREE COLUMNS: Personal Funds vs Others' Funds vs Net Cash Movement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: My Personal Funds */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    My Pure Personal Capital
                  </span>
                  <PiggyBank className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(data.myPersonalFundsPaise)}
                </div>
                
                {isEditingBase ? (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={baseInput}
                      onChange={(e) => setBaseInput(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Base funds (₹)"
                    />
                    <button
                      onClick={handleSaveBaseFunds}
                      className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingBase(false)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Baseline: {formatINR(data.settings.initialBalancePaise)}</span>
                    <button
                      onClick={() => setIsEditingBase(true)}
                      className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Base</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Box 2: Total Others' Funds Sitting in My Account */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Others&apos; Money in My A/C
                  </span>
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                  {formatINR(data.totalOthersHeldPaise)}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Remaining amount from funds people gave you for investments, expenses, or holding.
                </p>
              </div>

              {/* Box 3: Total Cash Movements */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Net Ledger Inflow/Outflow
                  </span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                    <ArrowDownLeft className="w-3.5 h-3.5" /> In: {formatINR(data.totalInflowsPaise)}
                  </span>
                  <span className="text-xs font-semibold text-rose-500 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Out: {formatINR(data.totalOutflowsPaise)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Total bank credits vs debits recorded across all ledgers.
                </p>
              </div>
            </div>

            {/* BREAKDOWN: WHAT ALL AMOUNT ADDS UP TO MAKE THIS BALANCE */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  Account Balance Composition (Who Contributed What)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed reconciliation of where the remaining money in your account comes from.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
                {/* 1. Base personal money */}
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                      ME
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        My Personal Money (Unclassified / Own Capital)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Baseline funds ({formatINR(data.settings.initialBalancePaise)}) + Manual Adjustments ({formatINR(data.settings.manualAdjustmentsPaise, { showSign: true })})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block">
                      {formatINR(data.myPersonalFundsPaise)}
                    </span>
                    <span className="text-[10px] text-emerald-600/80 font-medium uppercase tracking-wider">
                      Personal Ownership
                    </span>
                  </div>
                </div>

                {/* 2. Breakdown of each person's remaining funds in your account */}
                {data.breakdown.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No individual ledger contributions yet.
                  </div>
                ) : (
                  data.breakdown.map((item) => {
                    const theme = getCardTheme(item.color);
                    const isPositiveSitting = item.netContributionPaise > 0;
                    return (
                      <div
                        key={item.personId}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            style={theme.avatarStyle}
                            className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs border shrink-0 ${theme.avatarClass}`}
                          >
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/people/${item.personId}`}
                              className="text-sm font-bold text-slate-900 dark:text-white hover:text-amber-500 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{item.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Deposited: {formatINR(item.inflowPaise)}</span>
                              <span>•</span>
                              <span>Spent/Outflow: {formatINR(item.outflowPaise)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span
                            className={`text-sm font-bold font-mono block ${
                              isPositiveSitting
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isPositiveSitting
                              ? `+ ${formatINR(item.netContributionPaise)} remaining in A/C`
                              : `${formatINR(item.netContributionPaise)} net`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isPositiveSitting
                              ? 'Held in your account on their behalf'
                              : 'No excess cash held'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* MANUAL ADJUSTMENTS AUDIT HISTORY */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    Personal Funds Adjustment Log
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    History of manual credits and debits applied to your personal account.
                  </p>
                </div>
              </div>

              {data.settings.history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No adjustments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.settings.history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`p-1.5 rounded-lg text-xs font-bold ${
                            h.type === 'CREDIT'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : h.type === 'DEBIT'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {h.type}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {h.description}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-bold font-mono text-sm ${
                          h.type === 'CREDIT'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : h.type === 'DEBIT'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-500'
                        }`}
                      >
                        {h.type === 'CREDIT' ? '+' : h.type === 'DEBIT' ? '-' : ''}
                        {formatINR(h.amountPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Manual Credit / Debit Adjustment Modal */}
      {adjustmentType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {adjustmentType === 'CREDIT' ? 'Credit My Personal Account' : 'Debit My Personal Account'}
              </h3>
              <button
                onClick={() => setAdjustmentType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Description (Optional)
                </label>
                <input
                  type="text"
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  placeholder="e.g. Salary credited, ATM cash withdrawal, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdj}
                  className="btn-premium-brown px-4 py-2 text-xs rounded-xl"
                >
                  {isSubmittingAdj ? 'Applying...' : `Confirm ${adjustmentType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={fetchAccountData}
        people={people}
      />

      <PersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={fetchAccountData}
      />
    </div>
  );
}
