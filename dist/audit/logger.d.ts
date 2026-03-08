interface AuditEntry {
    timestamp: string;
    actor: string;
    action: string;
    resource: string;
    result: 'success' | 'failure';
    metadata?: Record<string, unknown>;
    signature?: string;
}
declare class AuditLogger {
    private logPath;
    private secretKey;
    private maxSize;
    constructor(logDir: string);
    private deriveSecretKey;
    private sign;
    log(entry: Omit<AuditEntry, 'timestamp' | 'signature'>): Promise<void>;
    private appendLog;
    private rotateIfNeeded;
    verify(): Promise<{
        valid: number;
        invalid: number;
    }>;
    private ensureLogDir;
}
export declare const auditLogger: {
    readonly instance: AuditLogger;
    log(entry: Omit<AuditEntry, "timestamp" | "signature">): Promise<void>;
    verify(): Promise<{
        valid: number;
        invalid: number;
    }>;
};
export {};
//# sourceMappingURL=logger.d.ts.map