---
name: finishing-a-development-branch
description: 当实现完成、所有测试通过，需要决定如何整合工作时使用 —— 通过呈现合并、PR 或清理的结构化选项来引导完成开发工作
---

# 完成开发分支

## 概述

通过呈现清晰选项并处理所选工作流来引导完成开发工作。

**核心原则：** 验证测试 → 呈现选项 → 执行选择 → 清理。

**开始时宣布：** "I'm using the finishing-a-development-branch skill to complete this work."

## 流程

### 步骤 1：验证测试

**呈现选项前，验证测试通过：**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**若测试失败：**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

停止。不要继续步骤 2。

**若测试通过：** 继续步骤 2。

### 步骤 2：确定基础分支

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

或询问："This branch split from main - is that correct?"

### 步骤 3：呈现选项

呈现以下 4 个选项：

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**不要添加解释** —— 保持选项简洁。

### 步骤 4：执行选择

#### 选项 1：本地合并

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

然后：清理 worktree（步骤 5）

#### 选项 2：推送并创建 PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

然后：清理 worktree（步骤 5）

#### 选项 3：保持原样

报告："Keeping branch <name>. Worktree preserved at <path>."

**不清理 worktree。**

#### 选项 4：丢弃

**先确认：**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

等待精确确认。

若已确认：
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

然后：清理 worktree（步骤 5）

### 步骤 5：清理 Worktree

**选项 1、2、4：**

检查是否在 worktree 中：
```bash
git worktree list | grep $(git branch --show-current)
```

若是：
```bash
git worktree remove <worktree-path>
```

**选项 3：** 保留 worktree。

## 快速参考

| 选项 | 合并 | 推送 | 保留 Worktree | 清理分支 |
|--------|-------|------|---------------|----------------|
| 1. 本地合并 | ✓ | - | - | ✓ |
| 2. 创建 PR | - | ✓ | ✓ | - |
| 3. 保持原样 | - | - | ✓ | - |
| 4. 丢弃 | - | - | - | ✓ (force) |

## 常见错误

**跳过测试验证**
- **问题：** 合并损坏的代码，创建失败的 PR
- **修复：** 呈现选项前始终验证测试

**开放式问题**
- **问题：** "What should I do next?" → 模糊
- **修复：** 呈现恰好 4 个结构化选项

**自动清理 worktree**
- **问题：** 在可能还需要时删除 worktree（选项 2、3）
- **修复：** 仅对选项 1 和 4 清理

**丢弃时无确认**
- **问题：** 意外删除工作
- **修复：** 要求输入 "discard" 确认

## 警示

**绝不：**
- 在测试失败时继续
- 不验证合并结果的测试就合并
- 不确认就删除工作
- 未经明确请求就强制推送

**始终：**
- 呈现选项前验证测试
- 呈现恰好 4 个选项
- 选项 4 需要输入确认
- 仅对选项 1 和 4 清理 worktree

## 集成

**被以下调用：**
- **subagent-driven-development**（步骤 7）—— 所有任务完成后
- **executing-plans**（步骤 5）—— 所有批次完成后

**配合使用：**
- **using-git-worktrees** —— 清理该 skill 创建的 worktree
