import { describe, it, expect } from 'vitest';
import {
  detectEditError,
  injectEditErrorRecovery,
  handleEditErrorRecovery,
  processEditOutput
} from '../edit-error.js';

describe('Edit Error Recovery', () => {
  describe('detectEditError', () => {
    it('detects "oldString not found" error', () => {
      expect(detectEditError('Error: oldString not found in file')).toBe(true);
    });

    it('detects "old_string not found" error', () => {
      expect(detectEditError('Error: old_string not found')).toBe(true);
    });

    it('detects "oldString and newString must be different" error', () => {
      expect(detectEditError('oldString and newString must be different')).toBe(true);
    });

    it('detects "old_string and new_string must be different" error', () => {
      expect(detectEditError('old_string and new_string must be different')).toBe(true);
    });

    it('detects "oldString found multiple times" error', () => {
      expect(detectEditError('Error: oldString found multiple times')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(detectEditError('ERROR: OLDSTRING NOT FOUND')).toBe(true);
    });

    it('returns false for normal output', () => {
      expect(detectEditError('File updated successfully')).toBe(false);
    });
  });

  describe('injectEditErrorRecovery', () => {
    it('injects reminder when error detected', () => {
      const output = 'Error: oldString not found';
      const result = injectEditErrorRecovery(output);
      expect(result).toContain(output);
      expect(result).toContain('[EDIT ERROR - IMMEDIATE ACTION REQUIRED]');
    });

    it('does not inject reminder for normal output', () => {
      const output = 'File updated successfully';
      const result = injectEditErrorRecovery(output);
      expect(result).toBe(output);
    });
  });

  describe('handleEditErrorRecovery', () => {
    it('returns not attempted for non-Edit tools', () => {
      const result = handleEditErrorRecovery('Read', 'Error: oldString not found');
      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });

    it('handles Edit tool with error', () => {
      const result = handleEditErrorRecovery('Edit', 'Error: oldString not found');
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.errorType).toBe('edit_error');
      expect(result.message).toContain('[EDIT ERROR - IMMEDIATE ACTION REQUIRED]');
    });

    it('is case insensitive for tool name', () => {
      const result = handleEditErrorRecovery('EDIT', 'Error: oldString not found');
      expect(result.attempted).toBe(true);
      expect(result.success).toBe(true);
    });

    it('returns not attempted for Edit tool without error', () => {
      const result = handleEditErrorRecovery('Edit', 'File updated successfully');
      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
    });
  });

  describe('processEditOutput', () => {
    it('processes Edit tool output with error', () => {
      const output = 'Error: oldString not found';
      const result = processEditOutput('Edit', output);
      expect(result).toContain(output);
      expect(result).toContain('[EDIT ERROR - IMMEDIATE ACTION REQUIRED]');
    });

    it('does not process non-Edit tool output', () => {
      const output = 'Error: oldString not found';
      const result = processEditOutput('Read', output);
      expect(result).toBe(output);
    });

    it('is case insensitive for tool name', () => {
      const output = 'Error: oldString not found';
      const result = processEditOutput('edit', output);
      expect(result).toContain('[EDIT ERROR - IMMEDIATE ACTION REQUIRED]');
    });

    it('returns unchanged output for Edit tool without error', () => {
      const output = 'File updated successfully';
      const result = processEditOutput('Edit', output);
      expect(result).toBe(output);
    });
  });
});
