# Migration Guide - v5.5.18

**发布日期**: 2026-03-06

## 概述

v5.5.18 是一个稳定性和性能改进版本，**无破坏性变更**。所有 API 保持向后兼容。

## 升级步骤

### 1. 更新依赖

```bash
npm install ultrapower@5.5.18
# 或
yarn upgrade ultrapower@5.5.18
```

### 2. 验证安装

```bash
npm run build
npm test
```

所有 6249 个测试应通过，无回归。

## 行为变更

### Security 改进

#### permission-request Hook 阻塞模式
**变更**: 权限检查失败时现在返回 `continue: false`

**之前**:
```typescript
// 权限检查失败时无声降级
{ continue: true }
```

**之后**:
```typescript
// 权限检查失败时正确阻塞
{ continue: false }
```

**影响**: 需要权限的 hook 现在会被正确阻塞。如果你的代码依赖旧的无声降级行为，需要更新权限配置。

#### 环境变量验证
**变更**: Hook 执行中现在验证敏感环境变量

**影响**: 如果 hook 使用敏感环境变量，需确保它们在白名单中。

### Performance 改进

#### Worker 健康检查
**变更**: 健康检查延迟从 ~50ms 降低到 <10ms

**影响**: 无需代码变更，自动获得性能提升。

#### 构建时间
**变更**: 增量构建从 5.8s 优化到 2.4s

**影响**: 开发体验改进，无需代码变更。

## API 兼容性

### 工具返回类型扩展
**变更**: `GenericToolDefinition.handler` 返回类型现在支持 `isError` 字段

**之前**:
```typescript
interface ToolResponse {
  result?: unknown;
  error?: string;
}
```

**之后**:
```typescript
interface ToolResponse {
  result?: unknown;
  error?: string;
  isError?: boolean;
}
```

**影响**: 完全向后兼容。现有工具无需修改。

### HookInput 接口完整化
**变更**: HookInput 现在包含完整的 snake_case 字段

**新增字段**:
- `tool_name`: 工具名称
- `tool_input`: 工具输入
- `tool_response`: 工具响应
- `session_id`: 会话 ID
- `cwd`: 当前工作目录
- `hook_event_name`: Hook 事件名称

**影响**: Hook 处理器现在可以访问更多上下文信息。

## 测试覆盖率改进

| 模块 | 改进 | 新覆盖率 |
|------|------|---------|
| hooks guards | +64.70% | 97.05% |
| MCP Client | +100% | 100% |
| bridge-entry | +64% | 81.52% |
| memory-tools | +81.97% | 90.74% |
| notepad-tools | +79.23% | 89.61% |
| session-lock | +79% | 82.31% |

**影响**: 更高的代码质量和更少的 bug。

## 已知限制

### 性能优化（计划 v5.5.19）

以下优化计划在下一版本实现：

1. **状态文件缓存** - 减少 70-80% 文件 I/O
2. **Hook 异步 I/O** - 减少 60-70% 延迟
3. **数据库索引** - 减少 80-90% 查询时间

### 代码质量改进（计划 v5.5.20）

1. **路径解析重构** - 消除代码重复
2. **definitions.ts 拆分** - 改进可维护性
3. **API 文档完善** - 明确语义

## 故障排查

### 问题: Hook 执行被阻塞

**原因**: permission-request hook 权限检查失败

**解决方案**:
1. 检查 hook 权限配置
2. 确保用户有必要权限
3. 查看 hook 执行日志

### 问题: 构建失败

**原因**: 类型检查失败

**解决方案**:
```bash
npm run build -- --noEmit
npm test
```

### 问题: 内存占用高

**原因**: 旧版本的内存泄漏

**解决方案**: 升级到 v5.5.18，TimeoutManager 内存泄漏已修复。

## 回滚

如需回滚到 v5.5.17：

```bash
npm install ultrapower@5.5.17
npm run build
npm test
```

## 支持

- **文档**: https://github.com/ultrapower/docs
- **Issue**: https://github.com/ultrapower/issues
- **讨论**: https://github.com/ultrapower/discussions

## 更新日志

详见 [CHANGELOG.md](../CHANGELOG.md)
