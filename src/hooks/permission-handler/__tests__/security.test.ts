import { describe, it, expect } from 'vitest';
import { handlePermissionRequest, processPermissionRequest, type PermissionRequestInput } from '../index.js';

describe('Permission Handler Security', () => {
  const createMockInput = (overrides?: Partial<PermissionRequestInput>): PermissionRequestInput => ({
    session_id: 'test-session',
    transcript_path: '/tmp/transcript.md',
    cwd: '/tmp/test',
    permission_mode: 'ask',
    hook_event_name: 'PermissionRequest',
    tool_name: 'Bash',
    tool_input: { command: 'echo test' },
    tool_use_id: 'test-id',
    ...overrides
  });

  describe('error handling', () => {
    it('should block execution when permission check throws error', async () => {
      const input = createMockInput({
        tool_input: null as any // Invalid input to trigger error
      });

      const result = await handlePermissionRequest(input);

      expect(result.continue).toBe(false);
      expect(result.reason).toContain('Permission check failed');
    });

    it('should allow safe commands', () => {
      const input = createMockInput({
        tool_input: { command: 'git status' }
      });

      const result = processPermissionRequest(input);

      expect(result.continue).toBe(true);
      expect(result.hookSpecificOutput?.decision?.behavior).toBe('allow');
    });

    it('should pass through unsafe commands to normal flow', () => {
      const input = createMockInput({
        tool_input: { command: 'rm -rf /' }
      });

      const result = processPermissionRequest(input);

      expect(result.continue).toBe(true);
      expect(result.hookSpecificOutput).toBeUndefined();
    });
  });
});
