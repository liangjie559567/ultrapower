---
name: ax-context
description: "/ax-context — Axiom 上下文管理：读取/更新/保存记忆系统，维护任务状态"
---

# Axiom 上下文管理 Skill

本 skill 提供对 Axiom 记忆系统的直接操作接口。

**开始时宣告：** "I'm using the ax-context skill to manage the context."

## 命令

### /ax-context read
读取当前上下文，恢复现场。

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="read_context")
```

### /ax-context update [task_id] [status]
更新任务进度。

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="update_progress task_id=[T-xxx] status=[DONE/PENDING/BLOCKED] summary=[摘要]")
```

### /ax-context save [decision]
保存架构决策到长期记忆。

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="save_decision type=[Architecture/Lib/Rule] content=[决策内容]")
```

### /ax-context state [new_state]
更新状态机状态。

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="update_state new_state=[IDLE/PLANNING/EXECUTING/...]")
```

### /ax-context checkpoint
创建 Git 检查点。

```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="create_checkpoint")
```

### /ax-context init
初始化 Axiom 记忆系统（首次使用时）。

按以下步骤执行：

1. 使用 `Bash` 创建目录结构：
```
Bash("mkdir -p .omc/axiom/evolution")
```

2. 使用 `Write` 创建各文件（若不存在则创建，已存在则跳过）：

```
Write(".omc/axiom/active_context.md", "# Active Context\n\n## Current Task\n\n## Status\nIDLE\n\n## Last Updated\n")
Write(".omc/axiom/project_decisions.md", "# Project Decisions\n\n## Architecture Decisions\n\n## Library Choices\n\n## Rules\n")
Write(".omc/axiom/user_preferences.md", "# User Preferences\n\n## Communication Style\n\n## Workflow Preferences\n\n## Tool Preferences\n")
Write(".omc/axiom/state_machine.md", "# State Machine\n\nCurrent State: IDLE\n\n## Valid States\n- IDLE\n- PLANNING\n- CONFIRMING\n- EXECUTING\n- AUTO_FIX\n- BLOCKED\n- ARCHIVING\n")
Write(".omc/axiom/reflection_log.md", "# Reflection Log\n\n## Sessions\n")
Write(".omc/axiom/evolution/knowledge_base.md", "# Knowledge Base\n\n## Patterns\n\n## Insights\n")
Write(".omc/axiom/evolution/pattern_library.md", "# Pattern Library\n\n## Code Patterns\n")
Write(".omc/axiom/evolution/learning_queue.md", "# Learning Queue\n\n## Pending\n")
Write(".omc/axiom/evolution/workflow_metrics.md", "# Workflow Metrics\n\n## Sessions\n")
```

3. 完成后输出：`✅ Axiom 记忆系统初始化完成。`
