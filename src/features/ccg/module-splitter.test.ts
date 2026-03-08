import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { splitModificationPlan } from './module-splitter';

const testDir = path.join(__dirname, '__test_module_splitter__');

describe('module-splitter', () => {
  beforeEach(async () => {
    await fs.mkdir(path.join(testDir, '.omc', 'ccg'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should split modification plan into modules', async () => {
    const modPlan = `# Modification Plan

## 模块 A
### 职责
实现用户认证

### 实现
添加 JWT 验证

### 依赖
无

### 验收
登录成功

## 模块 B
### 职责
实现数据存储
`;

    await fs.writeFile(
      path.join(testDir, '.omc', 'ccg', 'modification-plan.md'),
      modPlan,
      'utf-8'
    );

    const files = await splitModificationPlan(testDir);

    expect(files.length).toBeGreaterThan(0);
    const content = await fs.readFile(files[0], 'utf-8');
    expect(content).toContain('开发模块');
  });

  it('should handle empty modification plan', async () => {
    await fs.writeFile(
      path.join(testDir, '.omc', 'ccg', 'modification-plan.md'),
      '# Modification Plan\n\n## 修改目标\n',
      'utf-8'
    );

    const files = await splitModificationPlan(testDir);

    expect(files.length).toBe(1);
  });
});
