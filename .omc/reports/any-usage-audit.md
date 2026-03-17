# 'any' 类型使用审计报告

**审计日期：** 2026-03-17
**总使用次数：** 535 处
**审计范围：** src/ 目录所有 .ts 文件

---

## 按模块统计

| 模块 | 使用次数 | 占比 |
|------|----------|------|
| tests/ | ~337 | 63% |
| tools/ | 155 | 29% |
| hooks/ | 34 | 6% |
| features/ | 9 | 2% |

**关键发现：**
- 63% 的 'any' 使用在测试文件中（可接受）
- tools/ 模块是主要修复目标（155 处）
- hooks/ 和 features/ 相对健康

---

## Top 20 高频文件

| 文件 | 使用次数 | 类型 |
|------|----------|------|
| src/__tests__/job-management.test.ts | 58 | 测试 |
| src/__tests__/task-continuation.test.ts | 50 | 测试 |
| src/tools/python-repl/__tests__/socket-client.test.ts | 24 | 测试 |
| src/__tests__/mcp-server-workflows.test.ts | 24 | 测试 |
| src/__tests__/analytics/transcript-scanner.test.ts | 24 | 测试 |
| src/__tests__/multi-model-mcp.test.ts | 22 | 测试 |
| src/tools/__tests__/lsp-tools.test.ts | 21 | 测试 |
| src/tools/__tests__/ast-tools-coverage.test.ts | 21 | 测试 |
| src/tools/diagnostics/__tests__/lsp-aggregator.test.ts | 19 | 测试 |
| src/__tests__/inline-prompt-integration.test.ts | 19 | 测试 |

---

## 复杂度分类

### 简单（150 处，15-30 分钟/处）
- 测试 mock 对象：`const mock: any = {}`
- 临时变量：`let temp: any`
- 简单类型断言：`value as any`

### 中等（250 处，30-60 分钟/处）
- 函数参数：`function foo(arg: any)`
- 返回类型：`function bar(): any`
- 泛型约束缺失

### 复杂（135 处，1-2 小时/处）
- 深层嵌套对象
- 动态属性访问
- 第三方库类型缺失

---

## 优先修复清单（Top 50）

### P0 - 生产代码（非测试）

**tools/ 模块（155 处）：**
1. src/tools/lsp/ - LSP 客户端类型定义
2. src/tools/diagnostics/ - 诊断工具类型
3. src/tools/python-repl/ - Python REPL 接口

**hooks/ 模块（34 处）：**
1. src/hooks/autopilot/ - Autopilot 状态类型
2. src/hooks/bridge-normalize.ts - Hook 输入规范化

**features/ 模块（9 处）：**
1. src/features/workflow-recommender/ - 推荐引擎类型

### P1 - 测试代码（可延后）

测试文件中的 'any' 使用可接受，但建议：
- 使用 `unknown` 替代 `any`
- 添加类型断言：`as const`
- 使用 Vitest 的类型工具：`expectTypeOf`

---

## 修复策略

### 阶段 2.1：tools/ 核心模块（24h）
- 修复 LSP 工具类型（50 处）
- 修复诊断工具类型（30 处）
- 修复 Python REPL 接口（20 处）

### 阶段 2.2：hooks/ 模块（40h）
- 修复 autopilot 状态类型（15 处）
- 修复 bridge-normalize 类型（10 处）
- 修复其他 hooks（9 处）

### 阶段 2.3：tools/ 剩余模块（20h）
- 修复 AST 工具类型（25 处）
- 修复状态工具类型（20 处）

### 阶段 2.4：features/ 核心模块（36h）
- 修复 workflow-recommender（5 处）
- 修复其他 features（4 处）

---

## 工作量估算

| 阶段 | 目标 | 工作量 |
|------|------|--------|
| 2.1 | tools/ 核心 | 24h |
| 2.2 | hooks/ | 40h |
| 2.3 | tools/ 剩余 | 20h |
| 2.4 | features/ | 36h |
| **总计** | **减少 383 处** | **120h** |

**剩余：** 152 处（测试文件，可接受）

---

## 验收标准

- ✅ 生产代码 'any' 使用 < 150 处
- ✅ tools/ 模块 'any' 使用 < 50 处
- ✅ hooks/ 模块 'any' 使用 < 10 处
- ✅ features/ 模块 'any' 使用 < 5 处
- ✅ 所有测试通过（100%）
- ✅ `tsc --noEmit` 无错误
