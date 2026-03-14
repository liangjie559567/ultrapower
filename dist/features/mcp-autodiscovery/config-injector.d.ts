import type { MCPServerDescriptor } from './types.js';
interface MCPConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}
export declare class ConfigInjector {
    generateConfig(server: Pick<MCPServerDescriptor, 'id' | 'name' | 'package'>): MCPConfig;
}
export {};
//# sourceMappingURL=config-injector.d.ts.map