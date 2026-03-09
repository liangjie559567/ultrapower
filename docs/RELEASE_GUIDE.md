# ultrapower 插件发布完整指南

## 📋 目录

1. [快速发布流程](#快速发布流程)
2. [发布架构](#发布架构)
3. [详细步骤](#详细步骤)
4. [高级配置](#高级配置)
5. [故障排查](#故障排查)

---

## 快速发布流程

```bash
# 1. 更新版本
node scripts/bump-version.mjs 5.5.41

# 2. 提交到 dev
git add .
git commit -m "chore: bump version to 5.5.41"
git push origin dev

# 3. 合并到 main（触发自动发布）
git checkout main
git merge dev
git push origin main
```

GitHub Actions 自动执行：构建 → 测试 → NPM 发布 → GitHub Release → 插件市场同步

---

## 发布架构

```
版本更新 → 构建验证 → NPM 发布 → GitHub Release → 插件市场同步
   ↓           ↓           ↓            ↓              ↓
bump-version  tsc+test   npm publish  gh release    git push dev
```

### 5 步流水线

1. **Preflight** - 版本同步校验（5 个配置文件）
2. **Validate** - TypeScript + 构建 + 测试
3. **Publish** - NPM 发布（带 provenance）
4. **Release** - GitHub Release 创建
5. **Sync** - Marketplace 同步到 dev 分支

---

## 详细步骤

### Step 1: 版本号更新

**自动同步 5 个文件：**
- `package.json`
- `.claude-plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `marketplace.json`

```bash
node scripts/bump-version.mjs 5.5.41
```

**验证版本一致性：**
```bash
node scripts/bump-version.mjs
# 输出: ✓ All in sync
```

### Step 2: 本地验证

```bash
# TypeScript 类型检查
tsc --noEmit

# 完整构建
npm run build

# 运行测试
npm test

# 预览打包内容
npm pack --dry-run
```

### Step 3: 提交变更

```bash
git add .
git commit -m "chore: bump version to 5.5.41"
git push origin dev
```

### Step 4: 触发发布

```bash
# 合并到 main 触发 GitHub Actions
git checkout main
git merge dev
git push origin main
```

### Step 5: 验证发布

```bash
# 检查 NPM
npm view @liangjie559567/ultrapower@5.5.41

# 检查 GitHub Release
gh release view v5.5.41

# 检查 provenance
npm audit signatures
```

---

## 高级配置

### NPM Provenance（供应链安全）

**已启用：** 发布时自动添加 `--provenance` 标志

**验证：**
```bash
npm audit signatures
```

**查看 provenance：**
访问 https://www.npmjs.com/package/@liangjie559567/ultrapower
查看验证徽章

### GitHub Actions 缓存

**已启用：** 依赖缓存加速 CI/CD

**缓存策略：**
- 路径：`~/.npm`
- 键：`${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`
- 节省时间：30-60 秒

### Changesets 集成

**当前配置：** 使用 Changesets action 自动化版本管理

**工作流：**
1. 推送到 main → Changesets 检测变更
2. 有 changeset → 创建版本 PR
3. 合并 PR → 自动发布

---

## 故障排查

### 常见问题

**Q: 版本不一致错误**
```bash
# 重新同步版本
node scripts/bump-version.mjs 5.5.41
```

**Q: 循环依赖错误**
```bash
# 检查 package.json dependencies
# 确保不包含 @liangjie559567/ultrapower
```

**Q: NPM 发布失败**
```bash
# 检查 NPM_TOKEN
echo $NPM_TOKEN

# 手动发布
npm publish --access public --provenance
```

**Q: GitHub Release 失败**
```bash
# 手动创建
gh release create v5.5.41 --generate-notes
```

### 发布失败恢复

详见 [RELEASE_RECOVERY.md](./RELEASE_RECOVERY.md)

---

## 安全最佳实践

✅ **已实施：**
- NPM provenance 声明
- GitHub Actions 权限最小化
- 短期证书（非长期密钥）
- 依赖缓存（加速 + 安全）

✅ **版本控制：**
- 严格 semver 格式验证
- 5 文件版本同步
- 循环依赖检测

✅ **发布验证：**
- 构建前类型检查
- 测试门禁
- 打包内容预览

---

## 参考资料

- [NPM Package Provenance](https://github.blog/2023-04-19-introducing-npm-package-provenance)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [发布失败恢复指南](./RELEASE_RECOVERY.md)
