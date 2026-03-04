import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { processAxiomBoot, buildAxiomBootContext } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-axiom-boot');

describe('axiom-boot hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('processAxiomBoot', () => {
    it('should return false when axiom not enabled', () => {
      const result = processAxiomBoot({ workingDirectory: TEST_DIR });
      expect(result.contextInjected).toBe(false);
      expect(result.state).toBeNull();
    });

    it('should inject context when axiom enabled', () => {
      const axiomDir = join(TEST_DIR, '.omc', 'axiom');
      mkdirSync(axiomDir, { recursive: true });

      writeFileSync(
        join(axiomDir, 'active_context.md'),
        '当前状态: IDLE\n上次检查点: 无\n活跃任务: 无\n\nTest context'
      );

      const result = processAxiomBoot({ workingDirectory: TEST_DIR });
      expect(result.contextInjected).toBe(true);
      expect(result.state?.status).toBe('IDLE');
    });

    it('should detect EXECUTING state', () => {
      const axiomDir = join(TEST_DIR, '.omc', 'axiom');
      mkdirSync(axiomDir, { recursive: true });

      writeFileSync(
        join(axiomDir, 'active_context.md'),
        '当前状态: EXECUTING\n活跃任务: task-123\n\nExecuting task'
      );

      const result = processAxiomBoot({ workingDirectory: TEST_DIR });
      expect(result.state?.status).toBe('EXECUTING');
      expect(result.message).toContain('中断的任务');
    });
  });

  describe('buildAxiomBootContext', () => {
    it('should build context from memory files', () => {
      const axiomDir = join(TEST_DIR, '.omc', 'axiom');
      mkdirSync(axiomDir, { recursive: true });

      writeFileSync(join(axiomDir, 'active_context.md'), 'Active context');
      writeFileSync(join(axiomDir, 'project_decisions.md'), 'Decisions');
      writeFileSync(join(axiomDir, 'user_preferences.md'), 'Preferences');

      const context = buildAxiomBootContext(TEST_DIR);
      expect(context).toContain('Axiom 上下文');
      expect(context).toContain('Active context');
    });
  });
});
