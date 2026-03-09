# Release Process

## 版本同步检查清单

发布前必须确保以下文件版本一致：

1. `package.json` - npm 包版本
2. `.claude-plugin/plugin.json` - 用户看到的插件版本
3. `.claude-plugin/marketplace.json` - 插件市场版本

## 自动化验证

### 本地验证

```bash
npm run validate:versions
```

### CI 验证

版本验证已集成到 GitHub Actions release 工作流的 preflight 步骤中。

## 发布流程

### 标准发布（推荐）

1. 更新版本号：
   ```bash
   npm run bump -- 5.5.26
   ```

1. 验证版本同步：
   ```bash
   npm run validate:versions
   ```

1. 提交并打标签：
   ```bash
   git add -A
   git commit -m "chore: bump version to 5.5.26"
   git tag v5.5.26
   git push origin main
   git push origin v5.5.26
   ```

1. GitHub Actions 自动执行：
   - 构建和测试
   - 发布到 npm
   - 创建 GitHub Release
   - 同步 marketplace.json 和 plugin.json

### 手动发布（仅用于调试）

```bash
npm run release:dry-run  # 预览
npm run release:local    # 执行
```

## 故障排查

### 版本不一致

如果 `validate:versions` 失败：

```bash

# 查看差异

git diff package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json

# 手动修复后重新验证

npm run validate:versions
```

### CI 失败

1. 检查 GitHub Actions 日志
2. 本地重现问题：
   ```bash
   npm run test:run
   npm run build
   ```

## 相关知识

* [k-077: Multi-File Version Sync in Release Pipeline](../../.omc/axiom/evolution/knowledge_base.md#k-077)

* [k-074: Version Number Sync Checklist](../../.omc/axiom/evolution/knowledge_base.md#k-074)
