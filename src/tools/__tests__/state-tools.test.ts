import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  stateReadTool,
  stateWriteTool,
  stateClearTool,
  stateListActiveTool,
  stateGetStatusTool,
} from '../state-tools.js';

let TEST_DIR: string;

// Mock validateWorkingDirectory to allow test directory
vi.mock('../../lib/worktree-paths.js', async () => {
  const actual = await vi.importActual('../../lib/worktree-paths.js');
  return {
    ...actual,
    validateWorkingDirectory: vi.fn((workingDirectory?: string) => {
      return workingDirectory || process.cwd();
    }),
  };
});

describe('state-tools', () => {
  beforeEach(() => {
    TEST_DIR = mkdtempSync(join(tmpdir(), 'state-tools-test-'));
    mkdirSync(join(TEST_DIR, '.omc', 'state'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('state_read', () => {
    it('should return state when file exists at session-scoped path', async () => {
      const sessionId = 'session-read-test';
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'ralph-state.json'),
        JSON.stringify({ active: true, iteration: 3 })
      );

      const result = await stateReadTool.handler({
        mode: 'ralph',
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('active');
      expect(result.content[0].text).toContain('iteration');
    });

    it('should indicate when no state exists', async () => {
      const result = await stateReadTool.handler({
        mode: 'ultrawork',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('No state found');
    });
  });

  describe('state_write', () => {
    it('should write state to legacy path when no session_id provided', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        state: { active: true, iteration: 1 },
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      const legacyPath = join(TEST_DIR, '.omc', 'state', 'ralph-state.json');
      expect(existsSync(legacyPath)).toBe(true);
    });

    it('should add _meta field to written state', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        state: { someField: 'value' },
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      expect(result.content[0].text).toContain('_meta');
    });

    it('should include session ID in _meta when provided', async () => {
      const sessionId = 'session-meta-test';
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        state: { active: true },
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain(`"sessionId": "${sessionId}"`);
    });
  });

  describe('state_clear', () => {
    it('should remove legacy state file when no session_id provided', async () => {
      await stateWriteTool.handler({
        mode: 'ralph',
        state: { active: true },
        workingDirectory: TEST_DIR,
      });

      const legacyPath = join(TEST_DIR, '.omc', 'state', 'ralph-state.json');
      expect(existsSync(legacyPath)).toBe(true);

      const result = await stateClearTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toMatch(/cleared|Successfully/i);
      expect(existsSync(legacyPath)).toBe(false);
    });

    it('should clear ralplan state with explicit session_id', async () => {
      const sessionId = 'test-session-ralplan';
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'ralplan-state.json'),
        JSON.stringify({ active: true })
      );

      const result = await stateClearTool.handler({
        mode: 'ralplan',
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('cleared');
      expect(existsSync(join(sessionDir, 'ralplan-state.json'))).toBe(false);
    });

    it('should clear only the requested session for every execution mode', async () => {
      const modes = ['autopilot', 'ultrapilot', 'pipeline', 'ralph', 'ultrawork', 'ultraqa'] as const;
      const sessionA = 'session-a';
      const sessionB = 'session-b';

      for (const mode of modes) {
        await stateWriteTool.handler({
          mode,
          state: { active: true, owner: 'A' },
          session_id: sessionA,
          workingDirectory: TEST_DIR,
        });
        await stateWriteTool.handler({
          mode,
          state: { active: true, owner: 'B' },
          session_id: sessionB,
          workingDirectory: TEST_DIR,
        });

        const clearResult = await stateClearTool.handler({
          mode,
          session_id: sessionA,
          workingDirectory: TEST_DIR,
        });

        expect(clearResult.content[0].text).toMatch(/cleared|Successfully/i);

        const sessionAPath = join(TEST_DIR, '.omc', 'state', 'sessions', sessionA, `${mode}-state.json`);
        const sessionBPath = join(TEST_DIR, '.omc', 'state', 'sessions', sessionB, `${mode}-state.json`);

        expect(existsSync(sessionAPath)).toBe(false);
        expect(existsSync(sessionBPath)).toBe(true);
      }
    });

    it('should clear legacy and all sessions when session_id is omitted and show warning', async () => {
      const sessionId = 'aggregate-clear';
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true, source: 'legacy' },
        workingDirectory: TEST_DIR,
      });
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true, source: 'session' },
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      const result = await stateClearTool.handler({
        mode: 'ultrawork',
        workingDirectory: TEST_DIR,
      });

      const legacyPath = join(TEST_DIR, '.omc', 'state', 'ultrawork-state.json');
      const sessionPath = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId, 'ultrawork-state.json');

      expect(result.content[0].text).toContain('WARNING: No session_id provided');
      expect(existsSync(legacyPath)).toBe(false);
      expect(existsSync(sessionPath)).toBe(false);
    });

    it('should not report false errors for sessions with no state file during broad clear', async () => {
      // Create a session directory but no state file for ralph mode
      const sessionId = 'empty-session';
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId);
      mkdirSync(sessionDir, { recursive: true });
      // Note: no state file created - simulating a session with no ralph state

      // Create state for a different mode in the same session
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true },
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      // Now clear ralph mode (which has no state in this session)
      const result = await stateClearTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      // Should report "No state found" not errors
      expect(result.content[0].text).toContain('No state found');
      expect(result.content[0].text).not.toContain('Errors:');
    });

    it('should only count actual deletions in broad clear count', async () => {
      // Create state in only one session out of multiple
      const sessionWithState = 'has-state';
      const sessionWithoutState = 'no-state';

      // Create session directories
      mkdirSync(join(TEST_DIR, '.omc', 'state', 'sessions', sessionWithState), { recursive: true });
      mkdirSync(join(TEST_DIR, '.omc', 'state', 'sessions', sessionWithoutState), { recursive: true });

      // Only create state for one session
      await stateWriteTool.handler({
        mode: 'ralph',
        state: { active: true },
        session_id: sessionWithState,
        workingDirectory: TEST_DIR,
      });

      const result = await stateClearTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      // Should report exactly 1 location cleared (the session with state)
      expect(result.content[0].text).toContain('Locations cleared: 1');
      expect(result.content[0].text).not.toContain('Errors:');
    });
  });

  describe('state_list_active', () => {
    it('should list active modes in current session when session_id provided', async () => {
      const sessionId = 'active-session-test';
      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      const result = await stateListActiveTool.handler({
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('ralph');
    });

    it('should list active modes across sessions when session_id omitted', async () => {
      const sessionId = 'aggregate-session';
      await stateWriteTool.handler({
        mode: 'ultrawork',
        active: true,
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      const result = await stateListActiveTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('ultrawork');
      expect(result.content[0].text).toContain(sessionId);
    });

    it('should include team mode when team state is active', async () => {
      await stateWriteTool.handler({
        mode: 'team',
        active: true,
        state: { phase: 'team-exec' },
        workingDirectory: TEST_DIR,
      });

      const result = await stateListActiveTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('team');
    });

    it('should include team in status output when team state is active', async () => {
      await stateWriteTool.handler({
        mode: 'team',
        active: true,
        state: { phase: 'team-verify' },
        workingDirectory: TEST_DIR,
      });

      const result = await stateGetStatusTool.handler({
        mode: 'team',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Status: team');
      expect(result.content[0].text).toContain('**Active:** Yes');
    });
  });

  describe('state_get_status', () => {
    it('should return status for specific mode', async () => {
      const result = await stateGetStatusTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Status: ralph');
      expect(result.content[0].text).toContain('Active:');
    });

    it('should return all mode statuses when no mode specified', async () => {
      const result = await stateGetStatusTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('All Mode Statuses');
      expect(
        result.content[0].text.includes('[ACTIVE]') || result.content[0].text.includes('[INACTIVE]')
      ).toBe(true);
    });
  });

  describe('session_id parameter', () => {
    it('should write state with explicit session_id to session-scoped path', async () => {
      const sessionId = 'test-session-123';
      const result = await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true },
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      const sessionPath = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId, 'ultrawork-state.json');
      expect(existsSync(sessionPath)).toBe(true);
    });

    it('should read state with explicit session_id from session-scoped path', async () => {
      const sessionId = 'test-session-read';
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'ralph-state.json'),
        JSON.stringify({ active: true, session_id: sessionId })
      );

      const result = await stateReadTool.handler({
        mode: 'ralph',
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('active');
    });

    it('should clear session-specific state without affecting legacy', async () => {
      const sessionId = 'test-session-clear';

      // Create both legacy and session-scoped state
      writeFileSync(
        join(TEST_DIR, '.omc', 'state', 'ralph-state.json'),
        JSON.stringify({ active: true, source: 'legacy' })
      );
      const sessionDir = join(TEST_DIR, '.omc', 'state', 'sessions', sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'ralph-state.json'),
        JSON.stringify({ active: true, source: 'session' })
      );

      const result = await stateClearTool.handler({
        mode: 'ralph',
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('cleared');
      // Session-scoped file should be gone
      expect(existsSync(join(sessionDir, 'ralph-state.json'))).toBe(false);
      // Legacy file should remain
      expect(existsSync(join(TEST_DIR, '.omc', 'state', 'ralph-state.json'))).toBe(true);
    });
  });

  describe('session-scoped behavior', () => {
    it('should prevent cross-process state bleeding when session_id provided', async () => {
      // Simulate two processes writing to the same mode
      const processASessionId = 'pid-11111-1000000';
      const processBSessionId = 'pid-22222-2000000';

      // Process A writes
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true, task: 'Process A task' },
        session_id: processASessionId,
        workingDirectory: TEST_DIR,
      });

      // Process B writes
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true, task: 'Process B task' },
        session_id: processBSessionId,
        workingDirectory: TEST_DIR,
      });

      // Process A reads its own state
      const resultA = await stateReadTool.handler({
        mode: 'ultrawork',
        session_id: processASessionId,
        workingDirectory: TEST_DIR,
      });
      expect(resultA.content[0].text).toContain('Process A task');
      expect(resultA.content[0].text).not.toContain('Process B task');

      // Process B reads its own state
      const resultB = await stateReadTool.handler({
        mode: 'ultrawork',
        session_id: processBSessionId,
        workingDirectory: TEST_DIR,
      });
      expect(resultB.content[0].text).toContain('Process B task');
      expect(resultB.content[0].text).not.toContain('Process A task');
    });

    it('should write state to legacy path when session_id omitted', async () => {
      await stateWriteTool.handler({
        mode: 'ultrawork',
        state: { active: true },
        workingDirectory: TEST_DIR,
      });

      const legacyPath = join(TEST_DIR, '.omc', 'state', 'ultrawork-state.json');
      expect(existsSync(legacyPath)).toBe(true);
    });
  });

  describe('并发写入保护', () => {
    it('多个并发写入应通过文件锁串行化', async () => {
      const writes = Array.from({ length: 3 }, (_, i) =>
        stateWriteTool.handler({
          mode: 'ralph',
          iteration: i,
          workingDirectory: TEST_DIR,
        })
      );

      const results = await Promise.all(writes);
      const successCount = results.filter(r => !r.isError).length;
      expect(successCount).toBeGreaterThan(0);

      const statePath = join(TEST_DIR, '.omc', 'state', 'ralph-state.json');
      expect(existsSync(statePath)).toBe(true);
    });
  });

  describe('损坏状态恢复', () => {
    it('state_read 应处理损坏的 JSON 并返回错误', async () => {
      const statePath = join(TEST_DIR, '.omc', 'state', 'ralph-state.json');
      writeFileSync(statePath, '{ invalid json }');

      const result = await stateReadTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toMatch(/JSON|parse|错误/i);
    });

    it('state_read 应处理空文件', async () => {
      const statePath = join(TEST_DIR, '.omc', 'state', 'ralph-state.json');
      writeFileSync(statePath, '');

      const result = await stateReadTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toMatch(/JSON|parse|错误|empty/i);
    });
  });

  describe('swarm 特殊处理', () => {
    it('state_read 应为 swarm 返回 SQLite 提示', async () => {
      const result = await stateReadTool.handler({
        mode: 'swarm',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('SQLite');
      expect(result.content[0].text).toContain('swarm.db');
    });

    it('state_write 应拒绝写入 swarm', async () => {
      const result = await stateWriteTool.handler({
        mode: 'swarm',
        active: true,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('SQLite');
    });
  });

  describe('路径遍历防护（P0 安全回归）', () => {
    it('state_read 应拒绝路径遍历攻击载荷并返回错误响应', async () => {
      const result = await stateReadTool.handler({
        mode: '../../etc/passwd' as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_write 应拒绝路径遍历攻击载荷并返回错误响应', async () => {
      const result = await stateWriteTool.handler({
        mode: '../state/evil' as any,
        state: { active: true },
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_read 应拒绝空字符串 mode', async () => {
      const result = await stateReadTool.handler({
        mode: '' as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_read 应接受 ralplan 作为合法模式（不被 assertValidMode 阻断）', async () => {
      const result = await stateReadTool.handler({
        mode: 'ralplan',
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('No state found');
    });

    it('state_write 应拒绝含 null 字节的 mode 参数', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph\x00../../etc' as any,
        state: { active: true },
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_clear 应拒绝路径遍历攻击载荷并返回错误响应', async () => {
      const result = await stateClearTool.handler({
        mode: '../../../evil' as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_clear 应拒绝空字符串 mode', async () => {
      const result = await stateClearTool.handler({
        mode: '' as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });

    it('state_clear 应接受 ralplan 作为合法模式（不被 assertValidMode 阻断）', async () => {
      const result = await stateClearTool.handler({
        mode: 'ralplan',
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('No state found');
    });

    it('state_read 应拒绝含路径分隔符的恶意 mode', async () => {
      const result = await stateReadTool.handler({
        mode: 'ralph/../../../etc/shadow' as any,
        workingDirectory: TEST_DIR,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    });
  });

  describe('state_write 参数合并', () => {
    it('显式参数应优先于 state 对象中的同名字段', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        iteration: 10,
        state: { active: false, iteration: 5, custom: 'value' },
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('"active": true');
      expect(result.content[0].text).toContain('"iteration": 10');
      expect(result.content[0].text).toContain('"custom": "value"');
    });

    it('应支持所有标准字段', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        iteration: 1,
        max_iterations: 10,
        current_phase: 'test-phase',
        task_description: 'test task',
        plan_path: '/path/to/plan',
        started_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T01:00:00Z',
        error: 'test error',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('"current_phase": "test-phase"');
      expect(result.content[0].text).toContain('"task_description": "test task"');
      expect(result.content[0].text).toContain('"plan_path": "/path/to/plan"');
    });
  });

  describe('state_list_active 多会话聚合', () => {
    it('无 session_id 时应聚合所有会话的活跃模式', async () => {
      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        session_id: 'session-1',
        workingDirectory: TEST_DIR,
      });

      await stateWriteTool.handler({
        mode: 'ultrawork',
        active: true,
        session_id: 'session-2',
        workingDirectory: TEST_DIR,
      });

      const result = await stateListActiveTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('ralph');
      expect(result.content[0].text).toContain('ultrawork');
      expect(result.content[0].text).toContain('session-1');
      expect(result.content[0].text).toContain('session-2');
    });

    it('应包含 ralplan 活跃状态', async () => {
      await stateWriteTool.handler({
        mode: 'ralplan',
        active: true,
        workingDirectory: TEST_DIR,
      });

      const result = await stateListActiveTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('ralplan');
    });
  });

  describe('state_get_status 详细信息', () => {
    it('应显示 session 特定状态的预览', async () => {
      const sessionId = 'status-test';
      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        iteration: 5,
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      const result = await stateGetStatusTool.handler({
        mode: 'ralph',
        session_id: sessionId,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Session: status-test');
      expect(result.content[0].text).toContain('**Active:** Yes');
      expect(result.content[0].text).toContain('State Preview');
    });

    it('无 session_id 时应显示 legacy 和活跃会话', async () => {
      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        workingDirectory: TEST_DIR,
      });

      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        session_id: 'test-session',
        workingDirectory: TEST_DIR,
      });

      const result = await stateGetStatusTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Legacy Path');
      expect(result.content[0].text).toContain('Active Sessions');
    });

    it('应包含 ralplan 在所有模式状态中', async () => {
      await stateWriteTool.handler({
        mode: 'ralplan',
        active: true,
        workingDirectory: TEST_DIR,
      });

      const result = await stateGetStatusTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('ralplan');
    });
  });

  describe('错误处理', () => {
    it('state_read 应处理不存在的目录', async () => {
      const result = await stateReadTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('No state found');
    });

    it('state_write 应成功创建目录结构', async () => {
      const result = await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
    });

    it('state_clear 应处理不存在的状态', async () => {
      const result = await stateClearTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('No state found');
    });
  });

  describe('state_read 多会话聚合', () => {
    it('无 session_id 时应显示 legacy 和所有会话状态', async () => {
      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        state: { source: 'legacy' },
        workingDirectory: TEST_DIR,
      });

      await stateWriteTool.handler({
        mode: 'ralph',
        active: true,
        state: { source: 'session-a' },
        session_id: 'session-a',
        workingDirectory: TEST_DIR,
      });

      const result = await stateReadTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Legacy Path');
      expect(result.content[0].text).toContain('Active Sessions');
      expect(result.content[0].text).toContain('session-a');
    });
  });

  describe('state_get_status 无活跃会话', () => {
    it('应显示无活跃会话提示', async () => {
      const result = await stateGetStatusTool.handler({
        mode: 'ralph',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('No active sessions');
    });
  });
});
