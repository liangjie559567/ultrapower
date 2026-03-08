# 发布流程

## 自动化发布（推荐）

### 1. 创建 changeset

```bash
npm run changeset
```

回答问题：
- 选择变更类型（patch/minor/major）
- 输入变更描述

### 2. 提交 changeset

```bash
git add .changeset
git commit -m "chore: add changeset for feature X"
git push origin dev
```

### 3. 合并到 main

创建 PR 从 dev 到 main，合并后 GitHub Actions 自动：
- 运行测试
- 更新版本号
- 生成 CHANGELOG
- 发布到 npm
- 创建 GitHub Release

## 手动发布

```bash
npm run changeset        # 创建 changeset
npm run version          # 更新版本
npm run release          # 发布到 npm
```

## GitHub Secrets 配置

在仓库设置中添加：
- `NPM_TOKEN`: 从 npmjs.com 获取访问令牌

## 版本规范

- **patch** (5.5.39 → 5.5.40): Bug 修复
- **minor** (5.5.39 → 5.6.0): 新功能
- **major** (5.5.39 → 6.0.0): 破坏性变更
