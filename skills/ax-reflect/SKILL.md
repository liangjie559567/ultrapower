---
name: ax-reflect
description: "/ax-reflect — Axiom 反思工作流：会话总结 → 经验提取 → Action Items → 知识入队"
triggers: ["ax-reflect", "reflect", "反思", "总结", "session reflect"]
---

# Axiom 反思工作流

本工作流在任务完成后触发系统性反思，提取经验教训。

**开始时宣告：** "I'm using the ax-reflect skill to reflect on the completed work."

## 触发时机

- **自动**：状态从 EXECUTING 变为 ARCHIVING 时
- **手动**：用户输入 `/ax-reflect`

## 执行步骤

### Step 1: 读取会话数据

读取 `.omc/axiom/active_context.md`，收集：
- 任务完成情况（完成/失败/阻塞数量）
- 自动修复次数
- 回滚次数
- 耗时分布

### Step 2: 生成反思报告

调用 analyst agent：

```
Task(subagent_type="ultrapower:analyst", model="opus", prompt="基于以下会话数据生成反思报告：[会话数据]")
```

反思维度：
- What Went Well（做得好的）
- What Could Improve（可以改进的）
- Learnings（学到了什么）
- Action Items（待办事项）

### Step 3: 持久化

将反思报告追加到 `.omc/axiom/reflection_log.md`：

```markdown
## 反思 - YYYY-MM-DD HH:MM

### 做得好的
- [...]

### 可以改进的
- [...]

### 学到了什么
- [...]

### Action Items
- [ ] [REFLECTION] [待办事项]
```

### Step 4: Action Items 入队

将 Action Items 追加到 `active_context.md` 的任务队列，标记为 `[REFLECTION]`。

### Step 5: 知识入队

将高价值 Learnings 加入学习队列，等待 `/ax-evolve` 处理。
