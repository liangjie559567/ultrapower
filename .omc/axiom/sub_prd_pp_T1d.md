# Sub-PRD: T-1d gemini-core --yolo 环境变量化

> **Status**: APPROVED
> **Context**: 安全加固专项 — 硬编码参数消除
> **Task ID**: T-1d
> **文件**: `src/mcp/gemini-core.ts`（行 89）、`src/team/mcp-team-bridge.ts`（行 347）
> **优先级**: P1（可维护性 + CI 稳定性）

---

## 1. 目标

将两处硬编码的 `--yolo` 标志替换为由环境变量 `OMC_GEMINI_YOLO` 控制的动态标志，**默认值为 `true`**，确保 CI/非交互环境中 Gemini CLI 不会因缺少该标志而永久阻塞，同时允许用户在需要交互式确认时通过显式设置 `OMC_GEMINI_YOLO=false` 禁用该标志。

### 在整体方案中的位置

本任务属于"痛点修复专项"中硬编码配置消除类别。`--yolo` 是 Gemini CLI 的非交互模式标志，用于跳过所有交互式确认提示——这在 CI 流水线、Hook 环境及 tmux 后台 bridge 进程中是必须的。两处调用点位于不同模块，须统一由共享常量控制，避免将来出现"改了一处、遗漏另一处"的维护陷阱。

---

## 2. 接口契约 (I/O)

### 2.1 新增共享常量（`src/mcp/gemini-core.ts` 导出）

```typescript
// 新增导出常量（与 GEMINI_DEFAULT_MODEL、GEMINI_TIMEOUT 并列）
export const GEMINI_YOLO: boolean
```

**语义**：
- `true` — 向 Gemini CLI 传入 `--yolo` 标志（非交互模式，CI/Hook 默认）
- `false` — 不传入 `--yolo`，Gemini CLI 在遇到需确认操作时会等待用户输入

**解析规则**（精确）：

| `OMC_GEMINI_YOLO` 值 | `GEMINI_YOLO` 结果 |
|---------------------|--------------------|
| 未设置（`undefined`） | `true`（默认） |
| `'false'`（字符串） | `false` |
| `'0'`（字符串） | `false` |
| 其他任意非空字符串 | `true` |

> 设计原则：凡不是明确的"否定"值，均视为 `true`，防止 CI 因拼写错误的环境变量值而挂起。

### 2.2 函数签名变化

两个函数的签名**不变**：

```typescript
// gemini-core.ts
export function executeGemini(prompt: string, model?: string, cwd?: string): Promise<string>

// mcp-team-bridge.ts（内部函数，已导出）
export function spawnCliProcess(
  provider: 'codex' | 'gemini',
  prompt: string,
  model: string | undefined,
  cwd: string,
  timeoutMs: number
): { child: ChildProcess; result: Promise<string> }
```

### 2.3 Input / Output / Side Effects

| 维度 | 描述 |
|------|------|
| Input | `process.env.OMC_GEMINI_YOLO` — 字符串或 `undefined` |
| Output | `GEMINI_YOLO: boolean` — 模块级常量，进程生命周期内固定 |
| Side Effects | 无文件写入、无网络请求；影响 Gemini CLI 子进程参数数组 |

---

## 3. 数据模型

无新增数据结构。仅新增一个模块级布尔常量。

### 3.1 常量定义（`src/mcp/gemini-core.ts`，紧接 GEMINI_TIMEOUT 之后）

```typescript
// 伪代码 — 解析逻辑
GEMINI_YOLO =
  IF env.OMC_GEMINI_YOLO is undefined:
    true   // 默认：CI/非交互环境必须有 --yolo
  ELSE IF env.OMC_GEMINI_YOLO === 'false' OR env.OMC_GEMINI_YOLO === '0':
    false
  ELSE:
    true
```

### 3.2 `--yolo` 语义边界说明（代码注释要求）

实现中必须包含以下注释，澄清 `--yolo` 不是安全漏洞标志：

```
// OMC_GEMINI_YOLO controls whether --yolo is passed to the Gemini CLI.
// --yolo is a NON-INTERACTIVE MODE flag that suppresses all confirmation
// prompts from the Gemini CLI. It is NOT a security bypass flag.
// Default: true — required in CI, hooks, and background bridge processes
// to prevent Gemini CLI from blocking indefinitely waiting for user input.
// Set OMC_GEMINI_YOLO=false only in interactive development contexts where
// you want Gemini to prompt before taking destructive actions.
```

---

## 4. 实现规格

### 4.1 修改点一：`src/mcp/gemini-core.ts`（行 53-55 附近）

**当前（行 53-55）：**

```typescript
export const GEMINI_DEFAULT_MODEL = process.env.OMC_GEMINI_DEFAULT_MODEL || 'gemini-3-pro-preview';
export const GEMINI_TIMEOUT = Math.min(Math.max(5000, parseInt(process.env.OMC_GEMINI_TIMEOUT || '3600000', 10) || 3600000), 3600000);
```

**修改后（在 GEMINI_TIMEOUT 之后新增）：**

```typescript
// 伪代码逻辑
const _yoloEnv = process.env.OMC_GEMINI_YOLO;
export const GEMINI_YOLO: boolean =
  _yoloEnv === 'false' || _yoloEnv === '0' ? false : true;
// 注释块（见 3.2 节要求）
```

**修改点一：`executeGemini` 函数体（行 89）：**

```typescript
// 当前（行 89）
const args = ['-p=.', '--yolo'];

// 修改后（伪代码）
const args = ['-p=.'];
IF GEMINI_YOLO:
  args.push('--yolo');
```

### 4.2 修改点二：`src/team/mcp-team-bridge.ts`（行 345-349 附近）

`mcp-team-bridge.ts` 不定义自己的 `GEMINI_YOLO`，直接从 `gemini-core.ts` 导入：

**新增 import（在现有 import 块中加入）：**

```typescript
import { GEMINI_YOLO } from '../mcp/gemini-core.js';
```

**修改 `spawnCliProcess` Gemini 分支（行 346-348）：**

```typescript
// 当前
} else {
  cmd = 'gemini';
  args = ['--yolo'];
  if (model) args.push('--model', model);
}

// 修改后（伪代码）
} else {
  cmd = 'gemini';
  args = [];
  IF GEMINI_YOLO:
    args.push('--yolo');
  IF model:
    args.push('--model', model);
}
```

### 4.3 修改点三：`src/mcp/gemini-core.ts` 第 191 行（`executeGeminiBackground` 内部）

经源码核实，`gemini-core.ts` 存在**第二处** `--yolo` 硬编码，位于 `executeGeminiBackground()` 的内部函数 `trySpawnWithModel()` 中：

**当前（行 191）：**

```typescript
const args = ['-p=.', '--yolo', '--model', tryModel];
```

**修改后（伪代码）：**

```typescript
const args = ['-p=.'];
IF GEMINI_YOLO:
  args.push('--yolo');
args.push('--model', tryModel);
```

### 4.4 变更范围确认

| 文件 | 行范围 | 变更类型 |
|------|--------|----------|
| `src/mcp/gemini-core.ts` | 第 55 行后新增 ~8 行 | 新增常量 `GEMINI_YOLO` 及注释 |
| `src/mcp/gemini-core.ts` | 第 89 行 | 条件化 `--yolo` 插入（`executeGemini` 前台路径） |
| `src/mcp/gemini-core.ts` | 第 191 行 | 条件化 `--yolo` 插入（`executeGeminiBackground` 后台路径） |
| `src/team/mcp-team-bridge.ts` | import 区域 | 新增 `GEMINI_YOLO` 导入 |
| `src/team/mcp-team-bridge.ts` | 第 347 行 | 条件化 `--yolo` 插入 |

**不修改**：`runBridge`、`buildTaskPrompt`、所有非 Gemini 分支逻辑。

> **注意**：`gemini-core.ts` 共有**两处** `--yolo` 硬编码（行 89 和行 191），两处必须同步修改，否则前台/后台行为不一致。

---

## 5. 测试用例设计

### 5.1 测试文件位置

#### gemini-core 测试
新建文件：`src/mcp/__tests__/gemini-yolo-env.test.ts`

参考同目录已有测试 `codex-reasoning-effort.test.ts` 的 mock 结构（`vi.mock('child_process')`、`setupSpawnMock()` 模式）。

#### mcp-team-bridge 测试
在现有文件 `src/team/__tests__/mcp-team-bridge.test.ts` 的 `spawnCliProcess` describe 块（行 312）中追加新测试用例。

### 5.2 Mock 策略

两个测试文件均使用 `vi.mock('child_process')` 拦截 `spawn`，验证其 `args` 参数数组，而非执行真实子进程。环境变量通过 `beforeEach`/`afterEach` 中的 `process.env.OMC_GEMINI_YOLO` 赋值/删除来控制。

**重要约束**：`GEMINI_YOLO` 是模块级常量，在模块首次 `import` 时即求值。因此测试须使用 `vi.resetModules()` + 动态 `import()` 技术，在每个测试用例中以新的环境变量状态重新加载模块。

### 5.3 gemini-core 测试用例（`gemini-yolo-env.test.ts`）

#### TC-01：OMC_GEMINI_YOLO 未设置 — 默认传入 --yolo（executeGemini）

```gherkin
Given: process.env.OMC_GEMINI_YOLO 未设置（delete）
  And: child_process.spawn 已 mock
When: 调用 executeGemini('test prompt')
Then: spawn 的第二个参数（args）包含 '--yolo'
  And: GEMINI_YOLO 常量值为 true
```

#### TC-02：OMC_GEMINI_YOLO=true — 传入 --yolo（executeGemini）

```gherkin
Given: process.env.OMC_GEMINI_YOLO = 'true'
  And: 模块已通过 vi.resetModules() + 动态 import 重新加载
When: 调用 executeGemini('test prompt')
Then: spawn args 包含 '--yolo'
```

#### TC-03：OMC_GEMINI_YOLO=false — 不传入 --yolo（executeGemini）

```gherkin
Given: process.env.OMC_GEMINI_YOLO = 'false'
  And: 模块已重新加载
When: 调用 executeGemini('test prompt')
Then: spawn args 不包含 '--yolo'
  And: GEMINI_YOLO 常量值为 false
```

#### TC-04：OMC_GEMINI_YOLO=0 — 不传入 --yolo（executeGemini）

```gherkin
Given: process.env.OMC_GEMINI_YOLO = '0'
  And: 模块已重新加载
When: 调用 executeGemini('test prompt')
Then: spawn args 不包含 '--yolo'
```

#### TC-05：OMC_GEMINI_YOLO=拼写错误值（'flase'）— 仍传入 --yolo（防 CI 挂起）

```gherkin
Given: process.env.OMC_GEMINI_YOLO = 'flase'
  And: 模块已重新加载
When: 调用 executeGemini('test prompt')
Then: spawn args 包含 '--yolo'（容错为 true）
```

#### TC-05b：OMC_GEMINI_YOLO=false — 后台路径（executeGeminiBackground/trySpawnWithModel）不传 --yolo

```gherkin
Given: process.env.OMC_GEMINI_YOLO = 'false'
  And: 模块已重新加载
When: 调用 executeGeminiBackground（background=true 路径）触发 trySpawnWithModel
Then: spawn args 不包含 '--yolo'
  And: spawn args 包含 '--model' 和对应模型名
  And: spawn args 包含 '-p=.'
```

#### TC-06：GEMINI_YOLO=false 时其他 args 不受影响

```gherkin
Given: process.env.OMC_GEMINI_YOLO = 'false'
  And: 模块已重新加载
When: 调用 executeGemini('test prompt', 'gemini-2.0-flash')
Then: spawn args 包含 '--model' 和 'gemini-2.0-flash'
  And: spawn args 不包含 '--yolo'
  And: spawn args 包含 '-p=.'
```

### 5.4 mcp-team-bridge 测试用例（追加至现有 `spawnCliProcess` describe 块）

#### TC-07：OMC_GEMINI_YOLO 未设置 — gemini 分支默认传入 --yolo

```gherkin
Given: process.env.OMC_GEMINI_YOLO 未设置
  And: GEMINI_YOLO 模块常量为 true（默认）
  And: spawn 已 mock
When: spawnCliProcess('gemini', 'prompt', undefined, '/tmp', 5000)
Then: spawn args 包含 '--yolo'
```

#### TC-08：GEMINI_YOLO=false 时 gemini 分支不传 --yolo

```gherkin
Given: GEMINI_YOLO 被 vi.mock('../mcp/gemini-core.js') 覆盖为 false
When: spawnCliProcess('gemini', 'prompt', undefined, '/tmp', 5000)
Then: spawn args 不包含 '--yolo'
  And: cmd 为 'gemini'
```

#### TC-09：codex 分支不受 GEMINI_YOLO 影响

```gherkin
Given: GEMINI_YOLO 被 mock 为 false
When: spawnCliProcess('codex', 'prompt', undefined, '/tmp', 5000)
Then: spawn args 包含 '--json'
  And: spawn args 包含 '--full-auto'
  And: cmd 为 'codex'
```

#### TC-10：回归 — 现有 "gemini provider spawns with --yolo flag" 测试保持通过

```gherkin
Given: GEMINI_YOLO 为 true（默认）
When: spawnCliProcess('gemini', 'test prompt', undefined, '/tmp', 5000)
Then: args 包含 '--yolo'
（此为对现有 TC 行 332-341 的回归保护）
```

### 5.5 现有测试兼容性

现有 `mcp-team-bridge.test.ts` 中测试（行 332-341）断言 `args` 包含 `'--yolo'`——在 `GEMINI_YOLO` 默认为 `true` 的条件下，该断言**继续成立，无需修改**。

---

## 6. 验收标准

```gherkin
Feature: OMC_GEMINI_YOLO 环境变量控制 Gemini CLI --yolo 标志

  Scenario: 未设置环境变量时默认启用 --yolo（gemini-core）
    Given OMC_GEMINI_YOLO 环境变量未设置
    When executeGemini 被调用
    Then spawn 的 args 包含 '--yolo'

  Scenario: OMC_GEMINI_YOLO=false 时禁用 --yolo（gemini-core）
    Given OMC_GEMINI_YOLO 设置为 'false'
    When executeGemini 被调用
    Then spawn 的 args 不包含 '--yolo'

  Scenario: OMC_GEMINI_YOLO=0 时禁用 --yolo（gemini-core）
    Given OMC_GEMINI_YOLO 设置为 '0'
    When executeGemini 被调用
    Then spawn 的 args 不包含 '--yolo'

  Scenario: 未设置环境变量时 bridge 中也默认传 --yolo
    Given OMC_GEMINI_YOLO 未设置
    When spawnCliProcess 以 'gemini' provider 被调用
    Then spawn 的 args 包含 '--yolo'

  Scenario: OMC_GEMINI_YOLO=false 时 bridge 中不传 --yolo
    Given GEMINI_YOLO 常量为 false
    When spawnCliProcess 以 'gemini' provider 被调用
    Then spawn 的 args 不包含 '--yolo'

  Scenario: codex provider 完全不受 GEMINI_YOLO 影响
    Given GEMINI_YOLO 为任意值
    When spawnCliProcess 以 'codex' provider 被调用
    Then spawn args 依然包含 '--json' 和 '--full-auto'
    And cmd 依然为 'codex'

  Scenario: 全套单元测试通过
    When 执行 npm test -- src/mcp/__tests__/gemini-yolo-env.test.ts
    Then 所有 6 个测试用例通过
    When 执行 npm test -- src/team/__tests__/mcp-team-bridge.test.ts
    Then 全部测试（含新增 4 个）通过
```

---

## 7. CI 验证要求

按 Axiom CI Gate 规则，实现完成后必须执行：

```bash
# 1. TypeScript 编译检查
tsc --noEmit

# 2. 构建验证
npm run build

# 3. 单元测试（新增文件）
npm test -- src/mcp/__tests__/gemini-yolo-env.test.ts

# 4. 单元测试（回归）
npm test -- src/team/__tests__/mcp-team-bridge.test.ts
```

全部通过后方可宣告任务完成。

---

## 8. 不在本次范围内

- 不修改 `executeGeminiWithFallback` 的签名或逻辑
- 不修改 `codex-core.ts` 或任何 Codex CLI 调用路径
- 不为 `GEMINI_YOLO` 添加运行时动态读取机制（常量在进程启动时固定，重置须重启进程）
- 不引入用户配置文件（`.omc/config` 等）中的 `geminiYolo` 字段，此为未来独立任务
