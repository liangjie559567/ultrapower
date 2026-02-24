---
name: pipeline
description: 将 agent 串联成顺序或分支工作流，支持数据传递
---

# Pipeline Skill

## 概述

pipeline skill 允许将多个 agent 串联成定义好的工作流，前一个 agent 的输出成为下一个 agent 的输入。这创建了强大的 agent 流水线，类似于 Unix 管道，但专为 AI agent 编排设计。

## 核心概念

### 1. 顺序流水线

最简单的形式：Agent A 的输出流向 Agent B，再流向 Agent C。

```
explore -> architect -> executor
```

**流程：**
1. explore agent 搜索代码库并产出发现
2. architect 接收发现并产出分析/建议
3. executor 接收建议并实施更改

### 2. 分支流水线

根据输出条件路由到不同 agent。

```
explore -> {
  if "complex refactoring" -> architect -> executor-high
  if "simple change" -> executor-low
  if "UI work" -> designer -> executor
}
```

### 3. 并行后合并流水线

并行运行多个 agent，合并其输出。

```
parallel(explore, document-specialist) -> architect -> executor
```

## 内置流水线预设

### Review 流水线
**用途：** 全面代码审查和实施

```
/pipeline review <task>
```

**阶段：**
1. `explore` - 查找相关代码和模式
2. `architect` - 分析架构和设计影响
3. `critic` - 审查和批评分析
4. `executor` - 在完整上下文下实施

**适用于：** 主要功能、重构、复杂更改

---

### Implement 流水线
**用途：** 带测试的计划实施

```
/pipeline implement <task>
```

**阶段：**
1. `planner` - 创建详细实施计划
2. `executor` - 执行计划
3. `tdd-guide` - 添加/验证测试

**适用于：** 需求明确的新功能

---

### Debug 流水线
**用途：** 系统化调试工作流

```
/pipeline debug <issue>
```

**阶段：**
1. `explore` - 定位错误位置和相关代码
2. `architect` - 分析根本原因
3. `build-fixer` - 应用修复并验证

**适用于：** Bug、构建错误、测试失败

---

### Research 流水线
**用途：** 外部研究 + 内部分析

```
/pipeline research <topic>
```

**阶段：**
1. `parallel(document-specialist, explore)` - 外部文档 + 内部代码
2. `architect` - 综合发现
3. `writer` - 记录建议

**适用于：** 技术决策、API 集成

---

### Refactor 流水线
**用途：** 安全、经过验证的重构

```
/pipeline refactor <target>
```

**阶段：**
1. `explore` - 查找所有用法和依赖
2. `architect-medium` - 设计重构策略
3. `executor-high` - 执行重构
4. `qa-tester` - 验证无回归

**适用于：** 架构更改、API 重新设计

---

### Security 流水线
**用途：** 安全审计和修复

```
/pipeline security <scope>
```

**阶段：**
1. `explore` - 查找潜在漏洞
2. `security-reviewer` - 审计并识别问题
3. `executor` - 实施修复
4. `security-reviewer-low` - 重新验证

**适用于：** 安全审查、漏洞修复

---

## 自定义流水线语法

### 基本顺序

```
/pipeline agent1 -> agent2 -> agent3 "task description"
```

**示例：**
```
/pipeline explore -> architect -> executor "add authentication"
```

### 指定模型

```
/pipeline explore:haiku -> architect:opus -> executor:sonnet "optimize performance"
```

### 带分支

```
/pipeline explore -> (
  complexity:high -> architect:opus -> executor-high:opus
  complexity:medium -> executor:sonnet
  complexity:low -> executor-low:haiku
) "fix reported issues"
```

### 带并行阶段

```
/pipeline [explore, document-specialist] -> architect -> executor "implement OAuth"
```

## 数据传递协议

流水线中每个 agent 从上一阶段接收结构化上下文：

```json
{
  "pipeline_context": {
    "original_task": "用户的原始请求",
    "previous_stages": [
      {
        "agent": "explore",
        "model": "haiku",
        "findings": "...",
        "files_identified": ["src/auth.ts", "src/user.ts"]
      }
    ],
    "current_stage": "architect",
    "next_stage": "executor"
  },
  "task": "此 agent 的具体任务"
}
```

## 错误处理

### 重试逻辑

当 agent 失败时，流水线可以：

1. **重试** - 重新运行同一 agent（最多 3 次）
2. **跳过** - 以部分输出继续到下一阶段
3. **中止** - 停止整个流水线
4. **回退** - 路由到备用 agent

**配置：**

```
/pipeline explore -> architect -> executor --retry=3 --on-error=abort
```

### 错误恢复模式

**模式 1：回退到更高级别**
```
executor-low -> on-error -> executor:sonnet
```

**模式 2：咨询 architect**
```
executor -> on-error -> architect -> executor
```

**模式 3：人工介入**
```
any-stage -> on-error -> pause-for-user-input
```

## 流水线状态管理

流水线在 `.omc/pipeline-state.json` 中维护状态：

```json
{
  "pipeline_id": "uuid",
  "name": "review",
  "active": true,
  "current_stage": 2,
  "stages": [
    {
      "name": "explore",
      "agent": "explore",
      "model": "haiku",
      "status": "completed",
      "output": "..."
    },
    {
      "name": "architect",
      "agent": "architect",
      "model": "opus",
      "status": "in_progress",
      "started_at": "2026-01-23T10:30:00Z"
    },
    {
      "name": "executor",
      "agent": "executor",
      "model": "sonnet",
      "status": "pending"
    }
  ],
  "task": "原始用户任务",
  "created_at": "2026-01-23T10:25:00Z"
}
```

## 验证规则

流水线完成前，验证：

- [ ] 所有阶段成功完成
- [ ] 最终阶段的输出解决了原始任务
- [ ] 所有阶段无未处理错误
- [ ] 所有修改的文件通过 lsp_diagnostics
- [ ] 测试通过（如适用）

## 高级功能

### 条件分支

根据 agent 输出路由到不同路径：

```
explore -> {
  if files_found > 5 -> architect:opus -> executor-high:opus
  if files_found <= 5 -> executor:sonnet
}
```

### 循环结构

重复阶段直到满足条件：

```
repeat_until(tests_pass) {
  executor -> qa-tester
}
```

### 合并策略

并行 agent 完成时：

- **concat**：连接所有输出
- **summarize**：使用 architect 汇总发现
- **vote**：使用 critic 选择最佳输出

## 使用示例

### 示例 1：功能实施
```
/pipeline review "add rate limiting to API"
```
→ 触发：explore → architect → critic → executor

### 示例 2：Bug 修复
```
/pipeline debug "login fails with OAuth"
```
→ 触发：explore → architect → build-fixer

### 示例 3：自定义链
```
/pipeline explore:haiku -> architect:opus -> executor:sonnet -> tdd-guide:sonnet "refactor auth module"
```

### 示例 4：研究驱动的实施
```
/pipeline research "implement GraphQL subscriptions"
```
→ 触发：parallel(document-specialist, explore) → architect → writer

## 取消

停止活跃流水线：

```
/pipeline cancel
```

或使用通用取消命令，它会自动检测活跃流水线。

## 与其他 Skill 集成

流水线可在其他 skill 中使用：

- **Ralph**：循环流水线直到验证完成
- **Ultrawork**：并行运行多个流水线
- **Autopilot**：将流水线作为构建块

## 最佳实践

1. **从预设开始** - 在创建自定义流水线之前使用内置流水线
2. **模型与复杂度匹配** - 不要在简单任务上浪费 opus
3. **保持阶段专注** - 每个 agent 应有一个明确的职责
4. **使用并行阶段** - 同时运行独立工作
5. **在检查点验证** - 使用 architect 或 critic 验证进度
6. **记录自定义流水线** - 保存成功的模式以便复用

## 故障排除

### 流水线挂起

**检查：** `.omc/pipeline-state.json` 中的当前阶段
**修复：** 使用 `/pipeline resume` 恢复或取消后重启

### Agent 反复失败

**检查：** 重试次数和错误消息
**修复：** 路由到更高级别 agent 或添加 architect 咨询

### 输出未传递

**检查：** agent 提示中的数据传递结构
**修复：** 确保每个 agent 都收到 `pipeline_context`

## 技术实现

流水线编排器：

1. **解析流水线定义** - 验证语法和 agent 名称
2. **初始化状态** - 创建 pipeline-state.json
3. **顺序执行阶段** - 使用 Task 工具生成 agent
4. **在阶段间传递上下文** - 为下一个 agent 结构化输出
5. **处理分支逻辑** - 评估条件并路由
6. **管理并行执行** - 生成并发 agent 并合并
7. **持久化状态** - 每个阶段后更新状态文件
8. **强制验证** - 完成前运行检查

## 完成时清理状态

**重要：完成时删除状态文件——不要只是设置 `active: false`**

当流水线完成（所有阶段完成或已取消）时：

```bash
# 删除流水线状态文件
rm -f .omc/state/pipeline-state.json
```

这确保未来会话的状态干净。不应留下 `active: false` 的陈旧状态文件。

## Skill 调用

此 skill 在以下情况激活：

- 用户输入 `/pipeline` 命令
- 用户提到"agent chain"、"workflow"、"pipe agents"
- 检测到模式："X then Y then Z"（包含 agent 名称）

**显式调用：**
```
/ultrapower:pipeline review "task"
```

**自动检测：**
```
"First explore the codebase, then architect should analyze it, then executor implements"
```
→ 自动创建流水线：explore → architect → executor
