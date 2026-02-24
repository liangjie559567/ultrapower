---
name: ultrawork
description: 高吞吐量任务完成的并行执行引擎
---

<Purpose>
Ultrawork 是一个并行执行引擎，同时运行多个 agent 处理独立任务。它是一个组件，而非独立的持久化模式——它提供并行性和智能模型路由，但不提供持久化、验证循环或状态管理。
</Purpose>

<Use_When>
- 多个独立任务可以同时运行
- 用户说 "ulw"、"ultrawork" 或想要并行执行
- 需要同时将工作委托给多个 agent
- 任务受益于并发执行，但用户将自行管理完成
</Use_When>

<Do_Not_Use_When>
- 任务需要有验证的保证完成——改用 `ralph`（ralph 包含 ultrawork）
- 任务需要完整的自主 pipeline——改用 `autopilot`（autopilot 包含 ralph，ralph 包含 ultrawork）
- 只有一个顺序任务，没有并行机会——直接委托给 executor agent
- 用户需要 session 持久化以便恢复——使用 `ralph`，它在 ultrawork 之上添加持久化
</Do_Not_Use_When>

<Why_This_Exists>
当任务独立时，顺序执行会浪费时间。Ultrawork 能够同时启动多个 agent，并将每个 agent 路由到正确的模型层级，在控制 token 成本的同时减少总执行时间。它被设计为 ralph 和 autopilot 在其上分层的可组合组件。
</Why_This_Exists>

<Execution_Policy>
- 同时启动所有独立 agent 调用——绝不序列化独立工作
- 委托时始终显式传递 `model` 参数
- 首次委托前阅读 `docs/shared/agent-tiers.md` 获取 agent 选择指导
- 对超过约 30 秒的操作（安装、构建、测试）使用 `run_in_background: true`
- 在前台运行快速命令（git status、文件读取、简单检查）
</Execution_Policy>

<Steps>
1. **阅读 agent 参考**：加载 `docs/shared/agent-tiers.md` 进行层级选择
2. **按独立性分类任务**：识别哪些任务可以并行运行，哪些有依赖关系
3. **路由到正确层级**：
   - 简单查找/定义：LOW 层级（Haiku）
   - 标准实现：MEDIUM 层级（Sonnet）
   - 复杂分析/重构：HIGH 层级（Opus）
4. **同时启动独立任务**：一次性启动所有并行安全的任务
5. **顺序运行依赖任务**：在启动依赖工作前等待先决条件
6. **后台运行长时间操作**：构建、安装和测试套件使用 `run_in_background: true`
7. **所有任务完成后验证**（轻量级）：
   - 构建/类型检查通过
   - 受影响的测试通过
   - 未引入新错误
</Steps>

<Tool_Usage>
- 使用 `Task(subagent_type="ultrapower:executor-low", model="haiku", ...)` 处理简单变更
- 使用 `Task(subagent_type="ultrapower:executor", model="sonnet", ...)` 处理标准工作
- 使用 `Task(subagent_type="ultrapower:executor-high", model="opus", ...)` 处理复杂工作
- 对包安装、构建和测试套件使用 `run_in_background: true`
- 对快速状态检查和文件操作使用前台执行
</Tool_Usage>

<Examples>
<Good>
三个独立任务同时启动：
```
Task(subagent_type="ultrapower:executor-low", model="haiku", prompt="Add missing type export for Config interface")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="Implement the /api/users endpoint with validation")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="Add integration tests for the auth middleware")
```
好在哪里：独立任务在适当层级，全部同时启动。
</Good>

<Good>
正确使用后台执行：
```
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="npm install && npm run build", run_in_background=true)
Task(subagent_type="ultrapower:executor-low", model="haiku", prompt="Update the README with new API endpoints")
```
好在哪里：长时间构建在后台运行，同时短任务在前台运行。
</Good>

<Bad>
独立工作的顺序执行：
```
result1 = Task(executor-low, "Add type export")  # wait...
result2 = Task(executor, "Implement endpoint")     # wait...
result3 = Task(executor, "Add tests")              # wait...
```
差在哪里：这些任务是独立的。顺序运行浪费时间。
</Bad>

<Bad>
错误的层级选择：
```
Task(subagent_type="ultrapower:executor-high", model="opus", prompt="Add a missing semicolon")
```
差在哪里：Opus 对于微小修复来说是昂贵的过度杀伤。改用带 Haiku 的 executor-low。
</Bad>
</Examples>

<Escalation_And_Stop_Conditions>
- 当 ultrawork 直接调用（而非通过 ralph）时，仅应用轻量级验证——构建通过、测试通过、无新错误
- 对于完整持久化和全面 architect 验证，建议切换到 `ralph` 模式
- 如果任务在多次重试后持续失败，报告问题而非无限重试
- 当任务有不明确的依赖关系或冲突需求时，向用户升级
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] 所有并行任务已完成
- [ ] 构建/类型检查通过
- [ ] 受影响的测试通过
- [ ] 未引入新错误
</Final_Checklist>

<Advanced>
## 与其他模式的关系

```
ralph（持久化包装器）
 \-- 包含：ultrawork（本 skill）
     \-- 提供：仅并行执行

autopilot（自主执行）
 \-- 包含：ralph
     \-- 包含：ultrawork（本 skill）
```

Ultrawork 是并行性层。Ralph 添加持久化和验证。Autopilot 添加完整的生命周期 pipeline。
</Advanced>
