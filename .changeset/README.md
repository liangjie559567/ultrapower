# Changesets

## 使用流程

### 1. 开发完成后，创建 changeset

```bash
npm run changeset
```

选择变更类型：

* **patch**: Bug 修复 (5.5.39 → 5.5.40)

* **minor**: 新功能 (5.5.39 → 5.6.0)

* **major**: 破坏性变更 (5.5.39 → 6.0.0)

### 2. 更新版本号

```bash
npm run version
```

自动执行：

* 更新 package.json 版本

* 生成 CHANGELOG.md

* 同步版本到文档和插件配置

### 3. 发布到 npm

```bash
npm run release
```

或推送到 main 分支，GitHub Actions 自动发布。

## GitHub Actions 自动化

* **CI**: PR 和 dev/main 分支推送时运行测试

* **Release**: main 分支推送时自动发布到 npm

需要配置 GitHub Secrets:

* `NPM_TOKEN`: npm 发布令牌
