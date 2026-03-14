import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';
import { loadLocalTool, loadGlobalTool, listSkillsTool } from '../skills-tools.js';

let TEST_DIR: string;

vi.mock('../../hooks/learner/loader.js', () => ({
  loadAllSkills: vi.fn((projectRoot: string | null) => {
    if (projectRoot === null) {
      return [
        {
          metadata: {
            id: 'global-skill',
            name: 'Global Skill',
            description: 'A global skill',
            triggers: ['global'],
            tags: ['test'],
          },
          scope: 'user',
          relativePath: '~/.omc/skills/global-skill.md',
        },
      ];
    }
    return [
      {
        metadata: {
          id: 'project-skill',
          name: 'Project Skill',
          description: 'A project skill',
          triggers: ['project'],
        },
        scope: 'project',
        relativePath: '.omc/skills/project-skill.md',
      },
      {
        metadata: {
          id: 'global-skill',
          name: 'Global Skill',
          description: 'A global skill',
          triggers: ['global'],
          tags: ['test'],
        },
        scope: 'user',
        relativePath: '~/.omc/skills/global-skill.md',
      },
    ];
  }),
}));

describe('skills-tools', () => {
  beforeEach(() => {
    TEST_DIR = mkdtempSync(join(tmpdir(), 'skills-tools-test-'));
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('load_skills_local', () => {
    it('should load project skills from default cwd', async () => {
      const result = await loadLocalTool.handler({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Project Skills (1)');
      expect(result.content[0].text).toContain('project-skill');
      expect(result.content[0].text).toContain('Project Skill');
    });

    it('should load project skills from specified projectRoot', async () => {
      const result = await loadLocalTool.handler({ projectRoot: TEST_DIR });

      expect(result.content[0].text).toContain('Project Skills');
    });

    it('should reject path traversal in projectRoot', async () => {
      await expect(
        loadLocalTool.handler({ projectRoot: '../../../etc' })
      ).rejects.toThrow('path traversal not allowed');
    });

    it('should reject projectRoot outside allowed boundaries', async () => {
      await expect(
        loadLocalTool.handler({ projectRoot: '/etc/passwd' })
      ).rejects.toThrow('outside allowed directories');
    });
  });

  describe('load_skills_global', () => {
    it('should load global user skills', async () => {
      const result = await loadGlobalTool.handler({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Global User Skills (1)');
      expect(result.content[0].text).toContain('global-skill');
      expect(result.content[0].text).toContain('**Tags:** test');
    });
  });

  describe('list_skills', () => {
    it('should list all skills with project and user sections', async () => {
      const result = await listSkillsTool.handler({});

      expect(result.content[0].text).toContain('All Available Skills (2 total)');
      expect(result.content[0].text).toContain('Project Skills (1)');
      expect(result.content[0].text).toContain('User Skills (1)');
      expect(result.content[0].text).toContain('project-skill');
      expect(result.content[0].text).toContain('global-skill');
    });

    it('should handle empty skills list', async () => {
      const { loadAllSkills } = await import('../../hooks/learner/loader.js');
      vi.mocked(loadAllSkills).mockReturnValueOnce([]);

      const result = await listSkillsTool.handler({});

      expect(result.content[0].text).toContain('No Skills Found');
      expect(result.content[0].text).toContain('Searched:');
    });

    it('should validate projectRoot parameter', async () => {
      await expect(
        listSkillsTool.handler({ projectRoot: '../invalid' })
      ).rejects.toThrow('path traversal not allowed');
    });
  });
});
