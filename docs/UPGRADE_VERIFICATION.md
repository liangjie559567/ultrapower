# ultrapower 插件升级验证流程

> **版本**: 5.5.14
> **最后更新**: 2026-03-05
> **状态**: 生产环境验证

---

## 目录

1. [升级提示机制](#升级提示机制)
2. [完整升级流程](#完整升级流程)
3. [验证检查点](#验证检查点)
4. [已知问题与修复](#已知问题与修复)
5. [回滚方案](#回滚方案)

---

## 升级提示机制

### 触发条件

会话启动时，如果检测到以下条件，会显示升级提示：

```
[OMC AUTO-UPGRADE AVAILABLE]

ultrapower v5.5.12 is available (current: v5.2.3).

ACTION: Use AskUserQuestion to ask the user if they want to upgrade now.
```

### 提示来源

升级提示通过 `SessionStart` hook 注入，位置：

* Hook: `src/hooks/session-start/`

* 触发时机: 每次新会话启动

* 版本检查: 对比 `package.json` 版本与用户当前安装版本

---

## 完整升级流程

### 方式一：通过升级提示（推荐）

**步骤 1: 用户确认升级**

当 AI 询问是否升级时，用户回复 "Upgrade now" 或 "是"。

**步骤 2: 执行升级命令**

```bash
npm install -g @liangjie559567/ultrapower@latest
```

**预期输出**:
```
+ @liangjie559567/ultrapower@5.5.14
updated 1 package in 3.2s
```

**步骤 3: 刷新 hooks 和配置**

```bash
omc setup
```

**预期输出**:
```
[OMC] Syncing hooks...
[OMC] Updated 47 hooks
[OMC] Reconciled CLAUDE.md
✓ Setup complete
```

**步骤 4: 重启 Claude Code**

关闭并重新打开 Claude Code 会话。

**步骤 5: 验证版本**

```
/ultrapower:omc-help
```

应显示版本 `5.5.14`。

---

### 方式二：插件市场更新

**步骤 1: 检查当前版本**

```
/plugin list
```

查找 `ultrapower` 条目，记录当前版本。

**步骤 2: 更新插件**

```
/plugin update ultrapower
```

**预期输出**:
```
✓ Updating ultrapower...
✓ Downloaded v5.5.14
✓ Installed successfully
```

**步骤 3: 重启 Claude Code**

**步骤 4: 验证安装**

```
/ultrapower:omc-doctor
```

---

### 方式三：手动重装（故障恢复）

当自动升级失败时使用。

**步骤 1: 完全卸载**

```bash

# 卸载 npm 全局包

npm uninstall -g @liangjie559567/ultrapower

# 卸载插件

/plugin uninstall ultrapower

# 清理缓存（可选）

rm -rf ~/.claude/plugins/cache/omc
rm -rf ~/.claude/plugins/marketplaces/omc
```

**步骤 2: 重新安装**

```bash

# 方式 A: npm 全局安装

npm install -g @liangjie559567/ultrapower@latest
omc setup

# 方式 B: 插件市场安装

/plugin marketplace add <https://github.com/liangjie559567/ultrapower>
/plugin install omc@ultrapower
```

**步骤 3: 运行安装向导**

```
/ultrapower:omc-setup
```

---

## 验证检查点

### 检查点 1: 版本号确认

```bash

# 命令行检查

omc --version

# Claude Code 内检查

/ultrapower:omc-help
```

**预期**: 显示 `5.5.14`

### 检查点 2: Hooks 注册

```bash
cat ~/.claude/settings.json | grep -A 20 hooks
```

**预期**: 应包含以下 hook 事件类型：

* `PreToolUse`

* `PostToolUse`

* `SessionStart`

* `Stop`

### 检查点 3: Skills 可用性

```
/ax-status
```

**预期**: 正常显示 Axiom 状态，无 "unknown command" 错误。

### 检查点 4: Agents 加载

```
analyze this codebase
```

**预期**: 自动委派给 `debugger` agent，无 "agent not found" 错误。

### 检查点 5: 工具可用性

```bash

# 在 Claude Code 中测试 LSP 工具

# （需要在 TypeScript 项目中）

```

AI 应能调用 `lsp_hover`、`lsp_diagnostics` 等工具。

### 检查点 6: 状态文件路径

```bash
ls -la .omc/state/
```

**预期**: 状态文件位于项目根目录 `.omc/state/`，而非 `~/.claude/`。

---

## 已知问题与修复

### 问题 1: npm-cache 版本锁定

**症状**: 点击 "Update now" 后仍停留在旧版本。

**根因**: `~/.claude/plugins/npm-cache/package.json` 存储 semver 范围（如 `^5.2.3`），Claude Code 认为缓存版本满足要求，跳过重新下载。

**修复**: `scripts/plugin-setup.mjs` 的 `fixNpmCacheVersion()` 函数在 postinstall 时自动覆盖为精确版本。

**手动修复**:
```bash

# 编辑 ~/.claude/plugins/npm-cache/package.json

# 将 "^5.2.3" 改为 "5.5.14"

```

### 问题 2: plugin.json 缺失

**症状**: 插件安装后提示 "Invalid input" 或 hooks/agents 未加载。

**根因**: npm install 剥离隐藏目录（`.claude-plugin/`），导致 `plugin.json` 未复制到缓存。

**修复**: `fixMissingPluginJson()` 在 postinstall 时重建 `plugin.json`。

**验证**:
```bash
cat ~/.claude/plugins/cache/omc/ultrapower/5.5.14/.claude-plugin/plugin.json
```

应存在且不包含 `hooks` 或 `agents` 字段（这些通过目录自动发现）。

### 问题 3: 嵌套缓存目录

**症状**: Windows 上出现无限嵌套 `cache/omc/ultrapower/5.0.23/ultrapower/5.0.23/...`，Claude Code 无法启动。

**根因**: Claude Code 安装器 bug，将包内容复制到 `cache/omc/` 时，包本身包含 `ultrapower/` 子目录，导致每次重启时嵌套加深。

**修复**: `fixNestedCacheDir()` 检测并扁平化嵌套结构。

**手动修复**:
```powershell

# Windows (路径过深时使用 robocopy)

mkdir C:\empty_temp
robocopy C:\empty_temp "C:\Users\<name>\.claude\plugins\cache\omc" /MIR
rmdir "C:\Users\<name>\.claude\plugins\cache\omc" /s /q
```

### 问题 4: marketplace 名称迁移

**症状**: 旧用户通过 GitHub URL 添加 marketplace 时注册为 `ultrapower`，但新版本期望 `omc`。

**修复**: `migrateMarketplaceName()` 自动重命名目录和配置文件。

**验证**:
```bash
cat ~/.claude/plugins/known_marketplaces.json | grep -E "(omc | ultrapower)"
```

应只显示 `omc`，不应有 `ultrapower` 键。

### 问题 5: templates/hooks/ 缺失

**症状**: Hook 执行时报错 "Cannot find module '${CLAUDE_PLUGIN_ROOT}/templates/hooks/xxx.mjs'"。

**根因**: npm install 从临时 node_modules 运行，Claude Code 在 postinstall 后复制文件到缓存，但 `templates/` 目录未包含在复制列表中。

**修复**: `copyTemplatesToCache()` 显式复制 `templates/hooks/` 到所有缓存版本目录。

**验证**:
```bash
ls ~/.claude/plugins/cache/omc/ultrapower/5.5.14/templates/hooks/
```

应包含 `.mjs` 文件。

---

## 回滚方案

### 场景 1: 新版本有 Bug

**回滚到上一个稳定版本**:

```bash

# 卸载当前版本

npm uninstall -g @liangjie559567/ultrapower

# 安装指定版本

npm install -g @liangjie559567/ultrapower@5.5.13

# 刷新配置

omc setup
```

### 场景 2: 配置损坏

**重置配置文件**:

```bash

# 备份当前配置

cp ~/.claude/.omc-config.json ~/.claude/.omc-config.json.bak

# 删除配置（下次启动时重建）

rm ~/.claude/.omc-config.json

# 重新运行安装向导

/ultrapower:omc-setup
```

### 场景 3: 完全重置

**清除所有 ultrapower 数据**:

```bash

# 卸载

npm uninstall -g @liangjie559567/ultrapower
/plugin uninstall ultrapower

# 清理所有缓存和配置

rm -rf ~/.claude/plugins/cache/omc
rm -rf ~/.claude/plugins/marketplaces/omc
rm -rf ~/.claude/.omc-config.json
rm -rf ~/.claude/hud/omc-hud.mjs

# 清理项目级数据（可选，会丢失 Axiom 知识库）

rm -rf .omc/

# 重新安装

npm install -g @liangjie559567/ultrapower@latest
omc setup
```

---

## 升级后配置迁移

### 5.2.x → 5.5.x 破坏性变更

1. **状态文件路径变更**
   - 旧: `~/.claude/.omc/state/`
   - 新: `{worktree}/.omc/state/`
   - 迁移: 自动，首次运行时检测并迁移

1. **Marketplace 名称变更**
   - 旧: `ultrapower`
   - 新: `omc`
   - 迁移: `migrateMarketplaceName()` 自动处理

1. **plugin.json 格式变更**
   - 旧: 包含 `hooks` 和 `agents` 字段
   - 新: 仅元数据，组件通过目录自动发现
   - 迁移: `fixMissingPluginJson()` 自动修复

---

## 故障排除命令

```bash

# 诊断工具

/ultrapower:omc-doctor

# 检查版本

omc --version
/ultrapower:omc-help

# 检查插件状态

/plugin list

# 检查 hooks 注册

cat ~/.claude/settings.json | grep -A 30 hooks

# 检查缓存完整性

ls -R ~/.claude/plugins/cache/omc/ultrapower/

# 检查 npm-cache 版本

cat ~/.claude/plugins/npm-cache/package.json | grep ultrapower

# 测试 skills

/ax-status
/ultrapower:trace

# 测试 agents

analyze this file
```

---

## 自动化验证脚本

```bash
#!/bin/bash

# verify-upgrade.sh - 验证 ultrapower 升级是否成功

set -e

echo "=== ultrapower 升级验证 ==="

# 1. 版本检查

echo "1. 检查版本..."
VERSION=$(omc --version 2>/dev/null | | echo "未安装")
echo "   当前版本: $VERSION"
if [[ "$VERSION" != "5.5.14" ]]; then
  echo "   ❌ 版本不匹配"
  exit 1
fi
echo "   ✓ 版本正确"

# 2. plugin.json 检查

echo "2. 检查 plugin.json..."
PLUGIN_JSON="$HOME/.claude/plugins/cache/omc/ultrapower/5.5.14/.claude-plugin/plugin.json"
if [[ ! -f "$PLUGIN_JSON" ]]; then
  echo "   ❌ plugin.json 缺失"
  exit 1
fi
echo "   ✓ plugin.json 存在"

# 3. templates/hooks/ 检查

echo "3. 检查 templates/hooks/..."
TEMPLATES_DIR="$HOME/.claude/plugins/cache/omc/ultrapower/5.5.14/templates/hooks"
if [[ ! -d "$TEMPLATES_DIR" ]]; then
  echo "   ❌ templates/hooks/ 缺失"
  exit 1
fi
HOOK_COUNT=$(ls "$TEMPLATES_DIR"/*.mjs 2>/dev/null | wc -l)
echo "   找到 $HOOK_COUNT 个 hook 文件"
if [[ $HOOK_COUNT -eq 0 ]]; then
  echo "   ❌ 无 hook 文件"
  exit 1
fi
echo "   ✓ templates/hooks/ 完整"

# 4. npm-cache 版本检查

echo "4. 检查 npm-cache 版本锁定..."
NPM_CACHE_PKG="$HOME/.claude/plugins/npm-cache/package.json"
if [[ -f "$NPM_CACHE_PKG" ]]; then
  CACHED_VERSION=$(grep -o '"@liangjie559567/ultrapower": "[^"]*"' "$NPM_CACHE_PKG" | cut -d'"' -f4)
  echo "   npm-cache 版本: $CACHED_VERSION"
  if [[ "$CACHED_VERSION" == ^* ]]; then
    echo "   ⚠️  使用 semver 范围，可能导致升级跳过"
  else
    echo "   ✓ 使用精确版本"
  fi
fi

# 5. 嵌套目录检查

echo "5. 检查嵌套缓存目录..."
NESTED_DIR="$HOME/.claude/plugins/cache/omc/ultrapower/ultrapower"
if [[ -d "$NESTED_DIR" ]]; then
  echo "   ❌ 检测到嵌套目录"
  exit 1
fi
echo "   ✓ 无嵌套目录"

echo ""
echo "=== 验证通过 ✓ ==="
```

使用方法:
```bash
chmod +x verify-upgrade.sh
./verify-upgrade.sh
```

---

## 相关文档

* [INSTALL.md](./INSTALL.md) — 完整安装指南

* [MIGRATION.md](./MIGRATION.md) — 版本迁移指南

* [REFERENCE.md](./REFERENCE.md) — API 参考

* [scripts/plugin-setup.mjs](../scripts/plugin-setup.mjs) — postinstall 修复逻辑

---

## 更新日志

| 日期 | 版本 | 变更 |
| ------ | ------ | ------ |
| 2026-03-05 | 5.5.14 | 初始版本，记录完整升级流程和已知问题 |
