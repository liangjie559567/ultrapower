/**
 * Retry wrapper for MCP Client
 */
import { MCPClient } from './client.js';
interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
export declare class RetryMCPClient extends MCPClient {
    private retryConfig;
    private connectionParams;
    constructor(retryConfig?: Partial<RetryConfig>);
    private sleep;
    private calculateDelay;
    connect(command: string, args?: string[], env?: Record<string, string>): Promise<void>;
    healthCheck(): Promise<boolean>;
    reconnect(): Promise<void>;
}
export {};
//# sourceMappingURL=retry-client.d.ts.map