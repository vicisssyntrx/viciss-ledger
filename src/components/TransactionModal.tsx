'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import {
  Transaction,
  Person,
  TransactionType,
  ExpenseTreatment,
  RepaymentDirection,
  AdjustmentDirection,
} from '@/lib/accounting/types';
import {
  calculateBalanceEffectPaise,
  validateTransaction,
  validateSharedSplit,
  getBalanceStatus,
} from '@/lib/accounting/engine';
import { formatINR, rupeesToPaise, paiseToRupees } from '@/lib/accounting/currency';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  people: Person[];
  currentPersonId?: string;
  initialTransaction?: Transaction | null;
}

const CATEGORY_PRESETS = [
  'General',
  'Loan',
  'Repayment',
  'Dining',
  'Groceries',
  'Rent',
  'Travel',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Medical',
];

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  people,
  currentPersonId,
  initialTransaction,
}: TransactionModalProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialTransaction?.personId || currentPersonId || (people[0]?.id ?? '')
  );
  const [type, setType] = useState<TransactionType>(initialTransaction?.type || 'GIVE_MONEY');
  const [amountRupees, setAmountRupees] = useState<string>(
    initialTransaction ? paiseToRupees(initialTransaction.amountPaise).toString() : ''
  );
  const [date, setDate] = useState<string>(
    initialTransaction?.transactionDate || ''
  );
  const [description, setDescription] = useState<string>(initialTransaction?.description || '');
  const [category, setCategory] = useState<string>(initialTransaction?.category || 'General');
  const [notes, setNotes] = useState<string>(initialTransaction?.notes || '');
  const [isShared, setIsShared] = useState<boolean>(initialTransaction?.isShared ?? true);

  // Type-specific states
  const [expenseTreatment, setExpenseTreatment] = useState<ExpenseTreatment>(
    initialTransaction?.expenseTreatment || 'FOR_THEM'
  );
  const [myShareRupees, setMyShareRupees] = useState<string>('0');
  const [theirShareRupees, setTheirShareRupees] = useState<string>('');

  const [repaymentDirection, setRepaymentDirection] = useState<RepaymentDirection>(
    initialTransaction?.repaymentDirection || 'THEY_REPAY_ME'
  );
  const [adjustmentDirection, setAdjustmentDirection] = useState<AdjustmentDirection>(
    initialTransaction?.adjustmentDirection || 'INCREASE_OWED_TO_ME'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch person's existing balance for live preview
  const [currentBalancePaise, setCurrentBalancePaise] = useState<number>(0);

  useEffect(() => {
    if (initialTransaction) {
      setSelectedPersonId(initialTransaction.personId);
      setType(initialTransaction.type);
      setAmountRupees(paiseToRupees(initialTransaction.amountPaise).toString());
      setDate(initialTransaction.transactionDate);
      setDescription(initialTransaction.description);
      setCategory(initialTransaction.category);
      setNotes(initialTransaction.notes || '');
      setIsShared(initialTransaction.isShared);

      if (initialTransaction.expenseTreatment) {
        setExpenseTreatment(initialTransaction.expenseTreatment);
      }
      if (initialTransaction.repaymentDirection) {
        setRepaymentDirection(initialTransaction.repaymentDirection);
      }
      if (initialTransaction.adjustmentDirection) {
        setAdjustmentDirection(initialTransaction.adjustmentDirection);
      }
      if (initialTransaction.sharedSplit) {
        setMyShareRupees(paiseToRupees(initialTransaction.sharedSplit.mySharePaise).toString());
        const participant = initialTransaction.sharedSplit.participants.find(
          (p) => p.personId === initialTransaction.personId
        );
        if (participant) {
          setTheirShareRupees(paiseToRupees(participant.sharePaise).toString());
        }
      }
    } else {
      setSelectedPersonId(currentPersonId || (people[0]?.id ?? ''));
      setType('GIVE_MONEY');
      setAmountRupees('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('General');
      setNotes('');
      setIsShared(true);
      setExpenseTreatment('FOR_THEM');
      setRepaymentDirection('THEY_REPAY_ME');
      setAdjustmentDirection('INCREASE_OWED_TO_ME');
      setMyShareRupees('0');
      setTheirShareRupees('');
    }
    setErrorMessage(null);
  }, [initialTransaction, currentPersonId, people, isOpen]);

  // Load current person balance
  useEffect(() => {
    if (!selectedPersonId) return;
    async function loadPersonBalance() {
      try {
        const res = await fetch(`/api/people/${selectedPersonId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentBalancePaise(data.summary?.currentBalancePaise || 0);
        }
      } catch (err) {
        console.error('Failed to load person balance preview:', err);
      }
    }
    loadPersonBalance();
  }, [selectedPersonId]);

  // Update shared split amounts if amount changes
  useEffect(() => {
    if (type === 'EXPENSE' && expenseTreatment === 'SHARED') {
      const parsedTotal = parseFloat(amountRupees || '0');
      if (!isNaN(parsedTotal) && parsedTotal > 0) {
        // default 50/50 split
        const half = (parsedTotal / 2).toFixed(2);
        setMyShareRupees(half);
        setTheirShareRupees(half);
      }
    }
  }, [amountRupees, type, expenseTreatment]);

  if (!isOpen) return null;

  const targetPerson = people.find((p) => p.id === selectedPersonId);
  const targetName = targetPerson?.nickname || targetPerson?.name || 'this person';

  // Live calculation of balance effect
  const amountPaise = rupeesToPaise(amountRupees);

  let sharedSplitConfig = undefined;
  if (type === 'EXPENSE' && expenseTreatment === 'SHARED') {
    sharedSplitConfig = {
      mySharePaise: rupeesToPaise(myShareRupees),
      participants: [
        {
          personId: selectedPersonId,
          personName: targetPerson?.name || 'Participant',
          sharePaise: rupeesToPaise(theirShareRupees),
        },
      ],
    };
  }

  const liveEffectPaise = calculateBalanceEffectPaise({
    type,
    amountPaise,
    expenseTreatment,
    sharedSplit: sharedSplitConfig,
    repaymentDirection,
    adjustmentDirection,
    personId: selectedPersonId,
  });

  const projectedNewBalancePaise = currentBalancePaise + liveEffectPaise;
  const projectedStatus = getBalanceStatus(projectedNewBalancePaise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPersonId) {
      setErrorMessage('Please select a person.');
      return;
    }

    if (amountPaise <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please enter a transaction description.');
      return;
    }

    if (type === 'EXPENSE' && expenseTreatment === 'SHARED') {
      const splitValidation = validateSharedSplit(amountPaise, sharedSplitConfig);
      if (!splitValidation.valid) {
        setErrorMessage(splitValidation.error || 'Shared allocations do not match total amount.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        personId: selectedPersonId,
        type,
        amountPaise,
        transactionDate: date,
        description: description.trim(),
        category,
        notes: notes.trim(),
        expenseTreatment: type === 'EXPENSE' ? expenseTreatment : undefined,
        sharedSplit: sharedSplitConfig,
        repaymentDirection: type === 'REPAYMENT' ? repaymentDirection : undefined,
        adjustmentDirection: type === 'ADJUSTMENT' ? adjustmentDirection : undefined,
        isShared,
      };

      const url = initialTransaction
        ? `/api/transactions/${initialTransaction.id}`
        : '/api/transactions';
      const method = initialTransaction ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save transaction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select transaction type and financial treatment.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Person Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Person
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.nickname ? `(${p.nickname})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('GIVE_MONEY')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  type === 'GIVE_MONEY'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>I Gave Money</span>
              </button>

              <button
                type="button"
                onClick={() => setType('RECEIVE_MONEY')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  type === 'RECEIVE_MONEY'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>They Gave Me</span>
              </button>

              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  type === 'EXPENSE'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType('REPAYMENT')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  type === 'REPAYMENT'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Repayment</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  type === 'ADJUSTMENT'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Adjustment</span>
              </button>
            </div>
          </div>

          {/* Dynamic Sub-Controls for EXPENSE */}
          {type === 'EXPENSE' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Financial Treatment of Expense
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="expenseTreatment"
                    value="FOR_THEM"
                    checked={expenseTreatment === 'FOR_THEM'}
                    onChange={() => setExpenseTreatment('FOR_THEM')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      For {targetName}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Spent on their behalf (from funds they gave me or they owe me for it)
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="expenseTreatment"
                    value="PERSONAL_USE"
                    checked={expenseTreatment === 'PERSONAL_USE'}
                    onChange={() => setExpenseTreatment('PERSONAL_USE')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Personal Use
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Used their money for my own expense (I must repay them)
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="expenseTreatment"
                    value="SHARED"
                    checked={expenseTreatment === 'SHARED'}
                    onChange={() => setExpenseTreatment('SHARED')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Shared Expense
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Split between me and {targetName}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="expenseTreatment"
                    value="REFERENCE_ONLY"
                    checked={expenseTreatment === 'REFERENCE_ONLY'}
                    onChange={() => setExpenseTreatment('REFERENCE_ONLY')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Reference Only
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Record keeping only. ₹0 effect on balance.
                    </p>
                  </div>
                </label>
              </div>

              {/* Shared allocation split inputs */}
              {expenseTreatment === 'SHARED' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      My Share (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={myShareRupees}
                      onChange={(e) => setMyShareRupees(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      {targetName}&apos;s Share (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={theirShareRupees}
                      onChange={(e) => setTheirShareRupees(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Sub-Controls for REPAYMENT */}
          {type === 'REPAYMENT' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Repayment Direction
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRepaymentDirection('THEY_REPAY_ME')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    repaymentDirection === 'THEY_REPAY_ME'
                      ? 'border-emerald-600 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {targetName} is repaying me
                </button>
                <button
                  type="button"
                  onClick={() => setRepaymentDirection('I_REPAY_THEM')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    repaymentDirection === 'I_REPAY_THEM'
                      ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  I am repaying {targetName}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Sub-Controls for ADJUSTMENT */}
          {type === 'ADJUSTMENT' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Adjustment Direction
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection('INCREASE_OWED_TO_ME')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    adjustmentDirection === 'INCREASE_OWED_TO_ME'
                      ? 'border-emerald-600 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Increase money owed to me (+₹)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection('DECREASE_OWED_TO_ME')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                    adjustmentDirection === 'DECREASE_OWED_TO_ME'
                      ? 'border-rose-600 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Decrease money owed to me (-₹)
                </button>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch split, UPI advance..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Private Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Private Notes (Never shared publicly)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal reminders, UPI transaction IDs, reference numbers..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sharing Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isShared"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isShared" className="text-xs text-slate-600 dark:text-slate-300">
              Include in public shared ledger when sharing is enabled for {targetName}
            </label>
          </div>

          {/* LIVE BALANCE PREVIEW BOX */}
          <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800/90 border border-slate-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Live Accounting Balance Preview</span>
              <span className="font-mono text-[11px] text-slate-300">
                Current: {formatINR(currentBalancePaise)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Effect on Balance</span>
                <span
                  className={`text-sm font-semibold ${
                    liveEffectPaise > 0
                      ? 'text-emerald-400'
                      : liveEffectPaise < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {formatINR(liveEffectPaise, { showSign: true })}
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-400">Projected New Balance</span>
                <span className="text-base font-bold text-white">
                  {formatINR(projectedNewBalancePaise, { absolute: true })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Resulting Status:</span>
              <span
                className={`font-semibold ${
                  projectedStatus.status === 'OWED_TO_ME'
                    ? 'text-emerald-400'
                    : projectedStatus.status === 'I_OWE'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {projectedStatus.label}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-premium-brown-outline px-4 py-2.5 text-xs sm:text-sm rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-premium-brown px-5 py-2.5 text-xs sm:text-sm rounded-xl"
            >
              {isSubmitting ? 'Saving...' : initialTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
