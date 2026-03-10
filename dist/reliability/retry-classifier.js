export var OperationType;
(function (OperationType) {
    OperationType["READ"] = "READ";
    OperationType["IDEMPOTENT_WRITE"] = "IDEMPOTENT_WRITE";
    OperationType["NON_IDEMPOTENT_WRITE"] = "NON_IDEMPOTENT_WRITE";
})(OperationType || (OperationType = {}));
export class RetryClassifier {
    static NON_IDEMPOTENT_PATTERNS = [
        /create/i,
        /insert/i,
        /append/i,
        /increment/i,
        /decrement/i,
        /push/i,
        /send/i,
        /publish/i,
    ];
    static IDEMPOTENT_PATTERNS = [
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
    static classify(operation) {
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
    static isRetryable(operation) {
        return this.classify(operation).retryable;
    }
}
//# sourceMappingURL=retry-classifier.js.map