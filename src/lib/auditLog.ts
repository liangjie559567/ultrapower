import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type AuditEventType =
  | 'validation_failed'
  | 'prototype_pollution_attempt'
  | 'redos_detected'
  | 'unauthorized_field';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  details: Record<string, unknown>;
}

export function logAuditEvent(
  eventType: AuditEventType,
  severity: AuditSeverity,
  details: Record<string, unknown>,
  workingDirectory?: string
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    details
  };

  const logDir = join(workingDirectory || process.cwd(), '.omc');
  const logPath = join(logDir, 'audit.log');

  mkdirSync(logDir, { recursive: true });
  appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}
