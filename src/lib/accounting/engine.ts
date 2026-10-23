/**
 * Viciss-Ledger: Core Accounting Engine
 * 
 * SIGNED BALANCE DEFINITION:
 *   Signed Balance = Total amounts owed to me − Total amounts I owe them
 * 
 * INTERPRETATION:
 *   - Signed Balance > 0 : The other person owes me (Status: 'OWED_TO_ME')
 *   - Signed Balance < 0 : I owe the other person (Status: 'I_OWE')
 *   - Signed Balance = 0 : Account is settled (Status: 'SETTLED')
 * 
 * INVARIANTS:
 *   1. Money received from a person is not treated as earned profit or income.
 *   2. Repayments reduce the corresponding debt in the correct mathematical direction.
 *   3. Shared expense allocations must reconcile exactly with the total expense amount.
 *   4. Dashboard net balance strictly equals the sum of all individual signed balances.
 *   5. Dashboard net balance strictly equals (Total money owed to me - Total money I owe).
 *   6. A zero signed balance means settled regardless of gross historical volumes.
 *   7. Editing/deleting transactions recalculates all balances and summaries deterministically.
 *   8. Expenses are not double-counted when paid from previously received funds.
 *   9. Reference-only transactions have a strict ₹0 balance effect.
 *   10. All financial operations operate on integer paise with zero floating-point loss.
 */

import {
  Transaction,
  Person,
  PersonSummary,
  DashboardSummary,
  TransactionWithRunningBalance,
  BalanceStatus,
  SharedSplitConfig,
} from './types';
import { formatINR } from './currency';

/**
 * Calculates the exact signed balance effect in integer paise for any transaction.
 */
export function calculateBalanceEffectPaise(tx: {
  type: Transaction['type'];
  amountPaise: number;
  expenseTreatment?: Transaction['expenseTreatment'];
  sharedSplit?: SharedSplitConfig;
  repaymentDirection?: Transaction['repaymentDirection'];
  adjustmentDirection?: Transaction['adjustmentDirection'];
  personId?: string;
}): number {
  const amount = Math.abs(Math.round(tx.amountPaise || 0));

  switch (tx.type) {
    case 'GIVE_MONEY':
      // Money moved from me to them -> They owe me (+amount)
      return amount;

    case 'RECEIVE_MONEY':
      // Money moved from them to me -> I hold this for them / owe them (-amount)
      return -amount;

    case 'EXPENSE': {
      const treatment = tx.expenseTreatment || 'FOR_THEM';

      if (treatment === 'FOR_THEM') {
        // Spent on their behalf. Offsets money they previously gave me (+amount),
        // or they owe me for purchasing it.
        return amount;
      }

      if (treatment === 'PERSONAL_USE') {
        // I used money they gave me for my own personal expense and must repay them.
        // Deepens my debt to them (-amount).
        return -amount;
      }

      if (treatment === 'SHARED') {
        // Shared purchase. The balance effect between me and the target person
        // is the portion allocated to them which they owe me (+theirShare).
        if (tx.sharedSplit && tx.personId) {
          const participant = tx.sharedSplit.participants.find(
            (p) => p.personId === tx.personId
          );
          if (participant) {
            return Math.abs(Math.round(participant.sharePaise));
          }
        }
        // If single participant or split not detailed, fallback to difference
        if (tx.sharedSplit) {
          const sumParticipants = tx.sharedSplit.participants.reduce(
            (acc, p) => acc + Math.abs(Math.round(p.sharePaise)),
            0
          );
          return sumParticipants;
        }
        return amount;
      }

      if (treatment === 'REFERENCE_ONLY') {
        // Record keeping only. Zero effect on balance.
        return 0;
      }

      return 0;
    }

    case 'REPAYMENT': {
      const direction = tx.repaymentDirection || 'THEY_REPAY_ME';

      if (direction === 'THEY_REPAY_ME') {
        // They owe me, and they repay me.
        // Reduces what they owe me: (+5000 -> repay 1500 -> +3500).
        // Change in balance: -amount
        return -amount;
      }

      if (direction === 'I_REPAY_THEM') {
        // I owe them, and I repay them.
        // Reduces what I owe them: (-5000 -> repay 1500 -> -3500; -1000 -> repay 1500 -> +500).
        // Change in balance: +amount
        return amount;
      }

      return 0;
    }

    case 'ADJUSTMENT': {
      const direction = tx.adjustmentDirection || 'INCREASE_OWED_TO_ME';
      if (direction === 'INCREASE_OWED_TO_ME') {
        return amount;
      }
      return -amount;
    }

    default:
      return 0;
  }
}

/**
 * Validates a shared split configuration against the total expense amount.
 */
export function validateSharedSplit(
  totalAmountPaise: number,
  split?: SharedSplitConfig
): { valid: boolean; error?: string } {
  if (!split) {
    return { valid: false, error: 'Shared split details are required for shared expenses.' };
  }

  const myShare = Math.abs(Math.round(split.mySharePaise || 0));
  const participantsTotal = (split.participants || []).reduce(
    (acc, p) => acc + Math.abs(Math.round(p.sharePaise || 0)),
    0
  );

  const totalAllocated = myShare + participantsTotal;

  if (totalAllocated !== Math.abs(Math.round(totalAmountPaise))) {
    return {
      valid: false,
      error: `Sum of allocations (${formatINR(totalAllocated)}) does not equal total expense (${formatINR(totalAmountPaise)}). Mismatch of ${formatINR(Math.abs(totalAllocated - totalAmountPaise))}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates any transaction before persistence.
 */
export function validateTransaction(
  tx: Partial<Transaction>
): { valid: boolean; error?: string } {
  if (!tx.personId || tx.personId.trim() === '') {
    return { valid: false, error: 'A person must be selected for the transaction.' };
  }

  if (!tx.type) {
    return { valid: false, error: 'Transaction type is required.' };
  }

  if (!tx.amountPaise || tx.amountPaise <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }

  if (!tx.description || tx.description.trim() === '') {
    return { valid: false, error: 'Description is required.' };
  }

  if (!tx.transactionDate) {
    return { valid: false, error: 'Transaction date is required.' };
  }

  if (tx.type === 'ADJUSTMENT' && (!tx.notes && !tx.description)) {
    return { valid: false, error: 'An explanation is required for adjustments.' };
  }

  if (tx.type === 'EXPENSE' && tx.expenseTreatment === 'SHARED') {
    return validateSharedSplit(tx.amountPaise, tx.sharedSplit);
  }

  return { valid: true };
}

/**
 * Deterministically sorts transactions:
 * 1. transactionDate ascending
 * 2. createdAt ascending
 * 3. id ascending
 */
export function sortTransactionsChronological(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateComparison = a.transactionDate.localeCompare(b.transactionDate);
    if (dateComparison !== 0) return dateComparison;

    const createdComparison = (a.createdAt || '').localeCompare(b.createdAt || '');
    if (createdComparison !== 0) return createdComparison;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Calculates running balances for an array of transactions for a specific person.
 */
export function calculateRunningBalances(
  transactions: Transaction[]
): TransactionWithRunningBalance[] {
  const sorted = sortTransactionsChronological(transactions);
  let running = 0;

  return sorted.map((tx) => {
    const effect = tx.balanceEffectPaise !== undefined 
      ? tx.balanceEffectPaise 
      : calculateBalanceEffectPaise(tx);
    
    running += effect;

    return {
      ...tx,
      balanceEffectPaise: effect,
      runningBalancePaise: running,
      formattedAmount: formatINR(tx.amountPaise),
      formattedBalanceEffect: formatINR(effect, { showSign: true }),
      formattedRunningBalance: formatINR(running),
    };
  });
}

/**
 * Calculates current signed balance for a set of transactions.
 */
export function calculateTotalBalancePaise(transactions: Transaction[]): number {
  return transactions.reduce((acc, tx) => {
    const effect = tx.balanceEffectPaise !== undefined
      ? tx.balanceEffectPaise
      : calculateBalanceEffectPaise(tx);
    return acc + effect;
  }, 0);
}

/**
 * Determines balance status and human readable label.
 */
export function getBalanceStatus(balancePaise: number): {
  status: BalanceStatus;
  label: string;
} {
  if (balancePaise > 0) {
    return {
      status: 'OWED_TO_ME',
      label: `Owes you ${formatINR(balancePaise)}`,
    };
  }
  if (balancePaise < 0) {
    return {
      status: 'I_OWE',
      label: `You owe ${formatINR(Math.abs(balancePaise))}`,
    };
  }
  return {
    status: 'SETTLED',
    label: 'Settled',
  };
}

/**
 * Generates an in-depth financial summary for an individual person.
 */
export function summarizePerson(
  person: Person,
  allTransactions: Transaction[]
): PersonSummary {
  const personTxs = allTransactions.filter((tx) => tx.personId === person.id);
  const currentBalancePaise = calculateTotalBalancePaise(personTxs);
  const { status, label } = getBalanceStatus(currentBalancePaise);

  let totalGivenToThemPaise = 0;
  let totalReceivedFromThemPaise = 0;
  let totalRepaidByThemPaise = 0;
  let totalRepaidByMePaise = 0;
  let totalExpensesForThemPaise = 0;
  let totalPersonalExpensesUsingTheirMoneyPaise = 0;
  let totalSharedExpensesPaise = 0;
  let totalMySharedPortionPaise = 0;
  let totalAdjustmentsPaise = 0;

  let latestDate: string | undefined = undefined;

  for (const tx of personTxs) {
    if (!latestDate || tx.transactionDate > latestDate) {
      latestDate = tx.transactionDate;
    }

    switch (tx.type) {
      case 'GIVE_MONEY':
        totalGivenToThemPaise += tx.amountPaise;
        break;
      case 'RECEIVE_MONEY':
        totalReceivedFromThemPaise += tx.amountPaise;
        break;
      case 'REPAYMENT':
        if (tx.repaymentDirection === 'I_REPAY_THEM') {
          totalRepaidByMePaise += tx.amountPaise;
        } else {
          totalRepaidByThemPaise += tx.amountPaise;
        }
        break;
      case 'EXPENSE':
        if (tx.expenseTreatment === 'FOR_THEM') {
          totalExpensesForThemPaise += tx.amountPaise;
        } else if (tx.expenseTreatment === 'PERSONAL_USE') {
          totalPersonalExpensesUsingTheirMoneyPaise += tx.amountPaise;
        } else if (tx.expenseTreatment === 'SHARED') {
          totalSharedExpensesPaise += tx.amountPaise;
          if (tx.sharedSplit) {
            totalMySharedPortionPaise += tx.sharedSplit.mySharePaise;
          }
        }
        break;
      case 'ADJUSTMENT':
        totalAdjustmentsPaise += tx.amountPaise;
        break;
    }
  }

  return {
    personId: person.id,
    personName: person.name,
    nickname: person.nickname,
    color: person.color,
    currentBalancePaise,
    status,
    statusLabel: label,
    formattedBalance: formatINR(currentBalancePaise, { absolute: true }),
    totalGivenToThemPaise,
    totalReceivedFromThemPaise,
    totalRepaidByThemPaise,
    totalRepaidByMePaise,
    totalExpensesForThemPaise,
    totalPersonalExpensesUsingTheirMoneyPaise,
    totalSharedExpensesPaise,
    totalMySharedPortionPaise,
    totalAdjustmentsPaise,
    transactionCount: personTxs.length,
    lastTransactionDate: latestDate,
    isSharingEnabled: person.isSharingEnabled,
    shareToken: person.shareToken,
  };
}

/**
 * Summarizes global dashboard totals derived strictly from individual balances.
 * Invariants 4 & 5:
 *   - moneyOwedToMe = sum of positive signed balances
 *   - moneyIOwe = sum of absolute value of negative signed balances
 *   - netBalance = moneyOwedToMe - moneyIOwe = sum of all signed balances
 */
export function summarizeDashboard(
  people: Person[],
  transactions: Transaction[]
): DashboardSummary {
  const activePeople = people.filter((p) => !p.isArchived);
  
  let moneyOwedToMePaise = 0;
  let moneyIOwePaise = 0;

  for (const person of activePeople) {
    const personTxs = transactions.filter((t) => t.personId === person.id);
    const balance = calculateTotalBalancePaise(personTxs);

    if (balance > 0) {
      moneyOwedToMePaise += balance;
    } else if (balance < 0) {
      moneyIOwePaise += Math.abs(balance);
    }
  }

  const netBalancePaise = moneyOwedToMePaise - moneyIOwePaise;
  const { status: netStatus } = getBalanceStatus(netBalancePaise);

  return {
    moneyOwedToMePaise,
    moneyIOwePaise,
    netBalancePaise,
    totalActivePeople: activePeople.length,
    formattedMoneyOwedToMe: formatINR(moneyOwedToMePaise),
    formattedMoneyIOwe: formatINR(moneyIOwePaise),
    formattedNetBalance: formatINR(netBalancePaise),
    netStatus,
  };
}
