'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Person } from '@/lib/accounting/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onUpdate: () => void;
}

export function ShareModal({ isOpen, onClose, person, onUpdate }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/share/${person.shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleSharing = async (enable: boolean) => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/${person.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: enable }),
      });
      if (!res.ok) throw new Error('Failed to update sharing settings');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Error updating sharing');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateToken = async () => {
    const confirmed = window.confirm(
      'Regenerating the link will immediately invalidate any previous public link you sent. Anyone with the old link will no longer be able to view this ledger. Proceed?'
    );
    if (!confirmed) return;

    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/${person.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      });
      if (!res.ok) throw new Error('Failed to regenerate share token');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Error regenerating link');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Public Ledger Sharing
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Person overview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Target Person</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {person.name} {person.nickname ? `(${person.nickname})` : ''}
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  person.isSharingEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {person.isSharingEnabled ? 'Sharing Active' : 'Sharing Disabled'}
              </span>
            </div>
          </div>

          {/* Toggle controls */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Enable Public Read-Only Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anyone with this unguessable link can view their individual transactions without logging in.
              </p>
            </div>
            <button
              onClick={() => handleToggleSharing(!person.isSharingEnabled)}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                person.isSharingEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  person.isSharingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Share Link Box */}
          {person.isSharingEnabled && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Unguessable Public Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 select-all"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Actions row: Preview & Regenerate */}
              <div className="flex items-center justify-between pt-1">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Public Ledger</span>
                </a>

                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Link (Revoke Old)</span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Safeguards Callout */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Privacy Protections Enforced</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <li>Only transactions explicitly set as shared for {person.name} are rendered.</li>
              <li>Your main dashboard, other people&apos;s ledgers, and contact info are NEVER exposed.</li>
              <li>Public viewers are strictly read-only and cannot add or edit any financial records.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
