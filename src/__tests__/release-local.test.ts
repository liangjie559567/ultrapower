import { describe, it, expect } from 'vitest';
// @ts-ignore - .mjs runtime script outside rootDir
import { parseArgs } from '../../scripts/release-local.mjs';

describe('release-local parseArgs', () => {
  it('default: no flags', () => {
    const args = parseArgs([]);
    expect(args.dryRun).toBe(false);
    expect(args.startFrom).toBe('validate');
  });

  it('--dry-run flag', () => {
    const args = parseArgs(['--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('--start-from=publish', () => {
    const args = parseArgs(['--start-from=publish']);
    expect(args.startFrom).toBe('publish');
  });
});
