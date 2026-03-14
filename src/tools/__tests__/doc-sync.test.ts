import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { docSyncTool } from '../doc-sync';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('doc-sync', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'doc-sync-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('extracts security rules from code comments', async () => {
    const sourceFile = join(testDir, 'source.ts');
    const targetDoc = join(testDir, 'doc.md');

    writeFileSync(sourceFile, `
/**
 * @security Validate all user inputs
 */
function validate() {}
`);
    writeFileSync(targetDoc, '# Documentation\n');

    const result = await docSyncTool.handler({ sourceFile, targetDoc });
    expect(result.content[0].text).toContain('Synced 1 rules');

    const updated = readFileSync(targetDoc, 'utf-8');
    expect(updated).toContain('Validate all user inputs');
  });

  it('returns message when no rules found', async () => {
    const sourceFile = join(testDir, 'source.ts');
    const targetDoc = join(testDir, 'doc.md');

    writeFileSync(sourceFile, 'function foo() {}');
    writeFileSync(targetDoc, '# Doc\n');

    const result = await docSyncTool.handler({ sourceFile, targetDoc });
    expect(result.content[0].text).toBe('No security rules found');
  });

  it('updates specific section when provided', async () => {
    const sourceFile = join(testDir, 'source.ts');
    const targetDoc = join(testDir, 'doc.md');

    writeFileSync(sourceFile, '/** @security Rule1 */\nfunction a() {}');
    writeFileSync(targetDoc, '# Doc\n\n## Security\n\nOld content\n\n## Other\n');

    await docSyncTool.handler({ sourceFile, targetDoc, section: 'Security' });

    const updated = readFileSync(targetDoc, 'utf-8');
    expect(updated).toContain('- Rule1');
    expect(updated).toContain('## Other');
  });

  it('handles file errors', async () => {
    const result = await docSyncTool.handler({
      sourceFile: '/nonexistent.ts',
      targetDoc: '/nonexistent.md'
    });
    expect(result.isError).toBe(true);
  });
});
