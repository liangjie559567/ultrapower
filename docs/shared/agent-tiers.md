# Agent 层级参考

这是所有 agent 层级信息的唯一权威来源。所有 skill 文件和文档应引用此文件，而非重复其中的表格。

## 层级矩阵

| 领域 | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **分析** | architect-low | architect-medium | architect |
| **执行** | executor-low | executor | executor-high |
| **深度工作** | - | - | deep-executor |
| **搜索** | explore | - | explore-high |
| **研究** | - | document-specialist | - |
| **前端** | designer-low | designer | designer-high |
| **文档** | writer | - | - |
| **视觉** | - | vision | - |
| **规划** | - | - | planner |
| **评审** | - | - | critic |
| **预规划** | - | - | analyst |
| **测试** | - | qa-tester | - |
| **安全** | security-reviewer-low | - | security-reviewer |
| **构建** | - | build-fixer | - |
| **TDD** | tdd-guide-low | tdd-guide | - |
| **代码审查** | - | - | code-reviewer |
| **数据科学** | - | scientist | scientist-high |

## 模型路由指南

| 任务复杂度 | 层级 | 模型 | 使用时机 |
|-----------------|------|-------|-------------|
| 简单 | LOW | haiku | 快速查询、简单修复、"X 返回什么？" |
| 标准 | MEDIUM | sonnet | 功能实现、标准调试、"添加验证" |
| 复杂 | HIGH | opus | 架构决策、复杂调试、"重构系统" |

## 按任务类型选择 Agent

| 任务类型 | 最佳 Agent | 层级 |
|-----------|------------|------|
| 快速代码查询 | explore | LOW |
| 查找文件/模式 | explore | LOW |
| 复杂架构搜索 | explore-high | HIGH |
| 简单代码修改 | executor-low | LOW |
| 功能实现 | executor | MEDIUM |
| 复杂重构 | executor-high | HIGH |
| 调试简单问题 | architect-low | LOW |
| 调试复杂问题 | architect | HIGH |
| UI 组件 | designer | MEDIUM |
| 复杂 UI 系统 | designer-high | HIGH |
| 编写文档/注释 | writer | LOW |
| 研究文档/API | document-specialist | MEDIUM |
| 分析图片/图表 | vision | MEDIUM |
| 战略规划 | planner | HIGH |
| 审查/评审计划 | critic | HIGH |
| 预规划分析 | analyst | HIGH |
| 交互式 CLI 测试 | qa-tester | MEDIUM |
| 安全审查 | security-reviewer | HIGH |
| 快速安全扫描 | security-reviewer-low | LOW |
| 修复构建错误 | build-fixer | MEDIUM |
| 简单构建修复 | build-fixer (model=haiku) | LOW |
| TDD 工作流 | tdd-guide | MEDIUM |
| 快速测试建议 | tdd-guide-low | LOW |
| 代码审查 | code-reviewer | HIGH |
| 快速代码检查 | code-reviewer (model=haiku) | LOW |
| 数据分析/统计 | scientist | MEDIUM |
| 快速数据检查 | scientist (model=haiku) | LOW |
| 复杂 ML/假设验证 | scientist-high | HIGH |
| 查找符号引用 | explore-high | HIGH |
| 获取文件/工作区符号概览 | explore | LOW |
| 结构化代码模式搜索 | explore | LOW |
| 结构化代码转换 | executor-high | HIGH |
| 全项目类型检查 | build-fixer | MEDIUM |
| 检查单文件错误 | executor-low | LOW |
| 数据分析/计算 | scientist | MEDIUM |
| 复杂自主工作 | deep-executor | HIGH |
| 深度目标导向执行 | deep-executor | HIGH |

## 使用方法

委派任务时，始终显式指定模型：

```
Task(subagent_type="ultrapower:executor",
     model="sonnet",
     prompt="...")
```

为节省 token，在任务允许时优先使用较低层级：
- 简单查询和快速修复使用 `haiku`
- 标准实现工作使用 `sonnet`
- 复杂推理任务保留 `opus`

## MCP 工具与 Agent 能力

### 工具清单

| 工具 | 类别 | 用途 | 是否分配给 Agent？ |
|------|----------|---------|---------------------|
| `lsp_hover` | LSP | 获取代码位置的类型信息和文档 | 否（orchestrator 直接使用） |
| `lsp_goto_definition` | LSP | 跳转到符号定义处 | 否（orchestrator 直接使用） |
| `lsp_find_references` | LSP | 查找符号在代码库中的所有用法 | 是（仅 `explore-high`） |
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
| `ast_grep_replace` | AST | 基于模式的结构化代码转换 | 是（仅 `executor-high`） |
| `python_repl` | Data | 用于数据分析和计算的持久化 Python REPL | 是 |

### Agent 工具矩阵（仅 MCP 工具）

| Agent | LSP Diagnostics | LSP Dir Diagnostics | LSP Symbols | LSP References | AST Search | AST Replace | Python REPL |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `explore` | - | - | doc + workspace | - | yes | - | - |
| `explore-high` | - | - | doc + workspace | yes | yes | - | - |
| `architect-low` | yes | - | - | - | - | - | - |
| `architect-medium` | yes | yes | - | - | yes | - | - |
| `architect` | yes | yes | - | - | yes | - | - |
| `executor-low` | yes | - | - | - | - | - | - |
| `executor` | yes | yes | - | - | - | - | - |
| `executor-high` | yes | yes | - | - | yes | yes | - |
| `deep-executor` | yes | yes | - | - | yes | yes | - |
| `build-fixer` | yes | yes | - | - | - | - | - |
| `tdd-guide` | yes | - | - | - | - | - | - |
| `tdd-guide-low` | yes | - | - | - | - | - | - |
| `code-reviewer` | yes | - | - | - | yes | - | - |
| `qa-tester` | yes | - | - | - | - | - | - |
| `scientist` | - | - | - | - | - | - | yes |
| `scientist-high` | - | - | - | - | - | - | yes |

### 未分配工具（Orchestrator 直接使用）

以下 7 个 MCP 工具未分配给任何 agent，需要时直接使用：

| 工具 | 直接使用时机 |
|------|---------------------|
| `lsp_hover` | 对话中快速查询类型 |
| `lsp_goto_definition` | 分析过程中导航到符号定义 |
| `lsp_prepare_rename` | 在决定方案前检查重命名可行性 |
| `lsp_rename` | 安全重命名操作（返回编辑预览，不自动应用） |
| `lsp_code_actions` | 发现可用的重构操作 |
| `lsp_code_action_resolve` | 获取特定代码操作的详情 |
| `lsp_servers` | 检查语言服务器可用性 |

对于需要实现的复杂重命名或重构任务，委派给 `executor-high`，它可以使用 `ast_grep_replace` 进行结构化转换。

### 工具选择指南

- **需要文件符号概览或工作区搜索？** 通过 `explore` 或 `explore-high` 使用 `lsp_document_symbols`/`lsp_workspace_symbols`
- **需要查找符号的所有用法？** 通过 `explore-high` 使用 `lsp_find_references`（唯一拥有此工具的 agent）
- **需要结构化代码模式？**（如"查找所有匹配 X 形状的函数"）通过 `explore` 系列、`architect`/`architect-medium` 或 `code-reviewer` 使用 `ast_grep_search`
- **需要结构化代码转换？** 通过 `executor-high` 使用 `ast_grep_replace`（唯一拥有此工具的 agent）
- **需要全项目类型检查？** 通过 `architect`/`architect-medium`、`executor`/`executor-high` 或 `build-fixer` 使用 `lsp_diagnostics_directory`
- **需要单文件错误检查？** 通过多个 agent 使用 `lsp_diagnostics`（参见矩阵）
- **需要数据分析/计算？** 通过 `scientist` 或 `scientist-high` 使用 `python_repl`
- **需要快速类型信息或定义查询？** 直接使用 `lsp_hover`/`lsp_goto_definition`（orchestrator 直接工具）
