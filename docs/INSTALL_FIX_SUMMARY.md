# 安装文档修复总结

## 问题描述

用户报错：`npm install -g ultrapower` 返回 404 Not Found

**根本原因**：包名不匹配
- npm 上的实际包名：`@liangjie559567/ultrapower`（scoped package）
- 错误的命令：`npm install -g ultrapower`（缺少 scope 前缀）

**第二个问题**：插件安装命令不一致
- 正确命令：`/plugin install omc@ultrapower`
- 错误命令：`/plugin install ultrapower`

## 已修复的文档

### 1. README.md ✅
- 更新安装章节，添加完整的 Claude Code 插件市场安装流程
- 添加 npm 全局安装方式（使用正确的 scoped 包名）
- 添加安装向导步骤 `/ultrapower:omc-setup`

### 2. docs/INSTALL.md ✅
- 修复"方式三：npm 全局安装"中的包名
- 从 `npm install -g ultrapower` 改为 `npm install -g @liangjie559567/ultrapower`
- 修复插件安装命令：`/plugin install omc@ultrapower`
- 修复版本号引用：`/plugin install omc@ultrapower@5.2.2`

### 3. docs/LOCAL_INSTALL_VERIFICATION.md ✅
- 修复插件安装命令：`/plugin install omc@ultrapower`

### 4. docs/PLUGIN_MARKETPLACE_VERIFICATION.md ✅
- 修复所有插件安装命令引用

### 5. docs/UPGRADE_VERIFICATION.md ✅
- 修复所有插件安装命令引用

## 正确的安装方式

### 方式一：Claude Code 插件市场（推荐）

```bash
# 第一步：添加插件市场
/plugin marketplace add https://github.com/liangjie559567/ultrapower

# 第二步：安装插件
/plugin install omc@ultrapower

# 第三步：运行安装向导
/ultrapower:omc-setup
```

### 方式二：npm 全局安装

```bash
npm install -g @liangjie559567/ultrapower
```

## 其他文档中的正确用法

以下文档已经使用了正确的包名，无需修改：

- ✅ `docs/MIGRATION.md` - 所有安装命令都使用 `@liangjie559567/ultrapower`
- ✅ `.omc/axiom/evolution/learning_queue.md` - 使用正确的包名
- ✅ `docs/guides/v5.5.13-new-features.md` - 使用正确的包名
- ✅ `docs/RELEASE_NOTES_v5.5.14.md` - 使用正确的包名

## 验证

用户现在可以使用以下任一方式成功安装：

1. **插件市场安装**（推荐）：
   - 自动处理依赖
   - 集成到 Claude Code 插件系统
   - 支持自动更新
   - 命令：`/plugin install omc@ultrapower`

2. **npm 全局安装**：
   ```bash
   npm install -g @liangjie559567/ultrapower
   ```

## 修复统计

- 修复文档数量：5 个
- 修复的错误命令：
  - `npm install -g ultrapower` → `npm install -g @liangjie559567/ultrapower`
  - `/plugin install ultrapower` → `/plugin install omc@ultrapower`

## 修复日期

2026-03-05

## 相关 Issue

用户报错：`npm error 404 Not Found - GET https://registry.npmjs.org/ultrapower`

已通过更新文档解决。所有安装文档现在使用正确的包名和插件安装命令。
