import { promises as fs } from 'fs';
import * as path from 'path';
export async function logSkip(reason, cwd) {
    const logDir = path.join(cwd, 'omc.js', 'logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, 'quality-gate-skipped.log');
    const entry = `${new Date().toISOString()} - SKIPPED: ${reason}\n`;
    await fs.appendFile(logPath, entry, 'utf8');
}
//# sourceMappingURL=audit-logger.js.map