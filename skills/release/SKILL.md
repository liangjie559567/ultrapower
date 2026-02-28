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
- `package.json`
- `src/installer/index.ts`（VERSION 常量）
- `src/__tests__/installer.test.ts`（预期版本）
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`（`"version"` 和 `"source.version"` 两处）
- `docs/CLAUDE.md`（`<!-- OMC:VERSION:X.Y.Z -->`）
- `CLAUDE.md`（`ultrapower vX.Y.Z 规范体系位于 \`docs/standards/\``）
- `README.md`（版本徽章和标题）

> ⚠️ `marketplace.json` 是安装器读取的入口，版本不同步会导致用户始终安装旧版本。
> ⚠️ `docs/CLAUDE.md` 是 `/ultrapower:omc-setup` 下载的模板，版本不同步会导致用户安装后显示旧版本号。
> ⚠️ `CLAUDE.md` 是开发规范文档，版本引用不同步会导致开发者参考错误的规范版本。
> ⚠️ `docs/REFERENCE.md` 存在两处数量声明（TOC 第 12 行 + 正文第 280 行），新增 skill/agent/hook 时必须同步更新两处，否则会出现文档内部不一致（k-047）。

### 2. 运行测试
```bash
npm run test:run
```
继续前所有 231+ 个测试必须通过。

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
- **npm 发布**（`publish` job）
- **GitHub Release 创建**（`github-release` job）
- **marketplace.json 版本同步**（`marketplace-sync` job）

在 GitHub Actions 页面查看进度：https://github.com/liangjie559567/ultrapower/actions

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
npm publish --access public
```
> ⚠️ npm 不允许覆盖已发布版本，版本号必须先升级再发布。

### 7. 创建 GitHub Release（CI 已自动完成，手动备用）
```bash
gh release create v<version> --title "v<version> - <title>" --notes "<release notes>"
```

### 8. 验证
- [ ] npm: https://www.npmjs.com/package/@liangjie559567/ultrapower
- [ ] GitHub: https://github.com/liangjie559567/ultrapower/releases

## 版本文件参考

| 文件 | 字段/行 |
|------|------------|
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

- **patch**（X.Y.Z+1）：Bug 修复、小改进
- **minor**（X.Y+1.0）：新功能，向后兼容
- **major**（X+1.0.0）：破坏性变更

## 注意事项

- 发布前始终运行测试
- 创建总结变更的发布说明
- 推送到 GitHub 后必须运行 `claude plugin marketplace update omc` 刷新本地缓存
- npm 不允许覆盖已发布版本，每次发布前必须升级版本号
- `.npmignore` 必须排除缓存目录（`ultrapower/`、`*.tgz`、`.claude/`），防止安装时产生无限嵌套

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

## 路由触发

发布流程完成后调用 `next-step-router`：
- current_skill: "release"
- stage: "release_complete"
- output_summary: 发布版本号、发布渠道、是否有回滚计划
