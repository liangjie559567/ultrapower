import type { MCPServerDescriptor } from './types.js';

interface MCPConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class ConfigInjector {
  generateConfig(server: Pick<MCPServerDescriptor, 'id' | 'name' | 'package'>): MCPConfig {
    if (!server.package) {
      throw new Error('Package info required');
    }

    if (server.package.type === 'uvx') {
      return {
        command: 'uvx',
        args: [server.package.name]
      };
    }

    if (server.package.type === 'npm') {
      return {
        command: 'node',
        args: [server.package.name]
      };
    }

    return {
      command: 'docker',
      args: ['run', server.package.name]
    };
  }
}
