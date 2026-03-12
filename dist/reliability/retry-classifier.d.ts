export declare enum OperationType {
    READ = "READ",
    IDEMPOTENT_WRITE = "IDEMPOTENT_WRITE",
    NON_IDEMPOTENT_WRITE = "NON_IDEMPOTENT_WRITE"
}
export interface OperationMetadata {
    type: OperationType;
    operation: string;
    retryable: boolean;
}
export declare class RetryClassifier {
    private static readonly NON_IDEMPOTENT_PATTERNS;
    private static readonly IDEMPOTENT_PATTERNS;
    static classify(operation: string): OperationMetadata;
    static isRetryable(operation: string): boolean;
}
//# sourceMappingURL=retry-classifier.d.ts.map