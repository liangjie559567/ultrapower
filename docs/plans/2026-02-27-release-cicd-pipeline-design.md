# 插件发布 CI/CD 流水线设计

**日期**：2026-02-27
**状态**：已批准
**方案**：C（GitHub Actions 主导 + 本地脚本备用，共享核心逻辑）

---

## 1. 背景与目标

### 问题陈述

当前 ultrapower 发布流程依赖手动执行 `skills/release/SKILL.md` 中的步骤：
- 手动更新版本号（多个文件）
- 手动运行 `npm publish`
- 手动创建 GitHub Release
- 手动更新 `marketplace.json`

这导致：
- 发布步骤容易遗漏（如 REFERENCE.md 双重数量声明 — k-047）
- 发布者机器环境依赖（NPM_TOKEN 本地配置）
- 无法并行执行独立步骤

### 目标

从 `git tag v*` 推送到完整发布，全自动化，同时保留本地执行能力用于调试和紧急发布。

---

## 2. 架构概览

```
发布触发
  └── git tag v5.3.0 && git push --tags
        │
        ├── GitHub Actions（主路径）
        │     .github/workflows/release.yml
        │     └── 调用 scripts/release-steps.mjs
        │
        └── 本地脚本（备用路径）
              scripts/release-local.mjs
              └── 调用 scripts/release-steps.mjs

共享核心
  scripts/release-steps.mjs
    ├── validateBuild()
    ├── publishNpm()
    ├── createGithubRelease()
    └── syncMarketplace()
```

### 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `.github/workflows/release.yml` | GitHub Actions 主流程 |
| 新增 | `scripts/release-steps.mjs` | 共享核心逻辑 |
| 新增 | `scripts/release-local.mjs` | 本地执行入口 |
| 修改 | `skills/release/SKILL.md` | 更新：说明 CI 接管后续步骤 |
| 修改 | `package.json` | 新增 `release:local` / `release:dry-run` scripts |

---

## 3. 共享核心：`scripts/release-steps.mjs`

### 接口设计

```javascript
/**
 * 步骤 1：构建验证
 * 执行 tsc --noEmit && npm run build && npm test
 */
export async function validateBuild(opts = {})
// opts: { skipTests?: boolean }
// 返回: { success: boolean, output: string }

/**
 * 步骤 2：npm 发布
 * 执行 npm publish --access public
 */
export async function publishNpm(opts = {})
// opts: { dryRun?: boolean, tag?: string }
// 返回: { success: boolean, version: string }

/**
 * 步骤 3：GitHub Release 创建
 * 执行 gh release create v{version} --generate-notes
 */
export async function createGithubRelease(opts = {})
// opts: { version: string, notes?: string, dryRun?: boolean }
// 返回: { success: boolean, url: string }

/**
 * 步骤 4：市场版本同步
 * 更新 .claude-plugin/marketplace.json version 字段 + git commit + push
 */
export async function syncMarketplace(opts = {})
// opts: { version: string, dryRun?: boolean }
// 返回: { success: boolean }

/**
 * 完整流水线（顺序执行全部 4 步）
 */
export async function runReleasePipeline(opts = {})
// opts: {
//   dryRun?: boolean,
//   skipTests?: boolean,
//   startFrom?: 'validate' | 'publish' | 'release' | 'sync'
// }
// 任一步骤失败则停止并以非零退出码退出
```

### 错误处理原则

- 每步失败输出明确错误信息（步骤名 + 错误内容 + 建议操作）
- 支持 `--start-from` 从失败步骤重试（跳过已完成步骤）
- dry-run 模式：打印将执行的命令，不实际执行

---

## 4. GitHub Actions Workflow

### 触发条件

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Job 依赖图

```
build-test
    │
    └── publish
          │
          ├── github-release
          └── marketplace-sync
```

- `build-test` → `publish`：串行（确保验证通过才发布）
- `publish` → `github-release`：串行（确保 npm 包存在才创建 Release）
- `publish` → `marketplace-sync`：并行（与 github-release 独立）

### Secrets 需求

| Secret | 用途 | 配置位置 |
|--------|------|---------|
| `NPM_TOKEN` | npm publish 权限 | GitHub repo Settings → Secrets |
| `GITHUB_TOKEN` | GitHub Release 创建 | Actions 内置，无需手动配置 |

### 关键配置

```yaml
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: node scripts/release-steps.mjs validate

  publish:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: node scripts/release-steps.mjs publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  github-release:
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/release-steps.mjs release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  marketplace-sync:
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: node scripts/release-steps.mjs sync
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 5. 本地脚本

### `scripts/release-local.mjs`

```javascript
// 用法:
//   node scripts/release-local.mjs
//   node scripts/release-local.mjs --dry-run
//   node scripts/release-local.mjs --start-from=publish
//   npm run release:local
//   npm run release:dry-run
```

### `package.json` 新增 scripts

```json
{
  "scripts": {
    "release:local": "node scripts/release-local.mjs",
    "release:dry-run": "node scripts/release-local.mjs --dry-run"
  }
}
```

---

## 6. 与现有 Release Skill 的分工

| 步骤 | 负责方 | 工具 |
|------|--------|------|
| 版本号更新（package.json、CHANGELOG、文档） | release skill（手动） | 编辑文件 |
| git commit + tag + push | release skill（手动） | git |
| npm publish | **GitHub Actions（自动）** | release-steps.mjs |
| GitHub Release 创建 | **GitHub Actions（自动）** | release-steps.mjs |
| marketplace.json 版本同步 | **GitHub Actions（自动）** | release-steps.mjs |

**`skills/release/SKILL.md` 更新说明**：在"发布步骤"末尾添加：
> 执行 `git push --tags` 后，GitHub Actions 自动接管后续步骤（npm 发布、GitHub Release、市场同步）。如需手动执行，运行 `npm run release:local`。

---

## 7. 测试策略

| 测试类型 | 覆盖内容 |
|---------|---------|
| 单元测试 | `release-steps.mjs` 各函数（mock exec） |
| dry-run 测试 | 验证 dry-run 模式不执行实际命令 |
| 集成测试 | GitHub Actions workflow 语法验证（`actionlint`） |
| 手动验证 | 首次发布时使用 `--dry-run` 预检 |

---

## 8. 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| NPM_TOKEN 过期 | CI 失败时发邮件通知，本地脚本作为备用 |
| marketplace-sync 提交冲突 | 使用 `git pull --rebase` 后再 push |
| 版本号不一致 | validateBuild 步骤检查 package.json vs git tag 一致性 |
| 网络超时 | 每步设置 timeout，失败后支持 `--start-from` 重试 |
