# ultrapower 优化实施计划 v2（修订版）

**生成时间**: 2026-03-12
**修订原因**: 基于 Critic 反馈调整工作量、优先级和技术方案
**总预估工作量**: 20-25 天（从 8-13 天修正）
**目标**: 构建优化 > 测试覆盖率 > Agent 路由基础版

---

## 变更摘要

### 关键调整

1. **工作量修正**: 8-13 天 → 22 天（含 2 天缓冲）
   - Hook-bridge 测试: 10h → 25h
   - 集成测试: 12h → 40h（拆分为 5 个独立任务）

2. **优先级重排**: 构建优化 (P0) > 测试覆盖率 (P1) > Agent 路由 (P2)

3. **技术方案简化**:
   - ❌ 删除任务 2.4（自定义缓存）→ 使用 esbuild incremental + tsc --incremental
   - ✂️ 简化任务 3.3（推荐引擎）→ 决策树替代余弦相似度
   - ❌ 删除任务 3.6（A/B 测试框架）→ 简单 feature flag

4. **验收标准具体化**:
   - "整体覆盖率 70%" → "20 个关键函数 100% 覆盖"
   - "用户满意度提升" → "推荐接受率 ≥ 50%"
   - "缓存命中率 80%" → "增量构建 < 30s（修改 3 文件）"

---

## 1. 构建流程优化（P0，第 1 周）

### 需求摘要

**当前痛点**:
- 全量构建 ~240 秒，开发循环慢
- 8+ 个独立构建脚本，维护成本高
- 无增量构建，每次全量编译

**目标**:
- 全量构建 ≤ 180 秒
- 增量构建 ≤ 30 秒（修改 3 个文件）
- 构建脚本 ≤ 3 个

**价值**: 开发循环时间减少 30-40%，CI 成本降低 25%

### 验收标准（可测量）

✅ **必须达成**:
1. 全量构建时间 ≤ 180 秒（`time npm run build`）
2. 增量构建时间 ≤ 30 秒（修改 3 个文件后重新构建）
3. MCP 服务器并行构建 ≤ 60 秒
4. 构建脚本数量 ≤ 3 个
5. TypeScript 编译错误 0 个
6. 构建产物大小增加 < 5%

### 实施步骤

**任务 1.1: 构建性能基线测量** (3 小时)
- 文件: 新建 `.omc/research/build-baseline-20260312.md`
- 操作:
  - 测量每个脚本执行时间（`time` 命令）
  - 分析 TypeScript 编译瓶颈（`tsc --extendedDiagnostics`）
  - 识别可并行构建的模块
- 验证: 生成基线报告，包含每个脚本耗时

**任务 1.2: 统一 esbuild 配置** (6 小时)
- 文件: 新建 `esbuild.config.mjs`，修改 `package.json`
- 操作:
  - 合并 `parallel-build.mjs` 和 `compose-docs.mjs`
  - 启用 `incremental: true`（原生增量构建）
  - 配置 external 依赖（避免打包 node_modules）
- 验证: `npm run build` 成功，产物在 `dist/`

**任务 1.3: MCP 服务器并行构建** (4 小时)
- 文件: 新建 `scripts/build-mcp.mjs`
- 操作:
  - 使用 `Promise.all()` 并行构建 bridge/codex/gemini
  - 共享 esbuild 上下文（减少启动开销）
- 验证: 3 个 MCP 服务器构建 ≤ 60 秒

**任务 1.4: 优化 TypeScript 配置** (2 小时)
- 文件: `tsconfig.json`
- 操作:
  - 启用 `incremental: true` 和 `tsBuildInfoFile: ".tsbuildinfo"`
  - 设置 `skipLibCheck: true`
  - 调整 `target: "ES2022"`
- 验证: `tsc --noEmit` 时间减少 20%+

**任务 1.5: 更新 package.json 脚本** (1 小时)
- 文件: `package.json`
- 操作:
  - 简化命令: `build`, `build:mcp`, `build:docs`, `build:watch`, `build:clean`
- 验证: 所有脚本执行成功

### 风险和缓解

| 风险 | 缓解措施 |
|------|----------|
| esbuild 配置不兼容现有代码 | 逐步迁移，保留旧脚本作为回退 |
| 并行构建资源竞争 | 限制并发数（`os.cpus().length - 1`） |
| TypeScript 增量构建不稳定 | CI 使用全量构建，本地使用增量 |

---

## 2. 测试覆盖率提升（P1，第 2-3 周）

### 需求摘要

**当前痛点**:
- 关键模块测试不充分（state-adapter ~400 行、file-lock ~200 行、bridge ~500 行）
- 无覆盖率基线和 CI 门禁

**目标**:
- 20 个关键函数达到 100% 覆盖率
- 关键模块达到 85%+ 覆盖率
- 5 个端到端集成测试场景通过

**价值**: 减少生产环境 bug 30-40%，为重构提供安全网

### 验收标准（可测量）

✅ **必须达成**:
1. 20 个关键函数 100% 覆盖（列表见下方）
2. `src/lib/state-adapter.ts` 覆盖率 ≥ 85%
3. `src/lib/file-lock.ts` 覆盖率 ≥ 85%
4. `src/hooks/bridge.ts` 覆盖率 ≥ 80%
5. 5 个端到端集成测试场景通过
6. CI 流水线在关键函数覆盖率 < 100% 时失败
7. 测试执行时间 < 60 秒

**20 个关键函数清单**:
- `state-adapter.ts`: `readState`, `writeState`, `updateState`, `deleteState`, `assertValidMode`
- `file-lock.ts`: `acquireLock`, `releaseLock`, `cleanupOrphanLocks`, `isLockExpired`
- `bridge.ts`: `routeHook`, `normalizeInput`, `filterSensitiveFields`, `executeHookChain`
- `validateMode.ts`: `assertValidMode`, `isValidMode`
- `state-machine.ts`: `transitionState`, `validateTransition`, `getNextPhase`

### 实施步骤

**任务 2.1: 配置覆盖率工具** (2 小时)
- 文件: `vitest.config.ts`, `package.json`
- 操作:
  - 启用 `@vitest/coverage-v8`
  - 配置关键函数覆盖率阈值（100%）
  - 排除 `dist/`, `node_modules/`, `*.test.ts`
- 验证: `npm run test:coverage` 生成报告

**任务 2.2: state-adapter 单元测试** (8 小时)
- 文件: 新建 `src/lib/__tests__/state-adapter.test.ts`
- 操作:
  - 测试 JSON 存储后端（读/写/更新/删除）
  - 测试 SQLite 存储后端（事务/并发）
  - 测试错误处理（文件不存在/权限错误/格式错误）
  - 测试 `assertValidMode()` 路径遍历防护
- 验证: 覆盖率 ≥ 85%，5 个关键函数 100%

**任务 2.3: file-lock 单元测试** (6 小时)
- 文件: 新建 `src/lib/__tests__/file-lock.test.ts`
- 操作:
  - 测试锁获取/释放机制
  - 测试超时场景（默认 5 秒）
  - 测试并发竞争（10 个并发请求）
  - 测试孤儿锁清理
- 验证: 覆盖率 ≥ 85%，4 个关键函数 100%

**任务 2.4: hook-bridge 单元测试** (25 小时，从 10h 修正)
- 文件: 新建 `src/hooks/__tests__/bridge.test.ts`
- 操作:
  - 测试 43 种 HookType 路由（参考 `docs/standards/hook-execution-order.md`）
  - 测试输入消毒（`bridge-normalize.ts` 白名单）
  - 测试敏感 hook 字段过滤（permission-request/setup/session-end）
  - 测试 hook 链式执行顺序
  - 测试错误传播和恢复
- 验证: 覆盖率 ≥ 80%，4 个关键函数 100%

**任务 2.5: 集成测试 - autopilot 流程** (8 小时)
- 文件: 新建 `tests/integration/autopilot.test.ts`
- 操作:
  - 场景: explore → plan → execute → verify
  - 使用 mock 隔离外部依赖
- 验证: 场景通过，执行时间 < 15 秒

**任务 2.6: 集成测试 - team 流水线** (8 小时)
- 文件: 新建 `tests/integration/team-pipeline.test.ts`
- 操作:
  - 场景: team-plan → team-prd → team-exec → team-verify
  - 测试阶段转换逻辑
- 验证: 场景通过，执行时间 < 15 秒

**任务 2.7: 集成测试 - ralph 循环** (8 小时)
- 文件: 新建 `tests/integration/ralph-loop.test.ts`
- 操作:
  - 场景: 执行 → 验证 → 修复 → 重复
  - 测试循环终止条件
- 验证: 场景通过，执行时间 < 15 秒

**任务 2.8: 集成测试 - 状态持久化** (8 小时)
- 文件: 新建 `tests/integration/state-persistence.test.ts`
- 操作:
  - 场景: 中断后恢复
  - 测试状态一致性
- 验证: 场景通过，执行时间 < 10 秒

**任务 2.9: 集成测试 - MCP 工具调用** (8 小时)
- 文件: 新建 `tests/integration/mcp-tools.test.ts`
- 操作:
  - 场景: ask_codex/ask_gemini 调用
  - 使用 mock MCP 服务器
- 验证: 场景通过，执行时间 < 10 秒

**任务 2.10: CI 集成** (2 小时)
- 文件: `.github/workflows/test.yml`
- 操作:
  - 添加 `npm run test:coverage` 步骤
  - 配置关键函数覆盖率门禁（< 100% 失败）
  - 上传覆盖率报告
- 验证: PR 触发 CI，覆盖率显示在 PR 评论

### 补充风险缓解（基于 Critic 反馈）

| 风险 | 缓解措施 |
|------|----------|
| CI 并发限制导致测试失败 | 检测 CI 环境变量，超限时串行执行 |
| 依赖版本变更导致测试失败 | 记录 package-lock.json hash，变更时重新生成测试数据 |
| 测试数据不足 | 准备 50 个专家标注种子数据 |

---

## 3. Agent 路由智能化基础版（P2，第 4 周）

### 需求摘要

**当前痛点**:
- 49 个 agents，用户需要记忆能力和适用场景
- 无法根据任务复杂度自动选择模型

**目标**:
- 实现基于决策树的 Agent 推荐（100 行 if-else）
- 推荐接受率 ≥ 50%
- 响应时间 ≤ 100ms

**价值**: 降低用户学习成本 50%+，优化成本 10-15%

### 验收标准（可测量）

✅ **必须达成**:
1. 推荐接受率 ≥ 50%（用户点击推荐的比例）
2. 推荐引擎响应时间 ≤ 100ms
3. 路由决策记录完整性 100%
4. 成本优化效果 ≥ 10%（对比 2 周前后）
5. 支持 feature flag 开关（可随时禁用）

### 实施步骤

**任务 3.1: 任务特征提取器** (6 小时，从 8h 简化)
- 文件: 新建 `src/features/routing/task-analyzer.ts`
- 操作:
  - 提取关键词（debugging/refactor/implement/review）
  - 计算复杂度评分（文件数 × 权重 + 行数 × 权重）
  - 识别领域（auth/ui/api/database）
- 验证: 50 个样本准确率 ≥ 80%

**任务 3.2: Agent 能力矩阵** (3 小时，从 4h 简化)
- 文件: 新建 `src/features/routing/agent-capabilities.json`
- 操作:
  - 定义 49 个 agents 的能力向量
  - 标注推荐场景（5-10 个关键词）
- 验证: 覆盖所有 agents

**任务 3.3: 决策树推荐引擎** (6 小时，从 10h 简化)
- 文件: 新建 `src/features/routing/recommendation-engine.ts`
- 操作:
  - 实现 100 行 if-else 决策树
  - 规则示例: `if (task.includes("debug")) return "debugger"`
  - 模型选择: 复杂度 < 3 → haiku, 3-7 → sonnet, >7 → opus
- 验证: 50 个样本推荐准确率 ≥ 70%

**任务 3.4: 路由决策记录** (4 小时，从 6h 简化)
- 文件: 新建 `src/features/routing/decision-logger.ts`
- 操作:
  - 记录每次推荐（任务/推荐/用户选择/结果）
  - 使用 JSONL 格式（`.omc/routing/decisions.jsonl`）
- 验证: 100% 调用都有记录

**任务 3.5: 集成到现有流程** (6 小时，从 8h 简化)
- 文件: `src/agents/agent-wrapper.ts`
- 操作:
  - 在 agent 调用前显示推荐
  - 添加 feature flag（`ENABLE_AGENT_RECOMMENDATION`）
  - 记录用户选择
- 验证: 推荐显示正常，可手动覆盖

### 风险和缓解

| 风险 | 缓解措施 |
|------|----------|
| 决策树规则不准确 | 收集 50 个专家标注样本，迭代优化规则 |
| 用户不信任推荐 | 显示推荐理由（"基于任务类型：调试"） |
| 性能开销 | 使用简单字符串匹配，避免复杂计算 |

---

## 总体时间线（22 天）

### 第 1 周（3月12日-3月18日）- 构建优化 (P0)
**目标**: 构建时间减少 30%+

- Day 1: 任务 1.1-1.2（基线测量 + esbuild 配置）
- Day 2: 任务 1.3-1.4（MCP 并行构建 + TypeScript 优化）
- Day 3: 任务 1.5 + 验证（脚本更新 + 全面测试）
- Day 4-5: 调优和文档

**里程碑**: 全量构建 ≤ 180s，增量构建 ≤ 30s

### 第 2 周（3月19日-3月25日）- 测试覆盖率（上）
**目标**: 关键模块测试覆盖率 85%+

- Day 1: 任务 2.1-2.2（配置工具 + state-adapter 测试）
- Day 2: 任务 2.3（file-lock 测试）
- Day 3-4: 任务 2.4（hook-bridge 测试，25 小时）
- Day 5: 任务 2.5（autopilot 集成测试）

**里程碑**: 20 个关键函数中 15 个达到 100% 覆盖

### 第 3 周（3月26日-4月1日）- 测试覆盖率（下）
**目标**: 集成测试完成 + CI 集成

- Day 1: 任务 2.6（team 流水线测试）
- Day 2: 任务 2.7（ralph 循环测试）
- Day 3: 任务 2.8（状态持久化测试）
- Day 4: 任务 2.9（MCP 工具测试）
- Day 5: 任务 2.10 + 验证（CI 集成 + 全面测试）

**里程碑**: 5 个集成测试场景通过，CI 门禁生效

### 第 4 周（4月2日-4月8日）- Agent 路由基础版
**目标**: 推荐接受率 ≥ 50%

- Day 1: 任务 3.1-3.2（特征提取 + 能力矩阵）
- Day 2: 任务 3.3（决策树推荐引擎）
- Day 3: 任务 3.4-3.5（决策记录 + 集成）
- Day 4-5: 验证和调优

**里程碑**: 推荐功能上线，开始收集数据

### 缓冲时间（2 天）
- 处理意外问题
- 文档更新
- 知识转移

---

## 成功指标

### 量化指标

| 指标 | 基线 | 目标 | 测量方法 |
|------|------|------|----------|
| 全量构建时间 | ~240s | ≤180s | `time npm run build` |
| 增量构建时间 | ~120s | ≤30s | 修改 3 文件后构建 |
| 关键函数覆盖率 | ~40% | 100% | 20 个函数覆盖率报告 |
| 关键模块覆盖率 | ~50% | ≥85% | state-adapter/file-lock/bridge |
| 集成测试场景 | 0 | 5 | 测试通过数量 |
| 推荐接受率 | N/A | ≥50% | 用户点击推荐的比例 |
| 成本优化 | 基线 | -10% | 对比 2 周前后平均成本 |
| 测试执行时间 | ~90s | ≤60s | 并行执行所有测试 |

### 质量门禁

✅ **必须达成**:
1. 零 P0 级别的测试失败
2. 零构建错误
3. 所有 CI 检查通过
4. 20 个关键函数 100% 覆盖

✅ **期望达成**:
1. 开发体验改善（构建更快）
2. 推荐功能用户反馈积极
3. 文档完整

---

## 关键风险和缓解（基于 Critic 反馈）

### 新增风险缓解

1. **CI 并发限制检测**
   - 风险: CI 环境并发限制导致测试失败
   - 缓解: 检测 `CI=true` 环境变量，超限时自动串行执行
   - 实施: 任务 2.10

2. **依赖指纹检测**
   - 风险: 依赖版本变更导致构建缓存失效
   - 缓解: 记录 `package-lock.json` hash，变更时清理缓存
   - 实施: 任务 1.2

3. **专家标注种子数据**
   - 风险: Agent 推荐训练数据不足
   - 缓解: 准备 50 个专家标注样本（任务类型 → 推荐 agent）
   - 实施: 任务 3.1

### 原有风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 现有代码难以测试 | 高 | 中 | 先重构为可测试结构 |
| 集成测试不稳定 | 中 | 高 | 使用 mock 隔离外部依赖 |
| esbuild 配置不兼容 | 中 | 低 | 逐步迁移，保留旧脚本回退 |
| 决策树规则不准确 | 中 | 中 | 收集专家标注样本迭代优化 |

---

## 资源需求

### 人力资源
- **主开发**: 1 人全职（22 天）
- **代码审查**: 1 人兼职（每周 4 小时）

### 技术资源
- Node.js 18+, TypeScript 5+, vitest
- GitHub Actions（CI/CD）
- 存储: ~500MB（测试数据 + 构建缓存）

### 外部依赖
- `@vitest/coverage-v8`: 测试覆盖率
- `esbuild`: 构建工具
- 无需新增付费服务

---

## 与原计划的主要差异

### 删除的任务
1. ❌ **任务 2.4（自定义缓存）**: 使用 esbuild/tsc 原生增量构建替代
2. ❌ **任务 3.6（A/B 测试框架）**: 使用简单 feature flag 替代

### 拆分的任务
- **任务 1.5（集成测试）**: 拆分为 5 个独立任务（2.5-2.9）
  - autopilot 流程
  - team 流水线
  - ralph 循环
  - 状态持久化
  - MCP 工具调用

### 简化的任务
- **任务 3.3（推荐引擎）**: 余弦相似度 → 100 行决策树
- **任务 3.1（特征提取）**: 8h → 6h（简化算法）
- **任务 3.2（能力矩阵）**: 4h → 3h（减少字段）

### 调整的验收标准
- "整体覆盖率 70%" → "20 个关键函数 100% 覆盖"
- "用户满意度提升" → "推荐接受率 ≥ 50%"
- "缓存命中率 80%" → "增量构建 < 30s（修改 3 文件）"

---

## 回滚计划

### 构建优化
- **触发**: 构建产物错误或性能下降
- **步骤**: 恢复旧构建脚本（`git revert`），清理缓存
- **数据**: 保留新配置文件作为参考

### 测试覆盖率
- **触发**: 测试不稳定导致 CI 频繁失败
- **步骤**: 降低覆盖率门禁到 80%，禁用不稳定测试
- **数据**: 测试代码保留

### Agent 路由
- **触发**: 推荐接受率 < 30%
- **步骤**: 禁用推荐功能（feature flag）
- **数据**: 所有历史数据保留用于改进

---

## 后续优化方向

完成本次优化后，建议考虑：

### 短期（1-2 个月）
1. **状态管理层重构**（P2，5-7 天）
   - 引入 WAL 和乐观锁
2. **Hook 执行引擎优化**（P2，3-4 天）
   - 异步执行池和超时机制

### 中期（3-6 个月）
1. **Agent 性能分析工具**（3-4 天）
   - OpenTelemetry + Prometheus
2. **智能缓存层**（3-5 天）
   - LRU + 内容哈希

---

## 附录

### 关键文件清单

**构建相关**:
- `esbuild.config.mjs` - 统一构建配置
- `scripts/build-mcp.mjs` - MCP 服务器构建
- `tsconfig.json` - TypeScript 配置

**测试相关**:
- `vitest.config.ts` - 测试配置
- `src/lib/__tests__/state-adapter.test.ts`
- `src/lib/__tests__/file-lock.test.ts`
- `src/hooks/__tests__/bridge.test.ts`
- `tests/integration/` - 集成测试套件

**路由相关**:
- `src/features/routing/task-analyzer.ts`
- `src/features/routing/agent-capabilities.json`
- `src/features/routing/recommendation-engine.ts`
- `src/features/routing/decision-logger.ts`

### 参考文档
- 代码库探索报告: `.omc/research/codebase-exploration-20260312.md`
- 运行时保护规范: `docs/standards/runtime-protection.md`
- Hook 执行顺序: `docs/standards/hook-execution-order.md`

---

**计划创建时间**: 2026-03-12  
**修订版本**: v2  
**预计完成时间**: 2026-04-08（22 天 + 2 天缓冲）  
**计划状态**: 待确认  

## 下一步

**此计划是否符合你的意图？**

- **"proceed"** - 开始执行任务 1.1
- **"adjust [X]"** - 返回修改特定部分
- **"restart"** - 重新规划
