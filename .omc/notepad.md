# Notepad
<!-- Auto-managed by OMC. Manual edits preserved in MANUAL section. -->

## Priority Context
<!-- ALWAYS loaded. Keep under 500 chars. Critical discoveries only. -->
项目：ultrapower v5.0.23 | 主分支：main
确认数量：49 agents | 70 skills | 35 hooks | 35 tools（8类）
最新发布：v5.0.23（2026-02-26）已推送 main + npm
修复：安全加固（assertValidMode截断）、测试边界用例、文档差异点D-10、ESM导入路径

## Working Memory
<!-- Session notes. Auto-pruned after 7 days. -->
### 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。
### 2026-02-26 04:50
路由决策: code-review → fix_issues | 置信度95% | 修复目标: C-01(截断错误消息) + H-01(修正测试数量文档) + H-02(补充安全边界测试) + M-02(补充D-10到audit-report)
### 2026-02-26 08:49
2026-02-26 ax-reflect: hooks MODULE_NOT_FOUND 修复完整交付
- 根因：npm postinstall 从 npm-cache 运行，Claude Code 在 postinstall 后才复制文件到缓存，templates/hooks/ 不在缓存中
- 修复：plugin-setup.mjs 添加 copyTemplatesToCache()，withFileTypes+isDirectory() 守卫，失败时 rmSync 清理空目录
- 提交：0571f3b（GREEN）+ c7aea72（code review fixes）推送到 main
- 测试：9117 passed，hooks-json-paths 4/4
- Action Items: 下次工作先 git checkout dev && git pull
### 2026-02-26 09:07
路由决策 [2026-02-26]: ax-analyze-error → 修复完成
- current_skill: ax-analyze-error
- stage: fix_applied
- 修复内容: settings.json 中 %USERPROFILE% 未展开导致 persistent-mode.mjs MODULE_NOT_FOUND
- 修复方案: 替换为硬编码绝对路径 C:/Users/ljyih/.claude/hooks/
- 影响文件: ~/.claude/settings.json (6个hook命令路径)
### 2026-02-26 11:47
【BUG FIX】ax-context init 无限循环（Opus 4.6）
根本原因：skills/ax-context/SKILL.md 的 init 命令只列文件名，无执行指令
修复：添加 Bash(mkdir) + Write() 调用 + 编号步骤
测试：src/skills/__tests__/ax-context-init.test.ts（2 tests，RED→GREEN 验证）
状态：已修复，9120 原有测试无回归
### 2026-02-26 13:24
路由决策 [2026-02-26]: ax-evolution(evolution_complete) → brainstorming。目标：规划 Phase 2 主动学习（分析 usage_metrics.json → 生成优化建议 → 更新 agent 提示词）。置信度 85%。


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。
### 2026-02-26 04:50
路由决策: code-review → fix_issues | 置信度95% | 修复目标: C-01(截断错误消息) + H-01(修正测试数量文档) + H-02(补充安全边界测试) + M-02(补充D-10到audit-report)
### 2026-02-26 08:49
2026-02-26 ax-reflect: hooks MODULE_NOT_FOUND 修复完整交付
- 根因：npm postinstall 从 npm-cache 运行，Claude Code 在 postinstall 后才复制文件到缓存，templates/hooks/ 不在缓存中
- 修复：plugin-setup.mjs 添加 copyTemplatesToCache()，withFileTypes+isDirectory() 守卫，失败时 rmSync 清理空目录
- 提交：0571f3b（GREEN）+ c7aea72（code review fixes）推送到 main
- 测试：9117 passed，hooks-json-paths 4/4
- Action Items: 下次工作先 git checkout dev && git pull
### 2026-02-26 09:07
路由决策 [2026-02-26]: ax-analyze-error → 修复完成
- current_skill: ax-analyze-error
- stage: fix_applied
- 修复内容: settings.json 中 %USERPROFILE% 未展开导致 persistent-mode.mjs MODULE_NOT_FOUND
- 修复方案: 替换为硬编码绝对路径 C:/Users/ljyih/.claude/hooks/
- 影响文件: ~/.claude/settings.json (6个hook命令路径)
### 2026-02-26 11:47
【BUG FIX】ax-context init 无限循环（Opus 4.6）
根本原因：skills/ax-context/SKILL.md 的 init 命令只列文件名，无执行指令
修复：添加 Bash(mkdir) + Write() 调用 + 编号步骤
测试：src/skills/__tests__/ax-context-init.test.ts（2 tests，RED→GREEN 验证）
状态：已修复，9120 原有测试无回归


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。
### 2026-02-26 04:50
路由决策: code-review → fix_issues | 置信度95% | 修复目标: C-01(截断错误消息) + H-01(修正测试数量文档) + H-02(补充安全边界测试) + M-02(补充D-10到audit-report)
### 2026-02-26 08:49
2026-02-26 ax-reflect: hooks MODULE_NOT_FOUND 修复完整交付
- 根因：npm postinstall 从 npm-cache 运行，Claude Code 在 postinstall 后才复制文件到缓存，templates/hooks/ 不在缓存中
- 修复：plugin-setup.mjs 添加 copyTemplatesToCache()，withFileTypes+isDirectory() 守卫，失败时 rmSync 清理空目录
- 提交：0571f3b（GREEN）+ c7aea72（code review fixes）推送到 main
- 测试：9117 passed，hooks-json-paths 4/4
- Action Items: 下次工作先 git checkout dev && git pull
### 2026-02-26 09:07
路由决策 [2026-02-26]: ax-analyze-error → 修复完成
- current_skill: ax-analyze-error
- stage: fix_applied
- 修复内容: settings.json 中 %USERPROFILE% 未展开导致 persistent-mode.mjs MODULE_NOT_FOUND
- 修复方案: 替换为硬编码绝对路径 C:/Users/ljyih/.claude/hooks/
- 影响文件: ~/.claude/settings.json (6个hook命令路径)


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。
### 2026-02-26 04:50
路由决策: code-review → fix_issues | 置信度95% | 修复目标: C-01(截断错误消息) + H-01(修正测试数量文档) + H-02(补充安全边界测试) + M-02(补充D-10到audit-report)
### 2026-02-26 08:49
2026-02-26 ax-reflect: hooks MODULE_NOT_FOUND 修复完整交付
- 根因：npm postinstall 从 npm-cache 运行，Claude Code 在 postinstall 后才复制文件到缓存，templates/hooks/ 不在缓存中
- 修复：plugin-setup.mjs 添加 copyTemplatesToCache()，withFileTypes+isDirectory() 守卫，失败时 rmSync 清理空目录
- 提交：0571f3b（GREEN）+ c7aea72（code review fixes）推送到 main
- 测试：9117 passed，hooks-json-paths 4/4
- Action Items: 下次工作先 git checkout dev && git pull


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。
### 2026-02-26 04:50
路由决策: code-review → fix_issues | 置信度95% | 修复目标: C-01(截断错误消息) + H-01(修正测试数量文档) + H-02(补充安全边界测试) + M-02(补充D-10到audit-report)


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。
### 2026-02-26 04:44
路由决策 [2026-02-26]: release → released。v5.0.22 tag 已推送到 remote，CHANGELOG 已更新，Axiom 全链路首次完整验证完成。系统处于完全 IDLE 终态。


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思
### 2026-02-26 04:41
路由决策 [2026-02-26]: ax-evolve → evolution_complete。学习队列 LQ-001/002/003 全部处理完毕，知识库 +3 条（k-029/030/031），模式库 +2 个（P-002/003），workflow_metrics 首次填充真实数据。系统完全 IDLE，全链路首次验证完成。


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过
### 2026-02-26 04:33
路由决策: finishing-a-development-branch → ax-reflect | stage: pr_merged | 置信度: 60% | 全链路规范体系交付完毕，执行会话反思


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks
### 2026-02-26 04:28
路由决策: ax-context(read) → finishing-a-development-branch | stage: all_tasks_complete | 置信度: 85% | 18/18 任务完成，9093 测试通过


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。
### 2026-02-25 02:23
hooks 数量已更新：37→35（移除非 hook 的 guards/team-pipeline/memory，新增 flow-tracer）。当前验证数量：49 agents | 70 skills | 35 hooks


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。
### 2026-02-25 01:46
### 数量最终确认（2026-02-25）
经过完整文档更新和测试验证，最终确认数量：
- agents: 44 个（src/agents/ + agents/*.md）
- skills: 70 个（skills/ 子目录）
- hooks: 36 个（src/hooks/*/index.ts）
- tools: 15 个（12 LSP + 2 AST + 1 Python REPL）

所有文档已更新完毕，测试结果：
- npm run build: 成功，嵌入 44 个 agent roles
- npm test --run: 386 passed, 1 failed (tokscale 网络超时，与文档无关)
- skills.test: 78/78 全部通过

注：Working Memory 中 2026-02-24 14:31 条目记录的 38/67/35 均为过时数字，以本条为准。


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口
### 2026-02-24 14:31
### 数量更正（2026-02-24）
实际数量（基于文件系统扫描）：
- agents/: 38 个 .md 文件（不含 templates/）
- skills/: 67 个子目录
- src/hooks/: 35 个 hook（36 个子目录减去 __tests__/）
- src/tools/: 15 个工具（12 LSP + 2 AST + 1 Python REPL）
- commands/: 67 个斜杠命令定义

注：Working Memory 中旧条目记录的 31/54/34 均为过时数字，以本条为准。


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion
### 2026-02-24 10:12
### 工具集与 Hook 系统

工具集（15 个）
  - LSP 工具（12 个）：hover, goto_definition, find_references, document_symbols, workspace_symbols, diagnostics, rename, code_actions 等
  - AST 工具（2 个）：ast_grep_search, ast_grep_replace
  - Python REPL（1 个）：数据分析

Hook 系统（34 个）
  - 执行模式 hooks：autopilot, ralph, ultrawork, ultrapilot, swarm
  - 功能 hooks：learner, recovery, rules-injector, think-mode

### 关键配置文件
- package.json - 依赖、npm 脚本、bin 入口
- tsconfig.json - TypeScript 配置（strict mode）
- .mcp.json - MCP 服务器配置
- .claude-plugin/plugin.json - Claude Code 插件清单
- CLAUDE.md - 用户编排说明（安装到项目）
- AGENTS.md - 项目架构和智能体目录

### 入口点
- src/index.ts - 主库入口，导出 createSisyphusSession()
- dist/cli/index.js - CLI 入口（bin: ultrapower, omc, omc-cli）
- dist/cli/analytics.js - 分析工具入口


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）
### 2026-02-24 10:12
### 主要功能模块

1. 智能体系统（31 个）
   - Build/Analysis: explore, analyst, planner, architect, debugger, executor, deep-executor, verifier
   - Review Lane: style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer
   - Domain Specialists: dependency-expert, test-engineer, designer, writer, qa-tester, scientist, git-master 等
   - Product Lane: product-manager, ux-researcher, information-architect, product-analyst

2. Skills 系统（54 个）
   - 执行模式：autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
   - 工作流：brainstorming, writing-plans, test-driven-development, systematic-debugging
   - 协作：code-review, git-master, verification-before-completion


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出
### 2026-02-24 10:12
### 主要目录结构
src/ - TypeScript 源代码（核心库）
  ├── agents/ - 31 个智能体定义 + 提示模板
  ├── skills/ - 54 个工作流 skill 实现
  ├── tools/ - LSP/AST/Python REPL 工具
  ├── hooks/ - 34 个事件驱动 hook
  ├── features/ - 核心功能（状态管理、上下文注入等）
  ├── mcp/ - MCP 服务器集成
  ├── cli/ - CLI 入口点
  ├── config/ - 配置加载
  └── verification/ - 验证系统

agents/ - 30 个智能体 Markdown 提示
skills/ - 54 个 skill 定义目录
commands/ - 54 个斜杠命令定义
scripts/ - 构建脚本、自动化工具
docs/ - 用户文档、参考指南
bridge/ - 预打包 MCP 服务器（分发用）


## 2026-02-24 10:12
### 2026-02-24 10:12
### 核心技术依赖
- `@anthropic-ai/claude-agent-sdk` - Claude Code 集成
- `@ast-grep/napi` - 结构化代码搜索/转换
- `@modelcontextprotocol/sdk` - MCP 服务器
- `vscode-languageserver-protocol` - LSP 类型
- `better-sqlite3` - Swarm 任务协调
- `zod` - 运行时 schema 验证
- `commander` - CLI 解析
- `chalk` - 终端样式输出


## 2026-02-24 10:12
## 项目结构探索完成

### 项目类型与技术栈
- **类型**：多智能体编排框架 + Claude Code 插件
- **语言**：TypeScript (ES2022, strict mode)
- **运行时**：Node.js ≥20.0.0
- **包管理**：npm (package.json v5.0.2)
- **构建**：TypeScript → dist/ (tsc + esbuild)
- **测试**：Vitest + coverage
- **代码质量**：ESLint + Prettier


## MANUAL
<!-- User content. Never auto-pruned. -->

