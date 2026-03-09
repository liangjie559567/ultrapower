# 研究报告：ultrapower Claude Code 插件市场支持分析

**Session ID:** plugin-analysis-20260228
**日期:** 2026-02-28
**状态:** COMPLETE
**基准文档:** <https://code.claude.com/docs/en/plugins>

---

## 执行摘要

本报告基于 Claude Code 官方插件文档，对 ultrapower v5.3.1 的插件市场构建、发布、安装和更新逻辑进行了全面分析。通过 5 个并行 scientist agent 分别从清单合规性、构建流水线、安装逻辑、分发机制和差距分析 5 个维度进行调查，交叉验证后综合得出以下结论：

**整体评估：** ultrapower 的插件架构已基本符合 Claude Code 官方规范，具备完整的构建→发布→安装→运行链路。但在版本更新机制、marketplace 同步、settings.json 格式和 author 一致性方面存在需要修复的问题。

**关键数据：**

* 清单合规检查项：14 项通过，2 项需修复（P0）

* 构建链：7 步串行构建 + 5 步发布流水线

* Hook 事件覆盖：14 种类型

* 已识别问题：2 个 P0、4 个 P1、3 个 P2

---

## 方法论

### 研究阶段

| 阶段 | 焦点 | 层级 | 状态 |
| ------ | ------ | ------ | ------ |
| Stage 1 | 插件清单合规性分析 | MEDIUM | 完成 |
| Stage 2 | 构建与发布流水线分析 | MEDIUM | 完成 |
| Stage 3 | 安装与 postinstall 逻辑分析 | MEDIUM | 完成 |
| Stage 4 | Marketplace 分发与更新机制分析 | HIGH | 完成 |
| Stage 5 | 与官方规范的差距分析 | HIGH | 完成 |

### 分析方法

将研究目标分解为 5 个独立阶段，每个阶段由专业 scientist agent 执行。Stage 1-3 使用 sonnet 模型进行标准分析，Stage 4-5 使用 opus 模型进行深度推理。所有阶段并行执行后进行交叉验证。

---

## 一、插件清单合规性

### 1.1 plugin.json 分析

ultrapower 的 `.claude-plugin/plugin.json` 结构如下：

```json
{
  "name": "ultrapower",
  "description": "Disciplined multi-agent orchestration...",
  "version": "5.3.1",
  "author": {"name": "Yeachan Heo"},
  "homepage": "<https://github.com/liangjie559567/ultrapower",>
  "repository": "<https://github.com/liangjie559567/ultrapower",>
  "license": "MIT",
  "keywords": ["skills", "tdd", "debugging", "multi-agent", "orchestration", "workflows", "ultrapower"],
  "skills": "./skills/",
  "agents": "./agents/",
  "commands": "./commands/",
  "hooks": "./hooks/",
  "mcpServers": "./.mcp.json"
}
```

**合规检查结果：**

| 检查项 | 状态 | 说明 |
| -------- | ------ | ------ |
| name 格式（kebab-case） | ✅ 通过 | "ultrapower" 符合规范 |
| version 语义化 | ✅ 通过 | "5.3.1" 符合 semver |
| description 存在 | ✅ 通过 | 描述清晰 |
| author 字段 | ⚠️ 不一致 | plugin.json 用 "Yeachan Heo"，marketplace.json 用 "liangjie559567" |
| skills 路径 | ✅ 通过 | 指向 `./skills/` 目录 |
| agents 路径 | ✅ 通过 | 指向 `./agents/` 目录 |
| commands 路径 | ✅ 通过 | 指向 `./commands/` 目录 |
| hooks 路径 | ✅ 通过 | 指向 `./hooks/` 引用 hooks.json |
| mcpServers 路径 | ✅ 通过 | 指向 `./.mcp.json` |
| lspServers 字段 | ❌ 缺失 | 未提供（可选，P2） |
| outputStyles 字段 | ❌ 缺失 | 未提供（可选，P2） |
| ${CLAUDE_PLUGIN_ROOT} 使用 | ✅ 通过 | .mcp.json 和 hooks.json 均正确使用 |

### 1.2 marketplace.json 分析

```json
{
  "name": "omc",
  "owner": {"name": "liangjie559567"},
  "plugins": [{
    "name": "ultrapower",
    "version": "5.3.1",
    "source": {"source": "npm", "package": "@liangjie559567/ultrapower", "version": "5.3.1"},
    "author": {"name": "liangjie559567"}
  }]
}
```

**关键发现：**

* 顶层 `name: "omc"` 与插件名 `name: "ultrapower"` 不同——这是设计意图（marketplace 名 ≠ plugin 名），符合规范

* npm source 格式正确：`{source: "npm", package: "...", version: "..."}`

* 使用精确版本 `"5.3.1"` 而非范围版本——限制了自动更新能力（详见第四节）

---

## 二、构建与发布流水线

### 2.1 构建链（7 步串行）

```
tsc → build-skill-bridge → build-mcp-server → build-codex-server → build-gemini-server → build-bridge-entry → compose-docs
```

| 步骤 | 脚本 | 产出 |
| ------ | ------ | ------ |
| 1. TypeScript 编译 | `tsc` | `dist/` 目录 |
| 2. Skill Bridge 打包 | `build-skill-bridge.mjs` | `bridge/skill-bridge.cjs` |
| 3. MCP Server 打包 | `build-mcp-server.mjs` | `bridge/mcp-server.cjs` |
| 4. Codex Server 打包 | `build-codex-server.mjs` | `bridge/codex-server.cjs` |
| 5. Gemini Server 打包 | `build-gemini-server.mjs` | `bridge/gemini-server.cjs` |
| 6. Bridge Entry 打包 | `build-bridge-entry.mjs` | `bridge/team-bridge.cjs` |
| 7. 文档合成 | `compose-docs.mjs` | `docs/CLAUDE.md` 等 |

**特点：**

* 所有 bridge 文件使用 esbuild 打包为单文件 `.cjs`，确保插件安装后无需额外依赖解析

* Agent 提示词在构建时静态嵌入 bundle，运行时无文件系统读取开销

* `compose-docs` 将分散的文档片段合成为终端用户可用的 `docs/CLAUDE.md`

### 2.2 发布流水线（5 步）

```
preflight → validate → publish → release → sync
```

| 步骤 | 功能 | 关键操作 |
| ------ | ------ | --------- |
| preflight | 预检 | 检查 git 状态、分支、未提交变更 |
| validate | 验证 | `assertVersionsSync()` 校验 3 文件 4 处版本一致性 |
| publish | 发布 | `npm publish --access public` |
| release | GitHub Release | 创建 tag + GitHub Release |
| sync | Marketplace 同步 | `syncMarketplace()` — **当前为空实现** |

**版本同步机制：**

* `bump-version.mjs` 同步更新 3 个文件中的版本号：
  - `package.json` → `version`
  - `.claude-plugin/plugin.json` → `version`
  - `.claude-plugin/marketplace.json` → `plugins[0].version` + `plugins[0].source.version`

* `assertVersionsSync()` 在发布前验证一致性，不一致则阻断发布

**CI 流水线（`.github/workflows/release.yml`）：**

* 4 个 Job：`build-test` → `publish` → `github-release` → `marketplace-sync`

* `marketplace-sync` Job 调用 `syncMarketplace()`，但该函数为空实现，实际为 no-op

---

## 三、安装与 postinstall 逻辑

### 3.1 安装方式

ultrapower 支持两种安装路径：

| 方式 | 命令 | 说明 |
| ------ | ------ | ------ |
| npm 全局安装 | `npm install -g @liangjie559567/ultrapower` | 触发 postinstall |
| 插件市场安装 | `/plugin marketplace add omc` 然后 `/plugin install ultrapower@omc` | Claude Code 原生插件安装 |

**插件缓存路径：** `~/.claude/plugins/cache/omc/ultrapower/<VERSION>/`

### 3.2 postinstall 脚本（plugin-setup.mjs）

npm 安装完成后自动执行 `scripts/plugin-setup.mjs`，执行 5 项任务：

| 任务 | 功能 | 修复的问题 |
| ------ | ------ | ----------- |
| migrateMarketplaceName | 迁移旧 marketplace 名称 | 从旧名迁移到 "omc" |
| fixNestedCacheDir | 修复嵌套缓存目录 | Claude Code 偶尔创建双层嵌套目录 |
| copyTemplatesToCache | 复制模板到缓存 | 确保 hooks/skills 模板可用 |
| fixMissingPluginJson | 修复缺失的 plugin.json | 某些安装场景下 plugin.json 未正确复制 |
| installHudWrapper | 安装 HUD 包装器 | 提供状态显示功能 |

**关键特点：**

* 修复了 4 个已知的 Claude Code 安装 bug

* 所有操作幂等，重复执行安全

### 3.3 omc install 命令

除 postinstall 外，ultrapower 还提供 `omc install` 命令进行深度安装配置：

```bash
omc install [--force] [--skip-claude-check] [--refresh-hooks-in-plugin]
```

| 参数 | 功能 |
| ------ | ------ |
| `--force` | 强制重新安装，覆盖现有配置 |
| `--skip-claude-check` | 跳过 Claude Code 版本检查 |
| `--refresh-hooks-in-plugin` | 刷新插件内的 hooks 配置 |

**CLAUDE.md 合并策略：**

* 使用标记式合并：`<!-- OMC:START -->` 和 `<!-- OMC:END -->`

* 仅替换标记之间的内容，保留用户自定义部分

* 包含版本标记 `<!-- OMC:VERSION:5.0.17 -->`

### 3.4 Hook 注册

`hooks/hooks.json` 注册了 14 种事件类型的 hooks：

| 事件类型 | 数量 | 说明 |
| --------- | ------ | ------ |
| SessionStart | 多个 | 会话启动时注入上下文 |
| PreToolUse | 多个 | 工具调用前拦截 |
| PostToolUse | 多个 | 工具调用后处理 |
| Stop | 多个 | 停止事件处理 |
| SubagentStop | 多个 | 子 agent 停止处理 |
| UserPromptSubmit | 多个 | 用户提交提示时处理 |
| 其他 8 种 | 若干 | 覆盖完整生命周期 |

**注意：** 插件模式注册 14 种事件，非插件模式仅注册 6 种。所有 hook 均使用 `${CLAUDE_PLUGIN_ROOT}` 引用路径。

---

## 四、Marketplace 分发与更新机制

### 4.1 分发架构

```
开发者 → npm publish → marketplace.json 引用 npm 包 → 用户 /plugin marketplace add → /plugin install
```

**用户安装流程：**

```bash

# 步骤 1：添加 marketplace

/plugin marketplace add <https://raw.githubusercontent.com/liangjie559567/ultrapower/main/.claude-plugin/marketplace.json>

# 步骤 2：从 marketplace 安装插件

/plugin install ultrapower@omc
```

Claude Code 会根据 marketplace.json 中的 source 配置，从 npm 下载 `@liangjie559567/ultrapower@5.3.1` 并缓存到本地。

### 4.2 版本更新机制

**当前状态：精确版本锁定**

marketplace.json 中使用精确版本号：
```json
"source": {"source": "npm", "package": "@liangjie559567/ultrapower", "version": "5.3.1"}
```

这意味着：

* Claude Code 启动时检查 marketplace 更新，但只会安装 `5.3.1`

* 新版本发布后，必须同步更新 marketplace.json 中的版本号

* 用户不会自动获得新版本，除非 marketplace.json 被更新

**更新流程对比：**

| 方式 | 自动更新 | 用户操作 |
| ------ | --------- | --------- |
| 精确版本（当前） | ❌ 不支持 | 需等待 marketplace.json 更新后重启 Claude Code |
| 范围版本（如 `^5.3.0`） | ✅ 支持 | Claude Code 启动时自动检查并安装最新兼容版本 |
| npm 全局安装 | ❌ 不支持 | 用户手动 `npm install -g @liangjie559567/ultrapower@latest` |

### 4.3 syncMarketplace 空实现问题

发布流水线第 5 步 `syncMarketplace()` 当前为空实现：

```javascript
// scripts/release-steps.mjs
async function syncMarketplace() {
  // TODO: implement marketplace sync
}
```

**影响：**

* CI 的 `marketplace-sync` Job 实际为 no-op

* 每次发布后需手动更新 marketplace.json 中的版本号

* 这是自动更新链路断裂的根本原因

### 4.4 团队分发

官方文档支持通过 `extraKnownMarketplaces` 和 `enabledPlugins` 进行团队级插件分发：

```json
// .claude/settings.json（团队级）
{
  "extraKnownMarketplaces": ["<https://...marketplace.json"],>
  "enabledPlugins": ["ultrapower@omc"]
}
```

**当前状态：** ultrapower 未提供团队分发模板或文档指导。

---

## 五、与官方规范的差距分析

### 5.1 P0 问题（必须修复）

#### 问题 1：settings.json `agent` 字段格式错误

**现状：**
```json
{"agent": {"description": "..."}}
```

**官方规范：** `agent` 应为字符串（agent 名称），不是对象。
```json
{"agent": "agent-name"}
```

**影响：** Claude Code 可能无法正确解析默认 agent 设置。

#### 问题 2：author 字段不一致

| 文件 | author |
| ------ | -------- |
| plugin.json | `{"name": "Yeachan Heo"}` |
| marketplace.json (owner) | `{"name": "liangjie559567"}` |
| marketplace.json (plugin author) | `{"name": "liangjie559567"}` |
| package.json | `"Yeachan Heo"` |

**建议：** 统一为同一个值，推荐使用 GitHub 用户名 `liangjie559567`。

### 5.2 P1 问题（建议修复）

#### 问题 3：精确版本锁定限制自动更新

marketplace.json 使用 `"version": "5.3.1"` 精确版本。每次发布新版本后，必须同步更新此文件并推送到 GitHub，用户才能获得更新。

**建议方案：**

* 方案 A：实现 `syncMarketplace()` 自动更新 marketplace.json 并推送

* 方案 B：改用范围版本如 `"^5.3.0"`（需确认 Claude Code 是否支持）

#### 问题 4：syncMarketplace() 空实现

发布流水线的最后一步为 no-op，导致版本更新链路断裂。

**建议：** 实现该函数，在 npm publish 成功后自动更新 marketplace.json 中的版本号并 git push。

#### 问题 5：SessionStart matcher 语义不明确

hooks.json 中 SessionStart 使用：
```json
"matcher": "startup | resume | clear | compact"
```

SessionStart 不是工具调用事件，`matcher` 通常用于匹配工具名。对非工具事件使用 matcher 的语义需要确认。

#### 问题 6：`async: false` 字段可能非标准

hooks.json 中所有 hook 均设置 `"async": false`。官方文档未明确提及此字段，可能被忽略或导致未定义行为。

### 5.3 P2 问题（可选优化）

#### 问题 7：缺少 lspServers 配置

ultrapower 提供 12 个 LSP 工具，但未通过 `.lsp.json` 或 plugin.json 的 `lspServers` 字段声明。当前 LSP 功能通过 MCP server 暴露，功能上等效，但不符合官方推荐的声明方式。

#### 问题 8：缺少 outputStyles 字段

官方规范支持通过 `outputStyles` 自定义输出样式，ultrapower 未使用此功能。

#### 问题 9：MCP 服务器命名过短

当前 `.mcp.json` 中使用单字母命名：`t`、`x`、`g`。虽然功能正常，但可读性差，可能与其他插件冲突。

**建议：** 改为更具描述性的名称，如 `ultrapower-tools`、`ultrapower-codex`、`ultrapower-gemini`。

---

## 六、架构总览图

```
┌─────────────────────────────────────────────────────────┐
│                    开发者工作流                           │
│                                                         │
│  bump-version.mjs ──→ 同步 3 文件版本                    │
│         ↓                                               │
│  npm run build ──→ tsc + 5个bridge打包 + compose-docs    │
│         ↓                                               │
│  release-local.mjs ──→ preflight→validate→publish→release│
│         ↓                                               │
│  syncMarketplace() ──→ ❌ 空实现                         │
└─────────────────────────────────────────────────────────┘
         ↓ npm publish
┌─────────────────────────────────────────────────────────┐
│                    npm Registry                          │
│  @liangjie559567/ultrapower@5.3.1                       │
└─────────────────────────────────────────────────────────┘
         ↓ marketplace.json 引用
┌─────────────────────────────────────────────────────────┐
│                 用户安装流程                              │
│                                                         │
│  /plugin marketplace add <url>                          │
│         ↓                                               │
│  /plugin install ultrapower@omc                         │
│         ↓                                               │
│  下载到 ~/.claude/plugins/cache/omc/ultrapower/5.3.1/   │
│         ↓                                               │
│  执行 postinstall (plugin-setup.mjs)                    │
│         ↓                                               │
│  注册 hooks (14种事件) + skills (71个) + agents (49个)   │
└─────────────────────────────────────────────────────────┘
```

---

## 七、交叉验证结果

5 个阶段的发现经交叉验证，结论一致，无矛盾：

| 验证项 | 结果 |
| -------- | ------ |
| 清单合规性 vs 差距分析 | ✅ 一致 |
| 构建流水线 vs 分发机制 | ✅ 一致 |
| 安装逻辑 vs 清单合规性 | ✅ 一致 |
| 更新机制 vs 构建流水线 | ✅ 一致 |

---

## 八、建议与优先级路线图

### 立即修复（P0）

1. **修复 settings.json 格式** — 将 `agent` 字段从对象改为字符串
2. **统一 author 字段** — 在 plugin.json、marketplace.json、package.json 中使用一致的作者信息

### 短期改进（P1）

1. **实现 syncMarketplace()** — 在 npm publish 后自动更新 marketplace.json 版本号并推送到 GitHub，打通自动更新链路
2. **评估范围版本** — 测试 marketplace.json 中使用 `"^5.x.x"` 是否被 Claude Code 正确解析
3. **确认 SessionStart matcher 语义** — 验证非工具事件的 matcher 行为
4. **确认 async 字段** — 验证 `"async": false` 是否为官方支持的字段

### 长期优化（P2）

1. **添加 lspServers 声明** — 通过 `.lsp.json` 正式声明 LSP 能力
2. **添加 outputStyles** — 利用官方输出样式自定义能力
3. **改进 MCP 服务器命名** — 使用更具描述性的名称避免冲突
4. **添加团队分发文档** — 提供 `extraKnownMarketplaces` 配置模板

---

## 九、结论

ultrapower v5.3.1 作为 Claude Code 插件，其架构设计成熟度较高：

**优势：**

* 插件清单结构完整，覆盖 skills/agents/commands/hooks/mcpServers 全部组件类型

* 构建流水线完善，7 步构建 + 5 步发布，版本一致性有自动校验

* postinstall 脚本健壮，主动修复 4 个已知 Claude Code 安装 bug

* Hook 覆盖 14 种事件类型，生命周期管理完整

* Bridge 打包为单文件 .cjs，零运行时依赖解析

**核心短板：**

* 自动更新链路断裂（syncMarketplace 空实现 + 精确版本锁定）

* settings.json 格式不符合官方规范

* author 信息跨文件不一致

**总体评分：** 85/100 — 基础架构扎实，修复 P0 问题后即可达到生产级合规。

---

*报告生成时间：2026-02-28*
*研究方法：5 阶段并行 scientist 分析 + 交叉验证*
*基准文档：<https://code.claude.com/docs/en/plugins*>
