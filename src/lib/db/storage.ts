import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { Person, Transaction } from '../accounting/types';
import { calculateBalanceEffectPaise } from '../accounting/engine';
import { rupeesToPaise } from '../accounting/currency';

interface DatabaseSchema {
  people: Person[];
  transactions: Transaction[];
  version: number;
}

const INITIAL_SEED_DATA: DatabaseSchema = {
  version: 1,
  people: [
    {
      id: 'person-rahul-001',
      ownerId: 'default-owner',
      name: 'Rahul Sharma',
      nickname: 'Rahul',
      color: 'amber',
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
      color: 'emerald',
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
      color: 'blue',
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

function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.cwd().startsWith('/var/task')
  );
}

function getStoragePaths() {
  if (isServerless()) {
    const dir = path.join(os.tmpdir(), '.viciss_data');
    return {
      dataDir: dir,
      dbFile: path.join(dir, 'viciss_db.json'),
    };
  }
  const dir = path.join(process.cwd(), '.data');
  return {
    dataDir: dir,
    dbFile: path.join(dir, 'viciss_db.json'),
  };
}

let inMemoryCache: DatabaseSchema | null = null;

function ensureDbFile(): string {
  const { dataDir, dbFile } = getStoragePaths();

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create data directory, using in-memory fallback if needed:', e);
  }

  try {
    if (!fs.existsSync(dbFile)) {
      // Check if repo seed file exists in cwd
      const repoDbFile = path.join(process.cwd(), '.data', 'viciss_db.json');
      let seedContent = JSON.stringify(INITIAL_SEED_DATA, null, 2);
      if (fs.existsSync(repoDbFile)) {
        try {
          seedContent = fs.readFileSync(repoDbFile, 'utf-8');
        } catch (err) {
          console.warn('Could not read repo db file, using initial seed:', err);
        }
      }

      fs.writeFileSync(dbFile, seedContent, 'utf-8');
    }
  } catch (err) {
    console.warn('Could not write db seed to file, operating with in-memory store:', err);
  }

  return dbFile;
}

export function readDatabase(): DatabaseSchema {
  const dbFile = ensureDbFile();
  try {
    if (fs.existsSync(dbFile)) {
      const raw = fs.readFileSync(dbFile, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      inMemoryCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  if (inMemoryCache) {
    return inMemoryCache;
  }

  // Also check repo fallback
  const repoDbFile = path.join(process.cwd(), '.data', 'viciss_db.json');
  if (fs.existsSync(repoDbFile)) {
    try {
      const raw = fs.readFileSync(repoDbFile, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      inMemoryCache = parsed;
      return parsed;
    } catch (e) {
      // ignore
    }
  }

  inMemoryCache = INITIAL_SEED_DATA;
  return INITIAL_SEED_DATA;
}

export function writeDatabase(data: DatabaseSchema): void {
  inMemoryCache = data;
  const { dataDir, dbFile } = getStoragePaths();

  const writeToFile = (targetDir: string, targetFile: string) => {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const tempFile = `${targetFile}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, targetFile);
  };

  try {
    writeToFile(dataDir, dbFile);
  } catch (err: any) {
    // If we hit EROFS or permission error, fall back immediately to os.tmpdir()
    if (err?.code === 'EROFS' || err?.message?.includes('read-only')) {
      try {
        const tmpDir = path.join(os.tmpdir(), '.viciss_data');
        const tmpFile = path.join(tmpDir, 'viciss_db.json');
        writeToFile(tmpDir, tmpFile);
        return;
      } catch (tmpErr) {
        console.error('Fallback write to tmpdir also failed, kept in memory:', tmpErr);
      }
    }
    console.error('writeDatabase file write error (retained in memory):', err);
  }
}

export function generateSecureToken(): string {
  return `vcs_${crypto.randomBytes(24).toString('hex')}`;
}

