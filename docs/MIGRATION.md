# 迁移指南

本指南涵盖 ultrapower 的所有迁移路径。请在下方找到您当前的版本。

---

## 目录

- [v5.0.2 → v5.0.3: Axiom 专家 Agent 扩展](#v502--v503-axiom-专家-agent-扩展)
- [v5.0 → v5.0.2: Axiom 框架深度融合](#v50--v502-axiom-框架深度融合)
- [v4.x → v5.0: ultrapower 集成与功能扩展](#v4x--v50-ultrapower-集成与功能扩展)
- [v3.5.3 → v3.5.5: Test Fixes & Cleanup](#v353--v355-test-fixes--cleanup)
- [v3.5.2 → v3.5.3: Skill Consolidation](#v352--v353-skill-consolidation)
- [v2.x → v3.0: Package Rename & Auto-Activation](#v2x--v30-package-rename--auto-activation)
- [v3.0 → v3.1: Notepad Wisdom & Enhanced Features](#v30--v31-notepad-wisdom--enhanced-features)
- [v3.x → v4.0: Major Architecture Overhaul](#v3x--v40-major-architecture-overhaul)

---

## v5.0.2 → v5.0.3: Axiom 专家 Agent 扩展

### TL;DR

v5.0.3 在 v5.0.2 的 Axiom 基础上新增 6 个专家评审 Agent、2 个 Skills（ax-knowledge、ax-export），将总 Agent 数从 38 扩展至 44，Skills 从 67 扩展至 69，Hooks 从 35 扩展至 38。

### 新增功能

**44 个专业 Agent**（新增 6 个 Axiom 专家 agents）：
- `axiom-ux-director`：UX/体验专家评审，输出 review_ux.md
- `axiom-product-director`：产品战略专家评审，输出 review_product.md
- `axiom-domain-expert`：领域知识专家评审，输出 review_domain.md
- `axiom-tech-lead`：技术可行性评审，输出 review_tech.md
- `axiom-critic`：安全/质量/逻辑评审，输出 review_critic.md
- `axiom-sub-prd-writer`：将 Manifest 任务拆解为可执行 Sub-PRD

**69 个 Skills**（新增 2 个）：
- `ax-knowledge`：查询 Axiom 知识库
- `ax-export`：导出 Axiom 工作流产物

**38 个 Hooks**（新增 3 个）：
- `axiom-scope-gate`：防止超出 PRD 范围的变更
- `axiom-ci-gate`：CI 门禁，确保代码变更通过编译和测试
- `axiom-context-sync`：跨会话同步 Axiom 上下文

### 破坏性变更

无破坏性变更。所有 v5.0.2 命令和 Agent 名称继续有效。

### 迁移步骤

1. **无需操作** - 所有 v5.0.2 命令继续有效
2. **重新运行 `/ultrapower:omc-setup`** 以获取包含 44 个 Agent 和 69 个 Skills 的最新配置
3. **可选**：使用 `/ultrapower:ax-knowledge` 查询知识库，`/ultrapower:ax-export` 导出工作流产物

### 验证

```bash
# 在 Claude Code 中验证
/ultrapower:omc-help
/ultrapower:ax-status
```

---

## v5.0 → v5.0.2: Axiom 框架深度融合

### TL;DR

v5.0.2 将 Axiom 框架深度融合进 ultrapower，将 Agent 数量从 31 扩展至 39，Skills 从 55 扩展至 67，新增 Axiom 工作流系统、记忆系统和 TypeScript hooks。

### 新增功能

**38 个专业 Agent**（新增 8 个 Axiom agents）：
- `axiom-requirement-analyst`：需求分析三态门（PASS/CLARIFY/REJECT）
- `axiom-product-designer`：Draft PRD 生成，含 Mermaid 流程图
- `axiom-review-aggregator`：5 专家并行审查聚合与冲突仲裁
- `axiom-prd-crafter`：工程级 PRD，含门控验证
- `axiom-system-architect`：原子任务 DAG 与 Manifest 生成
- `axiom-evolution-engine`：知识收割、模式检测、工作流优化
- `axiom-context-manager`：7 操作记忆系统（读/写/状态/检查点）
- `axiom-worker`：PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED）

**67 个 Skills**（新增 12 个 Axiom skills）：
- `ax-analyze-error`、`ax-context`、`ax-decompose`、`ax-draft`
- `ax-evolution`、`ax-evolve`、`ax-implement`、`ax-reflect`
- `ax-review`、`ax-rollback`、`ax-status`、`ax-suspend`

**新增 TypeScript Hooks：**
- `axiom-boot`：会话启动时自动加载 Axiom 上下文
- `axiom-guards`：工作流守卫，防止无效状态转换

**记忆系统（`.omc/axiom/`）：**
- `memory.json`：持久化知识库
- `patterns.json`：检测到的工作流模式
- `evolution-log.json`：演化历史

**AI 工具适配器：**
- `.codex/`、`.gemini/`、`.kiro/`、`.opencode/`、`.cursorrules`、`.github/`

### 破坏性变更

无破坏性变更。所有 v5.0 命令和 Agent 名称继续有效。

### 迁移步骤

1. **无需操作** - 所有 v5.0 命令继续有效
2. **重新运行 `/ultrapower:omc-setup`** 以获取包含 38 个 Agent 和 67 个 Skills 的最新配置
3. **可选**：使用 `/ultrapower:ax-status` 查看 Axiom 工作流状态

### 验证

```bash
# 在 Claude Code 中验证
/ultrapower:omc-help
/ultrapower:ax-status
```

---

## v4.x → v5.0: ultrapower 集成与功能扩展

### TL;DR

v5.0 集成了 superpowers skill 系统，将 Agent 数量从 28 扩展至 31，Skills 从 34 扩展至 55，并引入 Team 模式作为默认多 Agent 编排器。

### 破坏性变更

**Agent 重命名（向后兼容别名保留）：**

| 旧名称 | 新名称 | 别名保留 |
|--------|--------|----------|
| `tdd-guide` | `test-engineer` | 是 |
| `researcher` | `document-specialist` | 是 |

**模式路由变更：**

| 旧行为 | 新行为 |
|--------|--------|
| `swarm` 直接执行 | `swarm` 路由到 Team（兼容外观） |
| `ultrapilot` 直接执行 | `ultrapilot` 路由到 Team（兼容外观） |

### 新增功能

**31 个专业 Agent**（新增 3 个）：
- `build-fixer`：构建/工具链/类型错误修复
- `qa-tester`：交互式 CLI/服务运行时验证
- `scientist`：数据/统计分析

**55 个 Skills**（新增 21 个），包括 superpowers skill 系统：
- `brainstorming`、`systematic-debugging`、`test-driven-development`
- `writing-plans`、`executing-plans`、`dispatching-parallel-agents`
- `verification-before-completion`、`requesting-code-review`、`receiving-code-review`
- `finishing-a-development-branch`、`using-git-worktrees`、`using-superpowers`
- `subagent-driven-development`、`writer-memory`、`writing-skills`
- `project-session-manager` (psm)：支持 GitHub/GitLab/Bitbucket/Jira/Gitea/Azure DevOps

**Team 模式（默认多 Agent 编排器）：**

分阶段 pipeline：`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`

```bash
/ultrapower:team "implement OAuth with multiple providers"
```

**新工具集成：**
- LSP 工具（12 个）：`lsp_hover`、`lsp_goto_definition`、`lsp_find_references` 等
- AST 工具：`ast_grep_search`、`ast_grep_replace`
- Python REPL：`python_repl`
- 速率限制等待守护进程
- 自动更新系统
- 分析/成本追踪系统
- MCP 后台任务管理（SQLite 持久化）

### 迁移步骤

1. **无需操作** - 所有 v4.x 命令和 Agent 名称继续有效
2. **更新脚本中的 Agent 引用**（可选，推荐）：
   - `tdd-guide` → `test-engineer`
   - `researcher` → `document-specialist`
3. **重新运行 `/omc-setup`** 以获取新的 CLAUDE.md 配置（包含 31 个 Agent 和 55 个 Skills）

### 验证

```bash
# 验证安装
npm list -g ultrapower

# 在 Claude Code 中验证
/ultrapower:omc-help
```

---

## v3.5.3 → v3.5.5: Test Fixes & Cleanup

### TL;DR

修复测试套件问题并延续 v3.5.3 skill 整合工作的维护版本。

### 变更内容

**测试修复：**
- Delegation-enforcer 测试标记为跳过（实现待定）
- 修正 agent 归因的分析预期
- 所有剩余测试现在均可干净通过

**Skill 整合：**
- 延续 v3.5.3 的清理工作
- 移除已废弃的 `cancel-*` skill（改用 `/cancel`）
- 最终 skill 数量：37 个核心 skill

### 迁移步骤

1. **无破坏性变更** - 所有功能保持不变
2. **测试套件**现在可通过 `npm run test:run` 干净运行
3. **已废弃的 skill** 已移除（已在 v3.5.3 中替换）

### 开发者须知

如果您依赖已废弃的 `cancel-*` skill，请更新为使用统一的 `/cancel` 命令，它会自动检测当前活跃模式。

---

## v3.5.2 → v3.5.3: Skill Consolidation

### TL;DR

8 个已废弃的 skill 已被移除。统一的 `/cancel` 和 `/omc-setup` 命令取代了它们。

### 已移除的 Skill

以下 skill 在 v3.5.3 中已**完全移除**：

| 已移除的 Skill | 替代方案 |
|---------------|-------------|
| `cancel-autopilot` | `/ultrapower:cancel` |
| `cancel-ralph` | `/ultrapower:cancel` |
| `cancel-ultrawork` | `/ultrapower:cancel` |
| `cancel-ultraqa` | `/ultrapower:cancel` |
| `omc-default` | `/ultrapower:omc-setup --local` |
| `omc-default-global` | `/ultrapower:omc-setup --global` |
| `planner` | `/ultrapower:plan` |

### 变更内容

**v3.5.3 之前：**
```bash
/ultrapower:cancel-ralph      # Cancel ralph specifically
/ultrapower:omc-default       # Configure local project
/ultrapower:planner "task"    # Start planning
```

**v3.5.3 之后：**
```bash
/ultrapower:cancel            # Auto-detects and cancels any active mode
/ultrapower:omc-setup --local # Configure local project
/ultrapower:plan "task"       # Start planning (includes interview mode)
```

### 新功能

**新 skill：`/learn-about-omc`**
- 分析您的 OMC 使用模式
- 提供个性化建议
- 识别未充分利用的功能

**plan skill 现在支持共识模式：**
```bash
/ultrapower:plan --consensus "task"  # Iterative planning with Critic review
/ultrapower:ralplan "task"           # Alias for plan --consensus
```

### 迁移步骤

1. **无需操作** - 统一的 `/cancel` 命令在 v3.5 中已可使用
2. **更新引用已移除命令的脚本**
3. **重新运行 `/omc-setup`**（如需更新 CLAUDE.md 配置）

### Skill 数量

- v3.5：42 个 skill
- v3.5.3：37 个 skill（移除 8 个，新增 3 个）

---

## v2.x → v3.0: Package Rename & Auto-Activation

### TL;DR

您的旧命令仍然有效！但现在您不再需要它们了。

**3.0 之前：** 需要显式调用 25+ 个命令，如 `/ultrapower:ralph "task"`、`/ultrapower:ultrawork "task"`

**3.0 之后：** 自然地工作 - Claude 自动激活正确的行为。一次性设置：只需说 "setup omc"

### 项目品牌重塑

项目进行了品牌重塑，以更好地反映其用途并提高可发现性。

- **项目/品牌名称**：`ultrapower`（GitHub 仓库、插件名称、命令）
- **npm 包名称**：`oh-my-claude-sisyphus`（不变）

> **为何有差异？** npm 包名 `oh-my-claude-sisyphus` 保留是为了与现有安装向后兼容。项目、GitHub 仓库、插件和所有命令均使用 `ultrapower`。

#### NPM 安装命令（不变）

```bash
npm install -g oh-my-claude-sisyphus
```

### 变更内容

#### 之前（2.x）：显式命令

您必须记住并为每种模式显式调用特定命令：

```bash
# 2.x 工作流：多个命令，需要记忆很多
/ultrapower:ralph "implement user authentication"       # 持久模式
/ultrapower:ultrawork "refactor the API layer"          # 最大并行度
/ultrapower:planner "plan the new dashboard"            # 规划访谈
/ultrapower:deepsearch "find database schema files"     # 深度搜索
/ultrapower:git-master "commit these changes"           # Git 专业操作
/ultrapower:deepinit ./src                              # 索引代码库
/ultrapower:analyze "why is this test failing?"         # 深度分析
```

#### 之后（3.0）：自动激活 + 关键词

自然地工作。Claude 检测意图并自动激活行为：

```bash
# 3.0 工作流：自然交流或使用可选关键词
"don't stop until user auth is done"                # Auto-activates ralph-loop
"fast: refactor the entire API layer"               # Auto-activates ultrawork
"plan: design the new dashboard"                    # Auto-activates planning
"ralph ulw: migrate the database"                   # Combined: persistence + parallelism
"find all database schema files"                    # Auto-activates search mode
"commit these changes properly"                     # Auto-activates git expertise
```

### Agent 名称映射

所有 agent 名称已从希腊神话引用更新为直观的描述性名称：

| 旧名称（希腊语） | 新名称（直观） |
|------------------|----------------------|
| prometheus | planner |
| momus | critic |
| oracle | architect |
| metis | analyst |
| mnemosyne | learner |
| sisyphus-junior | executor |
| orchestrator-sisyphus | coordinator |
| librarian | document-specialist |
| frontend-engineer | designer |
| document-writer | writer |
| multimodal-looker | vision |
| explore | explore（不变） |
| qa-tester | qa-tester（不变） |

### 目录迁移

目录结构已重命名以与新包名保持一致：

#### 本地项目目录
- **旧**：`.sisyphus/`
- **新**：`.omc/`

#### 全局目录
- **旧**：`~/.sisyphus/`
- **新**：`~/.omc/`

#### Skills 目录
- **旧**：`~/.claude/skills/sisyphus-learned/`
- **新**：`~/.claude/skills/omc-learned/`

#### 配置文件
- **旧**：`~/.claude/sisyphus/mnemosyne.json`
- **新**：`~/.claude/omc/learner.json`

### 环境变量

所有环境变量已从 `SISYPHUS_*` 重命名为 `OMC_*`：

| 旧 | 新 |
|-----|-----|
| SISYPHUS_USE_NODE_HOOKS | OMC_USE_NODE_HOOKS |
| SISYPHUS_USE_BASH_HOOKS | OMC_USE_BASH_HOOKS |
| SISYPHUS_PARALLEL_EXECUTION | OMC_PARALLEL_EXECUTION |
| SISYPHUS_LSP_TOOLS | OMC_LSP_TOOLS |
| SISYPHUS_MAX_BACKGROUND_TASKS | OMC_MAX_BACKGROUND_TASKS |
| SISYPHUS_ROUTING_ENABLED | OMC_ROUTING_ENABLED |
| SISYPHUS_ROUTING_DEFAULT_TIER | OMC_ROUTING_DEFAULT_TIER |
| SISYPHUS_ESCALATION_ENABLED | OMC_ESCALATION_ENABLED |
| SISYPHUS_DEBUG | OMC_DEBUG |

### 命令映射

所有 2.x 命令继续有效。以下是变更内容：

| 2.x 命令 | 3.0 等效方式 | 是否有效？ |
|-------------|----------------|--------|
| `/ultrapower:ralph "task"` | 说 "don't stop until done" 或使用 `ralph` 关键词 | ✅ 是（两种方式均可） |
| `/ultrapower:ultrawork "task"` | 说 "fast" 或 "parallel" 或使用 `ulw` 关键词 | ✅ 是（两种方式均可） |
| `/ultrapower:ultrawork-ralph` | 说 "ralph ulw:" 前缀 | ✅ 是（关键词组合） |
| `/ultrapower:planner "task"` | 说 "plan this" 或使用 `plan` 关键词 | ✅ 是（两种方式均可） |
| `/ultrapower:plan "description"` | 自然地开始规划 | ✅ 是 |
| `/ultrapower:review [path]` | 正常调用 | ✅ 是（不变） |
| `/ultrapower:deepsearch "query"` | 说 "find" 或 "search" | ✅ 是（自动检测） |
| `/ultrapower:analyze "target"` | 说 "analyze" 或 "investigate" | ✅ 是（自动检测） |
| `/ultrapower:deepinit [path]` | 正常调用 | ✅ 是（不变） |
| `/ultrapower:git-master` | 说 "git"、"commit"、"atomic commit" | ✅ 是（自动检测） |
| `/ultrapower:frontend-ui-ux` | 说 "UI"、"styling"、"component"、"design" | ✅ 是（自动检测） |
| `/ultrapower:note "content"` | 说 "remember this" 或 "save this" | ✅ 是（自动检测） |
| `/ultrapower:cancel-ralph` | 说 "stop"、"cancel" 或 "abort" | ✅ 是（自动检测） |
| `/ultrapower:omc-doctor` | 正常调用 | ✅ 是（不变） |
| 所有其他命令 | 与之前完全相同 | ✅ 是 |

### 魔法关键词

在消息中任意位置包含这些关键词可显式激活行为。当您需要显式控制时使用关键词（可选）：

| 关键词 | 效果 | 示例 |
|---------|--------|---------|
| `ralph` | 持久模式 - 完成前不会停止 | "ralph: refactor the auth system" |
| `ralplan` | 带共识的迭代规划 | "ralplan: add OAuth support" |
| `ulw` / `ultrawork` | 最大并行执行 | "ulw: fix all type errors" |
| `plan` | 规划访谈 | "plan: new API design" |

**ralph includes ultrawork:**
```
ralph: migrate the entire database
    ↓
Persistence (won't stop) + Ultrawork (maximum parallelism) built-in
```

**没有关键词？** Claude 仍会自动检测：
```
"don't stop until this works"      # Triggers ralph
"fast, I'm in a hurry"             # Triggers ultrawork
"help me design the dashboard"     # Triggers planning
```

### 自然取消

说以下任意一句即可停止：
- "stop"
- "cancel"
- "abort"
- "nevermind"
- "enough"
- "halt"

Claude 会智能判断要停止的内容：

```
If in ralph-loop     → Exit persistence loop
If in ultrawork      → Return to normal mode
If in planning       → End planning interview
If multiple active   → Stop the most recent
```

不再需要 `/ultrapower:cancel-ralph` - 直接说 "cancel" 即可！

### 迁移步骤

按照以下步骤迁移您的现有设置：

#### 1. 卸载旧包（如果通过 npm 安装）

```bash
npm uninstall -g oh-my-claude-sisyphus
```

#### 2. 通过插件系统安装（必须）

```bash
# In Claude Code:
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install ultrapower
```

> **注意**：不再支持 npm/bun 全局安装。请使用插件系统。

#### 3. 重命名本地项目目录

如果您有使用旧目录结构的现有项目：

```bash
# In each project directory
mv .sisyphus .omc
```

#### 4. 重命名全局目录

```bash
# Global configuration directory
mv ~/.sisyphus ~/.omc

# Skills directory
mv ~/.claude/skills/sisyphus-learned ~/.claude/skills/omc-learned

# Config directory
mv ~/.claude/sisyphus ~/.claude/omc
```

#### 5. 更新环境变量

更新您的 shell 配置文件（`.bashrc`、`.zshrc` 等）：

```bash
# Replace all SISYPHUS_* variables with OMC_*
# Example:
# OLD: export SISYPHUS_ROUTING_ENABLED=true
# NEW: export OMC_ROUTING_ENABLED=true
```

#### 6. 更新脚本和配置

搜索并更新所有引用：
- 包名：`oh-my-claude-sisyphus` → `ultrapower`
- Agent 名称：使用上方的映射表
- 命令：使用新的 slash 命令
- 目录路径：将 `.sisyphus` 更新为 `.omc`

#### 7. 运行一次性设置

在 Claude Code 中，只需说 "setup omc"、"omc setup" 或任何自然语言等效表达。

这将：
- 下载最新的 CLAUDE.md
- 配置 32 个 agent
- 启用自动行为检测
- 激活续行强制
- 设置 skill 组合

### 验证

迁移后，验证您的设置：

1. **检查安装**：
   ```bash
   npm list -g oh-my-claude-sisyphus
   ```

2. **验证目录存在**：
   ```bash
   ls -la .omc/  # In project directory
   ls -la ~/.omc/  # Global directory
   ```

3. **测试简单命令**：
   在 Claude Code 中运行 `/ultrapower:omc-help`，确保插件已正确加载。

### 3.0 新功能

#### 1. 零学习曲线操作

**无需记忆命令。** 自然地工作：

```
Before: "OK, I need to use /ultrapower:ultrawork for speed..."
After:  "I'm in a hurry, go fast!"
        ↓
        Claude: "I'm activating ultrawork mode..."
```

#### 2. 始终委派（自动）

复杂工作自动路由到专业 agent：

```
Your request              Claude's action
────────────────────     ────────────────────
"Refactor the database"   → Delegates to architect
"Fix the UI colors"       → Delegates to designer
"Document this API"       → Delegates to writer
"Search for all errors"   → Delegates to explore
"Debug this crash"        → Delegates to architect
```

您无需请求委派 - 它会自动发生。

#### 3. 学习 Skill（`/ultrapower:learner`）

从问题解决中提取可复用的洞察：

```bash
# After solving a tricky bug:
"Extract this as a skill"
    ↓
Claude learns the pattern and stores it
    ↓
Next time keywords match → Solution auto-injects
```

存储位置：
- **项目级**：`.omc/skills/`（版本控制）
- **用户级**：`~/.claude/skills/omc-learned/`（可移植）

#### 4. HUD 状态栏（实时编排）

在状态栏中查看 Claude 正在做什么：

```
[OMC] ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | todos:2/5
```

运行 `/ultrapower:hud setup` 安装。预设：minimal、focused、full。

#### 5. 三层记忆系统

关键知识在上下文压缩后仍能保留：

```
<remember priority>API client at src/api/client.ts</remember>
    ↓
Permanently loaded on session start
    ↓
Never lost through compaction
```

或使用 `/ultrapower:note` 手动保存发现：

```bash
/ultrapower:note Project uses PostgreSQL with Prisma ORM
```

#### 6. 结构化任务追踪（PRD 支持）

**Ralph Loop 现在使用产品需求文档：**

```bash
/ultrapower:ralph-init "implement OAuth with multiple providers"
    ↓
Auto-creates PRD with user stories
    ↓
Each story: description + acceptance criteria + pass/fail
    ↓
Ralph loops until ALL stories pass
```

#### 7. 智能续行

**任务在 Claude 停止前完成：**

```
You: "Implement user dashboard"
    ↓
Claude: "I'm activating ralph-loop to ensure completion"
    ↓
Creates todo list, works through each item
    ↓
Only stops when EVERYTHING is verified complete
```

### 向后兼容性说明

**注意**：v3.0 不保持与 v2.x 命名的向后兼容性。您必须完成上述迁移步骤，新版本才能正常工作。

---

## v3.0 → v3.1: Notepad Wisdom & Enhanced Features

### 概述

Version 3.1 是一个小版本，在保持与 v3.0 完全向后兼容的同时，新增了强大的功能。

### 新功能

#### 1. Notepad Wisdom System

计划范围的知识捕获，用于记录 learnings、decisions、issues 和 problems。

**位置：** `.omc/notepads/{plan-name}/`

| 文件 | 用途 |
|------|---------|
| `learnings.md` | 技术发现和模式 |
| `decisions.md` | 架构和设计决策 |
| `issues.md` | 已知问题和解决方案 |
| `problems.md` | 阻塞项和挑战 |

**API：**
- `initPlanNotepad()` - 为计划初始化 notepad
- `addLearning()` - 记录技术发现
- `addDecision()` - 记录架构选择
- `addIssue()` - 记录已知问题
- `addProblem()` - 记录阻塞项
- `getWisdomSummary()` - 获取所有知识摘要
- `readPlanWisdom()` - 读取完整知识以获取上下文

#### 2. Delegation Categories

语义任务分类，自动映射到模型层级、温度和思考预算。

| Category | Tier | Temperature | Thinking | 适用场景 |
|----------|------|-------------|----------|---------|
| `visual-engineering` | HIGH | 0.7 | high | UI/UX、前端、设计系统 |
| `ultrabrain` | HIGH | 0.3 | max | 复杂推理、架构、深度调试 |
| `artistry` | MEDIUM | 0.9 | medium | 创意方案、头脑风暴 |
| `quick` | LOW | 0.1 | low | 简单查询、基本操作 |
| `writing` | MEDIUM | 0.5 | medium | 文档、技术写作 |

**自动检测：** 类别从提示词关键词自动检测。

#### 3. Directory Diagnostics Tool

通过 `lsp_diagnostics_directory` 工具进行项目级类型检查。

**策略：**
- `auto`（默认）- 自动选择最佳策略，存在 tsconfig.json 时优先使用 tsc
- `tsc` - 快速，使用 TypeScript 编译器
- `lsp` - 回退方案，通过 Language Server 逐文件检查

**用途：** 在提交前或重构后检查整个项目的错误。

#### 4. Session Resume

后台 agent 可通过 `resume-session` 工具以完整上下文恢复。

### 迁移步骤

Version 3.1 是即插即用的升级。无需迁移！

```bash
npm update -g oh-my-claude-sisyphus
```

所有现有配置、计划和工作流继续正常工作。

### 新增可用工具

升级后，agent 自动获得以下访问权限：
- Notepad wisdom API（执行期间读写知识）
- Delegation categories（自动分类）
- Directory diagnostics（项目级类型检查）
- Session resume（恢复后台 agent 状态）

---

## v3.3.x → v3.4.0: Parallel Execution & Advanced Workflows

### 概述

Version 3.4.0 在保持与 v3.3.x 完全向后兼容的同时，引入了强大的并行执行模式和高级工作流编排。

### 新功能

#### 1. Ultrapilot: Parallel Autopilot

使用最多 5 个并发 worker 执行复杂任务，速度提升 3-5 倍：

```bash
/ultrapower:ultrapilot "build a fullstack todo app"
```

**主要特性：**
- 自动将任务分解为可并行的子任务
- 文件所有权协调以防止冲突
- 带智能协调的并行执行
- 状态文件：`.omc/state/ultrapilot-state.json`、`.omc/state/ultrapilot-ownership.json`

**最适合：** 多组件系统、全栈应用、大型重构

#### 2. Swarm: Coordinated Agent Teams

N 个协调 agent，具有原子任务认领：

```bash
/ultrapower:swarm 5:executor "fix all TypeScript errors"
```

**主要特性：**
- 带原子认领的共享任务池（防止重复工作）
- 每个任务 5 分钟超时并自动释放
- 可扩展至 2 到 10 个 worker
- 所有任务完成后干净退出

#### 3. Pipeline: Sequential Agent Chaining

链式 agent，各阶段间传递数据：

```bash
/ultrapower:pipeline explore:haiku -> architect:opus -> executor:sonnet
```

**内置预设：**
- `review` - explore → architect → critic → executor
- `implement` - planner → executor → test-engineer
- `debug` - explore → architect → build-fixer
- `research` - parallel(document-specialist, explore) → architect → writer
- `refactor` - explore → architect-medium → executor-high → qa-tester
- `security` - explore → security-reviewer → executor → security-reviewer-low

#### 4. 统一取消命令

智能取消，自动检测活跃模式：

```bash
/ultrapower:cancel
# Or just say: "stop", "cancel", "abort"
```

**自动检测并取消：** autopilot、ultrapilot、ralph、ultrawork、ultraqa、swarm、pipeline

**废弃通知：**
单独的取消命令已废弃但仍可使用：
- `/ultrapower:cancel-ralph`（已废弃）
- `/ultrapower:cancel-ultraqa`（已废弃）
- `/ultrapower:cancel-ultrawork`（已废弃）
- `/ultrapower:cancel-autopilot`（已废弃）

请改用 `/ultrapower:cancel`。

#### 6. Explore-High Agent

Opus 驱动的架构搜索，用于复杂代码库探索：

```typescript
Task(subagent_type="ultrapower:explore-high",
     model="opus",
     prompt="Find all authentication-related code patterns...")
```

**最适合：** 架构分析、横切关注点、复杂重构规划

#### 7. 状态管理标准化

状态文件现在使用标准化路径：

**标准路径：**
- 本地：`.omc/state/{name}.json`
- 全局：`~/.omc/state/{name}.json`

旧版位置在读取时自动迁移。

#### 8. 关键词冲突解决

当存在多个执行模式关键词时：

**冲突解决优先级：**
| 优先级 | 条件 | 结果 |
|----------|-----------|--------|
| 1（最高） | 单个显式关键词 | 该模式获胜 |
| 2 | 仅通用 "fast"/"parallel" | 从配置读取（`defaultExecutionMode`） |
| 3（最低） | 无配置文件 | 默认为 `ultrawork` |

**显式模式关键词：** `ulw`、`ultrawork`
**通用关键词：** `fast`、`parallel`

用户通过 `/ultrapower:omc-setup` 设置默认模式偏好。

### 迁移步骤

Version 3.4.0 是即插即用的升级。无需迁移！

```bash
npm update -g oh-my-claude-sisyphus
```

所有现有配置、计划和工作流继续正常工作。

### 新配置选项

#### 默认执行模式

在 `~/.claude/.omc-config.json` 中设置您的首选执行模式：

```json
{
  "defaultExecutionMode": "ultrawork"
}
```

当您使用 "fast" 或 "parallel" 等通用关键词而不使用显式模式关键词时，此设置决定激活哪种模式。

### 破坏性变更

无。所有 v3.3.x 功能和命令在 v3.4.0 中继续工作。

### 新增可用工具

升级后，您自动获得以下访问权限：
- Ultrapilot（并行 autopilot）
- Swarm 协调
- Pipeline 工作流
- 统一取消命令
- Explore-high agent

### v3.4.0 最佳实践

#### 各模式使用场景

| 场景 | 推荐模式 | 原因 |
|----------|------------------|-----|
| 多组件系统 | `ultrapilot` | 并行 worker 处理独立组件 |
| 大量小修复 | `swarm` | 原子任务认领防止重复工作 |
| 顺序依赖 | `pipeline` | 数据在各阶段间传递 |
| 单个复杂任务 | `autopilot` | 完全自主执行 |
| 必须完成 | `ralph` | 持久性保障 |

#### 关键词用法

**显式模式控制（v3.4.0）：**
```bash
"ulw: fix all errors"           # ultrawork (explicit)
"fast: implement feature"       # reads defaultExecutionMode config
```

**自然语言（仍然有效）：**
```bash
"don't stop until done"         # ralph
"parallel execution"            # reads defaultExecutionMode
"build me a todo app"           # autopilot
```

### 验证

升级后，验证新功能：

1. **检查安装**：
   ```bash
   npm list -g oh-my-claude-sisyphus
   ```

2. **测试 ultrapilot**：
   ```bash
   /ultrapower:ultrapilot "create a simple React component"
   ```

3. **测试统一取消**：
   ```bash
   /ultrapower:cancel
   ```

4. **检查状态目录**：
   ```bash
   ls -la .omc/state/  # Should see ultrapilot-state.json after running ultrapilot
   ```

---

## v3.x → v4.0: Major Architecture Overhaul

### 概述

Version 4.0 完整重新设计了 Agent 架构，将 34 个分层 Agent 整合为 28 个统一专业 Agent，并引入了高级 Team 协调系统。

### 破坏性变更

**Agent 层级系统移除：**

之前的 `-low`、`-medium`、`-high` 后缀 Agent 已全部移除。

```typescript
// 之前（v3.x）
Task(subagent_type="ultrapower:architect-high", ...)

// 之后（v4.0+）
Task(subagent_type="ultrapower:architect", model="opus", ...)
```

### 迁移步骤

1. 将所有 `*-low`、`*-medium`、`*-high` Agent 引用替换为对应的统一 Agent 名称
2. 通过 `model` 参数指定所需模型（`haiku`/`sonnet`/`opus`）
3. 重新运行 `/omc-setup` 更新配置

### 保持更新

- 查看 [CHANGELOG.md](../CHANGELOG.md) 了解详细发布说明
- 参与 [GitHub Issues](https://github.com/liangjie559567/ultrapower/issues) 讨论

---

## 跨版本常见场景

### 场景 1：快速实现任务

**2.x 工作流：**
```
/ultrapower:ultrawork "implement the todo list feature"
```

**3.0+ 工作流：**
```
"implement the todo list feature quickly"
    ↓
Claude: "I'm activating ultrawork for maximum parallelism"
```

**结果：** 相同的结果，更自然的交互。

### 场景 2：复杂调试

**2.x 工作流：**
```
/ultrapower:ralph "debug the memory leak"
```

**3.0+ 工作流：**
```
"there's a memory leak in the worker process - don't stop until we fix it"
    ↓
Claude: "I'm activating ralph-loop to ensure completion"
```

**结果：** Ralph-loop 获得了更多来自自然语言的上下文。

### 场景 3：战略规划

**2.x 工作流：**
```
/ultrapower:planner "design the new authentication system"
```

**3.0+ 工作流：**
```
"plan the new authentication system"
    ↓
Claude: "I'm starting a planning session"
    ↓
Interview begins automatically
```

**结果：** 由自然语言触发的规划访谈。

### 场景 4：停止工作

**2.x 工作流：**
```
/ultrapower:cancel-ralph
```

**3.0+ 工作流：**
```
"stop"
```

**结果：** Claude 智能取消活跃操作。

---

## 配置选项

### 项目范围配置（推荐）

仅将 ultrapower 应用于当前项目：

```
/ultrapower:omc-default
```

创建：`./.claude/CLAUDE.md`

### 全局配置

应用于所有 Claude Code 会话：

```
/ultrapower:omc-default-global
```

创建：`~/.claude/CLAUDE.md`

**优先级：** 如果两者都存在，项目配置覆盖全局配置。

---

## 常见问题

**Q：必须使用关键词吗？**
A：不必。关键词是可选的快捷方式。Claude 无需关键词即可自动检测意图。

**Q：我的旧命令会失效吗？**
A：不会。所有命令在小版本间（3.0 → 3.1）继续有效。主版本变更（3.x → 4.0）将提供迁移路径。

**Q：如果我喜欢显式命令怎么办？**
A：继续使用！`/ultrapower:ralph`、`/ultrapower:ultrawork` 和 `/ultrapower:plan` 均可使用。注意：`/ultrapower:planner` 现在重定向到 `/ultrapower:plan`。

**Q：如何知道 Claude 在做什么？**
A：Claude 会宣布主要行为："I'm activating ralph-loop..."，或设置 `/ultrapower:hud` 获取实时状态。

**Q：完整命令列表在哪里？**
A：参见 [README.md](../README.md) 获取完整命令参考。所有命令仍然有效。

**Q：关键词和自然语言有什么区别？**
A：关键词是显式快捷方式。自然语言触发自动检测。两者均可使用。

---

## 需要帮助？

- **诊断问题**：运行 `/ultrapower:omc-doctor`
- **查看所有命令**：运行 `/ultrapower:omc-help`
- **查看实时状态**：运行 `/ultrapower:hud setup`
- **查看详细变更日志**：参见 [CHANGELOG.md](../CHANGELOG.md)
- **报告 bug**：[GitHub Issues](https://github.com/liangjie559567/ultrapower/issues)

---

## 下一步？

现在您已了解迁移：

1. **立即见效**：在工作中开始使用关键词（`ralph`、`ulw`、`plan`）
2. **充分发挥**：阅读 [docs/CLAUDE.md](CLAUDE.md) 了解编排
3. **高级用法**：查看 [docs/ARCHITECTURE.md](ARCHITECTURE.md) 深入了解
4. **团队入门**：与队友分享本指南

欢迎使用 ultrapower！
