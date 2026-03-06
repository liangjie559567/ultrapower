/**
 * Retry wrapper for MCP Client
 */

import { MCPClient } from './client.js';
import { RETRY } from '../lib/constants.js';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryMCPClient extends MCPClient {
  private retryConfig: RetryConfig;
  private connectionParams: { command: string; args: string[]; env?: Record<string, string> } | null = null;

  constructor(retryConfig?: Partial<RetryConfig>) {
    super();
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? RETRY.MAX_ATTEMPTS,
      initialDelay: retryConfig?.initialDelay ?? RETRY.INITIAL_DELAY,
      maxDelay: retryConfig?.maxDelay ?? RETRY.MAX_DELAY,
      backoffMultiplier: retryConfig?.backoffMultiplier ?? RETRY.BACKOFF_MULTIPLIER,
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  async connect(command: string, args: string[] = [], env?: Record<string, string>): Promise<void> {
    this.connectionParams = { command, args, env };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        await super.connect(command, args, env);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryConfig.maxRetries) {
          await this.sleep(this.calculateDelay(attempt));
        }
      }
    }

    throw new Error(`Failed to connect after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.listTools();
      return true;
    } catch {
      return false;
    }
  }

  async reconnect(): Promise<void> {
    if (!this.connectionParams) {
      throw new Error('No connection parameters available for reconnect');
    }
    await this.disconnect();
    await this.connect(this.connectionParams.command, this.connectionParams.args, this.connectionParams.env);
  }
}
