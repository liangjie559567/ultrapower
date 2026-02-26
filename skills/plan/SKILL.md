---
name: plan
description: 通过可选访谈工作流进行战略规划
---

<Purpose>
Plan 通过智能交互创建全面、可执行的工作计划。它自动检测是否需要访谈用户（宽泛请求）或直接规划（详细请求），并支持共识模式（迭代 Planner/Architect/Critic 循环）和审查模式（Critic 对现有计划的评估）。
</Purpose>

<Use_When>
- 用户想在实施前规划——"plan this"、"plan the"、"let's plan"
- 用户想对模糊想法进行结构化需求收集
- 用户想审查现有计划——"review this plan"、`--review`
- 用户想对计划进行多视角共识——`--consensus`、"ralplan"
- 任务宽泛或模糊，需要在编写代码前确定范围
</Use_When>

<Do_Not_Use_When>
- 用户想要自主端到端执行——改用 `autopilot`
- 用户想立即开始编码且任务明确——改用 `ralph` 或委托给 executor
- 用户提出可以直接回答的简单问题——直接回答即可
- 任务是范围明显的单一修复——跳过规划，直接执行
</Do_Not_Use_When>

<Why_This_Exists>
在不理解需求的情况下直接编码会导致返工、范围蔓延和遗漏边界情况。Plan 提供结构化的需求收集、专家分析和质量把关的计划，使执行从坚实的基础开始。共识模式为高风险项目增加了多视角验证。
</Why_This_Exists>

<Execution_Policy>
- 根据请求的具体程度自动检测访谈模式与直接模式
- 访谈期间每次只问一个问题——绝不批量提问
- 在询问用户之前，先通过 `explore` agent 收集代码库事实
- 计划必须满足质量标准：80%+ 的声明引用文件/行号，90%+ 的标准可测试
- 共识模式在进入实施前需要用户明确批准
</Execution_Policy>

<Steps>

### 模式选择

| 模式 | 触发条件 | 行为 |
|------|---------|----------|
| 访谈 | 宽泛请求的默认模式 | 交互式需求收集 |
| 直接 | `--direct` 或详细请求 | 跳过访谈，直接生成计划 |
| 共识 | `--consensus`、"ralplan" | Planner -> Architect -> Critic 循环直至达成一致 |
| 审查 | `--review`、"review this plan" | Critic 对现有计划的评估 |

### Interview Mode（访谈模式，宽泛/模糊请求）

1. **Classify the request**：宽泛（动词模糊、无具体文件、涉及 3+ 个领域）触发访谈模式
2. **Ask one focused question**，使用 `AskUserQuestion` 询问偏好、范围和约束
3. **Gather codebase facts first**：在问"你的代码使用什么模式？"之前，先派遣 `explore` agent 查找，再提出有针对性的后续问题
4. **基于答案深入**：每个问题基于上一个答案
5. **咨询 Analyst**（Opus）了解隐藏需求、边界情况和风险
6. **当用户表示准备好时创建计划**："create the plan"、"I'm ready"、"make it a work plan"

### Direct Mode（直接模式，详细请求）

1. **Quick Analysis**：可选的简短 Analyst 咨询
2. **Create plan**：立即生成全面的工作计划
3. **审查**（可选）：如有需要，进行 Critic 审查

### Consensus Mode（`--consensus` / "ralplan"）

1. **Planner** creates initial plan
2. **User feedback**：**MUST** use `AskUserQuestion` to present the draft plan, with options:
   - **Proceed to review** — send to Architect and Critic for evaluation
   - **Request changes** — return to step 1 with user feedback
   - **Skip review** — go directly to final approval (step 7)
3. **Architect** reviews architectural soundness（优先使用 `ask_codex` 的 `architect` 角色）
4. **Critic** evaluates against quality standards（优先使用 `ask_codex` 的 `critic` 角色）
5. **重新审查循环**（最多 5 次迭代）：如果 Critic 拒绝，执行此闭合循环：
   a. 收集 Architect + Critic 的所有拒绝反馈
   b. 将反馈传递给 Planner 生成修订计划
   c. **返回步骤 3** — Architect 审查修订计划
   d. **返回步骤 4** — Critic 评估修订计划
   e. 重复直到 Critic 批准或达到最多 5 次迭代
   f. 如果达到最大迭代次数仍未获批准，通过 `AskUserQuestion` 向用户展示最佳版本，并注明未达成专家共识
6. **应用改进**：当审查者批准并提出改进建议时，在继续之前将所有接受的改进合并到计划文件中：
   a. 收集 Architect 和 Critic 响应中的所有改进建议
   b. 去重并分类建议
   c. 用接受的改进更新 `.omc/plans/` 中的计划文件
   d. 在计划末尾的简短变更日志部分记录应用了哪些改进
7. Critic 批准后（已应用改进）：**必须**使用 `AskUserQuestion` 展示计划，提供以下选项：
   - **批准并执行** — 通过 ralph+ultrawork 进入实施
   - **清除上下文并实施** — 先压缩上下文窗口（当规划后上下文较大时推荐），然后通过 ralph 使用保存的计划文件开始新的实施
   - **请求修改** — 结合用户反馈返回步骤 1
   - **拒绝** — 完全丢弃计划
8. 用户通过结构化的 `AskUserQuestion` UI 选择（绝不用纯文本请求批准）
9. 用户批准后：
   - **批准并执行**：**MUST** invoke `Skill("ultrapower:ralph")` with the approved plan path from `.omc/plans/`. Do NOT implement directly. Do not edit source files in the planning agent. ralph skill handles execution via ultrawork parallel agents.
   - **清除上下文并实施**：先调用 `Skill("compact")` 压缩上下文窗口（减少规划期间积累的 token 使用），然后调用 `Skill("ultrapower:ralph")`，传入 `.omc/plans/` 中的计划路径。当规划会话后上下文窗口已满 50%+ 时，推荐此路径。

### Review Mode（`--review`）

1. **Read plan file** from `.omc/plans/`
2. **Evaluate via Critic**（优先使用 `ask_codex` 的 `critic` 角色）
3. 返回裁决：APPROVED、REVISE（附具体反馈）或 REJECT（需要重新规划）

### 计划输出格式

每个计划包含：
- 需求摘要
- 验收标准（可测试）
- 实施步骤（附文件引用）
- 风险和缓解措施
- 验证步骤

计划保存到 `.omc/plans/`。草稿保存到 `.omc/drafts/`。
</Steps>

<Tool_Usage>
- 首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具
- 使用 `AskUserQuestion` 提问偏好问题（范围、优先级、时间线、风险承受度）——提供可点击的 UI
- 使用纯文本提问需要具体值的问题（端口号、名称、后续澄清）
- 使用 `explore` agent（Haiku，30s 超时）在询问用户之前收集代码库事实
- 使用 `ask_codex` 的 `agent_role: "planner"` 对大范围计划进行规划验证
- 使用 `ask_codex` 的 `agent_role: "analyst"` 进行需求分析
- 使用 `ask_codex` 的 `agent_role: "critic"` 在共识和审查模式中进行计划审查
- 如果 ToolSearch 未找到 MCP 工具或 Codex 不可用，回退到等效的 Claude agent——绝不阻塞在外部工具上
- 在共识模式中，**必须**使用 `AskUserQuestion` 进行用户反馈步骤（步骤 2）和最终批准步骤（步骤 7）——绝不用纯文本请求批准
- 在共识模式中，用户批准后**必须**调用 `Skill("ultrapower:ralph")` 执行（步骤 9）——绝不在规划 agent 中直接实施
- 当用户在步骤 7 选择"清除上下文并实施"时：先调用 `Skill("compact")` 压缩积累的规划上下文，然后立即调用 `Skill("ultrapower:ralph")`，传入计划路径——compact 步骤对于在实施循环开始前释放上下文至关重要
</Tool_Usage>

<Examples>
<Good>
自适应访谈（先收集事实再提问）：
```
Planner: [派遣 explore agent："find authentication implementation"]
Planner: [收到："Auth is in src/auth/ using JWT with passport.js"]
Planner: "我看到你在 src/auth/ 中使用 JWT 认证和 passport.js。
         对于这个新功能，我们应该扩展现有的 auth 还是添加单独的 auth 流程？"
```
为什么好：先自行回答代码库问题，再提出有针对性的偏好问题。
</Good>

<Good>
每次只问一个问题：
```
Q1: "主要目标是什么？"
A1: "提升性能"
Q2: "对于性能，延迟和吞吐量哪个更重要？"
A2: "延迟"
Q3: "对于延迟，我们优化 p50 还是 p99？"
```
为什么好：每个问题基于上一个答案。聚焦且递进。
</Good>

<Bad>
询问可以自己查找的事情：
```
Planner: "认证在你的代码库中实现在哪里？"
User: "呃，我想是在 src/auth 里？"
```
为什么不好：planner 应该派遣 explore agent 查找，而不是问用户。
</Bad>

<Bad>
批量提问：
```
"范围是什么？时间线呢？受众是谁？"
```
为什么不好：一次三个问题导致答案肤浅。每次只问一个。
</Bad>
</Examples>

<Escalation_And_Stop_Conditions>
- 当需求足够清晰可以规划时停止访谈——不要过度访谈
- 在共识模式中，经过 5 次 Planner/Architect/Critic 迭代后停止，展示最佳版本
- 共识模式在任何实施开始前需要用户明确批准
- 如果用户说"just do it"或"skip planning"，**必须**调用 `Skill("ultrapower:ralph")` 切换到执行模式。不要在规划 agent 中直接实施。
- 当存在需要业务决策的不可调和权衡时，上报给用户
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 计划有可测试的验收标准（90%+ 具体）
- [ ] 计划在适用处引用具体文件/行号（80%+ 声明）
- [ ] 所有风险都已识别缓解措施
- [ ] 没有没有指标的模糊术语（"fast" -> "p99 < 200ms"）
- [ ] 计划已保存到 `.omc/plans/`
- [ ] 在共识模式中：用户在任何执行前明确批准
</Final_Checklist>

<Advanced>
## 设计选项展示

在访谈中展示设计选择时，分块进行：

1. **概述**（2-3 句话）
2. **选项 A** 及权衡
3. [等待用户反应]
4. **选项 B** 及权衡
5. [等待用户反应]
6. **建议**（仅在讨论完选项后）

每个选项的格式：
```
### 选项 A：[名称]
**方法：** [1 句话]
**优点：** [要点]
**缺点：** [要点]

你对这个方法有什么看法？
```

## 问题分类

在提出任何访谈问题之前，先对其分类：

| 类型 | 示例 | 行动 |
|------|----------|--------|
| 代码库事实 | "存在什么模式？"、"X 在哪里？" | 先 Explore，不问用户 |
| 用户偏好 | "优先级？"、"时间线？" | 通过 AskUserQuestion 询问用户 |
| 范围决策 | "包含功能 Y？" | 询问用户 |
| 需求 | "性能约束？" | 询问用户 |

## 审查质量标准

| 标准 | 要求 |
|-----------|----------|
| 清晰度 | 80%+ 声明引用文件/行号 |
| 可测试性 | 90%+ 标准具体 |
| 验证 | 所有文件引用存在 |
| 具体性 | 无模糊术语 |

## 废弃通知

独立的 `/planner`、`/ralplan` 和 `/review` skill 已合并到 `/plan`。所有工作流（访谈、直接、共识、审查）均可通过 `/plan` 使用。
</Advanced>
