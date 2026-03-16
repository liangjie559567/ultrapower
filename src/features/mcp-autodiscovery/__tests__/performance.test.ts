import { describe, it, expect, beforeAll } from 'vitest';
import { UnifiedContextManager } from '../../unified-context/index.js';

describe('Performance Tests - Context Sync Parallelization', () => {
  let contextManager: UnifiedContextManager;

  beforeAll(async () => {
    contextManager = new UnifiedContextManager();
    await contextManager.initialize();
  }, 30000);

  it('should sync 10 agent contexts in under 500ms', async () => {
    const agents = Array.from({ length: 10 }, (_, i) => `agent-${i}`);

    // Populate contexts
    await Promise.all(
      agents.map(id => contextManager.setAgentContext(id, { task: `task-${id}` }))
    );

    const start = Date.now();

    // Simulate parallel sync (as fixed in unified-team.ts)
    const sharedContext = await contextManager.getSharedContext();
    await Promise.all(
      Object.entries(sharedContext).map(([agentId, context]) =>
        contextManager.setAgentContext(agentId, context)
      )
    );

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });

  it('should handle 50 concurrent context operations', async () => {
    const operations = Array.from({ length: 50 }, (_, i) =>
      contextManager.setAgentContext(`concurrent-${i}`, { index: i })
    );

    const start = Date.now();
    await Promise.all(operations);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });
});
