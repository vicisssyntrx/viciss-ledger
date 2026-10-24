'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Download,
  PlusCircle,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { TransactionModal } from '@/components/TransactionModal';
import { PersonModal } from '@/components/PersonModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { Transaction, Person } from '@/lib/accounting/types';
import { formatINR } from '@/lib/accounting/currency';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [balanceDirection, setBalanceDirection] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'ZERO'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [txRes, peopleRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/people?includeArchived=true'),
      ]);

      if (txRes.ok) {
        const d = await txRes.json();
        setTransactions(d.transactions || []);
      }
      if (peopleRes.ok) {
        const p = await peopleRes.json();
        setPeople(p.people || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    const res = await fetch(`/api/transactions/${txToDelete.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete transaction');
    }
    fetchData();
  };

  const categories = Array.from(new Set(transactions.map((t) => t.category))).filter(Boolean);

  // Filter & Sort
  const filteredTransactions = transactions
    .filter((tx) => {
      if (selectedPersonId !== 'ALL' && tx.personId !== selectedPersonId) return false;
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
      if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;

      if (balanceDirection === 'POSITIVE' && tx.balanceEffectPaise <= 0) return false;
      if (balanceDirection === 'NEGATIVE' && tx.balanceEffectPaise >= 0) return false;
      if (balanceDirection === 'ZERO' && tx.balanceEffectPaise !== 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const descMatch = tx.description.toLowerCase().includes(q);
        const catMatch = tx.category.toLowerCase().includes(q);
        const notesMatch = tx.notes?.toLowerCase().includes(q);
        const personObj = people.find((p) => p.id === tx.personId);
        const personMatch = personObj?.name.toLowerCase().includes(q) || false;
        return descMatch || catMatch || notesMatch || personMatch;
      }

      return true;
    })
    .sort((a, b) => {
      const cmp = a.transactionDate.localeCompare(b.transactionDate);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export handler
  const exportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Person Name',
      'Type',
      'Description',
      'Category',
      'Amount (Rupees)',
      'Balance Effect (Rupees)',
      'Notes',
    ];

    const rows = filteredTransactions.map((tx) => {
      const person = people.find((p) => p.id === tx.personId);
      return [
        tx.id,
        tx.transactionDate,
        `"${person?.name || 'Unknown'}"`,
        tx.type,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.category}"`,
        (tx.amountPaise / 100).toFixed(2),
        (tx.balanceEffectPaise / 100).toFixed(2),
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `viciss_ledger_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      <Navigation
        onOpenAddTransaction={() => {
          setTxToEdit(null);
          setIsAddTxOpen(true);
        }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <main className="flex-1 min-w-0 w-full pb-28 md:pb-12 pt-4 sm:pt-6 px-3.5 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Global Transactions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              Search, filter, inspect, and export all recorded transactions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={exportCSV}
              className="btn-premium-brown-outline px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setTxToEdit(null);
                setIsAddTxOpen(true);
              }}
              className="btn-premium-brown px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>+ Record Transaction</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, person..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Person Filter */}
            <select
              value={selectedPersonId}
              onChange={(e) => {
                setSelectedPersonId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All People</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="GIVE_MONEY">Gave Money</option>
              <option value="RECEIVE_MONEY">Received Money</option>
              <option value="EXPENSE">Expense</option>
              <option value="REPAYMENT">Repayment</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>

            {/* Balance Effect Direction */}
            <select
              value={balanceDirection}
              onChange={(e) => {
                setBalanceDirection(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Balance Effects</option>
              <option value="POSITIVE">Positive (+Owed to me)</option>
              <option value="NEGATIVE">Negative (-I owe)</option>
              <option value="ZERO">Zero Effect (₹0)</option>
            </select>
          </div>

          {/* Secondary Filter Row: Date Range & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Date from:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400">to:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
              {(startDate || endDate || searchQuery || selectedPersonId !== 'ALL' || selectedType !== 'ALL' || balanceDirection !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPersonId('ALL');
                    setSelectedType('ALL');
                    setSelectedCategory('ALL');
                    setBalanceDirection('ALL');
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-xs ml-2 cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading transactions...
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No transactions match the selected filters.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List View (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedTransactions.map((tx) => {
                  const person = people.find((p) => p.id === tx.personId);
                  const isPositive = tx.balanceEffectPaise > 0;
                  const isNegative = tx.balanceEffectPaise < 0;

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
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">
                            {formatINR(tx.amountPaise)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
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

                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {tx.description}
                          </p>
                          <Link
                            href={`/people/${tx.personId}`}
                            className="text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline inline-flex items-center gap-0.5 mt-0.5"
                          >
                            <span>{person?.name || 'Unknown'}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </Link>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">{tx.notes}</p>
                          )}
                        </div>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] shrink-0">
                          {tx.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
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
                      <th className="py-3 px-4">Person</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance Effect</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {paginatedTransactions.map((tx) => {
                      const person = people.find((p) => p.id === tx.personId);
                      const isPositive = tx.balanceEffectPaise > 0;
                      const isNegative = tx.balanceEffectPaise < 0;

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {tx.transactionDate}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Link
                              href={`/people/${tx.personId}`}
                              className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{person?.name || 'Unknown'}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                            </Link>
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
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatINR(tx.balanceEffectPaise, { showSign: true })}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
                {filteredTransactions.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
        onSuccess={fetchData}
        people={people}
        initialTransaction={txToEdit}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <PersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={fetchData}
      />

      {txToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(txToDelete)}
          onClose={() => setTxToDelete(null)}
          onConfirm={handleDeleteTransaction}
          title="Delete Transaction?"
          message={`Are you sure you want to permanently delete "${txToDelete.description}" (${formatINR(txToDelete.amountPaise)})?`}
        />
      )}
    </div>
  );
}
