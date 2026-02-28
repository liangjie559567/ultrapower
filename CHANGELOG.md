# ultrapower v5.3.0

### 新增

- **feat(hooks): 新增 SubagentStop hook** — 子 agent 完成时触发，防止无限循环
- **feat(hooks): 新增 PreCompact hook** — 上下文压缩前保存 Axiom 状态
- **feat(hooks): 新增 TeammateIdle hook** — 团队成员空闲时触发，默认允许

---

# ultrapower v5.2.13

### 修复

- **fix(plugin): 修复 `fixNestedCacheDir()` Pattern B 中 `versions` 未定义的 bug**
  - 根因：Pattern B 分支直接使用 `versions` 变量但未在该作用域内定义，导致 `ReferenceError` 被 catch 吞掉，Pattern B 逻辑从未执行
  - 修复：在 Pattern B 开头添加 `const versions = readdirSync(pluginCacheBase)`

---

# ultrapower v5.2.12

### 修复

- **fix(plugin): 完整迁移 marketplace 注册表**（补充 v5.2.11）
  - v5.2.11 仅迁移了目录名和 `marketplace.json`，遗漏了 `known_marketplaces.json`（key `ultrapower` → `omc`）和 `installed_plugins.json`（key `ultrapower@ultrapower` → `ultrapower@omc`）
  - 这两个文件是 Claude Code 查找 marketplace 和已安装插件的核心索引，未迁移导致 `/plugin install omc@ultrapower` 仍然失败
  - 现在 `migrateMarketplaceName()` 同步修正全部三个文件

---

# ultrapower v5.2.11

### 修复

- **fix(plugin): 自动迁移本地 marketplace 目录名 `ultrapower` → `omc`**
  - 根因：v5.2.10 将 marketplace name 改为 `omc`，但已通过 GitHub URL 添加 marketplace 的用户本地目录仍为 `marketplaces/ultrapower/`，导致 `/plugin install omc@ultrapower` 报错 "Plugin 'omc' not found"
  - 修复：`plugin-setup.mjs` 新增 `migrateMarketplaceName()`，postinstall 时自动将 `marketplaces/ultrapower/` 重命名为 `marketplaces/omc/`，并同步修正目录内 `marketplace.json` 的 `name` 字段

---

# ultrapower v5.2.10

### 修复

- **fix(plugin): marketplace name 改为 `omc`，根治缓存路径无限嵌套**
  - 根因：marketplace name = plugin name = `ultrapower`，导致缓存路径 `plugins/cache/ultrapower/ultrapower/` 被 `fixNestedCacheDir()` 误判为嵌套并循环删除
  - 新缓存路径：`plugins/cache/omc/ultrapower/VERSION/`，marketplace ≠ plugin name，彻底消除嵌套触发条件
  - 同步更新 `plugin-setup.mjs` 所有硬编码路径及相关文档

---

# ultrapower v5.2.6

### 测试

- **自动发布工作流测试**：新增 `release-steps.test.ts`，覆盖 `validateBuild`、`publishNpm`、`createGithubRelease`、`syncMarketplace`、`runReleasePipeline` 的 dry-run 路径及失败路径（9 个测试）
- **自动更新插件工作流测试**：扩展 `auto-update.test.ts`，新增 `performUpdate` 插件模式、`syncMarketplaceClone` 4 分支、`silentAutoUpdate` 速率限制与退避逻辑（13 个测试）
- 全套测试：4698 passed, 0 failed

---

# ultrapower v5.2.2

### 修复

- **plugins/cache 无限嵌套修复**：`fixNestedCacheDir()` 新增 Pattern A 检测，直接删除 `cache/ultrapower/ultrapower/`（无版本层的平铺嵌套），修复 Windows 上 Claude Code 每次重启产生 15+ 层嵌套导致无法启动的问题

---

# ultrapower v5.2.1

### 修复

- **extractSkillName 大小写修复**：`toolName.toLowerCase()` 统一规范化，修复 Claude Code 发送 `"Skill"`（大写）无法匹配 `'skill'`（小写）导致 skills 追踪始终为空的问题（k-044）

### 进化引擎

- **ax-evolve Cycle 3**：处理 LQ-001~LQ-013 全量，知识库扩展至 45 条，新增 P-004 大小写反模式

### 测试

- 4589 passed, 0 failed

---

# ultrapower v5.2.0

### 新功能

- **nexus Phase 2 主动学习系统**：完整的自我改进基础设施，包含 14 个原子任务
  - `nexus-daemon`：Python 守护进程，监控 `.omc/axiom/evolution/learning_queue.md` 并自动触发进化
  - `data-collector` hook：会话结束时收集工具使用数据、错误模式和成功率
  - `consciousness-sync` hook：同步 Axiom 记忆系统（active_context、project_decisions、user_preferences）
  - `improvement-puller` hook：从学习队列拉取待处理改进项并注入上下文
  - `nexus-ts-plugin`：TypeScript 插件层，提供 `NexusClient` API 供 TS 代码调用 Python 守护进程
  - `skills/nexus/SKILL.md`：nexus skill 入口，支持 `/ultrapower:nexus` 命令
- **进化引擎 Cycle 2**：处理 LQ-008/009/010，知识库扩展至 38 条，新增 WF-006/007 工作流指标
- **贡献规范扩展**（`docs/standards/contribution-guide.md`）：
  - 新增 §6.1 动态版本读取模式（`getRuntimePackageVersion()` 最佳实践）
  - 新增 §6.2 特性分支生命周期（PR merge → 删除分支 → dev→main → main→dev）

### 修复

- **vitest 配置**：排除 `tests/brainstorm-server/**` 独立 Node.js assert 脚本，防止测试框架误识别
- **skill 计数**：`src/__tests__/skills.test.ts` 期望数量 70→71，`expectedSkills` 数组新增 `nexus`

### 测试

- 205 passed, 0 failed（+nexus 相关测试）

---

# ultrapower v5.1.0

### 新功能

- **nexus Phase 1 被动学习 MVP**：6 个核心任务完成
  - `NexusConfig` 类型系统和配置加载器（`src/features/nexus/`）
  - `data-collector` hook 基础框架
  - `consciousness-sync` hook 基础框架
  - `processSessionEnd` 集成 nexus hook 注册
  - Python 守护进程基础框架（`src/features/nexus/daemon/`）
  - `improvement-puller` hook 基础框架
- **Axiom 进化引擎 Cycle 1**：处理 LQ-001~LQ-007，知识库建立 35 条基础条目

### 测试

- 205 passed, 0 failed（2 轮代码/安全审查通过）

---

# ultrapower v5.0.25

### 修复

- **ax-context init 无限循环**：`skills/ax-context/SKILL.md` 的 init 命令缺少执行指令，导致 Opus 4.6 反复重试（`PreToolUse:Skill hook error` 循环 20+ 次）
  - 新增编号步骤：`Bash("mkdir -p .omc/axiom/evolution")` + 9 个 `Write(...)` 调用（含初始内容模板）
  - 新增回归测试 `src/skills/__tests__/ax-context-init.test.ts`（2 个测试），验证 init 节包含可执行指令

---

# ultrapower v5.0.24

### 修复

- **Plugin Cache 缺少 templates/**：`plugin-setup.mjs` 新增 `copyTemplatesToCache()` 函数，在 postinstall 时将 `templates/hooks/` 复制到插件缓存，修复 `stop-continuation.mjs MODULE_NOT_FOUND` 错误
  - 使用 `withFileTypes + isDirectory()` 守卫，跳过非目录条目
  - 复制失败时清理空目录，允许下次安装重试
  - 为 `dirname(__dirname)` 假设添加文档注释
- **测试覆盖**：新增 `src/__tests__/hooks-json-paths.test.ts`（4 个测试），验证 `hooks/hooks.json` 路径正确性

---

# ultrapower v5.0.23

### 修复

- **安全加固（C-01）**：`assertValidMode()` 错误消息截断超长输入（>50 字符），防止 DoS 攻击和信息泄露
- **安全测试（H-02）**：`validateMode.test.ts` 新增 6 个安全边界测试用例
  - 空白字符串（空格/制表符/换行）
  - null 字节注入（`autopilot\x00`、`autopilot\x00../../etc`）
  - 原型污染向量（`__proto__`、`constructor`、`prototype`）
  - 超长字符串（100 万字符）不抛出异常
  - 错误消息截断验证（长度 < 500，含 `truncated` 标记）
  - 非字符串输入不暴露原始内容（防止对象属性泄露）
- **文档修复（M-02）**：`audit-report.md` 补充 D-10 差异点（死锁检测常量已定义但未实现），差异点总数更新为 10 个
- **版本同步（L-01）**：`docs/standards/` 下版本引用从 v5.0.21 更新至 v5.0.22
- **示例修复（L-02）**：`anti-patterns.md` 中 `validateMode()` 无参调用修正为 `validateMode(undefined)`

---

# ultrapower v5.0.22

### 新增

- **全链路规范体系**：新增 `docs/standards/` 目录，包含 8 个规范文档和 3 个模板
  - `README.md`：规范体系索引，P0/P1 优先级分层
  - `audit-report.md`：Axiom 专家评审报告（10 个差异点 D-01~D-10，4 个技术债务 TD-1~TD-4）
  - `runtime-protection.md`：运行时保护规范（路径遍历防护、输入验证）
  - `hook-execution-order.md`：Hook 执行顺序规范
  - `state-machine.md`：状态机规范（7 个状态，互斥模式 4 个）
  - `agent-lifecycle.md`：Agent 生命周期规范
  - `user-guide.md`：用户指南
  - `anti-patterns.md`：反模式文档（6 类，含 ❌/✅ 示例）
  - `contribution-guide.md`：贡献指南
  - `templates/`：skill/agent/hook 三个模板

- **安全防护实现**：`src/lib/validateMode.ts` 新增 `assertValidMode()` 路径遍历防护
  - `validateMode()`：返回 boolean
  - `assertValidMode()`：抛出异常，阻止路径遍历
  - 65 个测试用例，覆盖非字符串类型（null/undefined/number/array）

- **Axiom 进化记录**：首次完整走通 ax-draft → ax-review → ax-decompose → ax-implement → ax-reflect → ax-evolve 全链路，知识库新增 k-029/030/031，模式库新增 P-002/003

### 修复

- **CLAUDE.md 规范引用**：在项目 CLAUDE.md 中添加 Axiom 门禁规则和工作流路由表引用

---

# ultrapower v5.0.14

### 修复

- **缓存嵌套根因修复**：将 `package.json` 的 `files` 字段从 `.claude-plugin`（整个目录）改为 `.claude-plugin/plugin.json`（仅 plugin.json），防止 `marketplace.json` 被发布到 npm 包中。Claude Code 读到 npm 包里的 `marketplace.json`（含 `source: npm`）后会触发循环安装，造成路径无限嵌套（`5.0.13/ultrapower/5.0.13/ultrapower/...`）。v5.0.13 修复了 plugin.json 缺失问题，但未排除 marketplace.json，本版本彻底修复。

---

# ultrapower v5.0.13

### 修复

- **plugin 发布修复**：将 `.claude-plugin` 目录加入 `package.json` 的 `files` 字段，确保 npm 发布时包含 `plugin.json`，修复插件安装后 `ultrapower:` 前缀 skills 无法调用的问题
- **缓存嵌套修复**：因 `plugin.json` 缺失导致 Claude Code 反复重新安装造成的路径无限嵌套问题（`5.0.12/ultrapower/5.0.12/ultrapower/...`）一并修复

---

# ultrapower v5.0.12

### 修复

- **版本同步修复**：确保 `.claude-plugin/marketplace.json` 和 `plugin.json` 与 npm 版本保持一致
- **gitignore 修复**：恢复 `dist/` 到 `.gitignore`，防止构建产物被意外提交

---

# ultrapower v5.0.11

### 修复

- **npm 发布修复**：移除 `.claude-plugin` 目录从 npm files 列表，防止无限缓存循环

---

# ultrapower v5.0.10

### 文档与工具

- **工具数量修正**：将所有文档中的工具数量从 15 更新为 35（8 类：LSP×12、AST×2、Python REPL×1、Notepad×6、State×5、Project Memory×4、Trace×2、Skills×3）
- **Agents 数量修正**：确认并统一 49 个 agents 的完整列表（含 14 个 Axiom agents）
- **Hooks 数量修正**：将文档中的 hooks 数量从 37 更正为 35
- **Skills 数量确认**：70 个 skills 完整列表已验证
- **AGENTS.md 全面更新**：根据真实代码实现更新所有文档，确保数量一致性

---

# ultrapower v5.0.9

### 代码质量

- **ESLint 0 warnings**：完成全量 lint 清理，实现零警告目标
  - 修复 `no-explicit-any`：生产代码中所有 `any` 类型替换为精确类型（`unknown`、具体接口、类型断言）
  - 修复 `no-unused-vars`：移除 88 个文件中的未使用 import 和变量，或加 `_` 前缀标记
  - 修复 `no-require-imports`：将 `require()` 调用转换为 ES `import` 语句
  - 修复 `no-useless-escape`：清理正则表达式和字符串中的冗余转义字符
  - 修复 `no-unused-expressions`：移除无副作用的独立表达式语句
  - 测试文件统一使用 `/* eslint-disable */` 豁免，避免过度修改测试逻辑
  - 构建产物（`dist/`、`bridge/*.cjs`）通过 `.eslintignore` 排除

### 修复

- **HUD 标签英文化**：将 HUD 元素标签从中文恢复为英文，确保测试断言通过
  - `render.ts`：截断提示 `行` → `lines`，更新通知 `有更新` → `omc update`
  - `types.ts`：`DEFAULT_HUD_CONFIG` 默认值修正——`maxOutputLines: 6` → `4`，`gitBranch: true` → `false`，`model: true` → `false`
  - `agents.ts`：`renderAgentsByFormat` multiline 分支改为调用 `renderAgents()` 解决测试冲突
  - `context-warning.ts`：警告文本改为英文（`auto-compact queued`、`run /compact`）
  - `git.ts`：`仓库:` → `repo:`，`分支:` → `branch:`
  - `thinking.ts`：`思考中` → `thinking`
  - `skills.ts`：`技能:` → `skill:`

- **HUD autoCompact 无限循环**：修复 context-warning 在上下文降至阈值以下后仍持续触发 compact 的 bug，现在在上下文恢复正常后清除触发标记文件

- **skills/hud/SKILL.md**：修复 MINGW64 兼容性——`if(!found)` → `if(found===false)`，避免 Git Bash 将 `!` 转义为 `\!` 导致语法错误

### 新增

- **5 个新专业 Agent**：
  - `database-expert`：数据库 schema 设计、查询优化、索引策略和迁移方案
  - `devops-engineer`：CI/CD 流水线、Docker/Kubernetes 容器化、基础设施即代码
  - `i18n-specialist`：国际化架构、本地化工作流、多语言文本管理
  - `accessibility-auditor`：WCAG 2.1/2.2 合规审查、键盘导航、屏幕阅读器兼容
  - `api-designer`：REST/GraphQL API 设计、OpenAPI 规范、版本策略

- **MCP 集成扩展**（`skills/mcp-setup`）：
  - Slack：Bot Token 配置，支持频道消息发送
  - Jira/Linear：项目管理和 issue 追踪集成
  - PostgreSQL：直接数据库查询支持
  - Playwright：浏览器自动化和 Web 测试
  - Sequential Thinking：结构化逐步推理，复杂问题分解
  - Software Planning Tool：任务规划与分解，依赖图和执行追踪

- **Codex Prompts**：为 5 个新 agent 添加 `agents.codex/` 适配提示词

- **HUD Axiom 状态元素**（`src/hud/elements/axiom.ts`）：新增 HUD 元素，实时读取并渲染 `.omc/axiom/` 目录中的 Axiom 系统状态
  - 显示：当前状态（IDLE/EXECUTING/BLOCKED/PLANNING 等）、当前目标、任务进度（进行中/待办）、学习队列条数及优先级、知识库条数、工作流成功率
  - 解析 `active_context.md`、`evolution/learning_queue.md`、`evolution/knowledge_base.md`、`evolution/workflow_metrics.md`
  - 未初始化 Axiom 时自动隐藏（返回 null）

- **HUD 智能建议元素**（`src/hud/elements/suggestions.ts`）：基于当前系统状态生成上下文感知的下一步操作建议
  - 上下文建议：≥90% 高优先级 `/compact`，≥阈值 中优先级 `/compact`
  - Axiom 建议：BLOCKED → `/ax-analyze-error`，IDLE+学习队列 → `/ax-evolve`，EXECUTING+无 Agent → `/ax-status`，IDLE+待办任务 → `/ax-implement`，任务完成 → `/ax-reflect`
  - 会话健康建议：会话超 120 分钟或费用超 $4 → `/ax-suspend`
  - 按优先级排序，最多显示 2 条

- **omc-setup 权限配置步骤**（步骤 3.75）：在 omc-setup 流程中新增权限配置步骤
  - 自动将常用工具权限写入 `~/.claude/settings.json` 的 `permissions.allow` 数组
  - 包含：Bash、Read、Write、Edit、Glob、Grep、Task、WebFetch、WebSearch 等核心工具
  - 避免每次工具调用时弹出权限确认对话框

### 文档

- 更新 `AGENTS.md`：agents 44 → 49，Domain Specialists 11 → 16
- 更新 `docs/CLAUDE.md`：agent_catalog 新增 5 个专家，mcp_routing 新增本地 MCP 工具说明
- 更新 `src/mcp/servers.ts`：新增 `createSequentialThinkingServer()` 和 `createSoftwarePlanningToolServer()` 工厂函数

---

# ultrapower v5.0.4

### 文档

- 修正 docs/TIERED_AGENTS_V2.md：补充缺失的 Axiom Lane（8 个）和 Axiom Specialists（6 个）章节，agent 总计 44 个
- 验证并同步所有文档计数：44 agents / 70 skills / 37 hooks / 15 tools
- 更新 AGENTS.md、README.md、docs/REFERENCE.md 确保数字一致

### 构建

- 重新构建所有 bridge 服务（mcp-server.cjs、codex-server.cjs、gemini-server.cjs、team-bridge.cjs）
- 更新 .claude-plugin/marketplace.json 版本引用至 v5.0.4

---

# ultrapower v5.0.3

### 新增

- **Axiom 深度融合**：将 Axiom 智能体编排框架完整集成到 ultrapower，提供需求→开发→进化全流程工作流
  - **14 个 Axiom agents**：axiom-requirement-analyst、axiom-product-designer、axiom-review-aggregator、axiom-prd-crafter、axiom-system-architect、axiom-evolution-engine、axiom-context-manager、axiom-worker，以及 6 个专家评审角色（axiom-ux-director、axiom-product-director、axiom-domain-expert、axiom-tech-lead、axiom-critic、axiom-sub-prd-writer）
  - **14 个 Axiom skills**：ax-draft、ax-review、ax-decompose、ax-implement、ax-analyze-error、ax-reflect、ax-evolve、ax-status、ax-rollback、ax-suspend、ax-context、ax-evolution、ax-knowledge、ax-export
  - **14 个斜杠命令**：对应所有 ax-* skills 的 `/ultrapower:ax-*` 命令
  - **14 个 Codex prompts**：为所有 Axiom agents 提供 OpenAI Codex 适配提示词
- **Axiom 记忆系统**：`.omc/axiom/` 目录，含 active_context、project_decisions、user_preferences、state_machine、reflection_log 及 evolution/ 子目录（knowledge_base、pattern_library、learning_queue、workflow_metrics）
- **Axiom 进化引擎**：知识收割、模式检测、置信度系统、学习队列（P0-P3 优先级）
- **Axiom Context Manager**：7 种记忆操作（读/写/状态/检查点）的 TypeScript 实现
- **Axiom Guards**：双层门禁系统（Git hooks shell 脚本 + Claude Code hooks TypeScript），含 Expert Gate、User Gate、CI Gate
- **Axiom Boot Hook**：会话启动时自动注入记忆上下文
- **Scope Gate 规则**：防止超出任务范围的代码修改
- **多平台适配器**：`.kiro/steering/axiom.md`（Kiro）、`.cursorrules`（Cursor）、`.gemini/GEMINI.md`（Gemini）、`.gemini/GEMINI-CLI.md`（Gemini CLI）、`.opencode/OPENCODE.md`（OpenCode CLI）、`.github/copilot-instructions.md`（GitHub Copilot）、`.codex/AGENTS.md`（Codex CLI）
- **axiom-config.ts**：AxiomConfig 接口与默认配置

### 修复

- **ax-review**：使用专用专家角色 agents（axiom-ux-director 等）替代通用 critic agent，确保评审专业性

### 文档

- 更新 AGENTS.md：agents 38→44，skills 67→69，hooks 35→38，新增 Axiom Lane（14 个）和 Axiom Skill 系统表
- 更新 README.md：修正 Axiom Agents 和 Axiom Skills 小节，计数同步至 44/69
- 更新 docs/REFERENCE.md：补充 6 个 Axiom 专家 agents，补充 ax-knowledge/ax-export 条目

---

# ultrapower v5.0.2

### 修复

- **hooks.json**：修复 `StopContinuation` 为 `Stop`，解决插件安装验证失败导致所有 skills 无法加载的问题

---

# ultrapower v5.0.1

### 新增

- **next-step-router skill**：在关键节点分析产出，用 AskUserQuestion 推荐最优下一步 agent/skill，并完整传递上下文（通过 notepad 持久化）
- **superpowers × ultrapower 深度集成**：为 18 个 superpowers skills 添加路由触发点，覆盖完整开发生命周期（阶段 0-8）
- **新功能路由规则**：using-superpowers skill 新增自动检测新功能/bug修复/重构的路由逻辑
- **brainstorming HARD-GATE**：强制前置 explore 探索门控，确保设计前充分理解代码库

### 文档

- 更新 README.md、docs/CLAUDE.md、docs/OMC-CLAUDE.md、docs/REFERENCE.md 添加 next-step-router 条目
- 新增 docs/ARCHITECTURE.md "Superpowers × ultrapower 集成" 章节

---

# ultrapower v5.0.0

### 新增

- **ultrapower 集成**：集成了 superpowers skill 系统，内置 54 个 skills、31 个专业智能体和 34 个 hooks。项目从 ultrapower 品牌重命名，npm 包名为 `ultrapower`。新增功能包括：superpowers skill 系统（brainstorming、systematic-debugging、test-driven-development、writing-plans、executing-plans、dispatching-parallel-agents、verification-before-completion、requesting-code-review、receiving-code-review、finishing-a-development-branch、using-git-worktrees、using-superpowers、subagent-driven-development、writer-memory、writing-skills）、project-session-manager (psm) skill（支持 GitHub/GitLab/Bitbucket/Jira/Gitea/Azure DevOps）、Team 模式作为默认多 Agent 编排器（分阶段 pipeline：team-plan->team-prd->team-exec->team-verify->team-fix）、MCP 后台任务管理（SQLite 持久化）、LSP 工具集成（12 个工具）、AST 工具（ast_grep_search/replace）、Python REPL 工具、速率限制等待守护进程、自动更新系统、分析/成本追踪系统。
- **test-engineer agent**：从 `tdd-guide` 重命名，更加清晰。
- **document-specialist agent**：从 `researcher` 重命名，更加清晰。

---

# ultrapower v4.2.15

### 新增

- **CCG skill**（#744）：新增 `claude-developer-platform` skill（`ccg`），用于构建调用 Claude API 或 Anthropic SDK 的程序。

### 移除

- **Ecomode 执行模式**（#737）：从 `KeywordType`、`ExecutionMode`、`MODE_CONFIGS` 及所有 hook 脚本中移除了 `ecomode`。`persistent-mode` stop hook 不再包含优先级 8 的 ecomode 延续块。关键词检测器不再将 `eco`、`ecomode`、`eco-mode`、`efficient`、`save-tokens` 或 `budget` 识别为执行模式触发词。

### 修复

- **Windows HUD 不显示**（#742）：通过修正 `NODE_PATH` 分隔符处理，修复了 Windows 上的 HUD 渲染问题。
- **WSL2 滚动修复**：修复了 WSL2 环境中的滚动行为。
- **tmux 会话名称解析**（#736、#740、#741）：使用 `TMUX_PANE` 环境变量正确解析通知中的 tmux 会话名称。

### 文档

- **oh-my-codex 交叉引用**（#744）：为 Codex 用户添加了交叉引用文档。

---

# ultrapower v4.2.4：会话空闲通知

当 Claude 在没有任何活跃持久模式的情况下停止时，会话空闲通知现在会触发，填补了外部集成（Telegram、Discord）从未收到会话进入空闲状态通知的空白。

**3 个 PR（#588-#592）共修改 4 个文件**

---

### 修复

- **普通停止时会话空闲通知从未触发**（#593）：`persistent-mode.cjs` Stop hook 仅在持久模式（ralph、ultrawork 等）活跃时发送通知。当 Claude 在没有运行任何模式的情况下正常停止时，不会发出 `session-idle` 事件。外部集成（Telegram、Discord）现在可以收到空闲通知，让用户知道会话正在等待输入。

### 变更

- **Skills 清理**：移除了已弃用的 `commands/` 存根，并添加了缺失的 `SKILL.md` 文件（#588）。
- **HUD 安装可选**：安装程序现在遵循 `hudEnabled` 配置，禁用时跳过 HUD 设置（#567）。
- **Team 状态 hooks**：在 tmux 会话就绪转换时发出状态 hooks（#572）。
- **Explore agent 上下文**：为 explore agent 添加了上下文感知文件读取（#583）。

---

# ultrapower v4.2.3：稳定性与跨平台修复

修复了 worktree 状态管理、Codex 速率限制、会话指标、关键词检测和跨平台兼容性方面的 bug，提升了可靠性。

**10 个 PR（#564-#581）共修改 94 个文件，新增 2462 行，删除 886 行**

---

### 修复

- **Worktree 状态写入子目录**（#576）：`.omc/state/` 被创建在智能体 CWD 子目录中，而非 git worktree 根目录。新增 `resolveToWorktreeRoot()` 确保所有状态路径解析到仓库根目录，已在所有 8 个 hook 处理程序中统一应用。
- **会话时长报告过长**（#573）：`getSessionStartTime()` 现在按 `session_id` 过滤状态文件，跳过前一会话遗留的过期文件。时间戳解析为 epoch 以进行安全比较。
- **Codex 429 速率限制崩溃**（#570）：为速率限制错误添加了带抖动的指数退避。可通过 `OMC_CODEX_RATE_LIMIT_RETRY_COUNT`（默认 3）、`OMC_CODEX_RATE_LIMIT_INITIAL_DELAY`（5 秒）、`OMC_CODEX_RATE_LIMIT_MAX_DELAY`（60 秒）进行配置。适用于前台和后台 Codex 执行。
- **守护进程因 ESM require() 崩溃**（#564）：在守护进程启动脚本中将 `require()` 替换为动态 `import()`。将 `appendFileSync`/`renameSync` 移至顶层 ESM 导入。
- **LSP 在 Windows 上启动失败**（#569）：在 `process.platform === 'win32'` 时添加 `shell: true`，使 npm 安装的 `.cmd` 二进制文件能正确执行。
- **Post-tool verifier 误报**（#579）：扩大了失败检测模式，防止 PostToolUse hooks 中出现漏报。
- **Team bridge 就绪检测**（#572）：Worker 现在在首次成功轮询周期后发出 `ready` outbox 消息，实现可靠的启动检测。启动时写入初始心跳，并进行受保护的 I/O。

### 变更

- **关键词检测器双重发射**：`ultrapilot` 和 `swarm` 关键词现在同时发射其原始类型和 `team`，允许 skill 层区分直接 team 调用和旧版别名。
- **关键词净化器改进**：文件路径剥离更加精确（需要前导 `/`、`./` 或多段路径）。XML 标签匹配现在需要匹配标签名称，防止过度剥离。
- **Skills 数量**：从 32 增加到 34（新增 `configure-discord`、`configure-telegram`）。
- **README 清理**：移除了越南语和葡萄牙语翻译。

---

# ultrapower v4.2.0：通知标记与配置用户体验

本版本为生命周期 stop-callback 通知添加了可配置的提及/标记支持，并扩展了 Telegram 和 Discord 的 CLI 配置工作流。

### 新增

- stop-callback 配置中的 `tagList` 支持（适用于 Telegram 和 Discord）。
- 通知标记规范化：
  - Telegram：将用户名规范化为 `@username`
  - Discord：支持 `@here`、`@everyone`、数字用户 ID（`<@id>`）和角色标记（`role:<id>` -> `<@&id>`）
- 扩展 `omc config-stop-callback` 选项：
  - `--tag-list <csv>`
  - `--add-tag <tag>`
  - `--remove-tag <tag>`
  - `--clear-tags`
- 新增标记列表配置变更的 CLI 测试覆盖。

### 更新

- 会话结束回调通知现在为 Telegram/Discord 的摘要添加已配置标记前缀。
- 所有 README 语言版本和 `docs/REFERENCE.md` 中的文档已更新，包含通知标记配置示例。

---

# ultrapower v4.1.11：大修复版本

本版本通过一次协调努力解决了 12 个未解决的问题，修复了 HUD 渲染 bug，改善了 Windows 兼容性，并恢复了 MCP 智能体角色发现功能。

**12 个 PR（#534-#545）共修改 63 个文件，新增 659 行，删除 188 行**

---

### 关键修复

- **CJS 包中 MCP 智能体角色失效**（#545）：esbuild 在打包为 CJS 格式时将 `import.meta` 替换为 `{}`，导致 `VALID_AGENT_ROLES` 为空。所有传递给 `ask_codex` 和 `ask_gemini` 的 `agent_role` 值都被拒绝，提示"Unknown agent_role"。修复了所有 4 个 `getPackageDir()` 函数，在 `import.meta.url` 不可用时回退到 `__dirname`（CJS 原生）。

### 新增

- **CLI setup 命令**（#498）：新增 `omc setup` 命令，提供同步 OMC hooks、agents 和 skills 的官方 CLI 入口点。支持 `--force`、`--quiet` 和 `--skip-hooks` 标志。
- **可配置预算阈值**（#531）：HUD 预算警告和严重阈值现在可通过 `HudThresholds` 配置，而非硬编码为 $2/$5。默认值保持现有行为。
- **模型版本详细程度**（#500）：`formatModelName()` 现在支持 `'short'`、`'versioned'` 和 `'full'` 格式级别。从 HUD 显示中移除了冗余的 `model:` 前缀。
- **未解决问题标准化**（#514）：planner 和 analyst 智能体现在将未解决的问题指向 `.omc/plans/open-questions.md`，并使用共享的 `formatOpenQuestions()` 工具函数。

### 修复

- **上下文栏缺少后缀**（#532）：栏模式现在在阈值边界显示 `COMPRESS?` 和 `CRITICAL` 文本提示，与非栏模式行为一致。
- **Opus 速率限制未解析**（#529）：HUD 现在从使用 API 响应中读取 `seven_day_opus`，支持 Opus 的每模型每周速率限制显示。
- **长会话中会话时长重置**（#528）：会话开始时间现在持久化在 HUD 状态中（按会话 ID 范围），防止尾块解析重置显示的时长。
- **启动 hook 中版本错误**（#516）：会话启动 hook 现在读取 OMC 自身的 `package.json` 版本，而非用户项目的版本，防止错误的更新通知和版本漂移。
- **智能体类型代码冲突**（#530）：使用 2 字符代码消除了 HUD 智能体代码歧义：`Qr`/`Qs`（quality-reviewer/strategist）、`Pm`（product-manager）、`Ia`（information-architect）。
- **Ralph 循环忽略 Team 取消**（#533）：当 Team pipeline 达到 `cancelled` 阶段时（除 `complete`/`failed` 外），ralph 现在能干净退出。移除了过早消耗最大迭代预算的双重迭代递增。
- **Hooks 在 Windows 上失败**（#524）：所有 14 个 hook 脚本和 5 个模板现在使用 `pathToFileURL()` 进行动态导入，而非原始文件路径，修复了 Windows 上的 ESM 导入失败。为空 hook 响应添加了 `suppressOutput: true`，以缓解 Claude Code "hook error" 显示 bug。

---

# ultrapower v4.1.2：Team 模型继承

## 变更

### 变更
- **Team skill**：移除了 team 成员的硬编码 `model: "sonnet"` 默认值。队友现在继承用户的会话模型，而非强制使用 Sonnet。由于每个队友都是能够生成自己子智能体的完整 Claude Code 会话，会话模型充当编排层。
- **Team 配置**：从 `.omc-config.json` team 配置选项中移除了 `defaultModel`。

---

# ultrapower v4.1.1：会话隔离与灵活 MCP 路由

本补丁版本加强了并行工作流的会话隔离，解除了灵活 MCP 智能体路由的阻塞，并通过智能体团队配置增强了设置向导。

---

### 新增

- **智能体团队设置**：`omc-setup` 向导现在包含步骤 5.5，用于配置 Claude Code 的实验性智能体团队（`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`），包括 `teammateMode` 选择和团队默认值。（#484）

### 变更

- **灵活 MCP 路由**：移除了 `ask_codex` 和 `ask_gemini` MCP 工具对 `agent_role` 的每提供商枚举限制。两者现在接受任何有效的智能体角色（约 30 种类型）；提供商特定的优势作为建议记录，而非强制限制。（#485）

### 修复

- **会话状态隔离**：消除了多个 Claude Code 会话在同一目录运行时的跨会话状态污染。当 `session_id` 已知时，旧版共享状态不可见——不回退到共享路径。为所有 8 种模式添加了 `isSessionMatch()` 辅助函数，实现一致的会话匹配。（#486）
- **状态写入警告**：在 MCP `state_write` 中添加了 `session_id` 缺失时的警告，防止意外的共享状态写入。（#486）

---

# ultrapower v4.1.0：整合与协调更新

本主要版本对智能体架构进行了根本性改造，简化了 skills 和命令，并推出了强大的新 Team 协调系统，用于分布式、弹性的多智能体工作流。

---

### 💥 破坏性变更与迁移

之前的分层智能体系统（`-low`、`-medium`、`-high` 后缀）已被弃用并移除。此举旨在简化用户体验，并与现代模型能力保持一致。

**迁移指南：**
- **需要操作：** 用户必须更新其脚本、配置和自定义命令。
- **如何更新：** 不再通过层级选择智能体（如 `planner-high`），而是使用单一统一智能体（如 `planner`），并通过 Claude Code 设置或模型参数指定所需的模型大小/能力。
- **示例：** `Task(subagent_type="ultrapower:architect-high", ...)` 应改为 `Task(subagent_type="ultrapower:architect", model="opus", ...)`。

---

### 🚀 主要功能：智能体架构改革

智能体生态系统已完全重构。我们将之前的 34 个分层智能体整合为 **28 个统一专业智能体**。新结构强调基于角色的专业化，而非令人困惑的层级系统，模型能力现在通过参数路由处理。此变更简化了智能体选择，提高了每个智能体用途的清晰度。（#480、#481）

- **统一智能体名单**：弃用 `-low`、`-medium` 和 `-high` 智能体变体，改用单一统一名单。
- **新专业智能体**：引入了一套新智能体，覆盖更多专业任务：
  - `debugger`：用于根因分析和 bug 修复。
  - `verifier`：用于验证逻辑和结果。
  - `style-reviewer`：用于执行编码风格和规范。
  - `quality-reviewer`：用于评估整体代码质量。
  - `api-reviewer`：用于分析 API 设计和使用。
  - `performance-reviewer`：用于识别性能瓶颈。
  - `dependency-expert`：用于管理和分析项目依赖。
  - `test-engineer`：用于创建和维护测试。
  - `quality-strategist`：用于高层次质量保证规划。
  - `product-manager`：用于将工作与产品目标对齐。
  - `ux-researcher`：用于用户体验分析。
  - `information-architect`：用于组织和构建信息。
  - `product-analyst`：用于分析产品需求和行为。
- **系统集成**：为所有 28 个智能体完成了 HUD 代码、系统提示和简称，确保完全集成到 OMC 生态系统中。（f5746a8）

---

### 🤝 功能：高级 Team 协调

引入 **MCP Team Workers Bridge Daemon**，多智能体协作的重大飞跃。该系统支持健壮、弹性且可观测的分布式工作流。

- **Team Bridge Daemon**：新的后台服务（`mcp-team-workers`）在多个智能体"worker"之间编排任务。（e16e2ad）
- **增强弹性**：实现了混合编排、使用 `git worktrees` 进行隔离任务执行，以及改进的可观测性，使 team 操作更加健壮。（0318f01）
- **原子任务认领**：将之前的 `sleep+jitter` 机制替换为原子 `O_EXCL` 锁文件。这防止了竞争条件，确保任务一次只被一个 worker 认领。（c46c345、7d34646）
- **安全加固**：针对一系列漏洞加固了 team bridge，包括文件描述符（FD）泄漏、路径遍历攻击，以及改进的关闭程序。（#462、#465）
- **权限执行**：为 MCP workers 添加了执行后权限执行层，确保智能体在其指定的安全边界内运行。（fce3375、6a7ec27）

---

### ✍️ 功能：针对 Claude Opus 4.6 的系统提示重写

根据 Anthropic 最新的提示最佳实践，核心系统提示（`docs/CLAUDE.md`）已完全重写，显著提升了性能、可靠性和工具使用准确性。

- **最佳实践**：新提示利用 XML 行为标签（`<operating_principles>`、`<delegation_rules>`、`<agent_catalog>` 等），使用平静直接的语言，并为所有可用工具和 skills 提供全面的结构化参考。（42aad26）
- **生产就绪**：根据生产就绪审查的反馈进行了改进，确保提示健壮有效。（d7317cb）

---

### 🔧 Skill 与命令整合

为降低复杂性并改善用户体验，多个 skills 和命令已合并和正式化。（#471）

- **合并的 Skills**：
  - `local-skills-setup` 已合并到核心 `skill` 命令中。
  - `learn-about-omc` 现在是 `help` 命令的一部分。
  - `ralplan` 和 `review` 已整合到 `plan` 命令中。（dae0cf9、dd63c4a）
- **命令别名**：添加了 `ralplan` 和 `review` 作为 `plan` 的别名，以保持用户肌肉记忆的向后兼容性。（217a029）
- **正式化结构**：明确了"commands"（面向用户的入口点）和"skills"（内部智能体能力）之间的区别。`analyze`、`git-master` 和 `frontend-ui-ux` 现在是其各自底层 skills 的薄路由层。（#470）
- **清理**：移除了死亡 skills、孤立引用，并更新了文档以反映新的精简结构。（#478）

---

### ✅ 可靠性与 Bug 修复

本版本包含大量修复，以提高稳定性、防止错误并增强系统整体可靠性。

- **状态管理**：
  - 对会话状态文件进行命名空间化，防止不同会话之间的上下文"渗漏"。（#456）
  - 消除了模式检测 hooks 中的跨会话状态泄漏，实现更好的隔离。（297fe42、92432cf）
- **并发与竞争条件**：
  - 为压缩过程添加了防抖机制，防止并发执行时出现错误。（#453）
- **工具与 Hook 稳定性**：
  - 在所有 hook 脚本中实现了超时保护的 `stdin`，防止挂起。（#459）
- **API/模型交互**：
  - 添加了处理 Codex 和 Gemini 的 `429 Too Many Requests` 速率限制错误的回退机制，提高了高负载下的弹性。（#469）
- **工作流门控**：
  - 在 `ralplan` 中将 `AskUserQuestion` 工具替换为原生 Plan Mode 审批门控，实现更流畅可靠的人机协作工作流。（#448、#463）
- **测试**：
  - 解决了合并冲突，并在测试中对齐了 skill/agent 清单以匹配整合变更。（e4d64a3、539fb1a）
  - 通过使用 `utimesSync` 正确模拟文件年龄，修复了过期锁文件清理的测试。（24455c3）
