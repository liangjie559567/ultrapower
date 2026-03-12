import * as fs from 'fs';
import * as path from 'path';

export function logSkip(reason: string, cwd: string): void {
  const logDir = path.join(cwd, 'omc.js', 'logs');
  fs.mkdirSync(logDir, { recursive: true });

  const logPath = path.join(logDir, 'quality-gate-skipped.log');
  const entry = `${new Date().toISOString()} - SKIPPED: ${reason}\n`;

  fs.appendFileSync(logPath, entry, 'utf8');
}
