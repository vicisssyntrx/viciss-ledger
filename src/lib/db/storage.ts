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
  people: [],
  transactions: [],
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

export function getPersonColors(): Record<string, string> {
  const { dataDir } = getStoragePaths();
  const colorsFile = path.join(dataDir, 'person_colors.json');
  try {
    if (fs.existsSync(colorsFile)) {
      const raw = fs.readFileSync(colorsFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading person colors file:', err);
  }
  // Also check os.tmpdir fallback
  try {
    const tmpFile = path.join(os.tmpdir(), '.viciss_data', 'person_colors.json');
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {};
}

export function savePersonColor(personId: string, color: string): void {
  const { dataDir } = getStoragePaths();
  const colors = getPersonColors();
  colors[personId] = color;

  const writeColors = (targetDir: string) => {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const colorsFile = path.join(targetDir, 'person_colors.json');
    fs.writeFileSync(colorsFile, JSON.stringify(colors, null, 2), 'utf-8');
  };

  try {
    writeColors(dataDir);
  } catch (err) {
    try {
      writeColors(path.join(os.tmpdir(), '.viciss_data'));
    } catch (e) {
      console.error('Failed to write person colors:', e);
    }
  }
}

export function getPersonLedgerTypes(): Record<string, 'LENDING' | 'BORROWING' | 'CUSTODIAL'> {
  const { dataDir } = getStoragePaths();
  const file = path.join(dataDir, 'person_ledger_types.json');
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading person ledger types file:', err);
  }
  try {
    const tmpFile = path.join(os.tmpdir(), '.viciss_data', 'person_ledger_types.json');
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {};
}

export function savePersonLedgerType(personId: string, ledgerType: 'LENDING' | 'BORROWING' | 'CUSTODIAL'): void {
  const { dataDir } = getStoragePaths();
  const types = getPersonLedgerTypes();
  types[personId] = ledgerType;

  const writeTypes = (targetDir: string) => {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const file = path.join(targetDir, 'person_ledger_types.json');
    fs.writeFileSync(file, JSON.stringify(types, null, 2), 'utf-8');
  };

  try {
    writeTypes(dataDir);
  } catch (err) {
    try {
      writeTypes(path.join(os.tmpdir(), '.viciss_data'));
    } catch (e) {
      console.error('Failed to write person ledger types:', e);
    }
  }
}

export interface PersonalAccountSettings {
  initialBalancePaise: number; // e.g. 17545.52 => 1754552
  manualAdjustmentsPaise: number; // Sum of manual credits (+ve) and debits (-ve)
  history: Array<{
    id: string;
    type: 'CREDIT' | 'DEBIT' | 'SET';
    amountPaise: number;
    description: string;
    createdAt: string;
  }>;
}

const DEFAULT_PERSONAL_ACCOUNT: PersonalAccountSettings = {
  initialBalancePaise: 1754552, // ₹17,545.52
  manualAdjustmentsPaise: 0,
  history: [
    {
      id: 'init-seed',
      type: 'SET',
      amountPaise: 1754552,
      description: 'Initial starting balance in personal account',
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getPersonalAccountSettings(): PersonalAccountSettings {
  const { dataDir } = getStoragePaths();
  const file = path.join(dataDir, 'personal_account.json');
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading personal account file:', err);
  }
  try {
    const tmpFile = path.join(os.tmpdir(), '.viciss_data', 'personal_account.json');
    if (fs.existsSync(tmpFile)) {
      const raw = fs.readFileSync(tmpFile, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_PERSONAL_ACCOUNT;
}

export function savePersonalAccountSettings(settings: PersonalAccountSettings): void {
  const { dataDir } = getStoragePaths();
  const writeSettings = (targetDir: string) => {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const file = path.join(targetDir, 'personal_account.json');
    fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf-8');
  };

  try {
    writeSettings(dataDir);
  } catch (err) {
    try {
      writeSettings(path.join(os.tmpdir(), '.viciss_data'));
    } catch (e) {
      console.error('Failed to save personal account settings:', e);
    }
  }
}

