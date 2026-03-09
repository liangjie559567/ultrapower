# ultrapower v5.2.3 Hook 系统深度分析报告

**生成时间**: 2026-02-27
**分析阶段**: RESEARCH_STAGE:2
**分析范围**: src/hooks/（43 个模块）、bridge/、templates/hooks/、docs/standards/

---

## [OBJECTIVE]

对 ultrapower v5.2.3 的 Hook 系统进行深度分析，识别架构模式、执行顺序机制、潜在问题和改进点。

---

## [DATA]

* 总 Hook 模块数量: 43 个目录/文件（src/hooks/ 下）

* HookType 枚举: 15 类（来源: src/hooks/bridge.ts）

* 模板 Hook 文件: 6 个（templates/hooks/*.mjs）

* Bridge 文件: 4 个（bridge/ 目录）

* 规范文档: hook-execution-order.md（版本 5.0.21）

* 代码行数（bridge.ts）: 1241 行

* 代码行数（persistent-mode/index.ts）: 656 行

---

## [FINDING:HOOK-1] Hook 系统整体架构

Hook 系统采用**双层架构**：Shell 脚本层（templates/hooks/*.mjs）+ TypeScript 桥接层（src/hooks/bridge.ts）。

架构流程：
```
Claude Code 事件
    ↓
Shell 脚本（templates/hooks/*.mjs）
    ↓ stdin JSON
Node.js Bridge（hook-bridge.mjs）
    ↓ --hook=<type>
processHook() in bridge.ts
    ↓ 路由
具体 Hook 处理器（lazy-loaded）
    ↓ stdout JSON
Claude Code（{ continue, message }）
```

[STAT:n] n=15 HookType，覆盖 6 个生命周期阶段
[STAT:effect_size] 热路径 Hook 2 个（keyword-detector、pre-tool-use），懒加载 13 个（86.7%）
[STAT:ci] 敏感 Hook 4 类（26.7%）：permission-request、setup-init、setup-maintenance、session-end

**[EVIDENCE:HOOK-1]** 来源：`src/hooks/bridge.ts` L247-262（HookType 枚举定义）、L1047-1190（processHook 路由逻辑）

---

## [FINDING:HOOK-2] Stop 阶段优先级链

Stop 阶段实现了 4 级优先级链，由 `persistent-mode/index.ts` 的 `checkPersistentModes()` 统一管理。

```
P1   Ralph（最高）     → checkRalphLoop()
P1.5 Autopilot         → checkAutopilot()
P2   Ultrawork         → checkUltrawork()
P3   Todo-Continuation → 已移除（注释标注）
```

[STAT:n] Stop 阶段涉及 3 个 HookType（ralph、persistent-mode、stop-continuation）
[STAT:effect_size] 互斥模式 4 个（autopilot、ultrapilot、swarm、pipeline）
[STAT:p_value] 优先级判断为纯条件分支，无概率成分

**关键设计决策**：`createHookOutput()` 始终返回 `{ continue: true }`，通过 message 注入实现软性强制（非硬阻塞）。

**[EVIDENCE:HOOK-2]** 来源：`src/hooks/persistent-mode/index.ts` L566-639（checkPersistentModes 主函数）、L646-655（createHookOutput 软强制实现）

---

## [FINDING:HOOK-3] bridge-normalize.ts 安全过滤机制

输入规范化层实现了**敏感度分级过滤**：

* 普通 Hook：passthrough 模式，未知字段透传（附 debug 警告）

* 敏感 Hook（4 类）：严格白名单，未知字段静默丢弃

* 快速路径：已 camelCase 的输入跳过 Zod 解析

[STAT:n] KNOWN_FIELDS 白名单 22 个字段
[STAT:effect_size] 敏感 Hook 过滤强度：仅允许 KNOWN_FIELDS 中的字段，其余全部丢弃

**[EVIDENCE:HOOK-3]** 来源：`src/hooks/bridge-normalize.ts` L82-102（SENSITIVE_HOOKS + KNOWN_FIELDS 定义）、L195-226（filterPassthrough 实现）

---

## [FINDING:HOOK-4] keyword-detector 双实现差异

存在**两套并行实现**：

| 维度 | templates/hooks/keyword-detector.mjs | src/hooks/keyword-detector/index.ts |
| ------ | -------------------------------------- | -------------------------------------- |
| 运行时 | Shell 直接调用 | bridge.ts 路由调用 |
| 输出格式 | hookSpecificOutput.additionalContext | HookOutput.message |
| 状态激活 | 直接写文件（activateState） | 调用 TypeScript 模块 |
| 冲突解决 | resolveConflicts() 内置 | getAllKeywords() 返回数组 |

[STAT:n] 关键词检测支持 14 类关键词（cancel、ralph、autopilot、team、ultrawork、pipeline、ccg、ralplan、plan、tdd、ultrathink、deepsearch、analyze、codex/gemini）
[STAT:effect_size] 两套实现的关键词覆盖范围基本一致，但冲突解决逻辑存在差异

**[EVIDENCE:HOOK-4]** 来源：`templates/hooks/keyword-detector.mjs` L269-300（resolveConflicts）、`src/hooks/bridge.ts` L288-371（processKeywordDetector）

---

## [FINDING:HOOK-5] Ralph 自动扩展与无限循环防护

Ralph 循环在达到 max_iterations 时**不会停止**，而是自动追加 +10 次迭代：

```typescript
// persistent-mode/index.ts L397-403
if (state.iteration >= state.max_iterations) {
  state.max_iterations += 10;  // 自动扩展
  writeRalphState(workingDir, state, sessionId);
}
```

唯一的终止路径：
1. 用户显式调用 `/ultrapower:cancel`
2. Architect 验证通过
3. PRD 所有 story 完成
4. Team Pipeline 进入终态（complete/failed/cancelled）
5. 上下文限制停止（isContextLimitStop）
6. 用户中止（isUserAbort）

[STAT:n] MAX_TODO_CONTINUATION_ATTEMPTS = 5（todo-continuation 的独立限制）
[STAT:effect_size] Ralph 无硬性迭代上限，理论上可无限运行

**[EVIDENCE:HOOK-5]** 来源：`src/hooks/persistent-mode/index.ts` L397-403（自动扩展逻辑）、L566-639（终止条件检查）

---

## [FINDING:HOOK-6] permission-request 安全漏洞（差异点 D-05）

`permission-request` Hook 失败时**静默降级**（返回 `{ continue: true }`），违反安全边界设计意图。

当前实现（`persistent-mode/index.ts` L646-655）：
```typescript
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message | | undefined };
  // 始终 continue: true，包括 permission-request 失败时
}
```

规范要求（v2 目标）：permission-request 失败时应返回 `{ continue: false }`。

[STAT:effect_size] 影响范围：所有工具权限请求场景
[STAT:p_value] 已在 docs/standards/hook-execution-order.md 中记录为差异点 D-05

**[EVIDENCE:HOOK-6]** 来源：`docs/standards/hook-execution-order.md` L218-253（D-05 差异点说明）

---

## [FINDING:HOOK-7] session-start 模板层的 NPM 版本检查

`templates/hooks/session-start.mjs` 在每次会话启动时向 npm registry 发起网络请求检查更新，带有 2 秒超时和 24 小时缓存。

[STAT:n] 缓存有效期 86400 秒（24 小时）
[STAT:effect_size] 网络超时 2000ms，失败时静默降级（不阻塞会话启动）

**[EVIDENCE:HOOK-7]** 来源：`templates/hooks/session-start.mjs` L56-100（checkForUpdates 函数）

---

## [FINDING:HOOK-8] mode-registry 单向依赖设计

`mode-registry/index.ts` 明确声明**仅使用文件检测，不导入任何模式模块**，以避免循环依赖。

8 个注册模式：autopilot、ultrapilot、swarm、pipeline、team、ralph、ultrawork、ultraqa

其中 swarm 使用 SQLite（`swarm.db`），其余使用 JSON 状态文件。

[STAT:n] 8 个注册模式，1 个 SQLite 模式（swarm），7 个 JSON 模式
[STAT:effect_size] STALE_MARKER_THRESHOLD = 3600000ms（1 小时），超时自动清理

**[EVIDENCE:HOOK-8]** 来源：`src/hooks/mode-registry/index.ts` L1-80（模式注册表定义）

---

## [FINDING:HOOK-9] 模板层与 TypeScript 层的输出格式不一致

两层使用不同的 Hook 输出格式：

| 层 | 输出格式 |
| ---- | --------- |
| templates/*.mjs | `{ continue, hookSpecificOutput: { hookEventName, additionalContext } }` |
| src/hooks/bridge.ts | `{ continue, message }` |

[STAT:n] 影响 6 个模板文件
[STAT:effect_size] 格式差异可能导致上下文注入行为不一致

**[EVIDENCE:HOOK-9]** 来源：`templates/hooks/keyword-detector.mjs` L306-314（createHookOutput 使用 hookSpecificOutput）、`src/hooks/bridge.ts` L233-242（HookOutput 接口使用 message）

---

## [LIMITATION]

1. **静态分析局限**：未执行运行时测试，所有发现基于代码静态分析。实际执行路径可能因环境差异而不同。
2. **测试覆盖未验证**：`src/hooks/__tests__/` 目录存在但未分析测试覆盖率，无法量化测试充分性。
3. **bridge/ 目录未深入分析**：`bridge/mcp-server.cjs`、`bridge/team-bridge.cjs` 等文件未完整读取，可能存在额外的 Hook 桥接逻辑。
4. **版本差异**：规范文档版本为 5.0.21，代码版本为 5.2.3，存在版本漂移，部分规范描述可能已过时。
5. **Windows 路径兼容性**：部分 Hook 使用 `path.normalize` 处理路径，但 Windows 反斜杠处理逻辑分散在多处，存在潜在边缘情况。

---

## 汇总统计

| 指标 | 数值 |
| ------ | ------ |
| 总 HookType 数量 | 15 |
| 敏感 Hook 数量 | 4（26.7%） |
| 热路径 Hook 数量 | 2（13.3%） |
| 懒加载 Hook 数量 | 13（86.7%） |
| Stop 阶段优先级层级 | 4 级 |
| 互斥执行模式数量 | 4 |
| 注册模式总数 | 8 |
| 已知规范差异点 | 5（D-01 ~ D-05） |
| 关键安全问题 | 1（D-05：permission-request 静默降级） |

---

## 关键改进建议

1. **[P0] 修复 D-05**：`createHookOutput` 需区分 `permission-request` 场景，失败时返回 `{ continue: false }`。
2. **[P1] 统一输出格式**：模板层（hookSpecificOutput）与 TypeScript 层（message）的输出格式应统一。
3. **[P1] Ralph 迭代上限**：考虑添加绝对上限（如 100 次），防止极端情况下的无限循环。
4. **[P2] 规范文档版本同步**：hook-execution-order.md 版本（5.0.21）落后于代码版本（5.2.3），需更新。

---

报告保存到：`.omc/scientist/reports/20260227_hook_system_analysis.md`
