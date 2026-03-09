---
id: k-067
title: GitHub Actions Default GITHUB_TOKEN Lacks contents:write Permission
category: workflow
tags: [github-actions, ci-cd, permissions, github-token, least-privilege, anti-pattern]
created: 2026-03-02
confidence: 0.95
references: [LQ-032, .github/workflows/release.yml, v5.5.8]
---

## Summary

GitHub Actions 默认 `GITHUB_TOKEN` 不包含 `contents: write` 权限。`gh release create` 和 `git push`（推送新分支）均需此权限，否则返回 HTTP 403。PR 创建额外需要 `pull-requests: write`。应在 job 级（而非 workflow 级）按最小权限原则声明。

## Details

### 默认权限说明

GitHub Actions `GITHUB_TOKEN` 默认权限（公开仓库/私有仓库均适用）：

| 权限 | 默认值 | 备注 |
| ------ | -------- | ------ |
| `contents` | `read` | 读取代码，不能写入/创建 release |
| `pull-requests` | `read` | 不能创建/更新 PR |
| `packages` | `read` | 不能发布 GitHub Packages |
| `issues` | `read` | 不能评论/关闭 issue |

### 需要提权的操作

| 操作 | 所需权限 |
| ------ | --------- |
| `gh release create` | `contents: write` |
| `git push` 新分支 | `contents: write` |
| `gh pr create` | `pull-requests: write` |
| `gh release upload`（附件） | `contents: write` |
| 写入 GitHub Pages | `pages: write` + `id-token: write` |

### 正确配置（job 级，最小权限）

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    # 在 job 级声明，而非 workflow 级
    permissions:
      contents: write       # 需要：gh release create, git push
      pull-requests: write  # 需要：gh pr create（若有 PR 步骤）

    steps:
      - name: Create GitHub Release
        run: gh release create v${{ env.VERSION }} --title "v${{ env.VERSION }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 反模式：在 workflow 级声明（过度授权）

```yaml

# 反模式：workflow 级声明影响所有 jobs，违反最小权限原则

permissions:
  contents: write

jobs:
  build: ...    # build job 不需要 write，但被授权了
  test: ...     # test job 不需要 write，但被授权了
  release: ...  # 只有这个 job 真正需要
```

### 多 job 场景的正确结构

```yaml

# workflow 级：设置最小默认值

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    # 继承 workflow 级：read-only，足够

  release:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: write        # 仅此 job 需要写权限
      pull-requests: write   # 仅此 job 需要 PR 权限
```

### 403 错误排查清单

当遇到 `Resource not accessible by integration` 或 HTTP 403 时：

1. 检查 job 级 `permissions` 是否声明了所需权限。
2. 检查 `GH_TOKEN` 或 `GITHUB_TOKEN` 是否正确传入命令。
3. 检查仓库设置：Settings > Actions > General > Workflow permissions 是否为 `Read and write permissions`（部分组织级设置会覆盖）。
4. Fork 仓库的 PR：外部 fork 的工作流无法访问 secrets，`GITHUB_TOKEN` 权限更受限。

## Prevention

* 新增 workflow job 时，首先确认该 job 需要的具体权限列表，在 job 级显式声明。

* CI 模板中不应在 workflow 顶层设置 `contents: write`，避免所有 job 被过度授权。

* 使用 `actionlint` 静态分析工具检查 workflow 权限配置。
