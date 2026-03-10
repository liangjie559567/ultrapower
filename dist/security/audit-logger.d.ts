export interface AuditEvent {
    timestamp: number;
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure';
    previousHash?: string;
    hash?: string;
}
export declare class AuditLogger {
    private logPath;
    private events;
    constructor(logPath?: string);
    log(event: Omit<AuditEvent, 'timestamp' | 'hash' | 'previousHash'>): void;
    query(filters: Partial<Omit<AuditEvent, 'hash' | 'previousHash'>>): AuditEvent[];
    verify(): boolean;
    private computeHash;
    private load;
    private save;
}
//# sourceMappingURL=audit-logger.d.ts.map