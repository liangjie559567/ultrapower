---
name: analyze
description: 深度分析与调查
---

<Purpose>
Analyze 对架构、bug、性能问题和依赖关系进行深度调查。它将任务路由到 architect agent 或 Codex MCP，进行全面分析并返回有证据支撑的结构化结论。
</Purpose>

<Use_When>
- 用户说 "analyze"、"investigate"、"debug"、"why does" 或 "what's causing"
- 用户需要在修改前理解系统架构或行为
- 用户需要对 bug 或性能问题进行根因分析
- 用户需要对拟议变更进行依赖分析或影响评估
- 复杂问题需要读取多个文件并跨文件推理
</Use_When>

<Do_Not_Use_When>
- 用户需要修改代码 —— 改用 executor agent 或 `ralph`
- 用户需要包含验收标准的完整计划 —— 改用 `plan` skill
- 用户需要快速文件查找或符号搜索 —— 改用 `explore` agent
- 用户提出的简单事实性问题可从单个文件直接回答 —— 直接读取并回答
</Do_Not_Use_When>

<Why_This_Exists>
深度调查需要与快速查找或代码修改不同的方式。分析任务需要广泛的上下文收集、跨文件推理和结构化结论。将这些任务路由到 architect agent 或 Codex，可确保足够的深度，同时避免完整规划或执行工作流的开销。
</Why_This_Exists>

<Execution_Policy>
- 优先使用 Codex MCP 进行分析（更快、成本更低）
- Codex 不可用时回退到 architect Claude agent
- 始终向分析工具提供 context files 以支撑推理
- 返回结构化结论，而非原始观察
</Execution_Policy>

<Steps>
1. **确定分析类型**：架构、bug 调查、性能或依赖分析
2. **收集相关上下文**：读取或识别涉及的关键文件
3. **路由到分析器**：
   - 优先：`ask_codex` 配合 `agent_role: "architect"` 和相关 `context_files`
   - 回退：`Task(subagent_type="ultrapower:architect", model="opus", prompt="Analyze: ...")`
4. **返回结构化结论**：提供带有证据、文件引用和可操作建议的分析
</Steps>

<Tool_Usage>
- 首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具
- 使用 `ask_codex` 配合 `agent_role: "architect"` 作为首选分析路由
- 传入 `context_files` 包含所有相关源文件以支撑分析
- 当 ToolSearch 未找到 MCP 工具或 Codex 不可用时，使用 `Task(subagent_type="ultrapower:architect", model="opus", ...)` 作为回退
- 对于广泛分析，先使用 `explore` agent 识别相关文件，再路由到 architect
</Tool_Usage>

<Examples>
<Good>
用户："analyze why the WebSocket connections drop after 30 seconds"
操作：收集 WebSocket 相关文件，携带上下文路由到 architect，返回包含具体 file:line 引用和修复建议的根因分析。
好在哪里：调查目标明确，输出有证据支撑且结构化。
</Good>

<Good>
用户："investigate the dependency chain from src/api/routes.ts"
操作：使用 explore agent 映射 import 图，再路由到 architect 进行影响分析。
好在哪里：用 explore 收集事实，用 architect 进行推理。
</Good>

<Bad>
用户："analyze the auth module"
操作：返回 "The auth module handles authentication."
差在哪里：没有调查的浅层摘要。应检查模块结构、模式、潜在问题，并提供带文件引用的具体结论。
</Bad>

<Bad>
用户："fix the bug in the parser"
操作：运行 analysis skill。
差在哪里：这是修复请求，不是分析请求。应路由到 executor 或 ralph。
</Bad>
</Examples>

<Escalation_And_Stop_Conditions>
- 若分析发现问题需要修改代码，报告结论并建议使用 `ralph` 或 executor 进行修复
- 若分析范围过广（"analyze everything"），请用户缩小焦点
- 若 Codex 不可用且 architect agent 也失败，报告已收集的上下文并建议手动调查路径
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 分析针对具体问题或调查目标
- [ ] 结论在适用时引用具体文件和行号
- [ ] bug 调查中识别了根因（而非仅症状）
- [ ] 提供了可操作的建议
- [ ] 分析区分了已确认事实与假设
</Final_Checklist>

Task: {{ARGUMENTS}}
