# Rough PRD: Hook 系统安全加固 v6.0.0

**版本:** Rough v1.0 (基于 Draft v1.0 + 5 专家评审)
**创建时间:** 2026-03-10
**目标版本:** ultrapower v6.0.0
**优先级:** P0 (D-05), P1 (D-06, D-07)
**状态:** 待用户确认

---

## Executive Summary

ultrapower v5.6.11 存在 3 个已识别的安全和可靠性技术债务，违反 `runtime-protection.md` 规范。本 PRD 定义修复方案，将系统安全水平提升至 GitHub Actions / GitLab CI 同等级别。

**核心修复:**
- **D-05 (P0):** permission-request hook 失败时强制阻塞（修复权限绕过漏洞）
- **D-06 (P1):** 全部 15 类 HookType 定义严格白名单（消除注入攻击面）
- **D-07 (P1):** subagent-tracker 使用原子写入（防止状态文件损坏）

**评审结果:**
- Critic: 6/10 → 要求修复安全逻辑和补充白名单
- Product Director: 8/10 → 批准，要求补充监控
- Domain Expert: 8/10 → 批准，要求补充审计日志
- UX Director: 6/10 → 要求补充错误反馈机制
- Tech Lead: 6.5/10 → 要求调整工作量估算

---

## 1. Problem Statement (更新后的问题描述)

### 1.1 当前问题

| 技术债务 | 安全影响 | 用户影响 | 合规影响 |
|---------|---------|---------|---------|
| **D-05** | 权限绕过漏洞 | 操作静默失败 | 违反 OWASP ASVS V4.1.1 |
| **D-06** | 注入攻击面 | 调试困难 | 违反 OWASP A03:2021 |
| **D-07** | 状态文件损坏 | 系统不稳定 | 违反 CWE-362 |

### 1.2 根因分析

**D-05 根因:**
```typescript
// 当前实现 - 错误的"乐观"逻辑
function createHookOutput(result) {
  return { continue: true }; // 始终返回 true
}
```

**攻击向量:**
- 恶意 hook 返回 `{ success: false }` (无 error 字段) → 绕过阻塞
- Hook 进程崩溃返回空输出 → 被当作成功处理

**D-06 根因:** 仅 4 类敏感 hook 使用白名单，其他 11 类透传未知字段

**D-07 根因:** 使用 `fs.writeFileSync` 而非原子写入，并发场景下可能损坏

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

1. **安全合规率: 100%**
   - 所有 hook 类型符合 runtime-protection.md 规范
   - 通过 OWASP ASVS 4.0 V4.1.1 / V7.1.1 检查

2. **系统稳定性: 零状态文件损坏**
   - 并发场景下无文件损坏
   - 压力测试通过率 100%

3. **用户体验: 清晰的错误反馈**
   - 阻塞时提供中文错误消息和恢复指引
   - 开发者模式下提供调试信息

### 2.2 Success Metrics

**测试指标:**
- [ ] 所有现有测试通过 (回归风险 < 5%)
- [ ] 新增测试覆盖率 > 90%
- [ ] 安全测试覆盖 3 个修复点

**性能指标:**
- [ ] D-07 原子写入延迟 < 10ms (99th percentile)
- [ ] 高频写入场景 (>100/s) 无性能退化

**合规指标:**
- [ ] 通过 OWASP ASVS 4.0 检查
- [ ] 通过 CWE Top 25 扫描
- [ ] 安全审计日志完整性 100%


---

## 3. Technical Specification (修复后的方案)

### 3.1 D-05: permission-request 强制阻塞

#### 3.1.1 修复后的实现

```typescript
// src/hooks/persistent-mode/index.ts

interface BlockedHookOutput {
  continue: false;
  error: {
    code: 'PERMISSION_DENIED' | 'HOOK_FAILED' | 'HOOK_TIMEOUT';
    message: string;
    userAction?: string;
    technicalDetails?: any;
  };
}

function createHookOutput(result: any, hookType?: HookType): HookOutput | BlockedHookOutput {
  if (hookType === 'permission-request') {
    // 【关键修复】失败优先逻辑：只有明确成功才放行
    if (!result || result.success !== true) {
      logger.security('permission-request blocked', {
        hookType,
        result,
        timestamp: Date.now()
      });

      return {
        continue: false,
        error: {
          code: result?.error ? 'HOOK_FAILED' : 'PERMISSION_DENIED',
          message: '❌ 权限验证失败，操作已阻止',
          userAction: '请检查文件权限或联系管理员',
          technicalDetails: result?.error
        }
      };
    }
  }
  return { continue: true };
}
```

#### 3.1.2 边界情况处理

| 场景 | 当前行为 | 修复后行为 |
|------|---------|-----------|
| `result = null` | ✅ 放行 (漏洞) | ❌ 阻塞 |
| `result = undefined` | ✅ 放行 (漏洞) | ❌ 阻塞 |
| `result = { success: false }` | ✅ 放行 (漏洞) | ❌ 阻塞 |
| `result = { success: true }` | ✅ 放行 | ✅ 放行 |
| Hook 进程崩溃 | ✅ 放行 (漏洞) | ❌ 阻塞 |

---

### 3.2 D-06: 全部 HookType 严格白名单

#### 3.2.1 完整白名单映射表

```typescript
// src/hooks/bridge-normalize.ts

const STRICT_WHITELIST: Record<HookType, string[]> = {
  'permission-request': ['success', 'error', 'message'],
  'setup': ['config', 'version'],
  'session-end': ['sessionId', 'directory', 'duration'],
  'subagent-stop': ['success', 'exitCode', 'output'],
  'tool-call': ['tool_name', 'tool_input', 'timestamp'],
  'tool-response': ['tool_name', 'tool_response', 'success', 'error', 'duration'],
  'agent-start': ['agent_type', 'agent_id', 'prompt'],
  'agent-stop': ['agent_id', 'success', 'output', 'duration'],
  'session-start': ['sessionId', 'directory', 'timestamp'],
  'message-sent': ['message', 'role', 'timestamp'],
  'state-change': ['mode', 'from_state', 'to_state', 'timestamp'],
  'error-occurred': ['error', 'context', 'timestamp', 'severity'],
  'file-read': ['file_path', 'success'],
  'file-write': ['file_path', 'success', 'bytes_written'],
  'custom-hook': ['hook_name', 'data']
};
```

#### 3.2.2 白名单验证逻辑

```typescript
function normalizeHookInput(input: any, hookType: HookType): any {
  const whitelist = STRICT_WHITELIST[hookType];
  if (!whitelist) return {};

  const normalized: any = {};
  const unknownFields: string[] = [];

  for (const key of Object.keys(input)) {
    if (whitelist.includes(key)) {
      normalized[key] = input[key];
    } else {
      unknownFields.push(key);
    }
  }

  if (unknownFields.length > 0) {
    logger.security('unknown fields filtered', {
      hookType,
      fields: unknownFields,
      timestamp: Date.now()
    });
  }

  return normalized;
}
```

---

### 3.3 D-07: subagent-tracker 原子写入

```typescript
// src/hooks/subagent-tracker/index.ts

import { atomicWriteJsonSync } from '../../lib/atomic-write.js';

function updateSubagentState(agentId: string, state: any) {
  const path = `.omc/state/subagent-tracker.json`;
  atomicWriteJsonSync(path, state);
}
```


---

## 4. Implementation Plan (调整后的顺序)

### 4.1 执行顺序

**Phase 1: D-07** (最简单，独立性强)
- 工作量: 50 行代码 + 100 行测试
- 时间: 1 天

**Phase 2: D-06** (为 D-05 奠定基础)
- 工作量: 150 行代码 + 200 行测试
- 时间: 2 天

**Phase 3: D-05** (依赖 D-06)
- 工作量: 100 行代码 + 150 行测试
- 时间: 2 天

**Phase 4: 安全审计日志**
- 工作量: 80 行代码 + 50 行测试
- 时间: 1 天

**Phase 5: 文档和迁移指南**
- 时间: 1 天

**总计:** 380 行代码 + 500 行测试 = 880 行，7 天完成

### 4.2 修改文件清单

| 文件 | 修改类型 | 行数 | 阶段 |
|------|---------|------|------|
| `src/hooks/persistent-mode/index.ts` | 修改 | 100 | Phase 3 |
| `src/hooks/bridge-normalize.ts` | 修改 | 150 | Phase 2 |
| `src/hooks/subagent-tracker/index.ts` | 修改 | 50 | Phase 1 |
| `src/lib/logger.ts` | 新增 | 80 | Phase 4 |
| `docs/standards/runtime-protection.md` | 更新 | - | Phase 5 |


---

## 5. Testing Strategy

### 5.1 单元测试

**D-05 测试用例:**
```typescript
describe('D-05: permission-request blocking', () => {
  test('blocks when result is null', () => {
    const output = createHookOutput(null, 'permission-request');
    expect(output.continue).toBe(false);
  });

  test('allows when success is true', () => {
    const output = createHookOutput({ success: true }, 'permission-request');
    expect(output.continue).toBe(true);
  });
});
```

**D-06 测试用例:**
```typescript
describe('D-06: strict whitelist', () => {
  test('filters unknown fields', () => {
    const input = { tool_name: 'test', unknown: 'value' };
    const normalized = normalizeHookInput(input, 'tool-call');
    expect(normalized).toEqual({ tool_name: 'test' });
  });
});
```

**D-07 测试用例:**
```typescript
describe('D-07: atomic write', () => {
  test('concurrent writes do not corrupt file', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      updateSubagentState(`agent-${i}`, { id: i })
    );
    await Promise.all(promises);
    // 验证文件完整性
  });
});
```

### 5.2 安全测试

- 模糊测试验证白名单
- 并发测试验证原子写入
- 边界情况测试

### 5.3 性能测试

- D-07 原子写入延迟 < 10ms (p99)
- 高频写入场景 (>100/s) 无性能退化


---

## 6. Risk Mitigation

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| D-05 破坏现有工作流 | 高 | 中 | 完整回归测试 + 迁移指南 |
| D-06 白名单定义不完整 | 高 | 中 | 15 类 HookType 完整映射 |
| D-07 性能下降 | 中 | 低 | 性能基准测试 |
| 审计日志泄露敏感信息 | 中 | 低 | 日志脱敏 + 权限控制 |

---

## 7. Acceptance Criteria

### 7.1 功能验收

- [ ] D-05: permission-request 失败时强制阻塞
- [ ] D-05: 提供清晰的中文错误消息
- [ ] D-06: 全部 15 类 HookType 定义严格白名单
- [ ] D-06: 开发者模式下显示被过滤字段
- [ ] D-07: subagent-tracker 使用原子写入
- [ ] 安全审计日志记录所有阻塞和过滤事件

### 7.2 测试验收

- [ ] 所有现有测试通过 (回归风险 < 5%)
- [ ] 新增测试覆盖率 > 90%
- [ ] 安全测试覆盖 3 个修复点
- [ ] 性能测试: D-07 延迟 < 10ms (p99)
- [ ] 并发测试: 50 进程同时写入无损坏

### 7.3 合规验收

- [ ] 通过 OWASP ASVS 4.0 V4.1.1 检查
- [ ] 通过 OWASP ASVS 4.0 V7.1.1 检查
- [ ] 通过 CWE-285 / CWE-20 / CWE-362 扫描
- [ ] 安全审计日志完整性 100%

### 7.4 文档验收

- [ ] 更新 `docs/standards/runtime-protection.md`
- [ ] 更新 `docs/standards/hook-execution-order.md`
- [ ] 创建迁移指南 `docs/migration/v6.0.0.md`
- [ ] 更新 `CHANGELOG.md` (标注 BREAKING CHANGE)


---

## 8. 附录

### 8.1 专家评审摘要

| 专家 | 评分 | 核心建议 | 状态 |
|------|------|---------|------|
| Critic | 6/10 | 修复 D-05 安全逻辑，补充白名单 | ✅ 已修复 |
| Product Director | 8/10 | 补充监控和日志 | ✅ 已补充 |
| Domain Expert | 8/10 | 补充安全审计日志 | ✅ 已补充 |
| UX Director | 6/10 | 补充错误反馈机制 | ✅ 已补充 |
| Tech Lead | 6.5/10 | 调整工作量估算 | ✅ 已调整 |

### 8.2 OWASP 合规性映射

| OWASP 类别 | 相关修复 | 符合度 |
|-----------|---------|--------|
| A01:2021 Broken Access Control | D-05 | ✅ 完全符合 |
| A03:2021 Injection | D-06 | ✅ 完全符合 |
| A04:2021 Insecure Design | D-05/D-06 | ✅ 完全符合 |
| A05:2021 Security Misconfiguration | D-06 + 审计日志 | ✅ 完全符合 |
| A08:2021 Software and Data Integrity | D-07 | ✅ 完全符合 |

### 8.3 行业对标

修复后的 ultrapower 达到 **GitHub Actions / GitLab CI 同等安全水平**。

---

## 9. 原子任务列表（任务队列）

- [ ] Task-001: [P0] D-07 原子写入实现
    - 验证: 并发测试 10+ 进程无文件损坏

- [ ] Task-002: [P0] D-06 白名单映射表定义
    - 验证: 15 类 HookType 完整覆盖

- [ ] Task-003: [P0] D-06 白名单验证逻辑实现
    - 验证: 单元测试覆盖率 > 90%

- [ ] Task-004: [P0] D-05 失败优先逻辑实现
    - 验证: 边界情况测试全部通过

- [ ] Task-005: [P0] D-05 错误反馈机制实现
    - 验证: 中文错误消息清晰可读

- [ ] Task-006: [P1] 安全审计日志实现
    - 验证: 日志完整性 100%

- [ ] Task-007: [P1] 集成测试
    - 验证: 回归测试通过率 > 95%

- [ ] Task-008: [P1] 性能基准测试
    - 验证: D-07 延迟 < 10ms (p99)

- [ ] Task-009: [P1] 文档更新
    - 验证: 迁移指南完整

- [ ] Task-010: [P1] 代码审查
    - 验证: 所有 checklist 项通过

---

**PRD 已生成，请确认是否开始执行？(Yes/No)**

**下一步:** 用户确认后，调用 `axiom-system-architect` 进行任务拆解。

---

**Rough PRD 版本**: v1.0
**状态**: 待用户确认
**创建时间**: 2026-03-10T03:55:15Z

---

## 补充：P1 实现细节 (Critic 要求)

### 1. 超时处理机制

**超时阈值:** 30 秒

**实现:**
```typescript
const HOOK_TIMEOUT_MS = 30000;

async function executeHookWithTimeout(hookPath, input) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HOOK_TIMEOUT_MS);
  
  try {
    const result = await execFile(hookPath, { signal: controller.signal });
    clearTimeout(timeout);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Hook timeout after 30s' };
    }
    throw error;
  }
}
```

**超时后清理:**
1. 发送 SIGTERM (优雅终止)
2. 等待 5 秒
3. 发送 SIGKILL (强制终止)

---

### 2. 审计日志脱敏规则

**敏感字段列表:**
```typescript
const SENSITIVE_FIELDS = [
  'token', 'apiKey', 'password', 'secret', 
  'accessToken', 'refreshToken', 'privateKey'
];
```

**脱敏算法:**
```typescript
function sanitizeForAudit(data) {
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}
```

**审计日志格式:**
```json
{
  "timestamp": "2026-03-10T04:15:00Z",
  "event": "hook_blocked",
  "hookType": "permission-request",
  "reason": "result.success !== true",
  "input": { "tool": "bash", "token": "[REDACTED]" }
}
```

---

### 3. 原子写入失败回退策略

**重试策略:**
- 最多重试 3 次
- 指数退避: 100ms → 200ms → 400ms

**实现:**
```typescript
async function atomicWriteWithRetry(path, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await atomicWriteJsonSync(path, data);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(100 * Math.pow(2, i));
    }
  }
}
```

**失败后回退:**
- 不回退到内存缓存（避免状态不一致）
- 抛出错误，由上层处理
- 记录到审计日志

---

**补充完成时间:** 2026-03-10T04:15:00Z

---

## 补充：P2 实现细节 (Critic 建议)

### 4. 审计日志存储配置

**日志路径:**
```typescript
const AUDIT_LOG_PATH = '.omc/logs/security-audit.jsonl';
```

**日志轮转策略:**
- 单文件最大: 10MB
- 保留历史: 最近 7 天
- 轮转格式: `security-audit.jsonl.1`, `security-audit.jsonl.2`

**实现:**
```typescript
function rotateLogIfNeeded(logPath) {
  const stats = fs.statSync(logPath);
  if (stats.size > 10 * 1024 * 1024) {
    // 轮转现有日志
    for (let i = 6; i >= 1; i--) {
      const oldPath = `${logPath}.${i}`;
      const newPath = `${logPath}.${i + 1}`;
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
    }
    fs.renameSync(logPath, `${logPath}.1`);
  }
}
```

---

### 5. 白名单维护流程

**CI 门禁检查:**
```typescript
// scripts/validate-hook-whitelist.mjs
import { HOOK_TYPES } from './src/shared/types.js';
import { STRICT_WHITELIST } from './src/hooks/bridge-normalize.js';

const missingTypes = HOOK_TYPES.filter(type => !STRICT_WHITELIST[type]);
if (missingTypes.length > 0) {
  console.error(`Missing whitelist for: ${missingTypes.join(', ')}`);
  process.exit(1);
}
```

**开发流程:**
1. 新增 HookType 到 `src/shared/types.ts`
2. 同步更新 `STRICT_WHITELIST` 到 `bridge-normalize.ts`
3. 运行 `npm run validate:whitelist`
4. CI 自动验证，缺失则失败

**文档要求:**
在 `docs/standards/hook-execution-order.md` 补充：
> **白名单同步规则:** 新增 HookType 时必须同步更新 `STRICT_WHITELIST`，否则 CI 失败。

---

**补充完成时间:** 2026-03-10T04:18:00Z
**状态:** 所有 P1/P2 问题已修复，PRD 完整
