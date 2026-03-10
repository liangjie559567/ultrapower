import { RetryClassifier } from './retry-classifier.js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  operation?: string;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
}

export class RetryManager {
  private maxRetries: number;
  private baseDelay: number;
  private operation?: string;

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 1000;
    this.operation = options.operation;
  }

  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    if (this.operation && !RetryClassifier.isRetryable(this.operation)) {
      try {
        const result = await fn();
        return { success: true, result, attempts: 1 };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { success: false, error: err, attempts: 1 };
      }
    }
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn();
        console.log(`[RetryManager] Success on attempt ${attempt + 1}`);
        return { success: true, result, attempts: attempt + 1 };
      } catch (error) {
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
