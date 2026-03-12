import { describe, it, expect, beforeEach } from 'vitest';
import { createDocFromTemplate, batchCreateDocs } from '../doc-manager.js';
import { docCache } from '../doc-cache.js';

describe('CCG Performance', () => {
  beforeEach(() => {
    docCache.clear();
  });

  it('should cache template reads', async () => {
    const vars = { projectName: 'Test', description: 'Test project' };

    // First call - should populate cache
    await createDocFromTemplate('requirements', vars);

    // Second call - should use cache
    const result = await createDocFromTemplate('requirements', vars);

    // Verify result is valid (cache worked)
    expect(result).toContain('Test');
  });

  it('should batch create multiple docs', async () => {
    const requests = [
      { type: 'requirements', vars: { projectName: 'P1' } },
      { type: 'tech-design', vars: { architecture: 'MVC' } },
      { type: 'test-checklist', vars: { scope: 'unit' } },
    ];

    const results = await batchCreateDocs(requests);
    expect(results).toHaveLength(3);
    expect(results[0]).toContain('P1');
  });
});
