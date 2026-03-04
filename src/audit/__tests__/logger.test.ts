import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createHmac } from 'crypto';

const TEST_LOG_DIR = '.test-audit-logs';

class TestAuditLogger {
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

  private sign(entry: any): string {
    const payload = JSON.stringify(entry);
    return createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }

  async log(entry: any) {
    const fullEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    fullEntry.signature = this.sign(fullEntry);
    await fs.promises.appendFile(this.logPath, JSON.stringify(fullEntry) + '\n', 'utf8');
  }

  async verify(): Promise<{ valid: number; invalid: number }> {
    try {
      const content = await fs.promises.readFile(this.logPath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      let valid = 0, invalid = 0;

      for (const line of lines) {
        const entry = JSON.parse(line);
        const { signature, ...payload } = entry;
        const expectedSig = this.sign(payload);
        if (signature === expectedSig) valid++;
        else invalid++;
      }
      return { valid, invalid };
    } catch (err: any) {
      if (err.code === 'ENOENT') return { valid: 0, invalid: 0 };
      throw err;
    }
  }

  private ensureLogDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

describe('AuditLogger', () => {
  let logger: TestAuditLogger;

  beforeEach(() => {
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true });
    }
    logger = new TestAuditLogger(TEST_LOG_DIR);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  it('should generate valid signatures', async () => {
    await logger.log({
      actor: 'system',
      action: 'test_action',
      resource: 'test_resource',
      result: 'success'
    });

    const result = await logger.verify();
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(0);
  });

  it('should detect tampered entries', async () => {
    await logger.log({
      actor: 'system',
      action: 'test_action',
      resource: 'test_resource',
      result: 'success'
    });

    const logPath = path.join(TEST_LOG_DIR, 'audit.log');
    let content = await fs.promises.readFile(logPath, 'utf8');
    content = content.replace('test_resource', 'tampered_resource');
    await fs.promises.writeFile(logPath, content, 'utf8');

    const result = await logger.verify();
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
  });

  it('should handle multiple entries', async () => {
    await logger.log({ actor: 'user', action: 'action1', resource: 'res1', result: 'success' });
    await logger.log({ actor: 'agent', action: 'action2', resource: 'res2', result: 'failure' });
    await logger.log({ actor: 'system', action: 'action3', resource: 'res3', result: 'success' });

    const result = await logger.verify();
    expect(result.valid).toBe(3);
    expect(result.invalid).toBe(0);
  });
});
