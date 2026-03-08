import { describe, it, expect } from 'vitest';
import { getDocPath, createDocFromTemplate } from './doc-manager.js';
import * as path from 'path';

describe('doc-manager', () => {
  describe('getDocPath', () => {
    it('should return valid path for allowed doc types', () => {
      const validTypes = [
        'requirements',
        'tech-design',
        'feature-flow',
        'modification-plan',
        'optimization-list',
        'test-checklist',
        'dev-module',
      ];

      validTypes.forEach((type) => {
        const docPath = getDocPath(type);
        expect(docPath).toContain(`templates${path.sep}${type}.md`);
      });
    });

    it('should throw error for invalid doc type', () => {
      expect(() => getDocPath('invalid-type')).toThrow('Invalid document type');
    });

    it('should prevent path traversal attacks', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'requirements/../../../secret',
      ];

      maliciousInputs.forEach((input) => {
        expect(() => getDocPath(input)).toThrow('Invalid document type');
      });
    });
  });

  describe('createDocFromTemplate', () => {
    it('should replace template variables', async () => {
      const content = await createDocFromTemplate('requirements', {
        projectName: 'TestProject',
        timestamp: '2026-03-08',
        functionalRequirements: 'Feature A',
        nonFunctionalRequirements: 'Performance',
        acceptanceCriteria: 'All tests pass',
      });

      expect(content).toContain('TestProject');
      expect(content).toContain('2026-03-08');
      expect(content).toContain('Feature A');
    });

    it('should throw error for invalid template type', async () => {
      await expect(
        createDocFromTemplate('invalid', { projectName: 'Test' })
      ).rejects.toThrow('Invalid document type');
    });

    it('should handle missing variables gracefully', async () => {
      const content = await createDocFromTemplate('requirements', {
        projectName: 'TestProject',
      });

      expect(content).toContain('TestProject');
      expect(content).toContain('{{timestamp}}');
    });
  });
});
