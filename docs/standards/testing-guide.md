# Testing Guide

## 测试环境隔离模式

### 标准模式（推荐）

所有需要文件系统操作或 git 环境的测试必须使用隔离的测试目录：

```typescript
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, rmSync, existsSync } from 'fs';

describe('test suite', () => {
  const testDir = join(homedir(), '.omc', 'test-unique-name');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    try {
      require('child_process').execSync('git init', { cwd: testDir, stdio: 'ignore' });
    } catch (e) {
      // Ignore if git init fails
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should use testDir instead of process.cwd()', () => {
    const config = {
      workingDirectory: testDir  // ✅ 正确
      // workingDirectory: process.cwd()  // ❌ 错误
    };
  });
});
```

### 关键要素

1. **使用 `homedir()`**：确保路径在用户目录下
2. **唯一测试目录名**：避免并发测试冲突
3. **`beforeEach` 中初始化 git**：满足 worktree 检查
4. **`afterEach` 中清理**：避免测试污染
5. **使用 `testDir` 而非 `process.cwd()`**：CI 环境兼容

### 反模式

❌ **错误**：使用 `process.cwd()`
```typescript
const config = {
  workingDirectory: process.cwd()  // CI 中路径不可控
};
```

✅ **正确**：使用隔离的 `testDir`
```typescript
const testDir = join(homedir(), '.omc', 'test-my-feature');
const config = {
  workingDirectory: testDir
};
```

## 跨平台注意事项

### Windows vs Linux

* **路径分隔符**：使用 `path.join()` 而非手动拼接

* **`process.cwd()` 行为**：
  - Linux CI: `/home/runner/work/repo/repo`
  - Windows CI: `D:/a/repo/repo`
  - 两者都可能在 home 目录外部

### Git 环境

测试目录默认不是 git 仓库，需要显式初始化：

```typescript
beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' });
  } catch (e) {
    // Ignore if git not available
  }
});
```

## 相关知识

* [k-078: CI Test Environment Isolation Pattern](../../.omc/axiom/evolution/knowledge_base.md#k-078)

* [k-079: Batch Fix Same-Pattern Issues](../../.omc/axiom/evolution/knowledge_base.md#k-079)
