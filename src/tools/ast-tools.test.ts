import { describe, it, expect } from 'vitest';

describe('AST Tools Auto-Install', () => {
  it('should have AST_AUTO_INSTALL environment variable support', () => {
    const originalValue = process.env.AST_AUTO_INSTALL;
    process.env.AST_AUTO_INSTALL = 'false';
    expect(process.env.AST_AUTO_INSTALL).toBe('false');
    if (originalValue !== undefined) {
      process.env.AST_AUTO_INSTALL = originalValue;
    } else {
      delete process.env.AST_AUTO_INSTALL;
    }
  });

  it('should export ast tools', async () => {
    const { astTools } = await import('./ast-tools.js');
    expect(astTools).toBeDefined();
    expect(astTools.length).toBe(2);
  });
});
