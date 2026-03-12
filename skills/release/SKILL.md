---
name: release
description: ultrapower 的自动化发布工作流
---

# Release Skill

自动化 ultrapower 的发布流程。

## 用法

```
/ultrapower:release <version>
```

示例：`/ultrapower:release 2.4.0` 或 `/ultrapower:release patch` 或 `/ultrapower:release minor`

## 发布清单

按顺序执行以下步骤：

### 1. 版本升级

在所有位置更新版本（**必须同步，缺一不可**）：

* `package.json`

* `src/installer/index.ts`（VERSION 常量）

* `src/__tests__/installer.test.ts`（预期版本）

* `.claude-plugin/plugin.json`

* `.claude-plugin/marketplace.json`（`"version"` 和 `"source.version"` 两处）

* `docs/CLAUDE.md`（`<!-- OMC:VERSION:X.Y.Z -->`）

* `CLAUDE.md`（`ultrapower vX.Y.Z 规范体系位于 \`docs/standards/\``）

* `README.md`（版本徽章和标题）

> ⚠️ `marketplace.json` 是安装器读取的入口，版本不同步会导致用户始终安装旧版本。
> ⚠️ `docs/CLAUDE.md` 是 `/ultrapower:omc-setup` 下载的模板，版本不同步会导致用户安装后显示旧版本号。
> ⚠️ `CLAUDE.md` 是开发规范文档，版本引用不同步会导致开发者参考错误的规范版本。
> ⚠️ `docs/REFERENCE.md` 存在两处数量声明（TOC 第 12 行 + 正文第 280 行），新增 skill/agent/hook 时必须同步更新两处，否则会出现文档内部不一致（k-047）。

### 2. 运行测试和验证

```bash
npm run test:run
npm run validate:skills
```
所有测试必须通过，所有 skill 必须有有效的 frontmatter。

### 3. 提交版本升级

```bash
git add -A
git commit -m "chore: Bump version to <version>"
```

### 4. 创建并推送 Tag

```bash
git tag v<version>
git push origin main
git push origin v<version>
```

### 4b. GitHub Actions 自动接管（推荐）

执行 `git push --tags` 后，GitHub Actions 自动接管后续步骤：

* **npm 发布**（`publish` job）

* **GitHub Release 创建**（`github-release` job）

* **marketplace.json 版本同步**（`marketplace-sync` job）

在 GitHub Actions 页面查看进度：<https://github.com/liangjie559567/ultrapower/actions>

如需手动执行（紧急发布或 CI 不可用）：
```bash
npm run release:local          # 完整流水线
npm run release:dry-run        # 预检（不实际执行）
npm run release:local -- --start-from=publish  # 从 publish 步骤重试
```

### 5. 刷新本地 marketplace 缓存（CI 已自动完成，手动备用）

```bash
claude plugin marketplace update omc
```
> 推送到 GitHub 后必须执行此步，否则本地安装器仍读取旧版 `marketplace.json`。

### 6. 发布到 npm（CI 已自动完成，手动备用）

```bash
npm publish --access public --no-provenance
```
> ⚠️ npm 不允许覆盖已发布版本，版本号必须先升级再发布。
> ⚠️ `--provenance` 仅在 GitHub Actions 中可用，本地发布必须使用 `--no-provenance`。

### 7. 创建 GitHub Release（CI 已自动完成，手动备用）

```bash
gh release create v<version> --title "v<version> - <title>" --notes "<release notes>"
```

### 8. 验证

* [ ] npm: <https://www.npmjs.com/package/@liangjie559567/ultrapower>

* [ ] GitHub: <https://github.com/liangjie559567/ultrapower/releases>

## 版本文件参考

| 文件 | 字段/行 |
| ------ | ------------ |
| `package.json` | `"version": "X.Y.Z"` |
| `src/installer/index.ts` | `export const VERSION = 'X.Y.Z'` |
| `src/__tests__/installer.test.ts` | `expect(VERSION).toBe('X.Y.Z')` |
| `.claude-plugin/plugin.json` | `"version": "X.Y.Z"` |
| `.claude-plugin/marketplace.json` | `"version": "X.Y.Z"` 和 `"source": { "version": "X.Y.Z" }` |
| `docs/CLAUDE.md` | `<!-- OMC:VERSION:X.Y.Z -->` |
| `CLAUDE.md` | `ultrapower vX.Y.Z 规范体系位于 \`docs/standards/\`` |
| `README.md` | 标题 + 版本徽章 |
| `docs/REFERENCE.md` | TOC 第 12 行 `[Skills (N Total)]` + 正文 `## Skills（共 N 个）` 两处数量必须一致 |

## 语义化版本

* **patch**（X.Y.Z+1）：Bug 修复、小改进

* **minor**（X.Y+1.0）：新功能，向后兼容

* **major**（X+1.0.0）：破坏性变更

## 注意事项

* 发布前始终运行测试

* 创建总结变更的发布说明

* 推送到 GitHub 后必须运行 `claude plugin marketplace update omc` 刷新本地缓存

* npm 不允许覆盖已发布版本，每次发布前必须升级版本号

* `.npmignore` 必须排除缓存目录（`ultrapower/`、`*.tgz`、`.claude/`），防止安装时产生无限嵌套

## .npmignore 必要内容

发布前确认 `.npmignore` 包含以下排除项：

```

# 防止缓存目录被打包（会导致安装时无限嵌套）

ultrapower/
.claude/
plugins/cache/
*.tgz
*.tar.gz
node_modules/
.git/
dist/
```

## 首次配置 CI Secrets（新仓库必读）

GitHub Actions 自动发布依赖以下 secrets，**首次使用前必须手动配置**：

### NPM_TOKEN（必须手动配置）

`GITHUB_TOKEN` 是 Actions 内置的，但 `NPM_TOKEN` **不会自动注入**，必须手动添加到仓库 Secrets。

```bash

# 1. 获取 npm token（从本地 .npmrc 读取）

cat ~/.npmrc | grep "_authToken=" | cut -d= -f2

# 2. 设置到 GitHub Secrets

gh secret set NPM_TOKEN -R <owner>/<repo>

# 粘贴上一步输出的 token，回车确认

```

> ⚠️ `actions/setup-node@v4` 配置 `registry-url` 后会注入 `NODE_AUTH_TOKEN=github.token`。若 workflow 显式覆盖为 `${{ secrets.NPM_TOKEN }}` 而该 secret 未设置，npm publish 会静默失败（k-066）。

### GITHUB_TOKEN 权限（job 级声明）

默认 `GITHUB_TOKEN` 无 `contents: write` 权限，`gh release create` 和 `git push` 会返回 HTTP 403。需在对应 job 级声明：

```yaml
jobs:
  github-release:
    permissions:
      contents: write   # gh release create 需要
  marketplace-sync:
    permissions:
      contents: write   # git push 需要
```

> ⚠️ 遵循最小权限原则，在 job 级而非 workflow 级声明（k-067）。

### 验证 Secrets 配置

```bash
gh secret list -R <owner>/<repo>

# 应看到 NPM_TOKEN 在列表中

```

## 故障排查

### 安装后 skill 无法识别

检查插件缓存路径是否正确：
```bash
ls ~/.claude/plugins/cache/omc/ultrapower/<version>/skills/
```
正确路径应直接包含 `skills/`、`dist/` 等目录。

### 缓存目录无限嵌套

症状：`cache/omc/ultrapower/5.x.x/ultrapower/5.x.x/ultrapower/...`

**根本原因（已确认）**：Claude Code 安装器的 `xF6(src, dest)` 函数存在 bug：
1. 先执行 `mkdir -p dest`（`dest = cache/omc/ultrapower/5.x.x`）
2. 再执行 `readdir(src)`（`src = cache/ultrapower`）
3. 由于 `dest` 是 `src` 的子目录，`readdir` 结果包含刚创建的 `ultrapower/` 子目录
4. 递归复制时把自身也复制进去，产生无限嵌套

**加剧因素**：`PM1()` 检查目标目录是否非空，非空则跳过复制（认为已缓存）。一旦嵌套产生，安装器永远不会自动修复。

**自动修复**：5.0.20+ 的 `postinstall` 脚本（`fixNestedCacheDir()`）会自动检测并修复任意深度嵌套。

手动修复步骤：
```bash

# 1. 清除嵌套的缓存目录

rm -rf ~/.claude/plugins/cache/omc

# 2. 清除 npm-cache（防止复用旧内容）

rm -rf ~/.claude/plugins/npm-cache

# 3. 刷新 marketplace 缓存

claude plugin marketplace update omc

# 4. 重新安装（postinstall 会自动修复任何残留嵌套）

claude plugin install omc@ultrapower
```

> ⚠️ `.npmignore` 中的 `ultrapower/` 排除项仍然必要，防止开发目录被打包进 npm 包。

### 安装后仍是旧版本

原因：本地 marketplace 缓存未更新，安装器读取的是旧版 `marketplace.json`。

修复：
```bash
claude plugin marketplace update omc
claude plugin uninstall omc@ultrapower
claude plugin install omc@ultrapower
```

### 安装后插件内容是旧版本（npm-cache 复用）

症状：插件缓存目录标注为新版本号（如 `5.0.17/`），但 `package.json` 内的 `version` 字段仍是旧版本（如 `5.0.11`）。

原因：`~/.claude/plugins/npm-cache/package.json` 中存储了 semver 范围（如 `"^5.0.11"`），Claude Code 安装器判断旧缓存满足该范围，直接复用旧文件而不重新下载。

验证：
```bash
cat ~/.claude/plugins/npm-cache/package.json

# 如果看到 "^5.0.11" 之类的旧版本范围，即为此问题

cat ~/.claude/plugins/cache/omc/ultrapower/5.0.17/package.json

# 如果 version 字段不是 5.0.17，确认是 npm-cache 复用导致

```

修复（完整清洁重装）：
```bash

# 1. 卸载插件

claude plugin uninstall omc@ultrapower

# 2. 清除 npm-cache（关键！仅清除插件缓存不够）

rm -rf ~/.claude/plugins/npm-cache

# 3. 清除插件缓存

rm -rf ~/.claude/plugins/cache/omc

# 4. 刷新 marketplace 缓存

claude plugin marketplace update omc

# 5. 重新安装（此时会强制从 npm 下载最新版）

claude plugin install omc@ultrapower
```

> ⚠️ 仅执行步骤 3（清除插件缓存）不够——npm-cache 仍会导致安装器复用旧内容。必须同时清除 npm-cache。

### GitHub Actions 发布失败

当 GitHub Actions 自动发布失败时，按以下流程恢复：

#### 1. 验证当前状态

```bash

# 检查 npm 是否已发布

npm view @liangjie559567/ultrapower version

# 检查 GitHub Release 是否已创建

gh release view v<version>
```

#### 2. 识别缺失步骤

根据验证结果确定需要补充的步骤：

* npm 未发布 → 执行步骤 3

* GitHub Release 未创建 → 执行步骤 4

* 两者都缺失 → 执行步骤 3 和 4

#### 3. 手动发布到 npm

```bash
npm publish --access public --no-provenance
```

如果报错 "cannot publish over the previously published versions"，说明已发布，跳过此步。

#### 4. 手动创建 GitHub Release

```bash

# 确保 tag 已推送

git push origin v<version>

# 创建 Release

gh release create v<version> --title "v<version>" --notes "<release notes>"
```

#### 5. 验证最终状态

```bash

# 验证 npm

npm view @liangjie559567/ultrapower version

# 验证 GitHub Release

gh release view v<version> --json tagName,publishedAt
```

#### 常见失败原因

| 错误 | 原因 | 解决方案 |
| ------ | ------ | --------- |
| "GitHub Actions is not permitted to create or approve pull requests" | changesets action 缺少 PR 创建权限 | 使用 `npm run release:local` 手动发布 |
| "tag already exists" | 手动推送的 tag 与 CI 冲突 | 删除远程 tag：`git push origin :refs/tags/v<version>` |
| "cannot publish over the previously published versions" | npm 版本已存在 | 验证是否已发布，跳过重复发布 |
| "Updates were rejected because the remote contains work" | 远程有新提交 | 执行 `git stash && git pull --rebase && git push` |

## 路由触发

发布流程完成后调用 `next-step-router`：

* current_skill: "release"

* stage: "release_complete"

* output_summary: 发布版本号、发布渠道、是否有回滚计划

## 故障排查指南

### 问题 1: Git Tag 冲突

**症状**: Release 工作流失败，错误信息 "tag already exists"

**原因**: 手动推送的 tag 与 changesets 自动创建的 tag 冲突

**解决方案**:
```bash
# 1. 删除远程 tag
git push origin :refs/tags/v<version>

# 2. 重新触发工作流（创建空提交）
git commit --allow-empty -m "chore: trigger release workflow"
git pull --rebase origin main
git push origin main
```

**预防**: 避免手动推送 tag，让 CI 自动管理

### 问题 2: 版本文件不同步

**症状**: Release 工作流失败，validate:versions 检查失败

**原因**: marketplace.json 或其他版本文件未更新

**解决方案**:
```bash
# 1. 运行版本同步检查
node scripts/check-version-sync.mjs

# 2. 手动更新不同步的文件
# - marketplace.json
# - docs/CLAUDE.md
# - CLAUDE.md

# 3. 提交并推送
git add -A
git commit -m "chore: sync version files to <version>"
git pull --rebase origin main
git push origin main
```

**预防**: 发布前运行 `node scripts/check-version-sync.mjs`

### 问题 3: ESLint 错误阻塞发布

**症状**: CI 工作流失败，ESLint 报错

**原因**: 代码中存在 lint 错误（no-empty, prefer-const 等）

**解决方案**:
```bash
# 1. 运行 ESLint 检查
npm run lint

# 2. 修复错误
# - 空 catch 块添加注释
# - 未重新赋值的 let 改为 const

# 3. 验证修复
npm run lint

# 4. 提交并推送
git add -A
git commit -m "fix(lint): resolve ESLint errors"
git pull --rebase origin main
git push origin main
```

**预防**: 提交前运行 `npm run lint`

### 问题 4: 部分发布失败

**症状**: npm 已发布但 GitHub Release 未创建（或反之）

**原因**: CI 工作流部分步骤失败

**解决方案**:
```bash
# 1. 验证当前状态
npm view @liangjie559567/ultrapower version
gh release view v<version>

# 2. 补充缺失步骤
# 如果 npm 未发布：
npm publish --access public --no-provenance

# 如果 GitHub Release 未创建：
git push origin v<version>  # 确保 tag 存在
gh release create v<version> --title "v<version>" --notes "<notes>"

# 3. 验证最终状态
npm view @liangjie559567/ultrapower version
gh release view v<version>
```

### 问题 5: 远程推送冲突

**症状**: git push 失败，"remote contains work"

**原因**: 远程有新提交，本地落后

**解决方案**:
```bash
git stash
git pull --rebase origin main
git stash pop
git push origin main
```

**预防**: 推送前先拉取最新代码

## 版本同步检查清单

发布前必须检查：
- [ ] package.json
- [ ] marketplace.json
- [ ] docs/CLAUDE.md
- [ ] CLAUDE.md
- [ ] 运行 `node scripts/check-version-sync.mjs`
- [ ] 运行 `npm run lint`
- [ ] 运行 `npm test`

