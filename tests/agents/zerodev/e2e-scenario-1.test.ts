import { describe, it, expect } from 'vitest';
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';
import { matchTemplate, generateCode } from '../../../src/agents/zerodev/code-generator';

describe('场景 1: 需求澄清 → 代码生成', () => {
  it('应该完成完整流程：用户输入 → 平台识别 → 需求提取 → 代码生成', () => {
    // Step 1: 用户输入
    const userInput = '我想做一个待办事项应用';

    // Step 2: 平台识别
    const platform = detectPlatform(userInput);
    expect(platform).toBe('web');

    // Step 3: 需求提取
    const requirements = extractRequirements(userInput);
    expect(requirements.functional).toContain('待办事项管理');

    // Step 4: 模板匹配
    const template = matchTemplate('CRUD 功能');
    expect(template).toBe('crud/rest-crud.ts.template');

    // Step 5: 代码生成
    const code = generateCode(template, { className: 'TodoService' });
    expect(code).toContain('export class TodoService');
    expect(code).toContain('create');
    expect(code).toContain('read');
    expect(code).toContain('update');
    expect(code).toContain('delete');
  });

  it('应该在 10 秒内完成需求澄清', () => {
    const start = Date.now();
    const platform = detectPlatform('我想做一个移动应用');
    const duration = Date.now() - start;

    expect(platform).toBe('mobile');
    expect(duration).toBeLessThan(10000);
  });
});
