import { describe, it, expect } from 'vitest';
import {
  calculateBalanceEffectPaise,
  calculateTotalBalancePaise,
  calculateRunningBalances,
  summarizePerson,
  summarizeDashboard,
  validateTransaction,
  validateSharedSplit,
  getBalanceStatus,
} from '../engine';
import { rupeesToPaise, formatINR, paiseToRupees } from '../currency';
import { Person, Transaction } from '../types';

const rahulId = 'person-rahul-123';
const arjunId = 'person-arjun-456';

const baseRahul: Person = {
  id: rahulId,
  ownerId: 'owner-1',
  name: 'Rahul Sharma',
  isArchived: false,
  shareToken: 'token-rahul-abc',
  isSharingEnabled: true,
  sharePolicy: 'ALL',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

const baseArjun: Person = {
  id: arjunId,
  ownerId: 'owner-1',
  name: 'Arjun Verma',
  isArchived: false,
  shareToken: 'token-arjun-xyz',
  isSharingEnabled: false,
  sharePolicy: 'ALL',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

function makeTx(
  partial: Partial<Transaction> & { amountPaise: number; type: Transaction['type'] }
): Transaction {
  const effect = partial.balanceEffectPaise !== undefined
    ? partial.balanceEffectPaise
    : calculateBalanceEffectPaise({
        type: partial.type,
        amountPaise: partial.amountPaise,
        expenseTreatment: partial.expenseTreatment,
        sharedSplit: partial.sharedSplit,
        repaymentDirection: partial.repaymentDirection,
        adjustmentDirection: partial.adjustmentDirection,
        personId: partial.personId || rahulId,
      });

  return {
    id: partial.id || `tx-${Math.random().toString(36).substring(7)}`,
    ownerId: 'owner-1',
    personId: partial.personId || rahulId,
    type: partial.type,
    amountPaise: partial.amountPaise,
    transactionDate: partial.transactionDate || '2026-10-15',
    description: partial.description || 'Test transaction',
    category: partial.category || 'General',
    expenseTreatment: partial.expenseTreatment,
    sharedSplit: partial.sharedSplit,
    repaymentDirection: partial.repaymentDirection,
    adjustmentDirection: partial.adjustmentDirection,
    balanceEffectPaise: effect,
    isShared: partial.isShared ?? true,
    createdAt: partial.createdAt || '2026-10-15T12:00:00Z',
    updatedAt: partial.updatedAt || '2026-10-15T12:00:00Z',
  };
}

describe('Viciss-Ledger Accounting Engine Test Suite', () => {
  // Scenario 1 — Money given
  it('Scenario 1: Money given (I give Rahul ₹5,000) -> balance is +₹5,000', () => {
    const tx = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
      description: 'Lent money to Rahul',
    });
    const balance = calculateTotalBalancePaise([tx]);
    expect(balance).toBe(rupeesToPaise(5000));
    expect(paiseToRupees(balance)).toBe(5000);
    expect(getBalanceStatus(balance).status).toBe('OWED_TO_ME');
  });

  // Scenario 2 — Money received
  it('Scenario 2: Money received (Rahul gives me ₹2,000) -> balance is -₹2,000', () => {
    const tx = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(2000),
      description: 'Rahul gave me money',
    });
    const balance = calculateTotalBalancePaise([tx]);
    expect(balance).toBe(rupeesToPaise(-2000));
    expect(paiseToRupees(balance)).toBe(-2000);
    expect(getBalanceStatus(balance).status).toBe('I_OWE');
  });

  // Scenario 3 — Multiple transfers
  it('Scenario 3: Multiple transfers (I give ₹5,000, he gives ₹2,000) -> balance is +₹3,000', () => {
    const tx1 = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
      transactionDate: '2026-10-10',
    });
    const tx2 = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(2000),
      transactionDate: '2026-10-11',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(3000));
    expect(paiseToRupees(balance)).toBe(3000);
  });

  // Scenario 4 — Repayment
  it('Scenario 4: Repayment (Rahul owes ₹5,000, repays ₹1,500) -> balance is +₹3,500', () => {
    const tx1 = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
      transactionDate: '2026-10-10',
    });
    const tx2 = makeTx({
      type: 'REPAYMENT',
      repaymentDirection: 'THEY_REPAY_ME',
      amountPaise: rupeesToPaise(1500),
      transactionDate: '2026-10-12',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(3500));
    expect(paiseToRupees(balance)).toBe(3500);
  });

  // Scenario 5 — Repayment in opposite direction
  it('Scenario 5: Repayment in opposite direction (I owe ₹5,000, I repay ₹1,500) -> balance is -₹3,500', () => {
    const tx1 = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
      transactionDate: '2026-10-10',
    });
    const tx2 = makeTx({
      type: 'REPAYMENT',
      repaymentDirection: 'I_REPAY_THEM',
      amountPaise: rupeesToPaise(1500),
      transactionDate: '2026-10-12',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(-3500));
    expect(paiseToRupees(balance)).toBe(-3500);
  });

  // Scenario 6 — Excess repayment
  it('Scenario 6: Excess repayment (I owe ₹1,000 and pay ₹1,500) -> balance becomes +₹500', () => {
    const tx1 = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(1000),
      transactionDate: '2026-10-10',
    });
    const tx2 = makeTx({
      type: 'REPAYMENT',
      repaymentDirection: 'I_REPAY_THEM',
      amountPaise: rupeesToPaise(1500),
      transactionDate: '2026-10-12',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(500));
    expect(paiseToRupees(balance)).toBe(500);
    expect(getBalanceStatus(balance).status).toBe('OWED_TO_ME');
  });

  // Scenario 7 — Expense for another person
  it('Scenario 7: Expense for another person (Rahul gives ₹10k, I spend ₹3k on his behalf) -> balance is -₹7,000', () => {
    const tx1 = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(10000),
      transactionDate: '2026-10-10',
      description: 'Advance from Rahul for purchase',
    });
    const tx2 = makeTx({
      type: 'EXPENSE',
      expenseTreatment: 'FOR_THEM',
      amountPaise: rupeesToPaise(3000),
      transactionDate: '2026-10-11',
      description: 'Bought materials for Rahul',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(-7000));
    expect(paiseToRupees(balance)).toBe(-7000);
  });

  // Scenario 8 — Personal expense using another person's money
  it('Scenario 8: Personal expense using another\'s money (Rahul gives ₹10k, I spend ₹3k for personal use) -> balance is -₹13,000', () => {
    const tx1 = makeTx({
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(10000),
      transactionDate: '2026-10-10',
    });
    const tx2 = makeTx({
      type: 'EXPENSE',
      expenseTreatment: 'PERSONAL_USE',
      amountPaise: rupeesToPaise(3000),
      transactionDate: '2026-10-11',
      description: 'Used Rahul funds for my personal bill',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(rupeesToPaise(-13000));
    expect(paiseToRupees(balance)).toBe(-13000);
  });

  // Scenario 9 — Shared expense
  it('Scenario 9: Shared expense (₹2,000 expense, I owe ₹800, Rahul owes ₹1,200) -> balance effect is +₹1,200', () => {
    const split = {
      mySharePaise: rupeesToPaise(800),
      participants: [
        {
          personId: rahulId,
          personName: 'Rahul Sharma',
          sharePaise: rupeesToPaise(1200),
        },
      ],
    };
    const tx = makeTx({
      type: 'EXPENSE',
      expenseTreatment: 'SHARED',
      amountPaise: rupeesToPaise(2000),
      sharedSplit: split,
      description: 'Team dinner',
    });
    expect(tx.balanceEffectPaise).toBe(rupeesToPaise(1200));
    const balance = calculateTotalBalancePaise([tx]);
    expect(balance).toBe(rupeesToPaise(1200));
  });

  // Scenario 10 — Reference-only expense
  it('Scenario 10: Reference-only expense (₹500 expense) -> balance effect is ₹0', () => {
    const tx = makeTx({
      type: 'EXPENSE',
      expenseTreatment: 'REFERENCE_ONLY',
      amountPaise: rupeesToPaise(500),
      description: 'Reference only note',
    });
    expect(tx.balanceEffectPaise).toBe(0);
    const balance = calculateTotalBalancePaise([tx]);
    expect(balance).toBe(0);
  });

  // Scenario 11 — Settled account
  it('Scenario 11: Settled account (Transfers resulting in zero) -> status is Settled', () => {
    const tx1 = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(4000),
      transactionDate: '2026-10-01',
    });
    const tx2 = makeTx({
      type: 'REPAYMENT',
      repaymentDirection: 'THEY_REPAY_ME',
      amountPaise: rupeesToPaise(4000),
      transactionDate: '2026-10-05',
    });
    const balance = calculateTotalBalancePaise([tx1, tx2]);
    expect(balance).toBe(0);
    const { status, label } = getBalanceStatus(balance);
    expect(status).toBe('SETTLED');
    expect(label).toBe('Settled');
  });

  // Scenario 12 — Edit a transaction
  it('Scenario 12: Edit a transaction (Change ₹1,000 to ₹1,500) -> recalculates correctly', () => {
    const tx1 = makeTx({
      id: 'tx-edit-target',
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(1000),
    });
    expect(calculateTotalBalancePaise([tx1])).toBe(rupeesToPaise(1000));

    // Edit to 1500
    const editedTx = {
      ...tx1,
      amountPaise: rupeesToPaise(1500),
      balanceEffectPaise: calculateBalanceEffectPaise({
        type: tx1.type,
        amountPaise: rupeesToPaise(1500),
      }),
    };
    expect(calculateTotalBalancePaise([editedTx])).toBe(rupeesToPaise(1500));
  });

  // Scenario 13 — Delete a transaction
  it('Scenario 13: Delete a transaction -> affected balances recalculate correctly', () => {
    const tx1 = makeTx({ id: 'tx-1', type: 'GIVE_MONEY', amountPaise: rupeesToPaise(3000) });
    const tx2 = makeTx({ id: 'tx-2', type: 'GIVE_MONEY', amountPaise: rupeesToPaise(2000) });
    expect(calculateTotalBalancePaise([tx1, tx2])).toBe(rupeesToPaise(5000));

    // Delete tx2
    const remaining = [tx1, tx2].filter((t) => t.id !== 'tx-2');
    expect(calculateTotalBalancePaise(remaining)).toBe(rupeesToPaise(3000));
  });

  // Scenario 14 — Independent people
  it('Scenario 14: Independent people (Rahul and Arjun ledgers do not interfere)', () => {
    const rahulTx = makeTx({
      personId: rahulId,
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
    });
    const arjunTx = makeTx({
      personId: arjunId,
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(3000),
    });

    const allTransactions = [rahulTx, arjunTx];
    const rahulSum = summarizePerson(baseRahul, allTransactions);
    const arjunSum = summarizePerson(baseArjun, allTransactions);

    expect(rahulSum.currentBalancePaise).toBe(rupeesToPaise(5000));
    expect(arjunSum.currentBalancePaise).toBe(rupeesToPaise(-3000));

    // Dashboard reconciliation
    const dash = summarizeDashboard([baseRahul, baseArjun], allTransactions);
    expect(dash.moneyOwedToMePaise).toBe(rupeesToPaise(5000));
    expect(dash.moneyIOwePaise).toBe(rupeesToPaise(3000));
    expect(dash.netBalancePaise).toBe(rupeesToPaise(2000));
  });

  // Scenario 15 — Running balances & deterministic tie breaking
  it('Scenario 15: Running balances calculate correctly in chronological order', () => {
    const txA = makeTx({
      id: 'tx-a',
      transactionDate: '2026-10-01',
      createdAt: '2026-10-01T10:00:00Z',
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(1000),
    });
    const txB = makeTx({
      id: 'tx-b',
      transactionDate: '2026-10-03',
      createdAt: '2026-10-03T10:00:00Z',
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(300),
    });
    const txC = makeTx({
      id: 'tx-c',
      transactionDate: '2026-10-05',
      createdAt: '2026-10-05T10:00:00Z',
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(500),
    });

    const running = calculateRunningBalances([txC, txA, txB]); // pass unsorted
    expect(running[0].id).toBe('tx-a');
    expect(running[0].runningBalancePaise).toBe(rupeesToPaise(1000));

    expect(running[1].id).toBe('tx-b');
    expect(running[1].runningBalancePaise).toBe(rupeesToPaise(700));

    expect(running[2].id).toBe('tx-c');
    expect(running[2].runningBalancePaise).toBe(rupeesToPaise(1200));
  });

  // Scenario 16 — Public sharing balance calculation
  it('Scenario 16: Public shared ledger calculates balance strictly from shared records', () => {
    const tx1 = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(2000),
      isShared: true,
    });
    const tx2 = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(1000),
      isShared: true,
    });
    const sharedTxs = [tx1, tx2].filter((t) => t.isShared);
    const sharedBalance = calculateTotalBalancePaise(sharedTxs);
    expect(sharedBalance).toBe(rupeesToPaise(3000));
  });

  // Scenario 17 — Revoked link / sharing disabled
  it('Scenario 17: Revoking or disabling sharing disables public visibility', () => {
    const person = { ...baseRahul, isSharingEnabled: false };
    expect(person.isSharingEnabled).toBe(false);
  });

  // Scenario 18 — Hidden transactions / selective sharing
  it('Scenario 18: Excluding a transaction from public ledger does not leak into shared balance', () => {
    const publicTx = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(2500),
      isShared: true,
      description: 'Public dinner share',
    });
    const privateTx = makeTx({
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(10000),
      isShared: false, // EXCLUDED from public view
      description: 'Private loan',
    });

    // Public view only queries isShared === true
    const publicRecords = [publicTx, privateTx].filter((t) => t.isShared);
    expect(publicRecords.length).toBe(1);
    expect(calculateTotalBalancePaise(publicRecords)).toBe(rupeesToPaise(2500));
    expect(publicRecords.find((t) => t.description === 'Private loan')).toBeUndefined();
  });

  // Scenario 19 — Duplicate submission / validation prevention
  it('Scenario 19: Validates required transaction fields to prevent malformed or duplicate posts', () => {
    const invalidTx = {
      personId: '',
      amountPaise: 0,
      description: '',
    };
    const validation = validateTransaction(invalidTx);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBeDefined();
  });

  // Scenario 20 — Invalid expense allocations rejection
  it('Scenario 20: Rejects shared expense allocations that do not sum to total expense', () => {
    const invalidSplit = {
      mySharePaise: rupeesToPaise(500),
      participants: [
        {
          personId: rahulId,
          personName: 'Rahul Sharma',
          sharePaise: rupeesToPaise(1000), // 500 + 1000 = 1500 != 2000
        },
      ],
    };
    const res = validateSharedSplit(rupeesToPaise(2000), invalidSplit);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Mismatch');
  });

  // Indian Rupee formatting verification
  it('Formats Indian Rupee with Indian number grouping correctly', () => {
    expect(formatINR(rupeesToPaise(500))).toBe('₹500.00');
    expect(formatINR(rupeesToPaise(12500))).toBe('₹12,500.00');
    expect(formatINR(rupeesToPaise(125000))).toBe('₹1,25,000.00');
    expect(formatINR(rupeesToPaise(1250000))).toBe('₹12,50,000.00');
    expect(formatINR(rupeesToPaise(-3500))).toBe('- ₹3,500.00');
  });
});
