# Superpowers 发布说明

## Unreleased

### Breaking Changes

**Specs and plans directory restructured**

- Specs (brainstorming output) now go to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plans (writing-plans output) now go to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- User preferences for spec/plan locations override these defaults
- Migration: move existing files from `docs/plans/` to new locations if desired

**Brainstorming → writing-plans transition enforced**

- After design approval, brainstorming now requires using writing-plans skill
- Platform planning features (e.g., EnterPlanMode) should not be used
- Direct implementation without writing-plans is not allowed

**Subagent-driven development now mandatory on capable harnesses**

- On harnesses with subagent support (Claude Code), subagent-driven-development is now required after plan approval
- No longer offers a choice between subagent-driven and executing-plans
- Executing-plans is only used on harnesses without subagent capability

**OpenCode: Switched to native skills system**

Superpowers for OpenCode now uses OpenCode's native `skill` tool instead of custom `use_skill`/`find_skills` tools. This is a cleaner integration that works with OpenCode's built-in skill discovery.

**Migration required:** Skills must be symlinked to `~/.config/opencode/skills/superpowers/` (see updated installation docs).

### Fixes

**OpenCode: Fixed agent reset on session start (#226)**

The previous bootstrap injection method using `session.prompt({ noReply: true })` caused OpenCode to reset the selected agent to "build" on first message. Now uses `experimental.chat.system.transform` hook which modifies the system prompt directly without side effects.

**OpenCode: Fixed Windows installation (#232)**

- Removed dependency on `skills-core.js` (eliminates broken relative imports when file is copied instead of symlinked)
- Added comprehensive Windows installation docs for cmd.exe, PowerShell, and Git Bash
- Documented proper symlink vs junction usage for each platform

### New Features

**Visual companion for brainstorming skill**

Added optional browser-based visual companion for brainstorming sessions. When users have a browser available, brainstorming can display interactive screens showing current phase, questions, and design decisions in a more readable format than terminal output.

Components:
- `lib/brainstorm-server/` - WebSocket server for real-time updates
- `skills/brainstorming/visual-companion.md` - Integration guide
- Helper scripts for session management with proper isolation
- Browser helper library for event capture

The visual companion is opt-in and falls back gracefully to terminal-only operation.

### Bug Fixes

**Fixed Windows hook execution for Claude Code 2.1.x**

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash `. This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the .cmd file as a bash script.

Fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x handles the bash invocation automatically. Also added .gitattributes to enforce LF line endings for shell scripts (fixes CRLF issues on Windows checkout).

**Brainstorming visual companion: reduced token cost and improved persistence**

The visual companion now generates much smaller HTML per screen. The server automatically wraps bare content fragments in the frame template (header, CSS theme, feedback footer, interactive JS), so Claude writes only the content portion (~30 lines instead of ~260). Full HTML documents are still served as-is when Claude needs complete control.

Other improvements:
- `toggleSelect`/`send`/`selectedChoice` moved from inline template script to `helper.js` (auto-injected)
- `start-server.sh --project-dir` persists mockups under `.superpowers/brainstorm/` instead of `/tmp`
- `stop-server.sh` only deletes ephemeral `/tmp` sessions, preserving persistent ones
- Dark mode fix: `sendToClaude` confirmation page now uses CSS variables instead of hardcoded colors
- Skill restructured: SKILL.md is minimal (prompt + pointer); all visual companion details in progressive disclosure doc (`visual-companion.md`)
- Prompt to user now notes the feature is new, token-intensive, and can be slow
- Deleted redundant `CLAUDE-INSTRUCTIONS.md` (content folded into `visual-companion.md`)
- Test fixes: correct env var (`BRAINSTORM_DIR`), polling-based startup wait, new tests for frame wrapping

### Improvements

**Instruction priority clarified in using-superpowers**

Added explicit instruction priority hierarchy to prevent conflicts with user preferences:

1. User's explicit instructions (CLAUDE.md, direct requests) — highest priority
2. Superpowers skills — override default system behavior where they conflict
3. Default system prompt — lowest priority

This ensures users remain in control. If CLAUDE.md says "don't use TDD" and a skill says "always use TDD," CLAUDE.md wins.

## v4.3.0 (2026-02-12)

此修复应显著提升 superpowers skills 的合规性，并降低 Claude 无意中进入原生 plan 模式的概率。

### 变更

**Brainstorming skill 现在强制执行其工作流，而非仅描述它**

模型会跳过设计阶段，直接跳到 frontend-design 等实现 skills，或将整个 brainstorming 过程压缩成单个文本块。该 skill 现在使用硬性门控、强制检查清单和 graphviz 流程图来强制合规：

- `<HARD-GATE>`：在设计方案呈现并获得用户批准之前，不得使用实现 skills、编写代码或搭建脚手架
- 明确的检查清单（6 项），必须作为任务创建并按顺序完成
- Graphviz 流程图，以 `writing-plans` 作为唯一有效的终止状态
- 针对"这太简单了，不需要设计"的反模式警告——这正是模型用来跳过流程的典型借口
- 设计章节大小基于章节复杂度，而非项目复杂度

**Using-superpowers 工作流图拦截 EnterPlanMode**

在 skill 流程图中添加了 `EnterPlanMode` 拦截。当模型即将进入 Claude 原生 plan 模式时，它会检查 brainstorming 是否已发生，并改为路由到 brainstorming skill。Plan 模式永远不会被进入。

### 修复

**SessionStart hook 现在同步运行**

将 hooks.json 中的 `async: true` 改为 `async: false`。异步时，hook 可能在模型第一轮之前未能完成，导致 using-superpowers 指令在第一条消息时不在上下文中。

## v4.2.0 (2026-02-05)

### 破坏性变更

**Codex：用原生 skill 发现替换 bootstrap CLI**

`superpowers-codex` bootstrap CLI、Windows `.cmd` 包装器及相关 bootstrap 内容文件已被移除。Codex 现在通过 `~/.agents/skills/superpowers/` 符号链接使用原生 skill 发现，因此不再需要旧的 `use_skill`/`find_skills` CLI 工具。

安装现在只需 clone + symlink（详见 INSTALL.md）。不需要 Node.js 依赖。旧的 `~/.codex/skills/` 路径已弃用。

### 修复

**Windows：修复 Claude Code 2.1.x hook 执行（#331）**

Claude Code 2.1.x 更改了 Windows 上 hooks 的执行方式：现在自动检测命令中的 `.sh` 文件并在前面加上 `bash`。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 会尝试将 `.cmd` 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。同时添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows checkout 上的 CRLF 问题）。

**Windows：SessionStart hook 异步运行以防止终端冻结（#404, #413, #414, #419）**

同步的 SessionStart hook 阻止了 TUI 在 Windows 上进入原始模式，冻结了所有键盘输入。异步运行 hook 可防止冻结，同时仍然注入 superpowers 上下文。

**Windows：修复 O(n^2) `escape_for_json` 性能问题**

使用 `${input:$i:1}` 的逐字符循环在 bash 中由于子字符串复制开销而是 O(n^2)。在 Windows Git Bash 上这需要 60 多秒。替换为 bash 参数替换（`${s//old/new}`），每个模式作为单个 C 级别传递运行——在 macOS 上快 7 倍，在 Windows 上快得多。

**Codex：修复 Windows/PowerShell 调用（#285, #243）**

- Windows 不遵守 shebang，因此直接调用无扩展名的 `superpowers-codex` 脚本会触发"打开方式"对话框。所有调用现在都以 `node` 为前缀。
- 修复了 Windows 上的 `~/` 路径展开——PowerShell 在作为参数传递给 `node` 时不展开 `~`。改为使用 `$HOME`，在 bash 和 PowerShell 中都能正确展开。

**Codex：修复安装程序中的路径解析**

使用 `fileURLToPath()` 代替手动 URL 路径名解析，以正确处理所有平台上包含空格和特殊字符的路径。

**Codex：修复 writing-skills 中的过时 skills 路径**

将已弃用的 `~/.codex/skills/` 引用更新为 `~/.agents/skills/` 以用于原生发现。

### 改进

**实现前现在需要 worktree 隔离**

将 `using-git-worktrees` 添加为 `subagent-driven-development` 和 `executing-plans` 的必需 skill。实现工作流现在明确要求在开始工作前设置隔离的 worktree，防止意外直接在 main 分支上工作。

**主分支保护软化为需要明确同意**

不再完全禁止主分支工作，skills 现在允许在用户明确同意的情况下进行。更灵活，同时仍确保用户了解其影响。

**简化安装验证**

从验证步骤中移除了 `/help` 命令检查和特定斜杠命令列表。Skills 主要通过描述你想做的事情来调用，而不是运行特定命令。

**Codex：在 bootstrap 中澄清子智能体工具映射**

改进了 Codex 工具如何映射到子智能体工作流的 Claude Code 等效项的文档。

### 测试

- 为 subagent-driven-development 添加了 worktree 要求测试
- 添加了主分支红旗警告测试
- 修复了 skill 识别测试断言中的大小写敏感性

---

## v4.1.1 (2026-01-23)

### 修复

**OpenCode：按官方文档标准化使用 `plugins/` 目录（#343）**

OpenCode 的官方文档使用 `~/.config/opencode/plugins/`（复数）。我们的文档之前使用 `plugin/`（单数）。虽然 OpenCode 两种形式都接受，但我们已标准化为官方约定以避免混淆。

变更：
- 将仓库结构中的 `.opencode/plugin/` 重命名为 `.opencode/plugins/`
- 更新了所有平台的安装文档（INSTALL.md、README.opencode.md）
- 更新了测试脚本以匹配

**OpenCode：修复符号链接说明（#339, #342）**

- 在 `ln -s` 之前添加了明确的 `rm`（修复重新安装时的"文件已存在"错误）
- 添加了 INSTALL.md 中缺失的 skills 符号链接步骤
- 从已弃用的 `use_skill`/`find_skills` 更新为原生 `skill` 工具引用

---

## v4.1.0 (2026-01-23)

### 破坏性变更

**OpenCode：切换到原生 skills 系统**

OpenCode 的 Superpowers 现在使用 OpenCode 的原生 `skill` 工具，而非自定义的 `use_skill`/`find_skills` 工具。这是一种更简洁的集成方式，与 OpenCode 的内置 skill 发现机制配合使用。

**需要迁移：** Skills 必须符号链接到 `~/.config/opencode/skills/superpowers/`（参见更新的安装文档）。

### 修复

**OpenCode：修复会话启动时的智能体重置（#226）**

之前使用 `session.prompt({ noReply: true })` 的 bootstrap 注入方法导致 OpenCode 在第一条消息时将选定的智能体重置为"build"。现在使用 `experimental.chat.system.transform` hook，直接修改系统提示而无副作用。

**OpenCode：修复 Windows 安装（#232）**

- 移除了对 `skills-core.js` 的依赖（消除了文件被复制而非符号链接时的损坏相对导入）
- 为 cmd.exe、PowerShell 和 Git Bash 添加了全面的 Windows 安装文档
- 记录了每个平台的正确符号链接与 junction 用法

**Claude Code：修复 Claude Code 2.1.x 的 Windows hook 执行**

Claude Code 2.1.x 更改了 Windows 上 hooks 的执行方式：现在自动检测命令中的 `.sh` 文件并在前面加上 `bash `。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 会尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。同时添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows checkout 上的 CRLF 问题）。

---

## v4.0.3 (2025-12-26)

### 改进

**针对明确 skill 请求强化了 using-superpowers skill**

解决了一个失败模式：即使用户明确按名称请求某个 skill（例如"subagent-driven-development，请"），Claude 也会跳过调用该 skill。Claude 会认为"我知道那是什么意思"，然后直接开始工作而不加载 skill。

变更：
- 将"规则"更新为"调用相关或被请求的 skills"，而非"检查 skills"——强调主动调用而非被动检查
- 添加了"在任何响应或行动之前"——原来的措辞只提到"响应"，但 Claude 有时会在不先响应的情况下采取行动
- 添加了调用错误 skill 也没关系的保证——减少犹豫
- 添加了新的红旗："我知道那是什么意思"→ 了解概念 ≠ 使用 skill

**添加了明确 skill 请求测试**

在 `tests/explicit-skill-requests/` 中新增测试套件，验证 Claude 在用户按名称请求时正确调用 skills。包含单轮和多轮测试场景。

## v4.0.2 (2025-12-23)

### 修复

**斜杠命令现在仅限用户使用**

为所有三个斜杠命令（`/brainstorm`、`/execute-plan`、`/write-plan`）添加了 `disable-model-invocation: true`。Claude 不再能通过 Skill 工具调用这些命令——它们仅限手动用户调用。

底层 skills（`superpowers:brainstorming`、`superpowers:executing-plans`、`superpowers:writing-plans`）仍可供 Claude 自主调用。此变更防止了 Claude 调用一个只是重定向到 skill 的命令时产生的混淆。

## v4.0.1 (2025-12-23)

### 修复

**澄清了如何在 Claude Code 中访问 skills**

修复了一个令人困惑的模式：Claude 会通过 Skill 工具调用 skill，然后尝试单独 Read skill 文件。`using-superpowers` skill 现在明确说明 Skill 工具直接加载 skill 内容——无需读取文件。

- 在 `using-superpowers` 中添加了"如何访问 Skills"章节
- 将说明中的"读取 skill"改为"调用 skill"
- 更新斜杠命令以使用完全限定的 skill 名称（例如 `superpowers:brainstorming`）

**为 receiving-code-review 添加了 GitHub 线程回复指导**（感谢 @ralphbean）

添加了关于在原始线程中回复内联审查评论而非作为顶级 PR 评论的说明。

**为 writing-skills 添加了自动化优先于文档的指导**（感谢 @EthanJStark）

添加了机械性约束应该自动化而非文档化的指导——将 skills 留给需要判断的情况。

## v4.0.0 (2025-12-17)

### 新功能

**subagent-driven-development 中的两阶段代码审查**

子智能体工作流现在在每个任务后使用两个独立的审查阶段：

1. **规格合规审查** - 持怀疑态度的审查者验证实现是否与规格完全匹配。捕获缺失的需求和过度构建。不信任实现者的报告——读取实际代码。

2. **代码质量审查** - 仅在规格合规通过后运行。审查代码整洁度、测试覆盖率、可维护性。

这捕获了常见的失败模式：代码写得很好但与请求的内容不匹配。审查是循环的，而非一次性的：如果审查者发现问题，实现者修复它们，然后审查者再次检查。

其他子智能体工作流改进：
- 控制器向工作者提供完整任务文本（而非文件引用）
- 工作者可以在工作前和工作中提出澄清问题
- 报告完成前的自我审查检查清单
- 计划在开始时读取一次，提取到 TodoWrite

`skills/subagent-driven-development/` 中的新提示模板：
- `implementer-prompt.md` - 包含自我审查检查清单，鼓励提问
- `spec-reviewer-prompt.md` - 针对需求的持怀疑态度的验证
- `code-quality-reviewer-prompt.md` - 标准代码审查

**调试技术与工具整合**

`systematic-debugging` 现在捆绑了支持技术和工具：
- `root-cause-tracing.md` - 通过调用栈向后追踪 bug
- `defense-in-depth.md` - 在多个层次添加验证
- `condition-based-waiting.md` - 用条件轮询替换任意超时
- `find-polluter.sh` - 二分查找脚本，用于找出哪个测试造成污染
- `condition-based-waiting-example.ts` - 来自真实调试会话的完整实现

**测试反模式参考**

`test-driven-development` 现在包含 `testing-anti-patterns.md`，涵盖：
- 测试模拟行为而非真实行为
- 向生产类添加仅测试方法
- 不理解依赖关系就进行模拟
- 隐藏结构假设的不完整模拟

**Skill 测试基础设施**

三个用于验证 skill 行为的新测试框架：

`tests/skill-triggering/` - 验证 skills 从朴素提示触发而无需明确命名。测试 6 个 skills 以确保仅描述就足够。

`tests/claude-code/` - 使用 `claude -p` 进行无头测试的集成测试。通过会话记录（JSONL）分析验证 skill 使用。包含用于成本跟踪的 `analyze-token-usage.py`。

`tests/subagent-driven-dev/` - 包含两个完整测试项目的端到端工作流验证：
- `go-fractals/` - 带 Sierpinski/Mandelbrot 的 CLI 工具（10 个任务）
- `svelte-todo/` - 带 localStorage 和 Playwright 的 CRUD 应用（12 个任务）

### 重大变更

**DOT 流程图作为可执行规范**

使用 DOT/GraphViz 流程图作为权威流程定义重写了关键 skills。散文成为支持内容。

**描述陷阱**（记录在 `writing-skills` 中）：发现当描述包含工作流摘要时，skill 描述会覆盖流程图内容。Claude 遵循简短描述而不是阅读详细流程图。修复：描述必须仅作为触发器（"在 X 时使用"），不包含流程细节。

**using-superpowers 中的 skill 优先级**

当多个 skills 适用时，流程 skills（brainstorming、debugging）现在明确优先于实现 skills。"构建 X"首先触发 brainstorming，然后是领域 skills。

**brainstorming 触发器强化**

描述改为命令式："在任何创意工作之前——创建功能、构建组件、添加功能或修改行为——你必须使用此 skill。"

### 破坏性变更

**Skill 整合** - 六个独立 skills 合并：
- `root-cause-tracing`、`defense-in-depth`、`condition-based-waiting` → 捆绑在 `systematic-debugging/` 中
- `testing-skills-with-subagents` → 捆绑在 `writing-skills/` 中
- `testing-anti-patterns` → 捆绑在 `test-driven-development/` 中
- `sharing-skills` 已移除（已过时）

### 其他改进

- **render-graphs.js** - 从 skills 中提取 DOT 图并渲染为 SVG 的工具
- **using-superpowers 中的合理化表格** - 可扫描格式，包含新条目："我需要先获取更多上下文"、"让我先探索"、"这感觉很有成效"
- **docs/testing.md** - 使用 Claude Code 集成测试测试 skills 的指南

---

## v3.6.2 (2025-12-03)

### 修复

- **Linux 兼容性**：修复了 polyglot hook 包装器（`run-hook.cmd`）以使用 POSIX 兼容语法
  - 将第 16 行 bash 特有的 `${BASH_SOURCE[0]:-$0}` 替换为标准的 `$0`
  - 解决了 Ubuntu/Debian 系统上 `/bin/sh` 为 dash 时的"Bad substitution"错误
  - 修复 #141

---

## v3.5.1 (2025-11-24)

### 变更

- **OpenCode Bootstrap 重构**：从 `chat.message` hook 切换到 `session.created` 事件进行 bootstrap 注入
  - Bootstrap 现在通过 `session.prompt()` 配合 `noReply: true` 在会话创建时注入
  - 明确告知模型 using-superpowers 已加载，防止冗余的 skill 加载
  - 将 bootstrap 内容生成整合到共享的 `getBootstrapContent()` 辅助函数中
  - 更简洁的单一实现方式（移除了回退模式）

---

## v3.5.0 (2025-11-23)

### 新增

- **OpenCode 支持**：OpenCode.ai 的原生 JavaScript 插件
  - 自定义工具：`use_skill` 和 `find_skills`
  - 跨上下文压缩的 skill 持久化消息插入模式
  - 通过 chat.message hook 自动注入上下文
  - 在 session.compacted 事件时自动重新注入
  - 三级 skill 优先级：project > personal > superpowers
  - 项目本地 skills 支持（`.opencode/skills/`）
  - 与 Codex 代码复用的共享核心模块（`lib/skills-core.js`）
  - 具有适当隔离的自动化测试套件（`tests/opencode/`）
  - 平台特定文档（`docs/README.opencode.md`、`docs/README.codex.md`）

### 变更

- **重构 Codex 实现**：现在使用共享的 `lib/skills-core.js` ES 模块
  - 消除了 Codex 和 OpenCode 之间的代码重复
  - skill 发现和解析的单一真实来源
  - Codex 通过 Node.js 互操作成功加载 ES 模块

- **改进文档**：重写 README 以清晰解释问题/解决方案
  - 移除了重复章节和冲突信息
  - 添加了完整工作流描述（brainstorm → plan → execute → finish）
  - 简化了平台安装说明
  - 强调 skill 检查协议而非自动激活声明

---

## v3.4.1 (2025-10-31)

### 改进

- 优化了 superpowers bootstrap 以消除冗余的 skill 执行。`using-superpowers` skill 内容现在直接在会话上下文中提供，并明确指导仅对其他 skills 使用 Skill 工具。这减少了开销，并防止了智能体尽管已从会话启动获得内容却仍手动执行 `using-superpowers` 的混淆循环。

## v3.4.0 (2025-10-30)

### 改进

- 简化了 `brainstorming` skill，回归原始的对话式愿景。移除了带有正式检查清单的重量级 6 阶段流程，改为自然对话：一次提一个问题，然后以 200-300 字的章节呈现设计并进行验证。保留了文档和实现交接功能。

## v3.3.1 (2025-10-28)

### 改进

- 更新了 `brainstorming` skill，要求在提问前进行自主侦察，鼓励以推荐为导向的决策，并防止智能体将优先级排序委托回人类。
- 按照 Strunk 的《文体要素》原则对 `brainstorming` skill 进行了写作清晰度改进（省略多余词语、将否定形式转换为肯定形式、改进并行结构）。

### Bug 修复

- 澄清了 `writing-skills` 指导，使其指向正确的智能体特定个人 skill 目录（Claude Code 为 `~/.claude/skills`，Codex 为 `~/.codex/skills`）。

## v3.3.0 (2025-10-28)

### 新功能

**实验性 Codex 支持**
- 添加了统一的 `superpowers-codex` 脚本，包含 bootstrap/use-skill/find-skills 命令
- 跨平台 Node.js 实现（适用于 Windows、macOS、Linux）
- 命名空间 skills：superpowers skills 使用 `superpowers:skill-name`，个人 skills 使用 `skill-name`
- 个人 skills 在名称匹配时覆盖 superpowers skills
- 简洁的 skill 显示：显示名称/描述而不显示原始 frontmatter
- 有用的上下文：显示每个 skill 的支持文件目录
- Codex 的工具映射：TodoWrite→update_plan，子智能体→手动回退等
- 与最小化 AGENTS.md 的 bootstrap 集成，用于自动启动
- 完整的安装指南和 Codex 特定的 bootstrap 说明

**与 Claude Code 集成的主要区别：**
- 单一统一脚本而非独立工具
- Codex 特定等效项的工具替换系统
- 简化的子智能体处理（手动工作而非委托）
- 更新的术语："Superpowers skills"而非"Core skills"

### 新增文件
- `.codex/INSTALL.md` - Codex 用户安装指南
- `.codex/superpowers-bootstrap.md` - 带 Codex 适配的 bootstrap 说明
- `.codex/superpowers-codex` - 包含所有功能的统一 Node.js 可执行文件

**注意：** Codex 支持是实验性的。该集成提供了核心 superpowers 功能，但可能需要根据用户反馈进行改进。

## v3.2.3 (2025-10-23)

### 改进

**更新 using-superpowers skill 以使用 Skill 工具而非 Read 工具**
- 将 skill 调用说明从 Read 工具改为 Skill 工具
- 更新描述："using Read tool"→"using Skill tool"
- 更新步骤 3："Use the Read tool"→"Use the Skill tool to read and run"
- 更新合理化列表："Read the current version"→"Run the current version"

Skill 工具是在 Claude Code 中调用 skills 的正确机制。此更新修正了 bootstrap 说明，引导智能体使用正确的工具。

### 变更的文件
- 更新：`skills/using-superpowers/SKILL.md` - 将工具引用从 Read 改为 Skill

## v3.2.2 (2025-10-21)

### 改进

**针对智能体合理化行为强化了 using-superpowers skill**
- 添加了关于强制 skill 检查的绝对语言的 EXTREMELY-IMPORTANT 块
  - "如果有哪怕 1% 的概率某个 skill 适用，你必须读取它"
  - "你没有选择。你无法通过合理化来逃避。"
- 添加了强制首次响应协议检查清单
  - 智能体在任何响应前必须完成的 5 步流程
  - 明确的"不执行此操作 = 失败"后果
- 添加了包含 8 种特定规避模式的常见合理化章节
  - "这只是一个简单的问题"→ 错误
  - "我可以快速检查文件"→ 错误
  - "让我先收集信息"→ 错误
  - 以及在智能体行为中观察到的另外 5 种常见模式

这些变更解决了观察到的智能体行为：尽管有明确指令，它们仍会围绕 skill 使用进行合理化。强硬的语言和预防性反驳旨在使不合规更加困难。

### 变更的文件
- 更新：`skills/using-superpowers/SKILL.md` - 添加了三层强制措施以防止跳过 skill 的合理化行为

## v3.2.1 (2025-10-20)

### 新功能

**插件中现在包含 code reviewer 智能体**
- 将 `superpowers:code-reviewer` 智能体添加到插件的 `agents/` 目录
- 智能体根据计划和编码标准提供系统性代码审查
- 之前需要用户拥有个人智能体配置
- 所有 skill 引用更新为使用命名空间的 `superpowers:code-reviewer`
- 修复 #55

### 变更的文件
- 新增：`agents/code-reviewer.md` - 带审查检查清单和输出格式的智能体定义
- 更新：`skills/requesting-code-review/SKILL.md` - 引用 `superpowers:code-reviewer`
- 更新：`skills/subagent-driven-development/SKILL.md` - 引用 `superpowers:code-reviewer`

## v3.2.0 (2025-10-18)

### 新功能

**brainstorming 工作流中的设计文档**
- 在 brainstorming skill 中添加了第 4 阶段：设计文档
- 设计文档现在在实现前写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 恢复了在 skill 转换过程中丢失的原始 brainstorming 命令功能
- 文档在 worktree 设置和实现规划之前编写
- 在时间压力下通过子智能体测试验证合规性

### 破坏性变更

**Skill 引用命名空间标准化**
- 所有内部 skill 引用现在使用 `superpowers:` 命名空间前缀
- 更新格式：`superpowers:test-driven-development`（之前只是 `test-driven-development`）
- 影响所有 REQUIRED SUB-SKILL、RECOMMENDED SUB-SKILL 和 REQUIRED BACKGROUND 引用
- 与使用 Skill 工具调用 skills 的方式保持一致
- 更新的文件：brainstorming、executing-plans、subagent-driven-development、systematic-debugging、testing-skills-with-subagents、writing-plans、writing-skills

### 改进

**设计与实现计划命名**
- 设计文档使用 `-design.md` 后缀以防止文件名冲突
- 实现计划继续使用现有的 `YYYY-MM-DD-<feature-name>.md` 格式
- 两者都存储在 `docs/plans/` 目录中，命名区分清晰

## v3.1.1 (2025-10-17)

### Bug 修复

- **修复 README 中的命令语法**（#44）- 更新所有命令引用以使用正确的命名空间语法（`/superpowers:brainstorm` 而非 `/brainstorm`）。插件提供的命令由 Claude Code 自动命名空间化，以避免插件之间的冲突。

## v3.1.0 (2025-10-17)

### 破坏性变更

**Skill 名称标准化为小写**
- 所有 skill frontmatter `name:` 字段现在使用与目录名匹配的小写 kebab-case
- 示例：`brainstorming`、`test-driven-development`、`using-git-worktrees`
- 所有 skill 公告和交叉引用更新为小写格式
- 确保目录名、frontmatter 和文档之间命名一致

### 新功能

**增强的 brainstorming skill**
- 添加了显示阶段、活动和工具使用的快速参考表
- 添加了用于跟踪进度的可复制工作流检查清单
- 添加了何时重新访问早期阶段的决策流程图
- 添加了带具体示例的全面 AskUserQuestion 工具指导
- 添加了"问题模式"章节，解释何时使用结构化与开放式问题
- 将关键原则重构为可扫描的表格

**Anthropic 最佳实践集成**
- 添加了 `skills/writing-skills/anthropic-best-practices.md` - 官方 Anthropic skill 编写指南
- 在 writing-skills SKILL.md 中引用以提供全面指导
- 提供渐进式披露、工作流和评估的模式

### 改进

**Skill 交叉引用清晰度**
- 所有 skill 引用现在使用明确的需求标记：
  - `**REQUIRED BACKGROUND:**` - 你必须理解的先决条件
  - `**REQUIRED SUB-SKILL:**` - 工作流中必须使用的 skills
  - `**Complementary skills:**` - 可选但有帮助的相关 skills
- 移除了旧路径格式（`skills/collaboration/X` → 只用 `X`）
- 更新了集成章节，包含分类关系（必需 vs 补充）
- 更新了带最佳实践的交叉引用文档

**与 Anthropic 最佳实践对齐**
- 修复了描述语法和语态（完全第三人称）
- 添加了用于扫描的快速参考表
- 添加了 Claude 可以复制和跟踪的工作流检查清单
- 适当使用流程图处理非显而易见的决策点
- 改进了可扫描的表格格式
- 所有 skills 都在 500 行建议以内

### Bug 修复

- **重新添加了缺失的命令重定向** - 恢复了在 v3.0 迁移中意外删除的 `commands/brainstorm.md` 和 `commands/write-plan.md`
- 修复了 `defense-in-depth` 名称不匹配（之前是 `Defense-in-Depth-Validation`）
- 修复了 `receiving-code-review` 名称不匹配（之前是 `Code-Review-Reception`）
- 修复了 `commands/brainstorm.md` 对正确 skill 名称的引用
- 移除了对不存在的相关 skills 的引用

### 文档

**writing-skills 改进**
- 更新了带明确需求标记的交叉引用指导
- 添加了对 Anthropic 官方最佳实践的引用
- 改进了显示正确 skill 引用格式的示例

## v3.0.1 (2025-10-16)

### 变更

我们现在使用 Anthropic 的第一方 skills 系统！

## v2.0.2 (2025-10-12)

### Bug 修复

- **修复了本地 skills 仓库领先于上游时的误报警告** - 初始化脚本在本地仓库有领先于上游的提交时错误地警告"上游有新 skills 可用"。逻辑现在正确区分三种 git 状态：本地落后（应更新）、本地领先（无警告）和已分叉（应警告）。

## v2.0.1 (2025-10-12)

### Bug 修复

- **修复了插件上下文中的 session-start hook 执行**（#8, PR #9）- hook 静默失败并显示"Plugin hook error"，阻止 skills 上下文加载。修复方式：
  - 当 BASH_SOURCE 在 Claude Code 执行上下文中未绑定时，使用 `${BASH_SOURCE[0]:-$0}` 回退
  - 添加 `|| true` 以在过滤状态标志时优雅处理空 grep 结果

---

# Superpowers v2.0.0 发布说明

## 概述

Superpowers v2.0 通过重大架构转变，使 skills 更易访问、更易维护，并更具社区驱动性。

核心变更是 **skills 仓库分离**：所有 skills、脚本和文档已从插件移至专用仓库（[obra/superpowers-skills](https://github.com/obra/superpowers-skills)）。这将 superpowers 从单体插件转变为管理 skills 仓库本地克隆的轻量级垫片。Skills 在会话启动时自动更新。用户通过标准 git 工作流 fork 并贡献改进。Skills 库独立于插件进行版本控制。

除基础设施外，此版本还添加了九个专注于问题解决、研究和架构的新 skills。我们以命令式语气和更清晰的结构重写了核心 **using-skills** 文档，使 Claude 更容易理解何时以及如何使用 skills。**find-skills** 现在输出可以直接粘贴到 Read 工具的路径，消除了 skills 发现工作流中的摩擦。

用户体验无缝操作：插件自动处理克隆、fork 和更新。贡献者发现新架构使改进和共享 skills 变得轻而易举。此版本为 skills 作为社区资源快速演进奠定了基础。

## 破坏性变更

### Skills 仓库分离

**最大的变更：** Skills 不再存在于插件中。它们已移至 [obra/superpowers-skills](https://github.com/obra/superpowers-skills) 的独立仓库。

**这对你意味着什么：**

- **首次安装：** 插件自动将 skills 克隆到 `~/.config/superpowers/skills/`
- **Fork：** 在设置过程中，如果安装了 `gh`，你将获得 fork skills 仓库的选项
- **更新：** Skills 在会话启动时自动更新（尽可能快进）
- **贡献：** 在分支上工作，本地提交，向上游提交 PR
- **不再有遮蔽：** 旧的两层系统（personal/core）被单仓库分支工作流替换

**迁移：**

如果你有现有安装：
1. 你的旧 `~/.config/superpowers/.git` 将备份到 `~/.config/superpowers/.git.bak`
2. 旧 skills 将备份到 `~/.config/superpowers/skills.bak`
3. obra/superpowers-skills 的新克隆将在 `~/.config/superpowers/skills/` 创建

### 已移除功能

- **个人 superpowers 覆盖系统** - 被 git 分支工作流替换
- **setup-personal-superpowers hook** - 被 initialize-skills.sh 替换

## 新功能

### Skills 仓库基础设施

**自动克隆与设置**（`lib/initialize-skills.sh`）
- 首次运行时克隆 obra/superpowers-skills
- 如果安装了 GitHub CLI，提供 fork 创建选项
- 正确设置 upstream/origin 远程
- 处理从旧安装的迁移

**自动更新**
- 每次会话启动时从跟踪远程获取
- 尽可能使用快进自动合并
- 需要手动同步时通知（分支已分叉）
- 使用 pulling-updates-from-skills-repository skill 进行手动同步

### 新 Skills

**问题解决 Skills**（`skills/problem-solving/`）
- **collision-zone-thinking** - 强制将不相关概念结合以产生涌现洞见
- **inversion-exercise** - 翻转假设以揭示隐藏约束
- **meta-pattern-recognition** - 发现跨领域的通用原则
- **scale-game** - 在极端情况下测试以揭示基本真理
- **simplification-cascades** - 找到能消除多个组件的洞见
- **when-stuck** - 分派到正确的问题解决技术

**研究 Skills**（`skills/research/`）
- **tracing-knowledge-lineages** - 理解想法如何随时间演变

**架构 Skills**（`skills/architecture/`）
- **preserving-productive-tensions** - 保持多种有效方法而非强制过早解决

### Skills 改进

**using-skills（原 getting-started）**
- 从 getting-started 重命名为 using-skills
- 以命令式语气完全重写（v4.0.0）
- 前置关键规则
- 为所有工作流添加了"为什么"解释
- 引用中始终包含 /SKILL.md 后缀
- 更清晰地区分刚性规则和灵活模式

**writing-skills**
- 交叉引用指导从 using-skills 移出
- 添加了 token 效率章节（字数目标）
- 改进了 CSO（Claude 搜索优化）指导

**sharing-skills**
- 更新为新的分支和 PR 工作流（v2.0.0）
- 移除了 personal/core 分割引用

**pulling-updates-from-skills-repository**（新增）
- 与上游同步的完整工作流
- 替换旧的"updating-skills" skill

### 工具改进

**find-skills**
- 现在输出带 /SKILL.md 后缀的完整路径
- 使路径可直接与 Read 工具一起使用
- 更新了帮助文本

**skill-run**
- 从 scripts/ 移至 skills/using-skills/
- 改进了文档

### 插件基础设施

**Session Start Hook**
- 现在从 skills 仓库位置加载
- 在会话启动时显示完整 skills 列表
- 打印 skills 位置信息
- 显示更新状态（成功更新 / 落后于上游）
- 将"skills 落后"警告移至输出末尾

**环境变量**
- `SUPERPOWERS_SKILLS_ROOT` 设置为 `~/.config/superpowers/skills`
- 在所有路径中一致使用

## Bug 修复

- 修复了 fork 时重复添加 upstream 远程的问题
- 修复了 find-skills 输出中的双重"skills/"前缀
- 从 session-start 中移除了过时的 setup-personal-superpowers 调用
- 修复了 hooks 和命令中的路径引用

## 文档

### README
- 更新为新的 skills 仓库架构
- 突出显示 superpowers-skills 仓库链接
- 更新了自动更新描述
- 修复了 skill 名称和引用
- 更新了 Meta skills 列表

### 测试文档
- 添加了全面的测试检查清单（`docs/TESTING-CHECKLIST.md`）
- 创建了用于测试的本地 marketplace 配置
- 记录了手动测试场景

## 技术细节

### 文件变更

**新增：**
- `lib/initialize-skills.sh` - Skills 仓库初始化和自动更新
- `docs/TESTING-CHECKLIST.md` - 手动测试场景
- `.claude-plugin/marketplace.json` - 本地测试配置

**已移除：**
- `skills/` 目录（82 个文件）- 现在在 obra/superpowers-skills
- `scripts/` 目录 - 现在在 obra/superpowers-skills/skills/using-skills/
- `hooks/setup-personal-superpowers.sh` - 已过时

**已修改：**
- `hooks/session-start.sh` - 从 ~/.config/superpowers/skills 使用 skills
- `commands/brainstorm.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/write-plan.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/execute-plan.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `README.md` - 针对新架构完全重写

### 提交历史

此版本包含：
- 20+ 个用于 skills 仓库分离的提交
- PR #1：受 Amplifier 启发的问题解决和研究 skills
- PR #2：个人 superpowers 覆盖系统（后来被替换）
- 多次 skill 改进和文档改进

## 升级说明

### 全新安装

```bash
# 在 Claude Code 中
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

插件自动处理所有事项。

### 从 v1.x 升级

1. **备份你的个人 skills**（如果有的话）：
   ```bash
   cp -r ~/.config/superpowers/skills ~/superpowers-skills-backup
   ```

2. **更新插件：**
   ```bash
   /plugin update superpowers
   ```

3. **下次会话启动时：**
   - 旧安装将自动备份
   - 新 skills 仓库将被克隆
   - 如果你有 GitHub CLI，你将获得 fork 的选项

4. **迁移个人 skills**（如果有的话）：
   - 在你的本地 skills 仓库中创建分支
   - 从备份复制你的个人 skills
   - 提交并推送到你的 fork
   - 考虑通过 PR 贡献回社区

## 下一步

### 对于用户

- 探索新的问题解决 skills
- 尝试基于分支的 skill 改进工作流
- 将 skills 贡献回社区

### 对于贡献者

- Skills 仓库现在位于 https://github.com/obra/superpowers-skills
- Fork → 分支 → PR 工作流
- 参见 skills/meta/writing-skills/SKILL.md 了解文档的 TDD 方法

## 已知问题

目前没有。

## 致谢

- 问题解决 skills 受 Amplifier 模式启发
- 社区贡献和反馈
- 对 skill 有效性的广泛测试和迭代

---

**Full Changelog:** https://github.com/obra/superpowers/compare/dd013f6...main
**Skills Repository:** https://github.com/obra/superpowers-skills
**Issues:** https://github.com/obra/superpowers/issues
