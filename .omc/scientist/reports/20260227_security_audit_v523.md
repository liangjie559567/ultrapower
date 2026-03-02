# ultrapower v5.2.3 安全性深度分析报告

> 审计日期: 2026-02-27
> 审计范围: 路径遍历、Hook 输入消毒、状态文件防护、MCP 输出处理、命令注入、SubagentStop 推断、Prompt Injection
> 置信度: HIGH

---

## [FINDING:SEC-1] 安全机制概览

ultrapower v5.2.3 实现了 7 层纵深防御体系：

| 层级 | 机制 | 实现文件 | 状态 |
|------|------|---------|------|
| 1 | 路径遍历防护 (mode 白名单) | `src/lib/validateMode.ts` | PASS |
| 2 | Hook 输入消毒 (Zod + 白名单) | `src/hooks/bridge-normalize.ts` | PASS (v1) |
| 3 | 原子写入 + 文件权限 | `src/lib/atomic-write.ts` | PASS |
| 4 | MCP 命令白名单 | `src/compatibility/mcp-bridge.ts` | PASS |
| 5 | 环境变量注入阻断 | `src/compatibility/mcp-bridge.ts` | PASS |
| 6 | Prompt Injection 隔离 | `src/mcp/prompt-injection.ts` | PASS |
| 7 | 权限执行 (deny-defaults) | `src/team/permissions.ts` | PASS |

[STAT:n] 审计覆盖 7 个安全域、12 个源文件、4 个测试套件
[STAT:ci] 测试覆盖率: 7/7 安全域均有对应测试用例

---

## [FINDING:SEC-2] 路径遍历防护 — 强健

### 实现分析

`src/lib/validateMode.ts` 使用严格白名单策略（非正则匹配）：

```typescript
const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm'
] as const;

function validateMode(mode: unknown): mode is ValidMode {
  return typeof mode === 'string' && VALID_MODES.includes(mode);
}
```

防护特性：
- 类型守卫: `typeof mode === 'string'` 阻止非字符串输入
- 白名单匹配: `VALID_MODES.includes()` 仅允许 8 个精确值
- 错误消息截断: 超长输入截断至 50 字符，防止 DoS/日志注入
- 敏感数据不泄露: 非字符串对象通过 `String(mode)` 转换，不暴露内部属性

### 测试覆盖

`src/__tests__/validateMode.test.ts` 覆盖了：
- 路径遍历: `../../etc/passwd`, `../autopilot`, `autopilot/../../../etc`
- Null byte 注入: `autopilot\x00`, `autopilot\x00../../etc`
- 原型污染: `__proto__`, `constructor`, `prototype`
- 百万字符 DoS: `'a'.repeat(1_000_000)`
- 非字符串类型: null, undefined, 42, {}, [], true, Symbol

[EVIDENCE:SEC-2a] `src/lib/validateMode.ts` 第 43-44 行: 白名单校验
[EVIDENCE:SEC-2b] `src/__tests__/validateMode.test.ts` 第 19-61 行: 攻击向量测试
[CONFIDENCE:HIGH]

### 潜在风险点

`resolveStatePath()` 在 `src/lib/worktree-paths.ts` 第 117 行接受 `stateName: string` 参数，
未直接调用 `assertValidMode()`。但调用链通过 `state-tools.ts` 的 Zod enum 验证
(`z.enum(STATE_TOOL_MODES)`) 在入口层已做约束。风险等级: LOW。

**注意**: `assertValidMode` 仅在测试文件中被 import，生产代码中 `state-tools.ts` 依赖
Zod enum 做入口验证，`mode-registry` 的 `MODE_CONFIGS` 对象做二次约束。
防护有效但存在两套并行验证机制（validateMode + Zod enum），建议统一。

---

## [FINDING:SEC-3] Hook 输入消毒 — 有效 (v1 级别)

### 实现分析

`src/hooks/bridge-normalize.ts` 实现了分层消毒策略：

**Zod 结构验证** (第 19-47 行):
- 使用 `z.object().passthrough()` 定义输入 schema
- `safeParse` 不抛异常，验证失败时降级为 best-effort 映射

**敏感 Hook 严格白名单** (第 82-87 行):
```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end',
]);
```

**字段过滤策略** (第 195-227 行):
- 敏感 Hook (4 类): 仅允许 `KNOWN_FIELDS` 中的字段，未知字段静默丢弃
- 非敏感 Hook (11 类): 未知字段透传，记录 debug 警告

**快速路径优化** (第 118-130 行):
- 已规范化的 camelCase 输入跳过 Zod 解析，提升性能

[EVIDENCE:SEC-3a] `src/hooks/bridge-normalize.ts` 第 82-87 行: 敏感 Hook 集合
[EVIDENCE:SEC-3b] `src/hooks/bridge-normalize.ts` 第 212-217 行: 严格白名单过滤
[CONFIDENCE:HIGH]

### 已知差异 (来自 runtime-protection.md)

| 差异点 | 描述 | 风险 |
|--------|------|------|
| D-05 | `permission-request` 失败时静默降级 (`continue: true`) | MEDIUM |
| D-06 | 非敏感 Hook 未知字段透传 | LOW |

D-05 是最值得关注的安全差异：`permission-request` 是安全边界，
失败时应返回 `{ continue: false }` 阻塞执行。当前 v1 实现始终返回 `{ continue: true }`。
规范文档已记录此问题，计划 v2 修复。

---

## [FINDING:SEC-4] 状态文件防护 — 强健

### 原子写入实现

`src/lib/atomic-write.ts` 实现了完整的原子写入流程：

1. `ensureDirSync(dir)` — 确保目录存在（TOCTOU 安全：捕获 EEXIST）
2. 独占创建临时文件 — `wx` 标志 (O_CREAT|O_EXCL|O_WRONLY)，权限 `0o600`
3. `fd.write()` + `fd.sync()` — 写入并落盘
4. `fd.close()` — 关闭文件描述符
5. `fs.rename()` — 原子替换目标文件
6. 目录级 fsync — best-effort（Windows 上静默失败）

文件权限 `0o600` 确保仅所有者可读写。

[EVIDENCE:SEC-4a] `src/lib/atomic-write.ts` 第 60 行: `fs.open(tempPath, "wx", 0o600)`
[EVIDENCE:SEC-4b] `docs/standards/runtime-protection.md` 第 136-171 行: 原子写入规范
[CONFIDENCE:HIGH]

### 已知差异

| 差异点 | 描述 | 风险 |
|--------|------|------|
| D-07 | subagent-tracker 内部即时写入使用 `writeFileSync` | LOW |

subagent-tracker 的内部写入未使用原子写入，可能在并发场景下产生部分写入。
但该文件有四层保护（debounce + flushInProgress + mergeTrackerStates + 文件锁），
实际风险较低。

---

## [FINDING:SEC-5] 命令注入防护 — 强健

### MCP Bridge 命令白名单

`src/compatibility/mcp-bridge.ts` 第 37-51 行：

```typescript
const ALLOWED_COMMANDS = new Set([
  'node', 'npx', 'python', 'python3', 'ruby', 'go',
  'deno', 'bun', 'uvx', 'uv', 'cargo', 'java', 'dotnet',
]);
```

防护特性：
- 使用 `basename(config.command)` 提取命令名，阻止绝对路径绕过 (`/bin/bash`)
- 使用 `basename()` 也阻止相对路径绕过 (`./malicious-script`)
- 白名单仅包含语言运行时，不包含 shell (`bash`, `sh`, `cmd`)
- 不包含网络工具 (`curl`, `wget`)

### 环境变量注入阻断

`src/compatibility/mcp-bridge.ts` 第 56-71 行：

```typescript
const BLOCKED_ENV_VARS = new Set([
  'LD_PRELOAD', 'LD_LIBRARY_PATH',
  'DYLD_INSERT_LIBRARIES', 'DYLD_LIBRARY_PATH',
  'NODE_OPTIONS', 'NODE_DEBUG', 'ELECTRON_RUN_AS_NODE',
  'PYTHONSTARTUP', 'PYTHONPATH', 'RUBYOPT',
  'PERL5OPT', 'BASH_ENV', 'ENV', 'ZDOTDIR',
]);
```

覆盖了主要的动态链接器注入 (LD_PRELOAD/DYLD) 和语言级启动注入向量。

### 模型名称验证

`src/mcp/codex-core.ts` 和 `src/mcp/gemini-core.ts` 均实现了模型名称正则验证：

```typescript
const MODEL_NAME_REGEX = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
```

阻止通过模型名称参数注入 shell 命令。

[EVIDENCE:SEC-5a] `src/compatibility/mcp-bridge.ts` 第 37-51 行: 命令白名单
[EVIDENCE:SEC-5b] `src/compatibility/mcp-bridge.ts` 第 56-71 行: 环境变量黑名单
[EVIDENCE:SEC-5c] `src/__tests__/compatibility-security.test.ts` 第 58-115 行: 命令白名单测试
[CONFIDENCE:HIGH]

---

## [FINDING:SEC-6] Prompt Injection 防护 — 有效

### 实现分析

`src/mcp/prompt-injection.ts` 实现了三层防护：

**1. Agent 角色名称验证** (第 54 行):
```typescript
const AGENT_ROLE_NAME_REGEX = /^[a-z0-9-]+$/;
```
仅允许小写字母、数字和连字符。阻止路径遍历和特殊字符注入。

**2. 不可信内容包装** (第 149-159 行):
- 文件内容包裹在 `--- UNTRUSTED FILE CONTENT ---` 分隔符中
- CLI 响应包裹在 `--- UNTRUSTED CLI RESPONSE ---` 分隔符中
- 明确标记数据边界，防止内容被解释为指令

**3. 提示构建隔离** (第 183-201 行):
- 系统指令包裹在 `<system-instructions>` XML 标签中
- 文件内容前置 "UNTRUSTED DATA" 警告声明
- 严格排序: system > files > user prompt，防止指令覆盖

[EVIDENCE:SEC-6a] `src/mcp/prompt-injection.ts` 第 54 行: 角色名正则
[EVIDENCE:SEC-6b] `src/mcp/prompt-injection.ts` 第 149-159 行: 不可信内容包装
[EVIDENCE:SEC-6c] `src/__tests__/prompt-injection.test.ts` 第 47-63 行: 注入向量测试
[CONFIDENCE:HIGH]

---

## [FINDING:SEC-7] SubagentStop 推断逻辑 — 正确

### 实现分析

`src/hooks/subagent-tracker/index.ts` 第 650 行：

```typescript
const succeeded = input.success !== false;
```

这是正确的防御性编程模式：

| `input.success` 值 | `!== false` 结果 | 语义 |
|---------------------|-----------------|------|
| `true` | `true` | 明确成功 |
| `undefined` | `true` | SDK 未提供字段，默认成功 |
| `false` | `false` | 明确失败 |

代码注释明确说明了设计意图："SDK does not provide `success` field, so default to 'completed' when undefined (Bug #1 fix)"。

禁止使用 `input.success` 直接读取（truthy 检查），因为 `undefined` 会被误判为失败。

[EVIDENCE:SEC-7a] `src/hooks/subagent-tracker/index.ts` 第 649-650 行
[CONFIDENCE:HIGH]

---

## [FINDING:SEC-8] 权限执行系统 — 强健

### 实现分析

`src/team/permissions.ts` 实现了 deny-defaults 权限模型：

默认拒绝路径（安全基线，自动注入所有 worker）：
- `.git/**` — 版本控制元数据
- `.env*`, `**/.env*` — 环境变量/密钥
- `**/secrets/**` — 密钥目录
- `**/.ssh/**` — SSH 密钥
- `**/node_modules/.cache/**` — 缓存目录

防护特性：
- `getEffectivePermissions()` 自动合并 deny-defaults，无法被调用方绕过
- `findPermissionViolations()` 检测目录逃逸 (`../../etc/passwd`)
- Glob 匹配支持 `*`（单层）和 `**`（递归）语义

[EVIDENCE:SEC-8a] `src/__tests__/permission-enforcement.test.ts` 第 16-197 行
[CONFIDENCE:HIGH]

---

## [FINDING:SEC-9] 额外安全机制 — ReDoS 防护

`src/compatibility/permission-adapter.ts` 实现了 ReDoS 防护：
- 使用 `safe-regex` 库检测危险正则模式
- 拒绝指数回溯模式: `(a+)+$`, `([a-zA-Z]+)*`, `(.*a){100}`
- 拒绝嵌套量词: `(a*)*b`, `(a+)*b`

[EVIDENCE:SEC-9a] `src/__tests__/compatibility-security.test.ts` 第 194-287 行
[CONFIDENCE:HIGH]

---

## [FINDING:SEC-10] 已发现的安全问题汇总

### 严重程度: MEDIUM (1 项)

**SEC-ISSUE-1: permission-request 失败时静默降级 (D-05)**
- 位置: `src/hooks/persistent-mode/index.ts` 的 `createHookOutput()`
- 问题: `permission-request` hook 失败时始终返回 `{ continue: true }`
- 影响: 权限检查失败不会阻塞执行，可能导致未授权操作继续
- 状态: 已在 `runtime-protection.md` 中记录，计划 v2 修复
- 缓解: 当前依赖 Claude Code 自身的权限系统作为外层防护

### 严重程度: LOW (2 项)

**SEC-ISSUE-2: 非敏感 Hook 未知字段透传 (D-06)**
- 位置: `src/hooks/bridge-normalize.ts` 第 195-227 行
- 问题: 11 类非敏感 Hook 的未知字段不被过滤，直接透传
- 影响: 攻击者可能通过未知字段注入意外数据
- 缓解: 仅影响非安全边界的 Hook（如 `tool-response`），且有 debug 日志记录

**SEC-ISSUE-3: subagent-tracker 内部写入未使用原子写入 (D-07)**
- 位置: `src/hooks/subagent-tracker/index.ts` 内部写入逻辑
- 问题: 使用 `writeFileSync` 而非 `atomicWriteJsonSync`
- 影响: 并发场景下可能产生部分写入
- 缓解: 四层保护机制（debounce + flushInProgress + mergeTrackerStates + 文件锁）降低实际风险

---

## [FINDING:SEC-11] 最佳实践合规性总结

| 最佳实践 | 合规状态 | 说明 |
|----------|---------|------|
| 输入验证 (白名单优先) | PASS | validateMode 白名单 + Zod enum + 正则校验 |
| 最小权限原则 | PASS | deny-defaults 权限模型，文件 0o600 |
| 纵深防御 | PASS | 7 层独立防护机制 |
| 安全默认值 | PARTIAL | D-05: permission-request 默认 continue:true |
| 原子操作 | PASS | atomic-write.ts 实现完整原子写入流程 |
| 错误处理不泄露信息 | PASS | 输入截断至 50 字符，非字符串安全转换 |
| 不可信数据隔离 | PASS | UNTRUSTED 分隔符 + XML 标签隔离 |
| ReDoS 防护 | PASS | safe-regex 库检测危险正则模式 |

[STAT:n] 8 项最佳实践中 7 项完全合规，1 项部分合规
[STAT:ci] 合规率: 87.5% (7/8 PASS)

---

## 总体安全评估

**整体评级: STRONG (强健)**

ultrapower v5.2.3 实现了成熟的纵深防御体系。7 个安全域均有对应的防护机制和测试覆盖。

**核心优势:**
1. 白名单优先策略贯穿全栈（mode 验证、命令白名单、Hook 字段白名单、环境变量黑名单）
2. 原子写入 + 严格文件权限确保状态文件完整性
3. 不可信内容隔离机制有效防止 Prompt Injection
4. ReDoS 防护和模型名称正则验证覆盖了边缘攻击向量

**需关注项:**
1. **[MEDIUM]** D-05: `permission-request` 失败时静默降级，计划 v2 修复
2. **[LOW]** 存在两套并行验证机制（validateMode + Zod enum），建议统一
3. **[LOW]** subagent-tracker 内部写入未使用原子写入

**建议优先级:**
- P0: 修复 D-05（permission-request 失败应返回 `{ continue: false }`）
- P1: 统一 mode 验证机制（移除冗余的 validateMode，或让生产代码也调用 assertValidMode）
- P2: subagent-tracker 迁移到 atomicWriteJsonSync

[LIMITATION] 本审计基于静态代码分析，未进行动态渗透测试。Windows 平台上 `0o600` 文件权限语义与 POSIX 不同，实际防护效果可能有差异。审计范围限于 7 个指定安全域，未覆盖网络层、认证层或第三方依赖漏洞。

---

> 审计完成时间: 2026-02-27T11:10:30Z
> 审计工具: 静态代码分析 + 测试覆盖验证
> 审计人: scientist agent (ultrapower v5.2.3)

[STAGE_COMPLETE:4]
