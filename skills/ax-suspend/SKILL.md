---
name: ax-suspend
description: "/ax-suspend — Axiom 暂停保存工作流：保存当前状态快照，安全退出会话"
triggers: ["ax-suspend", "suspend", "暂停任务", "保存退出", "save and exit"]
---

# Axiom 暂停保存工作流

本工作流在退出会话前保存完整的工作状态，确保下次会话可以无缝恢复。

**开始时宣告：** "I'm using the ax-suspend skill to save session state before exiting."

## 执行步骤

### Step 1: 收集当前状态

读取所有状态文件：
- `.omc/axiom/active_context.md` — 任务进度
- `.omc/state/axiom-context.json` — 状态机状态
- `.omc/axiom/evolution/learning_queue.md` — 待处理队列

### Step 2: 创建检查点

调用 axiom-context-manager：
```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="create_checkpoint")
```

### Step 3: 更新 active_context

将当前进行中的任务标记为 PENDING（而非 BLOCKED），记录暂停原因。

更新 `active_context.md` 的 `suspension_note` 字段：
```markdown
## 暂停记录
- 暂停时间: YYYY-MM-DD HH:MM
- 暂停原因: [用户主动暂停]
- 当前任务: T-xxx
- 下次恢复提示: [恢复时需要注意的事项]
```

### Step 4: 处理学习队列（可选）

若学习队列有 P0/P1 优先级素材，询问用户：
"检测到 X 条高优先级学习素材。是否在退出前处理？(Yes/No)"

### Step 5: 确认保存

输出保存摘要：
```
✓ 状态已保存
✓ 检查点已创建: checkpoint-xxx
✓ 当前任务: T-xxx (PENDING)
✓ 下次会话将自动恢复

下次启动时运行 /ax-status 查看状态。
```
