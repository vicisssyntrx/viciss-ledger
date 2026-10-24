import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Person, Transaction } from '../accounting/types';
import { calculateBalanceEffectPaise, calculateTotalBalancePaise } from '../accounting/engine';
import {
  readDatabase,
  writeDatabase,
  generateSecureToken,
  getPersonColors,
  savePersonColor,
  getPersonLedgerTypes,
  savePersonLedgerType,
} from './storage';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
};

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function mapPersonFromDb(row: any): Person {
  const storedColors = getPersonColors();
  const storedTypes = getPersonLedgerTypes();
  const resolvedColor = row.color || storedColors[row.id] || 'default';
  const resolvedLedgerType = row.ledger_type || storedTypes[row.id] || 'LENDING';

  return {
    id: row.id,
    ownerId: row.owner_id || 'default-owner',
    name: row.name,
    nickname: row.nickname || undefined,
    color: resolvedColor,
    ledgerType: resolvedLedgerType,
    phone: row.phone || undefined,
    email: row.email || undefined,
    notes: row.notes || undefined,
    isArchived: Boolean(row.is_archived),
    shareToken: row.share_token,
    isSharingEnabled: Boolean(row.is_sharing_enabled),
    sharePolicy: row.share_policy || 'ALL',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTxFromDb(row: any): Transaction {
  return {
    id: row.id,
    ownerId: row.owner_id || 'default-owner',
    personId: row.person_id,
    type: row.type,
    amountPaise: Number(row.amount_paise),
    transactionDate: row.transaction_date,
    description: row.description,
    category: row.category,
    notes: row.notes || undefined,
    expenseTreatment: row.expense_treatment || undefined,
    sharedSplit: row.shared_split || undefined,
    repaymentDirection: row.repayment_direction || undefined,
    adjustmentDirection: row.adjustment_direction || undefined,
    balanceEffectPaise: Number(row.balance_effect_paise),
    isShared: Boolean(row.is_shared),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==========================================
// PEOPLE OPERATIONS
// ==========================================

export async function getPeople(includeArchived: boolean = false): Promise<Person[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from('people').select('*');
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) {
      console.error('Supabase getPeople error, falling back to local DB:', error);
    } else if (data) {
      return data.map(mapPersonFromDb);
    }
  }

  // Local fallback
  const db = readDatabase();
  let list = db.people;
  if (!includeArchived) {
    list = list.filter((p) => !p.isArchived);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('people').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      return mapPersonFromDb(data);
    }
  }

  const db = readDatabase();
  const person = db.people.find((p) => p.id === id);
  return person || null;
}

export async function createPerson(data: {
  name: string;
  nickname?: string;
  color?: string;
  ledgerType?: 'LENDING' | 'BORROWING' | 'CUSTODIAL';
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<Person> {
  const token = generateSecureToken();
  const supabase = getSupabase();
  const chosenColor = data.color?.trim() || 'default';
  const chosenLedgerType = data.ledgerType || 'LENDING';

  if (supabase) {
    const payload: any = {
      name: data.name.trim(),
      nickname: data.nickname?.trim() || null,
      color: chosenColor,
      ledger_type: chosenLedgerType,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      notes: data.notes?.trim() || null,
      is_archived: false,
      share_token: token,
      is_sharing_enabled: false,
      share_policy: 'ALL',
    };
    let { data: inserted, error } = await supabase.from('people').insert([payload]).select().single();
    if (error && (error.message?.includes('color') || error.message?.includes('ledger_type') || error.code === 'PGRST204' || error.message?.includes('column'))) {
      delete payload.color;
      delete payload.ledger_type;
      const retry = await supabase.from('people').insert([payload]).select().single();
      if (!retry.error && retry.data) {
        inserted = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase createPerson error, falling back to local DB:', error);
    } else if (inserted) {
      if (chosenColor) savePersonColor(inserted.id, chosenColor);
      savePersonLedgerType(inserted.id, chosenLedgerType);
      const res = mapPersonFromDb(inserted);
      res.color = chosenColor;
      res.ledgerType = chosenLedgerType;
      return res;
    }
  }

  const db = readDatabase();
  const now = new Date().toISOString();
  const newPerson: Person = {
    id: `person-${crypto.randomBytes(8).toString('hex')}`,
    ownerId: 'default-owner',
    name: data.name.trim(),
    nickname: data.nickname?.trim(),
    color: chosenColor,
    ledgerType: chosenLedgerType,
    phone: data.phone?.trim(),
    email: data.email?.trim(),
    notes: data.notes?.trim(),
    isArchived: false,
    shareToken: token,
    isSharingEnabled: false,
    sharePolicy: 'ALL',
    createdAt: now,
    updatedAt: now,
  };

  if (chosenColor) {
    savePersonColor(newPerson.id, chosenColor);
  }
  savePersonLedgerType(newPerson.id, chosenLedgerType);

  db.people.push(newPerson);
  writeDatabase(db);
  return newPerson;
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, 'id' | 'ownerId' | 'createdAt'>>
): Promise<Person> {
  if (updates.color) {
    savePersonColor(id, updates.color);
  }
  if (updates.ledgerType) {
    savePersonLedgerType(id, updates.ledgerType);
  }

  const supabase = getSupabase();
  let supabaseResult: Person | null = null;

  if (supabase) {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.ledgerType !== undefined) dbUpdates.ledger_type = updates.ledgerType;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
    if (updates.shareToken !== undefined) dbUpdates.share_token = updates.shareToken;
    if (updates.isSharingEnabled !== undefined) dbUpdates.is_sharing_enabled = updates.isSharingEnabled;
    if (updates.sharePolicy !== undefined) dbUpdates.share_policy = updates.sharePolicy;

    let { data, error } = await supabase.from('people').update(dbUpdates).eq('id', id).select().single();
    if (error && (error.message?.includes('color') || error.message?.includes('ledger_type') || error.code === 'PGRST204' || error.message?.includes('column'))) {
      delete dbUpdates.color;
      delete dbUpdates.ledger_type;
      const retry = await supabase.from('people').update(dbUpdates).eq('id', id).select().single();
      if (!retry.error && retry.data) {
        data = retry.data;
        error = null;
      }
    }
    if (!error && data) {
      supabaseResult = mapPersonFromDb(data);
      if (updates.color) {
        supabaseResult.color = updates.color;
      }
      if (updates.ledgerType) {
        supabaseResult.ledgerType = updates.ledgerType;
      }
    }
  }

  const db = readDatabase();
  const index = db.people.findIndex((p) => p.id === id);
  if (index !== -1) {
    const existing = db.people[index];
    const updated: Person = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.people[index] = updated;
    writeDatabase(db);
    return updated;
  }

  if (supabaseResult) {
    return supabaseResult;
  }

  throw new Error(`Person with id ${id} not found`);
}

export async function archivePerson(id: string, archived: boolean = true): Promise<Person> {
  return updatePerson(id, { isArchived: archived });
}

export async function deletePerson(id: string, force: boolean = false): Promise<void> {
  const supabase = getSupabase();
  let deletedFromSupabase = false;

  if (supabase) {
    if (force) {
      await supabase.from('transactions').delete().eq('person_id', id);
    }
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (!error) {
      deletedFromSupabase = true;
    }
  }

  const db = readDatabase();
  const personIndex = db.people.findIndex((p) => p.id === id);

  if (personIndex !== -1) {
    const hasTransactions = db.transactions.some((t) => t.personId === id);
    if (hasTransactions && !force) {
      throw new Error(
        'Cannot delete person with existing transaction records. Please archive them instead or confirm deletion of historical records.'
      );
    }

    db.people.splice(personIndex, 1);
    if (force) {
      db.transactions = db.transactions.filter((t) => t.personId !== id);
    }
    writeDatabase(db);
    return;
  }

  if (deletedFromSupabase) {
    return;
  }
}

export async function regenerateShareToken(personId: string): Promise<string> {
  const newToken = generateSecureToken();
  await updatePerson(personId, { shareToken: newToken, isSharingEnabled: true });
  return newToken;
}

export async function toggleSharing(
  personId: string,
  enabled: boolean,
  policy: 'ALL' | 'SELECTED' = 'ALL'
): Promise<Person> {
  return updatePerson(personId, {
    isSharingEnabled: enabled,
    sharePolicy: policy,
  });
}

// ==========================================
// TRANSACTION OPERATIONS
// ==========================================

export async function getTransactions(filters?: {
  personId?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  isShared?: boolean;
}): Promise<Transaction[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from('transactions').select('*');
    if (filters?.personId) query = query.eq('person_id', filters.personId);
    if (filters?.type && filters.type !== 'ALL') query = query.eq('type', filters.type);
    if (filters?.category && filters.category !== 'ALL') query = query.eq('category', filters.category);
    if (filters?.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters?.endDate) query = query.lte('transaction_date', filters.endDate);
    if (filters?.isShared !== undefined) query = query.eq('is_shared', filters.isShared);

    const { data, error } = await query.order('transaction_date', { ascending: false });
    if (!error && data) {
      return data.map(mapTxFromDb);
    }
  }

  const db = readDatabase();
  let list = db.transactions;

  if (filters?.personId) {
    list = list.filter((t) => t.personId === filters.personId);
  }
  if (filters?.type && filters.type !== 'ALL') {
    list = list.filter((t) => t.type === filters.type);
  }
  if (filters?.category && filters.category !== 'ALL') {
    list = list.filter((t) => t.category === filters.category);
  }
  if (filters?.startDate) {
    list = list.filter((t) => t.transactionDate >= filters.startDate!);
  }
  if (filters?.endDate) {
    list = list.filter((t) => t.transactionDate <= filters.endDate!);
  }
  if (filters?.isShared !== undefined) {
    list = list.filter((t) => t.isShared === filters.isShared);
  }

  return list.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      return mapTxFromDb(data);
    }
  }

  const db = readDatabase();
  const tx = db.transactions.find((t) => t.id === id);
  return tx || null;
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceEffectPaise'>
): Promise<Transaction> {
  const balanceEffectPaise = calculateBalanceEffectPaise({
    type: data.type,
    amountPaise: data.amountPaise,
    expenseTreatment: data.expenseTreatment,
    sharedSplit: data.sharedSplit,
    repaymentDirection: data.repaymentDirection,
    adjustmentDirection: data.adjustmentDirection,
    personId: data.personId,
  });

  const supabase = getSupabase();
  if (supabase) {
    const payload = {
      person_id: data.personId,
      type: data.type,
      amount_paise: data.amountPaise,
      transaction_date: data.transactionDate,
      description: data.description,
      category: data.category,
      notes: data.notes || null,
      expense_treatment: data.expenseTreatment || null,
      shared_split: data.sharedSplit || null,
      repayment_direction: data.repaymentDirection || null,
      adjustment_direction: data.adjustmentDirection || null,
      balance_effect_paise: balanceEffectPaise,
      is_shared: data.isShared,
    };
    const { data: inserted, error } = await supabase.from('transactions').insert([payload]).select().single();
    if (!error && inserted) {
      return mapTxFromDb(inserted);
    }
  }

  const db = readDatabase();
  const now = new Date().toISOString();
  const newTx: Transaction = {
    ...data,
    id: `tx-${crypto.randomBytes(8).toString('hex')}`,
    balanceEffectPaise,
    createdAt: now,
    updatedAt: now,
  };

  db.transactions.push(newTx);
  writeDatabase(db);
  return newTx;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<Transaction> {
  const existing = await getTransactionById(id);
  if (!existing) {
    throw new Error(`Transaction with id ${id} not found`);
  }

  const merged = { ...existing, ...updates };
  const balanceEffectPaise = calculateBalanceEffectPaise({
    type: merged.type,
    amountPaise: merged.amountPaise,
    expenseTreatment: merged.expenseTreatment,
    sharedSplit: merged.sharedSplit,
    repaymentDirection: merged.repaymentDirection,
    adjustmentDirection: merged.adjustmentDirection,
    personId: merged.personId,
  });

  const supabase = getSupabase();
  if (supabase) {
    const payload: any = {
      person_id: merged.personId,
      type: merged.type,
      amount_paise: merged.amountPaise,
      transaction_date: merged.transactionDate,
      description: merged.description,
      category: merged.category,
      notes: merged.notes || null,
      expense_treatment: merged.expenseTreatment || null,
      shared_split: merged.sharedSplit || null,
      repayment_direction: merged.repaymentDirection || null,
      adjustment_direction: merged.adjustmentDirection || null,
      balance_effect_paise: balanceEffectPaise,
      is_shared: merged.isShared,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single();
    if (!error && data) {
      return mapTxFromDb(data);
    }
  }

  const db = readDatabase();
  const index = db.transactions.findIndex((t) => t.id === id);
  const updated: Transaction = {
    ...merged,
    balanceEffectPaise,
    updatedAt: new Date().toISOString(),
  };

  db.transactions[index] = updated;
  writeDatabase(db);
  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) return;
  }

  const db = readDatabase();
  db.transactions = db.transactions.filter((t) => t.id !== id);
  writeDatabase(db);
}

// ==========================================
// PUBLIC SHARING
// ==========================================

export async function getPublicSharedLedger(shareToken: string): Promise<{
  person: {
    name: string;
    nickname?: string;
  };
  transactions: {
    id: string;
    transactionDate: string;
    type: Transaction['type'];
    description: string;
    category: string;
    amountPaise: number;
    balanceEffectPaise: number;
  }[];
  currentBalancePaise: number;
} | null> {
  if (!shareToken || shareToken.trim() === '') return null;

  const supabase = getSupabase();
  if (supabase) {
    const { data: personData } = await supabase
      .from('people')
      .select('id, name, nickname')
      .eq('share_token', shareToken)
      .eq('is_sharing_enabled', true)
      .eq('is_archived', false)
      .maybeSingle();

    if (personData) {
      const { data: txsData } = await supabase
        .from('transactions')
        .select('id, transaction_date, type, description, category, amount_paise, balance_effect_paise')
        .eq('person_id', personData.id)
        .eq('is_shared', true)
        .order('transaction_date', { ascending: false });

      const txs = (txsData || []).map((t) => ({
        id: t.id,
        transactionDate: t.transaction_date,
        type: t.type as Transaction['type'],
        description: t.description,
        category: t.category,
        amountPaise: Number(t.amount_paise),
        balanceEffectPaise: Number(t.balance_effect_paise),
      }));

      const currentBalancePaise = txs.reduce((acc, t) => acc + t.balanceEffectPaise, 0);

      return {
        person: {
          name: personData.name,
          nickname: personData.nickname || undefined,
        },
        transactions: txs,
        currentBalancePaise,
      };
    }
  }

  // Local fallback
  const db = readDatabase();
  const person = db.people.find(
    (p) => p.shareToken === shareToken && p.isSharingEnabled && !p.isArchived
  );

  if (!person) return null;

  const sharedTxs = db.transactions
    .filter((t) => t.personId === person.id && t.isShared)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  const currentBalancePaise = calculateTotalBalancePaise(sharedTxs);

  const sanitizedTransactions = sharedTxs.map((t) => ({
    id: t.id,
    transactionDate: t.transactionDate,
    type: t.type,
    description: t.description,
    category: t.category,
    amountPaise: t.amountPaise,
    balanceEffectPaise: t.balanceEffectPaise,
  }));

  return {
    person: {
      name: person.name,
      nickname: person.nickname,
    },
    transactions: sanitizedTransactions,
    currentBalancePaise,
  };
}

// ==========================================
// BACKUP & RESTORE
// ==========================================

export async function exportAllData(): Promise<{
  people: Person[];
  transactions: Transaction[];
  exportedAt: string;
  version: number;
}> {
  const [people, transactions] = await Promise.all([
    getPeople(true),
    getTransactions(),
  ]);

  return {
    people,
    transactions,
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

export async function importData(backup: {
  people: Person[];
  transactions: Transaction[];
}): Promise<{ peopleCount: number; transactionCount: number }> {
  if (!Array.isArray(backup.people) || !Array.isArray(backup.transactions)) {
    throw new Error('Invalid backup file format');
  }

  writeDatabase({
    version: 1,
    people: backup.people,
    transactions: backup.transactions,
  });

  return {
    peopleCount: backup.people.length,
    transactionCount: backup.transactions.length,
  };
}
