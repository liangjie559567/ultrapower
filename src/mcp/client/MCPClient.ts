import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private toolsCache: MCPTool[] | null = null;
  private connected = false;
  private available = true;

  constructor() {
    this.client = new Client(
      { name: 'ultrapower-client', version: '1.0.0' },
      { capabilities: {} }
    );
  }

  async connect(command: string, args: string[] = [], env?: Record<string, string>): Promise<void> {
    if (this.connected) {
      throw new Error('Client already connected');
    }

    const maxRetries = 3;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.attemptConnect(command, args, env);
        this.available = true;
        return;
      } catch (error) {
        console.error(`Connection attempt ${attempt + 1}/${maxRetries} failed:`, error);

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
      }
    }

    this.available = false;
    throw new Error('Failed to connect after 3 attempts');
  }

  private async attemptConnect(command: string, args: string[], env?: Record<string, string>): Promise<void> {
    try {
      const mergedEnv = env ? { ...process.env, ...env } : undefined;

      this.process = spawn(command, args, {
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.transport = new StdioClientTransport({
        command,
        args,
        env,
      });

      await this.client.connect(this.transport);
      this.connected = true;
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.toolsCache) return this.toolsCache;

    const response = await this.client.listTools();
    this.toolsCache = response.tools as MCPTool[];
    return this.toolsCache;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await this.client.callTool({ name, arguments: args });
    return response;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      if (this.transport) {
        await this.client.close();
        this.transport = null;
        this.toolsCache = null;
      }
      if (this.process) {
        this.process.kill();
        this.process = null;
      }
    } finally {
      this.connected = false;
    }
  }
}
