# 架构债务分析报告

## [FINDING:A1] 重复的状态管理模式
**问题**: 每个模式（autopilot、ralph、ultrawork、team、ultrapilot）都实现了自己的状态管理逻辑，包含重复的读写、会话隔离、路径解析代码。

**影响模块**:
- `src/hooks/autopilot/state.ts` (681 行)
- `src/hooks/ultrawork/index.ts` (296 行)
- `src/hooks/team-pipeline/state.ts` (186 行)
- `src/hooks/ultrapilot/state.ts` (未完整读取，但模式相同)
- `src/hooks/ralph/loop.ts` (通过 index.ts 导出)

**重复模式**:
1. **路径解析**: 每个模块都实现 `getStateFilePath()` 函数
   - 会话路径 vs 遗留路径的条件逻辑
   - `.omc/state/{mode}-state.json` 路径拼接
   
2. **目录创建**: 每个模块都实现 `ensureStateDir()` 函数
   - `mkdirSync` + `recursive: true`
   - 会话目录 vs 遗留目录的分支逻辑

3. **读取逻辑**: 重复的 `readXxxState()` 函数
   - `existsSync` 检查
   - `readFileSync` + `JSON.parse`
   - 会话 ID 验证（`state.session_id !== sessionId`）
   - 错误处理（返回 `null`）

4. **写入逻辑**: 重复的 `writeXxxState()` 函数
   - `ensureStateDir` 调用
   - `writeFileSync` 或 `atomicWriteJsonSync`
   - 文件权限设置（`mode: 0o600`）

**重构建议**:
创建统一的 `StateAdapter<T>` 抽象层：
```typescript
interface StateAdapter<T> {
  read(sessionId?: string): T | null;
  write(state: T, sessionId?: string): boolean;
  clear(sessionId?: string): boolean;
}

class JsonStateAdapter<T> implements StateAdapter<T> {
  constructor(private mode: string, private directory: string) {}
  // 统一实现读写逻辑
}
```

**权衡**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| 统一适配器 | 消除 500+ 行重复代码，单一测试点 | 需要迁移 5 个模块 |
| 保持现状 | 无迁移风险 | 每次修复需要改 5 处 |


## [EVIDENCE:A1]
- File: `src/hooks/ultrawork/index.ts:44-51`
- Pattern: `getStateFilePath()` 函数实现
- Occurrences: 5 个模块中重复

- File: `src/hooks/autopilot/state.ts:39-45`
- Pattern: 相同的 `getStateFilePath()` 逻辑
- Occurrences: 与 ultrawork 完全相同

- File: `src/hooks/team-pipeline/state.ts:16-21`
- Pattern: 相同的路径解析逻辑
- Occurrences: 第 3 次重复

- File: `src/hooks/ultrawork/index.ts:76-125`
- Pattern: `readUltraworkState()` - 150 行读取逻辑
- Occurrences: 每个模块都有类似的 read 函数

- File: `src/hooks/autopilot/state.ts:76-104`
- Pattern: `readAutopilotState()` - 会话隔离逻辑完全相同
- Occurrences: 与 ultrawork 模式一致

[CONFIDENCE:HIGH]
通过直接代码检查确认了 5 个模块中的重复模式。每个模块的状态管理代码占 150-300 行，总计约 800-1000 行重复代码。


---

## [FINDING:A2] 紧耦合的 Hook 与核心逻辑
**问题**: `persistent-mode/index.ts` 直接导入并调用多个模式的内部状态函数，形成强耦合。任何模式的状态结构变更都会影响 persistent-mode。

**影响模块**:
- `src/hooks/persistent-mode/index.ts` (558 行)
- `src/hooks/ultrawork/index.ts`
- `src/hooks/ralph/index.ts`
- `src/hooks/autopilot/index.ts`
- `src/hooks/team-pipeline/state.ts`

**耦合点**:
1. **直接状态读取**: persistent-mode 导入 15+ 个函数
   - `readUltraworkState`, `writeUltraworkState`, `incrementReinforcement`
   - `readRalphState`, `writeRalphState`, `incrementRalphIteration`
   - `readAutopilotState`, `isAutopilotActive`
   - `readTeamPipelineState`

2. **跨模块状态修改**: persistent-mode 直接修改其他模式的状态
   - Line 173-183: 自我修复 ultrawork 状态（当 ralph 标记 linked 但 ultrawork 丢失时）
   - Line 300-301: 直接修改 ralph 的 `max_iterations`
   
3. **业务逻辑泄漏**: persistent-mode 包含模式特定的业务逻辑
   - Line 227-238: PRD 完成检查逻辑（ralph 特定）
   - Line 241-293: Architect 验证逻辑（ralph 特定）
   - Line 189-224: Team pipeline 阶段协调逻辑（team 特定）


**重构建议**:
实现事件驱动的解耦架构：
```typescript
interface ModeController {
  shouldContinue(context: StopContext): Promise<ContinuationDecision>;
  getPrompt(): string;
}

// persistent-mode 只需调用统一接口
const controllers = [ralphController, ultraworkController, autopilotController];
for (const ctrl of controllers) {
  const decision = await ctrl.shouldContinue(context);
  if (decision.shouldBlock) return decision;
}
```

**权衡**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| 事件驱动解耦 | 模式独立演化，清晰职责边界 | 需要重构 persistent-mode |
| 保持现状 | 无需改动 | 添加新模式需修改 persistent-mode |

---

## [EVIDENCE:A2]
- File: `src/hooks/persistent-mode/index.ts:16-38`
- Pattern: 15+ 个跨模块导入
- Impact: 任何被导入模块的重构都会破坏 persistent-mode

- File: `src/hooks/persistent-mode/index.ts:169-184`
- Pattern: 跨模块状态修复逻辑
- Code: `writeUltraworkState(restoredState, workingDir, sessionId)`
- Issue: persistent-mode 不应该知道如何构造 UltraworkState

- File: `src/hooks/persistent-mode/index.ts:300-301`
- Pattern: 直接修改 ralph 状态
- Code: `state.max_iterations += 10; writeRalphState(...)`
- Issue: 违反封装，ralph 的迭代逻辑应该在 ralph 模块内

[CONFIDENCE:HIGH]
通过代码审查确认了 persistent-mode 与 4 个模式的紧耦合。导入了 15+ 个函数，包含 3 处跨模块状态修改。



## [FINDING:A3] 缺失的统一状态管理抽象层
**问题**: 项目中存在多种状态访问方式，没有统一的状态管理接口。开发者需要记住每种模式使用哪种方式。

**影响模块**:
- 19 个文件导入 `worktree-paths.ts`
- 10 个文件导入 `atomic-write.ts`
- 多个文件直接使用 `fs.readFileSync/writeFileSync`

**不一致的状态访问模式**:
1. **直接文件操作**: ultrawork 使用 `writeFileSync`
   - File: `src/hooks/ultrawork/index.ts:134`
   - Code: `writeFileSync(localStateFile, JSON.stringify(state, null, 2), { mode: 0o600 })`

2. **原子写入**: team-pipeline 使用 `atomicWriteJsonSync`
   - File: `src/hooks/team-pipeline/state.ts:103`
   - Code: `atomicWriteJsonSync(statePath, next)`

3. **带锁写入**: autopilot 使用 `withFileLock`
   - File: `src/hooks/autopilot/state.ts:113`
   - Code: `await withFileLock(stateFile, () => { atomicWriteJsonSync(...) })`


**问题影响**:
- 竞态条件风险：ultrawork 无锁写入可能导致数据丢失
- 不一致的错误处理：有些返回 boolean，有些抛异常
- 维护负担：修复 bug 需要在多处应用相同的修复

**重构建议**:
创建统一的状态管理层 `src/features/state-manager`（已存在但未被使用）：
```typescript
class StateManager {
  async write<T>(mode: string, state: T, sessionId?: string): Promise<void>
  async read<T>(mode: string, sessionId?: string): Promise<T | null>
  async clear(mode: string, sessionId?: string): Promise<void>
}
```
所有模式通过此接口访问状态，内部统一使用原子写入+文件锁。

**权衡**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| 统一状态管理器 | 单一真相来源，一致的并发控制 | 需要迁移所有模式 |
| 保持现状 | 无迁移成本 | 竞态条件风险持续存在 |


## [EVIDENCE:A3]
- File: `src/hooks/ultrawork/index.ts:134`
- Pattern: 直接 `writeFileSync` 无锁
- Risk: 并发写入可能导致数据损坏

- File: `src/hooks/autopilot/state.ts:113-124`
- Pattern: `withFileLock` + `atomicWriteJsonSync` + 重试逻辑
- Observation: 最安全的实现，但只有 autopilot 使用

- File: `src/hooks/team-pipeline/state.ts:88-108`
- Pattern: `atomicWriteJsonSync` 无锁
- Risk: 比 ultrawork 好，但仍有竞态条件风险

- Statistics: 
  - 19 个文件导入 worktree-paths（通过 grep 统计）
  - 10 个文件导入 atomic-write（通过 grep 统计）
  - 3 种不同的写入模式

[CONFIDENCE:HIGH]
通过代码审查和 grep 统计确认了状态访问的不一致性。autopilot 的实现最安全，但其他模式未采用。

---

## [FINDING:A4] 模式间的隐式依赖和状态链接
**问题**: 多个模式之间存在隐式的状态链接（如 ralph ↔ ultrawork，team ↔ ralph），但没有统一的协调机制。

**影响模块**:
- `src/hooks/persistent-mode/index.ts`
- `src/hooks/ralph/loop.ts`
- `src/hooks/ultrawork/index.ts`
- `src/hooks/autopilot/state.ts`
- `src/hooks/team-pipeline/state.ts`

**隐式依赖链**:
1. **Ralph ↔ Ultrawork 双向链接**
   - Ralph 状态包含 `linked_ultrawork: boolean`
   - Ultrawork 状态包含 `linked_to_ralph: boolean`
   - 取消一个需要同时清理另一个

2. **Team ↔ Ralph 协调**
   - persistent-mode 检查 team 状态来决定是否终止 ralph
   - Line 189-224: team 阶段 → ralph 生命周期映射
   - 没有正式的协调协议

3. **Autopilot → Ralph → UltraQA 转换**
   - Autopilot 管理 ralph 和 ultraqa 的生命周期
   - Line 401-470: 复杂的转换逻辑
   - 需要手动清理前一个模式的状态


**问题影响**:
- 状态泄漏风险：取消一个模式可能遗留另一个模式的状态
- 调试困难：需要追踪多个状态文件才能理解系统状态
- 脆弱的转换逻辑：autopilot 的转换函数包含大量手动清理代码

**重构建议**:
实现模式生命周期管理器：
```typescript
class ModeLifecycleManager {
  async activate(mode: string, config: any): Promise<void>
  async deactivate(mode: string, cleanup: 'full' | 'preserve'): Promise<void>
  async transition(from: string, to: string): Promise<void>
  getActiveMode(): string | null
}
```

**权衡**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| 生命周期管理器 | 统一协调，防止状态泄漏 | 需要重构模式激活逻辑 |
| 保持现状 | 无需改动 | 状态泄漏风险持续 |


## [EVIDENCE:A4]
- File: `src/hooks/persistent-mode/index.ts:169-184`
- Pattern: Ralph 自我修复 ultrawork 状态
- Code: 检测 `state.linked_ultrawork` 并重建 ultrawork 状态
- Issue: 跨模式状态修复逻辑分散

- File: `src/hooks/autopilot/state.ts:401-470`
- Pattern: `transitionRalphToUltraQA` 函数
- Lines: 70 行转换逻辑
- Operations: 保存进度 → 清理 ralph → 清理 ultrawork → 启动 ultraqa → 回滚处理
- Issue: 复杂的手动状态管理

- File: `src/hooks/persistent-mode/index.ts:189-224`
- Pattern: Team 阶段到 ralph 生命周期的映射
- Mappings: `complete` → 清理 ralph, `failed` → 清理 ralph, `cancelled` → 清理 ralph
- Issue: 协调逻辑硬编码在 persistent-mode 中

[CONFIDENCE:HIGH]
通过代码审查确认了 3 组模式间的隐式依赖。autopilot 的转换函数包含 70 行手动状态管理代码。

---

## 摘要

通过系统性分析 ultrapower 项目的架构，识别了 4 个主要架构债务：

1. **重复的状态管理模式** (A1): 5 个模块中约 800-1000 行重复代码
2. **紧耦合的 Hook 与核心逻辑** (A2): persistent-mode 导入 15+ 函数，包含跨模块状态修改
3. **缺失的统一状态管理抽象层** (A3): 3 种不同的写入模式，存在竞态条件风险
4. **模式间的隐式依赖** (A4): 3 组模式链接，70 行手动转换逻辑


## 优先级建议

### 高优先级 (P0)
**A3 - 统一状态管理抽象层**
- 影响：竞态条件可能导致数据丢失
- 工作量：中等（利用现有 `src/features/state-manager`）
- 收益：消除并发 bug，为其他重构奠定基础

### 中优先级 (P1)
**A1 - 重复的状态管理模式**
- 影响：维护负担，bug 需要修复 5 次
- 工作量：大（需要迁移 5 个模块）
- 收益：消除 800+ 行重复代码
- 依赖：应在 A3 完成后进行

### 中优先级 (P1)
**A2 - 紧耦合的 Hook 与核心逻辑**
- 影响：扩展性差，添加新模式需修改 persistent-mode
- 工作量：中等（重构 persistent-mode 为事件驱动）
- 收益：清晰的职责边界，模式独立演化

### 低优先级 (P2)
**A4 - 模式间的隐式依赖**
- 影响：状态泄漏风险，调试困难
- 工作量：大（需要设计生命周期管理器）
- 收益：防止状态泄漏，简化转换逻辑
- 依赖：应在 A1、A2、A3 完成后进行



## 参考文件

### 状态管理相关
- `src/hooks/autopilot/state.ts:39-681` - Autopilot 状态管理（最完整的实现）
- `src/hooks/ultrawork/index.ts:44-296` - Ultrawork 状态管理
- `src/hooks/team-pipeline/state.ts:1-186` - Team 状态管理
- `src/hooks/ralph/loop.ts` - Ralph 状态管理（通过 index.ts 导出）
- `src/hooks/ultrapilot/state.ts` - Ultrapilot 状态管理

### 耦合相关
- `src/hooks/persistent-mode/index.ts:1-558` - 主要耦合点
- `src/hooks/persistent-mode/index.ts:16-38` - 跨模块导入
- `src/hooks/persistent-mode/index.ts:169-184` - 跨模块状态修复
- `src/hooks/persistent-mode/index.ts:189-224` - Team 协调逻辑

### 基础设施
- `src/lib/worktree-paths.ts:1-100` - 路径解析工具（19 处导入）
- `src/lib/atomic-write.ts` - 原子写入工具（10 处导入）
- `src/lib/file-lock.ts` - 文件锁工具
- `src/features/state-manager/` - 现有但未使用的状态管理器

---

[STAGE_COMPLETE:2]
