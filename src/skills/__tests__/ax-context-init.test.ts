import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

describe('ax-context skill init command completeness', () => {
  it('init command contains actual execution instructions (Write or Task calls)', () => {
    const content = readFileSync(
      join(REPO_ROOT, 'skills', 'ax-context', 'SKILL.md'),
      'utf-8'
    );

    const initIndex = content.indexOf('### /ax-context init');
    expect(initIndex).toBeGreaterThan(-1);

    // Get the init section (up to next ### or end of file)
    const afterInit = content.slice(initIndex);
    const nextSectionIndex = afterInit.indexOf('\n### ', 1);
    const initSection =
      nextSectionIndex > -1 ? afterInit.slice(0, nextSectionIndex) : afterInit;

    // Must have actual execution instructions, not just a file list
    const hasWriteCall = /Write\s*\(/.test(initSection);
    const hasTaskCall = /Task\s*\(/.test(initSection);
    const hasStepInstructions = /^\d+\.\s+/m.test(initSection);

    expect(
      hasWriteCall || hasTaskCall || hasStepInstructions,
      `ax-context init section must contain execution instructions (Write(...), Task(...), or numbered steps). ` +
        `Current content only lists files without telling Claude how to create them, causing infinite retry loops.\n` +
        `Init section:\n${initSection}`
    ).toBe(true);
  });

  it('init command specifies file content templates, not just filenames', () => {
    const content = readFileSync(
      join(REPO_ROOT, 'skills', 'ax-context', 'SKILL.md'),
      'utf-8'
    );

    const initIndex = content.indexOf('### /ax-context init');
    const afterInit = content.slice(initIndex);
    const nextSectionIndex = afterInit.indexOf('\n### ', 1);
    const initSection =
      nextSectionIndex > -1 ? afterInit.slice(0, nextSectionIndex) : afterInit;

    // Should specify what to write into the files, not just list them
    const hasFileContent =
      /```/.test(initSection) || // code block with content
      /Write\s*\(/.test(initSection) || // Write() call
      /content|template|初始化内容|写入/i.test(initSection); // content description

    expect(
      hasFileContent,
      `ax-context init must specify file content/templates, not just filenames.\n` +
        `Init section:\n${initSection}`
    ).toBe(true);
  });
});
