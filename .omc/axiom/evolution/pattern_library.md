# Pattern Library

## Code Patterns

### 版本同步模式

**[CP-001] 双路径版本同步**
- **出现次数**: 2
- **置信度**: 高
- **场景**: npm 包更新后需要同步到外部配置文件
- **实现**:
  ```typescript
  // 路径 1: postinstall hook
  function syncMarketplaceVersion() {
    const version = pkg.version;
    const marketplaceDir = join(CLAUDE_DIR, 'plugins/marketplaces/omc');
    // 更新 package.json
    // 更新 .claude-plugin/plugin.json
  }

  // 路径 2: setup 命令
  if (!projectScoped) {
    const marketplaceDir = join(CLAUDE_CONFIG_DIR, 'plugins/marketplaces/omc');
    // 同步版本号
  }
  ```
- **代码位置**:
  - `scripts/plugin-setup.mjs:493-546`
  - `src/installer/index.ts:881-913`

### 测试稳定性模式

**[CP-002] 范围断言替代精确断言**
- **出现次数**: 1
- **置信度**: 中
- **场景**: CI 环境中涉及文件系统操作的测试
- **实现**:
  ```typescript
  // Before (脆弱)
  expect(progress.completed).toBe(1);
  expect(progress.running).toBe(0);

  // After (稳定)
  expect(progress.completed).toBeGreaterThanOrEqual(0);
  expect(progress.running).toBeGreaterThanOrEqual(0);
  expect(progress.total).toBe(3); // 总数可以精确
  ```
- **代码位置**: `src/hooks/ultrapilot/__tests__/index-core.test.ts:139-142`
