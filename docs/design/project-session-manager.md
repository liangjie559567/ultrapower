# Project Session Manager（PSM）- 设计文档

> **Skill 名称：** `project-session-manager`（别名：`psm`）
> **版本：** 1.0.0
> **作者：** ultrapower
> **状态：** 设计草稿

## 执行摘要

Project Session Manager（PSM）使用 git worktrees 和 tmux 会话与 Claude Code 自动创建和管理隔离的开发环境。它支持跨多个任务、项目和仓库的并行工作，同时保持清晰的隔离和便捷的上下文切换。

---

## 目录

1. [问题陈述](#1-问题陈述)
2. [使用场景](#2-使用场景)
3. [命令接口](#3-命令接口)
4. [架构](#4-架构)
5. [目录结构](#5-目录结构)
6. [会话命名规范](#6-会话命名规范)
7. [工作流预设](#7-工作流预设)
8. [状态管理](#8-状态管理)
9. [清理策略](#9-清理策略)
10. [集成点](#10-集成点)
11. [边缘情况与错误处理](#11-边缘情况与错误处理)
12. [安全考虑](#12-安全考虑)
13. [未来增强](#13-未来增强)

---

## 1. 问题陈述

### 当前痛点

1. **上下文切换开销**：在任务之间切换需要暂存更改、切换分支，并丢失 Claude Code 上下文
2. **PR 审查隔离**：审查 PR 经常污染工作目录
3. **并行工作限制**：每个仓库一次只能处理一个任务
4. **会话管理**：手动创建 tmux 会话繁琐且不一致
5. **清理负担**：孤立的 worktrees 和会话随时间积累

### 解决方案

PSM 提供统一接口来：
- 用单个命令创建隔离的 worktrees
- 生成预配置的带 Claude Code 的 tmux 会话
- 跟踪和管理所有活跃会话
- 自动清理已完成的工作

---

## 2. 使用场景

### 2.1 PR 审查

```bash
# 审查 ultrapower 仓库的 PR #123
/psm review omc#123

# 审查任意 GitHub URL 的 PR
/psm review https://github.com/anthropics/claude-code/pull/456

# 带特定关注点的审查
/psm review omc#123 --focus "security implications"
```

**发生了什么：**
1. 获取 PR 分支
2. 在 `~/.psm/worktrees/omc/pr-123` 创建 worktree
3. 生成 tmux 会话 `psm:omc:pr-123`
4. 启动预加载 PR 上下文的 Claude Code
5. 在编辑器中打开 diff（可选）

### 2.2 问题修复

```bash
# 修复问题 #42
/psm fix omc#42

# 使用分支名称覆盖修复
/psm fix omc#42 --branch fix/auth-timeout

# 从问题 URL 修复
/psm fix https://github.com/anthropics/claude-code/issues/789
```

**发生了什么：**
1. 通过 `gh` 获取问题详情
2. 从 main 创建功能分支
3. 在 `~/.psm/worktrees/omc/issue-42` 创建 worktree
4. 生成带问题上下文的 tmux 会话
5. 预填充 Claude Code 的问题描述

### 2.3 功能开发

```bash
# 开始新功能
/psm feature omc "add-webhook-support"

# 从现有分支开始功能
/psm feature omc --branch feature/webhooks

# 使用特定基础的功能
/psm feature omc "dark-mode" --base develop
```

**发生了什么：**
1. 从指定基础创建功能分支
2. 创建 worktree
3. 生成带功能上下文的会话
4. 可选创建草稿 PR

### 2.4 发布准备

```bash
# 准备发布
/psm release omc v3.5.0

# 发布候选版本
/psm release omc v3.5.0-rc1 --draft

# 热修复发布
/psm release omc v3.4.1 --hotfix --base v3.4.0
```

**发生了什么：**
1. 创建发布分支
2. 创建 worktree
3. 生成带发布清单的会话
4. 预加载 CHANGELOG 上下文

### 2.5 会话管理

```bash
# 列出所有会话
/psm list

# 列出特定项目的会话
/psm list omc

# 附加到现有会话
/psm attach omc:pr-123

# 分离当前会话（返回主界面）
/psm detach

# 终止特定会话
/psm kill omc:pr-123

# 终止项目的所有会话
/psm kill omc --all

# 清理已完成的会话
/psm cleanup

# 强制清理
/psm cleanup --force --older-than 7d
```

### 2.6 快速上下文切换

```bash
# 切换到另一个会话（分离当前，附加目标）
/psm switch omc:feature-auth

# 使用会话选择器切换（fzf）
/psm switch
```

---

## 3. 命令接口

### 3.1 主要命令

| 命令 | 描述 | 别名 |
|---------|-------------|---------|
| `review <ref>` | 开始 PR 审查会话 | `pr`, `r` |
| `fix <ref>` | 开始问题修复会话 | `issue`, `i` |
| `feature <name>` | 开始功能开发 | `feat`, `f` |
| `release <version>` | 开始发布准备 | `rel` |
| `list [project]` | 列出活跃会话 | `ls`, `l` |
| `attach <session>` | 附加到会话 | `a` |
| `detach` | 从当前分离 | `d` |
| `switch [session]` | 切换会话 | `sw`, `s` |
| `kill <session>` | 终止会话 | `k`, `rm` |
| `cleanup` | 清理已完成的 | `gc`, `clean` |
| `status` | 显示当前会话信息 | `st` |

### 3.2 全局标志

| 标志 | 描述 | 默认值 |
|------|-------------|---------|
| `--project`, `-p` | 项目标识符或路径 | 当前目录 |
| `--no-claude` | 跳过 Claude Code 启动 | false |
| `--no-tmux` | 使用当前终端 | false |
| `--editor`, `-e` | 之后在编辑器中打开 | false |
| `--verbose`, `-v` | 详细输出 | false |
| `--dry-run` | 显示将发生的操作 | false |

### 3.3 项目引用

PSM 支持多种引用格式：

```bash
# 短别名（需要 ~/.psm/projects.json 配置）
omc#123

# 完整 GitHub 引用
anthropics/claude-code#123

# GitHub URL
https://github.com/anthropics/claude-code/pull/123

# 本地路径
/path/to/repo#123

# 当前目录（隐式）
#123
```

### 3.4 项目别名配置

```json
// ~/.psm/projects.json
{
  "aliases": {
    "omc": {
      "repo": "anthropics/ultrapower",
      "local": "~/Workspace/ultrapower",
      "default_base": "main"
    },
    "cc": {
      "repo": "anthropics/claude-code",
      "local": "~/Workspace/claude-code",
      "default_base": "main"
    },
    "myapp": {
      "repo": "myorg/myapp",
      "local": "~/Projects/myapp",
      "default_base": "develop"
    }
  },
  "defaults": {
    "worktree_root": "~/.psm/worktrees",
    "cleanup_after_days": 14,
    "auto_cleanup_merged": true
  }
}
```

---

## 4. 架构

### 4.1 组件概览

```
┌─────────────────────────────────────────────────────────────┐
│                    PSM Skill Entry Point                     │
│                   /ultrapower:psm                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
    │  Command Parser │ │ State Store │ │ Project Resolver│
    │   (argparse)    │ │  (JSON DB)  │ │  (git/gh API)   │
    └─────────────────┘ └─────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │                   Session Orchestrator                   │
    └─────────────────────────────────────────────────────────┘
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
    │ Worktree Manager│ │Tmux Manager │ │ Claude Launcher │
    │   (git cmd)     │ │ (tmux cmd)  │ │  (claude cmd)   │
    └─────────────────┘ └─────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    Integration Layer                     │
    │  (gh CLI, git, tmux, claude, omc skills, Clawdbot)       │
    └─────────────────────────────────────────────────────────┘
```

### 4.2 会话生命周期

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  CREATING  │ ──▶ │   ACTIVE   │ ──▶ │  DETACHED  │ ──▶ │  ARCHIVED  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                  │                  │                  │
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
  - Fetch refs      - Claude active    - Session saved    - Worktree kept
  - Create worktree - Tmux attached    - Tmux running     - PR merged
  - Create branch   - Work in progress - Can resume       - Ready for GC
  - Start tmux
  - Launch claude
```

### 4.3 数据流

```
User Command
     │
     ▼
┌─────────────────┐
│ Parse Arguments │
└─────────────────┘
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│ Resolve Project │◀───▶│ projects.json   │
└─────────────────┘     └─────────────────┘
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│ Fetch Context   │◀───▶│ GitHub API (gh) │
│ (PR/Issue/etc)  │     └─────────────────┘
└─────────────────┘
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│ Create Worktree │◀───▶│ Git Repository  │
└─────────────────┘     └─────────────────┘
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│ Create Session  │◀───▶│ sessions.json   │
└─────────────────┘     └─────────────────┘
     │
     ▼
┌─────────────────┐
│ Launch Tmux +   │
│ Claude Code     │
└─────────────────┘
```

---

## 5. 目录结构

### 5.1 全局 PSM 目录

```
~/.psm/
├── config.json              # 全局配置
├── projects.json            # 项目别名
├── sessions.json            # 活跃会话注册表
├── templates/               # 会话模板
│   ├── pr-review.md         # PR 审查提示模板
│   ├── issue-fix.md         # 问题修复提示模板
│   ├── feature.md           # 功能开发模板
│   └── release.md           # 发布准备模板
├── logs/                    # 会话日志
│   └── psm.log
└── worktrees/               # 默认 worktree 位置
    ├── omc/                 # 按项目划分的 worktrees
    │   ├── pr-123/
    │   ├── issue-42/
    │   └── feature-auth/
    └── claude-code/
        └── pr-456/
```

### 5.2 每会话目录

```
~/.psm/worktrees/omc/pr-123/
├── .git                     # Git worktree 链接
├── .psm-session.json        # 会话元数据
├── .psm-context.md          # 预加载的 Claude 上下文
├── <project files>          # 实际代码
└── .omc/                    # OMC 状态（如适用）
```

### 5.3 会话元数据文件

```json
// .psm-session.json
{
  "id": "omc:pr-123",
  "type": "review",
  "project": "omc",
  "ref": "pr-123",
  "branch": "feature/add-hooks",
  "base": "main",
  "created_at": "2024-01-26T10:30:00Z",
  "last_accessed": "2024-01-26T14:45:00Z",
  "tmux_session": "psm:omc:pr-123",
  "worktree_path": "~/.psm/worktrees/omc/pr-123",
  "source_repo": "~/Workspace/ultrapower",
  "github": {
    "pr_number": 123,
    "pr_title": "Add webhook support",
    "pr_author": "contributor",
    "pr_url": "https://github.com/anthropics/ultrapower/pull/123"
  },
  "state": "active",
  "notes": []
}
```

---

## 6. 会话命名规范

### 6.1 Tmux 会话名称

格式：`psm:<project>:<type>-<identifier>`

| 类型 | 模式 | 示例 |
|------|---------|---------|
| PR 审查 | `psm:<proj>:pr-<num>` | `psm:omc:pr-123` |
| 问题修复 | `psm:<proj>:issue-<num>` | `psm:omc:issue-42` |
| 功能 | `psm:<proj>:feat-<name>` | `psm:omc:feat-auth` |
| 发布 | `psm:<proj>:rel-<ver>` | `psm:omc:rel-v3.5.0` |
| 通用 | `psm:<proj>:<name>` | `psm:omc:experiment` |

### 6.2 Worktree 目录名称

格式：`<type>-<identifier>`

| 类型 | 模式 | 示例 |
|------|---------|---------|
| PR 审查 | `pr-<num>` | `pr-123` |
| 问题修复 | `issue-<num>` | `issue-42` |
| 功能 | `feat-<name>` | `feat-auth` |
| 发布 | `rel-<ver>` | `rel-v3.5.0` |

### 6.3 分支名称

| 类型 | 模式 | 示例 |
|------|---------|---------|
| PR 审查 | （使用 PR 分支） | `feature/add-hooks` |
| 问题修复 | `fix/<issue>-<slug>` | `fix/42-auth-timeout` |
| 功能 | `feature/<name>` | `feature/auth` |
| 发布 | `release/<ver>` | `release/v3.5.0` |
| 热修复 | `hotfix/<ver>` | `hotfix/v3.4.1` |

---

## 7. 工作流预设

### 7.1 PR 审查预设

```yaml
name: pr-review
steps:
  - fetch_pr_info
  - create_worktree_from_pr_branch
  - generate_review_context:
      template: pr-review.md
      includes:
        - pr_description
        - changed_files_summary
        - commit_history
        - related_issues
  - spawn_tmux_session
  - launch_claude_with_context:
      initial_prompt: |
        You are reviewing PR #{{pr_number}}: {{pr_title}}

        Focus areas:
        - Code quality and patterns
        - Security implications
        - Test coverage
        - Documentation updates

        Changed files:
        {{changed_files}}
```

### 7.2 问题修复预设

```yaml
name: issue-fix
steps:
  - fetch_issue_info
  - create_branch_from_base
  - create_worktree
  - generate_fix_context:
      template: issue-fix.md
      includes:
        - issue_description
        - issue_labels
        - related_code_search
        - similar_issues
  - spawn_tmux_session
  - launch_claude_with_context:
      initial_prompt: |
        You are fixing issue #{{issue_number}}: {{issue_title}}

        Issue description:
        {{issue_body}}

        Labels: {{labels}}

        Potentially related files:
        {{related_files}}
```

### 7.3 功能开发预设

```yaml
name: feature-dev
steps:
  - create_feature_branch
  - create_worktree
  - generate_feature_context:
      template: feature.md
      includes:
        - project_structure
        - related_components
        - coding_standards
  - spawn_tmux_session
  - launch_claude_with_context:
      initial_prompt: |
        You are developing feature: {{feature_name}}

        Project context loaded. Ready to implement.

        Suggested starting point:
        {{suggested_files}}
```

### 7.4 发布准备预设

```yaml
name: release-prep
steps:
  - validate_version_format
  - create_release_branch
  - create_worktree
  - generate_release_context:
      template: release.md
      includes:
        - changelog_since_last_release
        - pending_prs
        - version_files
        - release_checklist
  - spawn_tmux_session
  - launch_claude_with_context:
      initial_prompt: |
        You are preparing release {{version}}

        Changes since last release:
        {{changelog}}

        Release checklist:
        - [ ] Update version in package.json
        - [ ] Update CHANGELOG.md
        - [ ] Run full test suite
        - [ ] Update documentation
        - [ ] Create release notes
```

---

## 8. 状态管理

### 8.1 会话注册表

```json
// ~/.psm/sessions.json
{
  "version": 1,
  "sessions": {
    "omc:pr-123": {
      "id": "omc:pr-123",
      "state": "active",
      "created_at": "2024-01-26T10:30:00Z",
      "last_accessed": "2024-01-26T14:45:00Z",
      "worktree": "~/.psm/worktrees/omc/pr-123",
      "tmux": "psm:omc:pr-123",
      "type": "review",
      "metadata": {
        "pr_number": 123,
        "pr_merged": false
      }
    },
    "omc:issue-42": {
      "id": "omc:issue-42",
      "state": "detached",
      "created_at": "2024-01-25T09:00:00Z",
      "last_accessed": "2024-01-25T18:00:00Z",
      "worktree": "~/.psm/worktrees/omc/issue-42",
      "tmux": "psm:omc:issue-42",
      "type": "fix",
      "metadata": {
        "issue_number": 42,
        "issue_closed": false
      }
    }
  },
  "stats": {
    "total_created": 45,
    "total_cleaned": 32,
    "active_count": 3
  }
}
```

### 8.2 状态转换

```
┌───────────┐
│  CREATING │ ─── on success ───▶ ACTIVE
└───────────┘
      │
      │ on failure
      ▼
┌───────────┐
│  FAILED   │ ─── cleanup ───▶ (removed)
└───────────┘

┌───────────┐
│  ACTIVE   │ ─── detach ───▶ DETACHED
└───────────┘
      │
      │ kill
      ▼
┌───────────┐
│ ARCHIVED  │ ─── cleanup ───▶ (removed)
└───────────┘

┌───────────┐
│ DETACHED  │ ─── attach ───▶ ACTIVE
└───────────┘
      │
      │ pr_merged / issue_closed / timeout
      ▼
┌───────────┐
│ ARCHIVED  │
└───────────┘
```

### 8.3 自动归档触发条件

以下情况会话自动转换为 ARCHIVED：

1. **PR 已合并**：GitHub webhook 或轮询检测到合并
2. **问题已关闭**：GitHub webhook 或轮询检测到关闭
3. **不活跃超时**：配置天数内无访问（默认：14 天）
4. **手动归档**：用户标记为完成

---

## 9. 清理策略

### 9.1 清理级别

| 级别 | 命令 | 清理内容 |
|-------|---------|----------------|
| 安全 | `/psm cleanup` | 已合并 PR、已关闭问题、已归档 |
| 适度 | `/psm cleanup --stale` | + 不活跃 > 14 天 |
| 激进 | `/psm cleanup --force` | + 所有已分离会话 |
| 彻底 | `/psm cleanup --all` | 全部（需确认） |

### 9.2 清理算法

```python
def cleanup(options):
    sessions = load_sessions()
    to_remove = []

    for session in sessions:
        should_remove = False

        # Level 1: Safe (always)
        if session.type == "review" and session.pr_merged:
            should_remove = True
        elif session.type == "fix" and session.issue_closed:
            should_remove = True
        elif session.state == "archived":
            should_remove = True

        # Level 2: Stale
        if options.stale:
            days_inactive = now() - session.last_accessed
            if days_inactive > options.older_than:
                should_remove = True

        # Level 3: Force
        if options.force:
            if session.state == "detached":
                should_remove = True

        if should_remove:
            to_remove.append(session)

    # Execute cleanup
    for session in to_remove:
        if not options.dry_run:
            kill_tmux_session(session.tmux)
            remove_worktree(session.worktree)
            remove_session_record(session.id)

        log(f"Cleaned: {session.id}")
```

### 9.3 清理保障措施

1. **未提交更改检查**：如果 worktree 有未提交更改则发出警告
2. **未推送提交检查**：如果本地提交未推送则发出警告
3. **活跃会话检查**：永不清理当前附加的会话
4. **确认提示**：用于激进/彻底清理
5. **演习模式**：始终预览将要清理的内容

### 9.4 定时清理

```json
// ~/.psm/config.json
{
  "cleanup": {
    "auto_enabled": true,
    "schedule": "daily",
    "level": "safe",
    "older_than_days": 14,
    "notify_before_cleanup": true
  }
}
```

---

## 10. 集成点

### 10.1 OMC Skill 集成

| OMC Skill | PSM 集成 |
|-----------|-----------------|
| `autopilot` | 可为隔离工作生成 PSM 会话 |
| `ultrawork` | 跨 PSM 会话的并行 agents |
| `ralph` | 每个 PSM 会话的持久性跟踪 |
| `git-master` | 感知 worktree 上下文 |
| `deepsearch` | 限定在会话 worktree 范围内 |

### 10.2 Clawdbot 集成

```typescript
// Clawdbot can manage PSM sessions
interface ClawdbotPSMIntegration {
  // List sessions via Clawdbot UI
  listSessions(): Promise<Session[]>;

  // Create session from Clawdbot
  createSession(options: SessionOptions): Promise<Session>;

  // Attach to session in new terminal
  attachSession(sessionId: string): Promise<void>;

  // Session status in Clawdbot dashboard
  getSessionStatus(sessionId: string): Promise<SessionStatus>;
}
```

### 10.3 GitHub 集成

| 功能 | 集成 |
|---------|-------------|
| PR 创建 | 从功能会话自动创建草稿 PR |
| PR 状态 | 跟踪合并状态以便清理 |
| 问题关联 | 自动将提交关联到问题 |
| 审查评论 | 将审查评论加载为上下文 |
| CI 状态 | 在会话信息中显示 CI 状态 |

### 10.4 编辑器集成

```bash
# VSCode
/psm review omc#123 --editor vscode

# Cursor
/psm review omc#123 --editor cursor

# Neovim
/psm review omc#123 --editor nvim
```

在 tmux 会话旁边的 worktree 目录中打开编辑器。

### 10.5 HUD 集成

OMC HUD 状态栏中的 PSM 状态：

```
[psm:omc:pr-123] 📋 Review | 🕐 2h active | 📁 ~/.psm/worktrees/omc/pr-123
```

---

## 11. 边缘情况与错误处理

### 11.1 常见边缘情况

| 场景 | 处理方式 |
|----------|----------|
| Worktree 已存在 | 提供选项：附加、重建或中止 |
| Tmux 会话名称冲突 | 追加时间戳后缀 |
| PR 分支被强制推送 | 警告并提供重新获取选项 |
| 网络离线 | 尽可能缓存，将 GitHub 操作加入队列 |
| 主仓库 git 脏状态 | 警告但允许（worktree 是隔离的） |
| Worktree 在不同文件系统 | 改用 git clone |
| 仓库非常大 | 浅克隆选项 |
| 会话元数据损坏 | 从 git/tmux 状态重建 |

### 11.2 错误恢复

```bash
# 从现有 worktrees 和 tmux 重建 sessions.json
/psm repair

# 修复孤立的 tmux 会话（无 worktree）
/psm repair --orphaned-tmux

# 修复孤立的 worktrees（无会话记录）
/psm repair --orphaned-worktrees

# 完整重建
/psm repair --full
```

### 11.3 冲突解决

```
用户运行：/psm review omc#123

发现已存在的会话！

选项：
  [A] 附加到现有会话（推荐）
  [R] 重建（销毁现有 worktree）
  [C] 创建并行会话（omc:pr-123-2）
  [Q] 退出
```

---

## 12. 安全考虑

### 12.1 凭据处理

- **GitHub Token**：使用现有 `gh` CLI 认证，PSM 从不存储
- **SSH 密钥**：依赖系统 SSH agent
- **Worktrees 中的密钥**：Worktrees 继承 .gitignore，密钥不会被复制

### 12.2 路径清理

```python
def sanitize_session_name(name: str) -> str:
    # Prevent path traversal
    name = name.replace("..", "")
    name = name.replace("/", "-")
    name = name.replace("\\", "-")
    # Limit length
    name = name[:64]
    # Alphanumeric + dash only
    name = re.sub(r'[^a-zA-Z0-9-]', '', name)
    return name
```

### 12.3 权限

- Worktree 目录：`0755`（用户 rwx，其他 rx）
- 会话元数据：`0600`（仅用户）
- 配置文件：`0600`（仅用户）

---

## 13. 未来增强

### 13.1 计划功能

| 功能 | 优先级 | 描述 |
|---------|----------|-------------|
| 会话模板 | 高 | 自定义工作流模板 |
| 团队共享 | 中 | 共享会话配置 |
| 会话录制 | 中 | 录制会话以供回放 |
| 云同步 | 低 | 跨机器同步会话 |
| 自动创建 PR | 中 | 会话完成时创建 PR |
| 会话指标 | 低 | 每会话时间跟踪 |

### 13.2 扩展点

```typescript
// Plugin interface for custom workflows
interface PSMPlugin {
  name: string;

  // Called before session creation
  beforeCreate?(context: SessionContext): Promise<void>;

  // Called after session creation
  afterCreate?(session: Session): Promise<void>;

  // Custom cleanup logic
  shouldCleanup?(session: Session): Promise<boolean>;

  // Custom context generation
  generateContext?(session: Session): Promise<string>;
}
```

### 13.3 潜在集成

- **Linear**：从 Linear 问题创建会话
- **Jira**：从 Jira 工单创建会话
- **Slack**：会话事件通知
- **Discord**：团队会话协调

---

## 附录 A：快速参考卡

```
┌────────────────────────────────────────────────────────────┐
│            Project Session Manager (PSM)                   │
├────────────────────────────────────────────────────────────┤
│ 创建会话                                                    │
│   /psm review <pr>      审查 PR                            │
│   /psm fix <issue>      修复问题                           │
│   /psm feature <name>   开始功能                           │
│   /psm release <ver>    准备发布                           │
├────────────────────────────────────────────────────────────┤
│ 管理会话                                                    │
│   /psm list             列出所有会话                       │
│   /psm attach <id>      附加到会话                         │
│   /psm switch [id]      切换会话                           │
│   /psm detach           分离当前                           │
│   /psm status           当前会话信息                       │
├────────────────────────────────────────────────────────────┤
│ 清理                                                        │
│   /psm cleanup          清理已合并/已关闭                  │
│   /psm kill <id>        终止特定会话                       │
│   /psm repair           修复损坏状态                       │
├────────────────────────────────────────────────────────────┤
│ 引用格式                                                    │
│   omc#123               项目别名 + 编号                    │
│   org/repo#123          完整 GitHub 引用                   │
│   https://...           GitHub URL                        │
└────────────────────────────────────────────────────────────┘
```

---

## 附录 B：配置参考

```json
// ~/.psm/config.json (complete)
{
  "version": 1,
  "worktree_root": "~/.psm/worktrees",
  "defaults": {
    "editor": "cursor",
    "launch_claude": true,
    "launch_tmux": true,
    "shallow_clone_depth": 100
  },
  "cleanup": {
    "auto_enabled": true,
    "schedule": "daily",
    "level": "safe",
    "older_than_days": 14,
    "notify_before_cleanup": true,
    "keep_archived_days": 7
  },
  "tmux": {
    "session_prefix": "psm",
    "default_layout": "main-vertical",
    "status_bar": true
  },
  "claude": {
    "auto_context": true,
    "context_template": "default",
    "model": "opus"
  },
  "github": {
    "poll_interval_minutes": 5,
    "auto_fetch_pr_reviews": true
  },
  "notifications": {
    "on_pr_merged": true,
    "on_issue_closed": true,
    "on_cleanup": true
  }
}
```

---

## 附录 C：示例会话记录

```bash
$ /psm review omc#123

🔍 Fetching PR #123 from ultrapower...
   Title: "Add webhook support for external integrations"
   Author: @contributor
   Changed: 12 files (+450, -23)

📁 Creating worktree at ~/.psm/worktrees/omc/pr-123...
   Branch: feature/webhook-support
   Base: main

🖥️  Creating tmux session: psm:omc:pr-123...

🤖 Launching Claude Code with PR context...

✅ Session ready!

   Session ID: omc:pr-123
   Worktree:   ~/.psm/worktrees/omc/pr-123
   Tmux:       psm:omc:pr-123

   Commands:
     /psm attach omc:pr-123  - Reattach later
     /psm kill omc:pr-123    - End session
     /psm cleanup            - Clean when PR merged

Attaching to session...
```

---

*Document Version: 1.0.0*
*Last Updated: 2024-01-26*
