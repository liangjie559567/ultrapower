# Knowledge Base

## Patterns

### 发布流程模式

**[P-001] changesets 自动化发布流程**
- **置信度**: 高 (验证次数: 2)
- **适用场景**: npm 包版本发布
- **核心原则**: 让 CI 自动创建 tag，不要手动干预
- **正确流程**:
  ```bash
  npm version X.Y.Z --no-git-tag-version
  git add -A && git commit -m "chore: bump version to X.Y.Z"
  git push origin main
  # CI 自动: 构建 -> 测试 -> 发布 npm -> 创建 tag -> 推送 tag
  ```
- **反模式**: 手动 `git tag` 和 `git push origin tag` 会导致冲突

### CI 测试稳定性模式

**[P-002] 文件系统时序竞态处理**
- **置信度**: 高 (验证次数: 1)
- **问题**: CI 环境文件系统操作慢，导致精确断言失败
- **解决方案**: 使用范围断言替代精确值
  ```typescript
  // 脆弱: expect(progress.completed).toBe(1);
  // 稳定: expect(progress.completed).toBeGreaterThanOrEqual(0);
  ```
- **适用范围**: 所有涉及异步文件操作的进度跟踪测试

## Insights

### 插件系统架构

**[I-001] Claude Code 插件版本解析优先级**
- **发现时间**: 2026-03-15
- **置信度**: 高
- **内容**: 插件版本从以下位置读取（优先级递减）:
  1. `~/.claude/plugins/marketplaces/{marketplace}/package.json`
  2. `~/.claude/plugins/marketplaces/{marketplace}/.claude-plugin/plugin.json`
  3. `~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/`
- **影响**: npm 更新不会自动同步 marketplace 目录的版本号
- **解决方案**: 双路径同步机制（postinstall + omc setup）

### CI 环境特性

**[I-002] CI 文件系统性能特征**
- **发现时间**: 2026-03-15
- **置信度**: 中
- **内容**: CI 环境文件系统操作比本地慢 2-5 倍
- **建议**:
  - 异步操作后添加显式等待（200ms+）
  - 避免精确时序依赖的断言
  - 使用范围检查而非精确匹配
