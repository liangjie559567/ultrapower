# Domain Expert Review: ultrapower 全链路规范体系

> 评审人：Domain Expert (领域专家)
> 评审日期：2026-02-26
> PRD 版本：Draft v1
> 项目版本：ultrapower v5.0.21
> 评审依据：基于实际源码分析（src/hooks/、src/agents/、src/lib/）

---

## 总体评分：6 / 10

PRD 方向正确，但对实际运行时行为的描述存在多处与代码不符的情况，且遗漏了若干已在代码中存在的关键复杂性。规范若基于这份 PRD 编写，将产生"规范与实现不一致"的新问题。

---

## 1. Logic Validation (逻辑验证)

### 1.1 Hook 执行顺序规范

**状态：Adjustment Needed（需要调整）**

PRD 将 Hook 分为 PreToolUse / PostToolUse / Stop 三类，但实际代码中的 Hook 类型远不止三类。

根据 `src/hooks/bridge.ts` 中的 `HookType` 定义，实际存在以下类型：

```typescript
type HookType =
  | "keyword-detector"      // UserPromptSubmit 阶段
  | "stop-continuation"     // Stop 阶段（已简化为软执行）
  | "ralph"                 // Stop 阶段（ralph 循环）
  | "persistent-mode"       // Stop 阶段（统一持久化模式）
  | "session-start"
  | "session-end"
  | "pre-tool-use"
  | "post-tool-use"
  | "autopilot"
  | "subagent-start"        // SubagentStart 事件
  | "subagent-stop"         // SubagentStop 事件
  | "pre-compact"
  | "setup-init"
  | "setup-maintenance"
  | "permission-request"
```

PRD 的三分类遗漏了：SubagentStart/Stop、PreCompact、PermissionRequest、SessionEnd 等关键 hook 类型。这些 hook 在实际运行时承担了重要职责（agent 生命周期追踪、权限自动审批、压缩前状态保存）。

**关键发现**：Stop 阶段实际上有三个独立 hook 竞争处理权，优先级为：
`Ralph > Ultrawork > Todo-Continuation`（见 `src/hooks/persistent-mode/index.ts` 第 11 行注释）。这个优先级规则是规范中必须明确的核心内容，PRD 完全未提及。

### 1.2 状态文件读写规范（并发保护）

**状态：Partially Pass（部分通过）**

PRD 提到"并发保护"，实际代码中已有实现，但实现细节比 PRD 描述的更复杂，规范需要准确反映这些细节。

已实现的并发保护机制（`src/lib/atomic-write.ts`）：
- 使用 `temp file + atomic rename` 模式（`wx` 标志确保独占创建）
- 写入前 `fsync` 确保数据落盘
- rename 后尝试目录级 `fsync`（Windows 上可能失败，代码已处理）
- 同步版本（`atomicWriteJsonSync`）和异步版本（`atomicWriteJson`）均已实现

**已知问题的根因**（Race Condition，2026-02-12）：
subagent-tracker 的并发写入问题实际上已有专门的缓解机制（`src/hooks/subagent-tracker/index.ts`）：
- `pendingWrites` Map 实现写入防抖（100ms debounce）
- `flushInProgress` Set 防止重复并发 flush
- `mergeTrackerStates` 函数实现确定性状态合并（Math.max 计数器 + 时间戳仲裁）

但规范中需要明确：**这套机制只保护 subagent-tracking.json，其他状态文件（team-state.json、ralph-state.json 等）使用的是 atomicWriteJsonSync，没有 debounce 层**。这是一个不一致性，规范应该统一说明各类状态文件的保护级别差异。

### 1.3 Agent 生命周期规范

**状态：Adjustment Needed（需要调整）**

PRD 描述的 `spawn → shutdown` 状态机过于简化。实际代码中 agent 生命周期有以下状态：

```
running → completed | failed
```

但 `SubagentStopInput` 接口中有一个重要注释（`src/hooks/subagent-tracker/index.ts` 第 102 行）：

```typescript
/** @deprecated The SDK does not provide a success field. Use inferred status instead. */
success?: boolean;
```

这意味着：**Claude Code SDK 不提供 agent 是否成功完成的直接信号**，当前实现依赖推断（inferred status）。规范必须明确这个限制，否则基于规范的实现者会假设可以直接读取成功/失败状态。

**遗漏的边界情况**：
1. Agent 超时（stale threshold = 5分钟，`STALE_THRESHOLD_MS = 5 * 60 * 1000`）
2. Agent 孤儿状态（父 session 结束但 agent 仍在运行）
3. Agent 成本超限（`COST_LIMIT_USD = 1.0`）触发的强制终止
4. 死锁检测（`DEADLOCK_CHECK_THRESHOLD = 3`）

这四种边界情况在代码中均有处理逻辑，但 PRD 的生命周期规范完全未覆盖。

### 1.4 Team Pipeline 状态机

**状态：Pass（通过，但需补充）**

Team Pipeline 的状态转换在代码中有严格的 ALLOWED 矩阵（`src/hooks/team-pipeline/transitions.ts`）：

```typescript
const ALLOWED: Record<TeamPipelinePhase, TeamPipelinePhase[]> = {
  'team-plan': ['team-prd'],
  'team-prd': ['team-exec'],
  'team-exec': ['team-verify'],
  'team-verify': ['team-fix', 'complete', 'failed'],
  'team-fix': ['team-exec', 'team-verify', 'complete', 'failed'],
  complete: [],
  failed: [],
  cancelled: ['team-plan', 'team-exec'],  // 恢复路径
};
```

PRD 的 CLAUDE.md 描述与此基本一致，但遗漏了一个关键约束：`team-exec` 阶段进入需要 `plan_path` 或 `prd_path` artifact 存在，`team-verify` 阶段进入需要 `tasks_completed >= tasks_total`。这些前置条件是规范的核心内容。

---

## 2. Industry Standard Check (标准合规)

### 2.1 并发控制模式

**状态：Compliant（符合）**

`atomic rename` 模式是文件系统并发控制的行业标准做法（参考 SQLite WAL、Redis AOF 等）。代码实现符合最佳实践：独占创建临时文件 → fsync → rename。

**但存在一个 Windows 特定问题**：Windows 上 `fs.rename` 使用 `MoveFileExW with MOVEFILE_REPLACE_EXISTING`，在目标文件被其他进程持有时会失败（不同于 POSIX 的原子替换语义）。代码注释中提到了这一点，但规范应该明确说明 Windows 平台的行为差异。

### 2.2 Hook 架构模式

**状态：Non-standard（非标准，但合理）**

PRD 描述的 Hook 系统是 ultrapower 特有的架构，不对应任何通用行业标准。这本身没有问题，但规范需要清晰定义：

- Hook 的输入/输出契约（`HookInput` / `HookOutput` 接口）
- Hook 的执行超时保证（当前代码未见明确超时限制）
- Hook 失败时的降级行为（当前实现：大多数 hook 失败时返回 `{ continue: true }`，即静默降级）

**静默降级是一个重要的领域决策**，规范应该明确这是设计选择而非疏漏，并说明其理由（hook 不应阻塞用户工作流）。

### 2.3 Agent 路由决策

**状态：Adjustment Needed（需要调整）**

PRD 的 P1 提到"Skill 调用决策树（skill vs agent vs MCP 三者选择）"，但实际代码中还存在第四个选择路径：**直接处理（orchestrator 自身处理，不委派）**。

`src/hooks/omc-orchestrator/index.ts` 中的 enforcement 机制正是为了防止 orchestrator 绕过委派直接修改文件。规范的决策树必须包含这个维度，否则会产生"什么时候 orchestrator 可以直接处理"的歧义。

---

## 3. Value Proposition (价值主张)

### 3.1 框架维护者

**收益分析**：P0 规范（Hook 执行顺序、状态文件读写）直接降低维护成本。当前代码中存在多处"同一问题的不同解法"（例如：subagent-tracker 有 debounce 层，而 team-state 没有），规范化后可以统一实现模式，减少未来的 race condition 类 bug。

**风险**：如果规范基于 PRD 的不完整描述编写，可能固化错误的理解，反而增加维护成本。

### 3.2 框架使用者（终端用户）

**收益分析**：P1 规范（Skill 调用决策树）是用户最直接的痛点。当前 70 个 skills 的选择对新用户来说是认知负担。决策树如果设计得当，可以将"选择正确 skill"的时间从分钟级降到秒级。

**关键缺口**：PRD 没有说明决策树的呈现形式。是 CLAUDE.md 中的文字描述？还是交互式 `/help` 命令？还是 HUD 中的实时提示？不同呈现形式的用户价值差异巨大。

### 3.3 框架贡献者

**收益分析**：P2 规范（标准模板 + 检查清单）降低贡献门槛。当前 agents/ 目录下的 .md 文件格式不统一（部分有 YAML frontmatter，部分没有），模板化后可以提升一致性。

---

## 4. 关键领域缺陷（Critical Domain Gaps）

### Gap 1：Hook 类型分类不完整（高优先级）

PRD 的三分类（PreToolUse/PostToolUse/Stop）遗漏了 SubagentStart/Stop、PreCompact、PermissionRequest、SessionEnd 等 8 个 hook 类型。规范若基于此编写，将产生覆盖盲区。

**建议**：以 `src/hooks/bridge.ts` 中的 `HookType` 定义为权威来源，规范必须覆盖所有 15 个 hook 类型。

### Gap 2：Stop Hook 优先级规则未定义（高优先级）

Stop 阶段有三个 hook 竞争（Ralph > Ultrawork > Todo-Continuation），这个优先级规则是运行时行为的核心，但 PRD 完全未提及。

**建议**：在 Hook 执行顺序规范中明确 Stop 阶段的优先级链，并说明每个 hook 的触发条件和退出条件。

### Gap 3：SDK 限制未纳入规范（中优先级）

Claude Code SDK 不提供 agent 成功/失败的直接信号（`success` 字段已废弃），当前实现依赖推断。规范必须明确这个平台限制，否则基于规范的实现者会产生错误假设。

**建议**：在 Agent 生命周期规范中增加"平台限制"章节，说明哪些状态是 SDK 直接提供的，哪些是推断的。

### Gap 4：Windows 平台原子写入语义差异（中优先级）

Windows 上 `rename` 不是真正的原子操作（目标文件被持有时会失败），这与 POSIX 语义不同。当前代码有注释说明，但规范应该将此作为已知平台差异明确记录。

**建议**：在状态文件读写规范中增加"平台差异"章节，说明 Windows 和 POSIX 的行为差异及其影响。

### Gap 5：Agent 边界情况覆盖不足（中优先级）

超时、孤儿、成本超限、死锁四种边界情况在代码中均有处理，但 PRD 的生命周期规范未覆盖。

**建议**：Agent 生命周期规范应包含完整的异常状态处理矩阵，对应 `src/hooks/subagent-tracker/index.ts` 中的 `AgentIntervention` 类型定义。

### Gap 6：Orchestrator 直接处理路径缺失（低优先级）

决策树缺少"orchestrator 直接处理"这个选项，导致规范不完整。

**建议**：在 Skill 调用决策树中增加第四个分支：直接处理（适用于简单澄清、快速状态检查等场景），并明确其适用边界。

---

## Conclusion (结论)

**Modification Required（需要修改后才能进入实现阶段）**

### 评分明细

| 维度 | 得分 | 说明 |
|------|------|------|
| 技术规范完整性 | 5/10 | Hook 类型分类不完整，遗漏 8 个类型 |
| Hook 时序设计准确性 | 6/10 | Stop 阶段优先级规则缺失，是核心遗漏 |
| 状态文件并发保护方案 | 7/10 | 原子写入方案可行，但各状态文件保护级别不一致未说明 |
| Agent 生命周期覆盖 | 5/10 | 遗漏 4 种边界情况，SDK 限制未说明 |
| 领域特定遗漏 | 6/10 | Windows 平台差异、orchestrator 直接处理路径未覆盖 |
| **综合** | **6/10** | |

### 必须修复的问题（进入实现前）

1. 以 `src/hooks/bridge.ts` 的 `HookType` 为权威来源，补全 Hook 类型分类（15 个类型，而非 3 个）
2. 明确 Stop 阶段的 hook 优先级链：Ralph > Ultrawork > Todo-Continuation
3. 在 Agent 生命周期规范中说明 SDK 不提供 `success` 字段的平台限制
4. 补充 Agent 边界情况矩阵（超时/孤儿/成本超限/死锁）

### 建议修复的问题（可在迭代中处理）

5. 说明各状态文件的并发保护级别差异（subagent-tracker 有 debounce，其他没有）
6. 在决策树中增加"orchestrator 直接处理"分支
7. 记录 Windows 平台的 rename 语义差异

### 与 Product Review 的交叉验证

Product Review（评分 7/10）指出"P1 的 ROI 实际高于 P0"，从领域视角看这个判断是正确的。但需要补充：P0 的 Hook 执行顺序规范如果不准确，会直接导致 P1 的决策树建立在错误的基础上。两者需要同步推进，而非 P1 优先于 P0。
