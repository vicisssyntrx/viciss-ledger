'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  PlusCircle,
  UserPlus,
  ArrowRight,
  Search,
  ExternalLink,
  Share2,
  Calendar,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { TransactionModal } from '@/components/TransactionModal';
import { PersonModal } from '@/components/PersonModal';
import { ShareModal } from '@/components/ShareModal';
import { DashboardSummary, PersonSummary, Transaction, Person } from '@/lib/accounting/types';
import { formatINR } from '@/lib/accounting/currency';
import { getCardTheme } from '@/lib/accounting/cardColors';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [peopleSummaries, setPeopleSummaries] = useState<PersonSummary[]>([]);
  const [rawPeople, setRawPeople] = useState<Person[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [sharePerson, setSharePerson] = useState<Person | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, peopleRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/people'),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setSummary(data.summary);
        setPeopleSummaries(data.peopleSummaries || []);
        setRecentTransactions(data.recentTransactions || []);
      }

      if (peopleRes.ok) {
        const data = await peopleRes.json();
        setRawPeople(data.rawPeople || data.people || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredPeople = peopleSummaries.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.personName.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      <Navigation
        onOpenAddTransaction={() => setIsAddTxOpen(true)}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <main className="flex-1 min-w-0 w-full pb-28 md:pb-12 pt-4 sm:pt-6 px-3.5 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Standing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              Every Transaction. Every Balance. One Place.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddPersonOpen(true)}
              className="btn-premium-brown-outline px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl"
            >
              <UserPlus className="w-4 h-4 text-amber-500 shrink-0" />
              <span>+ Add Person</span>
            </button>

            <button
              onClick={() => setIsAddTxOpen(true)}
              className="btn-premium-brown px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>+ Record Transaction</span>
            </button>
          </div>
        </div>

        {/* 4 Core Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Money Owed to Me */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Money Owed to Me</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary ? summary.formattedMoneyOwedToMe : '₹0.00'}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Total positive balances owed to you across people
            </p>
          </div>

          {/* Card 2: Money I Owe */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Money I Owe</span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/40">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {summary ? summary.formattedMoneyIOwe : '₹0.00'}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Total liabilities you owe to others
            </p>
          </div>

          {/* Card 3: Net Balance */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Balance</span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                (summary?.netBalancePaise ?? 0) > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (summary?.netBalancePaise ?? 0) < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {summary ? summary.formattedNetBalance : '₹0.00'}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Owed to me − Money I owe
            </p>
          </div>

          {/* Card 4: Total People */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active People</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {summary ? summary.totalActivePeople : 0}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              People with dedicated ledgers in your workspace
            </p>
          </div>
        </div>

        {/* Content Section: People Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* People Overview (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  People Ledgers
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual accounts and real-time outstanding balances.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* People Cards */}
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Loading ledgers...
              </div>
            ) : filteredPeople.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {searchQuery ? 'No matching people found' : 'No people added yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No person matched "${searchQuery}". Try a different name.`
                    : 'Start by adding a friend, flatmate, or colleague to track money exchanged and split expenses.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsAddPersonOpen(true)}
                    className="btn-premium-brown px-4 py-2 text-xs rounded-xl"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>Add First Person</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredPeople.map((person) => {
                  const rawP = rawPeople.find((p) => p.id === person.personId || (p as any).personId === person.personId);
                  const cardColor = person.color || rawP?.color || 'default';
                  const theme = getCardTheme(cardColor);
                  const isPositive = person.currentBalancePaise > 0;
                  const isNegative = person.currentBalancePaise < 0;
                  const isSettled = person.currentBalancePaise === 0;

                  const personForShare: Person = rawP || ({
                    id: person.personId,
                    ownerId: 'default-owner',
                    name: person.personName,
                    nickname: person.nickname,
                    color: cardColor,
                    isArchived: person.isArchived,
                    shareToken: person.shareToken || '',
                    isSharingEnabled: Boolean(person.isSharingEnabled),
                    sharePolicy: 'ALL',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  } as Person);

                  return (
                    <div
                      key={person.personId}
                      onClick={() => router.push(`/people/${person.personId}`)}
                      style={theme.cardStyle}
                      className={`group p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${theme.cardClass}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              style={theme.avatarStyle}
                              className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm border shrink-0 transition-transform group-hover:scale-105 ${theme.avatarClass}`}
                            >
                              {person.personName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-tight">
                                {person.personName}
                              </h3>
                              {person.nickname && (
                                <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                                  @{person.nickname}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharePerson(personForShare);
                            }}
                            title={personForShare.isSharingEnabled ? 'Sharing Active' : 'Enable Public Sharing'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              personForShare.isSharingEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Balance readout */}
                        <div className="my-2 p-2.5 rounded-xl bg-black/5 dark:bg-black/25 border border-black/10 dark:border-white/10">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                              Current Balance
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isNegative
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {formatINR(person.currentBalancePaise, { absolute: true })}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                isPositive
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : isNegative
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {person.statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer link to ledger */}
                      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {person.transactionCount} transactions
                        </span>
                        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          <span>Open Ledger</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity (1 Column) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest ledger entries across all people.
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No transactions recorded yet.
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const person = peopleSummaries.find((p) => p.personId === tx.personId);
                  const isPositive = tx.balanceEffectPaise > 0;
                  const isNegative = tx.balanceEffectPaise < 0;

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            tx.type === 'GIVE_MONEY'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                              : tx.type === 'RECEIVE_MONEY'
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : tx.type === 'EXPENSE'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                              : tx.type === 'REPAYMENT'
                              ? 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
                              : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                          }`}
                        >
                          {tx.type === 'GIVE_MONEY' && <ArrowUpRight className="w-4 h-4" />}
                          {tx.type === 'RECEIVE_MONEY' && <ArrowDownLeft className="w-4 h-4" />}
                          {tx.type === 'EXPENSE' && <Receipt className="w-4 h-4" />}
                          {tx.type === 'REPAYMENT' && <RotateCcw className="w-4 h-4" />}
                          {tx.type === 'ADJUSTMENT' && <Scale className="w-4 h-4" />}
                        </div>

                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{person?.personName || 'Person'}</span>
                            <span>•</span>
                            <span>{tx.transactionDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {formatINR(tx.amountPaise)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatINR(tx.balanceEffectPaise, { showSign: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={fetchDashboardData}
        people={rawPeople}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <PersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {sharePerson && (
        <ShareModal
          isOpen={Boolean(sharePerson)}
          onClose={() => setSharePerson(null)}
          person={sharePerson}
          onUpdate={fetchDashboardData}
        />
      )}
    </div>
  );
}
