import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UnifiedContextManager } from '../unified-context';
import { MCPRegistryClient } from '../mcp-autodiscovery/registry-client';
import { CapabilityMatcher } from '../mcp-autodiscovery/capability-matcher';

// TODO: E2E tests require MCP Memory server and registry setup
describe.skip('MCP Integration E2E', () => {
  let contextManager: UnifiedContextManager;

  beforeAll(async () => {
    contextManager = new UnifiedContextManager();
    await contextManager.initialize();
  }, 30000);

  afterAll(async () => {
    await contextManager.shutdown();
  }, 30000);

  it('should store and retrieve agent context via MCP Memory', async () => {
    await contextManager.setAgentContext('test-agent', { task: 'integration test' });
    const context = await contextManager.getSharedContext();
    expect(context['test-agent']).toEqual({ task: 'integration test' });
  });

  it('should query MCP Registry and match capabilities', async () => {
    const registryClient = new MCPRegistryClient();
    const servers = await registryClient.listServers();
    expect(servers).toBeInstanceOf(Array);

    const matcher = new CapabilityMatcher();
    const matches = await matcher.findMatches({
      taskDescription: 'test task',
      requiredCapabilities: ['general']
    });
    expect(matches).toBeInstanceOf(Array);
  });

  it('should create knowledge graph relations', async () => {
    await contextManager.createRelation('agent-1', 'collaborates-with', 'agent-2');
    const relations = await contextManager.getRelations('agent-1');
    expect(relations).toContainEqual({
      from: 'agent-1',
      type: 'collaborates-with',
      to: 'agent-2'
    });
  });
});
