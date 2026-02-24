# 元数据同步系统

## 概述

元数据同步系统确保 `package.json`（唯一可信来源）与项目中所有文档文件之间的一致性。它防止版本漂移、过时的徽章和手动更新错误。

## 为什么需要它

### 问题

在典型的项目生命周期中：

1. 开发者将 `package.json` 中的版本升级到 `3.5.0`
2. 创建发布提交
3. **忘记**更新 `README.md` 中的版本徽章（仍显示 `3.4.0`）
4. **忘记**更新 `docs/REFERENCE.md` 中的版本标题
5. **忘记**在添加新 agent 后更新 `.github/CLAUDE.md` 中的 agent 数量
6. 用户在文档中看到不一致的版本信息
7. CI 构建看起来专业，但包含过时的元数据

**结果：** 混乱、信任度降低、显得不专业。

### 解决方案

一个自动化脚本：
- 从 `package.json` 读取规范元数据
- 一次性更新所有文档文件
- 可以验证同步状态（用于 CI/CD）
- 支持 dry-run 模式以确保安全
- 报告具体更改内容

## 工作原理

### 唯一可信来源

`package.json` 是以下内容的**唯一可信来源**：

| 字段 | 用途 |
|-------|----------|
| `version` | 版本徽章、标题、引用 |
| `name` | npm 包链接、下载徽章 |
| `description` | 项目标语（未来） |
| `keywords` | SEO 元数据（未来） |
| `repository.url` | GitHub 链接 |
| `homepage` | 网站链接 |

### 目标文件

脚本同步以下文件：

| 文件 | 更新内容 |
|------|-------------------|
| `README.md` | npm 版本/下载徽章 |
| `docs/REFERENCE.md` | 版本徽章、版本标题 |
| `.github/CLAUDE.md` | Agent 数量、skill 数量 |
| `docs/ARCHITECTURE.md` | 版本引用 |
| `CHANGELOG.md` | 最新版本标题（仅验证） |

### 动态元数据

部分元数据是计算得出的，而非直接读取：

- **Agent 数量** - 统计 `agents/` 目录中的 `.yaml`/`.yml` 文件
- **Skill 数量** - 统计 `skills/` 目录中的 `.md` 文件

这确保文档始终反映当前状态。

## 用法

### 基本同步

```bash
npm run sync-metadata
```

同步所有文件。输出：
```
📦 Metadata Sync System
========================

Version: 3.5.0
Package: oh-my-claude-sisyphus
Agents: 32
Skills: 45

✓ README.md
  - npm version badge

✓ docs/REFERENCE.md
  - Version badge
  - Version header

✓ .github/CLAUDE.md
  - Agent count
  - Slash command count

✅ Successfully synced 3 file(s)!
```

### Dry Run（预览更改）

```bash
npm run sync-metadata -- --dry-run
```

显示**将要**更改的内容而不写入文件：

```
🔍 DRY RUN MODE - No files will be modified

📝 README.md
  - npm version badge

📝 docs/REFERENCE.md
  - Version badge

📊 2 file(s) would be updated
Run without --dry-run to apply changes
```

### 验证同步（CI/CD）

```bash
npm run sync-metadata -- --verify
```

检查文件是否同步。退出状态码：
- `0` - 所有文件已同步
- `1` - 文件未同步（显示哪些文件）

```
🔍 Verifying metadata sync...
✓ README.md
✗ docs/REFERENCE.md
  - Version badge needs update

❌ Files are out of sync!
Run: npm run sync-metadata
```

### 帮助

```bash
npm run sync-metadata -- --help
```

## 何时运行

### 手动工作流

在提交版本更改**之前**运行同步：

```bash
# 1. 升级版本
npm version patch

# 2. 同步元数据
npm run sync-metadata

# 3. 一起提交所有内容
git add .
git commit -m "chore: release v3.5.0"
```

### 自动化工作流（推荐）

添加到 `package.json`：

```json
{
  "scripts": {
    "version": "npm run sync-metadata && git add ."
  }
}
```

现在 `npm version patch` 会自动：
1. 升级 `package.json` 中的版本
2. 运行同步脚本
3. 暂存已同步的文件
4. 创建版本提交

### Pre-Commit Hook

添加到 `.husky/pre-commit`：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 验证元数据已同步
npm run sync-metadata -- --verify

if [ $? -ne 0 ]; then
  echo "❌ Metadata out of sync! Run: npm run sync-metadata"
  exit 1
fi
```

### CI/CD 流水线

在 GitHub Actions 中添加验证步骤：

```yaml
- name: Verify Metadata Sync
  run: npm run sync-metadata -- --verify
```

## 如何扩展

### 添加新的目标文件

编辑 `scripts/sync-metadata.ts`：

```typescript
function getFileSyncConfigs(): FileSync[] {
  return [
    // ... 现有配置 ...
    {
      path: 'docs/NEW-FILE.md',
      replacements: [
        {
          pattern: /version \d+\.\d+\.\d+/gi,
          replacement: (m) => `version ${m.version}`,
          description: 'Version references',
        },
        {
          pattern: /\*\*\d+ features\*\*/g,
          replacement: (m) => `**${getFeatureCount()} features**`,
          description: 'Feature count',
        },
      ],
    },
  ];
}
```

### 添加动态元数据

添加新函数：

```typescript
function getFeatureCount(): number {
  const featuresDir = join(projectRoot, 'features');
  const files = readdirSync(featuresDir);
  return files.filter(f => f.endsWith('.ts')).length;
}
```

在替换中使用：

```typescript
{
  pattern: /\*\*\d+ features\*\*/g,
  replacement: () => `**${getFeatureCount()} features**`,
  description: 'Feature count',
}
```

### 添加新的元数据来源

扩展 `Metadata` 接口：

```typescript
interface Metadata {
  version: string;
  description: string;
  keywords: string[];
  repository: string;
  homepage: string;
  npmPackage: string;
  // 新增：
  author: string;
  license: string;
  engines: { node: string };
}
```

更新 `loadMetadata()`：

```typescript
function loadMetadata(): Metadata {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  return {
    // ... 现有字段 ...
    author: packageJson.author || '',
    license: packageJson.license || '',
    engines: packageJson.engines || { node: '>=20.0.0' },
  };
}
```

## 实现细节

### 安全替换策略

脚本使用**基于正则表达式的替换**并带有安全保障：

1. 将整个文件**读入**内存
2. 对字符串**应用所有替换**
3. **比较**原始内容与修改后内容
4. **仅在**内容发生变化时写入

这防止了：
- 不必要的文件写入（保留时间戳）
- 部分更新（原子操作）
- 权限错误（写入前失败）

### 模式设计

模式设计原则：

**足够具体**以仅匹配预期内容：
```typescript
// 好 - 仅匹配 npm 徽章
/\[!\[npm version\]\(https:\/\/img\.shields\.io\/npm\/v\/[^)]+\)/g

// 差 - 过于宽泛，匹配任何徽章
/\[!\[[^\]]+\]\([^)]+\)/g
```

**足够灵活**以处理变体：
```typescript
// 匹配：3.4.0, 10.0.0, 2.1.3-beta
/\d+\.\d+\.\d+(-[a-z0-9]+)?/
```

### 错误处理

脚本处理：

- **文件缺失** - 警告但继续
- **无效的 package.json** - 快速失败并给出清晰错误
- **权限错误** - 报告并退出
- **正则表达式失败** - 报告失败的模式

### 性能

对于典型项目：
- **读取文件数：** 5-10
- **执行时间：** <100ms
- **内存使用：** <10MB

随目标文件数量线性扩展。

## 测试

### 手动测试

```bash
# 1. 修改 package.json
npm version patch

# 2. 运行 dry-run 预览
npm run sync-metadata -- --dry-run

# 3. 应用更改
npm run sync-metadata

# 4. 用 git 验证
git diff
```

### 自动化测试

脚本导出函数用于测试：

```typescript
import { loadMetadata, syncFile, verifySync } from './scripts/sync-metadata.js';

test('loads metadata correctly', () => {
  const metadata = loadMetadata();
  expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
});

test('syncs README badges', () => {
  const config = getFileSyncConfigs().find(c => c.path === 'README.md');
  const result = syncFile(config, mockMetadata, true, projectRoot);
  expect(result.changed).toBe(true);
});
```

## 故障排除

### "File not found" 警告

**症状：** 脚本报告文件未找到。

**原因：** 文件已移动或删除。

**修复：** 从 `getFileSyncConfigs()` 中移除或更新路径。

### "No changes detected" 但文件已过时

**症状：** 脚本报告无更改，但文件显示旧版本。

**原因：** 模式与当前文件格式不匹配。

**修复：** 更新正则表达式模式以匹配实际内容。

### 版本已更新但徽章仍显示旧版本

**症状：** package.json 有新版本，徽章未更改。

**原因：** 徽章可能被 shields.io CDN 缓存。

**修复：** 等待 5 分钟或使用 `?cache=bust` 参数。

### 权限拒绝错误

**症状：** 脚本因 EACCES 失败。

**原因：** 文件为只读或属于不同用户。

**修复：**
```bash
chmod +w docs/*.md
# 或
sudo chown $USER docs/*.md
```

## 最佳实践

### 1. 始终先 dry-run

发布前：
```bash
npm run sync-metadata -- --dry-run
```

审查更改，然后应用。

### 2. 提交前同步

添加到您的工作流：
```bash
npm run sync-metadata && git add -A
```

### 3. 在 CI 中使用验证

在 pull request 中捕获过时的文档：
```yaml
- run: npm run sync-metadata -- --verify
```

### 4. 保持模式可维护

为复杂正则表达式添加注释：
```typescript
{
  // 匹配：[![Version](https://img.shields.io/badge/version-3.4.0-ff6b6b)]
  // 仅捕获版本号
  pattern: /\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-([^-]+)-[^)]+\)/g,
  replacement: (m) => `[![Version](https://img.shields.io/badge/version-${m.version}-ff6b6b)]`,
  description: 'Version badge in REFERENCE.md',
}
```

### 5. package.json 更改后测试

任何 package.json 更改后：
```bash
npm run sync-metadata -- --verify
```

## 迁移指南

如果您要将此添加到现有项目：

### 第 1 步：审计当前状态

查找所有硬编码版本：
```bash
grep -r "3\.4\.0" docs/ README.md .github/
```

### 第 2 步：标准化格式

选择一致的徽章格式：
```markdown
[![Version](https://img.shields.io/badge/version-3.4.0-ff6b6b)]
```

手动更新所有实例。

### 第 3 步：运行初始同步

```bash
npm run sync-metadata
```

应报告"All files are already in sync"。

### 第 4 步：添加到工作流

添加 npm 脚本、pre-commit hook、CI 验证。

### 第 5 步：为团队记录文档

更新 CONTRIBUTING.md：
```markdown
## Releasing

1. Bump version: `npm version patch`
2. Sync metadata: `npm run sync-metadata`
3. Commit and tag
```

## 未来增强

潜在改进：

- [ ] 支持多语言文档（i18n）
- [ ] 同步到网站/落地页
- [ ] 从源代码提取功能数量
- [ ] 自动更新文档中的依赖版本
- [ ] 与发布工作流集成
- [ ] 基于 Markdown AST 的更新（比正则表达式更安全）
- [ ] 自定义模式的配置文件
- [ ] 自定义元数据来源的插件系统

## 相关

- [CI/CD Pipeline](../.github/workflows/)
