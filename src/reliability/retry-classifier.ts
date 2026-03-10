export enum OperationType {
  READ = 'READ',
  IDEMPOTENT_WRITE = 'IDEMPOTENT_WRITE',
  NON_IDEMPOTENT_WRITE = 'NON_IDEMPOTENT_WRITE',
}

export interface OperationMetadata {
  type: OperationType;
  operation: string;
  retryable: boolean;
}

export class RetryClassifier {
  private static readonly NON_IDEMPOTENT_PATTERNS = [
    /create/i,
    /insert/i,
    /append/i,
    /increment/i,
    /decrement/i,
    /push/i,
    /send/i,
    /publish/i,
  ];

  private static readonly IDEMPOTENT_PATTERNS = [
    /read/i,
    /get/i,
    /fetch/i,
    /query/i,
    /list/i,
    /update/i,
    /set/i,
    /put/i,
    /delete/i,
    /remove/i,
  ];

  static classify(operation: string): OperationMetadata {
    for (const pattern of this.NON_IDEMPOTENT_PATTERNS) {
      if (pattern.test(operation)) {
        return {
          type: OperationType.NON_IDEMPOTENT_WRITE,
          operation,
          retryable: false,
        };
      }
    }

    for (const pattern of this.IDEMPOTENT_PATTERNS) {
      if (pattern.test(operation)) {
        return {
          type: OperationType.IDEMPOTENT_WRITE,
          operation,
          retryable: true,
        };
      }
    }

    return {
      type: OperationType.NON_IDEMPOTENT_WRITE,
      operation,
      retryable: false,
    };
  }

  static isRetryable(operation: string): boolean {
    return this.classify(operation).retryable;
  }
}
