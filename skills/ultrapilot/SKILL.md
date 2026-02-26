---
name: ultrapilot
description: 带文件所有权分区的并行 autopilot
---

# Ultrapilot Skill

并行 autopilot，通过文件所有权分区生成多个 worker 以实现最大速度。

## 概述

Ultrapilot 是 autopilot 的并行演进版本。它将任务分解为独立的可并行子任务，为每个 worker 分配不重叠的文件集，并同时运行它们。

**核心能力：**
1. **分解**任务为并行安全的组件
2. **分区**文件，独占所有权（无冲突）
3. **生成**最多 20 个并行 worker
4. **协调**通过 TaskOutput 跟踪进度
5. **集成**变更，顺序处理共享文件
6. **验证**完整系统完整性

**速度倍增：** 适合的任务比顺序 autopilot 快最多 5 倍。

## 用法

```
/ultrapower:ultrapilot <your task>
/ultrapower:up "Build a full-stack todo app"
/ultrapower:ultrapilot Refactor the entire backend
```

## 魔法关键词

这些短语自动激活 ultrapilot：
- "ultrapilot"、"ultra pilot"
- "parallel build"、"parallel autopilot"
- "swarm build"、"swarm mode"
- "fast parallel"、"ultra fast"

## 使用时机

**Ultrapilot 擅长：**
- 多组件系统（前端 + 后端 + 数据库）
- 跨不同模块的独立功能添加
- 有清晰模块边界的大型重构
- 并行测试文件生成
- 多服务架构

**Autopilot 更适合：**
- 单线程顺序任务
- 组件间高度相互依赖
- 需要持续集成检查的任务
- 单模块中的小型聚焦功能

## 架构

```
User Input: "Build a full-stack todo app"
           |
           v
  [ULTRAPILOT COORDINATOR]
           |
   Decomposition + File Partitioning
           |
   +-------+-------+-------+-------+
   |       |       |       |       |
   v       v       v       v       v
[W-1]   [W-2]   [W-3]   [W-4]   [W-5]
backend frontend database api-docs tests
(src/  (src/   (src/    (docs/)  (tests/)
 api/)  ui/)    db/)
   |       |       |       |       |
   +---+---+---+---+---+---+---+---+
       |
       v
  [INTEGRATION PHASE]
  (shared files: package.json, tsconfig.json, etc.)
       |
       v
  [VALIDATION PHASE]
  (full system test)
```

## 阶段

### 阶段 0：任务分析

**目标：** 确定任务是否可并行化

**检查：**
- 任务能否拆分为 2 个以上独立子任务？
- 文件边界是否清晰？
- 依赖关系是否最小？

**输出：** 通过/不通过决定（不适合时回退到 autopilot）

### 阶段 1：分解

**目标：** 将任务分解为并行安全的子任务

**Agent：** Architect (Opus)

**方法：** AI 驱动的任务分解

Ultrapilot 使用 `decomposer` 模块生成智能任务分解：

```typescript
import {
  generateDecompositionPrompt,
  parseDecompositionResult,
  validateFileOwnership,
  extractSharedFiles
} from 'src/hooks/ultrapilot/decomposer';

// 1. Generate prompt for Architect
const prompt = generateDecompositionPrompt(task, codebaseContext, {
  maxSubtasks: 5,
  preferredModel: 'sonnet'
});

// 2. Call Architect agent
const response = await Task({
  subagent_type: 'ultrapower:architect',
  model: 'opus',
  prompt
});

// 3. Parse structured result
const result = parseDecompositionResult(response);

// 4. Validate no file conflicts
const { isValid, conflicts } = validateFileOwnership(result.subtasks);

// 5. Extract shared files from subtasks
const finalResult = extractSharedFiles(result);
```

**流程：**
1. 通过 Architect agent 分析任务需求
2. 识别有文件边界的独立组件
3. 按复杂度分配 agent 类型（executor-low/executor/executor-high）
4. 映射子任务间的依赖关系（blockedBy）
5. 生成并行执行组
6. 识别共享文件（由协调者处理）

**输出：** 结构化 `DecompositionResult`：

```json
{
  "subtasks": [
    {
      "id": "1",
      "description": "Backend API routes",
      "files": ["src/api/routes.ts", "src/api/handlers.ts"],
      "blockedBy": [],
      "agentType": "executor",
      "model": "sonnet"
    },
    {
      "id": "2",
      "description": "Frontend components",
      "files": ["src/ui/App.tsx", "src/ui/TodoList.tsx"],
      "blockedBy": [],
      "agentType": "executor",
      "model": "sonnet"
    },
    {
      "id": "3",
      "description": "Wire frontend to backend",
      "files": ["src/client/api.ts"],
      "blockedBy": ["1", "2"],
      "agentType": "executor-low",
      "model": "haiku"
    }
  ],
  "sharedFiles": [
    "package.json",
    "tsconfig.json",
    "README.md"
  ],
  "parallelGroups": [["1", "2"], ["3"]]
}
```

**分解类型：**

| 类型 | 描述 | 用途 |
|------|-------------|----------|
| `DecomposedTask` | 带 id、files、blockedBy、agentType、model 的完整任务 | 智能 worker 生成 |
| `DecompositionResult` | 带 subtasks、sharedFiles、parallelGroups 的完整结果 | 完整分解输出 |
| `toSimpleSubtasks()` | 转换为 string[] 以兼容旧版 | 简单任务列表 |

### 阶段 2：文件所有权分区

**目标：** 为 worker 分配独占文件集

**规则：**
1. **独占所有权** - 没有文件在多个 worker 集中
2. **共享文件延迟处理** - 在集成阶段顺序处理
3. **边界文件跟踪** - 跨边界导入的文件

**数据结构：** `.omc/state/ultrapilot-ownership.json`

```json
{
  "sessionId": "ultrapilot-20260123-1234",
  "workers": {
    "worker-1": {
      "ownedFiles": ["src/api/routes.ts", "src/api/handlers.ts"],
      "ownedGlobs": ["src/api/**"],
      "boundaryImports": ["src/types.ts"]
    },
    "worker-2": {
      "ownedFiles": ["src/ui/App.tsx", "src/ui/TodoList.tsx"],
      "ownedGlobs": ["src/ui/**"],
      "boundaryImports": ["src/types.ts"]
    }
  },
  "sharedFiles": ["package.json", "tsconfig.json", "src/types.ts"],
  "conflictPolicy": "coordinator-handles"
}
```

### 阶段 3：并行执行

**目标：** 同时运行所有 worker

**生成 Worker：**
```javascript
// Pseudocode
workers = [];
for (subtask in decomposition.subtasks) {
  workers.push(
    Task(
      subagent_type: "ultrapower:executor",
      model: "sonnet",
      prompt: `ULTRAPILOT WORKER ${subtask.id}

Your exclusive file ownership: ${subtask.files}

Task: ${subtask.description}

CRITICAL RULES:
1. ONLY modify files in your ownership set
2. If you need to modify a shared file, document the change in your output
3. Do NOT create new files outside your ownership
4. Track all imports from boundary files

Deliver: Code changes + list of boundary dependencies`,
      run_in_background: true
    )
  );
}
```

**监控：**
- 轮询每个 worker 的 TaskOutput
- 跟踪完成状态
- 尽早检测冲突
- 累积边界依赖

**最大 Worker 数：** 5（Claude Code 限制）

### 阶段 4：集成

**目标：** 合并所有 worker 变更并处理共享文件

**流程：**
1. **收集输出** - 汇总所有 worker 交付物
2. **检测冲突** - 检查意外重叠
3. **处理共享文件** - 顺序更新 package.json 等
4. **集成边界文件** - 合并类型定义、共享工具
5. **解析导入** - 确保跨边界导入有效

**Agent：** Executor (Sonnet) - 顺序处理

**冲突解决：**
- 如果 worker 意外触碰同一文件 → 手动合并
- 如果共享文件需要多处变更 → 顺序应用
- 如果边界文件变更 → 验证所有依赖 worker

### 阶段 5：验证

**目标：** 验证集成系统正常工作

**检查（并行）：**
1. **构建** - 运行项目构建命令
2. **Lint** - 运行项目 lint 命令
3. **类型检查** - 运行项目类型检查命令
4. **单元测试** - 所有测试通过
5. **集成测试** - 跨组件测试

**Agent（并行）：**
- Build-fixer (Sonnet) - 修复构建错误
- Architect (Opus) - 功能完整性
- Security-reviewer (Opus) - 跨组件漏洞

**重试策略：** 最多 3 轮验证。如果失败持续，向用户提供详细错误报告。

## 状态管理

### Session 状态

```json
{
  "sessionId": "ultrapilot-20260123-1234",
  "status": "running",
  "phase": "parallel-execution",
  "startedAt": "2026-01-23T12:00:00Z",
  "task": "Build a full-stack todo app",
  "workers": {
    "worker-1": { "status": "completed", "subtask": "Backend API" },
    "worker-2": { "status": "running", "subtask": "Frontend components" },
    "worker-3": { "status": "pending", "subtask": "Database schema" }
  }
}
```

### 文件所有权映射

存储在 `.omc/state/ultrapilot-ownership.json`（见阶段 2）

### 进度跟踪

- 每个 worker 完成时更新状态
- 集成阶段跟踪共享文件变更
- 验证阶段记录测试结果

## 配置

通过 `.omc-config.json` 的可选设置：

```json
{
  "ultrapilot": {
    "maxWorkers": 5,
    "preferredModel": "sonnet",
    "validationRounds": 3,
    "fileOwnershipStrategy": "strict"
  }
}
```

## 取消

`/ultrapower:cancel` 处理 ultrapilot 清理：

1. 读取 `.omc/state/ultrapilot-state.json` 获取活跃 worker
2. 向所有运行中的 worker 发送停止信号
3. 等待 worker 完成当前操作
4. 清理所有权文件
5. 报告部分完成状态

## 恢复

如果 ultrapilot 在运行中途中断：

1. 检查 `.omc/state/ultrapilot-state.json` 中的现有状态
2. 识别已完成的 worker 和待处理的 worker
3. 从最后一个已知良好状态恢复
4. 重新运行失败的 worker（如需要）

## 示例

### 示例 1：全栈应用

```
/ultrapower:ultrapilot Build a full-stack todo app with React frontend, Node.js backend, and PostgreSQL database
```

**分解：**
- Worker 1：后端 API（src/api/）
- Worker 2：前端组件（src/ui/）
- Worker 3：数据库 schema（src/db/）
- Worker 4：API 文档（docs/）
- Worker 5：测试套件（tests/）

**并行组：** [1, 2, 3, 4] 然后 [5]

### 示例 2：大型重构

```
/ultrapower:ultrapilot Refactor the entire backend to use async/await instead of callbacks
```

**分解：**
- Worker 1：auth 模块（src/auth/）
- Worker 2：API 路由（src/routes/）
- Worker 3：数据库层（src/db/）
- Worker 4：工具函数（src/utils/）

### 示例 3：多服务架构

```
/ultrapower:up Add rate limiting to all microservices
```

**分解：**
- Worker 1：用户服务（services/user/）
- Worker 2：订单服务（services/order/）
- Worker 3：通知服务（services/notification/）

## 最佳实践

1. **清晰的模块边界** - 任务在文件边界清晰时效果最佳
2. **最小化共享文件** - 减少集成阶段的工作量
3. **独立子任务** - 避免 worker 间的循环依赖
4. **适当的 worker 数量** - 3-5 个 worker 通常最优
5. **验证优先** - 始终运行完整验证套件

## 文件所有权策略

### 所有权类型

| 类型 | 描述 | 处理方式 |
|------|------|----------|
| **独占** | 仅一个 worker 拥有 | Worker 可自由修改 |
| **共享** | 多个 worker 需要 | 集成阶段顺序处理 |
| **边界** | 跨边界导入 | 只读，变更需协调 |

### 检测算法

1. 分析每个子任务的文件列表
2. 识别重叠（共享文件）
3. 将重叠文件移至 `sharedFiles` 列表
4. 为每个 worker 分配独占文件集

### 共享文件模式

常见共享文件（始终在集成阶段处理）：
- `package.json`, `package-lock.json`
- `tsconfig.json`, `.eslintrc`
- `README.md`, `CHANGELOG.md`
- 共享类型定义（`src/types/index.ts`）
- 配置文件（`src/config/`）

## 冲突处理

### 冲突类型

| 类型 | 原因 | 解决方案 |
|------|------|----------|
| **文件冲突** | Worker 修改了同一文件 | 手动合并，协调者处理 |
| **导入冲突** | 边界文件被修改 | 验证所有依赖 worker |
| **类型冲突** | 共享类型定义变更 | 集成阶段顺序应用 |

### 冲突策略

```json
{
  "conflictPolicy": "coordinator-handles",
  "onConflict": "pause-and-report",
  "maxConflicts": 3
}
```

## 故障排除

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Worker 超时 | 子任务太大 | 进一步分解任务 |
| 文件冲突 | 边界不清晰 | 重新分区，增加共享文件 |
| 集成失败 | 导入路径错误 | 检查边界文件依赖 |
| 验证失败 | Worker 引入 bug | 运行 build-fixer agent |
| 状态损坏 | 意外中断 | 使用 `/ultrapower:cancel --force` |

## 与 Autopilot 的区别

| 方面 | Autopilot | Ultrapilot |
|------|-----------|------------|
| **执行** | 顺序 | 并行（最多 5 个 worker） |
| **速度** | 基准 | 最多 5 倍更快 |
| **文件冲突** | 无风险 | 需要所有权分区 |
| **适用场景** | 单线程任务 | 多组件系统 |
| **复杂度** | 低 | 高（需要分解） |
| **依赖处理** | 自然顺序 | 显式 blockedBy 图 |

## 高级：自定义分解

对于需要精确控制的高级用户：

```
/ultrapower:ultrapilot --decompose-only "Build a REST API"
```

这会输出分解计划供审查，然后再执行。

```
/ultrapower:ultrapilot --workers=3 "Build a REST API"
```

限制最大 worker 数量。

## 完成时的状态清理

**重要：完成时删除状态文件——不要只是设置 `active: false`**

当 ultrapilot 完成（成功或失败）时：

```bash
# 删除 ultrapilot 状态文件
rm -f .omc/state/ultrapilot-state.json
rm -f .omc/state/ultrapilot-ownership.json
```

这确保未来 session 的干净状态。
