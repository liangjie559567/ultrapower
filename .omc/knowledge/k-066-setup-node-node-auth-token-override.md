---
id: k-066
title: actions/setup-node@v4 registry-url NODE_AUTH_TOKEN Override Behavior
category: tooling
tags: [github-actions, ci-cd, npm-publish, secrets, node-auth-token, anti-pattern]
created: 2026-03-02
confidence: 0.95
references: [LQ-031, .github/workflows/release.yml, v5.5.8]
---

## Summary

`actions/setup-node@v4` 配置 `registry-url` 后，会为后续所有步骤自动注入 `NODE_AUTH_TOKEN=github.token`（masked 显示）。若 publish 步骤显式覆盖 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`，而 `NPM_TOKEN` secret 未设置，真实 token 被空字符串覆盖，npm publish 静默失败。

## Details

### 根因分析

1. `actions/setup-node@v4` 在检测到 `registry-url` 后，自动向 `.npmrc` 写入：
   ```
   //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
   ```
   并在环境变量层注入 `NODE_AUTH_TOKEN=${{ github.token }}`（GITHUB_TOKEN）。

2. publish 步骤若显式覆盖：
   ```yaml
   env:
     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```
   而仓库中 `NPM_TOKEN` secret 不存在，`${{ secrets.NPM_TOKEN }}` 展开为空字符串，覆盖掉 `github.token`，导致认证失败。

3. **静默失败**是最危险的特征：npm 不报 401，而是在认证层静默返回，CI 绿灯但包未发布。

### 正确配置

```yaml
# Step 1: setup-node 配置 registry-url
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    registry-url: 'https://registry.npmjs.org'

# Step 2: publish 步骤，确保 NPM_TOKEN secret 存在
- name: Publish to npm
  run: npm publish --access public
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 设置 NPM_TOKEN 的方法

```bash
# 从本地 .npmrc 提取 token 并设置到 GitHub Secrets
cat ~/.npmrc | grep "_authToken=" | cut -d= -f2 \
  | gh secret set NPM_TOKEN -R owner/repo
```

### 验证 Secret 是否存在

```bash
gh secret list -R owner/repo | grep NPM_TOKEN
```

### 反模式对照

| 场景 | 结果 |
|------|------|
| `NPM_TOKEN` secret 已设置，显式覆盖 | 正常发布 |
| `NPM_TOKEN` secret 未设置，显式覆盖 | 空字符串覆盖，静默失败 |
| 不覆盖，使用 `github.token` | 发布到 GitHub Package Registry（非 npm） |
| 不配置 `registry-url` | `.npmrc` 未写入 `_authToken`，认证丢失 |

## Prevention

- 在 CI 配置 `npm publish` 前，必须验证 `NPM_TOKEN` secret 存在（`gh secret list`）。
- 不要假设 `github.token` 等同于 npm 认证 token——两者作用域完全不同。
- publish job 发布后，增加验证步骤：`npm view <package>@<version>` 确认包已上传。
