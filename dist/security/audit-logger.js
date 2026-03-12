import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
export class AuditLogger {
    logPath;
    events = [];
    constructor(logPath = '.omc/logs/audit.json') {
        this.logPath = path.resolve(logPath);
        this.load();
    }
    log(event) {
        const previousHash = this.events.length > 0 ? this.events[this.events.length - 1].hash : undefined;
        const newEvent = {
            ...event,
            timestamp: Date.now(),
            previousHash,
        };
        newEvent.hash = this.computeHash(newEvent);
        this.events.push(newEvent);
        this.save();
    }
    query(filters) {
        return this.events.filter(event => {
            return Object.entries(filters).every(([key, value]) => event[key] === value);
        });
    }
    verify() {
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            const expectedHash = this.computeHash(event);
            if (event.hash !== expectedHash)
                return false;
            if (i > 0 && event.previousHash !== this.events[i - 1].hash)
                return false;
        }
        return true;
    }
    computeHash(event) {
        const data = `${event.timestamp}:${event.userId}:${event.action}:${event.resource}:${event.result}:${event.previousHash || ''}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    load() {
        // eslint-disable-next-line no-restricted-syntax
        if (fs.existsSync(this.logPath)) {
            // eslint-disable-next-line no-restricted-syntax
            this.events = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
        }
    }
    save() {
        const dir = path.dirname(this.logPath);
        // eslint-disable-next-line no-restricted-syntax
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        // eslint-disable-next-line no-restricted-syntax
        fs.writeFileSync(this.logPath, JSON.stringify(this.events, null, 2));
    }
}
//# sourceMappingURL=audit-logger.js.map