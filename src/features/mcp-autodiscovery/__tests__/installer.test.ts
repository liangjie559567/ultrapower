import { describe, it, expect } from 'vitest';
import { MCPInstaller } from '../installer';

describe('MCPInstaller', () => {
  it('should validate official servers', () => {
    const installer = new MCPInstaller();
    expect(installer.isOfficialServer('@modelcontextprotocol/server-memory')).toBe(true);
    expect(installer.isOfficialServer('malicious-package')).toBe(false);
  });

  it('should generate install command for npm packages', () => {
    const installer = new MCPInstaller();
    const cmd = installer.getInstallCommand({
      type: 'npm',
      name: '@modelcontextprotocol/server-memory'
    });
    expect(cmd).toContain('npm');
  });

  it('should generate install command for uvx packages', () => {
    const installer = new MCPInstaller();
    const cmd = installer.getInstallCommand({
      type: 'uvx',
      name: 'mcp-server-fetch'
    });
    expect(cmd).toContain('uvx');
  });
});
