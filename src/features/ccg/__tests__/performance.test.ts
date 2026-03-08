import { describe, it, expect, beforeEach } from 'vitest';
import { createDocFromTemplate, batchCreateDocs } from '../doc-manager.js';
import { docCache } from '../doc-cache.js';

describe('CCG Performance', () => {
  beforeEach(() => {
    docCache.clear();
  });

  it('should cache template reads', async () => {
    const vars = { projectName: 'Test', description: 'Test project' };

    const start1 = Date.now();
    await createDocFromTemplate('requirements', vars);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await createDocFromTemplate('requirements', vars);
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThanOrEqual(time1);
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
