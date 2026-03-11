import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
export class MCPClient {
    client;
    transport = null;
    toolsCache = null;
    connected = false;
    available = true;
    constructor() {
        this.client = new Client({ name: 'ultrapower-client', version: '1.0.0' }, { capabilities: {} });
    }
    async connect(command, args = [], env) {
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
            }
            catch (error) {
                console.error(`Connection attempt ${attempt + 1}/${maxRetries} failed:`, error);
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
                }
            }
        }
        this.available = false;
        throw new Error('Failed to connect after 3 attempts');
    }
    async attemptConnect(command, args, env) {
        try {
            this.transport = new StdioClientTransport({
                command,
                args,
                env,
            });
            await this.client.connect(this.transport);
            this.connected = true;
        }
        catch (error) {
            await this.disconnect();
            throw error;
        }
    }
    isAvailable() {
        return this.available;
    }
    async listTools() {
        if (this.toolsCache)
            return this.toolsCache;
        const response = await this.client.listTools();
        this.toolsCache = response.tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
        }));
        return this.toolsCache;
    }
    async callTool(name, args) {
        const response = await this.client.callTool({ name, arguments: args });
        return response;
    }
    async disconnect() {
        if (!this.connected)
            return;
        try {
            if (this.transport) {
                await this.client.close();
                const proc = this.transport._process;
                if (proc && !proc.killed) {
                    proc.kill('SIGTERM');
                    await Promise.race([
                        new Promise(resolve => proc.once('exit', () => resolve())),
                        new Promise(resolve => setTimeout(() => {
                            if (!proc.killed)
                                proc.kill('SIGKILL');
                            resolve(undefined);
                        }, 5000))
                    ]);
                }
                this.transport = null;
                this.toolsCache = null;
            }
        }
        finally {
            this.connected = false;
        }
    }
}
//# sourceMappingURL=MCPClient.js.map