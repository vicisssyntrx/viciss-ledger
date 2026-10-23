'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmButtonText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Delete Permanently',
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-premium-brown-outline px-4 py-2 text-xs sm:text-sm rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
