# GitHub Actions 配置指南

## 问题：Actions 无法创建 PR

**错误信息**: "GitHub Actions is not permitted to create or approve pull requests"

**原因**: 仓库设置中禁止了 GitHub Actions 创建或批准 PR（这是 GitHub 的默认安全设置）。

## 解决方案

### 1. 启用 Actions 创建 PR 权限

访问仓库设置页面：
```
https://github.com/liangjie559567/ultrapower/settings/actions
```

在 "Workflow permissions" 部分：
1. 选择 "Read and write permissions"
2. ✅ 勾选 "Allow GitHub Actions to create and approve pull requests"
3. 点击 "Save"

### 2. 验证 Workflow 权限配置

确认 `.github/workflows/release.yml` 包含必要权限：

```yaml
jobs:
  release:
    permissions:
      contents: write        # 推送提交和 tag
      pull-requests: write   # 创建 PR
      id-token: write        # npm provenance
```

### 3. 验证 NPM_TOKEN Secret

```bash
gh secret list -R liangjie559567/ultrapower
```

应该看到 `NPM_TOKEN` 在列表中。如果没有，添加：

```bash
# 1. 获取 npm token
cat ~/.npmrc | grep "_authToken=" | cut -d= -f2

# 2. 设置到 GitHub Secrets
gh secret set NPM_TOKEN -R liangjie559567/ultrapower
# 粘贴 token，回车确认
```

## 当前状态

- [x] Workflow 文件已配置权限（contents, pull-requests, id-token）
- [ ] 仓库设置需要手动启用 "Allow GitHub Actions to create and approve pull requests"
- [x] NPM_TOKEN secret 已配置

## 备用方案

如果无法修改仓库设置，使用手动发布流程：

```bash
npm run release:local
```

这会跳过 changesets PR 创建，直接发布到 npm 和 GitHub Release。
