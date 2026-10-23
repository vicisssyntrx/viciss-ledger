import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Person, Transaction } from '../accounting/types';
import { calculateBalanceEffectPaise } from '../accounting/engine';
import { rupeesToPaise } from '../accounting/currency';

interface DatabaseSchema {
  people: Person[];
  transactions: Transaction[];
  version: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'viciss_db.json');

const INITIAL_SEED_DATA: DatabaseSchema = {
  version: 1,
  people: [
    {
      id: 'person-rahul-001',
      ownerId: 'default-owner',
      name: 'Rahul Sharma',
      nickname: 'Rahul',
      phone: '+91 98765 43210',
      email: 'rahul.sharma@example.com',
      notes: 'Colleague & weekend badminton partner',
      isArchived: false,
      shareToken: 'vcs_shr_rahul_9a8b7c6d5e4f3a2b1c0d',
      isSharingEnabled: true,
      sharePolicy: 'ALL',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'person-priya-002',
      ownerId: 'default-owner',
      name: 'Priya Patel',
      nickname: 'Priya',
      phone: '+91 98123 45678',
      email: 'priya.patel@example.com',
      notes: 'Flatmate - split rent & groceries',
      isArchived: false,
      shareToken: 'vcs_shr_priya_8b7a6c5d4e3f2a1b0c9d',
      isSharingEnabled: true,
      sharePolicy: 'ALL',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'person-arjun-003',
      ownerId: 'default-owner',
      name: 'Arjun Verma',
      nickname: 'Arjun',
      phone: '+91 97654 32109',
      notes: 'College friend',
      isArchived: false,
      shareToken: 'vcs_shr_arjun_7a6b5c4d3e2f1a0b9c8d',
      isSharingEnabled: false,
      sharePolicy: 'ALL',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  transactions: [
    // Rahul: I gave him ₹5,000, he repaid ₹2,000 -> net Rahul owes me ₹3,000
    {
      id: 'tx-001',
      ownerId: 'default-owner',
      personId: 'person-rahul-001',
      type: 'GIVE_MONEY',
      amountPaise: rupeesToPaise(5000),
      transactionDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      description: 'Lent for urgent medical bill',
      category: 'Loan',
      balanceEffectPaise: rupeesToPaise(5000),
      isShared: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'tx-002',
      ownerId: 'default-owner',
      personId: 'person-rahul-001',
      type: 'REPAYMENT',
      repaymentDirection: 'THEY_REPAY_ME',
      amountPaise: rupeesToPaise(2000),
      transactionDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      description: 'UPI part repayment',
      category: 'Repayment',
      balanceEffectPaise: -rupeesToPaise(2000),
      isShared: true,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    // Priya: Shared groceries ₹4,200 (my share ₹2,100, Priya owes ₹2,100) -> Priya owes me ₹2,100
    {
      id: 'tx-003',
      ownerId: 'default-owner',
      personId: 'person-priya-002',
      type: 'EXPENSE',
      expenseTreatment: 'SHARED',
      amountPaise: rupeesToPaise(4200),
      sharedSplit: {
        mySharePaise: rupeesToPaise(2100),
        participants: [
          {
            personId: 'person-priya-002',
            personName: 'Priya Patel',
            sharePaise: rupeesToPaise(2100),
          },
        ],
      },
      transactionDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      description: 'Monthly Nature Basket Groceries',
      category: 'Groceries',
      balanceEffectPaise: rupeesToPaise(2100),
      isShared: true,
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    // Arjun: Arjun gave me ₹3,500 advance for concert tickets -> I owe Arjun ₹3,500
    {
      id: 'tx-004',
      ownerId: 'default-owner',
      personId: 'person-arjun-003',
      type: 'RECEIVE_MONEY',
      amountPaise: rupeesToPaise(3500),
      transactionDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
      description: 'Concert ticket booking advance',
      category: 'Entertainment',
      balanceEffectPaise: -rupeesToPaise(3500),
      isShared: true,
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
  ],
};

function ensureDbFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED_DATA, null, 2), 'utf-8');
  }
}

export function readDatabase(): DatabaseSchema {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading database file, resetting to seed:', err);
    return INITIAL_SEED_DATA;
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  ensureDbFile();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function generateSecureToken(): string {
  return `vcs_${crypto.randomBytes(24).toString('hex')}`;
}
