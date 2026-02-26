---
name: ultraqa
description: QA 循环工作流 - 测试、验证、修复，重复直到达成目标
---

# UltraQA Skill

[ULTRAQA ACTIVATED - 自主 QA 循环]

## 概述

你现在处于 **ULTRAQA** 模式——一个自主 QA 循环工作流，持续运行直到达成质量目标。

**循环：** qa-tester → architect 验证 → 修复 → 重复

## 目标解析

从参数中解析目标。支持的格式：

| 调用方式 | 目标类型 | 检查内容 |
|----------|----------|----------|
| `/ultrapower:ultraqa --tests` | tests | 所有测试套件通过 |
| `/ultrapower:ultraqa --build` | build | 构建以 exit 0 成功 |
| `/ultrapower:ultraqa --lint` | lint | 无 lint 错误 |
| `/ultrapower:ultraqa --typecheck` | typecheck | 无 TypeScript 错误 |
| `/ultrapower:ultraqa --custom "pattern"` | custom | 输出中的自定义成功模式 |

如果未提供结构化目标，将参数解释为自定义目标。

## 循环工作流

### 第 N 轮（最多 5 轮）

1. **运行 QA**：根据目标类型执行验证
   - `--tests`：运行项目的测试命令
   - `--build`：运行项目的构建命令
   - `--lint`：运行项目的 lint 命令
   - `--typecheck`：运行项目的类型检查命令
   - `--custom`：运行适当命令并检查模式
   - `--interactive`：使用 qa-tester 进行交互式 CLI/服务测试：
     ```
     Task(subagent_type="ultrapower:qa-tester", model="sonnet", prompt="TEST:
     Goal: [describe what to verify]
     Service: [how to start]
     Test cases: [specific scenarios to verify]")
     ```

2. **检查结果**：目标是否通过？
   - **是** → 以成功消息退出
   - **否** → 继续步骤 3

3. **Architect 诊断**：生成 architect 分析失败原因
   ```
   Task(subagent_type="ultrapower:architect", model="opus", prompt="DIAGNOSE FAILURE:
   Goal: [goal type]
   Output: [test/build output]
   Provide root cause and specific fix recommendations.")
   ```

4. **修复问题**：应用 architect 的建议
   ```
   Task(subagent_type="ultrapower:executor", model="sonnet", prompt="FIX:
   Issue: [architect diagnosis]
   Files: [affected files]
   Apply the fix precisely as recommended.")
   ```

5. **重复**：返回步骤 1

## 退出条件

| 条件 | 行动 |
|------|------|
| **目标达成** | 以成功退出："ULTRAQA COMPLETE: Goal met after N cycles" |
| **达到第 5 轮** | 以诊断退出："ULTRAQA STOPPED: Max cycles. Diagnosis: ..." |
| **相同失败 3 次** | 提前退出："ULTRAQA STOPPED: Same failure detected 3 times. Root cause: ..." |
| **环境错误** | 退出："ULTRAQA ERROR: [tmux/port/dependency issue]" |

## 可观测性

每轮输出进度：
```
[ULTRAQA Cycle 1/5] Running tests...
[ULTRAQA Cycle 1/5] FAILED - 3 tests failing
[ULTRAQA Cycle 1/5] Architect diagnosing...
[ULTRAQA Cycle 1/5] Fixing: auth.test.ts - missing mock
[ULTRAQA Cycle 2/5] Running tests...
[ULTRAQA Cycle 2/5] PASSED - All 47 tests pass
[ULTRAQA COMPLETE] Goal met after 2 cycles
```

## 状态跟踪

在 `.omc/ultraqa-state.json` 中跟踪状态：
```json
{
  "active": true,
  "goal_type": "tests",
  "goal_pattern": null,
  "cycle": 1,
  "max_cycles": 5,
  "failures": ["3 tests failing: auth.test.ts"],
  "started_at": "2024-01-18T12:00:00Z",
  "session_id": "uuid"
}
```

## 取消

用户可以使用 `/ultrapower:cancel` 取消，这会清除状态文件。

## 重要规则

1. **尽可能并行** - 在准备潜在修复的同时运行诊断
2. **跟踪失败** - 记录每次失败以检测模式
3. **模式时提前退出** - 相同失败 3 次 = 停止并浮现
4. **清晰输出** - 用户应始终知道当前轮次和状态
5. **清理** - 完成或取消时清除状态文件

## 完成时的状态清理

**重要：完成时删除状态文件——不要只是设置 `active: false`**

当目标达成、达到最大轮次或提前退出时：

```bash
# 删除 ultraqa 状态文件
rm -f .omc/state/ultraqa-state.json
```

这确保未来 session 的干净状态。带 `active: false` 的过期状态文件不应留存。

---

立即开始 ULTRAQA 循环。解析目标并开始第 1 轮。
