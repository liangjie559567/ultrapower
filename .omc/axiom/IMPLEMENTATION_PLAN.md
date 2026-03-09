# ultrapower v5.5.18 修复实施计划

**计划日期**: 2026-03-05
**目标版本**: v5.6.0
**预计总工时**: 165 小时
**预计完成时间**: 12 周

---

## 执行摘要

基于5维度并行审查（代码质量、安全、性能、API、代码风格），共发现 **181个问题**：

* Critical: 15个（P0 阻塞发布）

* High: 20个（P1 短期修复）

* Medium: 116个（P2 中期改进）

* Low: 30个（P3 长期优化）

**核心目标**：
1. 修复所有 P0 问题（6个），确保系统稳定性和安全性
2. 完成 P1 性能优化（3个），提升 40-60% 性能
3. 改进 P1 代码质量和 API 设计（7个）
4. 逐步处理 P2 问题，提升整体质量

**预期收益**：

* 消除内存泄漏和数据损坏风险

* 性能提升 40-60%（文件 I/O、Hook 处理、数据库查询）

* API 类型安全性提升

* 代码可维护性显著改善

---

## 问题分布与优先级

| 优先级 | 数量 | 工时估算 | 完成时间 | 关键问题 |
| -------- | ------ | ---------- | ---------- | ---------- |
| P0 | 6 | 20h | 第1周 | 内存泄漏、JSON解析、API契约、安全边界 |
| P1 | 13 | 75h | 第2-8周 | 性能优化、代码重复、API改进 |
| P2 | 24 | 70h | 第9-12周 | 剩余性能、安全加固、质量提升 |
| P3 | 138 | - | 后续版本 | 代码风格、文档完善 |

---

## P0 - 立即修复（第1周，20小时）

### P0-1: TimeoutManager 内存泄漏 ⚠️ CRITICAL

**问题ID**: QUALITY-C01
**位置**: `src/hooks/timeout-wrapper.ts`
**严重性**: Critical - 长时间运行导致内存泄漏和资源耗尽

**问题描述**:
`start()` 方法未清理已存在的 timer，重复调用同一 taskId 会导致旧 timer 泄漏。

**根因分析**:
```typescript
start(taskId: string, agentType: string, model?: string): AbortController {
  // 问题：如果 taskId 已存在，旧的 timer 未清理
  const timer = setTimeout(() => {
    controller.abort();
    this.cleanup(taskId);
  }, timeoutMs);

  this.timers.set(taskId, timer); // 覆盖旧值但未清理
}
```

**修复方案**:
```typescript
start(taskId: string, agentType: string, model?: string): AbortController {
  // 1. 清理已存在的 timer
  this.stop(taskId);

  // 2. 创建新 timer
  const controller = new AbortController();
  const timeoutMs = this.getTimeout(agentType, model);

  const timer = setTimeout(() => {
    controller.abort();
    this.cleanup(taskId);
  }, timeoutMs);

  this.timers.set(taskId, timer);
  this.startTimes.set(taskId, Date.now());

  return controller;
}
```

**验收标准**:

* [ ] 重复调用 `start(taskId)` 不会泄漏 timer

* [ ] 添加单元测试：重复启动同一 taskId

* [ ] 添加单元测试：并发启动多个 taskId

* [ ] 内存分析：长时间运行无内存增长

**依赖**: 无
**风险**: 低 - 修改逻辑简单，影响范围明确
**工时**: 3 小时

---

### P0-2: JSON.parse 缺少错误边界 ⚠️ CRITICAL

**问题ID**: QUALITY-C02
**位置**: `src/tools/state-tools.ts` (行 134, 176, 193)
**严重性**: Critical - 损坏的状态文件导致系统崩溃

**问题描述**:
多处直接使用 `JSON.parse()` 解析状态文件，部分位置缺少 try-catch 保护。

**修复方案**:
1. 创建安全解析函数：
```typescript
// src/lib/safe-json.ts
export function safeJsonParse<T = unknown>(
  content: string,
  fallback: T
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(content) as T;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `JSON parse failed: ${message}` };
  }
}
```

1. 替换所有 `JSON.parse()` 调用：
```typescript
// 修改前
const state = JSON.parse(content);

// 修改后
const result = safeJsonParse(content, {});
if (!result.success) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${result.error}` }],
    isError: true
  };
}
const state = result.data;
```

**影响范围**:

* `src/tools/state-tools.ts`: 8处

* `src/hooks/bridge.ts`: 3处

* `src/team/mcp-team-bridge.ts`: 2处

**验收标准**:

* [ ] 所有 `JSON.parse()` 调用都有错误处理

* [ ] 添加单元测试：损坏的 JSON 文件

* [ ] 添加单元测试：空文件

* [ ] 添加单元测试：非 JSON 内容

* [ ] 错误消息包含文件路径和原因

**依赖**: 无
**风险**: 低 - 纯防御性编程
**工时**: 4 小时

---

### P0-3: API 契约不一致 - GenericToolDefinition.handler ⚠️ CRITICAL

**问题ID**: API-01
**位置**: `src/tools/index.ts:35`
**严重性**: Critical - 类型定义与实现不匹配

**问题描述**:
`handler` 返回类型缺少 `isError` 字段，但实际实现中广泛使用。

**修复方案**:
1. 定义标准响应接口：
```typescript
// src/tools/types.ts
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface GenericToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: unknown) => Promise<ToolResponse>;
}
```

1. 更新所有工具实现以符合新接口

**影响范围**:

* `src/tools/state-tools.ts`: 5个工具

* `src/tools/notepad-tools.ts`: 6个工具

* `src/tools/project-memory-tools.ts`: 3个工具

* 所有自定义工具

**验收标准**:

* [ ] 所有工具 handler 返回 `ToolResponse`

* [ ] TypeScript 编译无类型错误

* [ ] 添加类型测试：验证返回值结构

* [ ] 更新工具文档

**依赖**: 无
**风险**: 中 - 破坏性变更，需要全面测试
**工时**: 5 小时

---

### P0-4: HookInput 接口不完整 ⚠️ CRITICAL

**问题ID**: API-02
**位置**: `src/hooks/bridge-types.ts:9-31`
**严重性**: Critical - 运行时类型不匹配

**问题描述**:
`HookInput` 接口缺少实际使用的字段：`tool_name`, `tool_input`, `tool_response`, `hook_event_name`。

**修复方案**:
```typescript
// src/hooks/bridge-types.ts
export interface HookInput {
  // 现有字段
  sessionId?: string;
  session_id?: string;
  prompt?: string;
  message?: { content?: string };
  parts?: Array<{ type: string; text?: string }>;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  directory?: string;
  cwd?: string;

  // 新增字段
  tool_name?: string;        // snake_case 版本
  tool_input?: unknown;      // snake_case 版本
  tool_response?: unknown;   // 实际使用
  hook_event_name?: string;  // 实际使用
}
```

**验收标准**:

* [ ] 接口包含所有实际使用的字段

* [ ] 更新 `bridge-normalize.ts` 的字段映射

* [ ] TypeScript 编译无类型错误

* [ ] 添加集成测试：验证所有 hook 类型

**依赖**: 无
**风险**: 低 - 纯类型定义扩展
**工时**: 2 小时

---

### P0-5: permission-request Hook 静默降级 ⚠️ CRITICAL

**问题ID**: SEC-H01
**位置**: `src/hooks/persistent-mode/index.ts:103-108`
**严重性**: Critical - 安全边界失效

**问题描述**:
权限检查失败时返回 `{ continue: true }`，导致危险命令绕过检查。

**利用场景**:
1. Agent 尝试执行 `rm -rf /important-data`
2. permission-request hook 检测到危险操作，返回 error
3. `createHookOutput` 仍返回 `{ continue: true }`
4. 命令被执行，数据被删除

**修复方案**:
```typescript
// src/hooks/persistent-mode/index.ts
export function createHookOutput(
  result: PersistentModeResult,
  hookType?: HookType
): { continue: boolean; message?: string } {
  // 安全边界：permission-request 失败时必须阻塞
  if (hookType === 'permission-request' && result.error) {
    return {
      continue: false,
      message: result.message | | 'Permission denied'
    };
  }

  return {
    continue: true,
    message: result.message | | undefined
  };
}
```

**验收标准**:

* [ ] permission-request 失败时返回 `continue: false`

* [ ] 添加单元测试：危险命令被阻塞

* [ ] 添加单元测试：安全命令通过

* [ ] 添加集成测试：端到端权限检查

* [ ] 审计日志记录被阻塞的命令

**依赖**: 无
**风险**: 低 - 修改逻辑简单，安全性提升
**工时**: 3 小时

---

### P0-6: Windows 命令注入风险 ⚠️ CRITICAL

**问题ID**: SEC-H02
**位置**: `src/platform/process-utils.ts:37`
**严重性**: Critical - 潜在命令注入

**问题描述**:
Windows 平台使用 `execSync` 字符串拼接，虽然有 PID 验证，但缺少深度防御。

**修复方案**:
```typescript
// src/platform/process-utils.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function killProcessTreeWindows(
  pid: number,
  force: boolean
): Promise<boolean> {
  try {
    // 使用 execFile 避免 shell 解释
    const args = force
      ? ['/F', '/T', '/PID', String(pid)]
      : ['/T', '/PID', String(pid)];

    await execFileAsync('taskkill', args, {
      timeout: 5000,
      windowsHide: true
    });

    return true;
  } catch (err: unknown) {
    const error = err as { code?: string };
    // 进程不存在不算错误
    if (error.code === '128' | | error.code === '255') {
      return true;
    }
    return false;
  }
}
```

**验收标准**:

* [ ] 使用 `execFile` 替代 `execSync`

* [ ] 添加单元测试：正常 PID

* [ ] 添加单元测试：不存在的 PID

* [ ] 添加单元测试：无效 PID（负数、0）

* [ ] 在 Windows 环境测试

**依赖**: 无
**风险**: 低 - 标准安全实践
**工时**: 3 小时

---

## P0 阶段总结

**总工时**: 20 小时
**完成时间**: 第1周
**关键里程碑**: 所有 Critical 问题修复，系统稳定性和安全性达标

**验证策略**:
1. 单元测试覆盖率 >90%
2. 集成测试覆盖所有修复场景
3. 内存泄漏测试（运行 24 小时）
4. 安全审计（手动 + 自动化）

**发布标准**:

* [ ] 所有 P0 问题修复完成

* [ ] 所有测试通过

* [ ] 代码审查通过

* [ ] 文档更新完成

* [ ] CHANGELOG 更新

---

## P1 - 短期修复（第2-8周，75小时）

### 阶段目标

* 性能提升 40-60%（文件 I/O、Hook 处理、数据库查询）

* 消除代码重复，提升可维护性

* 完善 API 设计和类型安全

---

### P1 性能优化（第2-4周，40小时）

#### P1-1: 状态文件重复读取优化 🚀 HIGH IMPACT

**问题ID**: PERF-H01
**位置**: `src/tools/state-tools.ts:150-198`
**预期收益**: 减少 70-80% 文件 I/O 时间

**修复方案**: 实现 LRU 缓存层（TTL: 5秒）+ 基于 mtime 的缓存失效

**任务分解**:
1. 实现 LRU 缓存层（4h）
2. 集成到 state-tools.ts（3h）
3. 添加缓存失效逻辑（2h）
4. 性能基准测试（2h）
5. 单元测试（3h）

**验收标准**:

* [ ] 100 sessions 场景下延迟 <100ms

* [ ] 缓存命中率 >80%

* [ ] 文件修改后缓存自动失效

**依赖**: P0-2（安全 JSON 解析）
**风险**: 中 - 缓存一致性需要仔细处理
**工时**: 14 小时

---

#### P1-2: Hook 同步文件操作异步化 🚀 HIGH IMPACT

**问题ID**: PERF-H02
**位置**: `src/hooks/bridge.ts:112,174,601-654`
**预期收益**: 减少 60-70% Hook 处理延迟

**修复方案**: 异步文件读取 + LRU 缓存 + 文件监听器主动失效

**任务分解**:
1. 实现异步文件缓存（5h）
2. 修改 bridge.ts 为异步（6h）
3. 更新调用链为异步（4h）
4. 性能基准测试（2h）
5. 集成测试（3h）

**验收标准**:

* [ ] Hook 处理延迟 <5ms (P95)

* [ ] 100 次工具调用累计延迟 <500ms

* [ ] 无事件循环阻塞警告

**依赖**: 无
**风险**: 高 - 异步改造影响范围大
**工时**: 20 小时

---

#### P1-3: 数据库复合索引优化 🚀 HIGH IMPACT

**问题ID**: PERF-H03
**位置**: `src/mcp/job-state-db.ts:198-201`
**预期收益**: 查询时间减少 80-90%

**修复方案**: 添加覆盖索引 `idx_jobs_status_spawned`, `idx_jobs_spawned_provider`

**任务分解**:
1. 分析现有查询模式（2h）
2. 设计复合索引（2h）
3. 实现索引迁移（1h）
4. 查询性能测试（1h）

**验收标准**:

* [ ] 所有查询使用索引（EXPLAIN 验证）

* [ ] 10000 条记录查询 <20ms

**依赖**: 无
**风险**: 低 - 纯索引优化
**工时**: 6 小时

---

### P1 代码质量改进（第5-6周，20小时）

#### P1-4: 消除 state-tools.ts 代码重复

**问题ID**: QUALITY-H03
**位置**: `src/tools/state-tools.ts`

**修复方案**: 提取共享函数 `resolveStatePathForMode()`, `readStateFileSafe()`

**任务分解**:
1. 识别重复模式（2h）
2. 提取共享函数（4h）
3. 重构所有工具（6h）
4. 回归测试（3h）

**验收标准**:

* [ ] 代码重复率 <5%

* [ ] 代码行数减少 >20%

**工时**: 15 小时

---

#### P1-5: 拆分 definitions.ts 大文件

**问题ID**: QUALITY-H04
**位置**: `src/agents/definitions.ts` (856行)

**修复方案**: 按功能分组拆分为 5 个文件

**任务分解**:
1. 设计文件结构（2h）
2. 拆分 agent 定义（4h）
3. 更新导入路径（2h）
4. 验证构建和测试（2h）

**验收标准**:

* [ ] 每个文件 <200 行

* [ ] 无破坏性变更

**工时**: 10 小时

---

### P1 API 改进（第7-8周，15小时）

#### P1-6: 明确 session_id 参数语义

**问题ID**: API-03
**修复方案**: 更新所有工具描述，添加使用示例
**工时**: 6 小时

#### P1-7: 工具迁移策略完善

**问题ID**: API-04
**修复方案**: 添加弃用警告，编写迁移指南
**工时**: 5 小时

#### P1-8: 代码风格统一

**问题ID**: STYLE-01, STYLE-02
**修复方案**: `@ts-ignore` → `@ts-expect-error`, `any` → `unknown`
**工时**: 4 小时

---

## P1 阶段总结

**总工时**: 75 小时
**完成时间**: 第2-8周
**关键里程碑**: 性能提升 40-60%，代码质量显著改善

## P2 - 中期改进（第9-12周，70小时）

### 阶段目标

* 完成剩余性能优化（9个 High 级）

* 安全加固（5个 Medium 级）

* 代码质量提升（10个 Medium 级）

---

### P2 性能优化（第9-10周，30小时）

#### P2-1: Git 命令优化（PERF-H04）

**位置**: `src/team/mcp-team-bridge.ts:64-78`
**修复**: 仅在 permissionEnforcement 时执行，使用 `git diff --name-only`
**工时**: 4 小时

#### P2-2: 字符串拼接优化（PERF-H05）

**位置**: `src/hooks/bridge.ts:169-244`
**修复**: 使用数组 + `join()`
**工时**: 3 小时

#### P2-3: JSON 重复解析优化（PERF-H06）

**位置**: `src/tools/state-tools.ts:175,192,604,630`
**修复**: LRU 缓存（最大 20 个文件，TTL 5 秒）
**工时**: 4 小时

#### P2-4: 大文件流式处理（PERF-H07）

**位置**: `src/mcp/codex-core.ts`
**修复**: 使用 `fs.createReadStream` + 逐行解析
**工时**: 5 小时

#### P2-5: 正则表达式优化（PERF-H08）

**位置**: `src/hooks/bridge.ts:60-61,751-757`
**修复**: 合并正则，添加快速路径
**工时**: 2 小时

#### P2-6: CLI 启动优化（PERF-H09）

**位置**: `src/cli/index.ts`
**修复**: 异步加载非关键配置，延迟初始化
**工时**: 4 小时

#### P2-7: 字符串截断优化（PERF-H10）

**位置**: `src/team/mcp-team-bridge.ts:155-169`
**修复**: 合并正则替换，UTF-8 安全截断
**工时**: 3 小时

#### P2-8: 数据库事务优化（PERF-H11）

**位置**: `src/mcp/job-state-db.ts:617-638`
**修复**: 批量插入，临时禁用 synchronous pragma
**工时**: 3 小时

#### P2-9: 消息搜索优化（PERF-H12）

**位置**: `src/hooks/bridge.ts:254-263`
**修复**: 单次正则匹配，返回 Set
**工时**: 2 小时

---

### P2 安全加固（第11周，15小时）

#### P2-10: 环境变量验证（SEC-M01）

**位置**: `src/config/loader.ts:88-260`
**修复**: 添加范围检查和格式验证
**工时**: 3 小时

#### P2-11: 非敏感 Hook 白名单（SEC-M02）

**位置**: `src/hooks/bridge-normalize.ts:308-343`
**修复**: v2 统一为严格白名单
**工时**: 4 小时

#### P2-12: 原子写入统一（SEC-M03）

**位置**: `src/hooks/subagent-tracker/index.ts`
**修复**: 所有写入使用 `atomicWriteJsonSync`
**工时**: 3 小时

#### P2-13: SQL 一致性（SEC-M04）

**位置**: `src/mcp/job-state-db.ts:206`
**修复**: 添加代码注释说明硬编码字符串
**工时**: 1 小时

#### P2-14: 文件权限验证（SEC-M05）

**位置**: `src/lib/atomic-write.ts:60,114,179`
**修复**: Windows 平台使用 ACL 或文档说明限制
**工时**: 4 小时

---

### P2 代码质量（第12周，25小时）

#### P2-15: bridge-normalize 复杂度（QUALITY-M01）

**修复**: 拆分为多个小函数
**工时**: 5 小时

#### P2-16: TimeoutManager 容量限制（QUALITY-M02）

**修复**: 添加 `MAX_CONCURRENT_TASKS = 1000`
**工时**: 2 小时

#### P2-17: 魔法数字提取（QUALITY-M03）

**修复**: 添加注释说明
**工时**: 2 小时

#### P2-18: 警告信息统一（QUALITY-M04）

**修复**: 统一文案
**工时**: 2 小时

#### P2-19: 超时日志（QUALITY-M05）

**修复**: 添加结构化日志
**工时**: 3 小时

#### P2-20: 废弃别名标记（QUALITY-M06）

**修复**: 添加 `@deprecated` JSDoc
**工时**: 2 小时

#### P2-21: deepMerge 循环引用（QUALITY-M07）

**修复**: 添加 `visited` Set
**工时**: 3 小时

#### P2-22: session_id 验证统一（QUALITY-M08）

**修复**: 统一在函数入口处验证
**工时**: 3 小时

#### P2-23: 日志系统统一（QUALITY-M09）

**修复**: 使用 `auditLogger`
**工时**: 2 小时

#### P2-24: 单元测试覆盖（QUALITY-M10）

**修复**: 补充边界情况测试
**工时**: 1 小时

---

## P2 阶段总结

**总工时**: 70 小时
**完成时间**: 第9-12周
**关键里程碑**: 剩余性能优化完成，安全和质量全面提升

## 依赖关系图（DAG）

```
P0-1 (TimeoutManager) ─────────────────────────┐
P0-2 (JSON.parse) ──────────┬──────────────────┤
P0-3 (API契约) ─────────────┤                  │
P0-4 (HookInput) ───────────┤                  │
P0-5 (permission-request) ──┤                  │
P0-6 (Windows命令注入) ─────┴──────────────────┤
                                               ↓
                                          [P0 完成]
                                               ↓
                            ┌──────────────────┴──────────────────┐
                            ↓                                     ↓
P1-1 (状态文件缓存) ←── P0-2                          P1-4 (代码重复)
P1-2 (Hook异步化)                                     P1-5 (拆分文件)
P1-3 (数据库索引)                                     P1-6 (session_id)
                            │                         P1-7 (工具迁移)
                            │                         P1-8 (代码风格)
                            └──────────────────┬──────────────────┘
                                               ↓
                                          [P1 完成]
                                               ↓
                            ┌──────────────────┴──────────────────┐
                            ↓                                     ↓
P2-1~9 (性能优化) ←── P1-1,P1-2              P2-15~24 (代码质量)
P2-10~14 (安全加固) ←── P0-5,P0-6                     ↓
                            └──────────────────┬──────────────────┘
                                               ↓
                                          [P2 完成]
                                               ↓
                                          v5.6.0 发布
```

**关键路径**: P0-2 → P1-1 → P2-3 (JSON 解析 → 缓存 → 优化)

**并行任务**:

* P0 阶段：6 个任务可并行（无依赖）

* P1 阶段：性能优化（P1-1~3）与代码质量（P1-4~5）可并行

* P2 阶段：性能、安全、质量三组可并行

## 测试策略

### 单元测试

**覆盖率目标**: >90%

**关键测试场景**:
1. **P0-1 (TimeoutManager)**
   - 重复调用 `start(taskId)` 不泄漏
   - 并发启动多个 taskId
   - `stop()` 不存在的 taskId

1. **P0-2 (JSON.parse)**
   - 损坏的 JSON 文件
   - 空文件
   - 非 JSON 内容
   - 超大文件（>10MB）

1. **P0-5 (permission-request)**
   - 危险命令被阻塞
   - 安全命令通过
   - 边界情况（空命令、特殊字符）

1. **P1-1 (状态缓存)**
   - 缓存命中/未命中
   - 文件修改后缓存失效
   - 并发读取
   - 缓存容量限制

1. **P1-2 (Hook异步化)**
   - 异步调用正确性
   - 错误处理
   - 超时处理

### 集成测试

**场景覆盖**:
1. 端到端工作流（autopilot, ralph, team）
2. 多 session 并发操作
3. 大型代码库（>10000 文件）
4. 长时间运行（24 小时）

### 性能测试

**基准测试**:
```bash

# 状态文件读取（P1-1）

* 10 sessions: <50ms

* 50 sessions: <100ms

* 100 sessions: <150ms

# Hook 处理（P1-2）

* 单次调用: <5ms (P95)

* 100 次调用: <500ms

# 数据库查询（P1-3）

* 1000 条记录: <10ms

* 10000 条记录: <20ms
```

**负载测试**:

* 并发 session 数: 50

* 持续时间: 1 小时

* 内存增长: <10%

### 回归测试

**自动化检查**:

* 所有现有测试通过

* TypeScript 编译无错误

* ESLint 无新增警告

* 性能无退化（对比 v5.5.18）

## 风险评估与缓解

### 高风险项

#### 风险1: P1-2 Hook 异步化影响范围大

**影响**: 可能引入新的并发问题
**概率**: 中
**缓解措施**:

* 分阶段迁移（先非关键路径）

* 增加集成测试覆盖

* 保留同步版本作为回退方案

* Code review 由 2 人完成

#### 风险2: P0-3 API 契约变更破坏兼容性

**影响**: 第三方工具可能失效
**概率**: 低
**缓解措施**:

* 提供兼容层

* 发布 beta 版本收集反馈

* 详细的迁移文档

#### 风险3: 性能优化引入缓存一致性问题

**影响**: 数据不一致
**概率**: 中
**缓解措施**:

* 严格的缓存失效策略

* 添加缓存一致性测试

* 提供缓存禁用选项

### 中风险项

#### 风险4: 大规模重构导致回归

**影响**: 现有功能失效
**概率**: 中
**缓解措施**:

* 完整的回归测试套件

* 分阶段提交，每次变更可回滚

* 保持测试覆盖率 >85%

#### 风险5: 时间估算不准确

**影响**: 延期交付
**概率**: 中
**缓解措施**:

* 每周进度审查

* 预留 20% 缓冲时间

* 优先完成 P0 和 P1

## 分阶段交付与里程碑

### 里程碑 M1: v5.5.19-alpha (第1周结束)

**目标**: P0 问题全部修复
**交付物**:

* [ ] 6 个 Critical 问题修复完成

* [ ] 单元测试覆盖率 >90%

* [ ] 内存泄漏测试通过（24小时运行）

* [ ] 安全审计通过

**发布标准**:

* 所有 P0 测试通过

* 无已知 Critical/High 级 bug

* 代码审查通过（2人）

---

### 里程碑 M2: v5.6.0-beta.1 (第4周结束)

**目标**: 性能优化完成
**交付物**:

* [ ] P1-1~3 性能优化完成

* [ ] 性能提升 40-60%（基准测试验证）

* [ ] 负载测试通过（50 并发 session，1小时）

**性能指标**:

* 状态文件读取（100 sessions）: <150ms

* Hook 处理延迟: <5ms (P95)

* 数据库查询（10000 条）: <20ms

---

### 里程碑 M3: v5.6.0-beta.2 (第8周结束)

**目标**: P1 全部完成
**交付物**:

* [ ] P1-4~8 代码质量和 API 改进完成

* [ ] 代码重复率 <5%

* [ ] API 文档完整

* [ ] 迁移指南发布

---

### 里程碑 M4: v5.6.0-rc.1 (第12周结束)

**目标**: P2 全部完成
**交付物**:

* [ ] P2-1~24 全部完成

* [ ] 安全加固完成

* [ ] 代码质量全面提升

* [ ] 用户验收测试通过

---

### 里程碑 M5: v5.6.0 正式版 (第13周)

**目标**: 正式发布
**交付物**:

* [ ] CHANGELOG 完整

* [ ] 发布说明

* [ ] 迁移指南

* [ ] 性能对比报告

## 工时分配与资源规划

### 人员配置建议

**核心开发**: 2 人

* 开发者 A: 性能优化、数据库（P1-1~3, P2-1~9）

* 开发者 B: 代码质量、API 设计（P1-4~8, P2-15~24）

**安全审查**: 1 人（兼职）

* P0-5, P0-6, P2-10~14

**测试工程师**: 1 人

* 单元测试、集成测试、性能测试

### 周工时分配

| 周次 | 阶段 | 工时 | 任务 |
| ------ | ------ | ------ | ------ |
| 第1周 | P0 | 20h | 6个 Critical 问题 |
| 第2周 | P1 | 14h | P1-1 状态缓存 |
| 第3周 | P1 | 20h | P1-2 Hook 异步化 |
| 第4周 | P1 | 6h | P1-3 数据库索引 |
| 第5周 | P1 | 15h | P1-4 代码重复 |
| 第6周 | P1 | 10h | P1-5 拆分文件 |
| 第7周 | P1 | 11h | P1-6~7 API 改进 |
| 第8周 | P1 | 4h | P1-8 代码风格 |
| 第9周 | P2 | 15h | P2-1~5 性能优化 |
| 第10周 | P2 | 15h | P2-6~9 性能优化 |
| 第11周 | P2 | 15h | P2-10~14 安全加固 |
| 第12周 | P2 | 25h | P2-15~24 代码质量 |
| 第13周 | 发布 | 10h | 文档、测试、发布 |

**总工时**: 180 小时（含缓冲）

## 验收标准总览

### P0 验收标准（阻塞发布）

* [ ] 无内存泄漏（24小时运行测试）

* [ ] 无数据损坏风险（损坏文件测试）

* [ ] API 类型安全（TypeScript 编译通过）

* [ ] 安全边界有效（permission-request 测试）

* [ ] 无命令注入风险（安全审计通过）

### P1 验收标准（性能与质量）

* [ ] 性能提升 40-60%（基准测试对比）

* [ ] 代码重复率 <5%（SonarQube 分析）

* [ ] 单元测试覆盖率 >85%

* [ ] API 文档完整（所有公共接口）

* [ ] 迁移指南清晰（用户可自助迁移）

### P2 验收标准（全面提升）

* [ ] 所有 High 级性能问题修复

* [ ] 安全加固完成（OWASP 检查通过）

* [ ] 代码质量评分 >8.0/10

* [ ] 用户验收测试通过

### 发布验收标准

* [ ] 所有自动化测试通过

* [ ] 性能无退化（对比 v5.5.18）

* [ ] 文档更新完整

* [ ] CHANGELOG 详细

* [ ] 至少 2 人代码审查通过

## 总结

### 预期成果

**稳定性提升**:

* 消除内存泄漏和数据损坏风险

* 安全边界完整有效

* 错误处理全面覆盖

**性能提升**:

* 文件 I/O 减少 70-80%

* Hook 处理延迟减少 60-70%

* 数据库查询速度提升 80-90%

* 整体性能提升 40-60%

**代码质量提升**:

* 代码重复率从 15% 降至 <5%

* 单元测试覆盖率从 75% 提升至 >85%

* API 类型安全性显著提升

* 可维护性评分从 7.5 提升至 >8.5

**用户体验提升**:

* 响应速度更快

* 错误提示更清晰

* API 更易用

* 文档更完善

### 关键成功因素

1. **严格的优先级管理**: P0 必须在第1周完成
2. **充分的测试覆盖**: 单元测试 >90%，集成测试覆盖关键路径
3. **持续的性能监控**: 每个优化都要有基准测试验证
4. **代码审查质量**: 所有变更至少 2 人审查
5. **用户反馈循环**: beta 版本收集用户反馈

### 后续计划（P3）

**v5.7.0 规划**:

* 剩余 138 个 Low 级问题

* 代码风格全面统一

* 文档完善（API 参考、最佳实践）

* 性能持续优化

## 附录

### A. 问题索引（按优先级）

#### P0 问题（6个）

| ID | 问题 | 位置 | 工时 |
| ---- | ------ | ------ | ------ |
| P0-1 | TimeoutManager 内存泄漏 | src/hooks/timeout-wrapper.ts | 3h |
| P0-2 | JSON.parse 缺少错误边界 | src/tools/state-tools.ts | 4h |
| P0-3 | API 契约不一致 | src/tools/index.ts:35 | 5h |
| P0-4 | HookInput 接口不完整 | src/hooks/bridge-types.ts | 2h |
| P0-5 | permission-request 静默降级 | src/hooks/persistent-mode/index.ts | 3h |
| P0-6 | Windows 命令注入风险 | src/platform/process-utils.ts | 3h |

#### P1 问题（13个）

| ID | 问题 | 位置 | 工时 |
| ---- | ------ | ------ | ------ |
| P1-1 | 状态文件重复读取 | src/tools/state-tools.ts | 14h |
| P1-2 | Hook 同步文件操作 | src/hooks/bridge.ts | 20h |
| P1-3 | 数据库缺少复合索引 | src/mcp/job-state-db.ts | 6h |
| P1-4 | 代码重复严重 | src/tools/state-tools.ts | 15h |
| P1-5 | definitions.ts 过大 | src/agents/definitions.ts | 10h |
| P1-6 | session_id 语义不清 | src/tools/state-tools.ts | 6h |
| P1-7 | 工具迁移策略不完整 | src/tools/tool-prefix-migration.ts | 5h |
| P1-8 | 代码风格问题 | 多处 | 4h |

#### P2 问题（24个）

性能优化 9 个、安全加固 5 个、代码质量 10 个

### B. 详细审查报告链接

* [代码质量审查](./code_quality_review.md) - 23个问题

* [安全审查](./review_security.md) - 15个问题

* [性能审查](./performance_review.md) - 25个问题

* [API 审查](./review_api.md) - 23个问题

* [代码风格审查](./code_style_review.md) - 95个问题

* [综合报告](./COMPREHENSIVE_REVIEW_SUMMARY.md) - 总览

### C. 参考文档

**规范文档**:

* `docs/standards/runtime-protection.md` - 安全防护规范

* `docs/standards/hook-execution-order.md` - Hook 执行顺序

* `docs/standards/state-machine.md` - 状态机规范

* `docs/standards/agent-lifecycle.md` - Agent 生命周期

**开发指南**:

* `docs/standards/contribution-guide.md` - 贡献流程

* `docs/standards/anti-patterns.md` - 反模式指南

### D. 快速参考

**开始实施前检查清单**:

* [ ] 创建 `feature/v5.6.0` 分支

* [ ] 设置 CI/CD 流水线

* [ ] 准备性能基准测试环境

* [ ] 通知用户即将发布 beta 版本

**每周检查清单**:

* [ ] 进度审查（实际 vs 计划）

* [ ] 风险评估更新

* [ ] 测试覆盖率检查

* [ ] 代码审查完成情况

**发布前检查清单**:

* [ ] 所有测试通过

* [ ] 性能基准测试对比

* [ ] 文档更新完成

* [ ] CHANGELOG 详细

* [ ] 迁移指南发布

* [ ] 用户验收测试通过

### E. 联系方式

**问题反馈**:

* GitHub Issues: <<https://github.com/ultrapower/issues>>

* 技术讨论: 项目 Discord/Slack

**代码审查**:

* 所有 PR 需要至少 2 人审查

* P0/P1 变更需要安全审查

---

## 文档版本历史

| 版本 | 日期 | 变更 | 作者 |
| ------ | ------ | ------ | ------ |
| 1.0 | 2026-03-05 | 初始版本 | Planner (Prometheus) |

---

**计划状态**: ✅ 已完成
**下一步**: 等待用户确认后开始执行

