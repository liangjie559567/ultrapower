# Hooks 事件系统分析报告

**研究阶段**: STAGE 4
**分析日期**: 2026-03-10
**置信度**: HIGH

---

## [OBJECTIVE]

分析 ultrapower hooks 事件系统的实现、执行顺序和路由规则，覆盖 44 个 hook 模块的类型、触发条件和生命周期。

---

## [FINDING:HOOK-1] Hook 类型分类和数量

**[STAT:n]** bridge-types.ts 定义了 **22 个 HookType**
**[STAT:n]** 规范文档标准化了 **15 个核心 HookType**
**[STAT:n]** 实际存在 **44 个 hook 模块目录**

**[EVIDENCE:HOOK-1]** 核心 15 个标准 HookType：
- `keyword-detector`
- `stop-continuation`
- `ralph`
- `persistent-mode`
- `session-start`
- `session-end`
- `pre-tool-use`
- `post-tool-use`
- `autopilot`
- `subagent-start`
- `subagent-stop`
- `pre-compact`
- `setup-init`
- `setup-maintenance`
- `permission-request`

**[CONFIDENCE:HIGH]** 来源：`docs/standards/hook-execution-order.md` 第 1.1 节

---

## [FINDING:HOOK-2] 额外的 HookType 定义

**[EVIDENCE:HOOK-2]** bridge-types.ts 中额外的 7 个 HookType（非标准 15 个）：
- `agent-execution-complete`
- `delegation-enforcer`
- `file-save`
- `omc-orchestrator-post-tool`
- `omc-orchestrator-pre-tool`
- `setup` (已拆分为 setup-init + setup-maintenance)
- `user-prompt-submit`

**[STAT:n]** 额外类型数量: 7

**[CONFIDENCE:MEDIUM]** 这些类型可能用于内部路由或向后兼容

---

## [FINDING:HOOK-3] Stop 阶段优先级链

**[EVIDENCE:HOOK-3]** 优先级顺序（从高到低）：

| 优先级 | HookType | 描述 |
|--------|----------|------|
| P1 | `ralph` | 最高优先级，ralph 模式 |
| P1.5 | `autopilot` | 次优先级，autopilot 模式 |
| P2 | `persistent-mode` | 包含 ultrawork，最低优先级 |
| P3 | `stop-continuation` | 兜底处理 |

**[STAT:effect_size]** 4 个 Stop 阶段 hooks 形成互斥优先级链

**执行规则**：
- 高优先级 hook 处理后，低优先级 hook 跳过
- 避免重复处理同一 Stop 事件
- Ralph 达到 max_iterations 时自动追加 +10 次迭代（最多 5 次）

**[CONFIDENCE:HIGH]** 来源：`docs/standards/hook-execution-order.md` 第 2.1 节

---

## [FINDING:HOOK-4] 敏感 Hook 和安全边界

**[STAT:n]** 4 个敏感 hooks 使用严格白名单过滤

**[EVIDENCE:HOOK-4]** 敏感 hooks 列表：

### 1. permission-request (CRITICAL)
- **必需字段**: sessionId, directory, toolName
- **失败行为**: 必须阻塞（规范要求，当前实现为静默降级 - 差异点 D-05）
- **白名单**: sessionId, toolName, toolInput, directory, permission_mode, tool_use_id, transcript_path, agent_id

### 2. session-end (HIGH)
- **必需字段**: sessionId, directory
- **失败行为**: 静默降级

### 3. setup-init (HIGH)
- **必需字段**: sessionId, directory
- **失败行为**: 静默降级

### 4. setup-maintenance (HIGH)
- **必需字段**: sessionId, directory
- **失败行为**: 静默降级

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge-normalize.ts` 第 106-120 行

---

## [FINDING:HOOK-5] Hook 输入消毒机制

**[EVIDENCE:HOOK-5]** bridge-normalize.ts 实现：

1. **Zod 结构验证**
   - 所有 hook 输入经过 Zod schema 验证
   - 敏感 hooks 使用 StrictHookInputSchema（拒绝未知字段）
   - 非敏感 hooks 使用 HookInputSchema（允许未知字段透传）

2. **字段映射**
   - snake_case → camelCase 自动转换
   - 优先读取 snake_case，camelCase 作为回退
   - 示例：`tool_name` → `toolName`, `session_id` → `sessionId`

3. **白名单过滤**
   - 敏感 hooks：仅允许 STRICT_WHITELIST 中的字段
   - 非敏感 hooks：未知字段透传并记录 debug 警告
   - 未知字段被丢弃时记录 warn 日志

4. **必需字段验证**
   - 每个 HookType 定义必需字段列表
   - 缺失必需字段时抛出错误

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge-normalize.ts` 完整实现

---

## [FINDING:HOOK-6] Hook 路由规则和触发条件

**[STAT:n]** 15 个标准 hooks 的路由映射

**[EVIDENCE:HOOK-6]** 路由入口：`src/hooks/bridge.ts` processHook() 函数

| HookType | 路由目标 | 触发条件 |
|----------|----------|----------|
| keyword-detector | src/hooks/keyword-detector/ | UserPromptSubmit 事件 |
| ralph | src/hooks/ralph/ | Stop 事件 + ralph 模式激活 |
| persistent-mode | src/hooks/persistent-mode/ | Stop 事件 + ultrawork/autopilot 激活 |
| stop-continuation | src/hooks/stop-continuation/ | Stop 事件 + 无高优先级处理 |
| session-start | src/hooks/session-start/ | 会话启动 |
| session-end | src/hooks/session-end/ | 会话结束（懒加载） |
| pre-tool-use | src/hooks/guards/pre-tool.ts | 工具调用前 |
| post-tool-use | src/hooks/guards/post-tool.ts | 工具调用后 |
| autopilot | src/hooks/autopilot/ | autopilot 生命周期 |
| subagent-start | src/hooks/subagent-tracker/ | subagent 启动（懒加载） |
| subagent-stop | src/hooks/subagent-tracker/ | subagent 停止（懒加载） |
| pre-compact | src/hooks/pre-compact/ | 上下文压缩前（懒加载） |
| setup-init | src/hooks/setup/ | 系统初始化（懒加载） |
| setup-maintenance | src/hooks/setup/ | 系统维护（懒加载） |
| permission-request | src/hooks/permission-handler/ | 权限请求（懒加载） |

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge.ts` 第 1210-1354 行

---

## [FINDING:HOOK-7] Hook 加载策略

**[STAT:n]** 热路径 hooks: 8 个（预加载）
**[STAT:n]** 懒加载 hooks: 7 个（按需导入）

**[EVIDENCE:HOOK-7]**

### 热路径 Hooks（预加载）
在 bridge.ts 顶部导入，每次调用无需动态加载：
- keyword-detector
- pre-tool-use
- post-tool-use
- ralph
- persistent-mode
- stop-continuation
- session-start
- autopilot

### 懒加载 Hooks（按需导入）
使用 `await import()` 动态加载，减少启动开销：
- session-end
- subagent-start
- subagent-stop
- pre-compact
- setup-init
- setup-maintenance
- permission-request

**性能优化原理**：
- 热路径 hooks 频繁调用（每次 prompt、每次工具调用）
- 懒加载 hooks 低频调用（会话结束、系统维护）
- 减少初始加载时间和内存占用

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge.ts` 第 25-54 行（热路径）和第 1236-1350 行（懒加载）

---

## [FINDING:HOOK-8] Hook 生命周期阶段分类

**[STAT:n]** 6 个生命周期阶段

**[EVIDENCE:HOOK-8]**

| 阶段 | Hooks | 数量 |
|------|-------|------|
| UserPromptSubmit | keyword-detector | 1 |
| Stop | ralph, persistent-mode, stop-continuation | 3 |
| Session | session-start, session-end | 2 |
| ToolCall | pre-tool-use, post-tool-use | 2 |
| Agent | autopilot, subagent-start, subagent-stop | 3 |
| System | pre-compact, setup-init, setup-maintenance, permission-request | 4 |

**[CONFIDENCE:HIGH]** 基于规范文档分类

---

## [FINDING:HOOK-9] Hook 终止开关和调试机制

**[EVIDENCE:HOOK-9]** 环境变量控制：

### 1. DISABLE_OMC
```bash
DISABLE_OMC=1 claude
```
- 禁用所有 hooks
- 用于调试或紧急回退

### 2. OMC_SKIP_HOOKS
```bash
OMC_SKIP_HOOKS=ralph,autopilot claude
```
- 跳过特定 hooks（逗号分隔）
- 用于测试或隔离问题

**使用场景**：
```bash
# 完全禁用所有 hooks（调试用）
DISABLE_OMC=1 claude

# 跳过特定 hooks（测试用）
OMC_SKIP_HOOKS=permission-request,setup-init claude

# 跳过 Stop 阶段所有 hooks
OMC_SKIP_HOOKS=ralph,persistent-mode,stop-continuation claude
```

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge.ts` 第 1198-1204 行

---

## [FINDING:HOOK-10] 执行模式互斥规则

**[STAT:n]** 4 个互斥模式

**[EVIDENCE:HOOK-10]** 互斥模式列表：
- autopilot
- ultrapilot
- swarm
- pipeline

**互斥规则**：
- 任意两个互斥模式不得同时激活
- 检测到冲突时，后激活的模式被拒绝
- ralph 和 ultrawork 不在互斥列表中，可与其他模式组合

**[LIMITATION]** ralph 和 ultrawork 可与互斥模式组合使用（如 `team ralph`）

**[CONFIDENCE:HIGH]** 来源：`docs/standards/hook-execution-order.md` 差异点 D-04

---

## [FINDING:HOOK-11] Hook 失败降级策略和严重性分级

**[EVIDENCE:HOOK-11]** 三级严重性分类：

### CRITICAL 级别（2 个）
- permission-request
- pre-tool-use

**失败行为**: 必须阻塞（`continue: false`）

### HIGH 级别（6 个）
- session-end
- subagent-start
- subagent-stop
- setup-init
- setup-maintenance
- setup

**失败行为**: 默认阻塞，可通过 `config.hooks.allowHighSeverityFailure` 配置

### LOW 级别（14 个）
- post-tool-use
- session-start
- pre-compact
- keyword-detector
- stop-continuation
- ralph
- persistent-mode
- autopilot
- delegation-enforcer
- omc-orchestrator-pre-tool
- omc-orchestrator-post-tool
- user-prompt-submit
- file-save
- agent-execution-complete

**失败行为**: 静默降级（`continue: true`）

**设计理由**: hooks 不应阻塞用户工作流，失败时静默降级是设计选择而非疏漏

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge-types.ts` 第 91-123 行

**[LIMITATION]** permission-request 当前实现存在差异点 D-05：规范要求失败时阻塞，但当前实现为静默降级

---

## [FINDING:HOOK-12] Hook 模块架构

**[STAT:n]** 44 个 hook 模块目录
**[STAT:n]** 15 个核心 HookType 直接路由
**[STAT:n]** ~32 个辅助模块提供支持功能

**[EVIDENCE:HOOK-12]** 辅助模块分类：

### 上下文注入（3 个）
- beads-context
- directory-readme-injector
- rules-injector

### 状态管理（6 个）
- state
- mode-registry
- registry
- memory
- project-memory
- notepad

### 工作流编排（5 个）
- team-pipeline
- ultrapilot
- ultraqa
- ultrawork
- todo-continuation

### 安全守卫（3 个）
- guards
- axiom-guards
- permission-handler

### 可观测性（4 个）
- observability
- learner
- nexus
- agent-usage-reminder

### 其他支持模块（11 个）
- auto-slash-command
- axiom-boot
- background-notification
- comment-checker
- empty-message-sanitizer
- non-interactive-env
- omc-orchestrator
- plugin-patterns
- preemptive-compaction
- processors
- recovery
- thinking-block-validator
- think-mode

**[CONFIDENCE:MEDIUM]** 基于目录结构推断

---

## [FINDING:HOOK-13] Hook 执行流程

**[EVIDENCE:HOOK-13]** 完整执行链：

```
1. Claude Code 发送 hook 事件
   ↓ (stdin, snake_case 字段)

2. bridge.ts 检查终止开关
   ↓ (DISABLE_OMC, OMC_SKIP_HOOKS)

3. bridge-normalize.ts 消毒输入
   ↓ (Zod 验证 + 字段映射)

4. processHook() 路由到对应处理器
   ↓ (热路径或懒加载)

5. 处理器执行业务逻辑
   ↓

6. 返回 HookOutput
   ↓ (continue + message)

7. 失败时根据严重性级别决定阻塞或降级
   ↓

8. 输出到 stdout（JSON 格式）
```

**[CONFIDENCE:HIGH]** 来源：`src/hooks/bridge.ts` 完整流程

---

## [FINDING:HOOK-14] 关键设计决策

**[EVIDENCE:HOOK-14]**

1. **性能优化**
   - 热路径 hooks 预加载，低频 hooks 懒加载
   - LRU 缓存文件读取（50 条目）
   - 文件监听自动失效缓存

2. **安全边界**
   - 4 个敏感 hooks 使用严格白名单
   - Zod 结构验证防止注入攻击
   - 必需字段验证防止缺失数据

3. **容错设计**
   - 大部分 hooks 静默降级，不阻塞用户工作流
   - CRITICAL hooks 失败时强制阻塞
   - HIGH hooks 可配置失败行为

4. **优先级链**
   - Stop 阶段 4 级优先级避免重复处理
   - 高优先级 hook 处理后低优先级自动跳过

5. **模块化**
   - 44 个模块分离关注点
   - 15 个核心 HookType 路由
   - 辅助模块提供可组合功能

**[CONFIDENCE:HIGH]**

---

## 数据统计摘要

| 指标 | 数值 |
|------|------|
| HookType 定义总数 | 22 |
| 核心标准 HookType | 15 |
| Hook 模块目录 | 44 |
| 生命周期阶段 | 6 |
| Stop 阶段优先级 | 4 |
| 敏感 Hooks | 4 |
| 热路径 Hooks | 8 |
| 懒加载 Hooks | 7 |
| 互斥模式 | 4 |
| CRITICAL 级别 Hooks | 2 |
| HIGH 级别 Hooks | 6 |
| LOW 级别 Hooks | 14 |

---

## [LIMITATION] 已识别的差异点和待改进项

### 差异点 D-01
**描述**: 敏感 hook 数量为 4 个（setup 拆分为 init + maintenance）
**当前状态**: 已实现
**规范要求**: 以 4 个为准

### 差异点 D-02
**描述**: Stop 优先级链实际为 Ralph > Autopilot > Ultrawork
**当前状态**: 已实现
**规范要求**: 以实际代码为准（PRD 原描述为 Ralph > Ultrawork > Todo-Continuation）

### 差异点 D-04
**描述**: 互斥模式为 4 个（含 swarm、pipeline）
**当前状态**: 已实现
**规范要求**: 以 4 个为准

### 差异点 D-05 ⚠️
**描述**: permission-request 失败处理当前为静默降级
**当前状态**: 静默降级（返回 `{ continue: true }`）
**规范要求**: 失败时必须阻塞（返回 `{ continue: false }`）
**影响**: 安全边界可能被绕过
**优先级**: P0

### 待实现功能
**超时处理**: PreToolUse/PostToolUse 5秒超时规则待实现
**当前状态**: 代码中未见明确超时限制实现
**规范要求**:
- PreToolUse 超时 5 秒 → 记录到 last-tool-error.json → 继续执行工具调用
- PostToolUse 超时 5 秒 → 状态标记"待重试" → 不回滚工具调用

---

## 相关文件路径

### 核心实现
- `src/hooks/bridge.ts` - 主路由和执行逻辑（1430 行）
- `src/hooks/bridge-normalize.ts` - 输入消毒和字段映射（382 行）
- `src/hooks/bridge-types.ts` - 类型定义和严重性分级（124 行）

### 规范文档
- `docs/standards/hook-execution-order.md` - 执行顺序规范（P0）
- `docs/standards/runtime-protection.md` - 运行时保护规范（P0）

### Hook 模块目录
- `src/hooks/` - 44 个 hook 模块（包含核心和辅助）

---

**[STAGE_COMPLETE:4]** Hooks 事件系统分析完成
