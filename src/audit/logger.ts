import { createHmac } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { safeJsonParse } from '../lib/safe-json.js';
import { SIZE_LIMIT } from '../lib/constants.js';

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  signature?: string;
}

class AuditLogger {
  private logPath: string;
  private secretKey: Buffer | null;
  private maxSize = SIZE_LIMIT.AUDIT_LOG_MAX;

  constructor(logDir: string) {
    this.logPath = path.join(logDir, 'audit.log');
    this.secretKey = this.deriveSecretKey();
    this.ensureLogDir(logDir);
  }

  private deriveSecretKey(): Buffer | null {
    const seed = process.env.OMC_AUDIT_SECRET;
    if (!seed) {
      return null;
    }
    return Buffer.from(createHmac('sha256', 'omc-audit').update(seed).digest('hex'));
  }

  private sign(entry: Omit<AuditEntry, 'signature'>): string {
    if (!this.secretKey) return '';
    const payload = JSON.stringify(entry);
    return createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }

  log(entry: Omit<AuditEntry, 'timestamp' | 'signature'>): Promise<void> {
    if (!this.secretKey) return Promise.resolve();
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    fullEntry.signature = this.sign(fullEntry);

    this.appendLog(JSON.stringify(fullEntry) + '\n');
    this.rotateIfNeeded();
    return Promise.resolve();
  }

  private appendLog(line: string) {
    fs.appendFileSync(this.logPath, line, 'utf8');
  }

  private rotateIfNeeded() {
    try {
      const stats = fs.statSync(this.logPath);
      if (stats.size >= this.maxSize) {
        const rotatedPath = `${this.logPath}.${Date.now()}`;
        fs.renameSync(this.logPath, rotatedPath);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async verify(): Promise<{ valid: number; invalid: number }> {
    try {
      const content = await fs.promises.readFile(this.logPath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      let valid = 0, invalid = 0;

      for (const line of lines) {
        const result = safeJsonParse<AuditEntry>(line);
        if (!result.success) {
          invalid++;
          console.error(`[audit] Failed to parse entry: ${result.error}`);
          continue;
        }
        const entry = result.data!;
        const { signature, ...payload } = entry;
        const expectedSig = this.sign(payload);

        if (signature === expectedSig) {
          valid++;
        } else {
          invalid++;
          console.error(`[audit] Invalid signature at ${entry.timestamp}`);
        }
      }

      return { valid, invalid };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { valid: 0, invalid: 0 };
      throw err;
    }
  }

  private ensureLogDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

let _auditLogger: AuditLogger | null = null;

export const auditLogger = {
  get instance(): AuditLogger {
    if (!_auditLogger) {
      _auditLogger = new AuditLogger('.omc/logs');
    }
    return _auditLogger;
  },
  log(entry: Omit<AuditEntry, 'timestamp' | 'signature'>) {
    return this.instance.log(entry);
  },
  async verify() {
    return this.instance.verify();
  }
};
