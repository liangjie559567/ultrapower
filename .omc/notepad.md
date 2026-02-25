# Notepad
<!-- Auto-managed by OMC. Manual edits preserved in MANUAL section. -->

## Priority Context
<!-- ALWAYS loaded. Keep under 500 chars. Critical discoveries only. -->
项目：ultrapower v5.0.10 | 主分支：main
确认数量：49 agents | 70 skills | 35 hooks | 35 tools（8类）
已修复：所有文档 hooks 数量 37→35，agents 数量 44→49，tools 15→35
已完成：REFERENCE.md、README.md、ARCHITECTURE.md、AGENTS.md 数量一致性更新

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

