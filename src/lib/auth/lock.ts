import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface LockConfig {
  username: string;
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const LOCK_FILE = path.join(DATA_DIR, 'viciss_lock.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function getLockConfig(): LockConfig {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Check if lock file exists
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
      if (data && data.username && data.passwordHash && data.salt) {
        return data;
      }
    } catch {
      // Fallback
    }
  }

  // Default initial credentials: username "admin", password "2030"
  // (User can also provide OWNER_USERNAME / OWNER_PASSWORD in env)
  const defaultUser = process.env.OWNER_USERNAME || 'admin';
  const defaultPass = process.env.OWNER_PASSWORD || '2030';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(defaultPass, salt);

  const initialConfig: LockConfig = {
    username: defaultUser,
    passwordHash,
    salt,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial lock config:', err);
  }

  return initialConfig;
}

export function saveLockConfig(username: string, newPassword: string): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);

  const config: LockConfig = {
    username: username.trim(),
    passwordHash,
    salt,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(LOCK_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function verifyLockCredentials(usernameInput: string, passwordInput: string): boolean {
  const config = getLockConfig();

  const userClean = usernameInput.trim().toLowerCase();
  const configUser = config.username.trim().toLowerCase();

  // Allow either configured username, or "admin", or "owner", or matching email
  const matchesUser =
    userClean === configUser ||
    (configUser === 'admin' && (userClean === 'owner' || userClean === 'viciss')) ||
    (userClean.includes('@') && configUser.includes('@') && userClean === configUser);

  if (!matchesUser) {
    return false;
  }

  const computedHash = hashPassword(passwordInput, config.salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(config.passwordHash, 'hex'));
}

export function getOwnerUsername(): string {
  const config = getLockConfig();
  return config.username;
}
