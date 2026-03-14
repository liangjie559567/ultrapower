import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedContextManager } from '../../features/unified-context';

describe('Team Pipeline with Unified Context', () => {
  let contextManager: UnifiedContextManager;

  beforeEach(async () => {
    contextManager = new UnifiedContextManager();
    await contextManager.initialize();
  });

  afterEach(async () => {
    await contextManager.shutdown();
  });

  it('should share context across team agents', async () => {
    await contextManager.setAgentContext('agent-1', { task: 'implement feature' });
    await contextManager.setAgentContext('agent-2', { task: 'review code' });

    const sharedContext = await contextManager.getSharedContext();
    expect(sharedContext['agent-1']).toEqual({ task: 'implement feature' });
    expect(sharedContext['agent-2']).toEqual({ task: 'review code' });
  });

  it('should track task dependencies via relations', async () => {
    await contextManager.createRelation('task-1', 'blocks', 'task-2');
    await contextManager.createRelation('task-2', 'blocks', 'task-3');

    const task1Relations = await contextManager.getRelations('task-1');
    expect(task1Relations).toContainEqual({
      from: 'task-1',
      type: 'blocks',
      to: 'task-2'
    });
  });
});
