# Sub-PRD: T-1e bridge-normalize fast path 安全修复

> **Status**: APPROVED
> **Context**: `.omc/axiom/rough_prd_pain_points.md` / `.omc/axiom/manifest_pain_points.md`

---

## 1. 目标

修复 `src/hooks/bridge-normalize.ts` 中 `isAlreadyCamelCase()` 快速路径对 SENSITIVE_HOOKS 类型（permission-request、setup-init、setup-maintenance、session-end）不做白名单过滤的安全漏洞，防止攻击者通过构造含合法 camelCase 标记键的恶意输入完全绕过 KNOWN_FIELDS 白名单过滤。

**在整体方案中的位置**：该修复属于 hook 安全加固层，是 pain-points 规划中"安全漏洞修复"优先级最高的子任务，完成后为后续所有 hook 处理提供可信输入基础。

---

## 2. 现有代码结构分析

### 关键文件

**`src/hooks/bridge-normalize.ts`（行 117-163）**

```
行 107：CAMEL_CASE_MARKERS = Set(['sessionId', 'toolName', 'directory'])
行 118-130：isAlreadyCamelCase() — 快速路径判定逻辑
行 143-163：normalizeHookInput() — 主入口函数

快速路径触发条件（行 150-163）：
  isAlreadyCamelCase(rawObj) === true
    -> 直接构造返回对象，同时调用 filterPassthrough(rawObj, hookType)

filterPassthrough（行 195-227）：
  对 SENSITIVE_HOOKS 做白名单过滤 — 仅允许 KNOWN_FIELDS 通过
  对非敏感 hook 透传所有字段并打印 debug 日志
```

### 漏洞根因

快速路径（行 150-163）确实调用了 `filterPassthrough`，但**只过滤了扩展字段（spread 部分），核心字段（sessionId、toolName、toolInput、toolOutput、directory、prompt、message、parts）是直接从 `rawObj` 读取并硬编码写入返回对象的**，攻击者可以：

```
输入：{ sessionId: "x", toolName: "y", directory: "/t", __evil__: "payload" }
```

由于 `sessionId` 是 CAMEL_CASE_MARKERS 成员且无下划线键，`isAlreadyCamelCase` 返回 true，进入快速路径。`filterPassthrough` 确实会丢弃 `__evil__`（对 SENSITIVE_HOOKS），但这只是针对 spread 部分——更严重的问题是：**快速路径完全跳过了 Zod 验证**，任何不依赖 Zod 来拦截恶意结构的信任边界都是潜在突破口。

此外，当前 `filterPassthrough` 对 SENSITIVE_HOOKS 的白名单过滤**确实有效**，但 Zod 验证提供的结构性约束（类型检查、格式验证）在快速路径中完全缺失。对于敏感 hook 类型，结构性验证是必要的安全纵深。

### 方案选择：方案 A

**选择方案 A（为 SENSITIVE_HOOKS 禁用 fast path，强制走完整 Zod 验证路径）**，理由如下：

1. **纵深防御**：Zod 验证不仅做字段白名单，还做类型检查（防止类型混淆攻击，如将 `sessionId` 传入对象而非字符串）。白名单过滤（方案 B）只能过滤字段名，无法验证字段值的结构。

2. **SENSITIVE_HOOKS 频率低**：`permission-request`、`setup-init`、`setup-maintenance`、`session-end` 均为低频事件（非热路径），禁用 fast path 的性能代价可忽略不计，完全满足验收条件"非敏感 hook 的 fast path 性能不退化"。

3. **修改最小化**：只需在 `normalizeHookInput` 中增加一个提前判断，改动范围极小，不影响非敏感 hook 的现有行为，回归风险最低。

4. **语义清晰**：fast path 的存在意义是"已归一化、结构可信的输入跳过重复解析"。敏感 hook 的输入来自外部，不可预设信任，禁用 fast path 符合"不信任外部输入"的安全原则。

---

## 3. 实现接口（I/O）

### 修改函数签名（无变化，行为变化）

```typescript
export function normalizeHookInput(raw: unknown, hookType?: string): HookInput
```

**Input**：
- `raw`：原始 hook 输入（来自 Claude Code，任意格式）
- `hookType`：hook 类型字符串，用于敏感性判定

**Output**：
- 返回 `HookInput` 对象，字段已归一化为 camelCase

**Side Effects**：
- 对非敏感 hook 的未知字段，打印 `console.debug` 警告（现有行为不变）
- 对 Zod 验证失败的输入，打印 `console.error` 警告（现有行为不变）

### 变化点

`normalizeHookInput` 内部逻辑变化（仅新增一个条件判断）：

```
// 修改前（伪代码）：
if isAlreadyCamelCase(rawObj):
    return fastPathResult   // 对所有 hookType 均走 fast path

// 修改后（伪代码）：
isSensitive = (hookType != null && SENSITIVE_HOOKS.has(hookType))
if isAlreadyCamelCase(rawObj) && !isSensitive:
    return fastPathResult   // 仅对非敏感 hook 走 fast path
// 敏感 hook 继续向下，走 Zod 验证路径
```

---

## 4. 数据结构

### 无新增数据结构

现有数据结构均不变：
- `SENSITIVE_HOOKS: Set<string>`（行 82-87）——已包含正确成员
- `KNOWN_FIELDS: Set<string>`（行 90-102）——不变
- `CAMEL_CASE_MARKERS: Set<string>`（行 107）——不变
- `HookInput` 接口——不变
- `HookInputSchema`（Zod schema）——不变

---

## 5. 实现规格（伪代码）

### 目标修改：`src/hooks/bridge-normalize.ts` 行 150-163

**当前代码（行 150-163）：**

```typescript
// Fast path: if input is already camelCase, skip Zod parse entirely
if (isAlreadyCamelCase(rawObj)) {
  return {
    sessionId: rawObj.sessionId as string | undefined,
    toolName: rawObj.toolName as string | undefined,
    toolInput: rawObj.toolInput,
    toolOutput: rawObj.toolOutput ?? rawObj.toolResponse,
    directory: rawObj.directory as string | undefined,
    prompt: rawObj.prompt as string | undefined,
    message: rawObj.message as HookInput['message'],
    parts: rawObj.parts as HookInput['parts'],
    ...filterPassthrough(rawObj, hookType),
  } as HookInput;
}
```

**修改后伪代码：**

```
// 计算敏感性（复用 SENSITIVE_HOOKS，与 filterPassthrough 保持一致）
const isSensitive = hookType != null && SENSITIVE_HOOKS.has(hookType)

// Fast path: 仅对非敏感 hook 跳过 Zod 解析
// 敏感 hook 需要 Zod 提供的结构性验证（类型检查），不走 fast path
if isAlreadyCamelCase(rawObj) && !isSensitive:
  return {
    sessionId: rawObj.sessionId as string | undefined,
    toolName:  rawObj.toolName  as string | undefined,
    toolInput: rawObj.toolInput,
    toolOutput: rawObj.toolOutput ?? rawObj.toolResponse,
    directory: rawObj.directory as string | undefined,
    prompt:  rawObj.prompt  as string | undefined,
    message: rawObj.message as HookInput['message'],
    parts:   rawObj.parts   as HookInput['parts'],
    ...filterPassthrough(rawObj, hookType),
  } as HookInput

// 以下为现有 Zod 验证路径（行 165-187），对所有非 fast path 情况均执行
```

### 修改范围

- 仅修改 `normalizeHookInput` 函数内的 fast path 判断条件
- 不修改 `isAlreadyCamelCase`（保留供测试导出）
- 不修改 `filterPassthrough`
- 不修改任何 Zod schema

---

## 6. 测试用例设计

测试文件：`src/hooks/__tests__/bridge-security.test.ts`（追加到现有 "Normalization Fast-Path" describe 块末尾）

### 新增回归测试用例（针对漏洞修复）

#### 用例 1：敏感 hook 的恶意 camelCase 输入不走 fast path

```
Given: 构造含 sessionId + 恶意未知字段的 camelCase 输入
       { sessionId: 'x', toolName: 'y', directory: '/t', __injected__: 'evil', maliciousField: 'payload' }
When:  对每个 SENSITIVE_HOOKS 成员调用 normalizeHookInput(input, hookType)
       同时 spy HookInputSchema.safeParse
Then:  safeParse 必须被调用（证明未走 fast path）
       normalized.__injected__ === undefined（白名单过滤有效）
       normalized.maliciousField === undefined
       normalized.sessionId === 'x'（合法字段正常透传）
```

#### 用例 2：敏感 hook 下 camelCase 输入的类型混淆攻击被 Zod 捕获

```
Given: sessionId 字段值为对象而非字符串（类型混淆）
       { sessionId: { __proto__: { polluted: true } }, toolName: 'Read', directory: '/t' }
When:  调用 normalizeHookInput(input, 'permission-request')
Then:  safeParse 被调用（进入 Zod 路径）
       normalized.sessionId 为 undefined 或字符串（不得是原始对象）
       不抛出未捕获异常
```

#### 用例 3：非敏感 hook 的 camelCase 输入仍走 fast path（性能不退化）

```
Given: 标准 camelCase 输入
       { sessionId: 'abc', toolName: 'Read', directory: '/tmp' }
When:  对非敏感 hookType（'pre-tool-use'、'post-tool-use'、'keyword-detector'）
       调用 normalizeHookInput(input, hookType)
       spy HookInputSchema.safeParse
Then:  safeParse 不被调用（fast path 仍有效）
       normalized.sessionId === 'abc'
       normalized.toolName === 'Read'
```

#### 用例 4：所有四个 SENSITIVE_HOOKS 成员均禁用 fast path

```
Given: 标准 camelCase 输入（会触发 isAlreadyCamelCase=true）
       { sessionId: 'x', directory: '/t' }
When:  分别对 'permission-request'、'setup-init'、'setup-maintenance'、'session-end'
       调用 normalizeHookInput，spy safeParse
Then:  每次调用 safeParse 均被调用一次
       输出结果字段正确
```

#### 用例 5：snake_case 输入对敏感 hook 的现有行为不变

```
Given: 标准 snake_case 输入
       { session_id: 'snake', cwd: '/tmp', injected_evil: 'bad' }
When:  调用 normalizeHookInput(input, 'session-end')
Then:  normalized.sessionId === 'snake'（snake_case 优先）
       normalized.injected_evil === undefined（现有白名单过滤有效）
       normalized.directory === '/tmp'
```

### 现有测试覆盖确认

以下现有测试必须继续通过（验证无回归）：
- `"should skip Zod parse on camelCase-only input"`（非敏感 hook，fast path 仍有效）
- `"should invoke Zod parse on snake_case input"`（慢路径不变）
- `"should apply sensitive filtering on fast-path too"`（新增条件后此测试描述需更新：敏感 hook 不再走 fast path，该测试改为验证敏感 hook 走完整路径后的过滤结果是否正确）
- `"should drop unknown fields for sensitive hooks"`（白名单过滤逻辑不变）
- `"should allow known fields through for sensitive hooks"`（已知字段透传不变）

---

## 7. 验收标准（Gherkin）

```gherkin
Feature: bridge-normalize fast path 安全修复

  Background:
    Given 目标文件为 src/hooks/bridge-normalize.ts
    And SENSITIVE_HOOKS 包含 permission-request, setup-init, setup-maintenance, session-end

  Scenario: 敏感 hook 收到含标记键的恶意 camelCase 输入时强制走 Zod 路径
    Given 攻击者构造输入 { sessionId: "x", maliciousField: "evil" }
    When  以 hookType="permission-request" 调用 normalizeHookInput
    Then  HookInputSchema.safeParse 被调用（非 fast path）
    And   normalized.maliciousField 为 undefined
    And   normalized.sessionId 为 "x"

  Scenario: 非敏感 hook 的 camelCase 输入继续走 fast path
    Given 合法输入 { sessionId: "abc", toolName: "Read", directory: "/tmp" }
    When  以 hookType="pre-tool-use" 调用 normalizeHookInput
    Then  HookInputSchema.safeParse 不被调用
    And   normalized.sessionId 为 "abc"

  Scenario: 敏感 hook 收到类型混淆的 sessionId 时 Zod 提供结构保护
    Given 输入 { sessionId: { nested: "object" }, toolName: "x", directory: "/t" }
    When  以 hookType="setup-init" 调用 normalizeHookInput
    Then  函数不抛出未捕获异常
    And   safeParse 被调用

  Scenario: 所有现有的 bridge-security 测试继续通过
    Given 现有测试套件 src/hooks/__tests__/bridge-security.test.ts
    When  运行测试
    Then  所有测试通过，无失败

  Scenario: 四个敏感 hook 类型全部覆盖
    Given 输入 { sessionId: "x", directory: "/t" }（可触发 isAlreadyCamelCase=true）
    When  分别对 permission-request, setup-init, setup-maintenance, session-end 调用 normalizeHookInput
    Then  每次 safeParse 均被调用，确认无遗漏
```

---

## 8. 影响范围与风险

### 影响文件
- **修改**：`src/hooks/bridge-normalize.ts`（仅 `normalizeHookInput` 函数，约 1 行条件判断变更）
- **新增测试**：`src/hooks/__tests__/bridge-security.test.ts`（在现有 "Normalization Fast-Path" describe 块追加约 60-80 行测试代码）

### 风险评估
- **风险级别**：低
- **性能影响**：仅影响 4 种低频 hook 类型，Zod 解析耗时约 0.1-0.5ms，对整体性能无可测量影响
- **回归风险**：极低，修改范围仅一个条件判断；现有测试覆盖所有非敏感 hook 路径
- **注意事项**：现有测试 `"should apply sensitive filtering on fast-path too"` 的描述将在修复后出现语义偏差（敏感 hook 不再走 fast path），建议同步更新该测试的描述字符串，但其断言逻辑（验证字段过滤结果）仍然正确，无需修改断言

### CI 门禁要求
修改完成后须通过：
```
tsc --noEmit && npm run build && npm test
```
所有现有测试通过，且新增测试通过。
