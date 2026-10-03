import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { UserAccount, UserRole, UserPermissions, getDefaultPermissionsForRole, AuditLogEntry, LicenseInfo, SystemSecurityPolicy } from '../src/types';

// Storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'security-db.json');
const SECRET_KEY_PATH = path.join(DATA_DIR, 'master-signing.key');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
}

// Master Signing Key for HMAC Tokens & License Signatures
function getOrCreateMasterKey(): string {
  if (fs.existsSync(SECRET_KEY_PATH)) {
    try {
      const key = fs.readFileSync(SECRET_KEY_PATH, 'utf8').trim();
      if (key.length >= 32) return key;
    } catch (_) {}
  }
  const newKey = crypto.randomBytes(48).toString('hex');
  try {
    fs.writeFileSync(SECRET_KEY_PATH, newKey, { mode: 0o600 });
  } catch (_) {}
  return newKey;
}

const MASTER_KEY = getOrCreateMasterKey();

// Extended Internal User Record
export interface InternalUserAccount extends UserAccount {
  passwordHash: string;
  salt: string;
}

interface SecurityStore {
  users: InternalUserAccount[];
  license: {
    companyName: string;
    licenseKey: string;
    tier: 'ENTERPRISE_COMMERCIAL' | 'TRIAL' | 'COMMUNITY';
    expiresAt: string;
    maxNodes: number;
    activatedAt: string;
  };
  auditLogs: AuditLogEntry[];
}

// Memory Cache
let memoryStore: SecurityStore | null = null;
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();
const activeTokens = new Map<string, { userId: string; username: string; role: UserRole; expiresAt: string }>();

// Password Hashing with PBKDF2 (100,000 iterations + 16-byte random salt)
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

// Hardware Fingerprint (Node-Locking to prevent unauthorized copying/selling)
export function getHardwareFingerprint(): string {
  try {
    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model : 'Generic-CPU';
    const cpuCount = cpus ? cpus.length : 1;
    const hostname = os.hostname() || 'localhost';

    let mac = '00:00:00:00:00:00';
    const ifaces = os.networkInterfaces();
    for (const [_, addrs] of Object.entries(ifaces)) {
      if (addrs) {
        const found = addrs.find(a => !a.internal && a.mac && a.mac !== '00:00:00:00:00:00');
        if (found) {
          mac = found.mac;
          break;
        }
      }
    }

    // Also check Linux machine-id if present
    let machineId = '';
    if (fs.existsSync('/etc/machine-id')) {
      machineId = fs.readFileSync('/etc/machine-id', 'utf8').trim();
    } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
      machineId = fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
    }

    const rawString = `${cpuModel}|${cpuCount}|${mac}|${hostname}|${machineId}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex').toUpperCase();

    // Format as SPD-XXXX-XXXX-XXXX
    return `SPD-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
  } catch (_) {
    return 'SPD-71E2-B3F9-8A10';
  }
}

// Commercial License Cryptographic Signer & Verifier
export function generateSignedLicenseKey(
  targetHwId: string,
  companyName: string,
  tier: 'ENTERPRISE_COMMERCIAL' | 'TRIAL' | 'COMMUNITY',
  expiresAtIso: string,
  maxNodes = 50
): string {
  const payload = `${targetHwId.trim().toUpperCase()}|${companyName.trim()}|${tier}|${expiresAtIso}|${maxNodes}`;
  const sig = crypto.createHmac('sha256', MASTER_KEY).update(payload).digest('hex').substring(0, 16).toUpperCase();
  const base64Data = Buffer.from(payload).toString('base64');
  return `LIC-${base64Data}.${sig}`;
}

export function verifySignedLicenseKey(licenseKey: string, currentHwId: string): LicenseInfo {
  const hwId = currentHwId.toUpperCase();
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 30); // 30-day default evaluation

  if (!licenseKey || !licenseKey.startsWith('LIC-')) {
    const daysRemaining = 30;
    return {
      hardwareId: hwId,
      companyName: 'Evaluation Customer',
      licenseKey: 'NONE (Evaluation Mode)',
      status: 'TRIAL',
      tier: 'TRIAL',
      maxNodes: 10,
      issuedAt: new Date().toISOString(),
      expiresAt: fallbackDate.toISOString(),
      daysRemaining,
      features: ['Full Topology', 'Port Probes', 'Config Editor', 'Diagnostic Tools'],
      isTampered: false,
      watermarkNote: 'TRIAL EVALUATION MODE (Active on Node: ' + hwId + ')'
    };
  }

  try {
    const [header, sig] = licenseKey.replace('LIC-', '').split('.');
    if (!header || !sig) throw new Error('Malformed license structure');

    const decoded = Buffer.from(header, 'base64').toString('utf8');
    const [licHwId, company, tier, expIso, maxNodesStr] = decoded.split('|');

    // Check HMAC Signature
    const expectedSig = crypto.createHmac('sha256', MASTER_KEY).update(decoded).digest('hex').substring(0, 16).toUpperCase();
    if (sig !== expectedSig) {
      return {
        hardwareId: hwId,
        companyName: company || 'Tampered Entity',
        licenseKey,
        status: 'UNLICENSED',
        tier: 'COMMUNITY',
        maxNodes: 2,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        daysRemaining: 0,
        features: [],
        isTampered: true,
        watermarkNote: '⚠️ INVALID LICENSE SIGNATURE - SOFTWARE TAMPERING DETECTED'
      };
    }

    // Hardware ID Node Locking Check
    if (licHwId.toUpperCase() !== hwId) {
      return {
        hardwareId: hwId,
        companyName: company,
        licenseKey,
        status: 'INVALID_HARDWARE',
        tier: 'COMMUNITY',
        maxNodes: 2,
        issuedAt: new Date().toISOString(),
        expiresAt: expIso,
        daysRemaining: 0,
        features: [],
        isTampered: false,
        watermarkNote: `⚠️ LICENSE NODE MISMATCH: License issued for [${licHwId}] but server is [${hwId}]`
      };
    }

    // Expiration Check
    const expDate = new Date(expIso);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return {
        hardwareId: hwId,
        companyName: company,
        licenseKey,
        status: 'EXPIRED',
        tier: tier as any,
        maxNodes: parseInt(maxNodesStr, 10) || 50,
        issuedAt: new Date().toISOString(),
        expiresAt: expIso,
        daysRemaining: 0,
        features: [],
        isTampered: false,
        watermarkNote: '⚠️ COMMERCIAL LICENSE EXPIRED'
      };
    }

    return {
      hardwareId: hwId,
      companyName: company,
      licenseKey,
      status: 'VALID',
      tier: tier as any,
      maxNodes: parseInt(maxNodesStr, 10) || 50,
      issuedAt: new Date().toISOString(),
      expiresAt: expIso,
      daysRemaining,
      features: [
        'Enterprise High-Throughput Topology',
        'Automatic Remediation Engine (Fix.sh / Indexer-Fix)',
        'Full Conntrack Flow & Network Diagnostics',
        'Multi-Tier RBAC & Unlimited Local Users',
        'Offline Standalone Deployer',
        'Instant Port Socket Probe Engine'
      ],
      isTampered: false,
      watermarkNote: `Commercial Enterprise License Verified for ${company}`
    };
  } catch (_) {
    return {
      hardwareId: hwId,
      companyName: 'Invalid Key',
      licenseKey,
      status: 'UNLICENSED',
      tier: 'COMMUNITY',
      maxNodes: 2,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      daysRemaining: 0,
      features: [],
      isTampered: true,
      watermarkNote: '⚠️ INVALID LICENSE KEY FORMAT'
    };
  }
}

// Initial Database Seeding
function seedInitialStore(): SecurityStore {
  const now = new Date();
  const inOneYear = new Date(now);
  inOneYear.setFullYear(now.getFullYear() + 1);

  const in60Days = new Date(now);
  in60Days.setDate(now.getDate() + 60);

  const in30Days = new Date(now);
  in30Days.setDate(now.getDate() + 30);

  const in14Days = new Date(now);
  in14Days.setDate(now.getDate() + 14);

  // Default Users with cryptographically salted PBKDF2 hashes
  const adminPass = hashPassword('Splunk@Doctor2026!');
  const engineerPass = hashPassword('Splunk@Engineer2026!');
  const operatorPass = hashPassword('Splunk@Operator2026!');
  const auditorPass = hashPassword('Splunk@Auditor2026!');

  const users: InternalUserAccount[] = [
    {
      id: 'usr-admin-01',
      username: 'admin',
      fullName: 'مدیر ارشد سیستم (Super Admin)',
      email: 'admin@splunk-cluster.corp',
      role: 'super_admin',
      createdAt: now.toISOString(),
      expiresAt: inOneYear.toISOString(),
      isNeverExpires: true,
      isActive: true,
      notes: 'حساب مدیر ارشد با دسترسی کامل به تمامی ماژول‌ها و پنل مدیریت',
      permissions: getDefaultPermissionsForRole('super_admin'),
      passwordHash: adminPass.hash,
      salt: adminPass.salt
    },
    {
      id: 'usr-cluster-02',
      username: 'sec_engineer',
      fullName: 'مهندس امنیت و کلاستر (Cluster Admin)',
      email: 'sec@splunk-cluster.corp',
      role: 'cluster_admin',
      createdAt: now.toISOString(),
      expiresAt: in60Days.toISOString(),
      isNeverExpires: false,
      isActive: true,
      notes: 'دسترسی کامل به توپولوژی، کانفیگ‌ها، پورت‌ها و اسکریپت‌های تعمیر خودکار',
      permissions: getDefaultPermissionsForRole('cluster_admin'),
      passwordHash: engineerPass.hash,
      salt: engineerPass.salt
    },
    {
      id: 'usr-operator-03',
      username: 'net_operator',
      fullName: 'کارشناس عملیات شبکه (Network Operator)',
      email: 'operator@splunk-cluster.corp',
      role: 'operator',
      createdAt: now.toISOString(),
      expiresAt: in30Days.toISOString(),
      isNeverExpires: false,
      isActive: true,
      notes: 'پایش زنده ترافیک، تست پورت‌ها و پینگ، بدون امکان دستکاری یا تخریب کانفیگ‌ها',
      permissions: getDefaultPermissionsForRole('operator'),
      passwordHash: operatorPass.hash,
      salt: operatorPass.salt
    },
    {
      id: 'usr-auditor-04',
      username: 'compliance_auditor',
      fullName: 'ناظر و بازرس امنیتی (Security Auditor)',
      email: 'audit@splunk-cluster.corp',
      role: 'auditor',
      createdAt: now.toISOString(),
      expiresAt: in14Days.toISOString(),
      isNeverExpires: false,
      isActive: true,
      notes: 'دسترسی فقط‌خواندنی به لاگ‌ها، گزارش‌های سلامت و دایاگرام پورت‌ها',
      permissions: getDefaultPermissionsForRole('auditor'),
      passwordHash: auditorPass.hash,
      salt: auditorPass.salt
    }
  ];

  const hwId = getHardwareFingerprint();
  // Auto-generate a valid initial commercial trial license for this specific hardware ID
  const trialExp = new Date(now);
  trialExp.setDate(now.getDate() + 90);
  const initialKey = generateSignedLicenseKey(hwId, 'Splunk Enterprise Customer', 'ENTERPRISE_COMMERCIAL', trialExp.toISOString(), 100);

  const initialLogs: AuditLogEntry[] = [
    {
      id: 'log-seed-01',
      timestamp: now.toISOString(),
      username: 'SYSTEM',
      action: 'INITIAL_SECURITY_INITIALIZATION',
      category: 'SECURITY',
      status: 'SUCCESS',
      ip: '127.0.0.1',
      details: `سیستم امنیتی، پایگاه داده کاربران و کلید سخت‌افزاری (${hwId}) با موفقیت مقداردهی شد.`
    },
    {
      id: 'log-seed-02',
      timestamp: now.toISOString(),
      username: 'SYSTEM',
      action: 'COMMERCIAL_LICENSE_BINDING',
      category: 'LICENSE',
      status: 'SUCCESS',
      ip: '127.0.0.1',
      details: `لایسنس تجاری روی اثرانگشت سخت‌افزاری ${hwId} قفل و فعال شد.`
    }
  ];

  return {
    users,
    license: {
      companyName: 'Splunk Enterprise Customer',
      licenseKey: initialKey,
      tier: 'ENTERPRISE_COMMERCIAL',
      expiresAt: trialExp.toISOString(),
      maxNodes: 100,
      activatedAt: now.toISOString()
    },
    auditLogs: initialLogs
  };
}

// Load and Save Database
export function getSecurityStore(): SecurityStore {
  if (memoryStore) return memoryStore;

  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      memoryStore = JSON.parse(data);
      if (memoryStore && Array.isArray(memoryStore.users)) {
        let changed = false;
        for (const u of memoryStore.users) {
          if (!u.permissions) {
            u.permissions = getDefaultPermissionsForRole(u.role);
            changed = true;
          }
        }
        if (changed) saveSecurityStore();
        return memoryStore;
      }
    } catch (_) {}
  }

  memoryStore = seedInitialStore();
  saveSecurityStore();
  return memoryStore;
}

export function saveSecurityStore(): void {
  if (!memoryStore) return;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (_) {}
}

// Audit Logging
export function logAuditEvent(
  category: AuditLogEntry['category'],
  action: string,
  status: AuditLogEntry['status'],
  username: string,
  ip: string,
  details: string
): void {
  const store = getSecurityStore();
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    username: username || 'ANONYMOUS',
    category,
    action,
    status,
    ip: ip || 'unknown',
    details
  };

  store.auditLogs.unshift(entry);
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }
  saveSecurityStore();
}

// Rate Limiting & Brute Force Lockout
export function checkRateLimit(ip: string, username: string): { locked: boolean; remainingSec: number } {
  const key = `${ip}:${username.toLowerCase()}`;
  const now = Date.now();
  const record = failedAttemptsMap.get(key);

  if (record && record.lockedUntil > now) {
    return {
      locked: true,
      remainingSec: Math.ceil((record.lockedUntil - now) / 1000)
    };
  }

  return { locked: false, remainingSec: 0 };
}

export function recordFailedLogin(ip: string, username: string): { locked: boolean; count: number } {
  const key = `${ip}:${username.toLowerCase()}`;
  const now = Date.now();
  const record = failedAttemptsMap.get(key) || { count: 0, lockedUntil: 0 };

  record.count += 1;
  let locked = false;

  // If 5 failed attempts within 15 minutes, lock for 15 minutes
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000;
    locked = true;
    logAuditEvent(
      'SECURITY',
      'BRUTE_FORCE_LOCKOUT',
      'DENIED',
      username,
      ip,
      `حساب و آدرس IP به دلیل ۵ مرتبه تلاش ناموفق پیاپی به مدت ۱۵ دقیقه مسدود شد.`
    );
  }

  failedAttemptsMap.set(key, record);
  return { locked, count: record.count };
}

export function resetFailedLogin(ip: string, username: string): void {
  const key = `${ip}:${username.toLowerCase()}`;
  failedAttemptsMap.delete(key);
}

// Session Tokens (HMAC-SHA256 Bearer Token)
export function generateSessionToken(user: UserAccount): string {
  const now = Date.now();
  const expTime = now + 24 * 60 * 60 * 1000; // 24 hours token lifespan

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: new Date(expTime).toISOString(),
    iat: now
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', MASTER_KEY).update(payloadBase64).digest('base64url');
  const token = `SPD.${payloadBase64}.${signature}`;

  activeTokens.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: new Date(expTime).toISOString()
  });

  return token;
}

export function verifySessionToken(token: string): { user: UserAccount; isExpiredAccount: boolean } | null {
  if (!token || !token.startsWith('SPD.')) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [prefix, payloadBase64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', MASTER_KEY).update(payloadBase64).digest('base64url');
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (Date.now() > new Date(payload.expiresAt).getTime()) {
      activeTokens.delete(token);
      return null;
    }

    const store = getSecurityStore();
    const user = store.users.find(u => u.id === payload.userId);
    if (!user || !user.isActive) return null;

    // Check if the user's specific expiration date has passed!
    const isExpiredAccount = !user.isNeverExpires && new Date(user.expiresAt) < new Date();

    // Strip passwordHash and salt before returning
    const safeUser: UserAccount = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      expiresAt: user.expiresAt,
      isNeverExpires: user.isNeverExpires,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      notes: user.notes,
      permissions: user.permissions || getDefaultPermissionsForRole(user.role)
    };

    return { user: safeUser, isExpiredAccount };
  } catch (_) {
    return null;
  }
}

export function revokeSessionToken(token: string): void {
  activeTokens.delete(token);
}

// Strict Host & Input Sanitizer (Prevents Remote Command Injection & Extracts Clean Hosts)
export function sanitizeHostTarget(rawTarget: string): string {
  if (!rawTarget || typeof rawTarget !== 'string') return '127.0.0.1';
  let cleaned = String(rawTarget).trim();

  // If multiple hosts listed (separated by comma, semicolon, space), pick the first one
  const commaIdx = cleaned.search(/[,;\s]/);
  if (commaIdx !== -1) {
    cleaned = cleaned.substring(0, commaIdx).trim();
  }

  // Strip protocol scheme if present (e.g., http://, https://, tcp://, udp://, splunktcp://, ssl://, tls://)
  cleaned = cleaned.replace(/^[a-zA-Z0-9+-]+:\/\//i, '');

  // Strip path or query parameters (e.g., /services or ?foo=bar)
  const slashIdx = cleaned.indexOf('/');
  if (slashIdx !== -1) {
    cleaned = cleaned.substring(0, slashIdx);
  }

  // Handle IPv6 bracket notation [::1]:8089 or IPv4 host:port
  if (cleaned.startsWith('[') && cleaned.includes(']')) {
    const bracketEnd = cleaned.indexOf(']');
    cleaned = cleaned.substring(1, bracketEnd);
  } else if (cleaned.includes(':') && !cleaned.includes('::')) {
    // Has single colon indicating host:port
    const colonIdx = cleaned.lastIndexOf(':');
    cleaned = cleaned.substring(0, colonIdx);
  }

  // Remove any dangerous shell metacharacters entirely
  cleaned = cleaned.replace(/[;&|`$()<>\n\r\\"'\s]/g, '');

  cleaned = cleaned.trim();
  if (!cleaned) return '127.0.0.1';

  // Validate hostname or IP address characters
  const validHostRegex = /^([a-zA-Z0-9]|[a-zA-Z0-9][-a-zA-Z0-9._]*[a-zA-Z0-9])$/;
  if (!validHostRegex.test(cleaned) || cleaned.length > 255) {
    // Safe fallback if hostname contains unusual characters
    const fallback = cleaned.replace(/[^a-zA-Z0-9.-]/g, '');
    return fallback && fallback.length <= 255 ? fallback : '127.0.0.1';
  }

  return cleaned;
}

// Security Policy Report
export function getSecurityPolicyStatus(): SystemSecurityPolicy {
  const store = getSecurityStore();
  const past24h = Date.now() - 24 * 60 * 60 * 1000;
  const failedLogins = store.auditLogs.filter(
    l => l.category === 'AUTH' && l.status === 'FAILED' && new Date(l.timestamp).getTime() > past24h
  ).length;

  let lockedIps = 0;
  for (const [_, record] of failedAttemptsMap.entries()) {
    if (record.lockedUntil > Date.now()) lockedIps++;
  }

  return {
    rateLimiterActive: true,
    commandInjectionFirewall: true,
    pbkdf2HashingRounds: 100000,
    activeSessionsCount: activeTokens.size,
    lockedIpsCount: lockedIps,
    failedLoginsPast24h: failedLogins,
    hardwareLockEnabled: true,
    enforceHttpsWarning: process.env.NODE_ENV === 'production'
  };
}
