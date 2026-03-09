# ultrapower 系统整合与跨模块分析报告

**分析日期**: 2026-03-05
**版本**: v5.5.18
**分析范围**: Agent-Hook-Skill 协作机制、数据流一致性、模块间接口、系统边界与安全防护

---

## 执行摘要

ultrapower 是一个复杂的多 agent 编排系统，通过 Hook 事件驱动、Skill 触发器和 Agent 专业化分工实现自动化工作流。系统整合分析发现：

**核心优势**：

* 15 类 HookType 覆盖完整生命周期（UserPromptSubmit、Stop、Session、Tool、Agent、System）

* 49 个专业 Agent 分工明确（Build/Review/Domain/Product 四大通道）

* 状态机驱动的 Team Pipeline 支持分阶段执行（plan→prd→exec→verify→fix）

* 四层并发保护机制确保状态一致性（debounce + atomic write + file lock + merge）

**关键风险**：

* 路径遍历防护依赖白名单校验（8 个合法 mode 值）

* permission-request 失败时静默降级（差异点 D-05，v2 待修复）

* Windows 平台 rename 行为差异可能导致状态文件写入失败

* 非敏感 hook 未知字段透传（差异点 D-06，v2 待统一）

---

## 1. Agent-Hook-Skill 协作机制

### 1.1 三层架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户输入层                              │
│  用户 Prompt → Keyword Detector → Skill 触发 → Agent 生成    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Hook 事件层                            │
│  15 类 HookType：UserPromptSubmit、Stop、Session、Tool、     │
│  Agent、System（setup/pre-compact/permission）               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Agent 执行层                           │
│  49 个专业 Agent：explore/analyst/planner/architect/         │
│  executor/verifier + 审查通道 + 领域专家 + 产品通道          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        状态持久化层                           │
│  .omc/state/*.json（8 种模式状态）+ subagent-tracking.json  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 协作流程详解

**触发链路**：
1. **用户输入** → `keyword-detector` hook 检测关键词（ralph/ultrawork/autopilot/team 等）
2. **Skill 激活** → 根据触发模式调用对应 skill（`/ultrapower:ralph`、`/ultrapower:team` 等）
3. **Agent 生成** → Skill 通过 `Task()` 工具生成专业 agent（executor/planner/verifier 等）
4. **状态同步** → Agent 执行过程中通过 `subagent-start`/`subagent-stop` hook 更新追踪状态
5. **持久化循环** → Stop hook 检测模式状态，注入 continuation prompt 驱动循环

**关键设计模式**：

* **事件驱动**：Hook 作为观察者模式实现，监听 Claude Code 生命周期事件

* **状态机驱动**：Team Pipeline 使用显式状态转换矩阵（5 阶段 + 3 终态）

* **优先级链**：Stop 阶段使用 Ralph(P1) > Autopilot(P1.5) > Ultrawork(P2) > stop-continuation(P3) 优先级

* **白名单过滤**：敏感 hook（4 类）强制白名单，非敏感 hook（11 类）透传 + debug 警告

### 1.3 Agent 分工矩阵

| 通道 | Agent 类型 | 模型 | 职责 | 典型场景 |
| ------ | ----------- | ------ | ------ | --------- |
| **Build/Analysis** | explore | haiku | 代码库发现、符号映射 | 陌生代码库探索 |
| | analyst | opus | 需求澄清、隐性约束 | PRD 生成、验收标准 |
| | planner | opus | 任务排序、执行计划 | 工作分解、依赖分析 |
| | architect | opus | 系统设计、接口边界 | 架构评审、技术选型 |
| | debugger | sonnet | 根因分析、回归隔离 | Bug 调查、故障诊断 |
| | executor | sonnet | 代码实现、重构 | 功能开发、代码修改 |
| | deep-executor | opus | 复杂自主执行 | 跨模块重构、架构迁移 |
| | verifier | sonnet | 完成验证、测试充分性 | 质量门禁、交付验收 |
| **Review** | style-reviewer | haiku | 格式、命名、惯用法 | Lint 规范检查 |
| | quality-reviewer | sonnet | 逻辑缺陷、可维护性 | 代码审查、反模式检测 |
| | api-reviewer | sonnet | API 契约、版本控制 | 接口兼容性审查 |
| | security-reviewer | sonnet | 漏洞、信任边界 | 安全审计、OWASP 检测 |
| | performance-reviewer | sonnet | 热点、复杂度优化 | 性能分析、瓶颈识别 |
| | code-reviewer | opus | 综合审查 | 全面代码质量评估 |
| **Domain** | dependency-expert | sonnet | SDK/API 评估 | 外部包选型、文档查找 |
| | test-engineer | sonnet | 测试策略、覆盖率 | TDD 指导、测试加固 |
| | build-fixer | sonnet | 构建/类型错误 | 编译失败修复 |
| | designer | sonnet | UI/UX 架构 | 交互设计、组件设计 |
| | git-master | sonnet | 提交策略、历史管理 | 原子提交、rebase 操作 |
| **Product** | product-manager | sonnet | 问题定义、PRD | 产品需求分析 |
| | ux-researcher | sonnet | 启发式审计、可用性 | UX 审计、无障碍检查 |
| | information-architect | sonnet | 分类、导航 | 信息架构设计 |

---

## 2. 数据流一致性验证

### 2.1 状态传递路径

**核心状态文件**（位于 `.omc/state/`）：

```
.omc/state/
├── autopilot-state.json      # Autopilot 模式状态
├── team-state.json            # Team Pipeline 状态
├── ralph-state.json           # Ralph 循环状态
├── ultrawork-state.json       # Ultrawork 持久化状态
├── ultrapilot-state.json      # Ultrapilot 并行协调状态
├── pipeline-state.json        # Pipeline 顺序链式状态
├── ultraqa-state.json         # QA 循环状态
├── swarm-state.json           # Swarm 兼容层状态
└── subagent-tracking.json     # Agent 追踪状态（最高并发保护）
```

**状态同步机制**：

1. **写入保护**：所有状态文件使用 `atomicWriteJsonSync()` 原子写入
   - 临时文件 + fsync + 原子 rename（POSIX）
   - 文件权限 0o600（仅所有者可读写）
   - Windows 平台差异：rename 在目标文件被占用时失败

1. **并发保护级别**：
   | 文件 | 保护机制 | 级别 |
   | ------ | --------- | ------ |
   | `subagent-tracking.json` | debounce(100ms) + flushInProgress Set + file lock(PID:timestamp) + mergeTrackerStates | **最高**（四层） |
   | 其他 `*-state.json` | atomicWriteJsonSync | 中（原子写入） |

1. **状态恢复流程**：
   - 检测损坏 JSON → `safeReadJson()` 返回 null
   - 记录错误到 `last-tool-error.json`
   - 使用空状态初始化（不崩溃）
   - 下次写入时原子覆盖损坏文件

### 2.2 消息通信模式

**Hook 输入规范化**（`bridge-normalize.ts`）：

```typescript
// snake_case → camelCase 转换
{
  session_id → sessionId,
  cwd → directory,
  tool_name → toolName,
  tool_input → toolInput,
  stop_reason → stopReason,
  user_requested → userRequested
}
```

**敏感 Hook 白名单**（4 类）：

* `permission-request`：必需字段 `["sessionId", "directory", "toolName"]`

* `session-end`：必需字段 `["sessionId", "directory"]`

* `setup-init`：必需字段 `["sessionId", "directory"]`

* `setup-maintenance`：必需字段 `["sessionId", "directory"]`

**未知字段处理**：

* 敏感 hook：严格白名单，丢弃未知字段 ✅

* 非敏感 hook（11 类）：透传 + debug 警告（差异点 D-06）

### 2.3 数据流完整性验证

**验证点**：
1. ✅ **状态文件原子性**：所有写入使用 `atomicWriteJsonSync()`
2. ✅ **会话隔离**：状态文件包含 `session_id` 字段，严格匹配
3. ✅ **损坏恢复**：`safeReadJson()` 处理 JSON parse 失败
4. ⚠️ **并发一致性**：仅 `subagent-tracking.json` 有文件锁，其他依赖原子写入
5. ⚠️ **Windows 兼容性**：rename 在文件被占用时失败（平台差异）

---

## 3. 模块间接口联调分析

### 3.1 Hook → Agent 接口

**调用路径**：
```
bridge.ts:processHook()
  ↓ 路由到具体 hook 处理器
  ↓ 检测关键词/模式状态
  ↓ 注入 continuation prompt
  ↓ Claude 接收 prompt
  ↓ 调用 Task() 工具
  ↓ subagent-start hook 触发
  ↓ Agent 执行
  ↓ subagent-stop hook 触发
  ↓ 更新 subagent-tracking.json
```

**接口契约**：

* **输入**：`HookInput` 包含 `sessionId`、`directory`、`toolName`、`toolInput` 等

* **输出**：`HookOutput` 包含 `continue: boolean`、`message?: string`、`reason?: string`

* **类型安全**：TypeScript 严格类型检查，15 类 HookType 枚举

### 3.2 Agent → State 接口

**状态读写 API**：
```typescript
// 读取状态
readRalphState(directory: string): RalphLoopState | null
readTeamState(directory: string, sessionId?: string): TeamState | null
readAutopilotState(directory: string, sessionId?: string): AutopilotState | null

// 写入状态
writeRalphState(directory: string, state: RalphLoopState): void
writeTeamState(directory: string, state: TeamState): void
writeAutopilotState(directory: string, state: AutopilotState): void

// 清理状态
clearRalphState(directory: string): void
clearTeamState(directory: string): void
```

**路径安全**：
```typescript
// ✅ 正确：先校验再拼接
import { assertValidMode } from '../lib/validateMode';
const validMode = assertValidMode(mode); // 白名单：8 个合法值
const path = `.omc/state/${validMode}-state.json`;

// ❌ 禁止：未校验直接拼接（路径遍历风险）
const path = `.omc/state/${mode}-state.json`;
```

### 3.3 Skill → Agent 接口

**Skill 触发流程**：
1. 用户输入包含关键词（如 "ralph"、"team"、"autopilot"）
2. `keyword-detector` hook 检测关键词
3. 激活对应模式状态（如 `activateUltrawork()`）
4. 注入 skill 激活消息（如 `RALPH_MESSAGE`）
5. Claude 接收消息后调用 `Skill()` 工具
6. Skill 内部调用 `Task()` 生成 agent

**接口示例**（Ralph Skill）：
```typescript
// 1. keyword-detector 激活
case "ralph": {
  const { createRalphLoopHook } = await import("./ralph/index.js");
  const hook = createRalphLoopHook(directory);
  hook.startLoop(sessionId, promptText);
  messages.push(RALPH_MESSAGE);
  break;
}

// 2. Stop hook 注入 continuation
const continuationPrompt = `[RALPH LOOP - ITERATION ${iteration}/${max_iterations}]
The task is NOT complete yet. Continue working.`;

// 3. Claude 调用 Skill("ultrapower:ralph")
// 4. Skill 内部生成 executor/verifier agents
```

---

## 4. 系统边界与安全防护

### 4.1 路径遍历防护

**威胁模型**：攻击者通过构造恶意 `mode` 参数（如 `../../etc/passwd`）尝试读写任意文件。

**防护措施**：
```typescript
// src/lib/validateMode.ts
const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm'
] as const;

export function assertValidMode(mode: string): ValidMode {
  if (!VALID_MODES.includes(mode as ValidMode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  return mode as ValidMode;
}
```

**使用规范**：

* ✅ 所有状态文件路径拼接前必须调用 `assertValidMode()`

* ✅ 白名单包含 8 个合法值（差异点 D-03）

* ❌ 禁止直接使用用户输入拼接路径

### 4.2 Hook 输入消毒

**威胁模型**：恶意 hook 输入注入未知字段，绕过安全检查或污染状态。

**防护措施**（`bridge-normalize.ts`）：
```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end'
]);

function filterPassthrough(input, hookType) {
  const isSensitive = SENSITIVE_HOOKS.has(hookType);
  if (isSensitive) {
    // 严格白名单：只允许 KNOWN_FIELDS
    return filterToKnownFields(input, hookType);
  } else {
    // 非敏感：透传 + debug 警告（差异点 D-06）
    logDebugWarning(input, hookType);
    return input;
  }
}
```

**已知限制**：

* ⚠️ 非敏感 hook（11 类）未知字段透传（v1 设计选择）

* ⚠️ v2 目标：统一为全部 15 类 hook 严格白名单

### 4.3 Permission-Request 安全边界

**威胁模型**：`permission-request` hook 失败时静默降级，允许未授权工具执行。

**当前实现**（差异点 D-05）：
```typescript
// src/hooks/persistent-mode/index.ts
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message | | undefined };
  // ⚠️ 始终返回 { continue: true }，包括 permission-request 失败时
}
```

**规范要求**（v2 待修复）：
```typescript
export function createHookOutput(
  result: PersistentModeResult,
  hookType?: HookType
): { continue: boolean; message?: string } {
  if (hookType === 'permission-request' && result.error) {
    // 安全边界：permission-request 失败时必须阻塞
    return { continue: false, message: result.message };
  }
  return { continue: true, message: result.message | | undefined };
}
```

**风险评估**：

* 🔴 **高风险**：当前实现允许未授权工具执行

* 📋 **修复优先级**：P0（安全边界，必须修复）

* 🎯 **修复目标**：v2 版本

### 4.4 状态文件权限

**敏感数据**：`agent-replay-*.jsonl` 包含完整对话历史，可能含代码、密钥片段。

**防护措施**：

* ✅ 文件权限 `0o600`（仅所有者可读写）

* ✅ 数据保留期限 7 天，超期自动清理

* ✅ `.omc/` 目录已在 `.gitignore` 中

* ✅ CI 验证 `.gitignore` 配置

---

## 5. 架构瓶颈与优化点

### 5.1 性能瓶颈

**识别的瓶颈**：

1. **subagent-tracking.json 写入频率**
   - 问题：每个 agent 启动/停止都触发写入
   - 影响：高并发场景下 I/O 瓶颈
   - 当前缓解：debounce(100ms) + 文件锁
   - 优化方向：批量写入 + 内存缓存

1. **Hook 链式调用开销**
   - 问题：15 类 hook 顺序检查，即使不匹配也需遍历
   - 影响：热路径延迟（pre-tool-use/post-tool-use）
   - 优化方向：Hook 路由表 + 早期退出

1. **状态文件 JSON 序列化**
   - 问题：每次写入都完整序列化整个状态对象
   - 影响：大状态对象（如 Team Pipeline）序列化开销
   - 优化方向：增量更新 + 结构化存储（SQLite）

### 5.2 可维护性改进

**代码组织**：

* ✅ 模块化良好：49 个 agent 独立文件

* ✅ 类型安全：TypeScript 严格模式

* ⚠️ 循环依赖：部分模块存在循环导入（通过 type-only import 缓解）

* ⚠️ 文档同步：规范文档与代码存在差异点（已记录 7 个差异点）

**测试覆盖**：

* ✅ 单元测试：核心模块有测试覆盖

* ⚠️ 集成测试：跨模块协作场景测试不足

* ⚠️ 边界情况：Windows 平台测试覆盖不足

### 5.3 扩展性设计

**良好实践**：

* ✅ Agent 注册表：`getAgentDefinitions()` 集中管理

* ✅ Hook 路由：`bridge.ts` 统一入口

* ✅ 状态机驱动：Team Pipeline 显式状态转换

* ✅ 模型路由：支持 haiku/sonnet/opus 按复杂度选择

**改进空间**：

* 📋 插件化：Agent/Hook/Skill 支持外部扩展

* 📋 配置化：更多硬编码常量移至配置文件

* 📋 可观测性：结构化日志 + 指标采集

---

## 6. 关键发现与建议

### 6.1 架构优势

1. **清晰的职责分离**：Hook（事件）、Skill（触发）、Agent（执行）三层解耦
2. **状态机驱动**：Team Pipeline 使用显式状态转换，易于理解和调试
3. **并发保护**：四层保护机制（debounce + atomic + lock + merge）确保一致性
4. **类型安全**：TypeScript 严格模式 + 15 类 HookType 枚举

### 6.2 安全风险（按优先级）

| 优先级 | 风险 | 影响 | 修复建议 |
| -------- | ------ | ------ | --------- |
| 🔴 P0 | permission-request 静默降级 | 未授权工具执行 | v2 修复：失败时返回 `{ continue: false }` |
| 🟡 P1 | 非敏感 hook 未知字段透传 | 潜在注入攻击 | v2 统一：全部 hook 严格白名单 |
| 🟡 P1 | Windows rename 失败处理 | 状态文件写入失败 | 增加重试逻辑 + 错误恢复 |
| 🟢 P2 | 路径遍历防护依赖白名单 | 白名单维护成本 | 当前实现充分，持续审计 |

### 6.3 性能优化建议

1. **短期**（v2）：
   - 批量写入 subagent-tracking.json（减少 I/O）
   - Hook 路由表优化（减少链式检查）
   - 增加 Windows 平台测试覆盖

1. **中期**（v3）：
   - 状态存储迁移至 SQLite（结构化 + 事务）
   - 内存缓存层（减少文件读取）
   - 增量状态更新（减少序列化开销）

1. **长期**（v4+）：
   - 分布式状态同步（多实例支持）
   - 插件化架构（Agent/Hook/Skill 外部扩展）
   - 可观测性平台（结构化日志 + 指标）

### 6.4 文档同步建议

**已识别差异点**（7 个）：

* D-01：敏感 hook 数量（4 类，非 3 类）

* D-02：Stop 优先级链（Ralph > Autopilot > Ultrawork）

* D-03：合法 mode 数量（8 个，含 swarm）

* D-04：互斥模式范围（4 个：autopilot/ultrapilot/swarm/pipeline）

* D-05：permission-request 失败处理（当前静默降级）

* D-06：非敏感 hook 未知字段（当前透传）

* D-07：subagent-tracker 内部写入（当前 writeFileSync）

**建议**：

* ✅ 规范文档已记录所有差异点

* 📋 v2 修复差异点 D-05、D-06、D-07

* 📋 CI 门禁：自动验证 HookType 枚举与文档一致性

---

## 7. 结论

ultrapower 系统整合架构设计合理，通过 Hook 事件驱动、Skill 触发器和 Agent 专业化分工实现了复杂的多 agent 编排。核心优势在于清晰的职责分离、状态机驱动的流程控制和四层并发保护机制。

**关键风险**集中在安全边界（permission-request 静默降级）和平台兼容性（Windows rename 行为差异），建议在 v2 版本中优先修复。

**性能瓶颈**主要在状态文件 I/O 和 JSON 序列化，可通过批量写入、内存缓存和结构化存储（SQLite）优化。

**可维护性**方面，代码组织良好，类型安全充分，但需加强集成测试覆盖和文档同步机制。

总体而言，系统架构健壮，具备良好的扩展性和可维护性，适合作为多 agent 编排平台的基础设施。
