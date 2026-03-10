export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    state = CircuitState.CLOSED;
    failureCount = 0;
    failureThreshold;
    resetTimeout;
    nextAttempt = 0;
    constructor(config = {}) {
        this.failureThreshold = config.failureThreshold ?? 5;
        this.resetTimeout = config.resetTimeout ?? 60000;
    }
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = CircuitState.HALF_OPEN;
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
        }
    }
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.nextAttempt = 0;
    }
}
//# sourceMappingURL=circuit-breaker.js.map