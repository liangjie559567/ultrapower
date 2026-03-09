import { describe, it, expect } from 'vitest';
import { assignTask } from '../task-assigner.js';

describe('assignTask', () => {
  it('纯 UI 变更分配给 Gemini', () => {
    const files = ['src/App.tsx', 'src/Button.vue', 'styles.css'];
    const result = assignTask(files, 'feature');

    expect(result.model).toBe('gemini');
    expect(result.confidence).toBe(0.9);
    expect(result.reason).toContain('UI-only');
  });

  it('纯逻辑变更分配给 Codex', () => {
    const files = ['src/utils.ts', 'src/api.js'];
    const result = assignTask(files, 'bugfix');

    expect(result.model).toBe('codex');
    expect(result.confidence).toBe(0.9);
    expect(result.reason).toContain('Logic/test');
  });

  it('测试文件分配给 Codex', () => {
    const files = ['src/utils.test.ts', 'src/api.spec.js'];
    const result = assignTask(files, 'refactor');

    expect(result.model).toBe('codex');
    expect(result.confidence).toBe(0.9);
  });

  it('跨层变更分配给 Claude 协调', () => {
    const files = ['src/App.tsx', 'src/api.ts', 'src/utils.js'];
    const result = assignTask(files, 'feature');

    expect(result.model).toBe('claude');
    expect(result.confidence).toBe(0.85);
    expect(result.reason).toContain('Cross-layer');
  });

  it('空文件列表返回默认值', () => {
    const result = assignTask([], 'feature');

    expect(result.model).toBe('claude');
    expect(result.confidence).toBe(0.5);
  });
});
