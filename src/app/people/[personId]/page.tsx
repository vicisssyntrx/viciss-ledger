'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Search,
  Filter,
  Calendar,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { TransactionModal } from '@/components/TransactionModal';
import { ShareModal } from '@/components/ShareModal';
import { PersonModal } from '@/components/PersonModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Person, PersonSummary, TransactionWithRunningBalance, Transaction } from '@/lib/accounting/types';
import { formatINR } from '@/lib/accounting/currency';
import { getCardTheme } from '@/lib/accounting/cardColors';

function IndividualLedgerContent() {
  const params = useParams();
  const personId = params?.personId as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [summary, setSummary] = useState<PersonSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithRunningBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!personId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/people/${personId}`);
      if (res.ok) {
        const data = await res.json();
        setPerson(data.person);
        setSummary(data.summary);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    const res = await fetch(`/api/transactions/${txToDelete.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete transaction');
    }
    fetchLedger();
  };

  const categories = Array.from(new Set(transactions.map((t) => t.category))).filter(Boolean);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const descMatch = tx.description.toLowerCase().includes(q);
      const catMatch = tx.category.toLowerCase().includes(q);
      const notesMatch = tx.notes?.toLowerCase().includes(q);
      return descMatch || catMatch || notesMatch;
    }

    return true;
  });

  if (isLoading && !person) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navigation />
        <main className="flex-1 p-8 text-center text-sm text-slate-400">Loading ledger...</main>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navigation />
        <main className="flex-1 p-8 text-center space-y-4">
          <p className="text-sm text-slate-500">Person not found.</p>
          <Link href="/people" className="text-xs text-emerald-600 hover:underline">
            Back to People
          </Link>
        </main>
      </div>
    );
  }

  const isPositive = (summary?.currentBalancePaise ?? 0) > 0;
  const isNegative = (summary?.currentBalancePaise ?? 0) < 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      <Navigation
        onOpenAddTransaction={() => {
          setTxToEdit(null);
          setIsAddTxOpen(true);
        }}
      />

      <main className="flex-1 min-w-0 w-full pb-28 md:pb-12 pt-4 sm:pt-6 px-3.5 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            href="/people"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to People</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-premium-brown-outline px-3 py-1.5 text-xs rounded-xl"
              title="Edit details or change card color"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit / Color</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="btn-premium-brown-outline px-3 py-1.5 text-xs rounded-xl"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{person.isSharingEnabled ? 'Share Active' : 'Share Ledger'}</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="btn-premium-brown px-3.5 py-1.5 text-xs rounded-xl"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Add Entry</span>
            </button>
          </div>
        </div>

        {/* Person Header Card */}
        {(() => {
          const theme = getCardTheme(person.color);
          return (
            <div
              style={theme.cardStyle}
              className={`p-6 rounded-2xl border transition-all mb-6 ${theme.cardClass}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div
                    style={theme.avatarStyle}
                    className={`w-16 h-16 rounded-2xl font-extrabold flex items-center justify-center text-xl border shadow-2xs shrink-0 ${theme.avatarClass}`}
                  >
                    {person.name.substring(0, 2).toUpperCase()}
                  </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {person.name}
                  </h1>
                  {person.nickname && (
                    <span className="text-sm font-medium text-slate-400">
                      (@{person.nickname})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {person.phone && <span>{person.phone}</span>}
                  {person.email && (
                    <>
                      <span>•</span>
                      <span>{person.email}</span>
                    </>
                  )}
                  {person.notes && (
                    <>
                      <span>•</span>
                      <span className="italic">{person.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Current Net Balance Display */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-black/25 border border-black/10 dark:border-white/10 text-left md:text-right shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Net Balance
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {formatINR(summary?.currentBalancePaise ?? 0, { absolute: true })}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : isNegative
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {summary?.statusLabel || 'Settled'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Give Money</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-900 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Receive Money</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200/50 dark:border-amber-900 transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>Add Expense</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-semibold border border-teal-200/50 dark:border-teal-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>Record Repayment</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200/50 dark:border-purple-900 transition-colors cursor-pointer col-span-2 sm:col-span-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
              <span>Adjustment</span>
            </button>
          </div>
        </div>
          );
        })()}

        {/* Financial Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              I Gave Them
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {formatINR(summary?.totalGivenToThemPaise ?? 0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              They Gave Me
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {formatINR(summary?.totalReceivedFromThemPaise ?? 0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Repaid by Them
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(summary?.totalRepaidByThemPaise ?? 0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Repaid by Me
            </span>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatINR(summary?.totalRepaidByMePaise ?? 0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Expenses for Them
            </span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatINR(summary?.totalExpensesForThemPaise ?? 0)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Shared Expenses
            </span>
            <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1">
              {formatINR(summary?.totalSharedExpensesPaise ?? 0)}
            </div>
          </div>
        </div>

        {/* Transactions Table & Filter Bar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Transaction History
              </h2>
              <span className="text-xs text-slate-400">
                ({filteredTransactions.length} records)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="GIVE_MONEY">Gave Money</option>
                <option value="RECEIVE_MONEY">Received Money</option>
                <option value="EXPENSE">Expense</option>
                <option value="REPAYMENT">Repayment</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <p>No transactions match your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                  setFilterCategory('ALL');
                }}
                className="text-emerald-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTransactions.map((tx) => {
                  const isPositiveEffect = tx.balanceEffectPaise > 0;
                  const isNegativeEffect = tx.balanceEffectPaise < 0;

                  return (
                    <div key={tx.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {tx.transactionDate}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-medium text-[10px] ${
                              tx.type === 'GIVE_MONEY'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : tx.type === 'RECEIVE_MONEY'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                                : tx.type === 'EXPENSE'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                : tx.type === 'REPAYMENT'
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                            }`}
                          >
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            Amount: {formatINR(tx.amountPaise)}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isPositiveEffect
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isNegativeEffect
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            Effect: {formatINR(tx.balanceEffectPaise, { showSign: true })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {tx.description}
                          </p>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">{tx.notes}</p>
                          )}
                        </div>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] shrink-0">
                          {tx.category}
                        </span>
                      </div>

                      {/* Running Balance Banner for Mobile */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/10 dark:bg-amber-950/30 border border-amber-900/20 text-xs">
                        <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                          Running Balance:
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatINR(tx.runningBalancePaise)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setTxToEdit(tx);
                            setIsAddTxOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setTxToDelete(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Original Amount</th>
                      <th className="py-3 px-4 text-right">Balance Effect</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredTransactions.map((tx) => {
                      const isPositiveEffect = tx.balanceEffectPaise > 0;
                      const isNegativeEffect = tx.balanceEffectPaise < 0;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {tx.transactionDate}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md font-medium text-[10px] ${
                                tx.type === 'GIVE_MONEY'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : tx.type === 'RECEIVE_MONEY'
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                                  : tx.type === 'EXPENSE'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                  : tx.type === 'REPAYMENT'
                                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                              }`}
                            >
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                            {tx.description}
                            {tx.notes && (
                              <span className="block text-[11px] text-slate-400 font-normal italic truncate">
                                {tx.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatINR(tx.amountPaise)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                              isPositiveEffect
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isNegativeEffect
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatINR(tx.balanceEffectPaise, { showSign: true })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {formatINR(tx.runningBalancePaise)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setTxToEdit(tx);
                                  setIsAddTxOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Edit transaction"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setTxToDelete(tx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setTxToEdit(null);
        }}
        onSuccess={fetchLedger}
        people={[person]}
        currentPersonId={person.id}
        initialTransaction={txToEdit}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        person={person}
        onUpdate={fetchLedger}
      />

      <PersonModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchLedger}
        personToEdit={person}
      />

      {txToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(txToDelete)}
          onClose={() => setTxToDelete(null)}
          onConfirm={handleDeleteTransaction}
          title="Delete Transaction?"
          message={`Are you sure you want to delete "${txToDelete.description}" (${formatINR(txToDelete.amountPaise)})? All subsequent running balances will be recalculated immediately.`}
        />
      )}
    </div>
  );
}

export default function IndividualLedgerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-sm text-slate-400">
          Loading ledger...
        </div>
      }
    >
      <IndividualLedgerContent />
    </React.Suspense>
  );
}

