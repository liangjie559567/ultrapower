# ultrapower 潜在 BUG 分析报告

**生成时间**: 2026-03-12
**分析范围**: 核心模块代码审查

---

## P0 - 严重 BUG（可能导致数据丢失或系统崩溃）

### BUG-001: 状态文件竞态条件

**文件**: `src/state/index.ts`
**问题**: StateManager 的 `writeSync` 方法没有并发保护，多个 agent 同时写入可能导致状态损坏

**代码位置**:
```typescript
writeSync(data: T, sessionId?: string): boolean {
  return this.adapter.writeSync(data, sessionId);
}
```

**影响**:
- Team 模式下多个 agent 并发写入状态文件
- 可能导致 JSON 格式损坏
- 状态恢复失败

**复现步骤**:
1. 启动 team 模式，生成 3+ agents
2. 多个 agents 同时调用 `state_write`
3. 状态文件可能被部分写入覆盖

**修复建议**:
- 使用文件锁机制（flock）
- 实现写入队列
- 添加原子写入保证（write to temp + rename）

---

### BUG-002: Hook 输入验证绕过

**文件**: `src/hooks/bridge-normalize.ts:262-264`
**问题**: 快速路径跳过了敏感 hook 的 Zod 验证

**代码位置**:
```typescript
// Fast path for already-camelCase non-sensitive input
if (isAlreadyCamelCase(rawObj) && !isSensitive) {
  return normalizeFastPath(rawObj, hookType);
}
```

**影响**:
- 如果攻击者构造 camelCase 输入，可能绕过 Zod 验证
- 敏感 hook 的字段白名单可能被绕过

**修复建议**:
- 移除快速路径，或确保敏感 hook 始终走完整验证
- 在 `normalizeFastPath` 中添加白名单检查

---

## P1 - 高优先级 BUG（影响核心功能）

### BUG-003: 关键词检测正则性能问题

**文件**: `src/hooks/keyword-detector/index.ts:89-100`
**问题**: `sanitizeForKeywordDetection` 使用多个复杂正则，可能导致 ReDoS

**代码位置**:
```typescript
result = text.replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '');
```

**影响**:
- 恶意构造的长文本可能导致正则回溯爆炸
- 用户输入处理卡死

**修复建议**:
- 限制输入文本长度（如 10000 字符）
- 使用更简单的正则或状态机解析

---

### BUG-004: 状态文件泄漏

**文件**: `src/hooks/bridge.ts:50-78`
**问题**: Hook 错误处理中没有清理状态文件

**代码位置**:
```typescript
} catch (error) {
  console.error(`[hook-bridge] Error in ${hookType}:`, error);
  // ... 错误处理，但没有清理状态
  return { continue: true };
}
```

**影响**:
- 异常退出时状态文件未清理
- `.omc/state/` 目录累积陈旧状态
- 下次启动可能错误恢复

**修复建议**:
- 在 catch 块中调用 `clearState(mode)`
- 添加启动时的陈旧状态清理逻辑

---

## P2 - 中优先级 BUG（影响用户体验）

### BUG-005: 关键词冲突解决不完整

**文件**: `src/hooks/keyword-detector/index.ts:176-179`
**问题**: 只处理了 team vs autopilot 冲突，其他组合未处理

**代码位置**:
```typescript
// Mutual exclusion: team beats autopilot
if (types.includes('team') && types.includes('autopilot')) {
  types = types.filter(t => t !== 'autopilot');
}
```

**影响**:
- `ultrapilot` + `autopilot` 同时出现时行为未定义
- `pipeline` + `team` 同时出现时可能冲突

**修复建议**:
- 添加完整的互斥规则表
- 文档化所有冲突解决策略

---

### BUG-006: 空输入未处理

**文件**: `src/hooks/bridge.ts:104-110`
**问题**: JSON 解析失败时使用空对象，但某些 hook 需要必需字段

**代码位置**:
```typescript
try {
  input = JSON.parse(inputStr);
} catch {
  // Invalid JSON, use empty object
}
```

**影响**:
- 必需字段缺失时 hook 可能崩溃
- 错误信息不明确

**修复建议**:
- 解析失败时返回错误而非静默使用空对象
- 添加必需字段验证

---

## P3 - 低优先级问题（代码质量）

### ISSUE-001: 类型断言过多

**文件**: `src/hooks/bridge-normalize.ts:186-195`
**问题**: 大量使用 `as` 类型断言，绕过类型检查

**修复建议**: 使用类型守卫函数替代断言

---

### ISSUE-002: 错误日志不一致

**文件**: 多个文件
**问题**: 混用 `console.error`、`console.warn`、`console.debug`

**修复建议**: 统一使用 logger 模块

---

## 总结

**严重问题**: 2 个（需立即修复）
**高优先级**: 2 个（需尽快修复）
**中优先级**: 2 个（计划修复）
**低优先级**: 2 个（代码质量改进）

**最关键的修复**:
1. BUG-001: 添加状态文件并发保护
2. BUG-002: 修复敏感 hook 验证绕过
3. BUG-004: 添加状态文件清理逻辑
