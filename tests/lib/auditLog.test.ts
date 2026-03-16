import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { auditLog, type SecurityEvent } from '../../src/lib/auditLog';

describe('auditLog', () => {
  const logPath = join(process.cwd(), '.omc', 'audit.log');

  beforeEach(() => {
    if (existsSync(logPath)) {
      rmSync(logPath);
    }
    mkdirSync(join(process.cwd(), '.omc'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(logPath)) {
      rmSync(logPath);
    }
  });

  it('should write validation_failed event', () => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'validation_failed',
      severity: 'high',
      details: { field: 'test', reason: 'invalid' },
    };

    auditLog('security', event);

    expect(existsSync(logPath)).toBe(true);
    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.event).toBe('validation_failed');
    expect(logged.category).toBe('security');
  });

  it('should write prototype_pollution_attempt event', () => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'prototype_pollution_attempt',
      severity: 'high',
      details: { field: '__proto__' },
    };

    auditLog('security', event);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.event).toBe('prototype_pollution_attempt');
  });

  it('should write redos_detected event', () => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'redos_detected',
      severity: 'medium',
      details: { pattern: '<.*>', duration: 150 },
    };

    auditLog('security', event);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.event).toBe('redos_detected');
  });

  it('should write unauthorized_field event', () => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'unauthorized_field',
      severity: 'medium',
      details: { field: 'maliciousField' },
    };

    auditLog('security', event);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.event).toBe('unauthorized_field');
  });

  it('should include sessionId when provided', () => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event: 'validation_failed',
      severity: 'low',
      details: {},
      sessionId: 'test-session-123',
    };

    auditLog('security', event);

    const content = readFileSync(logPath, 'utf-8');
    const logged = JSON.parse(content.trim());
    expect(logged.sessionId).toBe('test-session-123');
  });

  it('should append multiple events', () => {
    auditLog('security', {
      timestamp: new Date().toISOString(),
      event: 'validation_failed',
      severity: 'high',
      details: {},
    });

    auditLog('security', {
      timestamp: new Date().toISOString(),
      event: 'redos_detected',
      severity: 'medium',
      details: {},
    });

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0]).event).toBe('validation_failed');
    expect(JSON.parse(lines[1]).event).toBe('redos_detected');
  });
});
