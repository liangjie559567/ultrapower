# Agent 层级参考

这是所有 agent 层级信息的唯一权威来源。所有 skill 文件和文档应引用此文件，而非重复其中的表格。

## 模型路由架构

ultrapower 使用 `model` 参数动态控制 agent 层级，而非使用后缀变体。所有 agent 都可通过指定 `model` 参数来调整其能力层级。

## Agent 默认模型配置

| Agent | 默认模型 | 可用层级 | 用途 |
| ------- | --------- | --------- | ------ |
| architect | opus | haiku/sonnet/opus | 系统设计、架构决策、深度分析 |
| executor | sonnet | haiku/sonnet/opus | 代码实现、重构、功能开发 |
| deep-executor | opus | haiku/sonnet/opus | 复杂自主目标导向任务 |
| explore | haiku | haiku/sonnet/opus | 代码库搜索、符号映射、文件发现 |
| debugger | sonnet | haiku/sonnet/opus | 根因分析、回归隔离、故障诊断 |
| analyst | opus | haiku/sonnet/opus | 需求澄清、验收标准、隐性约束 |
| planner | opus | haiku/sonnet/opus | 任务排序、执行计划、风险标记 |
| critic | opus | haiku/sonnet/opus | 计划/设计批判性挑战 |
| verifier | sonnet | haiku/sonnet/opus | 完成证据、声明验证、测试充分性 |
| style-reviewer | haiku | haiku/sonnet/opus | 格式、命名、惯用法、lint 规范 |
| quality-reviewer | sonnet | haiku/sonnet/opus | 逻辑缺陷、可维护性、反模式 |
| api-reviewer | sonnet | haiku/sonnet/opus | API 契约、版本控制、向后兼容性 |
| security-reviewer | sonnet | haiku/sonnet/opus | 漏洞、信任边界、认证/授权 |
| performance-reviewer | sonnet | haiku/sonnet/opus | 热点、复杂度、内存/延迟优化 |
| code-reviewer | opus | haiku/sonnet/opus | 跨关注点的综合审查 |
| designer | sonnet | haiku/sonnet/opus | UX/UI 架构、交互设计 |
| writer | haiku | haiku/sonnet/opus | 文档、迁移说明、用户指南 |
| test-engineer | sonnet | haiku/sonnet/opus | 测试策略、覆盖率、不稳定测试加固 |
| build-fixer | sonnet | haiku/sonnet/opus | 构建/工具链/类型失败 |
| qa-tester | sonnet | haiku/sonnet/opus | 交互式 CLI/服务运行时验证 |
| scientist | sonnet | haiku/sonnet/opus | 数据/统计分析 |
| document-specialist | sonnet | haiku/sonnet/opus | 外部文档和参考查找 |
| dependency-expert | sonnet | haiku/sonnet/opus | 外部 SDK/API/包评估 |
| vision | sonnet | haiku/sonnet/opus | 图片/截图/图表分析 |

## 模型路由指南

| 任务复杂度 | 推荐模型 | 使用时机 |
| ----------------- | ------ | ------------- |
| 简单 | haiku | 快速查询、简单修复、"X 返回什么？" |
| 标准 | sonnet | 功能实现、标准调试、"添加验证" |
| 复杂 | opus | 架构决策、复杂调试、"重构系统" |

## 按任务类型选择 Agent

| 任务类型 | 最佳 Agent | 推荐模型 |
| ----------- | ------------ | ------ |
| 快速代码查询 | explore | haiku |
| 查找文件/模式 | explore | haiku |
| 复杂架构搜索 | explore | opus |
| 简单代码修改 | executor | haiku |
| 功能实现 | executor | sonnet |
| 复杂重构 | executor | opus |
| 调试简单问题 | debugger | haiku |
| 调试复杂问题 | debugger | opus |
| UI 组件 | designer | sonnet |
| 复杂 UI 系统 | designer | opus |
| 编写文档/注释 | writer | haiku |
| 研究文档/API | document-specialist | sonnet |
| 分析图片/图表 | vision | sonnet |
| 战略规划 | planner | opus |
| 审查/评审计划 | critic | opus |
| 预规划分析 | analyst | opus |
| 交互式 CLI 测试 | qa-tester | sonnet |
| 安全审查 | security-reviewer | sonnet |
| 快速安全扫描 | security-reviewer | haiku |
| 修复构建错误 | build-fixer | sonnet |
| 简单构建修复 | build-fixer | haiku |
| TDD 工作流 | test-engineer | sonnet |
| 快速测试建议 | test-engineer | haiku |
| 代码审查 | code-reviewer | opus |
| 快速代码检查 | code-reviewer | haiku |
| 数据分析/统计 | scientist | sonnet |
| 快速数据检查 | scientist | haiku |
| 复杂 ML/假设验证 | scientist | opus |
| 查找符号引用 | explore | opus |
| 获取文件/工作区符号概览 | explore | haiku |
| 结构化代码模式搜索 | explore | sonnet |
| 结构化代码转换 | executor | opus |
| 全项目类型检查 | build-fixer | sonnet |
| 检查单文件错误 | executor | haiku |
| 复杂自主工作 | deep-executor | opus |
| 深度目标导向执行 | deep-executor | opus |

## 使用方法

委派任务时，始终显式指定模型：

```typescript
Task(subagent_type="ultrapower:executor",
     model="sonnet",
     prompt="Add input validation to the login flow")

Task(subagent_type="ultrapower:architect",
     model="opus",
     prompt="Design the payment processing system")

Task(subagent_type="ultrapower:explore",
     model="haiku",
     prompt="Find all references to the auth module")
```

为节省 token，在任务允许时优先使用较低层级：

* 简单查询和快速修复使用 `haiku`

* 标准实现工作使用 `sonnet`

* 复杂推理任务保留 `opus`

## MCP 工具与 Agent 能力

### 工具清单

| 工具 | 类别 | 用途 | 是否分配给 Agent？ |
| ------ | ---------- | --------- | --------------------- |
| `lsp_hover` | LSP | 获取代码位置的类型信息和文档 | 否（orchestrator 直接使用） |
| `lsp_goto_definition` | LSP | 跳转到符号定义处 | 否（orchestrator 直接使用） |
| `lsp_find_references` | LSP | 查找符号在代码库中的所有用法 | 是（仅 `explore`） |
| `lsp_document_symbols` | LSP | 获取文件中所有符号的概览 | 是 |
| `lsp_workspace_symbols` | LSP | 按名称在工作区中搜索符号 | 是 |
| `lsp_diagnostics` | LSP | 获取文件的错误、警告和提示 | 是 |
| `lsp_diagnostics_directory` | LSP | 项目级类型检查（tsc --noEmit 或 LSP） | 是 |
| `lsp_prepare_rename` | LSP | 检查符号是否可以重命名 | 否（orchestrator 直接使用） |
| `lsp_rename` | LSP | 在整个项目中重命名符号 | 否（orchestrator 直接使用） |
| `lsp_code_actions` | LSP | 获取可用的重构和快速修复 | 否（orchestrator 直接使用） |
| `lsp_code_action_resolve` | LSP | 获取代码操作的完整编辑详情 | 否（orchestrator 直接使用） |
| `lsp_servers` | LSP | 列出可用的语言服务器及安装状态 | 否（orchestrator 直接使用） |
| `ast_grep_search` | AST | 基于 AST 的模式化结构代码搜索 | 是 |
| `ast_grep_replace` | AST | 基于模式的结构化代码转换 | 是 |
| `python_repl` | Data | 用于数据分析和计算的持久化 Python REPL | 是 |

### Agent 工具矩阵（仅 MCP 工具）

| Agent | LSP Diagnostics | LSP Dir Diagnostics | LSP Symbols | LSP References | AST Search | AST Replace | Python REPL |
| ------- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `explore` | - | - | doc + workspace | yes | yes | - | - |
| `architect` | yes | yes | - | - | yes | - | - |
| `executor` | yes | yes | - | - | - | - | - |
| `deep-executor` | yes | yes | - | - | yes | yes | - |
| `build-fixer` | yes | yes | - | - | - | - | - |
| `test-engineer` | yes | - | - | - | - | - | - |
| `code-reviewer` | yes | - | - | - | yes | - | - |
| `qa-tester` | yes | - | - | - | - | - | - |
| `scientist` | - | - | - | - | - | - | yes |
| `debugger` | yes | yes | - | - | yes | - | - |
| `verifier` | yes | - | - | - | - | - | - |

### 未分配工具（Orchestrator 直接使用）

以下 7 个 MCP 工具未分配给任何 agent，需要时直接使用：

| 工具 | 直接使用时机 |
| ------ | --------------------- |
| `lsp_hover` | 对话中快速查询类型 |
| `lsp_goto_definition` | 分析过程中导航到符号定义 |
| `lsp_prepare_rename` | 在决定方案前检查重命名可行性 |
| `lsp_rename` | 安全重命名操作（返回编辑预览，不自动应用） |
| `lsp_code_actions` | 发现可用的重构操作 |
| `lsp_code_action_resolve` | 获取特定代码操作的详情 |
| `lsp_servers` | 检查语言服务器可用性 |

对于需要实现的复杂重命名或重构任务，委派给 `executor`（使用 `model="opus"`），它可以使用 `ast_grep_replace` 进行结构化转换。

### 工具选择指南

* **需要文件符号概览或工作区搜索？** 通过 `explore` 使用 `lsp_document_symbols`/`lsp_workspace_symbols`

* **需要查找符号的所有用法？** 通过 `explore` 使用 `lsp_find_references`

* **需要结构化代码模式？**（如"查找所有匹配 X 形状的函数"）通过 `explore`、`architect` 或 `code-reviewer` 使用 `ast_grep_search`

* **需要结构化代码转换？** 通过 `executor`（使用 `model="opus"`）使用 `ast_grep_replace`

* **需要全项目类型检查？** 通过 `architect`、`executor` 或 `build-fixer` 使用 `lsp_diagnostics_directory`

* **需要单文件错误检查？** 通过多个 agent 使用 `lsp_diagnostics`（参见矩阵）

* **需要数据分析/计算？** 通过 `scientist` 使用 `python_repl`

* **需要快速类型信息或定义查询？** 直接使用 `lsp_hover`/`lsp_goto_definition`（orchestrator 直接工具）
