import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  interopSendTaskTool,
  interopReadResultsTool,
  interopSendMessageTool,
  interopReadMessagesTool,
  interopListOmxTeamsTool,
  interopSendOmxMessageTool,
  interopReadOmxMessagesTool,
  interopReadOmxTasksTool,
  getInteropTools,
} from '../mcp-bridge.js';

describe('MCP Bridge Tools', () => {
  const testDir = join(process.cwd(), '.test-mcp-bridge');

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true });
    vi.restoreAllMocks();
  });

  describe('interopSendTaskTool', () => {
    it('sends task successfully', async () => {
      const result = await interopSendTaskTool.handler({
        target: 'omx',
        type: 'implement',
        description: 'Test task',
      });
      expect(result.content[0].text).toContain('Task Sent to OMX');
      expect(result.content[0].text).toContain('pending');
    });

    it('includes optional context and files', async () => {
      const result = await interopSendTaskTool.handler({
        target: 'omx',
        type: 'implement',
        description: 'Test',
        context: { key: 'value' },
        files: ['test.ts'],
      });
      expect(result.content[0].text).toContain('test.ts');
    });
  });

  describe('interopReadResultsTool', () => {
    it('returns no tasks message when empty', async () => {
      const result = await interopReadResultsTool.handler({});
      expect(result.content[0].text).toContain('No Tasks Found');
    });

    it('filters by status', async () => {
      await interopSendTaskTool.handler({
        target: 'omx',
        type: 'test',
        description: 'Task 1',
      });
      const result = await interopReadResultsTool.handler({ status: 'completed' });
      expect(result.content[0].text).toContain('No Tasks Found');
    });

    it('displays tasks with all fields', async () => {
      await interopSendTaskTool.handler({
        target: 'omx',
        type: 'implement',
        description: 'Full task',
        files: ['test.ts'],
      });
      const result = await interopReadResultsTool.handler({ limit: 5 });
      expect(result.content[0].text).toContain('Full task');
      expect(result.content[0].text).toContain('test.ts');
    });
  });

  describe('interopSendMessageTool', () => {
    it('sends message successfully', async () => {
      const result = await interopSendMessageTool.handler({
        target: 'omx',
        content: 'Hello',
      });
      expect(result.content[0].text).toContain('Message Sent to OMX');
    });
  });

  describe('interopReadMessagesTool', () => {
    it('returns no messages when empty', async () => {
      const result = await interopReadMessagesTool.handler({});
      expect(result.content[0].text).toContain('No Messages Found');
    });

    it('marks messages as read', async () => {
      await interopSendMessageTool.handler({ target: 'omx', content: 'Test' });
      const result = await interopReadMessagesTool.handler({ markAsRead: true });
      expect(result.content[0].text).toContain('marked as read');
    });

    it('displays messages with metadata', async () => {
      await interopSendMessageTool.handler({
        target: 'omx',
        content: 'Test with metadata',
        metadata: { priority: 'high' },
      });
      const result = await interopReadMessagesTool.handler({});
      expect(result.content[0].text).toContain('Test with metadata');
      expect(result.content[0].text).toContain('Metadata');
    });
  });

  describe('interopListOmxTeamsTool', () => {
    it('returns no teams message', async () => {
      const result = await interopListOmxTeamsTool.handler({});
      expect(result.content[0].text).toContain('No OMX Teams Found');
    });
  });

  describe('interopSendOmxMessageTool', () => {
    it('sends direct message', async () => {
      const result = await interopSendOmxMessageTool.handler({
        teamName: 'nonexistent',
        fromWorker: 'w1',
        toWorker: 'w2',
        body: 'Test',
      });
      expect(result.content[0].text).toContain('Message Sent');
    });
  });

  describe('interopReadOmxMessagesTool', () => {
    it('returns no messages', async () => {
      const result = await interopReadOmxMessagesTool.handler({
        teamName: 'nonexistent',
        workerName: 'w1',
      });
      expect(result.content[0].text).toContain('No Messages');
    });
  });

  describe('interopReadOmxTasksTool', () => {
    it('returns no tasks', async () => {
      const result = await interopReadOmxTasksTool.handler({
        teamName: 'nonexistent',
      });
      expect(result.content[0].text).toContain('No tasks');
    });
  });

  describe('getInteropTools', () => {
    it('returns all 8 tools', () => {
      const tools = getInteropTools();
      expect(tools).toHaveLength(8);
      expect(tools.map(t => t.name)).toEqual([
        'interop_send_task',
        'interop_read_results',
        'interop_send_message',
        'interop_read_messages',
        'interop_list_omx_teams',
        'interop_send_omx_message',
        'interop_read_omx_messages',
        'interop_read_omx_tasks',
      ]);
    });
  });
});
