# Sub-PRD: T-1a state-manager 外部接口层路径遍历防护

> **Status**: APPROVED
> **Context**: runtime-protection.md P0 安全规则 §2.4
> **创建日期**: 2026-03-01
> **任务ID**: T-1a
> **优先级**: P0 安全修复

---

## 1. 目标

在 MCP 工具的外部接口入口层（`state_read` 和 `state_write` handler）添加 `assertValidMode()` 白名单校验，阻断路径遍历攻击向量，同时不修改 `getStatePath()` 的签名或内部逻辑。

**整体方案中的位置**：`state-tools.ts` 是唯一将外部调用者提供的 `mode` 参数用于构造文件路径的 MCP 层入口。虽然 Zod schema 已通过 `z.enum(STATE_TOOL_MODES)` 进行枚举校验，但 `STATE_TOOL_MODES` 包含 `ralplan` 等额外值，且 Zod 枚举校验属于类型层校验，不满足 runtime-protection.md 要求的运行时白名单断言。`assertValidMode()` 提供运行时安全断言作为第二道防线。

---

## 2. 实现接口 (I/O)

### 2.1 state_read handler 入口

**当前签名（不变）**：
```
handler: async (args: { mode, workingDirectory?, session_id? }) => ToolResponse
```

**修改点（handler 函数体顶部，try 块内第一行）**：

```
// 伪代码：handler 入口第一行
try {
  assertValidMode(args.mode)   // ← 新增：运行时白名单断言
  // ... 现有逻辑不变
} catch (error) {
  return errorResponse(error.message)
}
```

**Input**: `args.mode` — 来自外部调用者的字符串，可能包含路径遍历攻击载荷

**Output（正常路径）**: 不变，沿用现有逻辑

**Output（校验失败）**:
```typescript
{
  content: [{ type: 'text', text: '[ultrapower] 错误：无效的状态模式：{mode}' }],
  isError: true
}
```

**Side Effects**: 无文件系统操作（在校验失败时提前返回）

### 2.2 state_write handler 入口

与 state_read 相同模式：在 `try` 块内，`const root = validateWorkingDirectory(...)` 之前插入 `assertValidMode(args.mode)`。

### 2.3 assertValidMode 已有签名（不修改）

位置：`src/lib/validateMode.ts`，第 63 行

```typescript
export function assertValidMode(mode: unknown): ValidMode
// 对有效模式返回 ValidMode 类型值
// 对无效模式抛出 Error('Invalid mode: "..."')
```

**注意**：`assertValidMode` 的白名单 `VALID_MODES` 包含 8 个核心模式（不含 `ralplan`）。`ralplan` 仅通过 Zod enum 层校验，不通过 `assertValidMode`。详见第 4 节对 `ralplan` 的边界处理分析。

---

## 3. 数据结构

### 3.1 不新增任何数据结构

本任务不涉及新 model、enum 或 schema。

### 3.2 现有白名单（仅供参考）

`src/lib/validateMode.ts` 中 `VALID_MODES`（8 个）：
```typescript
['autopilot', 'ultrapilot', 'team', 'pipeline', 'ralph', 'ultrawork', 'ultraqa', 'swarm']
```

`src/tools/state-tools.ts` 中 `STATE_TOOL_MODES`（9 个，含 `ralplan`）：
```typescript
['autopilot', 'ultrapilot', 'swarm', 'pipeline', 'team', 'ralph', 'ultrawork', 'ultraqa', 'ralplan']
```

### 3.3 错误响应格式（规范）

错误文本格式必须与任务验收条件一致：
```
[ultrapower] 错误：无效的状态模式：{mode_input_截断后}
```

由于 `assertValidMode` 抛出的错误消息格式为 `Invalid mode: "..."（Valid modes are: ...）`，handler 的 catch 块需将此错误包装为规范格式。

---

## 4. 实现流程

### 4.1 关键决策：ralplan 的处理方式

`ralplan` 通过 Zod enum 校验（`STATE_TOOL_MODES` 中包含），但不在 `assertValidMode` 的 `VALID_MODES` 白名单中。

**分析**：
- Zod enum 在 MCP 框架层于 `handler` 被调用前执行，非法枚举值已被 MCP 框架拒绝
- `assertValidMode()` 的目的是防止运行时路径拼接漏洞
- `ralplan` 是经过枚举声明的合法值，不构成路径遍历风险
- 因此：对 `ralplan` 使用 `assertValidMode()` 会导致合法请求被拒绝（功能回归）

**解决方案**：使用 `validateMode()` 而非 `assertValidMode()`，对 `ralplan` 额外白名单：

```
// 伪代码
function isValidStatetoolMode(mode: string): boolean {
  return validateMode(mode) || mode === 'ralplan'
}

// handler 入口
if (!isValidStatetoolMode(args.mode)) {
  return errorResponse(`[ultrapower] 错误：无效的状态模式：${safe(args.mode)}`)
}
```

**替代方案（更保守）**：直接调用 `assertValidMode()`，仅对 `ralplan` 跳过：

```
// 伪代码
if (mode !== 'ralplan') {
  assertValidMode(mode)  // 对 8 个核心模式断言
}
// ralplan 已由 Zod enum 保护
```

**推荐采用替代方案**（更接近 assertValidMode 调用规范，避免引入新函数）。

### 4.2 实现步骤（伪代码）

**步骤 1**：在 `state_read` handler（第 74 行）的 `try` 块内，`validateWorkingDirectory` 调用之前，插入：

```
// state_read handler，try 块第一行
const { mode, workingDirectory, session_id } = args;

// 新增：P0 安全校验——外部接口层路径遍历防护
if (mode !== 'ralplan') {
  try {
    assertValidMode(mode);
  } catch {
    return {
      content: [{ type: 'text', text: `[ultrapower] 错误：无效的状态模式：${mode}` }],
      isError: true
    };
  }
}

// 现有逻辑继续
const root = validateWorkingDirectory(workingDirectory);
```

**步骤 2**：在 `state_write` handler（第 237 行）的 `try` 块内，`validateWorkingDirectory` 调用之前，相同处理。

**步骤 3**：在文件顶部 import 块中，添加对 `assertValidMode` 的导入：

```
import { assertValidMode } from '../lib/validateMode.js';
```

**步骤 4**：新增测试（见第 5 节）。

### 4.3 代码修改位置（精确行号）

| 修改类型 | 文件 | 位置 | 说明 |
|--------|------|------|------|
| 新增 import | `src/tools/state-tools.ts` | 第 8-30 行 import 区块末尾 | 添加 `assertValidMode` 导入 |
| 新增校验块 | `src/tools/state-tools.ts` | `stateReadTool.handler`，第 75-76 行之间 | try 块内第一行，解构赋值后 |
| 新增校验块 | `src/tools/state-tools.ts` | `stateWriteTool.handler`，第 253-255 行之间 | try 块内第一行，解构赋值后 |
| 新增测试文件 | `src/tools/__tests__/state-tools.test.ts` | 新增 `describe` 块 | 路径遍历防护回归测试 |

---

## 5. 测试用例设计

### 5.1 新增测试（在现有 `state-tools.test.ts` 末尾追加 describe 块）

```typescript
describe('路径遍历防护（P0 安全回归）', () => {

  // 测试用例 1：state_read 拒绝路径遍历攻击载荷
  it('state_read 应拒绝路径遍历攻击载荷并返回错误响应', async () => {
    const maliciousMode = '../../etc/passwd' as any;
    const result = await stateReadTool.handler({
      mode: maliciousMode,
      workingDirectory: TEST_DIR,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
    // 不能有任何文件系统操作发生
    // （通过验证错误响应已提前返回来间接确认）
  });

  // 测试用例 2：state_write 拒绝路径遍历攻击载荷
  it('state_write 应拒绝路径遍历攻击载荷并返回错误响应', async () => {
    const maliciousMode = '../state/evil' as any;
    const result = await stateWriteTool.handler({
      mode: maliciousMode,
      state: { active: true },
      workingDirectory: TEST_DIR,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
  });

  // 测试用例 3：空字符串被拒绝
  it('state_read 应拒绝空字符串 mode', async () => {
    const result = await stateReadTool.handler({
      mode: '' as any,
      workingDirectory: TEST_DIR,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
  });

  // 测试用例 4：ralplan 仍然通过校验（不引入功能回归）
  it('state_read 应接受 ralplan 作为合法模式（不被 assertValidMode 阻断）', async () => {
    // ralplan 由 Zod enum 保护，不在 VALID_MODES 中但属于合法值
    const result = await stateReadTool.handler({
      mode: 'ralplan',
      workingDirectory: TEST_DIR,
    });

    // 不应有 isError: true（ralplan 模式未找到状态是正常的）
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('No state found');
  });

  // 测试用例 5：null 字节注入被拒绝
  it('state_write 应拒绝含 null 字节的 mode 参数', async () => {
    const result = await stateWriteTool.handler({
      mode: 'ralph\x00../../etc' as any,
      state: { active: true },
      workingDirectory: TEST_DIR,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('[ultrapower] 错误：无效的状态模式：');
  });
});
```

### 5.2 回归测试确认（现有测试全部通过要求）

在测试套件执行后，以下现有测试组不得出现 FAIL：
- `describe('state_read')` — 所有用例
- `describe('state_write')` — 所有用例
- `describe('state_clear')` — 所有用例
- `describe('state_list_active')` — 所有用例
- `describe('state_get_status')` — 所有用例
- `describe('session_id parameter')` — 所有用例
- `describe('session-scoped behavior')` — 所有用例

---

## 6. 边界情况处理

| 场景 | 期望行为 | 理由 |
|------|--------|------|
| `mode = '../../etc/passwd'` | isError: true，错误文本含规范前缀 | 路径遍历典型载荷 |
| `mode = ''`（空字符串） | isError: true | validateMode 返回 false |
| `mode = null`（TypeScript 绕过） | isError: true | assertValidMode 处理非字符串 |
| `mode = 'autopilot\x00../../etc'` | isError: true | validateMode 严格匹配，null 字节不在白名单 |
| `mode = 'ralplan'` | 正常执行，不报错 | ralplan 由 Zod enum 保护，属于合法扩展值 |
| `mode = 'AUTOPILOT'`（大写） | isError: true | 白名单区分大小写 |
| `mode = ' ralph '`（带空格） | isError: true | 白名单不包含带空格的变体 |
| 超长字符串（1MB） | isError: true，无 DoS | assertValidMode 已实现截断至 50 字符 |

---

## 7. 验收标准（Gherkin）

```gherkin
Feature: state-manager 外部接口层路径遍历防护

  Scenario: state_read 拒绝路径遍历 mode 参数
    Given MCP 客户端调用 state_read
    When mode 参数值为 "../../etc/passwd"
    Then handler 返回 isError: true
    And 响应文本以 "[ultrapower] 错误：无效的状态模式：" 开头
    And 未执行任何文件系统读取操作

  Scenario: state_write 拒绝路径遍历 mode 参数
    Given MCP 客户端调用 state_write
    When mode 参数值为 "../state/evil"
    Then handler 返回 isError: true
    And 响应文本以 "[ultrapower] 错误：无效的状态模式：" 开头
    And 未创建任何状态文件

  Scenario: 合法 mode 值正常通过校验
    Given MCP 客户端调用 state_read 或 state_write
    When mode 参数值为 "ralph"（或其他 8 个核心模式之一）
    Then handler 不返回 isError: true
    And 继续执行现有业务逻辑

  Scenario: ralplan 不被 assertValidMode 误拦
    Given MCP 客户端调用 state_read
    When mode 参数值为 "ralplan"
    Then handler 不返回 isError: true
    And 响应文本不含 "无效的状态模式"

  Scenario: 空字符串 mode 被拒绝
    Given MCP 客户端调用 state_read 或 state_write
    When mode 参数值为 ""
    Then handler 返回 isError: true
    And 响应文本含 "无效的状态模式"
```

---

## 8. 不修改范围（明确排除）

以下内容不在本任务修改范围内：

- `src/features/state-manager/index.ts` 中的 `getStatePath(name, location)` — 签名和实现均不变
- `src/lib/validateMode.ts` — `VALID_MODES`、`validateMode`、`assertValidMode` 均不变
- `src/tools/state-tools.ts` 中的 `getStatePath(mode, root)` 本地辅助函数（第 50-56 行）— 不变
- `stateClearTool`、`stateListActiveTool`、`stateGetStatusTool` — 本次不修改（风险评估较低，mode 参数经 Zod 枚举校验后路径构造均经过 registry 查找间接保护）

---

## 9. 实现完成标志

以下条件全部满足时，可标记任务为完成：

- [ ] `src/tools/state-tools.ts` 顶部 import 中包含 `assertValidMode`
- [ ] `stateReadTool.handler` 的 `try` 块内，`validateWorkingDirectory` 调用之前，存在 mode 校验逻辑
- [ ] `stateWriteTool.handler` 的 `try` 块内，`validateWorkingDirectory` 调用之前，存在 mode 校验逻辑
- [ ] 校验失败时返回格式为 `{ content: [{ text: '[ultrapower] 错误：无效的状态模式：...' }], isError: true }`
- [ ] `src/tools/__tests__/state-tools.test.ts` 中新增至少 2 个路径遍历防护测试用例
- [ ] 路径遍历防护测试全部通过（`../../etc/passwd`、空字符串等载荷）
- [ ] `ralplan` 模式不被新增校验误拦（零回归）
- [ ] 现有所有 state-tools 测试（共 15+ 个用例）全部通过
- [ ] `getStatePath()` 函数签名和内部逻辑未被修改
