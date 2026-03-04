import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  isAllowedPath,
  isSourceFile,
  processOrchestratorPreTool,
  clearEnforcementCache
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-omc-orchestrator');

describe('omc-orchestrator hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
    clearEnforcementCache();
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    clearEnforcementCache();
  });

  it('should allow .omc paths', () => {
    expect(isAllowedPath('.omc/state/test.json')).toBe(true);
    expect(isAllowedPath('CLAUDE.md')).toBe(true);
    expect(isAllowedPath('src/index.ts')).toBe(false);
  });

  it('should detect source files', () => {
    expect(isSourceFile('src/index.ts')).toBe(true);
    expect(isSourceFile('README.md')).toBe(false);
  });

  it('should process pre-tool with enforcement off by default', () => {
    const result = processOrchestratorPreTool({
      toolName: 'Write',
      toolInput: { file_path: 'src/test.ts' },
      directory: TEST_DIR
    });
    expect(result.continue).toBe(true);
  });
});
