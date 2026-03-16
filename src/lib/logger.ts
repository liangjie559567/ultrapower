import { appendFileSync, existsSync, statSync } from 'fs';
import { renameSyncWithRetry } from './fs-utils.js';
import { ensureDirSync } from './atomic-write.js';
import { join } from 'path';

const LOG_PATH = '.omc/logs/security-audit.jsonl';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SENSITIVE_FIELDS = ['token', 'apiKey', 'password', 'secret', 'accessToken', 'refreshToken', 'privateKey'];

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  const sanitized: Record<string, unknown> = { ...data as Record<string, unknown> };
  for (const key in sanitized) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
}

function rotate(logPath: string): void {
  if (!existsSync(logPath)) return;
  const stats = statSync(logPath);
  if (stats.size <= MAX_SIZE) return;

  for (let i = 6; i >= 1; i--) {
    const old = `${logPath}.${i}`;
    const next = `${logPath}.${i + 1}`;
    if (existsSync(old)) renameSyncWithRetry(old, next);
  }
  renameSyncWithRetry(logPath, `${logPath}.1`);
}

function log(level: string, message: string, meta?: Record<string, unknown>): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  });
  console.log(entry);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta)
};

export function security(event: string, data: unknown): void {
  const logPath = join(process.cwd(), LOG_PATH);
  ensureDirSync(join(process.cwd(), '.omc/logs'));
  rotate(logPath);

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    data: sanitize(data)
  }) + '\n';

  appendFileSync(logPath, entry, 'utf-8');
}
