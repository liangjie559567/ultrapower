import { describe, it, expect } from 'vitest';
import { detectPlatform } from '../../../../dist/agents/zerodev/requirement-clarifier.js';
import { selectTechStack } from '../../../../dist/agents/zerodev/tech-selector.js';

describe('性能基准测试', () => {
  it('应该在 100ms 内处理单个需求', () => {
    const start = Date.now();
    const platform = detectPlatform('做一个网站');
    const techStack = selectTechStack('做一个网站', platform);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(platform).toBe('web');
    expect(techStack.frontend.length).toBeGreaterThan(0);
  });

  it('应该在 1s 内处理 100 个需求', () => {
    const start = Date.now();
    const requirements = Array(100).fill('做一个 API 服务');

    requirements.forEach(req => {
      const platform = detectPlatform(req);
      selectTechStack(req, platform);
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  it('应该在 50ms 内完成平台检测', () => {
    const testCases = [
      '做一个网站',
      '开发移动应用',
      '构建 API',
      '创建桌面应用',
      '开发浏览器插件'
    ];

    testCases.forEach(req => {
      const start = Date.now();
      detectPlatform(req);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
