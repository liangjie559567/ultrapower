import { createHmac } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { safeJsonParse } from '../lib/safe-json.js';
import { SIZE_LIMIT } from '../lib/constants.js';
class AuditLogger {
    logPath;
    secretKey;
    maxSize = SIZE_LIMIT.AUDIT_LOG_MAX;
    constructor(logDir) {
        this.logPath = path.join(logDir, 'audit.log');
        this.secretKey = this.deriveSecretKey();
        this.ensureLogDir(logDir);
    }
    deriveSecretKey() {
        const seed = process.env.OMC_AUDIT_SECRET;
        if (!seed) {
            return null;
        }
        return Buffer.from(createHmac('sha256', 'omc-audit').update(seed).digest('hex'));
    }
    sign(entry) {
        if (!this.secretKey)
            return '';
        const payload = JSON.stringify(entry);
        return createHmac('sha256', this.secretKey).update(payload).digest('hex');
    }
    log(entry) {
        if (!this.secretKey)
            return Promise.resolve();
        const fullEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };
        fullEntry.signature = this.sign(fullEntry);
        this.appendLog(JSON.stringify(fullEntry) + '\n');
        this.rotateIfNeeded();
        return Promise.resolve();
    }
    appendLog(line) {
        fs.appendFileSync(this.logPath, line, 'utf8');
    }
    rotateIfNeeded() {
        try {
            const stats = fs.statSync(this.logPath);
            if (stats.size >= this.maxSize) {
                const rotatedPath = `${this.logPath}.${Date.now()}`;
                fs.renameSync(this.logPath, rotatedPath);
            }
        }
        catch (err) {
            if (err.code !== 'ENOENT')
                throw err;
        }
    }
    async verify() {
        try {
            const content = await fs.promises.readFile(this.logPath, 'utf8');
            const lines = content.split('\n').filter(Boolean);
            let valid = 0, invalid = 0;
            for (const line of lines) {
                const result = safeJsonParse(line);
                if (!result.success) {
                    invalid++;
                    console.error(`[audit] Failed to parse entry: ${result.error}`);
                    continue;
                }
                const entry = result.data;
                const { signature, ...payload } = entry;
                const expectedSig = this.sign(payload);
                if (signature === expectedSig) {
                    valid++;
                }
                else {
                    invalid++;
                    console.error(`[audit] Invalid signature at ${entry.timestamp}`);
                }
            }
            return { valid, invalid };
        }
        catch (err) {
            if (err.code === 'ENOENT')
                return { valid: 0, invalid: 0 };
            throw err;
        }
    }
    ensureLogDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
let _auditLogger = null;
export const auditLogger = {
    get instance() {
        if (!_auditLogger) {
            _auditLogger = new AuditLogger('.omc/logs');
        }
        return _auditLogger;
    },
    log(entry) {
        return this.instance.log(entry);
    },
    async verify() {
        return this.instance.verify();
    }
};
//# sourceMappingURL=logger.js.map