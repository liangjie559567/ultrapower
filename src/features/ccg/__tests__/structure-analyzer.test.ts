import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { analyzeProjectStructure } from '../structure-analyzer.js';
import type { TechStack } from '../tech-stack-detector.js';

describe('analyzeProjectStructure', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'structure-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('检测 monorepo 项目', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ workspaces: ['packages/*'] })
    );

    const techStack: TechStack = { language: 'typescript', frontend: 'none', backend: 'none' };
    const result = await analyzeProjectStructure(tmpDir, techStack);

    expect(result.structure).toBe('monorepo');
    expect(result.confidence).toBe(1.0);
  });

  it('检测前后端分离项目', async () => {
    fs.mkdirSync(path.join(tmpDir, 'client'));
    fs.mkdirSync(path.join(tmpDir, 'server'));

    const techStack: TechStack = { language: 'typescript', frontend: 'react', backend: 'express' };
    const result = await analyzeProjectStructure(tmpDir, techStack);

    expect(result.structure).toBe('fullstack-separated');
    expect(result.confidence).toBe(0.95);
  });

  it('检测单体全栈项目', async () => {
    const techStack: TechStack = { language: 'typescript', frontend: 'react', backend: 'express' };
    const result = await analyzeProjectStructure(tmpDir, techStack);

    expect(result.structure).toBe('fullstack-monolith');
    expect(result.confidence).toBe(0.9);
  });

  it('检测纯前端项目', async () => {
    const techStack: TechStack = { language: 'typescript', frontend: 'vue', backend: 'none' };
    const result = await analyzeProjectStructure(tmpDir, techStack);

    expect(result.structure).toBe('frontend-only');
    expect(result.confidence).toBe(0.95);
  });

  it('检测纯后端项目', async () => {
    const techStack: TechStack = { language: 'typescript', frontend: 'none', backend: 'nestjs' };
    const result = await analyzeProjectStructure(tmpDir, techStack);

    expect(result.structure).toBe('backend-only');
    expect(result.confidence).toBe(0.95);
  });
});
