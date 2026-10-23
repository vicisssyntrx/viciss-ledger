import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPeople,
  createPerson,
  updatePerson,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getPublicSharedLedger,
  regenerateShareToken,
  toggleSharing,
} from '../index';
import { rupeesToPaise } from '../../accounting/currency';

describe('Database Persistence & Isolation Tests', () => {
  it('Creates and retrieves a person', async () => {
    const person = await createPerson({
      name: 'Dev Test User',
      nickname: 'Dev',
      phone: '+91 99999 88888',
      notes: 'Private developer test note',
    });

    expect(person.id).toBeDefined();
    expect(person.name).toBe('Dev Test User');
    expect(person.shareToken).toBeDefined();
    expect(person.isSharingEnabled).toBe(false);

    const people = await getPeople();
    const found = people.find((p) => p.id === person.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Dev Test User');
  });

  it('Creates transactions and calculates balance effects', async () => {
    const person = await createPerson({ name: 'Finance Test Person' });
    
    // Give ₹4,000
    const tx1 = await createTransaction({
      ownerId: 'default-owner',
      personId: person.id,
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(4000),
      transactionDate: '2026-10-20',
      description: 'Lent money',
      category: 'Loan',
      isShared: true,
    });
    expect(tx1.balanceEffectPaise).toBe(rupeesToPaise(4000));

    // Repay ₹1,500
    const tx2 = await createTransaction({
      ownerId: 'default-owner',
      personId: person.id,
      type: 'REPAYMENT',
      repaymentDirection: 'THEY_REPAY_ME',
      amountPaise: rupeesToPaise(1500),
      transactionDate: '2026-10-21',
      description: 'Part payment',
      category: 'Repayment',
      isShared: true,
    });
    expect(tx2.balanceEffectPaise).toBe(-rupeesToPaise(1500));

    const personTxs = await getTransactions({ personId: person.id });
    expect(personTxs.length).toBe(2);
  });

  it('Isolates public sharing: returns 404 when disabled, and only returns shared non-sensitive fields when enabled', async () => {
    const person = await createPerson({
      name: 'Public Test Person',
      phone: '+91 99999 00000',
      email: 'private@test.com',
      notes: 'Super secret personal notes',
    });

    // Sharing disabled initially
    const sharedDisabled = await getPublicSharedLedger(person.shareToken);
    expect(sharedDisabled).toBeNull();

    // Enable sharing
    await toggleSharing(person.id, true);

    // Add 1 shared and 1 private transaction
    await createTransaction({
      ownerId: 'default-owner',
      personId: person.id,
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(2500),
      transactionDate: '2026-10-22',
      description: 'Public dinner share',
      category: 'Food',
      isShared: true,
    });

    await createTransaction({
      ownerId: 'default-owner',
      personId: person.id,
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(10000),
      transactionDate: '2026-10-22',
      description: 'Private loan transaction',
      category: 'Private',
      isShared: false, // Private!
    });

    const publicView = await getPublicSharedLedger(person.shareToken);
    expect(publicView).not.toBeNull();
    expect(publicView?.person.name).toBe('Public Test Person');
    
    // Strict isolation checks:
    // 1. Private fields must NOT be on publicView.person
    expect((publicView?.person as any).phone).toBeUndefined();
    expect((publicView?.person as any).email).toBeUndefined();
    expect((publicView?.person as any).notes).toBeUndefined();

    // 2. Only 1 shared transaction should be returned
    expect(publicView?.transactions.length).toBe(1);
    expect(publicView?.transactions[0].description).toBe('Public dinner share');
    expect(publicView?.currentBalancePaise).toBe(rupeesToPaise(2500));

    // Regenerate token -> old link stops working
    const oldToken = person.shareToken;
    const newToken = await regenerateShareToken(person.id);
    expect(newToken).not.toBe(oldToken);

    const oldView = await getPublicSharedLedger(oldToken);
    expect(oldView).toBeNull();

    const newView = await getPublicSharedLedger(newToken);
    expect(newView).not.toBeNull();
  });
});
