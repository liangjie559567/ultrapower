# Critic Review: Hook 系统安全加固 v6.0.0

**评审时间:** 2026-03-10
**评审者:** The Critic
**PRD 版本:** Draft v1.0

---

## 评分: 6/10

**总体评价:** 方向正确，但存在多个严重的安全漏洞和逻辑缺陷。当前方案不足以投入生产。

---

## 1. 安全漏洞分析 (Security Audit - FAIL)

### 🔴 Critical: D-05 阻塞逻辑不完整

**问题:**
```typescript
if (hookType === 'permission-request' && result.error) {
  return { continue: false };
}
```

**漏洞:**
1. **仅检查 `result.error`** - 如果 hook 返回 `{ success: false }` 但没有 `error` 字段呢？
2. **未验证 hook 返回值结构** - 如果 hook 返回 `null`、`undefined` 或畸形 JSON 呢？
3. **缺少超时处理** - 如果 permission-request hook 永久挂起呢？

**攻击向量:**
- 恶意 hook 返回 `{ success: false }` (无 error 字段) → 绕过阻塞
- Hook 进程崩溃返回空输出 → 被当作成功处理

**正确实现应该是:**
```typescript
if (hookType === 'permission-request') {
  // 失败优先：只有明确成功才放行
  if (!result || result.success !== true) {
    return { continue: false };
  }
}
```

---

### 🟡 High: D-06 白名单定义缺失

**问题:** PRD 说"扩展为全部 15 类 HookType"，但**没有列出每个 HookType 的白名单字段**。

**风险:**
- 实现者可能遗漏关键字段 → 破坏现有功能
- 实现者可能过度宽松 → 引入新的注入点

**缺失的规格:**
- `tool-call` 需要哪些字段？`tool_name`? `tool_input`? `tool_response`?
- `subagent-stop` 需要 `success` 字段吗？还是 `exitCode`?
- `session-end` 需要 `sessionId` + `directory`，还有其他吗？

**要求:** 必须在 PRD 中附上完整的 15 类白名单映射表。

---

### 🟡 Medium: D-07 原子写入的竞态条件

**问题:** PRD 假设 `atomicWriteJsonSync` 已存在且正确实现。

**未回答的问题:**
1. `atomicWriteJsonSync` 是否处理了 Windows 文件锁？
2. 是否使用了 `write-then-rename` 模式？
3. 临时文件的权限是否正确（避免 TOCTOU 攻击）？

**验证要求:**
- 必须检查 `src/lib/atomic-write.ts` 的实现
- 必须测试并发写入场景（10+ 进程同时写）

---

## 2. 边界用例检查 (Edge Case Analysis)

### 🔴 未处理：Hook 进程崩溃

**场景:**
```bash
# permission-request hook 崩溃
$ node hook.js
Segmentation fault (core dumped)
```

**当前行为:** `result.error` 可能为空 → 被当作成功 → **权限绕过**

**要求:** 必须区分"hook 成功返回失败"和"hook 执行失败"。

---

### 🟡 未处理：Hook 超时

**场景:** permission-request hook 永久挂起（死锁、网络等待）

**当前行为:** 未定义 → 可能永久阻塞用户

**要求:** 必须定义超时策略（建议 30 秒）+ 超时后的默认行为（建议拒绝）。

---

### 🟡 未处理：空输入

**场景:**
```typescript
createHookOutput(null, 'permission-request')
createHookOutput(undefined, 'permission-request')
createHookOutput({}, 'permission-request')
```

**当前行为:** 未定义

**要求:** 必须明确处理 null/undefined/空对象。

---

### 🟢 已覆盖：并发写入

D-07 的原子写入方案理论上可以处理，但需要实际测试验证。

---

## 3. 逻辑一致性 (Logical Consistency)

### ✅ 执行顺序合理

D-07 → D-06 → D-05 的顺序是正确的：
- D-07 独立，先修复
- D-06 为 D-05 提供白名单基础
- D-05 依赖 D-06 的字段定义

---

### ⚠️ 冲突：D-06 可能破坏 D-05

**问题:** 如果 D-06 的白名单**过于严格**，可能丢弃 `result.error` 字段 → D-05 的阻塞逻辑失效。

**示例:**
```typescript
// D-06 定义的白名单
const WHITELIST = {
  'permission-request': ['success'] // 遗漏了 'error'
};

// D-05 的逻辑
if (result.error) { ... } // result.error 已被 D-06 丢弃！
```

**要求:** D-06 的白名单必须**显式包含** D-05 依赖的字段。

---

### ⚠️ 不一致：错误处理策略

- **D-05:** 失败时阻塞（安全优先）
- **D-06:** 丢弃未知字段（严格模式）
- **D-07:** 原子写入（可靠性优先）

**问题:** 三者的错误处理哲学不统一：
- D-05 是"失败即拒绝"
- D-06 是"未知即丢弃"
- D-07 是"失败即重试"（假设原子写入有重试逻辑）

**建议:** 统一为"安全优先"原则 → 所有不确定状态都应视为失败。

---

## 4. 测试充分性 (Test Coverage - INSUFFICIENT)

### 🔴 缺失：安全测试

PRD 未提及以下关键测试：
- [ ] 恶意 hook 返回畸形 JSON
- [ ] Hook 进程被 SIGKILL
- [ ] Hook 返回超大输出（DoS 攻击）
- [ ] 竞态条件：多个 permission-request 同时触发

---

### 🟡 缺失：性能测试

D-07 的原子写入可能引入性能下降，但 PRD 说"可接受的权衡"**没有数据支撑**。

**要求:** 必须提供基准测试：
- 当前 `writeFileSync` 的延迟
- `atomicWriteJsonSync` 的延迟
- 可接受的阈值（例如 <10ms）

---

## 5. 严重阻碍 (Major Blockers)

### 🚫 Blocker 1: D-05 安全逻辑错误

**当前方案不安全**，必须改为"失败优先"逻辑。

---

### 🚫 Blocker 2: D-06 白名单未定义

**无法实现**，必须提供完整的 15 类 HookType 白名单映射表。

---

### 🚫 Blocker 3: 缺少超时处理

**可能导致永久挂起**，必须定义超时策略。

---

## 结论 (Conclusion)

**状态:** ❌ **REJECT** (有条件拒绝)

**核心问题:**
1. D-05 的阻塞逻辑存在权限绕过漏洞
2. D-06 缺少关键规格（白名单映射表）
3. 未处理 hook 崩溃/超时等边界情况

**放行条件:**
1. 修复 D-05 为"失败优先"逻辑
2. 补充完整的 15 类 HookType 白名单定义
3. 添加超时处理机制（建议 30 秒）
4. 补充安全测试用例（恶意输入、进程崩溃）

**预计返工时间:** 2-3 天

---

**Critic 签名:** The Critic
**下一步:** 等待 PRD 修订后重新评审
