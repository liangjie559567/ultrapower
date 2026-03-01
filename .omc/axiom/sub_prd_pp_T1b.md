# Sub-PRD: T-1b — state-tools 类型审查 + atomic-write 测试

**任务 ID：** T-1b
**依赖：** T-1a（已完成）
**估计工时：** 5h
**目标文件：**
- `src/tools/state-tools.ts`（类型审查，可能需要修改）
- `src/lib/__tests__/atomic-write.test.ts`（新建）

---

## 问题分析

### 问题 1：StateToolMode 与 assertValidMode() 的白名单不一致

T-1a 在 `src/lib/validateMode.ts` 中定义了 `VALID_MODES` 白名单（8 个 mode），
但 **`ralplan` 不在 `VALID_MODES` 中**。

`state-tools.ts` 中的 `STATE_TOOL_MODES` 在 `EXECUTION_MODES`（8 个）基础上追加了
`ralplan`，形成 9 个合法值。这是**有意设计**（注释已说明：ralplan 有 state 但不在
mode-registry 中），但 `assertValidMode()` 的白名单无法覆盖 `ralplan`，
两者之间存在语义分裂：

| 来源 | 包含的 modes | 是否含 ralplan |
|------|-------------|----------------|
| `VALID_MODES`（validateMode.ts） | autopilot, ultrapilot, team, pipeline, ralph, ultrawork, ultraqa, swarm | **否** |
| `EXECUTION_MODES`（state-tools.ts） | autopilot, ultrapilot, swarm, pipeline, team, ralph, ultrawork, ultraqa | **否** |
| `STATE_TOOL_MODES`（state-tools.ts） | 上述 8 个 + ralplan | **是** |

**风险：** 若 T-1a 在 handler 入口调用了 `assertValidMode(mode)`，
则 `ralplan` 将在运行时被拒绝，导致 state_read/state_write/state_clear 对 ralplan 失效。

### 问题 2：atomic-write 缺乏测试覆盖

`src/lib/atomic-write.ts` 导出了 4 个函数：
- `ensureDirSync(dir)`
- `atomicWriteJson(filePath, data)` — 异步
- `atomicWriteSync(filePath, content)` — 同步文本（已被 `atomicWriteFileSync` 替代，功能重叠）
- `atomicWriteFileSync(filePath, content)` — 同步文本
- `atomicWriteJsonSync(filePath, data)` — 同步 JSON（= atomicWriteFileSync + JSON.stringify）
- `safeReadJson<T>(filePath)` — 异步读取

当前 `src/lib/__tests__/` 目录下尚无 `atomic-write.test.ts`，6 个核心场景均未被测试。

---

## 代码定位

### StateToolMode 类型定义（state-tools.ts）

```
行 33-40：
  const EXECUTION_MODES: [string, ...string[]] = [
    'autopilot', 'ultrapilot', 'swarm', 'pipeline', 'team',
    'ralph', 'ultrawork', 'ultraqa'
  ];

  const STATE_TOOL_MODES: [string, ...string[]] = [...EXECUTION_MODES, 'ralplan'];
  type StateToolMode = typeof STATE_TOOL_MODES[number];
```

**核心问题**：`StateToolMode` 是从运行时数组推导的宽松字符串联合类型
（`string` 而非字面量联合），无法享受 TypeScript 类型收窄。

更精确的类型应为：
```typescript
type StateToolMode =
  | 'autopilot' | 'ultrapilot' | 'swarm' | 'pipeline'
  | 'team' | 'ralph' | 'ultrawork' | 'ultraqa' | 'ralplan';
```

### assertValidMode 的白名单（validateMode.ts）

```
行 18-27：
  export const VALID_MODES = [
    'autopilot', 'ultrapilot', 'team', 'pipeline',
    'ralph', 'ultrawork', 'ultraqa', 'swarm',
  ] as const;
```

**结论**：`ralplan` 被刻意排除在 `VALID_MODES` 之外。
T-1a 的 handler 入口校验需要为 `ralplan` 做 **旁路处理**（skip assertValidMode），
或者为 state-tools 提供独立的扩展白名单校验函数。

### atomicWriteJsonSync 调用路径（state-tools.ts）

```
行 316：
  atomicWriteJsonSync(statePath, stateWithMeta);
```

此处是状态写入的唯一路径，必须覆盖测试。

---

## 修复方案

### 方案 A：StateToolMode 类型修复

将运行时数组推导类型改为显式字面量联合类型，提升类型安全性：

```typescript
// 修改前（宽松，无法收窄）
const STATE_TOOL_MODES: [string, ...string[]] = [...EXECUTION_MODES, 'ralplan'];
type StateToolMode = typeof STATE_TOOL_MODES[number]; // => string

// 修改后（精确字面量联合）
const STATE_TOOL_MODES = [
  'autopilot', 'ultrapilot', 'swarm', 'pipeline', 'team',
  'ralph', 'ultrawork', 'ultraqa', 'ralplan'
] as const;
type StateToolMode = typeof STATE_TOOL_MODES[number];
// => 'autopilot' | 'ultrapilot' | 'swarm' | 'pipeline' | 'team'
//  | 'ralph' | 'ultrawork' | 'ultraqa' | 'ralplan'
```

同时确保 Zod schema 保持兼容：
```typescript
mode: z.enum(STATE_TOOL_MODES)
// z.enum 需要 [string, ...string[]] tuple，需转换：
mode: z.enum(STATE_TOOL_MODES as unknown as [StateToolMode, ...StateToolMode[]])
```

### 方案 B：ralplan 在 assertValidMode 中的处理策略

T-1a 若在 handler 入口使用了 `assertValidMode(mode)`，
则必须采用以下任一策略处理 ralplan：

**策略 B1（推荐）**：在 state-tools handler 内使用独立的扩展校验，
不复用 `assertValidMode`，保持 validateMode.ts 白名单不变：

```typescript
// state-tools.ts 顶部
const STATE_TOOL_MODES_SET = new Set(STATE_TOOL_MODES);
function assertStateToolMode(mode: unknown): StateToolMode {
  if (typeof mode !== 'string' || !STATE_TOOL_MODES_SET.has(mode)) {
    throw new Error(`Invalid state tool mode: "${mode}"`);
  }
  return mode as StateToolMode;
}
```

**策略 B2（备选）**：在 validateMode.ts 中将 `ralplan` 加入 `VALID_MODES`，
但这会让 `assertValidMode` 的语义与 mode-registry 的 `ExecutionMode` 完全不同，
破坏单一职责——**不推荐**。

---

## 实现步骤

### Step 1：StateToolMode 类型审查（~1h）

1. 读取 `src/tools/state-tools.ts` 第 33-40 行
2. 将 `STATE_TOOL_MODES` 改为 `as const` 数组，移除对 `EXECUTION_MODES` 的依赖展开
3. 更新 `StateToolMode` 类型推导（使用 `typeof STATE_TOOL_MODES[number]`）
4. 检查所有使用 `STATE_TOOL_MODES` 作为 Zod 参数的地方，确保类型兼容
5. 确认 `ralplan` 在 `STATE_TOOL_MODES` 中（已存在，无需新增）
6. 确认 `getStatePath` 函数的 `mode as ExecutionMode` 类型转换仍安全
7. 运行 `tsc --noEmit` 验证零类型错误

### Step 2：检查 T-1a 的 assertValidMode 集成（~0.5h）

1. 在 state-tools.ts 的 handler 中搜索 `assertValidMode` 调用
2. 如果存在调用，确认 `ralplan` 传入时是否会抛异常
3. 如有必要，按策略 B1 添加独立的 `assertStateToolMode` 函数替换

### Step 3：新建 atomic-write.test.ts（~3.5h）

创建文件 `src/lib/__tests__/atomic-write.test.ts`，
使用项目现有测试框架（检测 package.json 中的 jest/vitest 配置）。

---

## 测试场景（6+）

以下是 6 个必须覆盖的测试场景的具体实现伪代码。

### 测试框架假设

项目使用 Jest（或 Vitest，接口相同）。
测试文件使用 `tmp` 临时目录，每个测试前创建、每个测试后清理。

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  atomicWriteJson,
  atomicWriteJsonSync,
  atomicWriteFileSync,
  safeReadJson,
  ensureDirSync,
} from '../atomic-write.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
```

### 场景 1：正常写入成功并验证文件内容一致

**目标**：验证 `atomicWriteJson` 写入后文件内容与原始数据完全一致。

```pseudocode
test('atomicWriteJson 正常写入并文件内容一致', async () => {
  filePath = path.join(tmpDir, 'state.json')
  data = { active: true, mode: 'ralph', iteration: 3 }

  await atomicWriteJson(filePath, data)

  // 验证文件存在
  assert existsSync(filePath) === true

  // 读取并解析
  content = fs.readFileSync(filePath, 'utf-8')
  parsed = JSON.parse(content)

  // 逐字段比对
  assert parsed.active === true
  assert parsed.mode === 'ralph'
  assert parsed.iteration === 3
})
```

**同步版本也需测试**：
```pseudocode
test('atomicWriteJsonSync 正常写入并文件内容一致', () => {
  filePath = path.join(tmpDir, 'sync-state.json')
  data = { active: false, current_phase: 'team-exec' }

  atomicWriteJsonSync(filePath, data)

  content = fs.readFileSync(filePath, 'utf-8')
  parsed = JSON.parse(content)
  assert parsed.active === false
  assert parsed.current_phase === 'team-exec'
})
```

### 场景 2：目标路径无权限时返回错误而非部分写入

**目标**：验证在无写权限目录下，函数抛出错误且目标文件不存在（不产生脏写入）。

**注意**：Windows 上权限模型不同，需 skip 或使用只读标志模拟。

```pseudocode
test('无权限目录写入时抛出错误且无部分写入', async () => {
  readonlyDir = path.join(tmpDir, 'readonly')
  fs.mkdirSync(readonlyDir)

  // Linux/macOS: 设置目录为只读
  if (process.platform !== 'win32') {
    fs.chmodSync(readonlyDir, 0o444)
  } else {
    skip('Windows 权限模型不支持此测试')
    return
  }

  filePath = path.join(readonlyDir, 'state.json')
  data = { active: true }

  // 期望抛出错误
  await expect(atomicWriteJson(filePath, data)).rejects.toThrow()

  // 验证目标文件不存在（无部分写入）
  assert existsSync(filePath) === false

  // 验证目录内没有残留 .tmp 文件
  files = fs.readdirSync(readonlyDir)
  tmpFiles = files.filter(f => f.includes('.tmp.'))
  assert tmpFiles.length === 0

  // 恢复权限（允许 afterEach 清理）
  fs.chmodSync(readonlyDir, 0o755)
})
```

### 场景 3：进程中断模拟后目标文件不存在或不变（原子性保证）

**目标**：模拟写入到 temp 文件后、rename 前的"中断"（通过测试内部实现），
验证此时目标文件不存在（原子性）。

**实现思路**：spyOn `fs/promises.rename`，使其在首次调用时抛出 `ENOENT`，
验证目标文件未被创建，且临时文件已被清理。

```pseudocode
test('rename 失败时目标文件不存在且临时文件已清理', async () => {
  filePath = path.join(tmpDir, 'state.json')
  data = { active: true }

  // 注入 rename 失败
  const originalRename = fs.promises.rename
  let renameCallCount = 0
  jest.spyOn(fs.promises, 'rename').mockImplementation(async (...args) => {
    renameCallCount++
    if (renameCallCount === 1) {
      throw Object.assign(new Error('rename failed'), { code: 'ENOENT' })
    }
    return originalRename(...args)
  })

  await expect(atomicWriteJson(filePath, data)).rejects.toThrow()

  // 目标文件不应存在
  assert existsSync(filePath) === false

  // 临时文件应已被清理（cleanup in finally block）
  entries = fs.readdirSync(tmpDir)
  tmpFiles = entries.filter(f => f.startsWith('.') && f.includes('.tmp.'))
  assert tmpFiles.length === 0

  jest.restoreAllMocks()
})
```

### 场景 4：并发写入同一路径（竞争条件边界）

**目标**：多个并发写入操作完成后，目标文件的内容是**其中某次完整写入的结果**，
而非两次写入的混合体（数据撕裂）。

```pseudocode
test('并发写入同一路径最终内容完整一致', async () => {
  filePath = path.join(tmpDir, 'concurrent.json')

  // 并发发起 10 次写入，每次数据不同
  writes = Array.from({ length: 10 }, (_, i) =>
    atomicWriteJson(filePath, { iteration: i, payload: 'x'.repeat(1000) })
  )

  await Promise.all(writes)

  // 文件必须存在
  assert existsSync(filePath) === true

  // 内容必须是合法 JSON（无数据撕裂）
  content = fs.readFileSync(filePath, 'utf-8')
  parsed = JSON.parse(content)  // 不应抛出

  // 内容必须是 0-9 中某个完整的 iteration 值
  assert typeof parsed.iteration === 'number'
  assert parsed.iteration >= 0 && parsed.iteration <= 9
  assert parsed.payload === 'x'.repeat(1000)
})
```

### 场景 5：大文件（>1MB）写入成功

**目标**：验证 `atomicWriteJson` 能正确处理超过 1MB 的 JSON payload，
写入后内容完整无截断。

```pseudocode
test('大文件（>1MB）写入成功且内容完整', async () => {
  filePath = path.join(tmpDir, 'large.json')

  // 构造约 1.5MB 的数据
  largeArray = Array.from({ length: 15000 }, (_, i) => ({
    id: i,
    value: 'a'.repeat(100)
  }))
  data = { items: largeArray }

  await atomicWriteJson(filePath, data)

  assert existsSync(filePath) === true

  // 验证文件大小 > 1MB
  stats = fs.statSync(filePath)
  assert stats.size > 1024 * 1024

  // 验证内容完整可解析
  content = fs.readFileSync(filePath, 'utf-8')
  parsed = JSON.parse(content)
  assert parsed.items.length === 15000
  assert parsed.items[0].value === 'a'.repeat(100)
  assert parsed.items[14999].id === 14999
})
```

### 场景 6：路径中含特殊字符（空格、中文）

**目标**：验证 `atomicWriteJson` 和 `atomicWriteJsonSync` 能正确处理
路径中含空格和中文字符的目录/文件名。

```pseudocode
test('路径含空格和中文字符时写入成功', async () => {
  // 含空格的目录
  spaceDir = path.join(tmpDir, 'my state files')
  fs.mkdirSync(spaceDir)
  spaceFilePath = path.join(spaceDir, 'ralph state.json')

  data1 = { active: true, note: '测试状态' }
  await atomicWriteJson(spaceFilePath, data1)

  assert existsSync(spaceFilePath) === true
  parsed1 = JSON.parse(fs.readFileSync(spaceFilePath, 'utf-8'))
  assert parsed1.note === '测试状态'

  // 含中文的目录和文件名
  chineseDir = path.join(tmpDir, '状态文件夹')
  fs.mkdirSync(chineseDir)
  chineseFilePath = path.join(chineseDir, '团队状态.json')

  data2 = { mode: 'team', phase: '执行阶段', active: false }
  atomicWriteJsonSync(chineseFilePath, data2)

  assert existsSync(chineseFilePath) === true
  parsed2 = JSON.parse(fs.readFileSync(chineseFilePath, 'utf-8'))
  assert parsed2.phase === '执行阶段'
})
```

### 场景 7（加分项）：safeReadJson 对不存在文件返回 null

```pseudocode
test('safeReadJson 对不存在的文件返回 null', async () => {
  nonexistentPath = path.join(tmpDir, 'nonexistent.json')
  result = await safeReadJson(nonexistentPath)
  assert result === null
})

test('safeReadJson 对损坏 JSON 文件返回 null', async () => {
  corruptPath = path.join(tmpDir, 'corrupt.json')
  fs.writeFileSync(corruptPath, '{ invalid json }}}')
  result = await safeReadJson(corruptPath)
  assert result === null
})
```

---

## 测试文件结构

```
src/lib/__tests__/
└── atomic-write.test.ts
    ├── describe('ensureDirSync')
    │   ├── 目录不存在时创建成功
    │   └── 目录已存在时幂等（不抛出）
    ├── describe('atomicWriteJson（异步）')
    │   ├── [场景 1] 正常写入成功并验证内容一致
    │   ├── [场景 2] 无权限路径写入抛出错误（Unix only）
    │   ├── [场景 3] rename 失败时目标文件不存在且 tmp 已清理
    │   ├── [场景 4] 并发写入同一路径内容完整一致
    │   └── [场景 5] 大文件（>1MB）写入成功
    ├── describe('atomicWriteJsonSync（同步）')
    │   ├── [场景 1 同步版] 正常写入并验证内容
    │   ├── [场景 2 同步版] 无权限路径写入抛出错误（Unix only）
    │   └── [场景 6] 路径含空格和中文字符时写入成功
    └── describe('safeReadJson')
        ├── [场景 7a] 不存在的文件返回 null
        └── [场景 7b] 损坏的 JSON 返回 null
```

---

## 验收标准

### StateToolMode 类型

- [ ] `STATE_TOOL_MODES` 数组使用 `as const`，TypeScript 能推导出精确字面量联合类型
- [ ] `StateToolMode` 联合类型包含所有 9 个合法值：
  `autopilot | ultrapilot | swarm | pipeline | team | ralph | ultrawork | ultraqa | ralplan`
- [ ] `ralplan` 明确包含在类型中（有代码注释说明它不在 mode-registry）
- [ ] Zod schema 仍能正确验证 9 个合法 mode，拒绝非法值
- [ ] 若 T-1a 引入了 `assertValidMode(mode)` 调用，确认 `ralplan` 不会被拒绝
  （旁路处理或使用独立的 `assertStateToolMode`）
- [ ] `tsc --noEmit` 无新增类型错误

### atomic-write 测试

- [ ] `src/lib/__tests__/atomic-write.test.ts` 文件存在
- [ ] 至少 6 个独立 `it/test` 测试场景（场景 1-6 必须覆盖）
- [ ] 所有测试使用隔离的临时目录（beforeEach 创建，afterEach 清理）
- [ ] 场景 1：正常写入内容验证通过
- [ ] 场景 2：无权限写入在 Unix 下抛出错误，在 Windows 下 skip
- [ ] 场景 3：模拟中断后目标文件不存在
- [ ] 场景 4：并发写入后文件内容是合法完整 JSON
- [ ] 场景 5：>1MB 大文件写入成功且可完整读回
- [ ] 场景 6：含空格/中文路径写入成功
- [ ] 全部测试在 `npm test` 或 `npx jest src/lib/__tests__/atomic-write.test.ts` 下通过

---

## 风险评估

| 风险 | 严重性 | 可能性 | 缓解措施 |
|------|--------|--------|---------|
| `ralplan` 被 `assertValidMode()` 拒绝（T-1a 兼容性） | 高 | 中 | 实现前先检查 T-1a 的 handler 修改；若存在问题，用 `assertStateToolMode` 替代 |
| Windows 上无权限测试（场景 2）无法执行 | 中 | 高 | 用 `process.platform !== 'win32'` 条件跳过，标注 skip 原因 |
| 场景 3 的 spyOn 在不同测试框架下行为差异 | 中 | 低 | 先确认框架（jest vs vitest），调整 mock API |
| `as const` 修改导致 Zod 类型不兼容 | 中 | 中 | 使用 `z.enum([...STATE_TOOL_MODES])` 形式；若报错，转换为 `[STATE_TOOL_MODES[0], ...STATE_TOOL_MODES.slice(1)]` |
| 临时文件在测试失败时未清理（Windows 文件锁） | 低 | 低 | afterEach 使用 `{ force: true }` 选项，忽略清理错误 |

---

## 附录：当前 StateToolMode 覆盖情况对照表

| Mode 值 | 在 VALID_MODES | 在 EXECUTION_MODES | 在 STATE_TOOL_MODES | 在 ExecutionMode（mode-registry） |
|---------|--------------|-------------------|---------------------|---------------------------------|
| autopilot | ✓ | ✓ | ✓ | ✓ |
| ultrapilot | ✓ | ✓ | ✓ | ✓ |
| swarm | ✓ | ✓ | ✓ | ✓ |
| pipeline | ✓ | ✓ | ✓ | ✓ |
| team | ✓ | ✓ | ✓ | ✓ |
| ralph | ✓ | ✓ | ✓ | ✓ |
| ultrawork | ✓ | ✓ | ✓ | ✓ |
| ultraqa | ✓ | ✓ | ✓ | ✓ |
| **ralplan** | **✗** | **✗** | **✓** | **✗** |

**结论**：`ralplan` 是唯一只在 `STATE_TOOL_MODES` 中存在的 mode，
其特殊处理逻辑（使用 `resolveStatePath` 而非 `getStateFilePath`）
在 `getStatePath()` 函数中已正确实现（第 50-56 行）。
类型审查需确保这一特殊性在类型层面也有明确表达（注释）。
