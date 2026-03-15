import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

export type SecurityEventType =
  | 'validation_failed'
  | 'prototype_pollution_attempt'
  | 'redos_detected'
  | 'unauthorized_field';

export type Severity = 'low' | 'medium' | 'high';

export interface SecurityEvent {
  timestamp: string;
  event: SecurityEventType;
  severity: Severity;
  details: Record<string, unknown>;
  sessionId?: string;
}

export function auditLog(category: string, event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    category,
  };

  const logPath = join(process.cwd(), '.omc', 'audit.log');
  appendFileSync(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });
}
