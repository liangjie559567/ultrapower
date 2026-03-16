# 开发体验文档

欢迎来到 ultrapower 开发体验文档。本目录包含帮助开发者快速诊断问题、遵循最佳实践的完整指南。

## 文档导航

### 📋 [故障排除指南](./troubleshooting-guide.md)
快速诊断和解决常见问题。

**包含内容**
- 状态污染问题诊断和修复
- 孤儿 agent 清理方法
- 状态验证失败处理
- `omc repair` 命令详细用法
- 预防措施和最佳实践

**快速开始**
```bash
omc repair                    # 交互式向导
omc repair --dry-run          # 预览修复
```

---

### 🎯 [最佳实践指南](./best-practices.md)
提高开发效率和代码质量的核心实践。

**包含内容**
- 工作流最佳实践（任务规划、代码审查、错误处理）
- 状态管理最佳实践（初始化、并发控制、备份）
- Agent 生命周期管理
- 代码质量标准（类型安全、路径安全、输入消毒）
- 测试策略和覆盖率目标
- 性能优化建议
- 调试技巧
- 提交和发布规范

**核心原则**
- 使用 Team 模式进行复杂任务
- 为并发工作创建独立 worktree
- 定期运行 `omc repair --validate-state`
- 使用 `/ultrapower:cancel` 正常退出

---

### ⚡ [快速参考卡片](./quick-reference.md)
常用命令和问题速查表。

**包含内容**
- omc repair 命令速查
- 状态管理命令
- Agent 管理命令
- 常见错误和解决方案
- 工作流速查
- 日志查看命令
- 紧急恢复步骤

**快速查找**
```bash
# 查看活跃状态
ls -la .omc/state/

# 验证状态完整性
omc repair --validate-state

# 清理孤儿 agent
omc repair --fix-orphan-agents
```

---

## 常见场景

### 我遇到了 "State already exists" 错误

→ 查看 [故障排除指南 - 状态污染](./troubleshooting-guide.md#1-状态污染state-pollution)

```bash
omc repair --fix-state-pollution
```

### 我想了解如何正确管理状态

→ 查看 [最佳实践指南 - 状态管理](./best-practices.md#状态管理最佳实践)

### 我需要快速查找一个命令

→ 查看 [快速参考卡片](./quick-reference.md)

### 我的 agent 任务超时了

→ 查看 [最佳实践指南 - Agent 生命周期](./best-practices.md#agent-生命周期最佳实践)

### 我想了解代码质量标准

→ 查看 [最佳实践指南 - 代码质量](./best-practices.md#代码质量最佳实践)

---

## 核心命令

### 诊断和修复

```bash
# 交互式诊断向导
omc repair

# 预览修复（推荐先运行）
omc repair --fix-state-pollution --dry-run

# 执行修复
omc repair --fix-state-pollution

# 验证状态完整性
omc repair --validate-state

# 清理孤儿 agent
omc repair --fix-orphan-agents
```

### 状态检查

```bash
# 查看活跃状态文件
ls -la .omc/state/

# 查看状态内容
cat .omc/state/autopilot-state.json | jq .

# 检查状态大小
du -sh .omc/state/
```

### 正常退出

```bash
# 使用 cancel 命令（推荐）
/ultrapower:cancel

# 不要直接 Ctrl+C（会导致状态污染）
```

---

## 工作流建议

### 启动新任务

1. 验证状态完整性
   ```bash
   omc repair --validate-state
   ```

2. 选择合适的执行模式
   - 简单任务：`/autopilot`
   - 复杂任务：`/team`
   - 并行任务：`/ultrawork`

3. 监控执行进度
   ```bash
   check_job_status <job-id>
   ```

### 完成任务

1. 使用 cancel 命令正常退出
   ```bash
   /ultrapower:cancel
   ```

2. 验证状态已清理
   ```bash
   ls -la .omc/state/
   ```

3. 定期清理孤儿 agent
   ```bash
   omc repair --fix-orphan-agents --dry-run
   ```

---

## 故障排除流程

```
遇到问题
  ↓
查看错误信息
  ↓
在快速参考卡片中查找
  ↓
按照故障排除指南诊断
  ↓
运行 omc repair --dry-run 预览
  ↓
执行修复
  ↓
验证问题已解决
```

---

## 相关文档

- [开发标准](../dev-standards/dev-standards.md)
- [Hook 执行顺序](../standards/hook-execution-order.md)
- [状态机规范](../standards/state-machine.md)
- [Agent 生命周期](../standards/agent-lifecycle.md)
- [运行时保护](../standards/runtime-protection.md)

---

## 获取帮助

- **查看命令帮助**：`omc repair --help`
- **查看日志**：`tail -f .omc/logs/*.log`
- **检查状态**：`cat .omc/state/<mode>-state.json | jq .`
- **提交 issue**：https://github.com/anthropics/ultrapower/issues

---

## 文档更新日期

- 最后更新：2026-03-16
- 版本：1.0
- 适用于：ultrapower v7.5.2+
