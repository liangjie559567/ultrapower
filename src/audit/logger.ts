import { createHmac } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { safeJsonParse } from '../lib/safe-json.js';

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata?: any;
  signature?: string;
}

class AuditLogger {
  private logPath: string;
  private secretKey: Buffer;
  private maxSize = 10 * 1024 * 1024;

  constructor(logDir: string) {
    this.logPath = path.join(logDir, 'audit.log');
    this.secretKey = this.deriveSecretKey();
    this.ensureLogDir(logDir);
  }

  private deriveSecretKey(): Buffer {
    const seed = process.env.OMC_AUDIT_SECRET || 'default-seed';
    return Buffer.from(createHmac('sha256', 'omc-audit').update(seed).digest('hex'));
  }

  private sign(entry: Omit<AuditEntry, 'signature'>): string {
    const payload = JSON.stringify(entry);
    return createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }

  async log(entry: Omit<AuditEntry, 'timestamp' | 'signature'>) {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    fullEntry.signature = this.sign(fullEntry);

    await this.appendLog(JSON.stringify(fullEntry) + '\n');
    await this.rotateIfNeeded();
  }

  private async appendLog(line: string) {
    await fs.promises.appendFile(this.logPath, line, 'utf8');
  }

  private async rotateIfNeeded() {
    try {
      const stats = await fs.promises.stat(this.logPath);
      if (stats.size >= this.maxSize) {
        const rotatedPath = `${this.logPath}.${Date.now()}`;
        await fs.promises.rename(this.logPath, rotatedPath);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
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
    } catch (err: any) {
      if (err.code === 'ENOENT') return { valid: 0, invalid: 0 };
      throw err;
    }
  }

  private ensureLogDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export const auditLogger = new AuditLogger('.omc/logs');
