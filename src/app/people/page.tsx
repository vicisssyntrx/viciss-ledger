'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Share2,
  Edit3,
  Archive,
  RefreshCcw,
  Trash2,
  Phone,
  Mail,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { PersonModal } from '@/components/PersonModal';
import { ShareModal } from '@/components/ShareModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { TransactionModal } from '@/components/TransactionModal';
import { Person, PersonSummary } from '@/lib/accounting/types';
import { formatINR } from '@/lib/accounting/currency';

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [rawPeople, setRawPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Modals
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [sharePerson, setSharePerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [selectedPersonForTx, setSelectedPersonForTx] = useState<string | undefined>();

  const fetchPeople = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/people?includeArchived=true`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people || []);
      }
      // Also fetch raw people details
      const detailRes = await fetch(`/api/people?includeArchived=true`);
      if (detailRes.ok) {
        const d = await detailRes.json();
        setRawPeople(d.people || []);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handleArchive = async (personId: string, archive: boolean) => {
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', archived: archive }),
      });
      if (res.ok) fetchPeople();
    } catch (err) {
      console.error('Failed to archive person:', err);
    }
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    const res = await fetch(`/api/people/${personToDelete.id}?force=true`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete person');
    }
    fetchPeople();
  };

  const filtered = people.filter((p) => {
    const raw = rawPeople.find((rp) => rp.id === p.personId);
    const isArchived = raw?.isArchived ?? false;

    if (activeTab === 'active' && isArchived) return false;
    if (activeTab === 'archived' && !isArchived) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.personName.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Navigation
        onOpenAddTransaction={() => {
          setSelectedPersonForTx(undefined);
          setIsAddTxOpen(true);
        }}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      <main className="flex-1 pb-24 md:pb-12 pt-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              People Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage individual ledgers, sharing preferences, and personal balances.
            </p>
          </div>

          <button
            onClick={() => {
              setPersonToEdit(null);
              setIsAddPersonOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Person</span>
          </button>
        </div>

        {/* Filter and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Active People ({people.filter((p) => !rawPeople.find((rp) => rp.id === p.personId)?.isArchived).length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Archived ({people.filter((p) => rawPeople.find((rp) => rp.id === p.personId)?.isArchived).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or nickname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* People Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching people found' : 'No people in this view'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No people matched "${searchQuery}".`
                : activeTab === 'archived'
                ? 'No archived people.'
                : 'Click "Add New Person" to create your first personal ledger.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((person) => {
              const raw = rawPeople.find((rp) => rp.id === person.personId);
              const isPositive = person.currentBalancePaise > 0;
              const isNegative = person.currentBalancePaise < 0;

              return (
                <div
                  key={person.personId}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, and Sharing Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link
                        href={`/people/${person.personId}`}
                        className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-base border border-slate-200 dark:border-slate-700">
                          {person.personName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {person.personName}
                          </h3>
                          {person.nickname && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              @{person.nickname}
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-1">
                        {raw && (
                          <button
                            onClick={() => setSharePerson(raw)}
                            title={raw.isSharingEnabled ? 'Sharing Active' : 'Enable Public Sharing'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              raw.isSharingEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {raw && (
                          <button
                            onClick={() => {
                              setPersonToEdit(raw);
                              setIsAddPersonOpen(true);
                            }}
                            title="Edit details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contact Badges (Private) */}
                    {(raw?.phone || raw?.email) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {raw.phone && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{raw.phone}</span>
                          </span>
                        )}
                        {raw.email && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{raw.email}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Balance Callout */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 my-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                          Net Standing
                        </span>
                        <span
                          className={`text-base font-extrabold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatINR(person.currentBalancePaise, { absolute: true })}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : isNegative
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-slate-500'
                          }
                        >
                          {person.statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Navigation */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {raw?.isArchived ? (
                        <button
                          onClick={() => handleArchive(person.personId, false)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(person.personId, true)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                          title="Archive person (preserves history)"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (raw) setPersonToDelete(raw);
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <Link
                      href={`/people/${person.personId}`}
                      className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span>View Ledger</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALS */}
      <PersonModal
        isOpen={isAddPersonOpen}
        onClose={() => {
          setIsAddPersonOpen(false);
          setPersonToEdit(null);
        }}
        onSuccess={fetchPeople}
        personToEdit={personToEdit}
      />

      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={fetchPeople}
        people={rawPeople}
        currentPersonId={selectedPersonForTx}
      />

      {sharePerson && (
        <ShareModal
          isOpen={Boolean(sharePerson)}
          onClose={() => setSharePerson(null)}
          person={sharePerson}
          onUpdate={fetchPeople}
        />
      )}

      {personToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(personToDelete)}
          onClose={() => setPersonToDelete(null)}
          onConfirm={handleDelete}
          title={`Delete ${personToDelete.name}?`}
          message="Deleting this person will permanently remove their records from the database. If they have historical transactions, archiving them is strongly recommended instead."
        />
      )}
    </div>
  );
}
