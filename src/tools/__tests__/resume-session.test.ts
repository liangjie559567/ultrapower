/**
 * Resume Session Tool Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resumeSession } from '../resume-session.js';
import * as managerModule from '../../features/background-agent/manager.js';

describe('resumeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when session not found', () => {
    const mockManager = {
      getResumeContext: vi.fn().mockReturnValue(null),
    };
    vi.spyOn(managerModule, 'getBackgroundManager').mockReturnValue(mockManager as any);

    const result = resumeSession({ sessionId: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Session not found');
  });

  it('should return context when session exists', () => {
    const mockContext = {
      sessionId: 'ses_123',
      previousPrompt: 'Test task',
      toolCallCount: 5,
      lastToolUsed: 'Read',
      lastOutputSummary: 'File content...',
      startedAt: new Date('2026-03-13T10:00:00Z'),
      lastActivityAt: new Date('2026-03-13T10:05:00Z'),
    };

    const mockManager = {
      getResumeContext: vi.fn().mockReturnValue(mockContext),
    };
    vi.spyOn(managerModule, 'getBackgroundManager').mockReturnValue(mockManager as any);

    const result = resumeSession({ sessionId: 'ses_123' });

    expect(result.success).toBe(true);
    expect(result.context).toBeDefined();
    expect(result.context?.previousPrompt).toBe('Test task');
    expect(result.context?.toolCallCount).toBe(5);
    expect(result.context?.continuationPrompt).toContain('Resuming Background Session');
  });

  it('should build continuation prompt with all context', () => {
    const mockContext = {
      sessionId: 'ses_456',
      previousPrompt: 'Original task',
      toolCallCount: 3,
      lastToolUsed: 'Bash',
      lastOutputSummary: 'Command output',
      startedAt: new Date('2026-03-13T10:00:00Z'),
      lastActivityAt: new Date('2026-03-13T10:03:00Z'),
    };

    const mockManager = {
      getResumeContext: vi.fn().mockReturnValue(mockContext),
    };
    vi.spyOn(managerModule, 'getBackgroundManager').mockReturnValue(mockManager as any);

    const result = resumeSession({ sessionId: 'ses_456' });

    expect(result.success).toBe(true);
    const prompt = result.context?.continuationPrompt;
    expect(prompt).toContain('ses_456');
    expect(prompt).toContain('Original task');
    expect(prompt).toContain('Tool calls executed: 3');
    expect(prompt).toContain('Last tool used: Bash');
    expect(prompt).toContain('Command output');
  });

  it('should handle missing optional fields', () => {
    const mockContext = {
      sessionId: 'ses_789',
      previousPrompt: 'Minimal task',
      toolCallCount: 0,
      startedAt: new Date('2026-03-13T10:00:00Z'),
      lastActivityAt: new Date('2026-03-13T10:00:00Z'),
    };

    const mockManager = {
      getResumeContext: vi.fn().mockReturnValue(mockContext),
    };
    vi.spyOn(managerModule, 'getBackgroundManager').mockReturnValue(mockManager as any);

    const result = resumeSession({ sessionId: 'ses_789' });

    expect(result.success).toBe(true);
    expect(result.context?.lastToolUsed).toBeUndefined();
    expect(result.context?.lastOutputSummary).toBeUndefined();
  });

  it('should handle errors gracefully', () => {
    const mockManager = {
      getResumeContext: vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      }),
    };
    vi.spyOn(managerModule, 'getBackgroundManager').mockReturnValue(mockManager as any);

    const result = resumeSession({ sessionId: 'ses_error' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
