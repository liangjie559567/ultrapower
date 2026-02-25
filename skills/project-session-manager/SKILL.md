---
name: project-session-manager
description: 使用 git worktree 和 tmux 管理隔离开发环境
aliases: [psm]
---

# Project Session Manager (PSM) Skill

> **快速开始：** 如需简单创建 worktree 而不需要 tmux session，使用 `omc teleport`：
> ```bash
> omc teleport #123          # 为 issue/PR 创建 worktree
> omc teleport my-feature    # 为功能创建 worktree
> omc teleport list          # 列出 worktree
> ```
> 详见下方 [Teleport Command](#teleport-command)。

使用 git worktree 和 tmux session 配合 Claude Code 自动化隔离开发环境。支持跨多个任务、项目和仓库的并行工作。

## 命令

| 命令 | 描述 | 示例 |
|---------|-------------|---------|
| `review <ref>` | PR 审查 session | `/psm review omc#123` |
| `fix <ref>` | Issue 修复 session | `/psm fix omc#42` |
| `feature <proj> <name>` | 功能开发 | `/psm feature omc add-webhooks` |
| `list [project]` | 列出活跃 session | `/psm list` |
| `attach <session>` | 附加到 session | `/psm attach omc:pr-123` |
| `kill <session>` | 终止 session | `/psm kill omc:pr-123` |
| `cleanup` | 清理已合并/关闭的 | `/psm cleanup` |
| `status` | 当前 session 信息 | `/psm status` |

## 项目引用

支持的格式：
- **别名**: `omc#123`（需要 `~/.psm/projects.json`）
- **完整**: `owner/repo#123`
- **URL**: `https://github.com/owner/repo/pull/123`
- **当前**: `#123`（使用当前目录的仓库）

## 配置

### 项目别名 (`~/.psm/projects.json`)

```json
{
  "aliases": {
    "omc": {
      "repo": "liangjie559567/ultrapower",
      "local": "~/Workspace/ultrapower",
      "default_base": "main"
    }
  },
  "defaults": {
    "worktree_root": "~/.psm/worktrees",
    "cleanup_after_days": 14
  }
}
```

## Provider

PSM 支持多种 issue 追踪 provider：

| Provider | 所需 CLI | 引用格式 | 命令 |
|----------|--------------|-------------------|----------|
| GitHub（默认） | `gh` | `owner/repo#123`、`alias#123`、GitHub URL | review, fix, feature |
| Jira | `jira` | `PROJ-123`（需配置 PROJ）、`alias#123` | fix, feature |

### Jira 配置

使用 Jira 时，添加含 `jira_project` 和 `provider: "jira"` 的别名：

```json
{
  "aliases": {
    "mywork": {
      "jira_project": "MYPROJ",
      "repo": "mycompany/my-project",
      "local": "~/Workspace/my-project",
      "default_base": "develop",
      "provider": "jira"
    }
  }
}
```

**重要：** `repo` 字段仍需填写用于克隆 git 仓库。Jira 追踪 issue，但实际工作在 git repo 中进行。

非 GitHub 仓库使用 `clone_url` 替代：
```json
{
  "aliases": {
    "private": {
      "jira_project": "PRIV",
      "clone_url": "git@gitlab.internal:team/repo.git",
      "local": "~/Workspace/repo",
      "provider": "jira"
    }
  }
}
```

### Jira 引用检测

PSM 仅在 `PROJ` 已在别名中明确配置为 `jira_project` 时，才将 `PROJ-123` 格式识别为 Jira。这可防止 `FIX-123` 等分支名产生误判。

### Jira 示例

```bash
# 修复 Jira issue（MYPROJ 必须已配置）
psm fix MYPROJ-123

# 使用别名修复（推荐）
psm fix mywork#123

# 功能开发（与 GitHub 相同）
psm feature mywork add-webhooks

# 注意：'psm review' 不支持 Jira（无 PR 概念）
# Jira issue 请使用 'psm fix'
```

### Jira CLI 安装

安装 Jira CLI：
```bash
# macOS
brew install ankitpokhrel/jira-cli/jira-cli

# Linux
# 参见：https://github.com/ankitpokhrel/jira-cli#installation

# 配置（交互式）
jira init
```

Jira CLI 独立于 PSM 处理认证。

## 目录结构

```
~/.psm/
├── projects.json       # 项目别名
├── sessions.json       # 活跃 session 注册表
└── worktrees/          # Worktree 存储
    └── <project>/
        └── <type>-<id>/
```

## Session 命名

| 类型 | Tmux Session | Worktree 目录 |
|------|--------------|--------------|
| PR 审查 | `psm:omc:pr-123` | `~/.psm/worktrees/omc/pr-123` |
| Issue 修复 | `psm:omc:issue-42` | `~/.psm/worktrees/omc/issue-42` |
| 功能开发 | `psm:omc:feat-auth` | `~/.psm/worktrees/omc/feat-auth` |

---

## 实现协议

用户调用 PSM 命令时，遵循以下协议：

### 解析参数

解析 `{{ARGUMENTS}}` 以确定：
1. **子命令**：review、fix、feature、list、attach、kill、cleanup、status
2. **引用**：project#number、URL 或 session ID
3. **选项**：--branch、--base、--no-claude、--no-tmux 等

### 子命令：`review <ref>`

**用途**：创建 PR 审查 session

**步骤**：

1. **解析引用**：
   ```bash
   # 读取项目别名
   cat ~/.psm/projects.json 2>/dev/null || echo '{"aliases":{}}'

   # 解析引用格式：alias#num、owner/repo#num 或 URL
   # 提取：project_alias、repo (owner/repo)、pr_number、local_path
   ```

2. **获取 PR 信息**：
   ```bash
   gh pr view <pr_number> --repo <repo> --json number,title,author,headRefName,baseRefName,body,files,url
   ```

3. **确保本地仓库存在**：
   ```bash
   # 若本地路径不存在则克隆
   if [[ ! -d "$local_path" ]]; then
     git clone "https://github.com/$repo.git" "$local_path"
   fi
   ```

4. **创建 worktree**：
   ```bash
   worktree_path="$HOME/.psm/worktrees/$project_alias/pr-$pr_number"

   # 获取 PR 分支
   cd "$local_path"
   git fetch origin "pull/$pr_number/head:pr-$pr_number-review"

   # 创建 worktree
   git worktree add "$worktree_path" "pr-$pr_number-review"
   ```

5. **创建 session 元数据**：
   ```bash
   cat > "$worktree_path/.psm-session.json" << EOF
   {
     "id": "$project_alias:pr-$pr_number",
     "type": "review",
     "project": "$project_alias",
     "ref": "pr-$pr_number",
     "branch": "<head_branch>",
     "base": "<base_branch>",
     "created_at": "$(date -Iseconds)",
     "tmux_session": "psm:$project_alias:pr-$pr_number",
     "worktree_path": "$worktree_path",
     "source_repo": "$local_path",
     "github": {
       "pr_number": $pr_number,
       "pr_title": "<title>",
       "pr_author": "<author>",
       "pr_url": "<url>"
     },
     "state": "active"
   }
   EOF
   ```

6. **更新 session 注册表**：
   ```bash
   # 添加到 ~/.psm/sessions.json
   ```

7. **创建 tmux session**：
   ```bash
   tmux new-session -d -s "psm:$project_alias:pr-$pr_number" -c "$worktree_path"
   ```

8. **启动 Claude Code**（除非使用 --no-claude）：
   ```bash
   tmux send-keys -t "psm:$project_alias:pr-$pr_number" "claude" Enter
   ```

9. **输出 session 信息**：
   ```
   Session ready!

     ID: omc:pr-123
     Worktree: ~/.psm/worktrees/omc/pr-123
     Tmux: psm:omc:pr-123

   To attach: tmux attach -t psm:omc:pr-123
   ```

### 子命令：`fix <ref>`

**用途**：创建 issue 修复 session

**步骤**：

1. **解析引用**（同 review）

2. **获取 issue 信息**：
   ```bash
   gh issue view <issue_number> --repo <repo> --json number,title,body,labels,url
   ```

3. **创建功能分支**：
   ```bash
   cd "$local_path"
   git fetch origin main
   branch_name="fix/$issue_number-$(echo "$title" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | head -c 30)"
   git checkout -b "$branch_name" origin/main
   ```

4. **创建 worktree**：
   ```bash
   worktree_path="$HOME/.psm/worktrees/$project_alias/issue-$issue_number"
   git worktree add "$worktree_path" "$branch_name"
   ```

5. **创建 session 元数据**（类似 review，type="fix"）

6. **更新注册表、创建 tmux、启动 claude**（同 review）

### 子命令：`feature <project> <name>`

**用途**：开始功能开发

**步骤**：

1. **解析项目**（从别名或路径）

2. **创建功能分支**：
   ```bash
   cd "$local_path"
   git fetch origin main
   branch_name="feature/$feature_name"
   git checkout -b "$branch_name" origin/main
   ```

3. **创建 worktree**：
   ```bash
   worktree_path="$HOME/.psm/worktrees/$project_alias/feat-$feature_name"
   git worktree add "$worktree_path" "$branch_name"
   ```

4. **创建 session、tmux、启动 claude**（同上模式）

### 子命令：`list [project]`

**用途**：列出活跃 session

**步骤**：

1. **读取 session 注册表**：
   ```bash
   cat ~/.psm/sessions.json 2>/dev/null || echo '{"sessions":{}}'
   ```

2. **检查 tmux session**：
   ```bash
   tmux list-sessions -F "#{session_name}" 2>/dev/null | grep "^psm:"
   ```

3. **检查 worktree**：
   ```bash
   ls -la ~/.psm/worktrees/*/ 2>/dev/null
   ```

4. **格式化输出**：
   ```
   Active PSM Sessions:

   ID                 | Type    | Status   | Worktree
   -------------------|---------|----------|---------------------------
   omc:pr-123        | review  | active   | ~/.psm/worktrees/omc/pr-123
   omc:issue-42      | fix     | detached | ~/.psm/worktrees/omc/issue-42
   ```

### 子命令：`attach <session>`

**用途**：附加到已有 session

**步骤**：

1. **解析 session ID**：`project:type-number`

2. **验证 session 存在**：
   ```bash
   tmux has-session -t "psm:$session_id" 2>/dev/null
   ```

3. **附加**：
   ```bash
   tmux attach -t "psm:$session_id"
   ```

### 子命令：`kill <session>`

**用途**：终止 session 并清理

**步骤**：

1. **终止 tmux session**：
   ```bash
   tmux kill-session -t "psm:$session_id" 2>/dev/null
   ```

2. **移除 worktree**：
   ```bash
   worktree_path=$(jq -r ".sessions[\"$session_id\"].worktree" ~/.psm/sessions.json)
   source_repo=$(jq -r ".sessions[\"$session_id\"].source_repo" ~/.psm/sessions.json)

   cd "$source_repo"
   git worktree remove "$worktree_path" --force
   ```

3. **更新注册表**：
   ```bash
   # 从 sessions.json 中移除
   ```

### 子命令：`cleanup`

**用途**：清理已合并的 PR 和已关闭的 issue

**步骤**：

1. **读取所有 session**

2. **对每个 PR session，检查是否已合并**：
   ```bash
   gh pr view <pr_number> --repo <repo> --json merged,state
   ```

3. **对每个 issue session，检查是否已关闭**：
   ```bash
   gh issue view <issue_number> --repo <repo> --json closed,state
   ```

4. **清理已合并/关闭的 session**：
   - 终止 tmux session
   - 移除 worktree
   - 更新注册表

5. **报告**：
   ```
   Cleanup complete:
     Removed: omc:pr-123 (merged)
     Removed: omc:issue-42 (closed)
     Kept: omc:feat-auth (active)
   ```

### 子命令：`status`

**用途**：显示当前 session 信息

**步骤**：

1. **从 tmux 或 cwd 检测当前 session**：
   ```bash
   tmux display-message -p "#{session_name}" 2>/dev/null
   # 或检查 cwd 是否在 worktree 内
   ```

2. **读取 session 元数据**：
   ```bash
   cat .psm-session.json 2>/dev/null
   ```

3. **显示状态**：
   ```
   Current Session: omc:pr-123
   Type: review
   PR: #123 - Add webhook support
   Branch: feature/webhooks
   Created: 2 hours ago
   ```

---

## 错误处理

| 错误 | 解决方案 |
|-------|------------|
| Worktree 已存在 | 提供选项：附加、重建或中止 |
| PR 未找到 | 验证 URL/编号，检查权限 |
| 无 tmux | 警告并跳过 session 创建 |
| 无 gh CLI | 报错并提供安装说明 |

## Teleport 命令

`omc teleport` 命令提供完整 PSM session 的轻量替代方案。它创建 git worktree 而不管理 tmux session——适合快速隔离开发。

### 用法

```bash
# 为 issue 或 PR 创建 worktree
omc teleport #123
omc teleport owner/repo#123
omc teleport https://github.com/owner/repo/issues/42

# 为功能创建 worktree
omc teleport my-feature

# 列出已有 worktree
omc teleport list

# 移除 worktree
omc teleport remove issue/my-repo-123
omc teleport remove --force feat/my-repo-my-feature
```

### 选项

| 标志 | 描述 | 默认值 |
|------|-------------|---------|
| `--worktree` | 创建 worktree（默认，保留兼容性） | `true` |
| `--path <path>` | 自定义 worktree 根目录 | `~/Workspace/omc-worktrees/` |
| `--base <branch>` | 创建时的基础分支 | `main` |
| `--json` | 以 JSON 格式输出 | `false` |

### Worktree 布局

```
~/Workspace/omc-worktrees/
├── issue/
│   └── my-repo-123/        # Issue worktree
├── pr/
│   └── my-repo-456/        # PR 审查 worktree
└── feat/
    └── my-repo-my-feature/ # 功能 worktree
```

### PSM 与 Teleport 对比

| 功能 | PSM | Teleport |
|---------|-----|----------|
| Git worktree | 是 | 是 |
| Tmux session | 是 | 否 |
| Claude Code 启动 | 是 | 否 |
| Session 注册表 | 是 | 否 |
| 自动清理 | 是 | 否 |
| 项目别名 | 是 | 否（使用当前仓库） |

使用 **PSM** 进行完整托管 session。使用 **teleport** 快速创建 worktree。

---

## 依赖

必需：
- `git` - 版本控制（需 worktree 支持 v2.5+）
- `jq` - JSON 解析
- `tmux` - Session 管理（可选，但推荐）

可选（按 provider）：
- `gh` - GitHub CLI（用于 GitHub 工作流）
- `jira` - Jira CLI（用于 Jira 工作流）

## 初始化

首次运行时创建默认配置：

```bash
mkdir -p ~/.psm/worktrees ~/.psm/logs

# 若不存在则创建默认 projects.json
if [[ ! -f ~/.psm/projects.json ]]; then
  cat > ~/.psm/projects.json << 'EOF'
{
  "aliases": {
    "omc": {
      "repo": "liangjie559567/ultrapower",
      "local": "~/Workspace/ultrapower",
      "default_base": "main"
    }
  },
  "defaults": {
    "worktree_root": "~/.psm/worktrees",
    "cleanup_after_days": 14,
    "auto_cleanup_merged": true
  }
}
EOF
fi

# 若不存在则创建 sessions.json
if [[ ! -f ~/.psm/sessions.json ]]; then
  echo '{"version":1,"sessions":{},"stats":{"total_created":0,"total_cleaned":0}}' > ~/.psm/sessions.json
fi
```
