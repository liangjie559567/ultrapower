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
在所有位置更新版本：
- `package.json`
- `src/installer/index.ts`（VERSION 常量）
- `src/__tests__/installer.test.ts`（预期版本）
- `.claude-plugin/plugin.json`
- `README.md`（版本徽章和标题）

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

### 5. 发布到 npm
```bash
npm publish --access public
```

### 6. 创建 GitHub Release
```bash
gh release create v<version> --title "v<version> - <title>" --notes "<release notes>"
```

### 7. 验证
- [ ] npm: https://www.npmjs.com/package/oh-my-claude-sisyphus
- [ ] GitHub: https://github.com/Yeachan-Heo/ultrapower/releases

## 版本文件参考

| 文件 | 字段/行 |
|------|------------|
| `package.json` | `"version": "X.Y.Z"` |
| `src/installer/index.ts` | `export const VERSION = 'X.Y.Z'` |
| `src/__tests__/installer.test.ts` | `expect(VERSION).toBe('X.Y.Z')` |
| `.claude-plugin/plugin.json` | `"version": "X.Y.Z"` |
| `README.md` | 标题 + 版本徽章 |

## 语义化版本

- **patch**（X.Y.Z+1）：Bug 修复、小改进
- **minor**（X.Y+1.0）：新功能，向后兼容
- **major**（X+1.0.0）：破坏性变更

## 注意事项

- 发布前始终运行测试
- 创建总结变更的发布说明
- 插件市场从 GitHub releases 自动同步
