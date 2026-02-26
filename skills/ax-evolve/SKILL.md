---
name: ax-evolve
description: "/ax-evolve — Axiom 进化工作流：处理学习队列 → 更新知识库 → 模式检测 → 生成进化报告"
---

# Axiom 进化工作流

本工作流处理积累的学习素材，更新知识库和模式库。

**开始时宣告：** "I'm using the ax-evolve skill to process the learning queue and evolve."

## 触发时机

- **手动**：用户输入 `/ax-evolve`
- **自动**：状态变为 IDLE 且学习队列不为空

## 执行步骤

### Step 1: 读取学习队列

读取 `.omc/axiom/evolution/learning_queue.md`，按优先级排序（P0 > P1 > P2）。

### Step 2: 处理队列

调用 axiom-evolution-engine agent：

```
Task(subagent_type="ultrapower:axiom-evolution-engine", model="sonnet", prompt="处理以下学习队列并更新知识库：[队列内容]")
```

处理规则：
- `code_change` 类型：提取代码模式，检查是否达到提升阈值（3次）
- `error_fix` 类型：提取错误模式，更新 Known Issues
- `workflow_run` 类型：更新工作流指标，生成优化建议

### Step 3: 更新知识库

将高置信知识（confidence >= 0.8）持久化到 project_memory：

```
project_memory_add_note(category="architecture", content="[知识内容]")
project_memory_add_directive(directive="[高置信模式]", priority="high")
```

### Step 4: 模式检测

检查 `pattern_library.md`，提升满足条件的模式：
```
IF occurrences >= 3 AND confidence >= 0.7
THEN status = ACTIVE
```

### Step 5: 生成进化报告

输出进化报告，包含：
- 知识更新统计
- 新增/提升模式
- 工作流洞察
- 推荐下一步

### Step 6: 清理队列

删除已处理的学习素材（保留 7 天内的记录）。
