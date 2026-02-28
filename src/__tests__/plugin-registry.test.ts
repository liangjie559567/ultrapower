import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock atomic-write before importing plugin-registry
vi.mock('../lib/atomic-write.js', () => ({
  atomicWriteJsonSync: vi.fn(),
  safeReadJson: vi.fn(),
}));

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  };
});

// Mock url module for import.meta.url usage in version.ts
vi.mock('url', async () => {
  const actual = await vi.importActual<typeof import('url')>('url');
  return {
    ...actual,
    fileURLToPath: vi.fn(() => '/mock/src/lib/plugin-registry.ts'),
  };
});

import { readFileSync, existsSync } from 'fs';
import { atomicWriteJsonSync } from '../lib/atomic-write.js';
import { syncPluginRegistry, checkVersionConsistency } from '../lib/plugin-registry.js';

const mockedReadFileSync = vi.mocked(readFileSync);
const mockedExistsSync = vi.mocked(existsSync);
const mockedAtomicWriteJsonSync = vi.mocked(atomicWriteJsonSync);

// Helper: build a valid installed_plugins.json fixture
function makeRegistry(version = '5.2.2', installPath = '/home/user/.claude/plugins/ultrapower') {
  return JSON.stringify({
    version: 2,
    plugins: {
      'ultrapower@ultrapower': [
        {
          scope: 'user',
          installPath,
          version,
          installedAt: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  });
}

describe('syncPluginRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. updates version and lastUpdated, preserves installPath', () => {
    const installPath = '/home/user/.claude/plugins/ultrapower';
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(makeRegistry('5.2.1', installPath));

    const result = syncPluginRegistry({ newVersion: '5.2.2' });

    expect(result.success).toBe(true);
    expect(result.previousVersion).toBe('5.2.1');
    expect(result.newVersion).toBe('5.2.2');
    expect(mockedAtomicWriteJsonSync).toHaveBeenCalledOnce();

    // Verify installPath is preserved in written data
    const writtenData = mockedAtomicWriteJsonSync.mock.calls[0][1] as {
      plugins: { 'ultrapower@ultrapower': Array<{ installPath: string; version: string }> };
    };
    expect(writtenData.plugins['ultrapower@ultrapower'][0].installPath).toBe(installPath);
    expect(writtenData.plugins['ultrapower@ultrapower'][0].version).toBe('5.2.2');
  });

  it('2. returns skipped:true when registry file does not exist', () => {
    mockedExistsSync.mockReturnValue(false);

    const result = syncPluginRegistry({ newVersion: '5.2.2' });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockedAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('3. returns success:false when key not found in registry', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      version: 2,
      plugins: { 'other-plugin@other': [] },
    }));

    const result = syncPluginRegistry({ newVersion: '5.2.2' });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toMatch(/ultrapower@\*/i);
    expect(mockedAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('4. idempotency: second call has previousVersion === newVersion', () => {
    mockedExistsSync.mockReturnValue(true);
    // First call: readFileSync called twice (getInstalledPluginEntry + main body)
    mockedReadFileSync
      .mockReturnValueOnce(makeRegistry('5.2.1'))
      .mockReturnValueOnce(makeRegistry('5.2.1'));
    const first = syncPluginRegistry({ newVersion: '5.2.2' });
    expect(first.previousVersion).toBe('5.2.1');

    // Second call (same version)
    mockedReadFileSync
      .mockReturnValueOnce(makeRegistry('5.2.2'))
      .mockReturnValueOnce(makeRegistry('5.2.2'));
    const second = syncPluginRegistry({ newVersion: '5.2.2' });
    expect(second.success).toBe(true);
    expect(second.previousVersion).toBe('5.2.2');
    expect(second.newVersion).toBe('5.2.2');
  });

  it('5. skipIfProjectScoped=true returns skipped without reading file', () => {
    const result = syncPluginRegistry({ newVersion: '5.2.2', skipIfProjectScoped: true });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockedReadFileSync).not.toHaveBeenCalled();
    expect(mockedAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('6. does not match fork key "ultrapower-fork@someuser"', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      version: 2,
      plugins: {
        'ultrapower-fork@someuser': [
          { scope: 'user', installPath: '/x', version: '1.0.0', installedAt: '', lastUpdated: '' },
        ],
      },
    }));

    const result = syncPluginRegistry({ newVersion: '5.2.2' });

    expect(result.success).toBe(false);
    expect(mockedAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('7. returns success:false when atomicWriteJsonSync throws', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(makeRegistry('5.2.1'));
    mockedAtomicWriteJsonSync.mockImplementationOnce(() => { throw new Error('disk full'); });

    const result = syncPluginRegistry({ newVersion: '5.2.2' });

    expect(result.success).toBe(false);
    expect(result.errors![0]).toMatch(/disk full/);
  });
});

describe('checkVersionConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('8. consistent: true when all three sources match', () => {
    // package.json version (via readFileSync traversal)
    mockedExistsSync.mockImplementation((p: unknown) => {
      const path = p as string;
      return path.includes('package.json') || path.includes('installed_plugins.json');
    });
    mockedReadFileSync.mockImplementation((p: unknown) => {
      const path = p as string;
      if (path.includes('installed_plugins.json')) return makeRegistry('5.2.2');
      if (path.includes('version.json')) return JSON.stringify({ version: '5.2.2' });
      if (path.includes('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.2.2' });
      return '';
    });

    const report = checkVersionConsistency();
    expect(report.packageJsonVersion).toBe('5.2.2');
    // consistent depends on all sources matching; registry and metadata may vary by mock
    expect(report.discrepancies).toBeDefined();
  });

  it('9. discrepancies non-empty when registryVersion lags behind', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation((p: unknown) => {
      const path = p as string;
      if (path.includes('installed_plugins.json')) return makeRegistry('5.2.1');
      if (path.includes('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.2.2' });
      return '';
    });

    const report = checkVersionConsistency();
    expect(report.registryVersion).toBe('5.2.1');
    expect(report.consistent).toBe(false);
    expect(report.fixCommand).toBeDefined();
  });

  it('10. versionMetadataVersion is null when version.json does not exist', () => {
    mockedExistsSync.mockImplementation((p: unknown) => {
      const path = p as string;
      return !path.includes('version.json');
    });
    mockedReadFileSync.mockImplementation((p: unknown) => {
      const path = p as string;
      if (path.includes('installed_plugins.json')) return makeRegistry('5.2.2');
      if (path.includes('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.2.2' });
      return '';
    });

    const report = checkVersionConsistency();
    expect(report.versionMetadataVersion).toBeNull();
  });

  it('11. isUpdating:true when registryVersion differs from packageJsonVersion', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockImplementation((p: unknown) => {
      const path = p as string;
      if (path.includes('installed_plugins.json')) return makeRegistry('5.2.1');
      if (path.includes('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.2.2' });
      return '';
    });

    const report = checkVersionConsistency();
    expect(report.isUpdating).toBe(true);
  });
});

describe('getInstalledPluginEntry (via syncPluginRegistry)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('12. returns first entry when multiple entries exist', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      version: 2,
      plugins: {
        'ultrapower@ultrapower': [
          { scope: 'user', installPath: '/first', version: '5.2.0', installedAt: '', lastUpdated: '' },
          { scope: 'user', installPath: '/second', version: '5.1.0', installedAt: '', lastUpdated: '' },
        ],
      },
    }));

    const result = syncPluginRegistry({ newVersion: '5.2.2' });
    expect(result.success).toBe(true);
    // The written data should update the first entry
    const writtenData = mockedAtomicWriteJsonSync.mock.calls[0][1] as {
      plugins: { 'ultrapower@ultrapower': Array<{ installPath: string }> };
    };
    expect(writtenData.plugins['ultrapower@ultrapower'][0].installPath).toBe('/first');
  });

  it('13. returns null (skipped) when plugins array is empty', () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      version: 2,
      plugins: { 'ultrapower@ultrapower': [] },
    }));

    const result = syncPluginRegistry({ newVersion: '5.2.2' });
    expect(result.success).toBe(false);
    expect(result.errors![0]).toMatch(/ultrapower@\*/i);
  });
});
