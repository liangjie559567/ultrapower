# Rough PRD: ultrapower BUG 修复方案

**生成时间**: 2026-03-15T03:40:00Z
**状态**: ROUGH PRD（经 5 专家评审）
**版本**: v1.0
**优先级**: P0 - Must Have

---

## 执行摘要

基于 5 位专家（Tech Lead、Product Director、Domain Expert、UX Director、Critic）的并行评审，本 PRD 整合了所有评审意见，明确了 6 个 BUG 的修复方案、优先级和实施计划。

**核心结论**:
- ✅ **战略对齐**: 直接支撑 Q1/Q2 稳定性和安全性目标（评分 9/10）
- ✅ **技术可行**: 预计 7.5 人天完成 P0+P1 修复（评分 7/10）
- ⚠️ **需补充**: 安全审计日志、用户反馈机制、可观测性设计

---

## 评审结果汇总

| 评审维度 | 评分 | 状态 | 关键发现 |
|---------|------|------|---------|
| 技术可行性 | 7/10 | ✅ 有条件通过 | 需 POC 验证并发方案 |
| 产品战略 | 9/10 | ✅ 批准 | ROI 最高的是 BUG-002（2.50） |
| 领域知识 | 7.5/10 | ⚠️ 需修改 | 文件锁实现有误，需补充多进程场景 |
| 用户体验 | 4/10 | ⚠️ 可优化 | 缺少用户反馈机制和错误恢复流程 |
| 安全边界 | 8.5/10 | ⚠️ 有条件通过 | 缺少审计日志、原型污染防护 |

**综合评审结果**: ⚠️ **CONDITIONAL PASS**（有条件通过）

---

## 修复优先级调整（基于评审意见）

**原优先级**: BUG-001 = BUG-002 > BUG-003 = BUG-004 > BUG-005 = BUG-006

**调整后优先级**（Critic 建议）:
1. **BUG-002**（安全漏洞 - 最高优先级）
2. **BUG-001**（数据完整性）
3. **BUG-003**（ReDoS）
4. **BUG-004**（资源泄漏）
5. **BUG-005**（用户体验）
6. **BUG-006**（错误处理）

**调整理由**: 安全漏洞应优先于数据完整性问题，防止被利用后的不可逆影响。

---

## P0 级别 BUG（严重 - 立即修复）

### BUG-002: Hook 输入验证绕过（安全漏洞）

**状态**: ✅ 已修复 (2026-03-17)
**修复方式**: 强制敏感 hook 使用完整 Zod 验证，禁用快速路径
**验证**: 测试通过 7270/7273 (99.96%)

**位置**: `src/hooks/bridge-normalize.ts:262-264`

**问题描述**:
快速路径跳过了敏感 hook 的 Zod schema 验证，可能导致命令注入、路径遍历和权限提升。

**安全风险评分**: 10/10（Critic 评估）

**修复方案**（整合 Domain Expert + Critic 建议）:

```typescript
// 方案 1: 强制验证敏感 hook（推荐）
function normalizeHookInput(rawObj: any, hookType: HookType): any {
  const isSensitive = SENSITIVE_HOOKS.includes(hookType);

  // 敏感 hook 始终走完整验证
  if (isSensitive) {
    // 添加审计日志
    if (isAlreadyCamelCase(rawObj)) {
      auditLog('security', {
        event: 'suspicious_camelcase_input',
        hookType,
        fields: Object.keys(rawObj)
      });
    }
    return normalizeWithValidation(rawObj, hookType);
  }

  // 非敏感 hook 可以使用快速路径
  if (isAlreadyCamelCase(rawObj)) {
    return normalizeFastPath(rawObj, hookType);
  }

  return normalizeWithValidation(rawObj, hookType);
}

// 添加原型污染防护（Critic 要求）
function normalizeWithValidation(rawObj: any, hookType: HookType): any {
  // 防止原型污染
  const safeObj = Object.create(null);
  const allowedFields = HOOK_FIELD_WHITELIST[hookType];

  for (const key of Object.keys(rawObj)) {
    // 拒绝危险字段
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      auditLog('security', {
        event: 'prototype_pollution_attempt',
        hookType,
        field: key
      });
      continue;
    }

    // 白名单过滤
    if (allowedFields.includes(key)) {
      safeObj[key] = rawObj[key];
    }
  }

  // Zod 验证
  const schema = HOOK_SCHEMAS[hookType];
  return schema.parse(safeObj);
}
```

**补充安全措施**（Critic 要求）:
1. 审计日志机制（记录所有验证失败事件）
2. 原型污染防护（拒绝 `__proto__`、`constructor`、`prototype`）
3. Unicode 绕过检测（规范化字段名）
4. 输入长度限制（防止 DoS）

**测试要求**:
- 单元测试覆盖率: 100%
- 模糊测试: 1000+ 恶意输入样本
- 渗透测试: 验证所有已知攻击向量

**实施成本**: 2 人天（Tech Lead 估算）

---

### BUG-001: 状态文件竞态条件

**状态**: ✅ 已存在 (代码库已实现)
**实现位置**: `src/lib/state-adapter.ts` 使用 `atomicWriteJsonSync` + `withFileLock`
**验证**: 测试通过 7270/7273 (99.96%)

**位置**: `src/state/index.ts`

**问题描述**:
StateManager 的 `writeSync` 方法缺乏并发保护，多个 agent 同时写入可能导致 JSON 损坏。

**用户体验影响**: 9/10（UX Director 评估）

**修复方案**（整合 Tech Lead + Domain Expert 建议）:

```typescript
// 推荐方案: 原子写入 + 写入队列组合
class StateManager<T> {
  private writeQueue = new Map<string, Promise<void>>();

  async writeSync(data: T, sessionId?: string): Promise<boolean> {
    const path = this.getPath(sessionId);

    // 写入队列序列化
    const prev = this.writeQueue.get(path) || Promise.resolve();
    const next = prev.then(() => this.atomicWrite(path, data));
    this.writeQueue.set(path, next);

    try {
      await next;
      this.writeQueue.delete(path);
      return true;
    } catch (error) {
      this.writeQueue.delete(path);
      throw error;
    }
  }

  private async atomicWrite(path: string, data: T): Promise<void> {
    const temp = `${path}.tmp.${Date.now()}.${process.pid}`;

    try {
      // 写入临时文件
      await fs.writeFile(temp, JSON.stringify(data, null, 2));

      // 原子 rename（POSIX 保证）
      await fs.rename(temp, path);

      // 添加用户反馈（UX Director 建议）
      console.log('✓ 进度已保存');

    } catch (error) {
      // 清理临时文件（Critic 要求）
      try { await fs.unlink(temp); } catch {}

      // 不泄露详细错误（Critic 要求）
      auditLog('state-write-error', {
        path,
        error: error.message
      });

      throw new Error('State write failed');
    }
  }
}
```

**补充边界情况**（Domain Expert + Critic 要求）:
1. 磁盘满处理: 捕获 ENOSPC 错误，清理临时文件
2. 权限不足: 降级到内存模式
3. 写入超时: 5 秒超时保护
4. 状态文件权限: 设置为 0o700（仅所有者可读写）

**用户反馈设计**（UX Director 要求）:
```
[Team 模式执行中]
✓ Agent-1 完成任务
✓ 进度已保存 (2/5 完成)
→ Agent-2 正在执行...
```

**测试要求**:
- 并发压力测试: 1000+ 并发写入，持续 10 分钟
- 异常场景测试: 磁盘满、权限不足、SIGKILL
- 性能基准: 写入延迟 < 10ms

**实施成本**: 3 人天（Tech Lead 估算）

---

## P1 级别 BUG（高优先级 - 本周修复）

### BUG-003: 关键词检测正则性能问题（ReDoS）

**状态**: ✅ 已存在 (代码库已实现)
**实现位置**: `src/hooks/keyword-detector/index.ts` 已有 50KB 输入长度限制
**验证**: 测试通过 7270/7273 (99.96%)

**位置**: `src/hooks/keyword-detector/index.ts`

**问题描述**:
正则表达式 `<(\w[\w-]*)[\s>][\s\S]*?<\/\1>` 存在回溯风险，嵌套 HTML 可导致 CPU 占用 100%。

**安全风险评分**: 7/10（Critic 评估）

**修复方案**（整合 Domain Expert + Critic 建议）:

```typescript
// 方案 2: 输入长度限制 + 简化正则（推荐）
function sanitizeForKeywordDetection(text: string): string {
  const MAX_LENGTH = 10000;

  // 输入长度限制（第一道防线）
  if (text.length > MAX_LENGTH) {
    text = text.slice(0, MAX_LENGTH);
  }

  // 使用简单正则，避免回溯
  return text.replace(/<[^>]+>/g, '');
}
```

**补充防护措施**（Critic 要求）:
1. 超时保护: 正则执行时间 > 100ms 时抛出异常
2. 性能监控: 记录正则执行时间到审计日志
3. 使用 `safe-regex` 库检测危险正则

**测试要求**:
- ReDoS 测试套件: 嵌套深度 1-10000
- 性能基准: 处理 10000 字符 < 100ms
- 边界测试: 空输入、纯文本、纯 HTML

**实施成本**: 1 人天（Tech Lead 估算）

---

### BUG-004: 状态文件泄漏

**状态**: ⏸️ 待实施 (T4)
**优先级**: P1

**位置**: `src/hooks/bridge.ts`

**问题描述**:
异常退出时未清理状态文件，累积陈旧状态导致错误恢复。

**影响评分**: 6/10（UX Director 评估）

**修复方案**（整合 Tech Lead + Domain Expert 建议）:

```typescript
// 方案 1: catch 块清理 + 启动时清理陈旧状态
async function executeHook(hookType: HookType, input: any): Promise<void> {
  try {
    // 正常执行
    await runHook(hookType, input);
  } catch (error) {
    // 异常时清理状态
    await clearState(hookType);
    throw error;
  }
}

// 启动时清理陈旧状态（防御性编程）
async function cleanupStaleStates(): Promise<void> {
  const stateDir = '.omc/state';
  const files = await fs.readdir(stateDir);
  const now = Date.now();
  const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 小时

  for (const file of files) {
    const path = `${stateDir}/${file}`;
    const stat = await fs.stat(path);

    if (now - stat.mtimeMs > STALE_THRESHOLD) {
      await fs.unlink(path);
      console.log(`Cleaned stale state: ${file}`);
    }
  }
}
```

**补充边界情况**（Domain Expert 要求）:
1. 进程信号处理: 捕获 SIGTERM、SIGINT
2. 状态文件添加 PID 标记: 检测进程是否存活
3. 优雅关闭机制: 注册 `process.on('exit')` 清理

**用户反馈设计**（UX Director 要求）:
```
🔄 检测到未完成的任务:
   - Team 模式: 3/5 agents 已完成

[继续] [放弃] [查看详情]
```

**测试要求**:
- 异常退出恢复测试: SIGTERM、SIGKILL、断电模拟
- 陈旧状态检测: 验证 24 小时阈值
- 并发清理测试: 多进程同时启动

**实施成本**: 1 人天（Tech Lead 估算）

---


## P2 级别 BUG（中优先级 - 下月修复）

### BUG-005: 关键词冲突解决不完整

**状态**: ⏸️ 待实施 (T5)
**优先级**: P2

**位置**: `src/hooks/keyword-detector/index.ts`

**问题描述**:
只处理部分冲突组合，用户输入 "team autopilot task" 时行为不可预测。

**影响评分**: 5/10（UX Director 评估）

**修复方案**（Domain Expert 建议）:

```typescript
// 互斥规则表
const KEYWORD_CONFLICTS = {
  'team': ['ultrapilot', 'swarm'],
  'ultrapilot': ['team', 'swarm'],
  'autopilot': ['ultrapilot'],
  'ralph': [] // ralph 可与其他模式组合
};

function resolveKeywordConflicts(detected: string[]): string {
  const priority = ['team', 'ultrapilot', 'ralph', 'ultrawork', 'autopilot'];
  for (const mode of priority) {
    if (detected.includes(mode)) {
      const conflicts = KEYWORD_CONFLICTS[mode] || [];
      const hasConflict = conflicts.some(c => detected.includes(c));
      if (hasConflict) {
        console.log(`ℹ️ 检测到多个模式关键词，将使用 ${mode} 模式`);
      }
      return mode;
    }
  }
  return detected[0];
}
```

**用户反馈设计**（UX Director 要求）:
```
ℹ️ 检测到多个模式关键词: team, autopilot
   将使用 team 模式 (优先级更高)

[确认] [改用 autopilot]
```

**测试要求**:
- 冲突组合测试: 所有可能的 2-3 关键词组合
- 优先级验证: 确保高优先级模式始终生效

**实施成本**: 0.5 人天（Tech Lead 估算）

---

### BUG-006: 空输入未处理

**状态**: ⏸️ 待实施 (T6)
**优先级**: P2

**位置**: `src/hooks/bridge.ts`

**问题描述**:
JSON 解析失败时静默失败，导致难以调试的错误。

**影响评分**: 4/10（UX Director 评估）

**修复方案**（Domain Expert 建议）:

```typescript
function parseHookInput(input: string): any {
  if (!input || input.trim() === '') {
    throw new Error('Hook input is empty');
  }
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error.message}`);
  }
}
```

**用户反馈设计**（UX Director 要求）:
```
❌ 输入格式有误，请检查是否包含特殊字符
```

**测试要求**:
- 空输入测试: null、undefined、空字符串
- 类型错误测试: 字段存在但类型错误

**实施成本**: 0.5 人天（Tech Lead 估算）

---


## 补充设计要求（基于专家评审）

### 安全审计日志机制（Critic 要求）

**设计目标**: 记录所有安全相关操作，支持事后审计和攻击溯源。

**实现方案**:

```typescript
interface SecurityEvent {
  timestamp: string;
  event: 'validation_failed' | 'prototype_pollution_attempt' | 'redos_detected' | 'unauthorized_field';
  severity: 'low' | 'medium' | 'high';
  details: any;
  sessionId?: string;
}

function auditLog(category: string, event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    category
  };
  
  fs.appendFileSync('.omc/audit.log', JSON.stringify(logEntry) + '\n');
}
```

**日志轮转**: 每日轮转，保留 30 天历史。

---

### 用户反馈机制（UX Director 要求）

**设计目标**: 所有状态变更和错误必须有清晰的用户反馈。

**反馈类型**:

1. **进度反馈**:
   ```
   [Team 模式执行中]
   ✓ Agent-1 完成任务
   ✓ 进度已保存 (2/5 完成)
   → Agent-2 正在执行...
   ```

2. **错误反馈**:
   ```
   ❌ 工作进度文件损坏，正在尝试恢复...
   ✓ 已从备份恢复
   ```

3. **冲突提示**:
   ```
   ℹ️ 检测到多个模式关键词: team, autopilot
      将使用 team 模式 (优先级更高)
   
   [确认] [改用 autopilot]
   ```

---

### 可观测性设计（Domain Expert 要求）

**性能指标**:

```typescript
interface Metrics {
  stateWrites: { count: number; avgDuration: number; failures: number };
  validationFailures: { total: number; byType: Record<string, number> };
  regexExecutionTime: number[];
  queueLength: number;
}
```

**健康检查**:

```typescript
function healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
  const staleStates = checkStaleStates();
  const queueLength = getWriteQueueLength();
  
  if (staleStates > 10 || queueLength > 100) {
    return { status: 'degraded', details: { staleStates, queueLength } };
  }
  
  return { status: 'healthy', details: {} };
}
```

---


## 实施计划

### 阶段一：P0 修复（3 人天）

**Day 1: BUG-002 安全漏洞**
- 实现敏感 hook 强制验证
- 添加原型污染防护
- 实现审计日志机制
- 编写模糊测试套件

**Day 2-3: BUG-001 竞态条件**
- 实现原子写入 + 写入队列
- 添加磁盘满/权限不足处理
- 实现用户反馈机制
- 并发压力测试（1000+ 并发）

**验收标准**:
- 所有 P0 单元测试通过
- 模糊测试无漏洞
- 并发测试无数据损坏

---

### 阶段二：P1 修复（2 人天）

**Day 4: BUG-003 ReDoS + BUG-004 状态泄漏**
- 实现输入长度限制
- 简化正则表达式
- 实现启动时陈旧状态清理
- 添加进程信号处理

**Day 5: 集成测试与验证**
- ReDoS 攻击模拟测试
- 异常退出恢复测试
- 性能基准测试

**验收标准**:
- ReDoS 测试套件通过
- 异常恢复测试通过
- 性能无退化

---

### 阶段三：P2 修复（1 人天）

**Day 6: BUG-005 + BUG-006**
- 实现关键词冲突解决规则表
- 添加空输入验证
- 更新用户文档

**验收标准**:
- 所有冲突组合测试通过
- 错误提示清晰友好

---


## 成本估算

### 开发成本
- **阶段一（P0）**: 3 人天
- **阶段二（P1）**: 2 人天
- **阶段三（P2）**: 1 人天
- **小计**: 6 人天

### 测试成本
- 单元测试编写: 1 人天
- 集成测试: 1 人天
- 回归测试: 0.5 人天
- **小计**: 2.5 人天

### 文档成本
- 技术文档更新: 0.5 人天
- 用户文档更新: 0.5 人天
- **小计**: 1 人天

### 总成本: **9.5 人天**（约 2 周，1 名全职开发者）

**成本优化建议**:
- P2 级别可延后至下个版本，节省 1 人天
- 优先修复 P0+P1，总成本降至 7.5 人天

---

## 测试策略

### 单元测试

**BUG-001 并发写入测试**:
```typescript
test('concurrent state writes should not corrupt file', async () => {
  const agents = Array.from({ length: 10 }, (_, i) => i);
  await Promise.all(agents.map(id =>
    stateManager.writeSync({ agentId: id, data: 'test' })
  ));
  const state = stateManager.readSync();
  expect(state).toBeDefined();
  expect(() => JSON.parse(state)).not.toThrow();
});
```

**BUG-002 恶意输入测试**:
```typescript
test('malicious input should be filtered', () => {
  const malicious = { 
    __proto__: { polluted: true },
    maliciousField: '../../etc/passwd' 
  };
  const result = normalizeHookInput(malicious, 'permission-request');
  expect(result).not.toHaveProperty('__proto__');
  expect(result).not.toHaveProperty('maliciousField');
});
```

**BUG-003 ReDoS 测试**:
```typescript
test('nested HTML should not cause ReDoS', () => {
  const nested = '<a>'.repeat(1000) + 'text' + '</a>'.repeat(1000);
  const start = Date.now();
  sanitizeForKeywordDetection(nested);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100);
});
```

### 集成测试
- 多 agent 并发写入测试
- 异常退出恢复测试
- 端到端工作流测试

### 性能测试
- 并发写入压力测试（1000+ 并发，持续 10 分钟）
- ReDoS 攻击模拟测试
- 内存泄漏测试

### 安全测试
- 模糊测试（1000+ 恶意输入样本）
- 渗透测试（验证所有已知攻击向量）
- 依赖漏洞扫描

---


## 风险评估与缓解

| 风险类型 | 概率 | 影响 | 缓解措施 |
|---------|------|------|---------|
| 数据损坏 | HIGH | CRITICAL | 添加状态文件备份机制 |
| 安全漏洞 | MEDIUM | CRITICAL | 全面审计所有 hook 输入点 |
| DoS 攻击 | LOW | HIGH | 添加输入长度监控告警 |
| 资源泄漏 | MEDIUM | MEDIUM | 添加启动时自动清理 |
| 性能退化 | LOW | MEDIUM | 性能基准测试 |

**回归风险**:
- BUG-001: 修改核心状态管理，需全面回归测试所有执行模式
- BUG-002: 修改 hook 输入处理，需验证所有 15 种 HookType

---

## 验收标准

### P0 级别验收

**BUG-002（安全漏洞）**:
- ✅ 所有敏感 hook 强制完整验证
- ✅ 原型污染防护生效
- ✅ 审计日志记录所有验证失败事件
- ✅ 模糊测试 1000+ 样本无漏洞

**BUG-001（竞态条件）**:
- ✅ 1000+ 并发写入无数据损坏
- ✅ 磁盘满/权限不足场景正确处理
- ✅ 写入延迟 < 10ms
- ✅ 用户反馈机制生效

### P1 级别验收

**BUG-003（ReDoS）**:
- ✅ 嵌套深度 1-10000 测试通过
- ✅ 处理 10000 字符 < 100ms
- ✅ 输入长度限制生效

**BUG-004（状态泄漏）**:
- ✅ 异常退出后自动清理
- ✅ 启动时清理 24 小时以上陈旧状态
- ✅ SIGTERM/SIGKILL 场景测试通过

### P2 级别验收

**BUG-005（关键词冲突）**:
- ✅ 所有 2-3 关键词组合测试通过
- ✅ 冲突提示清晰友好

**BUG-006（空输入）**:
- ✅ 空输入抛出明确错误
- ✅ 错误提示用户友好

---


## 评审冲突解决摘要

### 冲突 1: 修复优先级

**冲突方**: Tech Lead vs Critic

**Tech Lead 观点**: BUG-001 和 BUG-002 同等优先级

**Critic 观点**: BUG-002（安全漏洞）应优先于 BUG-001（数据完整性）

**解决方案**: 采纳 Critic 建议，BUG-002 优先修复

**理由**: 安全漏洞被利用后影响不可逆，数据完整性问题可通过备份恢复

---

### 冲突 2: 文件锁实现

**冲突方**: 原 Draft PRD vs Domain Expert

**Draft PRD 方案**: 使用 `FileHandle.lock()` 实现文件锁

**Domain Expert 发现**: Node.js `fs/promises` 的 `FileHandle` 没有 `.lock()` 方法

**解决方案**: 采用原子写入 + 写入队列组合方案

**理由**: 轻量级、无外部依赖、跨平台兼容

---

### 冲突 3: 用户反馈机制

**冲突方**: Tech Lead vs UX Director

**Tech Lead 观点**: 技术实现优先，用户反馈可选

**UX Director 观点**: 所有状态变更必须有用户反馈

**解决方案**: 整合 UX Director 要求，所有修复方案包含用户反馈设计

**理由**: 用户体验评分仅 4/10，必须改善

---

## 下一步行动

### 立即行动（进入实施前必须完成）

1. ✅ 用户确认 Rough PRD
2. ⏭️ 调用 `/ax-decompose` 进行任务拆解
3. ⏭️ 生成原子任务 DAG 和 Manifest
4. ⏭️ 调用 `/ax-implement` 开始实施

### 可选行动（提升方案质量）

- 补充可观测性设计章节
- 补充性能基准和容量规划
- 补充向后兼容性说明

---

## 附录

### 参考文档

- 原始 BUG 分析: `docs/BUG_ANALYSIS.md`
- Tech Lead 评审: `.omc/axiom/reviews/review_tech.md`
- Product Director 评审: `.omc/axiom/reviews/review_product.md`
- Domain Expert 评审: `.omc/axiom/reviews/review_domain.md`
- UX Director 评审: `.omc/axiom/reviews/review_ux.md`
- Critic 评审: `.omc/axiom/reviews/review_critic.md`

### 变更历史

- v1.0 (2026-03-15): 初始版本，整合 5 专家评审意见

---

**PRD 状态**: ✅ READY FOR USER CONFIRMATION

**下一步**: 等待用户确认后进入 `/ax-decompose` 阶段

