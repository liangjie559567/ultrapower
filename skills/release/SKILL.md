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
- `README.md`（版本徽章和标题）

> ⚠️ `marketplace.json` 是安装器读取的入口，版本不同步会导致用户始终安装旧版本。

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

### 5. 刷新本地 marketplace 缓存
```bash
claude plugin marketplace update ultrapower
```
> 推送到 GitHub 后必须执行此步，否则本地安装器仍读取旧版 `marketplace.json`。

### 6. 发布到 npm
```bash
npm publish --access public
```
> ⚠️ npm 不允许覆盖已发布版本，版本号必须先升级再发布。

### 7. 创建 GitHub Release
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
| `README.md` | 标题 + 版本徽章 |

## 语义化版本

- **patch**（X.Y.Z+1）：Bug 修复、小改进
- **minor**（X.Y+1.0）：新功能，向后兼容
- **major**（X+1.0.0）：破坏性变更

## 注意事项

- 发布前始终运行测试
- 创建总结变更的发布说明
- 推送到 GitHub 后必须运行 `claude plugin marketplace update ultrapower` 刷新本地缓存
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
ls ~/.claude/plugins/cache/ultrapower/ultrapower/<version>/skills/
```
正确路径应直接包含 `skills/`、`dist/` 等目录。

### 缓存目录无限嵌套

症状：`cache/ultrapower/ultrapower/5.x.x/ultrapower/5.x.x/ultrapower/...`

原因：npm 包中包含了 `ultrapower/` 子目录（通常是缓存目录被打包进去）。

修复步骤：
```bash
# 1. 卸载插件
claude plugin uninstall ultrapower

# 2. 清除缓存
rm -rf ~/.claude/plugins/cache/ultrapower
rm -rf ~/.claude/plugins/marketplaces/ultrapower

# 3. 确认 .npmignore 已排除 ultrapower/ 目录

# 4. 重新发布（需升级版本号）
npm publish --access public

# 5. 重新安装
claude plugin install ultrapower
```

### 安装后仍是旧版本

原因：本地 marketplace 缓存未更新，安装器读取的是旧版 `marketplace.json`。

修复：
```bash
claude plugin marketplace update ultrapower
claude plugin uninstall ultrapower
claude plugin install ultrapower
```

## 路由触发

发布流程完成后调用 `next-step-router`：
- current_skill: "release"
- stage: "release_complete"
- output_summary: 发布版本号、发布渠道、是否有回滚计划
