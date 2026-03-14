import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedContextManager } from '../context-manager';

describe('UnifiedContextManager', () => {
  let manager: UnifiedContextManager;

  beforeEach(async () => {
    manager = new UnifiedContextManager();
    await manager.initialize();
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  it('should share context across agents', async () => {
    await manager.setAgentContext('agent-1', { task: 'implement feature' });
    const context = await manager.getSharedContext();
    expect(context['agent-1']).toEqual({ task: 'implement feature' });
  });

  it('should sync context updates', async () => {
    await manager.setAgentContext('agent-1', { status: 'in-progress' });
    await manager.setAgentContext('agent-2', { status: 'waiting' });

    const allContexts = await manager.getAllAgentContexts();
    expect(allContexts).toHaveLength(2);
  });

  it('should create knowledge graph relations', async () => {
    await manager.createRelation('task-1', 'depends-on', 'task-2');
    const relations = await manager.getRelations('task-1');
    expect(relations).toContainEqual({
      from: 'task-1',
      type: 'depends-on',
      to: 'task-2'
    });
  });
});
