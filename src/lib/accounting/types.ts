/**
 * Viciss-Ledger: Core Accounting & Domain Types
 * 
 * ACCOUNTING CONVENTIONS:
 * - Signed Balance = Total amount owed to me - Total amount I owe them
 *   * Positive balance (> 0): The other person owes me. ("Owes you ₹...")
 *   * Negative balance (< 0): I owe the other person. ("You owe ₹...")
 *   * Zero balance (= 0): The account is settled. ("Settled")
 * - All monetary values are strictly represented in integer paise (1 Rupee = 100 paise)
 *   to avoid any IEEE-754 floating-point inaccuracies.
 */

export type TransactionType =
  | 'GIVE_MONEY'
  | 'RECEIVE_MONEY'
  | 'EXPENSE'
  | 'REPAYMENT'
  | 'ADJUSTMENT';

export type ExpenseTreatment =
  | 'FOR_THEM'        // Option 1: Expense for other person (e.g., spent from money they gave me, or on their behalf)
  | 'PERSONAL_USE'    // Option 2: Personal expense using their money (I must repay them)
  | 'SHARED'          // Option 3: Shared expense split between parties
  | 'REFERENCE_ONLY'; // Option 4: Record-only expense, ₹0 effect on balance

export type RepaymentDirection =
  | 'I_REPAY_THEM'    // Decreases debt I owe them (-amount effect)
  | 'THEY_REPAY_ME';  // Decreases debt they owe me (+amount effect)

export type AdjustmentDirection =
  | 'INCREASE_OWED_TO_ME' // +amount effect
  | 'DECREASE_OWED_TO_ME'; // -amount effect

export interface SharedSplitParticipant {
  personId: string;
  personName: string;
  sharePaise: number; // in integer paise
}

export interface SharedSplitConfig {
  mySharePaise: number;
  participants: SharedSplitParticipant[];
}

export type BalanceStatus = 'OWED_TO_ME' | 'I_OWE' | 'SETTLED';

export interface Person {
  id: string;
  ownerId: string;
  name: string;
  nickname?: string;
  color?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isArchived: boolean;
  shareToken: string;
  isSharingEnabled: boolean;
  sharePolicy: 'ALL' | 'SELECTED';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  ownerId: string;
  personId: string;
  type: TransactionType;
  amountPaise: number; // Stored in integer paise (> 0)
  transactionDate: string; // ISO string or YYYY-MM-DD
  description: string;
  category: string;
  notes?: string;

  // Specific transaction type parameters
  expenseTreatment?: ExpenseTreatment;
  sharedSplit?: SharedSplitConfig;
  repaymentDirection?: RepaymentDirection;
  adjustmentDirection?: AdjustmentDirection;

  // Derived accounting effect
  balanceEffectPaise: number; // Signed change to (Owed to me - I owe them)

  // Sharing settings
  isShared: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface PersonSummary {
  personId: string;
  personName: string;
  nickname?: string;
  color?: string;
  currentBalancePaise: number;
  status: BalanceStatus;
  statusLabel: string;
  formattedBalance: string;

  // Granular accounting breakdowns
  totalGivenToThemPaise: number;
  totalReceivedFromThemPaise: number;
  totalRepaidByThemPaise: number;
  totalRepaidByMePaise: number;
  totalExpensesForThemPaise: number;
  totalPersonalExpensesUsingTheirMoneyPaise: number;
  totalSharedExpensesPaise: number;
  totalMySharedPortionPaise: number;
  totalAdjustmentsPaise: number;

  transactionCount: number;
  lastTransactionDate?: string;
  isSharingEnabled: boolean;
  shareToken: string;
}

export interface DashboardSummary {
  moneyOwedToMePaise: number; // Sum of all positive balances
  moneyIOwePaise: number;     // Sum of absolute values of all negative balances
  netBalancePaise: number;     // moneyOwedToMe - moneyIOwe
  totalActivePeople: number;
  formattedMoneyOwedToMe: string;
  formattedMoneyIOwe: string;
  formattedNetBalance: string;
  netStatus: BalanceStatus;
}

export interface TransactionWithRunningBalance extends Transaction {
  runningBalancePaise: number;
  formattedAmount: string;
  formattedBalanceEffect: string;
  formattedRunningBalance: string;
}
