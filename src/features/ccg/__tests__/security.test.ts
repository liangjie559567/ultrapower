import { describe, it, expect } from 'vitest';
import { sanitizeCCGInput, assertValidDocType } from '../input-sanitizer.js';
import { getDocPath, createDocFromTemplate } from '../doc-manager.js';

describe('CCG Security', () => {
  describe('Path Traversal Protection', () => {
    it('should reject path traversal in workingDir', () => {
      expect(() => sanitizeCCGInput({ workingDir: '../../../etc/passwd' }))
        .toThrow('Path traversal detected');
    });

    it('should reject null bytes in workingDir', () => {
      expect(() => sanitizeCCGInput({ workingDir: '/tmp/test\0/evil' }))
        .toThrow('Path traversal detected');
    });

    it('should reject invalid doc types', () => {
      expect(() => assertValidDocType('../../evil'))
        .toThrow('Invalid document type');
    });

    it('should reject doc type with path separators', () => {
      expect(() => getDocPath('../../../etc/passwd'))
        .toThrow('Invalid document type');
    });
  });

  describe('Input Sanitization', () => {
    it('should accept valid input', () => {
      const result = sanitizeCCGInput({
        workingDir: '/tmp/project',
        projectType: 'new'
      });
      expect(result.workingDir).toBe('/tmp/project');
      expect(result.projectType).toBe('new');
    });

    it('should reject unknown fields', () => {
      expect(() => sanitizeCCGInput({
        workingDir: '/tmp/project',
        evilField: 'malicious'
      })).toThrow('Invalid CCG input');
    });

    it('should reject oversized workingDir', () => {
      expect(() => sanitizeCCGInput({
        workingDir: 'a'.repeat(501)
      })).toThrow('Invalid CCG input');
    });
  });

  describe('Template Variable Sanitization', () => {
    it('should reject oversized variable keys', async () => {
      const vars = { ['a'.repeat(101)]: 'value' };
      await expect(createDocFromTemplate('requirements', vars))
        .rejects.toThrow('Template variable key too long');
    });

    it('should reject oversized variable values', async () => {
      const vars = { key: 'a'.repeat(10001) };
      await expect(createDocFromTemplate('requirements', vars))
        .rejects.toThrow('Template variable value too long');
    });

    it('should sanitize special characters in keys', async () => {
      const vars = { 'key<script>': 'value' };
      const result = await createDocFromTemplate('requirements', vars);
      expect(result).not.toContain('<script>');
    });
  });
});
