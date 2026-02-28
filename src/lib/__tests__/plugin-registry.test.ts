import { describe, it, expect, beforeEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

// Mock atomic-write
vi.mock('../atomic-write.js', () => ({
  atomicWriteJsonSync: vi.fn(),
  safeReadJson: vi.fn(),
}));

// Mock url module for import.meta.url
vi.mock('url', async (importOriginal) => {
  const actual = await importOriginal<typeof import('url')>();
  return {
    ...actual,
    fileURLToPath: vi.fn(() => '/mock/src/lib/plugin-registry.ts'),
  };
});

import { syncPluginRegistry, checkVersionConsistency } from '../plugin-registry.js';
import { atomicWriteJsonSync } from '../atomic-write.js';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockAtomicWriteJsonSync = vi.mocked(atomicWriteJsonSync);

const REGISTRY_PATH_SUFFIX = join('.claude', 'plugins', 'installed_plugins.json');

import { join } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');

function makeRegistry(version: string, installPath = '/mock/install/path') {
  return {
    version: 2 as const,
    plugins: {
      'ultrapower@ultrapower': [
        {
          scope: 'user' as const,
          installPath,
          version,
          installedAt: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  };
}

describe('syncPluginRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 正常更新：精确匹配 ultrapower@ultrapower，更新 version 和 lastUpdated，不修改 installPath', () => {
    const registry = makeRegistry('5.0.0');
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(registry) as unknown as ReturnType<typeof readFileSync>);

    const result = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result.success).toBe(true);
    expect(result.previousVersion).toBe('5.0.0');
    expect(result.newVersion).toBe('5.1.0');
    expect(mockAtomicWriteJsonSync).toHaveBeenCalledTimes(1);

    const written = mockAtomicWriteJsonSync.mock.calls[0][1] as ReturnType<typeof makeRegistry>;
    const entry = written.plugins['ultrapower@ultrapower'][0];
    expect(entry.version).toBe('5.1.0');
    expect(entry.installPath).toBe('/mock/install/path'); // installPath 未被修改
    expect(entry.lastUpdated).not.toBe('2026-01-01T00:00:00.000Z'); // lastUpdated 已更新
  });

  it('2. 文件不存在：返回 { success: true, skipped: true }，不调用 atomicWriteJsonSync', () => {
    mockExistsSync.mockReturnValue(false);

    const result = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('3. key 不存在：返回 { success: false, errors }，不调用 atomicWriteJsonSync', () => {
    const registry = {
      version: 2 as const,
      plugins: {
        'other-plugin@other': [{ scope: 'user', installPath: '/x', version: '1.0.0', installedAt: '', lastUpdated: '' }],
      },
    };
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(registry) as unknown as ReturnType<typeof readFileSync>);

    const result = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('ultrapower@*');
    expect(mockAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('4. 幂等性：连续调用两次，第二次 previousVersion === newVersion，lastUpdated 更新', () => {
    const registry = makeRegistry('5.1.0');
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(registry) as unknown as ReturnType<typeof readFileSync>);

    const result1 = syncPluginRegistry({ newVersion: '5.1.0' });
    const result2 = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result1.previousVersion).toBe('5.1.0');
    expect(result2.previousVersion).toBe('5.1.0');
    expect(mockAtomicWriteJsonSync).toHaveBeenCalledTimes(2);
  });

  it('5. skipIfProjectScoped=true：返回 { success: true, skipped: true }，不读取文件', () => {
    const result = syncPluginRegistry({ newVersion: '5.1.0', skipIfProjectScoped: true });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mockAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('6. 不匹配 fork key：不更新，返回 { success: false }', () => {
    const registry = {
      version: 2 as const,
      plugins: {
        'ultrapower-fork@someuser': [
          { scope: 'user' as const, installPath: '/x', version: '5.0.0', installedAt: '', lastUpdated: '' },
        ],
      },
    };
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(registry) as unknown as ReturnType<typeof readFileSync>);

    const result = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result.success).toBe(false);
    expect(mockAtomicWriteJsonSync).not.toHaveBeenCalled();
  });

  it('7. atomicWriteJsonSync 抛出异常：返回 { success: false, errors }', () => {
    const registry = makeRegistry('5.0.0');
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(registry) as unknown as ReturnType<typeof readFileSync>);
    mockAtomicWriteJsonSync.mockImplementation(() => { throw new Error('disk full'); });

    const result = syncPluginRegistry({ newVersion: '5.1.0' });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('disk full');
  });
});

describe('checkVersionConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMocks(opts: {
    registryVersion?: string | null;
    versionMetadataVersion?: string | null;
    packageJsonVersion?: string;
  }) {
    const { registryVersion = '5.1.0', versionMetadataVersion = '5.1.0', packageJsonVersion = '5.1.0' } = opts;

    mockExistsSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json')) return registryVersion !== null;
      if (path.includes('version.json')) return versionMetadataVersion !== null;
      if (path.endsWith('package.json')) return true;
      return false;
    });

    mockReadFileSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json') && registryVersion !== null) {
        return JSON.stringify(makeRegistry(registryVersion)) as unknown as ReturnType<typeof readFileSync>;
      }
      if (path.includes('version.json') && versionMetadataVersion !== null) {
        return JSON.stringify({ version: versionMetadataVersion }) as unknown as ReturnType<typeof readFileSync>;
      }
      if (path.endsWith('package.json')) {
        return JSON.stringify({ name: 'ultrapower', version: packageJsonVersion }) as unknown as ReturnType<typeof readFileSync>;
      }
      throw new Error(`ENOENT: ${path}`);
    });
  }

  it('8. 三源一致：返回 { consistent: true, discrepancies: [] }', () => {
    setupMocks({ registryVersion: '5.1.0', versionMetadataVersion: '5.1.0', packageJsonVersion: '5.1.0' });
    const report = checkVersionConsistency();
    expect(report.consistent).toBe(true);
    expect(report.discrepancies).toHaveLength(0);
    expect(report.fixCommand).toBeUndefined();
  });

  it('9. registryVersion 落后：discrepancies 非空，fixCommand 非空', () => {
    setupMocks({ registryVersion: '5.0.0', versionMetadataVersion: '5.1.0', packageJsonVersion: '5.1.0' });
    const report = checkVersionConsistency();
    expect(report.consistent).toBe(false);
    expect(report.discrepancies.length).toBeGreaterThan(0);
    expect(report.fixCommand).toBeDefined();
    expect(report.registryVersion).toBe('5.0.0');
  });

  it('10. versionMetadataVersion 为 null（文件不存在）：consistent: false', () => {
    setupMocks({ registryVersion: '5.1.0', versionMetadataVersion: null, packageJsonVersion: '5.1.0' });
    const report = checkVersionConsistency();
    expect(report.consistent).toBe(false);
    expect(report.versionMetadataVersion).toBeNull();
  });

  it('11. isUpdating: registryVersion 与 packageJsonVersion 不同时为 true', () => {
    setupMocks({ registryVersion: '5.0.0', versionMetadataVersion: '5.1.0', packageJsonVersion: '5.1.0' });
    const report = checkVersionConsistency();
    expect(report.isUpdating).toBe(true);
  });

  it('12. 多条目数组：使用第 0 项', () => {
    const multiEntryRegistry = {
      version: 2 as const,
      plugins: {
        'ultrapower@ultrapower': [
          { scope: 'user' as const, installPath: '/a', version: '5.1.0', installedAt: '', lastUpdated: '' },
          { scope: 'user' as const, installPath: '/b', version: '4.0.0', installedAt: '', lastUpdated: '' },
        ],
      },
    };
    mockExistsSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json')) return true;
      if (path.endsWith('package.json')) return true;
      return false;
    });
    mockReadFileSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json')) return JSON.stringify(multiEntryRegistry) as unknown as ReturnType<typeof readFileSync>;
      if (path.endsWith('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.1.0' }) as unknown as ReturnType<typeof readFileSync>;
      throw new Error(`ENOENT: ${path}`);
    });
    const report = checkVersionConsistency();
    expect(report.registryVersion).toBe('5.1.0');
  });

  it('13. 空数组：registryVersion 为 null', () => {
    const emptyRegistry = { version: 2 as const, plugins: { 'ultrapower@ultrapower': [] } };
    mockExistsSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json')) return true;
      if (path.endsWith('package.json')) return true;
      return false;
    });
    mockReadFileSync.mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('installed_plugins.json')) return JSON.stringify(emptyRegistry) as unknown as ReturnType<typeof readFileSync>;
      if (path.endsWith('package.json')) return JSON.stringify({ name: 'ultrapower', version: '5.1.0' }) as unknown as ReturnType<typeof readFileSync>;
      throw new Error(`ENOENT: ${path}`);
    });
    const report = checkVersionConsistency();
    expect(report.registryVersion).toBeNull();
  });
});
