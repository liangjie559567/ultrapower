import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditLogger } from '../../src/security/audit-logger';
import fs from 'fs';
import path from 'path';

describe('AuditLogger', () => {
  const testLogPath = path.resolve('.omc/logs/test-audit.json');
  let logger: AuditLogger;

  beforeEach(() => {
    if (fs.existsSync(testLogPath)) fs.unlinkSync(testLogPath);
    logger = new AuditLogger(testLogPath);
  });

  afterEach(() => {
    if (fs.existsSync(testLogPath)) fs.unlinkSync(testLogPath);
  });

  it('should log audit events', () => {
    logger.log({ userId: 'user1', action: 'create', resource: 'file.txt', result: 'success' });
    const events = logger.query({ userId: 'user1' });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('create');
  });

  it('should detect tampering', () => {
    logger.log({ userId: 'user1', action: 'create', resource: 'file.txt', result: 'success' });
    logger.log({ userId: 'user2', action: 'delete', resource: 'file.txt', result: 'success' });
    expect(logger.verify()).toBe(true);

    const logData = JSON.parse(fs.readFileSync(testLogPath, 'utf-8'));
    logData[0].action = 'modified';
    fs.writeFileSync(testLogPath, JSON.stringify(logData));

    const tamperedLogger = new AuditLogger(testLogPath);
    expect(tamperedLogger.verify()).toBe(false);
  });

  it('should query with filters', () => {
    logger.log({ userId: 'user1', action: 'create', resource: 'file.txt', result: 'success' });
    logger.log({ userId: 'user2', action: 'delete', resource: 'file.txt', result: 'failure' });
    logger.log({ userId: 'user1', action: 'update', resource: 'file.txt', result: 'success' });

    expect(logger.query({ userId: 'user1' })).toHaveLength(2);
    expect(logger.query({ result: 'failure' })).toHaveLength(1);
    expect(logger.query({ action: 'create', userId: 'user1' })).toHaveLength(1);
  });
});
