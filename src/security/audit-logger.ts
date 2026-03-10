import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface AuditEvent {
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  previousHash?: string;
  hash?: string;
}

export class AuditLogger {
  private logPath: string;
  private events: AuditEvent[] = [];

  constructor(logPath: string = '.omc/logs/audit.json') {
    this.logPath = path.resolve(logPath);
    this.load();
  }

  log(event: Omit<AuditEvent, 'timestamp' | 'hash' | 'previousHash'>): void {
    const previousHash = this.events.length > 0 ? this.events[this.events.length - 1].hash : undefined;
    const newEvent: AuditEvent = {
      ...event,
      timestamp: Date.now(),
      previousHash,
    };
    newEvent.hash = this.computeHash(newEvent);
    this.events.push(newEvent);
    this.save();
  }

  query(filters: Partial<Omit<AuditEvent, 'hash' | 'previousHash'>>): AuditEvent[] {
    return this.events.filter(event => {
      return Object.entries(filters).every(([key, value]) => event[key as keyof AuditEvent] === value);
    });
  }

  verify(): boolean {
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const expectedHash = this.computeHash(event);
      if (event.hash !== expectedHash) return false;
      if (i > 0 && event.previousHash !== this.events[i - 1].hash) return false;
    }
    return true;
  }

  private computeHash(event: AuditEvent): string {
    const data = `${event.timestamp}:${event.userId}:${event.action}:${event.resource}:${event.result}:${event.previousHash || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private load(): void {
    if (fs.existsSync(this.logPath)) {
      this.events = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
    }
  }

  private save(): void {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.logPath, JSON.stringify(this.events, null, 2));
  }
}
