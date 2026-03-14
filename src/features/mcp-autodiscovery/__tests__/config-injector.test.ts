import { describe, it, expect } from 'vitest';
import { ConfigInjector } from '../config-injector';

describe('ConfigInjector', () => {
  it('should generate MCP config entry', () => {
    const injector = new ConfigInjector();
    const config = injector.generateConfig({
      id: 'memory',
      name: 'MCP Memory',
      package: { type: 'uvx', name: '@modelcontextprotocol/server-memory' }
    });

    expect(config).toHaveProperty('command');
    expect(config).toHaveProperty('args');
  });

  it('should handle npm packages', () => {
    const injector = new ConfigInjector();
    const config = injector.generateConfig({
      id: 'test',
      name: 'Test Server',
      package: { type: 'npm', name: 'test-package' }
    });

    expect(config.command).toBe('node');
  });
});
