'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { BrandLogo } from '@/components/BrandLogo';

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResettingBalance, setIsResettingBalance] = useState(false);
  const [resetBaseAmount, setResetBaseAmount] = useState('17000.00');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Reset Bank Balance Calculations
  const handleResetBankBalance = async () => {
    try {
      setIsResettingBalance(true);
      setStatusMessage(null);
      const val = parseFloat(resetBaseAmount);
      if (isNaN(val) || val < 0) {
        throw new Error('Please enter a valid non-negative rupee amount');
      }

      const res = await fetch('/api/my-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET',
          amountRupees: val,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset bank balance');

      setStatusMessage({
        type: 'success',
        text: `Bank balance calculations reset successfully! Baseline capital recalibrated to ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      });
      setShowResetConfirm(false);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset bank balance calculations' });
    } finally {
      setIsResettingBalance(false);
    }
  };

  const [isWipingAll, setIsWipingAll] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Handle Wipe All Data (Fresh Start)
  const handleWipeAllData = async () => {
    try {
      setIsWipingAll(true);
      setStatusMessage(null);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          people: [],
          transactions: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to wipe data');

      // Also reset personal account baseline to default
      await fetch('/api/my-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET',
          amountRupees: 17000.00,
        }),
      });

      setStatusMessage({
        type: 'success',
        text: 'All ledgers and transactions wiped cleanly! Clean slate ready for adding fresh records.',
      });
      setShowWipeConfirm(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to wipe data' });
    } finally {
      setIsWipingAll(false);
    }
  };

  // Handle Full JSON Backup Download
  const handleDownloadBackup = async () => {
    try {
      setIsExporting(true);
      setStatusMessage(null);
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Failed to generate backup');

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viciss_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage({ type: 'success', text: 'Complete JSON backup downloaded successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error exporting backup' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle JSON Restore
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setStatusMessage(null);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore backup');

      setStatusMessage({ type: 'success', text: data.message || 'Data restored successfully!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to restore data file' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      <Navigation />

      <main className="flex-1 min-w-0 w-full pb-28 md:pb-12 pt-4 sm:pt-6 px-3.5 sm:px-6 md:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Application Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage preferences, data persistence, backups, and privacy.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Currency & Accounting Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Currency & Numeric Formatting
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Default Currency
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium">
                Indian Rupee (INR — ₹)
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Number Grouping Style
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium">
                Indian Grouping (₹1,25,000.00)
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            All accounting calculations strictly operate on <strong>integer paise</strong> (1 Rupee = 100 paise)
            with zero floating point representation errors.
          </div>
        </div>

        {/* Bank Balance Calculations & Recalibration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Bank Balance Calculations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Recalibrate your real-time bank balance, clear manual credit/debit adjustments, and reset base capital.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
              Account Control
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Use this option if you need to wipe your manual credit/debit adjustments or want to reset your starting personal baseline capital. Your person ledgers and recorded transaction history will remain intact.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Baseline Personal Capital (₹)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={resetBaseAmount}
                  onChange={(e) => setResetBaseAmount(e.target.value)}
                  placeholder="17000.00"
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Reset Calculations
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBankBalance}
                    disabled={isResettingBalance}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isResettingBalance ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Default starting personal baseline is ₹17,000.00 (17k). All active Custodial deposits will continue to be safely separated.
            </p>
          </div>
        </div>

        {/* Backup & Restore Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data Backup & Restore
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export all people, transactions, and allocations in a portable JSON format or restore from an earlier backup.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="btn-premium-brown px-4 py-2.5 text-xs rounded-xl"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isExporting ? 'Generating...' : 'Download JSON Backup'}</span>
            </button>

            <label className="btn-premium-brown-outline px-4 py-2.5 text-xs rounded-xl">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>{isImporting ? 'Restoring...' : 'Restore from JSON File'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset All Ledgers & Data */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950/60">
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset All Data (Clean Slate)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Permanently wipe all people, transactions, and manual adjustments to start completely fresh.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300">
              Danger Zone
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Use this button whenever you want to wipe all test records and historical data from the live published application and your workspace, letting you re-enter your ledgers from scratch.
          </p>

          {!showWipeConfirm ? (
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Reset & Wipe All Records</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                Are you sure you want to permanently delete all people and transactions?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWipeAllData}
                  disabled={isWipingAll}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isWipingAll ? 'Wiping Everything...' : 'Yes, Delete All Data'}</span>
                </button>
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Persistence & Supabase Integration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cloud Persistence & Supabase PostgreSQL
            </h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Viciss-Ledger includes an adaptable database architecture:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>
              <strong>Active Local Storage:</strong> Atomic file-backed JSON database in <code>.data/viciss_db.json</code> ensuring zero data loss across reloads.
            </li>
            <li>
              <strong>Supabase PostgreSQL Migration:</strong> Migration SQL is provided in <code>supabase/migrations/20261023_initial_schema.sql</code> with full Row Level Security (RLS).
            </li>
            <li>
              <strong>Connecting Supabase:</strong> Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> or <code>SUPABASE_SERVICE_ROLE_KEY</code> to your <code>.env.local</code>.
            </li>
          </ul>
        </div>

        {/* Privacy & Security Notice */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Privacy & Public Sharing Principles
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              When you share a public ledger with a friend via <code>/share/[shareToken]</code>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
              <li>They only see their own approved transactions and verified balance.</li>
              <li>Your personal contact information, notes, and other people’s ledgers are never exposed.</li>
              <li>Public visitors cannot edit or delete any financial records.</li>
              <li>You can disable sharing or regenerate the token at any time to instantly revoke access.</li>
            </ul>
          </div>
        </div>

        {/* About Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <BrandLogo size="md" showTagline={true} />
          <div className="text-right text-xs text-slate-400">
            <span>Version 1.0.0 Production Release</span>
            <p>Designed for Financial Clarity</p>
          </div>
        </div>
      </main>
    </div>
  );
}
