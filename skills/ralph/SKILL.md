---
name: ralph
description: 自我循环直到任务完成并经过 architect 验证
---

[RALPH + ULTRAWORK - ITERATION {{ITERATION}}/{{MAX}}]

Your previous attempt did not output the completion promise. Continue working on the task.

<Purpose>
Ralph 是一个持久化循环，持续处理任务直到完全完成并经过 architect 验证。它将 ultrawork 的并行执行与 session 持久化、失败自动重试以及完成前强制验证结合在一起。
</Purpose>

<Use_When>
- 任务需要有保障的完成和验证（而非"尽力而为"）
- 用户说"ralph"、"don't stop"、"must complete"、"finish this"或"keep going until done"
- 工作可能跨越多次迭代，需要在重试间保持持久化
- 任务受益于并行执行，并在最后需要 architect 签字确认
</Use_When>

<Do_Not_Use_When>
- 用户想要从想法到代码的完整自主流水线——改用 `autopilot`
- 用户想在提交前探索或规划——改用 `plan` skill
- 用户想要快速一次性修复——直接委托给 executor agent
- 用户想手动控制完成——直接使用 `ultrawork`
</Do_Not_Use_When>

<Why_This_Exists>
复杂任务常常悄然失败：部分实现被宣告"完成"，测试被跳过，边界情况被遗忘。Ralph 通过循环直到工作真正完成来防止这种情况，在允许完成前要求新鲜的验证证据，并使用分级 architect 审查来确认质量。
</Why_This_Exists>

<Execution_Policy>
- 同时触发独立的 agent 调用——绝不顺序等待独立工作
- 对长时间操作（安装、构建、测试套件）使用 `run_in_background: true`
- 委托给 agent 时始终明确传递 `model` 参数
- 首次委托前阅读 `docs/shared/agent-tiers.md` 以选择正确的 agent 层级
- 交付完整实现：不缩减范围、不部分完成、不删除测试来让其通过
</Execution_Policy>

<Steps>
1. **审查进度**：检查 TODO 列表和任何先前迭代状态
2. **从上次中断处继续**：接手未完成的任务
3. **并行委托**：将任务路由到适当层级的专业 agent
   - 简单查找：LOW 层（Haiku）——"这个函数返回什么？"
   - 标准工作：MEDIUM 层（Sonnet）——"为此模块添加错误处理"
   - 复杂分析：HIGH 层（Opus）——"调试这个竞态条件"
4. **后台运行长时间操作**：构建、安装、测试套件使用 `run_in_background: true`
5. **用新鲜证据验证完成**：
   a. 确定哪个命令能证明任务已完成
   b. 运行验证（测试、构建、lint）
   c. 读取输出——确认实际通过
   d. 检查：零个待处理/进行中的 TODO 项
6. **Architect 验证**（分级）：
   - <5 个文件、<100 行且有完整测试：最低 STANDARD 层（architect-medium / Sonnet）
   - 标准变更：STANDARD 层（architect-medium / Sonnet）
   - >20 个文件或安全/架构变更：THOROUGH 层（architect / Opus）
   - Ralph 底线：即使是小变更也至少使用 STANDARD 层
7. **批准后**：运行 `/ultrapower:cancel` 干净退出并清理所有状态文件
8. **拒绝后**：修复提出的问题，然后在同一层级重新验证
</Steps>

<Tool_Usage>
- 首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具
- 当变更涉及安全敏感、架构性或复杂多系统集成时，使用 `ask_codex` 的 `agent_role: "architect"` 进行验证交叉检查
- 对于简单功能添加、经过充分测试的变更或时间紧迫的验证，跳过 Codex 咨询
- 如果 ToolSearch 未找到 MCP 工具或 Codex 不可用，仅使用 architect agent 验证继续——绝不阻塞在外部工具上
- 使用 `state_write` / `state_read` 在迭代间持久化 ralph 模式状态
</Tool_Usage>

<Examples>
<Good>
正确的并行委托：
```
Task(subagent_type="ultrapower:executor-low", model="haiku", prompt="Add type export for UserConfig")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="Implement the caching layer for API responses")
Task(subagent_type="ultrapower:executor-high", model="opus", prompt="Refactor auth module to support OAuth2 flow")
```
为什么好：三个独立任务同时触发，层级适当。
</Good>

<Good>
完成前的正确验证：
```
1. Run: npm test           → Output: "42 passed, 0 failed"
2. Run: npm run build      → Output: "Build succeeded"
3. Run: lsp_diagnostics    → Output: 0 errors
4. Spawn architect-medium  → Verdict: "APPROVED"
5. Run /ultrapower:cancel
```
为什么好：每步都有新鲜证据，architect 验证，然后干净退出。
</Good>

<Bad>
未经验证就声称完成：
"All the changes look good, the implementation should work correctly. Task complete."
为什么不好：使用了"should"和"look good"——没有新鲜的测试/构建输出，没有 architect 验证。
</Bad>

<Bad>
顺序执行独立任务：
```
Task(executor-low, "Add type export") → wait →
Task(executor, "Implement caching") → wait →
Task(executor-high, "Refactor auth")
```
为什么不好：这些是独立任务，应该并行运行，而非顺序执行。
</Bad>
</Examples>

<Escalation_And_Stop_Conditions>
- 当基本阻塞需要用户输入时（缺少凭证、需求不明确、外部服务宕机），停止并报告
- 当用户说"stop"、"cancel"或"abort"时停止——运行 `/ultrapower:cancel`
- 当 hook 系统发送"The boulder never stops"时继续工作——这意味着迭代继续
- 如果 architect 拒绝验证，修复问题并重新验证（不要停止）
- 如果同一问题在 3+ 次迭代中反复出现，将其报告为潜在的根本性问题
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 原始任务的所有需求均已满足（不缩减范围）
- [ ] 零个待处理或进行中的 TODO 项
- [ ] 新鲜测试运行输出显示所有测试通过
- [ ] 新鲜构建输出显示成功
- [ ] lsp_diagnostics 在受影响文件上显示 0 个错误
- [ ] Architect 验证通过（最低 STANDARD 层）
- [ ] 已运行 `/ultrapower:cancel` 进行干净的状态清理
</Final_Checklist>

<Advanced>
## PRD 模式（可选）

当用户提供 `--prd` 标志时，在开始 ralph 循环前初始化产品需求文档。

### 检测 PRD 模式
检查 `{{PROMPT}}` 是否包含 `--prd` 或 `--PRD`。

### PRD 工作流
1. 创建 `.omc/prd.json` 和 `.omc/progress.txt`
2. 解析任务（`--prd` 标志后的所有内容）
3. 分解为用户故事：

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name]",
  "description": "[Feature description]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Short title]",
      "description": "As a [user], I want to [action] so that [benefit].",
      "acceptanceCriteria": ["Criterion 1", "Typecheck passes"],
      "priority": 1,
      "passes": false
    }
  ]
}
```

4. 创建带时间戳和空模式部分的 `progress.txt`
5. 指导原则：适当大小的故事（每个一个 session）、可验证的标准、独立故事、优先级顺序（基础工作优先）
6. 使用用户故事作为任务列表进入正常 ralph 循环

### 示例
用户输入：`--prd build a todo app with React and TypeScript`
工作流：检测标志，提取任务，创建 `.omc/prd.json`，创建 `.omc/progress.txt`，开始 ralph 循环。

## 后台执行规则

**后台运行**（`run_in_background: true`）：
- 包安装（npm install、pip install、cargo build）
- 构建过程（make、项目构建命令）
- 测试套件
- Docker 操作（docker build、docker pull）

**前台运行**（阻塞）：
- 快速状态检查（git status、ls、pwd）
- 文件读取和编辑
- 简单命令
</Advanced>

Original task:
{{PROMPT}}
