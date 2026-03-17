import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { logAuditEvent, type AuditEventType, type AuditSeverity } from '../../src/lib/auditLog';

describe('logAuditEvent', () => {
  const testDir = join(process.cwd(), '.omc-test');
  const logPath = join(testDir, '.omc', 'audit.log');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('should write validation_failed event', () => {
    logAuditEvent('validation_failed', 'high', { field: 'test', reason: 'invalid' }, testDir);

    expect(existsSync(logPath)).toBe(true);
    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.eventType).toBe('validation_failed');
    expect(logged.severity).toBe('high');
    expect(logged.details.field).toBe('test');
  });

  it('should write prototype_pollution_attempt event', () => {
    logAuditEvent('prototype_pollution_attempt', 'critical', { field: '__proto__' }, testDir);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.eventType).toBe('prototype_pollution_attempt');
    expect(logged.severity).toBe('critical');
  });

  it('should write redos_detected event', () => {
    logAuditEvent('redos_detected', 'medium', { pattern: '<.*>', duration: 150 }, testDir);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.eventType).toBe('redos_detected');
  });

  it('should write unauthorized_field event', () => {
    logAuditEvent('unauthorized_field', 'medium', { field: 'maliciousField' }, testDir);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.eventType).toBe('unauthorized_field');
  });

  it('should include timestamp', () => {
    logAuditEvent('validation_failed', 'low', {}, testDir);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.timestamp).toBeDefined();
    expect(new Date(logged.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should append multiple events', () => {
    logAuditEvent('validation_failed', 'high', {}, testDir);
    logAuditEvent('redos_detected', 'medium', {}, testDir);

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0]).eventType).toBe('validation_failed');
    expect(JSON.parse(lines[1]).eventType).toBe('redos_detected');
  });

  it('should support all severity levels', () => {
    const severities: AuditSeverity[] = ['low', 'medium', 'high', 'critical'];

    severities.forEach(severity => {
      logAuditEvent('validation_failed', severity, { test: severity }, testDir);
    });

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(4);

    severities.forEach((severity, i) => {
      expect(JSON.parse(lines[i]).severity).toBe(severity);
    });
  });
});
