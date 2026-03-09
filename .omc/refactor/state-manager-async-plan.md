# State Manager 异步重构方案

## 当前问题

`src/features/state-manager/index.ts` 使用同步 fs 操作：
- `existsSync` (3处)
- `mkdirSync` (1处)
- `statSync` (2处)
- `readFileSync` (2处)
- `atomicWriteJsonSync` / `atomicWriteFileSync` (通过 atomic-write.js)

**影响范围**：35处调用，主要在：
- `src/analytics/session-manager.ts`
- `src/analytics/token-tracker.ts`
- `src/tools/state-tools.ts`（MCP 工具）

## 重构策略

### 方案 A：双 API 模式（推荐）

保留现有同步 API，新增异步 API：

```typescript
// 现有同步 API（保持不变）
export function readState<T>(...): StateReadResult<T>
export function writeState<T>(...): StateWriteResult
export function clearState(...): StateClearResult

// 新增异步 API
export async function readStateAsync<T>(...): Promise<StateReadResult<T>>
export async function writeStateAsync<T>(...): Promise<StateWriteResult>
export async function clearStateAsync(...): Promise<StateClearResult>
```

**优势**：
- 零破坏性变更
- 渐进式迁移
- 新代码使用异步 API

**实施步骤**：
1. 实现异步版本函数
2. 更新 ESLint 配置，允许 state-manager 内部使用同步 fs
3. 新代码优先使用异步 API
4. 逐步迁移现有调用方

### 方案 B：完全异步化（高风险）

将所有 API 改为异步，需要修改 35 处调用方。

**风险**：
- 破坏性变更
- 需要同时修改多个模块
- 可能引入新 bug

**不推荐原因**：影响面太大，测试成本高。

## 推荐实施计划

### 阶段 1：准备工作（本次）

1. 创建异步辅助函数：
```typescript
async function existsAsync(path: string): Promise<boolean>
async function ensureDirAsync(dir: string): Promise<void>
```

2. 实现异步 API：
- `readStateAsync`
- `writeStateAsync`
- `clearStateAsync`

3. 更新 ESLint 配置：
```javascript
{
  files: ['src/features/state-manager/**/*.ts'],
  rules: {
    'no-restricted-syntax': 'off', // 允许内部使用同步 fs
  },
}
```

### 阶段 2：渐进迁移（后续）

1. 新功能使用异步 API
2. 重构高频调用方（如 MCP 工具）
3. 逐步淘汰同步 API

### 阶段 3：清理（长期）

1. 所有调用方迁移完成后
2. 标记同步 API 为 `@deprecated`
3. 最终移除同步 API

## 当前决策

**采用方案 A（双 API 模式）**

**本次实施范围**：
- ✅ 创建异步辅助函数
- ✅ 实现 `readStateAsync`
- ✅ 实现 `writeStateAsync`
- ✅ 更新 ESLint 配置
- ⏸️ 迁移调用方（后续）

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 异步/同步 API 行为不一致 | 中 | 共享核心逻辑，仅 fs 调用不同 |
| 缓存一致性问题 | 低 | 两套 API 共享同一缓存 |
| 测试覆盖不足 | 中 | 为异步 API 添加专门测试 |

## 成功标准

- ✅ 所有测试通过
- ✅ ESLint 错误减少（state-manager 内部豁免）
- ✅ 异步 API 功能完整
- ✅ 零破坏性变更
