# CI/CD 流程改进建议

## 当前问题

1. **changesets action 无法创建 PR**：需要仓库级权限配置
2. **手动发布流程复杂**：需要多次 git rebase 处理冲突
3. **发布验证不完整**：缺少自动化验证步骤

## 改进方案

### 1. 简化发布流程（推荐）

使用直接发布模式，跳过 PR 创建：

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  github-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: publish
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      - name: Create Release
        run: |
          gh release create ${{ github.ref_name }} \
            --title "${{ github.ref_name }}" \
            --generate-notes
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**优势**：
- 无需 PR 创建权限
- 流程简单，易于调试
- 手动控制发布时机（通过推送 tag）

**使用方式**：
```bash
# 本地完成版本升级和测试
npm run bump
git push origin main
git push origin v<version>  # 触发 CI 发布
```

### 2. 保留 changesets（需配置权限）

如果需要保留 changesets 的 PR 工作流，必须：

1. 启用仓库权限（见 `.github/ACTIONS_SETUP.md`）
2. 使用 Personal Access Token 替代 GITHUB_TOKEN：

```yaml
- uses: changesets/action@v1
  with:
    publish: npm run release
  env:
    GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}  # 使用 PAT
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**PAT 配置**：
```bash
# 1. 创建 PAT（Settings → Developer settings → Personal access tokens）
# 权限：repo, workflow

# 2. 添加到仓库 Secrets
gh secret set PAT_TOKEN -R liangjie559567/ultrapower
```

### 3. 添加发布验证步骤

在发布后自动验证：

```yaml
  verify:
    name: Verify Release
    runs-on: ubuntu-latest
    needs: [publish, github-release]
    steps:
      - name: Verify npm package
        run: |
          VERSION=$(echo ${{ github.ref_name }} | sed 's/v//')
          PUBLISHED=$(npm view @liangjie559567/ultrapower version)
          if [ "$PUBLISHED" != "$VERSION" ]; then
            echo "❌ npm version mismatch: expected $VERSION, got $PUBLISHED"
            exit 1
          fi
          echo "✅ npm package verified: $VERSION"

      - name: Verify GitHub Release
        run: |
          if ! gh release view ${{ github.ref_name }} -R liangjie559567/ultrapower; then
            echo "❌ GitHub Release not found"
            exit 1
          fi
          echo "✅ GitHub Release verified"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 推荐实施顺序

1. **立即实施**：采用方案 1（简化发布流程）
2. **短期**：添加发布验证步骤
3. **可选**：如需 PR 工作流，配置 PAT（方案 2）

## 迁移步骤

### 从 changesets 迁移到简化流程

1. 备份当前 workflow：
```bash
cp .github/workflows/release.yml .github/workflows/release.yml.bak
```

2. 替换为简化版本（见上方方案 1）

3. 测试发布流程：
```bash
# 创建测试 tag
git tag v5.6.3-test
git push origin v5.6.3-test

# 观察 Actions 运行
gh run watch

# 清理测试
gh release delete v5.6.3-test --yes
npm unpublish @liangjie559567/ultrapower@5.6.3-test
git push origin :refs/tags/v5.6.3-test
```

4. 验证成功后，删除备份

## 故障恢复

如果 CI 发布失败，使用本地发布脚本：

```bash
npm run release:local
```

详见 `skills/release/SKILL.md` 的故障恢复章节。
