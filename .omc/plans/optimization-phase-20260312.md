# ultrapower 优化实施计划

**生成时间**: 2026-03-12
**基于**: `.omc/research/codebase-exploration-20260312.md`
**总预估工作量**: 8-13 天
**目标**: 提升测试覆盖率、优化构建流程、智能化 Agent 路由

---

## 1. 测试覆盖率提升

### 需求摘要

**当前状态**:
- 测试分散在 16 个目录，缺乏统一管理
- 关键模块（`src/lib/state-adapter.ts` ~400 行、`src/lib/file-lock.ts` ~200 行、`src/hooks/bridge.ts` ~500 行）测试不充分
- 测试输出文件过大（110KB+），难以分析
- 无覆盖率基线和 CI 门禁

**目标**:
- 建立 70%+ 代码覆盖率基线
- 关键模块达到 85%+ 覆盖率
- 添加端到端集成测试套件
- CI 流水线集成覆盖率检查

**价值**:
- 减少生产环境 bug 30-40%
- 为重构提供安全网
- 提高代码质量和可维护性

### 验收标准

✅ **可测试标准**:
1. 整体代码覆盖率 ≥ 70%（通过 `vitest --coverage` 验证）
2. `src/lib/state-adapter.ts` 覆盖率 ≥ 85%
3. `src/lib/file-lock.ts` 覆盖率 ≥ 85%
4. `src/hooks/bridge.ts` 覆盖率 ≥ 80%
5. 至少 5 个端到端集成测试场景通过
6. CI 流水线在覆盖率 < 70% 时失败
7. 测试执行时间 < 60 秒（并行执行）

### 实施步骤

**任务 1.1: 配置覆盖率工具** (2 小时)
- 文件: `vitest.config.ts`、`package.json`
- 操作:
  - 启用 `@vitest/coverage-v8` 插件
  - 配置覆盖率阈值（70% 全局，85% 关键模块）
  - 排除 `dist/`、`node_modules/`、`*.test.ts`
- 依赖: 无
- 验证: `npm run test:coverage` 生成报告

**任务 1.2: state-adapter 单元测试** (8 小时)
- 文件: `src/lib/state-adapter.ts` (400 行)、新建 `src/lib/__tests__/state-adapter.test.ts`
- 操作:
  - 测试 JSON 存储后端（读/写/更新/删除）
  - 测试 SQLite 存储后端（事务/并发）
  - 测试错误处理（文件不存在/权限错误/格式错误）
  - 测试 `assertValidMode()` 路径遍历防护
- 依赖: 任务 1.1
- 验证: 覆盖率 ≥ 85%，所有边界情况通过

**任务 1.3: file-lock 单元测试** (6 小时)
- 文件: `src/lib/file-lock.ts` (200 行)、新建 `src/lib/__tests__/file-lock.test.ts`
- 操作:
  - 测试锁获取/释放机制
  - 测试超时场景（默认 5 秒）
  - 测试并发竞争（10 个并发请求）
  - 测试孤儿锁清理
- 依赖: 任务 1.1
- 验证: 覆盖率 ≥ 85%，并发测试无死锁

**任务 1.4: hook-bridge 单元测试** (10 小时)
- 文件: `src/hooks/bridge.ts` (500 行)、新建 `src/hooks/__tests__/bridge.test.ts`
- 操作:
  - 测试 43 种 HookType 路由（参考 `docs/standards/hook-execution-order.md`）
  - 测试输入消毒（`bridge-normalize.ts` 白名单）
  - 测试敏感 hook 字段过滤（permission-request/setup/session-end）
  - 测试 hook 链式执行顺序
- 依赖: 任务 1.1
- 验证: 覆盖率 ≥ 80%，所有 hook 类型路由正确

**任务 1.5: 集成测试套件** (12 小时)
- 文件: 新建 `tests/integration/`
- 操作:
  - 场景 1: autopilot 端到端流程（explore → plan → execute → verify）
  - 场景 2: team 流水线（team-plan → team-prd → team-exec → team-verify）
  - 场景 3: ralph 循环（执行 → 验证 → 修复 → 重复）
  - 场景 4: 状态持久化和恢复（中断后恢复）
  - 场景 5: MCP 工具调用（ask_codex/ask_gemini）
- 依赖: 任务 1.2-1.4
- 验证: 所有场景通过，执行时间 < 60 秒

**任务 1.6: CI 集成** (2 小时)
- 文件: `.github/workflows/test.yml`（如存在）或新建
- 操作:
  - 添加 `npm run test:coverage` 步骤
  - 配置覆盖率门禁（< 70% 失败）
  - 上传覆盖率报告到 Codecov/Coveralls
- 依赖: 任务 1.5
- 验证: PR 触发 CI，覆盖率显示在 PR 评论

### 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 现有代码难以测试（紧耦合） | 高 | 中 | 先重构为可测试结构，再编写测试 |
| 集成测试不稳定（时序问题） | 中 | 高 | 使用 mock/stub 隔离外部依赖 |
| 覆盖率目标过高（70%） | 低 | 低 | 优先覆盖关键路径，非关键代码可降低标准 |
| 测试执行时间过长 | 中 | 中 | 并行执行，使用内存数据库 |

### 验证步骤

1. **本地验证**:
   ```bash
   npm run test:coverage
   # 检查输出: All files > 70%, state-adapter/file-lock > 85%
   ```

2. **关键模块验证**:
   ```bash
   vitest run src/lib/__tests__/state-adapter.test.ts --coverage
   vitest run src/lib/__tests__/file-lock.test.ts --coverage
   vitest run src/hooks/__tests__/bridge.test.ts --coverage
   ```

3. **集成测试验证**:
   ```bash
   vitest run tests/integration/ --reporter=verbose
   # 预期: 5/5 场景通过，< 60 秒
   ```

4. **CI 验证**:
   - 创建测试 PR，故意降低覆盖率到 65%
   - 确认 CI 失败并显示覆盖率报告

---

## 2. 构建流程优化

### 需求摘要

**当前状态**:
- 8+ 个独立构建脚本（`parallel-build.mjs`、`compose-docs.mjs`、`bridge/build.mjs`、`codex/build.mjs`、`gemini/build.mjs`）
- 构建时间长（预估 3-5 分钟）
- 增量构建支持不足，每次全量编译
- MCP 服务器构建串行执行

**目标**:
- 统一构建入口，减少脚本数量到 3 个以内
- 实现增量构建缓存，减少 30-40% 构建时间
- 并行化 MCP 服务器构建
- 优化 TypeScript 编译配置

**价值**:
- 开发循环时间减少 30-40%（从 3-5 分钟到 2-3 分钟）
- CI 成本降低 25%
- 改善开发体验

### 验收标准

✅ **可测试标准**:
1. 全量构建时间 ≤ 180 秒（从 ~240 秒优化）
2. 增量构建时间 ≤ 30 秒（仅修改 1-2 个文件）
3. MCP 服务器并行构建，总时间 ≤ 60 秒
4. 构建脚本数量 ≤ 3 个（主构建 + MCP + 文档）
5. 构建缓存命中率 ≥ 80%（修改单文件场景）
6. TypeScript 编译错误 0 个
7. 构建产物大小无显著增加（< 5%）

### 实施步骤

**任务 2.1: 分析现有构建流程** (3 小时)
- 文件: `scripts/parallel-build.mjs`、`scripts/compose-docs.mjs`、`bridge/build.mjs`、`codex/build.mjs`、`gemini/build.mjs`
- 操作:
  - 测量每个脚本执行时间（使用 `time` 命令）
  - 识别构建依赖关系（哪些可并行）
  - 分析 TypeScript 编译瓶颈（`tsc --extendedDiagnostics`）
- 依赖: 无
- 验证: 生成构建性能基线报告（`.omc/research/build-baseline.md`）

**任务 2.2: 统一 esbuild 配置** (6 小时)
- 文件: 新建 `esbuild.config.mjs`、修改 `package.json`
- 操作:
  - 合并 parallel-build 和 compose-docs 逻辑
  - 配置增量构建（`incremental: true`）
  - 启用 sourcemap 和 minify
  - 设置 external 依赖（避免打包 node_modules）
- 依赖: 任务 2.1
- 验证: `npm run build` 成功，产物在 `dist/`

**任务 2.3: MCP 服务器并行构建** (4 小时)
- 文件: 新建 `scripts/build-mcp.mjs`
- 操作:
  - 使用 `Promise.all()` 并行构建 bridge/codex/gemini
  - 共享 esbuild 上下文（减少启动开销）
  - 添加构建进度显示
- 依赖: 任务 2.2
- 验证: 3 个 MCP 服务器构建时间 ≤ 60 秒

**任务 2.4: 实现构建缓存** (5 小时)
- 文件: `esbuild.config.mjs`、新建 `.cache/build/`
- 操作:
  - 基于文件内容哈希的缓存键（使用 `crypto.createHash`）
  - 缓存 TypeScript 编译结果（`.tsbuildinfo`）
  - 缓存 esbuild 元数据
  - 实现缓存失效策略（依赖变更时）
- 依赖: 任务 2.2
- 验证: 修改单文件后重新构建 ≤ 30 秒

**任务 2.5: 优化 TypeScript 配置** (2 小时)
- 文件: `tsconfig.json`
- 操作:
  - 启用 `incremental: true` 和 `tsBuildInfoFile`
  - 设置 `skipLibCheck: true`（跳过 node_modules 类型检查）
  - 配置 `paths` 别名（减少解析时间）
  - 调整 `target` 和 `module`（ES2022/ESNext）
- 依赖: 任务 2.1
- 验证: `tsc --noEmit` 时间减少 20%+

**任务 2.6: 更新 package.json 脚本** (1 小时)
- 文件: `package.json`
- 操作:
  - 简化构建命令：`build`、`build:mcp`、`build:docs`
  - 添加 `build:watch` 用于开发
  - 添加 `build:clean` 清理缓存
- 依赖: 任务 2.2-2.5
- 验证: 所有脚本执行成功

### 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 缓存失效逻辑错误（构建产物过期） | 高 | 中 | 添加缓存版本号，依赖变更时强制重建 |
| esbuild 配置不兼容现有代码 | 中 | 低 | 逐步迁移，保留旧脚本作为回退 |
| 并行构建资源竞争（内存/CPU） | 低 | 中 | 限制并发数（`os.cpus().length - 1`） |
| TypeScript 增量构建不稳定 | 中 | 低 | 定期清理 `.tsbuildinfo`，CI 使用全量构建 |

### 验证步骤

1. **全量构建验证**:
   ```bash
   npm run build:clean
   time npm run build
   # 预期: ≤ 180 秒
   ```

2. **增量构建验证**:
   ```bash
   # 修改单个文件
   echo "// test" >> src/lib/state-adapter.ts
   time npm run build
   # 预期: ≤ 30 秒
   ```

3. **MCP 并行构建验证**:
   ```bash
   time npm run build:mcp
   # 预期: ≤ 60 秒，3 个服务器同时构建
   ```

4. **缓存命中率验证**:
   ```bash
   npm run build  # 第一次
   npm run build  # 第二次（无修改）
   # 预期: 第二次 < 5 秒（完全缓存命中）
   ```

---

## 3. Agent 路由智能化

### 需求摘要

**当前状态**:
- 49 个 agents，手动路由或基于关键词触发
- 用户需要记忆 agent 能力和适用场景
- 无法根据任务复杂度自动选择模型（haiku/sonnet/opus）
- 缺乏历史路由决策的学习机制

**目标**:
- 构建任务特征向量化（复杂度/领域/文件数/代码行数）
- 实现 Agent 推荐引擎（基于规则 + 历史数据）
- 记录路由决策和结果（成功率/耗时/成本）
- 定期优化路由策略

**价值**:
- 提高任务完成率 15-20%
- 降低用户学习成本 50%+
- 优化成本 10-15%（自动选择合适模型）

### 验收标准

✅ **可测试标准**:
1. 任务特征提取准确率 ≥ 90%（人工标注 100 个样本验证）
2. Agent 推荐 Top-3 准确率 ≥ 80%（历史数据回测）
3. 路由决策记录完整性 100%（每次调用都记录）
4. 推荐引擎响应时间 ≤ 100ms
5. 成本优化效果 ≥ 10%（对比历史平均成本）
6. 用户满意度提升（通过反馈收集）
7. 支持 A/B 测试框架（对比新旧路由策略）

### 实施步骤

**任务 3.1: 任务特征提取器** (8 小时)
- 文件: 新建 `src/features/routing/task-analyzer.ts`
- 操作:
  - 提取文本特征（关键词/意图/领域）
  - 提取代码特征（文件数/行数/语言）
  - 计算复杂度评分（1-10 分）
  - 识别任务类型（实现/调试/审查/规划）
- 依赖: 无
- 验证: 100 个样本准确率 ≥ 90%

**任务 3.2: Agent 能力矩阵** (4 小时)
- 文件: 新建 `src/features/routing/agent-capabilities.json`
- 操作:
  - 定义 49 个 agents 的能力向量（领域/复杂度/模型）
  - 参考 `src/agents/definitions.ts` 和 `CLAUDE.md`
  - 标注推荐场景和反模式
- 依赖: 无
- 验证: 覆盖所有 agents，字段完整

**任务 3.3: 推荐引擎核心** (10 小时)
- 文件: 新建 `src/features/routing/recommendation-engine.ts`
- 操作:
  - 实现基于规则的匹配（任务类型 → agent 类型）
  - 实现相似度计算（余弦相似度）
  - 实现模型选择逻辑（复杂度 → haiku/sonnet/opus）
  - 返回 Top-3 推荐及置信度
- 依赖: 任务 3.1, 3.2
- 验证: 历史数据回测准确率 ≥ 80%

**任务 3.4: 路由决策记录** (6 小时)
- 文件: 新建 `src/features/routing/decision-logger.ts`、`.omc/routing/decisions.jsonl`
- 操作:
  - 记录每次路由决策（任务/推荐/选择/结果）
  - 记录执行指标（耗时/成本/成功率）
  - 实现日志轮转（每月归档）
- 依赖: 任务 3.3
- 验证: 100% 调用都有记录

**任务 3.5: 集成到现有流程** (8 小时)
- 文件: `src/agents/agent-wrapper.ts`、`src/hooks/keyword-detector/index.ts`
- 操作:
  - 在 agent 调用前插入推荐逻辑
  - 显示推荐结果给用户（可选接受）
  - 记录用户选择（接受/拒绝/修改）
- 依赖: 任务 3.3, 3.4
- 验证: 用户看到推荐，可手动覆盖

**任务 3.6: 策略优化和 A/B 测试** (4 小时)
- 文件: 新建 `src/features/routing/strategy-optimizer.ts`
- 操作:
  - 分析历史决策数据（成功率/成本）
  - 调整能力矩阵权重
  - 实现 A/B 测试框架（50% 用户使用新策略）
- 依赖: 任务 3.4, 3.5
- 验证: 成本优化 ≥ 10%

### 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 特征提取不准确（误判任务类型） | 高 | 中 | 允许用户手动覆盖，收集反馈优化 |
| 推荐引擎过于保守（总推荐 opus） | 中 | 中 | 设置成本约束，优先推荐 sonnet/haiku |
| 历史数据不足（冷启动问题） | 中 | 高 | 使用基于规则的回退策略 |
| 用户不信任推荐（忽略建议） | 低 | 中 | 显示推荐理由，逐步建立信任 |

### 验证步骤

1. **特征提取验证**:
   ```bash
   node dist/features/routing/task-analyzer.js "Fix login bug"
   # 预期: {type: "debugging", complexity: 5, domain: "auth"}
   ```

2. **推荐引擎验证**:
   ```bash
   node dist/features/routing/recommendation-engine.js --task "Refactor auth module"
   # 预期: Top-3: [architect(opus), executor(sonnet), debugger(sonnet)]
   ```

3. **决策记录验证**:
   ```bash
   cat .omc/routing/decisions.jsonl | wc -l
   # 预期: 每次调用增加 1 行
   ```

4. **成本优化验证**:
   ```bash
   node scripts/analyze-routing-cost.js --before 2026-03-01 --after 2026-03-15
   # 预期: 成本降低 ≥ 10%
   ```

---

## 总体时间线

### 第 1 周（3月12日-3月18日）
**优先级**: P1 - 测试覆盖率提升
- Day 1-2: 任务 1.1-1.3（配置工具 + state-adapter + file-lock 测试）
- Day 3-4: 任务 1.4（hook-bridge 测试）
- Day 5: 任务 1.5（集成测试套件，部分完成）

**里程碑**: 关键模块测试覆盖率达到 85%

### 第 2 周（3月19日-3月25日）
**优先级**: P1 - 构建流程优化 + 测试完成
- Day 1: 任务 1.5-1.6（集成测试完成 + CI 集成）
- Day 2: 任务 2.1-2.2（构建分析 + esbuild 配置）
- Day 3: 任务 2.3-2.4（MCP 并行构建 + 缓存）
- Day 4: 任务 2.5-2.6（TypeScript 优化 + 脚本更新）
- Day 5: 验证和调优

**里程碑**: 构建时间减少 30%+，测试覆盖率 70%+

### 第 3 周（3月26日-4月1日）
**优先级**: P2 - Agent 路由智能化
- Day 1-2: 任务 3.1-3.2（特征提取 + 能力矩阵）
- Day 3-4: 任务 3.3-3.4（推荐引擎 + 决策记录）
- Day 5: 任务 3.5（集成到现有流程）

**里程碑**: 推荐引擎上线，开始收集数据

### 第 4 周（4月2日-4月8日）
**优先级**: 优化和监控
- Day 1: 任务 3.6（策略优化 + A/B 测试）
- Day 2-3: 全面回归测试
- Day 4-5: 文档更新和知识转移

**里程碑**: 所有优化完成，指标达标

---

## 资源需求

### 人力资源
- **主开发**: 1 人全职（4 周）
- **测试工程师**: 0.5 人（第 1-2 周，协助编写测试）
- **代码审查**: 1 人兼职（每周 4 小时）

### 技术资源
- **开发环境**: Node.js 18+, TypeScript 5+, vitest
- **CI/CD**: GitHub Actions 或等效平台
- **监控工具**: 覆盖率报告（Codecov/Coveralls）
- **存储**: 约 500MB（测试数据 + 构建缓存）

### 外部依赖
- `@vitest/coverage-v8`: 测试覆盖率
- `esbuild`: 构建工具
- 无需新增付费服务

---

## 成功指标

### 量化指标

| 指标 | 基线 | 目标 | 测量方法 |
|------|------|------|----------|
| 代码覆盖率 | ~40% | ≥70% | `vitest --coverage` |
| 关键模块覆盖率 | ~50% | ≥85% | 针对 state-adapter/file-lock/bridge |
| 全量构建时间 | ~240s | ≤180s | `time npm run build` |
| 增量构建时间 | ~120s | ≤30s | 修改单文件后构建 |
| Agent 推荐准确率 | N/A | ≥80% | 历史数据回测 |
| 成本优化 | 基线 | -10% | 对比 2 周前后平均成本 |
| 测试执行时间 | ~90s | ≤60s | 并行执行所有测试 |

### 质量指标

✅ **必须达成**:
1. 零 P0 级别的测试失败
2. 零构建错误
3. 所有 CI 检查通过
4. 代码审查通过（至少 1 位审查者批准）

✅ **期望达成**:
1. 用户反馈积极（推荐功能）
2. 开发体验改善（构建更快）
3. 文档完整（所有新功能有文档）

### 业务指标

- **开发效率**: 开发循环时间减少 25%+
- **质量提升**: 生产环境 bug 减少 20%+
- **成本控制**: API 调用成本降低 10%+
- **用户满意度**: NPS 提升 10 分+

---

## 依赖和前置条件

### 技术前置条件
- ✅ 代码库健康（无重大技术债务阻塞）
- ✅ 测试框架已配置（vitest）
- ✅ 构建系统可运行（esbuild）
- ⚠️ 需要历史路由数据（Agent 推荐，可用规则回退）

### 组织前置条件
- ✅ 获得 4 周开发时间批准
- ✅ 代码审查资源可用
- ⚠️ 需要用户参与 A/B 测试（可选）

---

## 回滚计划

### 测试覆盖率提升
- **回滚触发**: 测试不稳定导致 CI 频繁失败
- **回滚步骤**: 
  1. 降低覆盖率门禁到 50%
  2. 禁用不稳定的集成测试
  3. 保留单元测试
- **数据保留**: 测试代码保留，仅调整 CI 配置

### 构建流程优化
- **回滚触发**: 构建产物错误或性能下降
- **回滚步骤**:
  1. 恢复旧构建脚本（`git revert`）
  2. 清理构建缓存
  3. 验证构建产物一致性
- **数据保留**: 保留新配置文件作为参考

### Agent 路由智能化
- **回滚触发**: 推荐准确率 < 50% 或用户投诉
- **回滚步骤**:
  1. 禁用推荐功能（feature flag）
  2. 恢复原有关键词路由
  3. 保留决策日志用于分析
- **数据保留**: 所有历史数据保留用于改进

---

## 后续优化方向

完成本次优化后，建议考虑以下方向：

### 短期（1-2 个月）
1. **状态管理层重构**（P2，5-7 天）
   - 引入 WAL 和乐观锁
   - 参考探索报告第 79-97 行

2. **Hook 执行引擎优化**（P2，3-4 天）
   - 异步执行池和超时机制
   - 参考探索报告第 101-120 行

### 中期（3-6 个月）
1. **Agent 性能分析工具**（3-4 天）
   - OpenTelemetry + Prometheus
   - 参考探索报告第 172-176 行

2. **智能缓存层**（3-5 天）
   - LRU + 内容哈希
   - 参考探索报告第 184-188 行

### 长期（6-12 个月）
1. **工作流可视化编辑器**（7-10 天）
   - React + D3.js
   - 参考探索报告第 178-182 行

2. **多租户隔离**（5-7 天）
   - namespace + RBAC
   - 参考探索报告第 190-194 行

---

## 附录

### 关键文件清单

**测试相关**:
- `vitest.config.ts` - 测试配置
- `src/lib/__tests__/state-adapter.test.ts` - 状态适配器测试
- `src/lib/__tests__/file-lock.test.ts` - 文件锁测试
- `src/hooks/__tests__/bridge.test.ts` - Hook 桥接测试
- `tests/integration/` - 集成测试套件

**构建相关**:
- `esbuild.config.mjs` - 统一构建配置
- `scripts/build-mcp.mjs` - MCP 服务器构建
- `tsconfig.json` - TypeScript 配置
- `.cache/build/` - 构建缓存目录

**路由相关**:
- `src/features/routing/task-analyzer.ts` - 任务特征提取
- `src/features/routing/agent-capabilities.json` - Agent 能力矩阵
- `src/features/routing/recommendation-engine.ts` - 推荐引擎
- `src/features/routing/decision-logger.ts` - 决策记录
- `.omc/routing/decisions.jsonl` - 路由决策日志

### 参考文档

- 代码库探索报告: `.omc/research/codebase-exploration-20260312.md`
- 运行时保护规范: `docs/standards/runtime-protection.md`
- Hook 执行顺序: `docs/standards/hook-execution-order.md`
- Agent 定义: `src/agents/definitions.ts`
- 项目规范: `CLAUDE.md`

---

**计划创建时间**: 2026-03-12  
**预计完成时间**: 2026-04-08  
**计划状态**: 待审批  
**下一步**: 用户确认后开始执行任务 1.1
