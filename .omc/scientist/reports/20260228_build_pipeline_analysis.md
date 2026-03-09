# ultrapower 构建与发布流水线分析报告

**生成时间**: 2026-02-28
**分析版本**: 5.3.1
**分析范围**: 构建脚本链、发布流程、npm 包内容、插件分发机制

---

## [OBJECTIVE]

分析 ultrapower 项目的完整构建和发布流水线，识别各阶段的依赖关系、产物输出和潜在风险点。

---

## [DATA]

* 构建脚本数量: 6 个（tsc + 5 个 esbuild 脚本）

* 发布流水线步骤: 5 步（preflight → validate → publish → release → sync）

* npm 包 `files` 字段条目: 15 个路径

* bridge/ 预打包产物: 4 个 .cjs 文件

* 版本同步文件: 3 个（package.json / plugin.json / marketplace.json）

* postinstall 修复函数: 4 个（marketplace迁移、缓存嵌套修复、模板复制、plugin.json重建）

---

## [FINDING 1] 构建链是严格串行的 6 步顺序流水线

`npm run build` 的完整命令：
```
tsc && node scripts/build-skill-bridge.mjs && node scripts/build-mcp-server.mjs && node scripts/build-codex-server.mjs && node scripts/build-gemini-server.mjs && node scripts/build-bridge-entry.mjs && npm run compose-docs
```

各步骤产物：

| 步骤 | 入口 | 产物 | 格式 |
| ------ | ------ | ------ | ------ |
| 1. tsc | src/ | dist/ | ESM .js + .d.ts |
| 2. build-skill-bridge | src/hooks/learner/bridge.ts | dist/hooks/skill-bridge.cjs | CJS bundle |
| 3. build-mcp-server | src/mcp/standalone-server.ts | bridge/mcp-server.cjs | CJS bundle |
| 4. build-codex-server | src/mcp/codex-standalone-server.ts | bridge/codex-server.cjs | CJS bundle |
| 5. build-gemini-server | src/mcp/gemini-standalone-server.ts | bridge/gemini-server.cjs | CJS bundle |
| 6. build-bridge-entry | src/team/bridge-entry.ts | bridge/team-bridge.cjs | CJS bundle |
| 7. compose-docs | docs/templates/*.template.md | docs/*.md | Markdown |

[STAT:n] n=6 个 esbuild 打包任务，n=1 个 tsc 编译任务，共 7 步
[STAT:effect_size] 所有 bridge/*.cjs 均使用 esbuild target=node18，format=cjs，bundle=true

---

## [FINDING 2] Agent 提示词在构建时静态嵌入 bundle

codex-server 和 gemini-server 的构建脚本在打包时扫描 `agents/*.md` 和 `agents.codex/*.md`，通过 esbuild `define` 将内容注入为编译时常量：

```js
define: {
  '__AGENT_ROLES__': JSON.stringify(agentRoles),       // 角色名列表
  '__AGENT_PROMPTS__': JSON.stringify(agentPrompts),   // 通用提示词
  '__AGENT_PROMPTS_CODEX__': JSON.stringify(codexPrompts), // Codex 专用提示词
}
```

[STAT:n] codex-server 嵌入 agents/ + agents.codex/ 两套提示词；gemini-server 仅嵌入 agents/
[STAT:effect_size] 构建时静态嵌入消除了运行时文件系统扫描，提升了插件缓存环境下的可靠性

[LIMITATION] 若 agents.codex/ 中缺少某角色的专用提示词，构建时仅输出 WARNING 而不中断构建，可能导致该角色在 Codex 模式下使用通用提示词降级运行。

---

## [FINDING 3] 发布流水线是 5 步顺序管道，支持断点续跑

`release-steps.mjs` 定义的完整流程：

```
preflight → validate → publish → release → sync
```

| 步骤 | 函数 | 核心操作 | 失败行为 |
| ------ | ------ | --------- | --------- |
| 1. preflight | assertVersionsSync() | 校验 3 个文件版本一致 | process.exit(1) |
| 2. validate | tsc --noEmit + npm run build + vitest run | 类型检查 + 构建 + 测试 | process.exit(1) |
| 3. publish | npm publish --access public --tag latest | 推送到 npm registry | process.exit(1) |
| 4. release | gh release create v{version} --generate-notes | 创建 GitHub Release | process.exit(1) |
| 5. sync | syncMarketplace() | 当前为 no-op（tag push 已足够） | 不阻塞 |

支持 `--start-from=<step>` 参数从任意步骤恢复，适合网络中断后续跑。

[STAT:n] n=5 步，每步失败均硬退出，无重试机制
[STAT:effect_size] `--dry-run` 模式对所有步骤均有效，仅打印命令不执行

[LIMITATION] 步骤 5（syncMarketplace）当前是 no-op，marketplace 同步完全依赖 git tag push 触发 CI，若 CI 未配置则 marketplace 不会自动更新。

---

## [FINDING 4] 版本号必须在 3 个文件中保持同步

`bump-version.mjs` 统一管理以下 3 个文件的版本字段：

```
package.json          → version
.claude-plugin/plugin.json  → version
.claude-plugin/marketplace.json → plugins[0].version + plugins[0].source.version
```

`assertVersionsSync()` 在 preflight 阶段强制校验，任何不一致都会阻断发布。

[STAT:n] n=3 个需要同步的版本字段位置
[STAT:effect_size] marketplace.json 中 source.version 与 plugins[0].version 是两个独立字段，bump 脚本同时更新两者

[LIMITATION] bump 脚本不自动提交 git，需要手动 commit 版本变更后再运行发布流水线。

---

## [FINDING 5] npm 包内容包含 15 个路径，bridge/ 是关键的预打包产物

`package.json` 的 `files` 字段定义了发布到 npm 的内容：

```
dist/                          # TypeScript 编译产物（ESM）
agents/                        # Agent 提示词 .md 文件
bridge/                        # 预打包 CJS bundles（4 个）
  ├── mcp-server.cjs
  ├── codex-server.cjs
  ├── gemini-server.cjs
  └── team-bridge.cjs
commands/                      # CLI 命令定义
hooks/                         # Hook 脚本
scripts/                       # 构建/安装脚本（含 postinstall）
skills/                        # Skill 定义文件
templates/                     # Hook 模板
docs/                          # 文档
.claude-plugin/plugin.json     # 插件清单
.claude-plugin/marketplace.json # 市场清单
.mcp.json                      # MCP 服务器配置
settings.json                  # Claude Code 设置
README.md / LICENSE
```

[STAT:n] n=15 个顶层路径，其中 bridge/ 包含 4 个独立 CJS bundle
[STAT:effect_size] bridge/*.cjs 是插件在 Claude Code 插件缓存中运行的核心，不依赖 node_modules

---

## [FINDING 6] postinstall 脚本处理 4 类已知的 Claude Code 安装 Bug

`scripts/plugin-setup.mjs` 在 `npm install` 后自动执行，修复 4 个已知问题：

| 函数 | 修复的问题 | 触发条件 |
| ------ | ----------- | --------- |
| migrateMarketplaceName() | marketplace 目录名 ultrapower→omc 迁移 | 旧版用户升级 |
| fixNestedCacheDir() | Claude Code 安装器 Bug 导致的缓存目录无限嵌套 | Pattern A/B 两种嵌套模式 |
| copyTemplatesToCache() | npm install 后 templates/ 未被复制到插件缓存 | 每次安装 |
| fixMissingPluginJson() | npm 跳过隐藏目录导致 .claude-plugin/plugin.json 缺失 | 每次安装 |

[STAT:n] n=4 个修复函数，n=2 种缓存嵌套模式（Pattern A: 平铺根目录，Pattern B: 版本化嵌套）
[STAT:effect_size] fixNestedCacheDir 最多遍历 20 层深度查找真实插件内容

[LIMITATION] postinstall 修复依赖 `~/.claude/` 路径，若用户设置了 `CLAUDE_CONFIG_DIR` 环境变量则路径正确，但若 Claude Code 使用非标准路径则修复可能失效。

---

## [FINDING 7] npm 分发的 Claude Code 插件安装路径

marketplace.json 中的 source 字段定义了插件来源：

```json
{
  "source": "npm",
  "package": "@liangjie559567/ultrapower",
  "version": "5.3.1"
}
```

Claude Code 安装流程：
1. 读取 marketplace.json 中的 source 字段
2. 执行 `npm install @liangjie559567/ultrapower@5.3.1`
3. 将包内容复制到 `~/.claude/plugins/cache/omc/ultrapower/5.3.1/`
4. 触发 postinstall（plugin-setup.mjs）修复已知 Bug
5. 从缓存目录加载 plugin.json 注册 skills/hooks/commands/mcpServers

[STAT:n] 插件缓存路径深度: ~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/
[STAT:effect_size] plugin.json 中 mcpServers 字段指向 ./.mcp.json，bridge/*.cjs 通过此配置注册为 MCP 服务器

---

## 总体局限性

[LIMITATION] 构建链完全串行，无并行化，在 CI 环境中构建时间较长。

[LIMITATION] bridge/*.cjs 外部化了 @ast-grep/napi 和 better-sqlite3（原生模块），运行时通过 `npm root -g` 动态解析全局 node_modules，若用户未全局安装这些包则相关功能静默降级。

[LIMITATION] compose-docs 步骤当前实现较简单（仅同步 partials），模板 {{INCLUDE:}} 语法已定义但实际处理逻辑未在脚本中体现，可能存在文档组合不完整的风险。

[LIMITATION] 发布流水线无自动回滚机制，若 step 3（npm publish）成功但 step 4（gh release）失败，需手动处理版本状态。

---

## 完整构建发布流程图

```
开发阶段
  └─ node scripts/bump-version.mjs <version>
       ├─ package.json.version
       ├─ .claude-plugin/plugin.json.version
       └─ .claude-plugin/marketplace.json.plugins[0].version + source.version

构建阶段（npm run build）
  ├─ 1. tsc → dist/ (ESM)
  ├─ 2. build-skill-bridge → dist/hooks/skill-bridge.cjs
  ├─ 3. build-mcp-server → bridge/mcp-server.cjs
  ├─ 4. build-codex-server → bridge/codex-server.cjs  [嵌入 agents/ + agents.codex/]
  ├─ 5. build-gemini-server → bridge/gemini-server.cjs [嵌入 agents/]
  ├─ 6. build-bridge-entry → bridge/team-bridge.cjs
  └─ 7. compose-docs → docs/*.md

发布阶段（npm run release:local）
  ├─ Step 1: preflight → assertVersionsSync()
  ├─ Step 2: validate → tsc --noEmit + npm run build + vitest run
  ├─ Step 3: publish → npm publish --access public
  ├─ Step 4: release → gh release create v{version}
  └─ Step 5: sync → no-op（tag push 触发 CI）

用户安装阶段（Claude Code 插件市场）
  ├─ npm install @liangjie559567/ultrapower@{version}
  ├─ postinstall: plugin-setup.mjs
  │    ├─ migrateMarketplaceName()
  │    ├─ fixNestedCacheDir()
  │    ├─ copyTemplatesToCache()
  │    └─ fixMissingPluginJson()
  └─ Claude Code 从 ~/.claude/plugins/cache/omc/ultrapower/{version}/ 加载插件
```

---

报告保存到: .omc/scientist/reports/20260228_build_pipeline_analysis.md
