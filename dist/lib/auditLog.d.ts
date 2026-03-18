export type AuditEventType = 'validation_failed' | 'prototype_pollution_attempt' | 'redos_detected' | 'unauthorized_field' | 'state_cleanup';
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface AuditLogEntry {
    timestamp: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    details: Record<string, unknown>;
}
export declare function logAuditEvent(eventType: AuditEventType, severity: AuditSeverity, details: Record<string, unknown>, workingDirectory?: string): void;
//# sourceMappingURL=auditLog.d.ts.map