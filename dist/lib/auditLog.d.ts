export type SecurityEventType = 'validation_failed' | 'prototype_pollution_attempt' | 'redos_detected' | 'unauthorized_field';
export type Severity = 'low' | 'medium' | 'high';
export interface SecurityEvent {
    timestamp: string;
    event: SecurityEventType;
    severity: Severity;
    details: any;
    sessionId?: string;
}
export declare function auditLog(category: string, event: SecurityEvent): void;
//# sourceMappingURL=auditLog.d.ts.map