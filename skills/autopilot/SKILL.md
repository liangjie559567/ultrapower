---
name: autopilot
description: 从想法到可运行代码的全自主执行
---

<Purpose>
Autopilot 接收简短的产品想法，自主处理完整生命周期：需求分析、技术设计、规划、并行实现、QA 循环和多视角验证。从 2-3 行描述生成经过验证的可运行代码。
</Purpose>

<Use_When>
- 用户希望从想法到可运行代码的端到端自主执行
- 用户说 "autopilot"、"auto pilot"、"autonomous"、"build me"、"create me"、"make me"、"full auto"、"handle it all" 或 "I want a/an..."
- 任务需要多个阶段：规划、编码、测试和验证
- 用户希望无需干预地执行，愿意让系统运行至完成
</Use_When>

<Do_Not_Use_When>
- 用户想探索选项或头脑风暴 —— 改用 `plan` skill
- 用户说 "just explain"、"draft only" 或 "what would you suggest" —— 以对话方式回应
- 用户需要单一的专注代码修改 —— 改用 `ralph` 或委托给 executor agent
- 用户想审查或评论现有计划 —— 改用 `plan --review`
- 任务是快速修复或小 bug —— 直接委托给 executor
</Do_Not_Use_When>

<Why_This_Exists>
大多数非平凡软件任务需要协调多个阶段：理解需求、设计方案、并行实现、测试和验证质量。Autopilot 自动编排所有这些阶段，用户只需描述需求即可获得可运行代码，无需管理每个步骤。
</Why_This_Exists>

<Execution_Policy>
- 每个阶段必须在下一阶段开始前完成
- 在可能的阶段内使用并行执行（阶段 2 和阶段 4）
- QA 循环最多重复 5 次；若同一错误持续出现 3 次，停止并报告根本问题
- 验证需要所有审查者批准；被拒绝的项目修复后重新验证
- 随时可用 `/ultrapower:cancel` 取消；进度保留以便恢复
</Execution_Policy>

<Steps>
1. **阶段 0 - 扩展**：将用户想法转化为详细规格说明
   - Analyst (Opus)：提取需求
   - Architect (Opus)：创建技术规格说明
   - 输出：`.omc/autopilot/spec.md`

2. **阶段 1 - 规划**：根据规格说明创建实现计划
   - Architect (Opus)：创建计划（直接模式，无需访谈）
   - Critic (Opus)：验证计划
   - 输出：`.omc/plans/autopilot-impl.md`

3. **阶段 2 - 执行**：使用 Ralph + Ultrawork 实现计划
   - Executor-low (Haiku)：简单任务
   - Executor (Sonnet)：标准任务
   - Executor-high (Opus)：复杂任务
   - 并行运行独立任务

4. **阶段 3 - QA**：循环直到所有测试通过（UltraQA 模式）
   - 构建、lint、测试、修复失败
   - 最多重复 5 次循环
   - 若同一错误重复 3 次则提前停止（表明存在根本性问题）

5. **阶段 4 - 验证**：并行多视角审查
   - Architect：功能完整性
   - Security-reviewer：漏洞检查
   - Code-reviewer：质量审查
   - 所有人必须批准；被拒绝时修复并重新验证

6. **阶段 5 - 清理**：成功完成后删除所有状态文件
   - 删除 `.omc/state/autopilot-state.json`、`ralph-state.json`、`ultrawork-state.json`、`ultraqa-state.json`
   - 运行 `/ultrapower:cancel` 干净退出
</Steps>

<Tool_Usage>
- 首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具
- 阶段 4 架构验证使用 `ask_codex` 配合 `agent_role: "architect"`
- 阶段 4 安全审查使用 `ask_codex` 配合 `agent_role: "security-reviewer"`
- 阶段 4 质量审查使用 `ask_codex` 配合 `agent_role: "code-reviewer"`
- Agent 先独立形成分析，再咨询 Codex 进行交叉验证
- 若 ToolSearch 未找到 MCP 工具或 Codex 不可用，继续执行 —— 永不阻塞于外部工具
</Tool_Usage>

<Examples>
<Good>
用户："autopilot A REST API for a bookstore inventory with CRUD operations using TypeScript"
好在哪里：领域明确（书店）、功能清晰（CRUD）、技术约束明确（TypeScript）。Autopilot 有足够上下文扩展为完整规格说明。
</Good>

<Good>
用户："build me a CLI tool that tracks daily habits with streak counting"
好在哪里：产品概念清晰，有具体功能。"build me" 触发词激活 autopilot。
</Good>

<Bad>
用户："fix the bug in the login page"
差在哪里：这是单一专注修复，不是多阶段项目。改用直接 executor 委托或 ralph。
</Bad>

<Bad>
用户："what are some good approaches for adding caching?"
差在哪里：这是探索/头脑风暴请求。以对话方式回应或使用 plan skill。
</Bad>
</Examples>

<Escalation_And_Stop_Conditions>
- 同一 QA 错误持续 3 个循环时停止并报告（需要人工介入的根本性问题）
- 验证在 3 轮重新验证后仍持续失败时停止并报告
- 用户说 "stop"、"cancel" 或 "abort" 时停止
- 若需求过于模糊导致扩展产生不清晰的规格说明，暂停并在继续前向用户寻求澄清
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 所有 5 个阶段完成（扩展、规划、执行、QA、验证）
- [ ] 阶段 4 所有验证者已批准
- [ ] 测试通过（以新鲜测试运行输出验证）
- [ ] 构建成功（以新鲜构建输出验证）
- [ ] 状态文件已清理
- [ ] 已向用户告知完成情况及所构建内容的摘要
</Final_Checklist>

<Advanced>
## 配置

`.claude/settings.json` 中的可选设置：

```json
{
  "omc": {
    "autopilot": {
      "maxIterations": 10,
      "maxQaCycles": 5,
      "maxValidationRounds": 3,
      "pauseAfterExpansion": false,
      "pauseAfterPlanning": false,
      "skipQa": false,
      "skipValidation": false
    }
  }
}
```

## 恢复

若 autopilot 被取消或失败，再次运行 `/ultrapower:autopilot` 从停止处恢复。

## 输入最佳实践

1. 明确领域 —— "bookstore" 而非 "store"
2. 提及关键功能 —— "with CRUD"、"with authentication"
3. 指定约束 —— "using TypeScript"、"with PostgreSQL"
4. 让它运行 —— 除非真正需要，避免中断

## 故障排除

**卡在某个阶段？** 检查 TODO 列表中的阻塞任务，查看 `.omc/autopilot-state.json`，或取消后恢复。

**QA 循环耗尽？** 同一错误出现 3 次表明存在根本性问题。检查错误模式；可能需要手动干预。

**验证持续失败？** 检查具体问题。需求可能过于模糊 —— 取消并提供更多细节。
</Advanced>
