import { describe, it, expect } from 'vitest';
import { addNamespace, parseNamespace } from '../namespace-manager.js';

describe('Community MCP Server Integration', () => {
  describe('Filesystem Server', () => {
    it('should namespace filesystem tools', () => {
      const namespaced = addNamespace('filesystem', 'read_file');
      expect(namespaced).toBe('mcp__filesystem__read_file');
      expect(parseNamespace(namespaced)).toEqual({ serverName: 'filesystem', toolName: 'read_file' });
    });

    it('should namespace list_directory', () => {
      const namespaced = addNamespace('filesystem', 'list_directory');
      expect(namespaced).toBe('mcp__filesystem__list_directory');
    });
  });

  describe('GitHub Server', () => {
    it('should namespace github tools', () => {
      const namespaced = addNamespace('github', 'create_issue');
      expect(namespaced).toBe('mcp__github__create_issue');
      expect(parseNamespace(namespaced)).toEqual({ serverName: 'github', toolName: 'create_issue' });
    });
  });

  describe('Slack Server', () => {
    it('should namespace slack tools', () => {
      const namespaced = addNamespace('slack', 'send_message');
      expect(namespaced).toBe('mcp__slack__send_message');
      expect(parseNamespace(namespaced)).toEqual({ serverName: 'slack', toolName: 'send_message' });
    });
  });
});
