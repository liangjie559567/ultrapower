# 发布前检查清单

在执行 `npm run release:local` 或推送 release tag 前，完成以下检查：

## 1. 版本同步检查

- [ ] `package.json` - version 字段
- [ ] `src/installer/index.ts` - VERSION 常量
- [ ] `src/__tests__/installer.test.ts` - 预期版本
- [ ] `.claude-plugin/plugin.json` - version 字段
- [ ] `.claude-plugin/marketplace.json` - version 和 source.version 两处
- [ ] `docs/CLAUDE.md` - `<!-- OMC:VERSION:X.Y.Z -->`
- [ ] `CLAUDE.md` - 版本引用
- [ ] `README.md` - 版本徽章

**验证命令**：
```bash
npm run validate:versions
```

## 2. 代码质量检查

- [ ] 所有测试通过
  ```bash
  npm run test:run
  ```

- [ ] Linter 无错误（警告可接受）
  ```bash
  npm run lint
  ```

- [ ] 构建成功
  ```bash
  npm run build
  ```

- [ ] Skill frontmatter 有效
  ```bash
  npm run validate:skills
  ```

## 3. 文档同步检查

- [ ] `CHANGELOG.md` 已更新
- [ ] `docs/REFERENCE.md` 数量统计一致（TOC + 正文）
- [ ] 新增 agent/skill/hook 已添加到文档

**验证命令**：
```bash
npm run validate:counts
```

## 4. Git 状态检查

- [ ] 工作目录干净（无未提交变更）
  ```bash
  git status
  ```

- [ ] 已同步远程最新代码
  ```bash
  git pull --rebase origin main
  ```

- [ ] 版本 tag 不存在
  ```bash
  git tag | grep "v<version>"  # 应无输出
  ```

## 5. 依赖检查

- [ ] `package-lock.json` 已更新
- [ ] 无已知安全漏洞
  ```bash
  npm audit
  ```

## 6. 发布准备

- [ ] 确定发布类型（patch/minor/major）
- [ ] 准备 release notes
- [ ] 确认目标分支（通常是 main）

## 快速检查脚本

创建 `scripts/pre-release-check.sh`：

```bash
#!/bin/bash
set -e

echo "🔍 Running pre-release checks..."

echo "✓ Validating versions..."
npm run validate:versions

echo "✓ Running tests..."
npm run test:run

echo "✓ Linting code..."
npm run lint

echo "✓ Building project..."
npm run build

echo "✓ Validating skills..."
npm run validate:skills

echo "✓ Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory not clean"
  exit 1
fi

echo "✓ Checking remote sync..."
git fetch origin
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "❌ Not synced with remote"
  exit 1
fi

echo "✅ All pre-release checks passed!"
```

使用：
```bash
chmod +x scripts/pre-release-check.sh
./scripts/pre-release-check.sh
```

## 发布后验证

- [ ] npm 包已发布
  ```bash
  npm view @liangjie559567/ultrapower version
  ```

- [ ] GitHub Release 已创建
  ```bash
  gh release view v<version>
  ```

- [ ] 本地 marketplace 缓存已更新
  ```bash
  claude plugin marketplace update omc
  ```

## 常见问题

**Q: 版本同步检查失败？**
A: 运行 `npm run sync:version` 自动同步所有版本文件。

**Q: 测试失败？**
A: 不要发布。先修复测试，确保所有测试通过。

**Q: Git 状态不干净？**
A: 提交或 stash 所有变更，确保工作目录干净。

**Q: 远程不同步？**
A: 运行 `git pull --rebase origin main` 同步远程变更。
