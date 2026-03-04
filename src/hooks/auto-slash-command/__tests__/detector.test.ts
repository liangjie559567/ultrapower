import { describe, it, expect } from 'vitest';
import {
  detectSlashCommand,
  parseSlashCommand,
  removeCodeBlocks,
  isExcludedCommand,
  extractPromptText
} from '../detector.js';

describe('Slash Command Detector', () => {
  describe('parseSlashCommand', () => {
    it('parses command with arguments', () => {
      const result = parseSlashCommand('/test arg1 arg2');
      expect(result?.command).toBe('test');
      expect(result?.args).toBe('arg1 arg2');
    });

    it('parses command without arguments', () => {
      const result = parseSlashCommand('/test');
      expect(result?.command).toBe('test');
      expect(result?.args).toBe('');
    });

    it('returns null for non-slash text', () => {
      expect(parseSlashCommand('regular text')).toBeNull();
    });
  });

  describe('removeCodeBlocks', () => {
    it('removes code blocks from text', () => {
      const text = 'before ```code block``` after';
      expect(removeCodeBlocks(text)).toBe('before  after');
    });

    it('handles multiple code blocks', () => {
      const text = '```block1``` text ```block2```';
      expect(removeCodeBlocks(text)).toBe(' text ');
    });
  });

  describe('isExcludedCommand', () => {
    it('identifies excluded commands', () => {
      expect(isExcludedCommand('help')).toBe(true);
      expect(isExcludedCommand('clear')).toBe(true);
    });

    it('returns false for non-excluded commands', () => {
      expect(isExcludedCommand('custom-command')).toBe(false);
    });
  });

  describe('detectSlashCommand', () => {
    it('detects valid slash command', () => {
      const result = detectSlashCommand('/test args');
      expect(result?.command).toBe('test');
    });

    it('ignores commands in code blocks', () => {
      const result = detectSlashCommand('```/test```');
      expect(result).toBeNull();
    });

    it('returns null for excluded commands', () => {
      const result = detectSlashCommand('/help');
      expect(result).toBeNull();
    });
  });

  describe('extractPromptText', () => {
    it('extracts text from parts array', () => {
      const parts = [
        { type: 'text', text: 'hello' },
        { type: 'text', text: 'world' }
      ];
      expect(extractPromptText(parts)).toBe('hello world');
    });

    it('filters non-text parts', () => {
      const parts = [
        { type: 'text', text: 'hello' },
        { type: 'image' },
        { type: 'text', text: 'world' }
      ];
      expect(extractPromptText(parts)).toBe('hello world');
    });
  });
});
