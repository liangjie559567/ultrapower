# 发布失败恢复指南

## 快速诊断

发布流程的 5 个步骤：
1. **Preflight** - 版本同步校验
2. **Validate** - 构建 + 测试
3. **Publish** - NPM 发布
4. **Release** - GitHub Release
5. **Sync** - Marketplace 同步

## 恢复策略

### 场景 1: NPM 发布成功，但后续步骤失败

**症状：** 包已在 npmjs.com 上，但没有 GitHub Release

**恢复步骤：**
```bash

# 方案 A: 手动创建 GitHub Release

gh release create v5.5.40 --generate-notes

# 方案 B: 标记为弃用并重新发布（< 72小时）

npm deprecate @liangjie559567/ultrapower@5.5.40 "Incomplete release, use 5.5.41"
node scripts/bump-version.mjs 5.5.41
npm run build
npm publish --provenance
gh release create v5.5.41 --generate-notes
```

### 场景 2: 发布后发现严重 Bug

**72 小时内且无依赖：**
```bash
npm unpublish @liangjie559567/ultrapower@5.5.40
```

**任何时候（推荐）：**
```bash
npm deprecate @liangjie559567/ultrapower@5.5.40 "Critical bug, use 5.5.41"
node scripts/bump-version.mjs 5.5.41
npm run build
npm test
npm publish --provenance
```

### 场景 3: 从特定步骤恢复

```bash

# 从 publish 步骤开始

node scripts/release-local.mjs --start-from=publish

# 从 release 步骤开始

node scripts/release-local.mjs --start-from=release

# 从 sync 步骤开始

node scripts/release-local.mjs --start-from=sync
```

## 预防措施

### 发布前检查清单

* [ ] 所有测试通过 (`npm test`)

* [ ] 版本号已更新且一致 (`node scripts/bump-version.mjs`)

* [ ] 无循环依赖

* [ ] Git 工作区干净

* [ ] 本地验证打包内容 (`npm pack --dry-run`)

### Dry-run 测试

```bash

# 完整 dry-run（不实际执行）

npm run release:dry-run

# 或

node scripts/release-local.mjs --dry-run
```

## 紧急联系

* NPM 包页面: <https://www.npmjs.com/package/@liangjie559567/ultrapower>

* GitHub Releases: <https://github.com/liangjie559567/ultrapower/releases>

* 问题报告: <https://github.com/liangjie559567/ultrapower/issues>
