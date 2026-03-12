import { describe, it, expect, vi } from 'vitest';
import { validateDependency } from '../fallback.js';
import type { Dependency } from '../types.js';

describe('validateDependency', () => {
  it('所有层失败时返回低置信度结果', async () => {
    const dep: Dependency = { type: 'npm', name: 'unknown-package' };
    const result = await validateDependency(dep);

    expect(result.confidence).toBe('low');
    expect(result.apiExists).toBe(false);
    expect(result.shouldBlock).toBe(true);
    expect(result.source).toBe('none');
  });

  it('返回结果包含时间戳', async () => {
    const dep: Dependency = { type: 'npm', name: 'test-pkg' };
    const result = await validateDependency(dep);

    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.dependency).toBe('test-pkg');
  });

  it('处理不同类型的依赖', async () => {
    const deps: Dependency[] = [
      { type: 'npm', name: 'react' },
      { type: 'api', name: 'https://api.test.com', endpoint: 'https://api.test.com' },
      { type: 'database', name: 'user.find', model: 'user', method: 'find' }
    ];

    for (const dep of deps) {
      const result = await validateDependency(dep);
      expect(result).toBeDefined();
      expect(result.dependency).toBe(dep.name);
    }
  });
});
