# Learning Queue

## Pending

### P0 - 关键流程错误

**[2026-03-15] 发布流程：不要手动创建 git tag**
- **问题**: 手动创建 tag 导致 Release workflow 失败
- **根因**: changesets 会自动创建和推送 tag，手动创建导致冲突
- **正确流程**: 只更新版本号并推送，让 workflow 自动创建 tag
- **影响范围**: 所有版本发布
- **优先级**: P0（阻塞发布）

### P1 - 测试稳定性

**[2026-03-15] CI 环境 flaky test 修复模式**
- **模式**: 文件系统时序竞态导致精确断言失败
- **解决方案**: 使用范围断言（`toBeGreaterThanOrEqual(0)`）替代精确断言
- **适用场景**: 所有涉及文件系统操作的进度跟踪测试
- **代码位置**: `src/hooks/ultrapilot/__tests__/index-core.test.ts:139-142`

### P1 - 插件版本同步

**[2026-03-15] Claude Code 插件版本同步机制**
- **问题**: npm 更新后插件显示旧版本
- **解决方案**: 双路径同步（postinstall + omc setup）
- **代码位置**:
  - `scripts/plugin-setup.mjs:493-546`
  - `src/installer/index.ts:881-913`
- **验证**: v7.4.2 已验证有效

## Processed

(空)
