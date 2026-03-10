import { appendFileSync, existsSync, statSync, renameSync } from 'fs';
import { ensureDirSync } from './atomic-write.js';
import { join } from 'path';

const LOG_PATH = '.omc/logs/security-audit.jsonl';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SENSITIVE_FIELDS = ['token', 'apiKey', 'password', 'secret', 'accessToken', 'refreshToken', 'privateKey'];

function sanitize(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
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
    if (existsSync(old)) renameSync(old, next);
  }
  renameSync(logPath, `${logPath}.1`);
}

export function security(event: string, data: any): void {
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
