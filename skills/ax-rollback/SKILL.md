---
name: ax-rollback
description: "/ax-rollback — Axiom 回滚工作流：回滚到最近检查点，恢复系统状态"
---

# Axiom 回滚工作流

本工作流将系统回滚到最近的稳定检查点。

**开始时宣告：** "I'm using the ax-rollback skill to rollback to the last checkpoint."

## 执行步骤

### Step 1: 读取检查点信息

读取 `.omc/axiom/active_context.md` 中的 `last_checkpoint` 字段。

显示可用检查点列表：
```bash
git tag -l "checkpoint-*" --sort=-version:refname | head -10
```

### Step 2: 用户确认

询问用户：
"检测到以下检查点：
- [checkpoint-xxx] - [时间]
- [checkpoint-yyy] - [时间]

确认回滚到 [最近检查点]？这将撤销该检查点之后的所有变更。(Yes/No)"

### Step 3: 执行回滚

用户确认后：

```bash
# 回滚代码
git reset --hard [checkpoint-tag]

# 更新状态
```

调用 axiom-context-manager：
```
Task(subagent_type="ultrapower:axiom-context-manager", model="sonnet", prompt="update_state IDLE，记录回滚操作")
```

### Step 4: 验证回滚

```bash
tsc --noEmit && npm run build
```

### Step 5: 更新记忆

将回滚事件记录到 `reflection_log.md`，并将回滚原因加入学习队列。

## 安全规则

- 回滚前必须用户确认
- 只能回滚到 `checkpoint-*` 标签，不能回滚到任意 commit
- 回滚后自动触发 CI 验证
