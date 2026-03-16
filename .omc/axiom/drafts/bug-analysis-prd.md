# Draft PRD: ultrapower BUG 分析与修复建议

**生成时间**: 2026-03-15T03:29:00Z
**状态**: DRAFT
**优先级**: 仅分析，不实施修复

---

## 执行摘要

基于 `docs/BUG_ANALYSIS.md` 和代码审查，ultrapower v7.5.1 存在多个已知 BUG，涵盖 P0（严重）到 P2（低优先级）三个级别。本文档提供详细分析和修复建议。

---

## P0 级别 BUG（严重 - 可能导致数据丢失或安全问题）

### BUG-001: 状态文件竞态条件

**位置**: `src/state/index.ts`

**问题描述**:
StateManager 的 `writeSync` 方法缺乏并发保护机制。在 Team 模式下，多个 agent 同时写入状态文件时可能导致：
- JSON 格式损坏
- 部分写入覆盖
- 状态恢复失败

**影响范围**:
- Team 模式（3+ agents）
- 所有使用 `state_write` 的工作流
- 状态持久化可靠性

**复现条件**:
1. 启动 `/team 3:executor "task"`
2. 多个 agents 同时调用 `state_write`
3. 观察 `.omc/state/*.json` 文件损坏

**修复建议**:

1. **文件锁机制**
   ```typescript
   import { open } from 'fs/promises';
   
   async writeWithLock(data: T, sessionId?: string): Promise<void> {
     const path = this.getPath(sessionId);
     const fd = await open(path, 'w');
     try {
       await fd.lock();
       await fd.writeFile(JSON.stringify(data, null, 2));
     } finally {
       await fd.unlock();
       await fd.close();
     }
   }
   ```

2. **写入队列**
   ```typescript
   private writeQueue = new Map<string, Promise<void>>();
   
   async writeSync(data: T, sessionId?: string): boolean {
     const key = this.getPath(sessionId);
     const prev = this.writeQueue.get(key) || Promise.resolve();
     const next = prev.then(() => this.adapter.writeSync(data, sessionId));
     this.writeQueue.set(key, next);
     await next;
     this.writeQueue.delete(key);
     return true;
   }
   ```

3. **原子写入（write to temp + rename）**
   ```typescript
   writeSync(data: T, sessionId?: string): boolean {
     const path = this.getPath(sessionId);
     const temp = `${path}.tmp.${Date.now()}`;
     fs.writeFileSync(temp, JSON.stringify(data, null, 2));
     fs.renameSync(temp, path); // 原子操作
     return true;
   }
   ```

**优先级**: P0 - 立即修复
**影响范围**: Team 模式、Ralph 模式、所有并发写入场景

---

### BUG-002: Hook 输入验证绕过

**位置**: `src/hooks/bridge-normalize.ts:262-264`

**问题描述**:
快速路径（fast path）跳过了敏感 hook 的 Zod schema 验证。如果攻击者构造 camelCase 输入，可能绕过白名单检查。

**代码位置**:
```typescript
// Fast path for already-camelCase non-sensitive input
if (isAlreadyCamelCase(rawObj) && !isSensitive) {
  return normalizeFastPath(rawObj, hookType);
}
```

**影响**:
- 敏感 hook（permission-request、setup、session-end）的字段白名单可能被绕过
- 未经验证的字段可能注入到 hook 上下文
- 潜在的命令注入或路径遍历攻击

**复现步骤**:
1. 构造 camelCase 格式的恶意输入（例如 `{"maliciousField": "../../etc/passwd"}`）
2. 触发敏感 hook（如 permission-request）
3. 快速路径直接返回，跳过 Zod 验证

**修复建议**:

1. **移除快速路径或强制验证敏感 hook**
   ```typescript
   // 敏感 hook 始终走完整验证
   if (isSensitive) {
     return normalizeWithValidation(rawObj, hookType);
   }
   
   // 非敏感 hook 可以使用快速路径
   if (isAlreadyCamelCase(rawObj)) {
     return normalizeFastPath(rawObj, hookType);
   }
   ```

2. **在 normalizeFastPath 中添加白名单检查**
   ```typescript
   function normalizeFastPath(obj: any, hookType: HookType): any {
     const allowedFields = HOOK_FIELD_WHITELIST[hookType];
     const filtered = Object.keys(obj)
       .filter(k => allowedFields.includes(k))
       .reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {});
     return filtered;
   }
   ```

**优先级**: P0 - 立即修复（安全漏洞）
**影响范围**: 所有 hook 输入处理

---

### BUG-003: 关键词检测正则性能问题（ReDoS）

**位置**: `src/hooks/keyword-detector/index.ts:89-100`

**问题描述**:
`sanitizeForKeywordDetection` 使用复杂正则表达式，可能导致 ReDoS（Regular Expression Denial of Service）攻击。

**代码位置**:
```typescript
result = text.replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '');
```

**影响**:
- 恶意构造的长文本可能导致正则回溯爆炸
- 用户输入处理卡死，CPU 占用 100%
- 影响所有使用关键词检测的 skill 触发

**复现步骤**:
1. 构造嵌套 HTML 标签的长文本（例如 `<a><a><a>...<a>text</a>...</a></a></a>`，1000+ 层嵌套）
2. 提交到 Claude Code
3. keyword-detector hook 触发，正则引擎进入指数级回溯

**修复建议**:

1. **限制输入文本长度**
   ```typescript
   function sanitizeForKeywordDetection(text: string): string {
     const MAX_LENGTH = 10000;
     if (text.length > MAX_LENGTH) {
       text = text.slice(0, MAX_LENGTH);
     }
     // ... 继续处理
   }
   ```

2. **使用更简单的正则或状态机解析**
   ```typescript
   // 替换复杂正则为简单匹配
   result = text.replace(/<[^>]+>/g, ''); // 移除所有标签
   ```

3. **使用 HTML 解析器**
   ```typescript
   import { parse } from 'node-html-parser';
   
   function sanitizeForKeywordDetection(text: string): string {
     try {
       const root = parse(text);
       return root.textContent;
     } catch {
       return text; // 解析失败时回退
     }
   }
   ```

**优先级**: P1 - 尽快修复
**影响范围**: 所有关键词触发的 skill

---

### BUG-004: 状态文件泄漏

**位置**: `src/hooks/bridge.ts:50-78`

**问题描述**:
Hook 错误处理中没有清理状态文件，导致异常退出时状态文件未清理。

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
- 下次启动可能错误恢复到旧状态
- 磁盘空间浪费

**复现步骤**:
1. 启动 ralph 或 ultrawork 模式
2. 在执行过程中强制终止进程（Ctrl+C 或 kill）
3. 检查 `.omc/state/` 目录，发现状态文件未清理
4. 重新启动，可能错误恢复

**修复建议**:

1. **在 catch 块中调用 clearState**
   ```typescript
   } catch (error) {
     console.error(`[hook-bridge] Error in ${hookType}:`, error);
     
     // 清理状态文件
     if (mode) {
       try {
         await clearState(mode);
       } catch (cleanupError) {
         console.error(`Failed to cleanup state:`, cleanupError);
       }
     }
     
     return { continue: true };
   }
   ```

2. **添加启动时的陈旧状态清理逻辑**
   ```typescript
   // 在 session-start hook 中
   async function cleanupStaleStates() {
     const stateDir = '.omc/state';
     const files = await fs.readdir(stateDir);
     const now = Date.now();
     const MAX_AGE = 24 * 60 * 60 * 1000; // 24 小时
     
     for (const file of files) {
       const path = `${stateDir}/${file}`;
       const stat = await fs.stat(path);
       if (now - stat.mtimeMs > MAX_AGE) {
         await fs.unlink(path);
       }
     }
   }
   ```

**优先级**: P1 - 尽快修复
**影响范围**: 所有执行模式（ralph、ultrawork、team 等）

---

## P2 级别 BUG（中优先级 - 影响用户体验）

### BUG-005: 关键词冲突解决不完整

**位置**: `src/hooks/keyword-detector/index.ts:176-179`

**问题描述**:
只处理了 team vs autopilot 冲突，其他组合未处理。

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
- 用户困惑，不知道哪个模式会生效

**修复建议**:
添加完整的互斥规则表：
```typescript
const EXCLUSION_RULES = {
  team: ['autopilot', 'ultrapilot'],
  ultrapilot: ['autopilot', 'team'],
  autopilot: ['team', 'ultrapilot'],
  pipeline: ['team', 'swarm'],
};

function resolveConflicts(types: string[]): string[] {
  for (const [primary, excludes] of Object.entries(EXCLUSION_RULES)) {
    if (types.includes(primary)) {
      types = types.filter(t => !excludes.includes(t));
    }
  }
  return types;
}
```

**优先级**: P2 - 计划修复
**影响范围**: 关键词检测

---

### BUG-006: 空输入未处理

**位置**: `src/hooks/bridge.ts:104-110`

**问题描述**:
JSON 解析失败时使用空对象，但某些 hook 需要必需字段。

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
解析失败时返回错误而非静默使用空对象：
```typescript
try {
  input = JSON.parse(inputStr);
} catch (error) {
  console.error(`[hook-bridge] Invalid JSON input for ${hookType}`);
  return { 
    continue: false, 
    error: 'Invalid JSON input' 
  };
}

// 添加必需字段验证
const requiredFields = REQUIRED_FIELDS[hookType];
for (const field of requiredFields) {
  if (!(field in input)) {
    console.error(`[hook-bridge] Missing required field: ${field}`);
    return { 
      continue: false, 
      error: `Missing required field: ${field}` 
    };
  }
}
```

**优先级**: P2 - 计划修复
**影响范围**: 所有 hook 输入处理

---

## 总结与建议

### 严重问题（P0）- 需立即修复

1. **BUG-001**: 状态文件竞态条件 → 添加文件锁或写入队列
2. **BUG-002**: Hook 验证绕过 → 移除快速路径或强制验证敏感 hook

### 高优先级（P1）- 需尽快修复

3. **BUG-003**: ReDoS 攻击 → 限制输入长度或使用简单正则
4. **BUG-004**: 状态文件泄漏 → 添加清理逻辑

### 中优先级（P2）- 计划修复

5. **BUG-005**: 关键词冲突解决不完整 → 添加完整互斥规则表
6. **BUG-006**: 空输入未处理 → 添加必需字段验证

### 修复顺序建议

1. **第一阶段（本周）**: 修复 BUG-001 和 BUG-002（安全和数据完整性）
2. **第二阶段（下周）**: 修复 BUG-003 和 BUG-004（性能和资源管理）
3. **第三阶段（下月）**: 修复 BUG-005 和 BUG-006（用户体验改进）

### 测试建议

- 为每个 BUG 添加单元测试覆盖
- 添加并发写入压力测试（BUG-001）
- 添加恶意输入模糊测试（BUG-002、BUG-003）
- 添加异常退出恢复测试（BUG-004）

---

**文档状态**: DRAFT - 待用户确认
**下一步**: 用户确认后进入 `/ax-review` 专家评审阶段
