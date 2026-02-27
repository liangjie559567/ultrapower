<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/project-session-manager/lib/providers/

## Purpose
PSM 代码托管平台集成目录。包含各主流代码托管平台的 shell 脚本适配器，实现统一的 issue/PR 查询接口。

## Key Files

| File | Description |
|------|-------------|
| `interface.sh` | 平台接口规范，定义所有 provider 必须实现的函数 |
| `github.sh` | GitHub API 集成，支持 issue 和 PR 查询 |
| `gitlab.sh` | GitLab API 集成 |
| `bitbucket.sh` | Bitbucket API 集成 |
| `azure-devops.sh` | Azure DevOps API 集成 |
| `gitea.sh` | Gitea API 集成（自托管 Git） |
| `jira.sh` | Jira 项目管理集成 |

## For AI Agents

### 修改此目录时
- 新增 provider 必须实现 `interface.sh` 中定义的所有函数
- 参见 `interface.sh` 了解必须实现的接口规范

## Dependencies

### Internal
- `skills/project-session-manager/lib/` — 父级库目录

<!-- MANUAL: -->
