---
name: ax-context
description: "/ax-context — Axiom 上下文管理：读取/更新/保存记忆系统，维护任务状态"
triggers: ["ax-context", "context manager", "上下文管理", "读取记忆", "保存状态"]
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

创建以下文件（若不存在）：
- `.omc/axiom/active_context.md`
- `.omc/axiom/project_decisions.md`
- `.omc/axiom/user_preferences.md`
- `.omc/axiom/state_machine.md`
- `.omc/axiom/reflection_log.md`
- `.omc/axiom/evolution/knowledge_base.md`
- `.omc/axiom/evolution/pattern_library.md`
- `.omc/axiom/evolution/learning_queue.md`
- `.omc/axiom/evolution/workflow_metrics.md`
