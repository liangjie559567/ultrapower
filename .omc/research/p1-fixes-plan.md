# P1 High 问题修复计划

**创建日期：** 2026-03-06
**状态：** 待审核

---

## P1-1: Hook 错误处理默认静默失败

### 问题分析

**当前行为：**
- 所有 hook 失败时返回 `{ continue: true }`
- 关键安全检查失败不会阻止操作
- 30+ 处返回点都是静默失败

**风险场景：**
```typescript
// 安全检查失败但继续执行
if (securityViolation) {
  return { continue: true };  // ❌ 应该阻止
}
```

### 修复策略

**方案 A：Hook 类型分级（推荐）**

定义 3 个安全级别：

```typescript
enum HookSeverity {
  CRITICAL = 'critical',  // 失败必须中断
  HIGH = 'high',          // 失败应该中断（可配置）
  LOW = 'low'             // 失败可以继续
}

const HOOK_SEVERITY: Record<HookType, HookSeverity> = {
  'permission-request': HookSeverity.CRITICAL,
  'pre-tool-use': HookSeverity.HIGH,
  'post-tool-use': HookSeverity.LOW,
  'subagent-start': HookSeverity.LOW,
  'subagent-stop': HookSeverity.LOW,
  'session-start': HookSeverity.LOW,
  'session-end': HookSeverity.LOW,
  'setup': HookSeverity.HIGH,
  'pre-compact': HookSeverity.LOW,
  'user-prompt-submit': HookSeverity.LOW,
  'stop': HookSeverity.LOW,
  'task-continuation': HookSeverity.LOW,
};
```

**实现步骤：**
1. 添加 `HookSeverity` 枚举和映射表
2. 修改 `HookOutput` 类型支持 `continue: false`
3. 为 CRITICAL hooks 返回 `continue: false`
4. 添加配置选项覆盖默认行为

**工作量：** 2-3 天

---

## P1-2: 输入验证不一致

### 问题分析

**当前状态：**
- 仅 4/12 hook 类型有必需字段校验
- 其他 8 个类型缺少验证

**已验证的类型：**
```typescript
// src/hooks/bridge-normalize.ts
case 'session-end':
  if (!input.sessionId || !input.directory) throw new Error('...');
case 'permission-request':
  if (!input.tool_name || !input.tool_input) throw new Error('...');
case 'setup':
  if (!input.directory) throw new Error('...');
case 'subagent-stop':
  // success 字段验证
```

### 修复策略

**方案：Zod Schema 验证**

```typescript
import { z } from 'zod';

const HookInputSchemas = {
  'session-start': z.object({
    sessionId: z.string().min(1),
    directory: z.string().min(1),
  }),
  'user-prompt-submit': z.object({
    message: z.string(),
    sessionId: z.string().optional(),
  }),
  'pre-tool-use': z.object({
    tool_name: z.string().min(1),
    tool_input: z.unknown(),
  }),
  // ... 其他 8 个类型
};

function validateHookInput(type: HookType, input: unknown): HookInput {
  const schema = HookInputSchemas[type];
  if (!schema) {
    throw new Error(`No schema defined for hook type: ${type}`);
  }
  return schema.parse(input);
}
```

**实现步骤：**
1. 为所有 12 个 hook 类型定义 Zod schema
2. 在 `normalizeHookInput` 中调用验证
3. 添加详细的错误消息
4. 更新测试用例

**工作量：** 1-2 天

---

## P1-3: Grep 命令路径转义问题

### 问题分析

**错误示例：**
```
grep: C:UsersljyihDesktop...: No such file or directory
正确应为：C:\Users\ljyih\Desktop\...
```

**根因：** Windows 反斜杠在 Bash 字符串中被剥离

### 修复策略

**方案：使用 Node.js 原生实现**

当前 Grep 工具可能调用 shell 命令，应改为纯 Node.js 实现：

```typescript
// 替代 shell grep
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function grepFiles(pattern: RegExp, directory: string): string[] {
  const results: string[] = [];

  function search(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        search(fullPath);
      } else if (entry.isFile()) {
        const content = readFileSync(fullPath, 'utf-8');
        if (pattern.test(content)) {
          results.push(fullPath);
        }
      }
    }
  }

  search(directory);
  return results;
}
```

**实现步骤：**
1. 检查当前 Grep 实现是否调用 shell
2. 如果是，替换为纯 Node.js 实现
3. 保持 API 兼容性
4. 添加性能测试

**工作量：** 1 天

**注意：** 需要先确认问题是否仍存在（错误日志已更新）

---

## P1-4: any 类型使用密度偏高

### 问题分析

**统计：**
- 总计：756 次
- 密度：0.86/文件
- 分布：测试 60%，MCP 20%，Logger 10%，其他 10%

### 修复策略

**方案：渐进式类型改进**

**优先级排序：**
1. **P0：** 生产代码中的 `Promise<any>` 返回值（0 次，已安全）
2. **P1：** 接口属性显式声明为 any（1 次）
3. **P2：** catch 块中的 `any`（3 次）
4. **P3：** 测试代码中的 any（~450 次，低优先级）

**实施计划：**

**阶段 1（1 周）：** 修复 P1 接口
```typescript
// src/cli/utils/formatting.ts
interface TableColumn {
  format?: any;  // ❌
}

// 改为
interface TableColumn {
  format?: (value: unknown) => string;  // ✅
}
```

**阶段 2（2 周）：** 修复 catch 块
```typescript
// 当前
catch (err: any) {
  console.error(err.message);
}

// 改为
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

**阶段 3（持续）：** 逐步减少测试代码中的 any

**工作量：** 持续重构，每周 2-3 小时

---

## P1-5: 缓存失效策略时间窗口漏洞

### 问题分析

**当前实现：**
```typescript
// src/tools/state-tools.ts
const CACHE_TTL_MS = 5000;  // 5 秒 TTL

function getCached(key: string): unknown | null {
  const entry = stateCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    stateCache.delete(key);
    return null;
  }
  return entry.data;  // 可能返回过期数据
}
```

**竞态场景：**
1. Agent A 在 T0 读取并缓存
2. Agent B 在 T1 写入，失效自己的缓存
3. Agent C 在 T2 读取，命中 Agent A 的缓存（过期数据）

### 修复策略

**方案 A：缩短 TTL（快速修复）**

```typescript
const CACHE_TTL_MS = 1000;  // 1 秒（从 5 秒缩短）
```

**优点：** 简单，立即生效
**缺点：** 仍有 1 秒窗口

**方案 B：禁用缓存（最安全）**

```typescript
// 完全移除缓存逻辑
function getCached(key: string): unknown | null {
  return null;  // 总是返回 null，强制重新读取
}
```

**优点：** 无竞态风险
**缺点：** 性能下降（需要测试影响）

**方案 C：文件监控失效（最优）**

```typescript
import { watch } from 'fs';

const watchers = new Map<string, FSWatcher>();

function watchStateFile(path: string, cacheKey: string) {
  if (watchers.has(path)) return;

  const watcher = watch(path, () => {
    invalidateCache(cacheKey);
  });

  watchers.set(path, watcher);
}
```

**优点：** 实时失效，无时间窗口
**缺点：** 复杂度增加，需要清理 watchers

### 推荐方案

**短期（立即）：** 方案 A - 缩短 TTL 至 1 秒
**中期（1 个月）：** 方案 C - 文件监控失效

**工作量：**
- 方案 A：5 分钟
- 方案 C：2-3 天

---

## 修复优先级

| 问题 | 优先级 | 工作量 | 风险 | 建议时间 |
|------|--------|--------|------|---------|
| P1-5 缓存 TTL | 🔴 High | 5 分钟 | 低 | 立即 |
| P1-3 Grep 路径 | 🟡 Medium | 1 天 | 中 | 1 周内 |
| P1-2 输入验证 | 🟡 Medium | 1-2 天 | 低 | 2 周内 |
| P1-1 错误处理 | 🟠 Low | 2-3 天 | 高 | 1 个月内 |
| P1-4 any 类型 | 🟢 Low | 持续 | 低 | 持续重构 |

---

## 下一步行动

### 立即执行（今天）
1. ✅ 缩短缓存 TTL 至 1 秒（P1-5 方案 A）

### 本周执行
2. 验证 Grep 路径问题是否仍存在（P1-3）
3. 如果存在，实施 Node.js 原生实现

### 两周内执行
4. 实施 Zod schema 验证（P1-2）
5. 修复接口中的 any（P1-4 阶段 1）

### 一个月内执行
6. 设计 Hook 错误处理分级方案（P1-1）
7. 与团队讨论破坏性变更策略

---

**计划创建者：** Claude (Sonnet 4.6)
**审核状态：** 待用户确认
