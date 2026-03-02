# Contributing to ultrapower

## 开发流程

### 分支策略

- 基础分支：`dev`（不是 `main`）
- 所有 PR 目标：`dev`
- 从 `dev` 创建功能分支：`git checkout -b feat/xxx dev`

### 提交规范

格式：`type(scope): description`（英文）

类型：`feat` / `fix` / `chore` / `docs` / `refactor` / `test`

### 测试

```bash
npm test              # 运行全部测试
npm run test:run      # 单次运行（非 watch 模式）
npm run build         # TypeScript 编译
```

## CI/CD 配置

### 首次配置（新仓库必读）

GitHub Actions 自动发布依赖以下配置，**fork 或新仓库首次使用前必须手动完成**。

#### 1. 配置 NPM_TOKEN Secret

`NPM_TOKEN` 不会自动注入，必须手动添加：

```bash
# 获取本地 npm token
cat ~/.npmrc | grep "_authToken=" | cut -d= -f2

# 设置到 GitHub Secrets
gh secret set NPM_TOKEN -R <owner>/<repo>
```

> **原因**：`actions/setup-node@v4` 配置 `registry-url` 后会注入 `NODE_AUTH_TOKEN=github.token`。若 workflow 覆盖为 `${{ secrets.NPM_TOKEN }}` 而该 secret 未设置，npm publish 会静默失败。

#### 2. GITHUB_TOKEN 权限

`gh release create` 和 `git push` 需要 `contents: write` 权限。已在 workflow 的对应 job 级声明，无需额外配置。

若自定义 workflow，需在 job 级添加：

```yaml
permissions:
  contents: write
```

#### 3. 验证配置

```bash
gh secret list -R <owner>/<repo>
# 应看到 NPM_TOKEN
```

### CI 流水线结构

```
build-test → publish → github-release
                     ↘ marketplace-sync
```

- `build-test`：编译 + 测试（必须通过才继续）
- `publish`：npm 发布（需要 NPM_TOKEN）
- `github-release`：创建 GitHub Release（需要 contents:write）
- `marketplace-sync`：同步 marketplace.json（需要 contents:write）
