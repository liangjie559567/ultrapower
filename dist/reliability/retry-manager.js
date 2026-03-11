import { RetryClassifier } from './retry-classifier.js';
export class RetryManager {
    maxRetries;
    baseDelay;
    operation;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 1000;
        this.operation = options.operation;
    }
    async execute(fn) {
        if (this.operation && !RetryClassifier.isRetryable(this.operation)) {
            try {
                const result = await fn();
                return { success: true, result, attempts: 1 };
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                return { success: false, error: err, attempts: 1 };
            }
        }
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await fn();
                console.log(`[RetryManager] Success on attempt ${attempt + 1}`);
                return { success: true, result, attempts: attempt + 1 };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.log(`[RetryManager] Attempt ${attempt + 1} failed: ${lastError.message}`);
                if (attempt < this.maxRetries) {
                    const delay = this.baseDelay * Math.pow(2, attempt);
                    console.log(`[RetryManager] Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        return { success: false, error: lastError, attempts: this.maxRetries + 1 };
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=retry-manager.js.map