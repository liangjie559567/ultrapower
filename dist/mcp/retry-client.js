/**
 * Retry wrapper for MCP Client
 */
import { MCPClient } from './client.js';
import { RETRY } from '../lib/constants.js';
export class RetryMCPClient extends MCPClient {
    retryConfig;
    connectionParams = null;
    constructor(retryConfig) {
        super();
        this.retryConfig = {
            maxRetries: retryConfig?.maxRetries ?? RETRY.MAX_ATTEMPTS,
            initialDelay: retryConfig?.initialDelay ?? RETRY.INITIAL_DELAY,
            maxDelay: retryConfig?.maxDelay ?? RETRY.MAX_DELAY,
            backoffMultiplier: retryConfig?.backoffMultiplier ?? RETRY.BACKOFF_MULTIPLIER,
        };
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    calculateDelay(attempt) {
        const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
        return Math.min(delay, this.retryConfig.maxDelay);
    }
    async connect(command, args = [], env) {
        this.connectionParams = { command, args, env };
        let lastError = null;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                await super.connect(command, args, env);
                return;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retryConfig.maxRetries) {
                    await this.sleep(this.calculateDelay(attempt));
                }
            }
        }
        throw new Error(`Failed to connect after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
    }
    async healthCheck() {
        try {
            await this.listTools();
            return true;
        }
        catch {
            return false;
        }
    }
    async reconnect() {
        if (!this.connectionParams) {
            throw new Error('No connection parameters available for reconnect');
        }
        await this.disconnect();
        await this.connect(this.connectionParams.command, this.connectionParams.args, this.connectionParams.env);
    }
}
//# sourceMappingURL=retry-client.js.map