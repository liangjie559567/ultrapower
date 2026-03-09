# Critic Review: Ultrapower 安全性与健壮性评审

**评审日期**: 2026-03-03
**评审范围**: 安全漏洞、边界情况、逻辑一致性
**评审材料**: runtime-protection.md, bridge-normalize.ts, validateMode.ts, atomic-write.ts, state-manager

---

## 评分：2.5/5 (Conditional Pass - 需要重大改进)

**结论**: 系统存在多个 P0 级安全漏洞和逻辑不一致问题，必须在生产环境部署前修复。当前实现虽有安全意识，但执行不彻底，存在多处防护缺口。

---

## 1. 安全审计 (Security Audit - FAIL)

### 🔴 P0 - 严重安全漏洞

#### 1.1 permission-request 静默降级 (差异点 D-05)

**位置**: `src/hooks/persistent-mode/index.ts`

```typescript
// ❌ 当前实现：permission-request 失败时静默降级
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message | | undefined };
  // 注意：始终返回 { continue: true }，包括 permission-request 失败时
}
```

**风险等级**: 🔴 Critical
**影响**: 权限检查失败时系统继续执行，绕过安全边界
**攻击场景**:

* 恶意工具调用在权限被拒绝后仍然执行

* 敏感操作（文件删除、网络请求）未经授权执行

**修复要求**:
```typescript
// ✅ 必须实现
if (hookType === 'permission-request' && result.error) {
  return { continue: false, message: result.message };
}
```

---

#### 1.2 状态文件未加密 (P1 → P0 升级)

**位置**: `.omc/state/*.json`, `agent-replay-*.jsonl`

**当前状态**:

* 文件权限: `0o600` (仅所有者可读写) ✅

* 内容加密: ❌ 无

* 敏感数据: 包含代码片段、API 调用、可能的密钥片段

**风险等级**: 🔴 High
**攻击场景**:

* 磁盘被物理访问时，状态文件明文可读

* 备份系统可能泄露敏感上下文

* 多用户系统上，root 用户可读取所有状态

**修复建议**:
1. 对 `agent-replay-*.jsonl` 实施字段级加密（敏感字段：prompt、toolInput、toolOutput）
2. 使用用户密钥派生（基于 session_id + 机器标识）
3. 保留 7 天自动清理机制

---

#### 1.3 Windows 平台 rename 竞态条件

**位置**: `src/lib/atomic-write.ts`

**问题描述**:
```typescript
// Windows 上，如果目标文件被其他进程持有，renameSync 会失败
await fs.rename(tempPath, filePath);
```

**风险等级**: 🟡 Medium
**影响**:

* 并发写入时可能导致状态文件损坏

* `subagent-tracking.json` 在高并发场景下易受影响

**当前缓解措施**:

* `subagent-tracking.json` 使用文件锁 + debounce ✅

* 其他状态文件无额外保护 ❌

**修复建议**:

* 统一所有状态文件使用 debounce + 文件锁（技术债务 TD-4）

* Windows 平台增加重试机制（最多 3 次，间隔 50ms）

---

### 🟡 P1 - 中等安全风险

#### 1.4 非敏感 Hook 未知字段透传 (差异点 D-06)

**位置**: `src/hooks/bridge-normalize.ts:198-230`

**当前行为**:
```typescript
// 非敏感 hook：未知字段透传，仅记录 debug 警告
if (!isSensitive) {
  extra[key] = value;
  console.debug(`Unknown field "${key}" passed through`);
}
```

**风险**:

* 攻击者可注入未知字段污染内部状态

* 日志注入攻击（如果 key 包含控制字符）

**修复要求** (v2):

* 统一所有 15 类 HookType 使用严格白名单

* 未知字段一律丢弃，不透传

---

#### 1.5 Mode 参数校验覆盖不完整

**位置**: 多处状态文件路径拼接

**已防护**:

* `src/lib/validateMode.ts` 提供 `assertValidMode()` ✅

* 8 个合法 mode 值白名单 ✅

**未防护**:

* 部分旧代码直接拼接路径，未调用 `assertValidMode()` ❌

* 需要全代码库审计确保 100% 覆盖

**验证命令**:
```bash

# 查找未使用 assertValidMode 的路径拼接

grep -r "\.omc/state/\${" src/ | grep -v "assertValidMode"
```

---

## 2. 边界情况分析 (Edge Case Analysis)

### 🔴 Critical Edge Cases

#### 2.1 并发状态写入冲突

**场景**: 多个 agent 同时写入 `subagent-tracking.json`

**当前保护**:

* debounce (100ms) ✅

* flushInProgress Set ✅

* 文件锁 (PID:timestamp) ✅

* mergeTrackerStates 合并策略 ✅

**缺失保护**:

* 其他状态文件（`team-state.json`, `ralph-state.json`）无 debounce ❌

* 差异点 D-07: subagent-tracker 内部即时写入使用 `writeFileSync`，无原子保护

**测试覆盖**:

* `src/hooks/__tests__/compaction-concurrency.test.ts` ✅

* `src/hooks/subagent-tracker/__tests__/flush-race.test.ts` ✅

**风险**: 在 Team 模式下，5+ agents 并发写入可能导致状态丢失

---

#### 2.2 状态文件损坏恢复

**场景**: JSON 解析失败、部分写入、磁盘满

**当前处理**:
```typescript
// src/lib/atomic-write.ts: safeReadJson
export function safeReadJson<T>(filePath: string): T | null {
  // ENOENT 或 JSON.parse 失败时返回 null（不崩溃）
}
```

**问题**:

* 返回 `null` 后，调用方使用空状态初始化 ✅

* 但损坏文件未被备份，直接覆盖 ❌

* 无法事后分析损坏原因

**修复建议**:
```typescript
// 损坏文件重命名为 .corrupted.{timestamp}
if (parseError) {
  fs.renameSync(filePath, `${filePath}.corrupted.${Date.now()}`);
}
```

---

#### 2.3 极端输入处理

##### 空字符串 / 空对象

**测试覆盖**:

* `validateMode('')` → `false` ✅

* `normalizeHookInput({})` → `{}` ✅

##### 超大输入

**问题**:

* `assertValidMode()` 截断到 50 字符 ✅

* 但 Hook 输入未限制大小 ❌

* 恶意 1GB `tool_response` 可导致内存耗尽

**修复建议**:
```typescript
// bridge-normalize.ts 增加大小限制
const MAX_FIELD_SIZE = 10 * 1024 * 1024; // 10MB
if (typeof value === 'string' && value.length > MAX_FIELD_SIZE) {
  value = value.slice(0, MAX_FIELD_SIZE) + '...(truncated)';
}
```

##### Unicode / 控制字符

**未测试**:

* mode = `"auto\u0000pilot"` (null byte)

* hookType = `"setup\r\n-init"` (CRLF 注入)

---

#### 2.4 竞态条件

##### Session 隔离失效

**场景**: 两个 session 同时操作同一 mode 状态

**当前行为**:

* 会话级状态: `.omc/state/sessions/{sessionId}/` ✅

* 回退到全局状态: `.omc/state/{mode}-state.json` ❌

**问题**:

* 如果 sessionId 未传递，两个 session 共享同一状态文件

* 后写入覆盖先写入，导致状态丢失

**测试**: `src/hooks/persistent-mode/session-isolation.test.ts` ✅

---

### 🟡 Medium Edge Cases

#### 2.5 磁盘空间耗尽

**场景**: 原子写入时磁盘满

**当前处理**:
```typescript
// atomicWriteJson 会抛出异常
const fd = await fs.open(tempPath, "wx", 0o600);
await fd.write(jsonContent, 0, "utf-8"); // 可能失败
```

**问题**:

* 临时文件可能残留 ❌

* 无自动清理机制

**修复**:
```typescript
} catch (err) {
  // 清理临时文件
  try { fs.unlinkSync(tempPath); } catch {}
  throw err;
}
```

---

#### 2.6 时区 / 时间戳问题

**场景**: 跨时区协作、系统时间回拨

**当前实现**:

* 所有时间戳使用 `new Date().toISOString()` ✅

* UTC 时间，无时区问题 ✅

**潜在问题**:

* 系统时间回拨时，`started_at > completed_at` 可能为真

* 文件锁 stale 检测依赖时间戳，可能误判

---

## 3. 逻辑一致性 (Logical Consistency)

### 🔴 Critical Inconsistencies

#### 3.1 Hook 敏感级别不一致

**问题**: PRD 描述 3 类敏感 hook，实际实现 4 类

**PRD**: `permission-request`, `setup`, `session-end`
**实现**: `permission-request`, `setup-init`, `setup-maintenance`, `session-end`

**差异点 D-01**: `setup` 拆分为两个独立类型

**影响**:

* 文档与代码不一致，维护者困惑

* 如果新增 `setup-*` 类型，可能忘记加入 `SENSITIVE_HOOKS`

**修复**: 更新 PRD 或统一实现

---

#### 3.2 状态文件并发保护不统一

**问题**: 不同状态文件使用不同保护机制

| 文件 | 保护级别 |
| ------ | --------- |
| `subagent-tracking.json` | 四层保护（debounce + 锁 + 合并 + 原子写入） |
| `team-state.json` | 仅原子写入 |
| `ralph-state.json` | 仅原子写入 |

**差异点 D-07**: subagent-tracker 内部即时写入使用 `writeFileSync`

**影响**:

* 高并发场景下，`team-state.json` 更易损坏

* 维护者无法预测哪些文件需要额外保护

**修复**: 技术债务 TD-4 - 统一为 debounce + atomic

---

#### 3.3 错误处理策略不一致

**观察**:

* `safeReadJson()` 返回 `null`（不崩溃）✅

* `assertValidMode()` 抛出异常（崩溃）✅

* `normalizeHookInput()` 记录警告但继续（不崩溃）✅

**问题**:

* 无统一的错误处理哲学

* 部分函数静默失败，部分函数崩溃

* 调用方无法预测行为

**建议**:

* 制定错误处理规范：何时崩溃、何时降级、何时重试

* 文档化每个模块的错误策略

---

### 🟡 Medium Inconsistencies

#### 3.4 Mode 数量不一致

**差异点 D-03**: PRD 描述 7 个 mode，实际 8 个（含 `swarm`）

**影响**: 文档过时，新贡献者困惑

---

#### 3.5 测试覆盖不均衡

**统计**:

* 测试文件数: 231 个 ✅

* try-catch 块数: 999 个（227 个文件）✅

* 测试覆盖率: 未提供（估计 40-60%）❌

**问题**:

* 核心安全模块（`validateMode.ts`, `bridge-normalize.ts`）有测试 ✅

* 但边界情况测试不足（Unicode、超大输入、磁盘满）❌

* 集成测试覆盖不足（多 agent 并发、状态恢复）❌

---

## 4. 严重阻碍 (Major Blockers)

### 必须修复才能发布 (P0)

1. **permission-request 静默降级** (差异点 D-05)
   - 修复时间: 2 小时
   - 风险: 安全边界失效

1. **状态文件加密** (agent-replay-*.jsonl)
   - 修复时间: 1-2 天
   - 风险: 敏感数据泄露

1. **Mode 参数校验全覆盖审计**
   - 修复时间: 4 小时
   - 风险: 路径遍历攻击

### 应该修复 (P1)

1. **非敏感 Hook 白名单统一** (差异点 D-06)
   - 修复时间: 1 天
   - 风险: 字段注入攻击

1. **状态文件并发保护统一** (差异点 D-07, TD-4)
   - 修复时间: 2-3 天
   - 风险: 高并发下状态损坏

1. **超大输入限制**
   - 修复时间: 4 小时
   - 风险: 内存耗尽 DoS

---

## 5. 推荐改进 (Recommendations)

### 短期 (1-2 周)

1. **增加边界情况测试**
   - Unicode / 控制字符注入
   - 磁盘空间耗尽
   - 超大输入（1GB+ tool_response）

1. **状态文件损坏备份**
   - 损坏文件重命名为 `.corrupted.{timestamp}`
   - 保留最近 3 个损坏文件用于分析

1. **Windows 平台重试机制**
   - rename 失败时重试 3 次
   - 间隔 50ms

### 中期 (1-2 月)

1. **统一错误处理策略**
   - 制定规范文档
   - 审计所有 try-catch 块（999 个）

1. **集成测试增强**
   - 多 agent 并发场景（5+ agents）
   - 状态恢复流程（损坏、丢失、版本不兼容）

1. **安全审计自动化**
   - CI 检查 `.gitignore` 包含 `.omc/`
   - 静态分析检测未使用 `assertValidMode()` 的路径拼接

### 长期 (3-6 月)

1. **状态文件加密框架**
   - 字段级加密（敏感字段）
   - 密钥管理（用户密钥派生）

1. **监控与告警**
   - 状态文件损坏率监控
   - 并发冲突检测
   - 异常 mode 参数告警

---

## 6. 总结

**优点**:

* ✅ 核心安全机制已实现（mode 白名单、原子写入、文件权限）

* ✅ 有安全意识，文档完善（runtime-protection.md）

* ✅ 测试覆盖较好（231 个测试文件）

**缺点**:

* ❌ 执行不彻底，存在多处防护缺口

* ❌ 逻辑不一致，不同模块使用不同策略

* ❌ 边界情况测试不足

**最终评分**: 2.5/5 (Conditional Pass)

**发布建议**:

* 必须修复 3 个 P0 问题后才能发布生产环境

* P1 问题可在后续版本修复，但需在 CHANGELOG 中明确标注风险

* 建议进行外部安全审计（penetration testing）

---

**评审人**: The Critic (批判者)
**评审时间**: 2026-03-03 08:03 UTC
