import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectTechStack } from '../tech-stack-detector.js';

describe('detectTechStack', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tech-stack-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('检测 React + TypeScript + Vite 项目', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        devDependencies: { typescript: '^5.0.0', vite: '^5.0.0' }
      })
    );
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');

    const stack = await detectTechStack(tmpDir);

    expect(stack.frontend).toBe('react');
    expect(stack.language).toBe('typescript');
    expect(stack.buildTool).toBe('vite');
    expect(stack.backend).toBe('none');
  });

  it('检测 Vue + JavaScript 项目', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { vue: '^3.0.0' }
      })
    );

    const stack = await detectTechStack(tmpDir);

    expect(stack.frontend).toBe('vue');
    expect(stack.language).toBe('javascript');
    expect(stack.backend).toBe('none');
  });

  it('检测 NestJS 后端项目', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@nestjs/core': '^10.0.0', express: '^4.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      })
    );
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');

    const stack = await detectTechStack(tmpDir);

    expect(stack.backend).toBe('nestjs');
    expect(stack.language).toBe('typescript');
    expect(stack.frontend).toBe('none');
  });

  it('检测全栈项目', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          express: '^4.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          webpack: '^5.0.0'
        }
      })
    );
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');

    const stack = await detectTechStack(tmpDir);

    expect(stack.frontend).toBe('react');
    expect(stack.backend).toBe('express');
    expect(stack.language).toBe('typescript');
    expect(stack.buildTool).toBe('webpack');
  });

  it('无 package.json 时返回默认值', async () => {
    const stack = await detectTechStack(tmpDir);

    expect(stack.language).toBe('javascript');
    expect(stack.frontend).toBe('none');
    expect(stack.backend).toBe('none');
  });
});
