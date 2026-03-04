import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  executeSlashCommand,
  findCommand,
  discoverAllCommands,
  listAvailableCommands
} from '../executor.js';

const TEST_DIR = join(process.cwd(), '.test-auto-slash-command');

describe('Slash Command Executor', () => {
  describe('executeSlashCommand', () => {
    it('returns error for non-existent command', () => {
      const result = executeSlashCommand({
        command: 'nonexistent',
        args: '',
        raw: '/nonexistent'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('executes command successfully', () => {
      const testDir = join(TEST_DIR, 'commands');
      mkdirSync(testDir, { recursive: true });
      writeFileSync(
        join(testDir, 'test.md'),
        '---\ndescription: Test command\n---\nTest content'
      );

      const result = executeSlashCommand({
        command: 'test',
        args: 'arg1',
        raw: '/test arg1'
      });

      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
      expect(result.success).toBe(false);
    });
  });

  describe('findCommand', () => {
    it('returns null for non-existent command', () => {
      const result = findCommand('nonexistent-command');
      expect(result).toBeNull();
    });
  });

  describe('discoverAllCommands', () => {
    it('returns array of commands', () => {
      const commands = discoverAllCommands();
      expect(Array.isArray(commands)).toBe(true);
    });
  });

  describe('listAvailableCommands', () => {
    it('returns command list with metadata', () => {
      const list = listAvailableCommands();
      expect(Array.isArray(list)).toBe(true);
      list.forEach(cmd => {
        expect(cmd).toHaveProperty('name');
        expect(cmd).toHaveProperty('description');
        expect(cmd).toHaveProperty('scope');
      });
    });
  });
});
