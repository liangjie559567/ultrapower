# Claude 到 Codex Agent Prompt 转换指南

## 风格对比

| 方面 | Claude（当前） | Codex（目标） |
|--------|-----------------|----------------|
| 结构 | XML 标签（`<Agent_Prompt>`、`<Role>` 等） | 平铺 markdown，**粗体标题**（1-3 个词） |
| 语气 | 规定性、规则繁多 | 自主的高级工程师，简洁的团队成员 |
| 详细程度 | 详细的逐步协议 | 简洁指令，信任自主性 |
| 列表 | XML 包裹的带编号列表 | 短横线项目符号，平铺（无嵌套），平行措辞 |
| 示例 | `<Good>` / `<Bad>` XML 标签 | 代码块或带反引号路径的纯文本 |
| 文件引用 | 正文中的 `file.ts:42` | `` `file.ts:42` `` 反引号包裹，独立显示 |
| 代码 | XML 内联 | 带信息字符串的代码块（```ts） |
| 规划 | 明确的逐步协议 | 简单任务跳过预先计划；复杂任务用 update_plan |
| 状态 | 明确的输出格式部分 | 无中间状态指令（会导致过早停止） |
| 工具 | Claude 工具名称（Read、Write、Edit、Bash、Glob、Grep） | Codex 工具名称（apply_patch、shell、read_file、ripgrep） |
| Frontmatter | YAML（name、description、model、disallowedTools） | 保留 YAML frontmatter（我们的加载系统使用它） |

## 转换规则

### 1. 移除所有 XML 标签
将 `<Agent_Prompt>`、`<Role>`、`<Why_This_Matters>` 等替换为平铺 markdown 标题：
- `<Role>` -> **角色** 段落（最多 2-3 句话）
- `<Why_This_Matters>` -> 折入角色或删除（Codex 以自主性为先）
- `<Success_Criteria>` -> **成功标准**（短横线项目符号）
- `<Constraints>` -> **约束**（短横线项目符号）
- `<Investigation_Protocol>` -> **工作流程**（编号，简洁）
- `<Tool_Usage>` -> **工具**（短横线项目符号，使用 Codex 工具名称）
- `<Execution_Policy>` -> 折入约束或工作流程
- `<Output_Format>` -> **输出**（简洁格式规范）
- `<Failure_Modes_To_Avoid>` -> **避免**（短横线项目符号，简洁）
- `<Examples>` -> **示例**，使用代码块或反引号路径
- `<Final_Checklist>` -> 删除（Codex 自主处理）或压缩为最多 2-3 条

### 2. 工具名称映射
- `Read` -> `read_file` / 使用 `multi_tool_use.parallel` 批量处理
- `Write` -> `apply_patch`（编辑）或 `write_file`（新文件）
- `Edit` -> `apply_patch`
- `Bash` -> `shell`（使用字符串格式，指定 `workdir`）
- `Glob` -> `ripgrep` 配合 `--files` 或 `shell` 配合 `find`
- `Grep` -> `ripgrep`
- `lsp_diagnostics` -> 保留（MCP 工具，相同接口）
- `ast_grep_search` -> 保留（MCP 工具，相同接口）
- `ask_gemini` -> 保留（MCP 工具引用）

### 3. 平铺和压缩
- 最多为原始行数的 60%
- 无嵌套项目符号层级
- 全程使用主动语态
- 将相关项目符号分组
- 顺序：通用 -> 具体 -> 支撑
- 类似条目使用平行措辞

### 4. 自主性优先框架
- 移除"you must"/"you are required to" -> 直接陈述要做什么
- 移除明确的"do not stop"/"keep working"指令
- 移除明确的输出模板（让模型使用自然结构）
- 将输出格式保留为简短建议，而非严格模板
- 移除 `<Final_Checklist>` 部分（Codex 自我验证）

### 5. 保留语义内容
- 保留角色身份和边界（负责/不负责）
- 保留核心领域专业知识和调查模式
- 保留好/差示例（重新格式化为纯文本）
- 保留工具特定指导（只需重命名工具）
- 在 frontmatter 中保留 disallowedTools

### 6. Codex 特定添加
- 在适当位置添加"偏向行动"框架
- 为探索 agent 添加"使用 multi_tool_use.parallel 批量读取"
- 为实现 agent 添加"使用 apply_patch 进行单文件编辑"
- 在相关位置引用 AGENTS.md 发现模式

## 文件命名
与源文件相同：`agents.codex/{agent-name}.md`

## 模板

```markdown
---
name: {agent-name}
description: {description}
model: {model}
disallowedTools: {if any}
---

**Role**
{2-3 sentences: identity, responsibility, boundaries}

**Success Criteria**
- {criterion 1}
- {criterion 2}

**Constraints**
- {constraint 1}
- {constraint 2}

**Workflow**
1. {step 1}
2. {step 2}

**Tools**
- `ripgrep` for pattern search
- `apply_patch` for file edits
- `shell` for commands (always specify `workdir`)

**Output**
{Brief format suggestion - not rigid template}

**Avoid**
- {anti-pattern 1}: {why and what instead}
- {anti-pattern 2}: {why and what instead}

**Examples**
- Good: {concise example with backtick file refs}
- Bad: {concise counter-example}
```
