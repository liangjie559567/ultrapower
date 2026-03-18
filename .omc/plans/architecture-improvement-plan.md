# ultrapower 架构改进计划

**基于**: 架构评审报告 (评分 7.5/10) + code-reviewer 审查意见
**目标**: 解决8个关键问题，提升至 8.5/10
**周期**: 4个阶段，共13-16周

---

## 执行摘要

**当前状态**: 架构设计良好，但存在并发安全、资源管理和扩展性问题
**改进目标**:
- 消除3个P0严重问题（连接池、状态冲突、IO阻塞）
- 解决3个P1重要问题（模块过重、循环依赖、全局单例）
- 优化2个P2建议（日志、追踪）
- 取消2个低优先级任务（features重组、合并重叠功能）

**预期收益**:
- 10x负载下系统稳定运行
- 并发agent数量从5提升至50
- 响应延迟降低60%
- 测试覆盖率保持100%

---

## 第一阶段: 并发安全与性能 (3-4周)

**目标**: 解决3个P0严重问题（优先级调整：连接池 → 部分异步化 → 状态管理）

### 任务0: 现状扫描与数据收集 (1周)

**目标**: 建立改造基线，收集关键数据

**实施步骤**:
1. 扫描所有同步IO调用点
   - 使用 `ast-grep` 查找 `fs.*Sync`、`readFileSync`、`writeFileSync`
   - 统计调用次数和分布
   - 识别热路径中的同步调用
2. 统计hooks导入点数量
   - 分析 `src/hooks/index.ts` 导出项
   - 统计各模块对hooks的依赖
   - 绘制依赖关系图
3. 收集连接池峰值数据
   - 添加临时监控代码
   - 记录LSP/MCP连接数峰值
   - 分析连接生命周期
4. 识别循环依赖路径
   - 使用 `madge` 工具扫描
   - 列出所有循环依赖链
   - 标记关键解耦点

**交付物**:
- `baseline-report.md`: 包含所有扫描数据
- `sync-io-inventory.json`: 同步IO调用清单
- `hooks-dependency-graph.svg`: hooks依赖图
- `connection-pool-metrics.json`: 连接池数据

**验收标准**:
- 同步IO调用点100%识别
- hooks导入点统计完整
- 连接池峰值数据≥7天
- 循环依赖路径全部列出

### 任务1: 添加连接池上限 (2天)

**问题**: LSP/MCP连接池无限增长导致OOM（P0优先级最高）

**方案**: 实现带上限的连接池（基于任务0的峰值数据）

**实施步骤**:
1. 创建 `src/lib/connection-pool.ts`
2. 根据任务0数据设置上限（预估: LSP=10, MCP=20）
3. 实现LRU淘汰策略
4. 添加连接超时（5分钟）
5. 添加连接泄漏检测
6. 内存泄漏测试（24小时）

**验收标准**:
- 连接数不超过上限
- 空闲连接自动关闭
- 24小时运行内存稳定
- 连接泄漏告警正常工作

**影响范围**:
- `src/tools/lsp/client.ts`
- `src/mcp/client.ts`
- `src/compatibility/mcp-bridge.ts`

### 任务2: 部分异步化文件操作 (5天)

**问题**: 同步IO阻塞事件循环（分4批改造，降低风险）

**方案**: 分批替换同步IO，每批独立测试

**实施步骤**:
1. **第1批: logs目录** (1天)
   - 替换 `src/lib/auditLog.ts` 中的同步调用
   - 替换 `src/observability/` 中的日志写入
   - 单元测试 + 性能测试
2. **第2批: notepad** (1天)
   - 替换 `src/hooks/notepad/` 中的同步调用
   - 更新调用链为 async/await
   - 集成测试
3. **第3批: state文件** (2天)
   - 替换 `src/hooks/*/state.ts` 中的同步调用
   - 配合任务3的状态管理改造
   - 回归测试
4. **第4批: 其他文件操作** (1天)
   - 替换 `src/lib/fs-utils.ts` 中的同步调用
   - 替换 `src/features/*/storage.ts` 中的同步调用
   - 全量测试

**验收标准**:
- 热路径中零同步文件操作
- 响应延迟降低30-50%
- 事件循环延迟 <10ms
- 每批改造后测试通过

**影响范围**:
- `src/lib/fs-utils.ts`
- `src/lib/auditLog.ts`
- `src/hooks/notepad/`
- `src/hooks/*/state.ts`
- `src/observability/`
- `src/features/*/storage.ts`

### 任务3: 改进状态管理中间件 (5天)

**问题**: 状态文件并发写入冲突，数据损坏风险

**方案**: 实现带锁机制的StateManager，采用渐进式迁移策略

**实施步骤**:
1. **阶段1: 只读验证** (1天)
   - 创建 `src/state/manager.ts`
   - 实现只读API: `read()`, `exists()`
   - 并行运行，验证数据一致性
2. **阶段2: 双写模式** (2周)
   - 实现写入API: `write()`, `lock()`, `unlock()`
   - 使用 `proper-lockfile` 实现文件锁
   - 同时写入旧路径和新API
   - 监控数据一致性
3. **阶段3: 逐模块切换** (2天)
   - 按模块切换到新API（autopilot → ralph → ultrawork → team）
   - 每个模块切换后运行集成测试
   - 保留旧代码路径作为回退
4. **阶段4: 清理旧代码** (1天)
   - 移除双写逻辑
   - 删除废弃代码路径
   - 更新文档

**验收标准**:
- 50个并发写入无冲突
- 锁超时自动释放（30s）
- 双写模式数据一致性100%
- 100%测试覆盖

**影响范围**:
- `src/hooks/autopilot/state.ts`
- `src/hooks/ralph/index.ts`
- `src/hooks/ultrawork/index.ts`
- `src/hooks/team-pipeline/state.ts`
- `src/features/state-manager/`

---

## 第二阶段: 模块解耦与重构 (5-6周)

**目标**: 解决3个P1重要问题

### 任务4: 拆分hooks模块 (7天)

**问题**: hooks模块1200+导出，职责过重

**方案**: 按功能域拆分为4个子模块

**新结构**:
```
src/hooks/
├── execution-modes/     # autopilot, ralph, ultrawork
│   ├── autopilot/
│   ├── ralph/
│   └── ultrawork/
├── lifecycle/           # session-start, session-end
│   ├── session-start/
│   └── session-end/
├── learner/            # skill extraction
│   └── (保持现有结构)
└── recovery/           # error recovery
    └── (保持现有结构)
```

**实施步骤**:
1. 创建新目录结构
2. 移动相关文件
3. 更新导入路径
4. 重新导出公共API
5. 更新文档

**验收标准**:
- 每个子模块导出 <300 项
- 零破坏性变更
- 所有测试通过

### 任务5: 解耦循环依赖 (5天)

**问题**: hooks ↔ features 循环引用

**方案**: 引入事件总线解耦

**实施步骤**:
1. 创建 `src/core/event-bus.ts`
2. 定义标准事件类型
3. hooks发布事件，features订阅
4. 移除直接导入
5. 集成测试

**验收标准**:
- 零循环依赖
- 事件延迟 <1ms
- 事件丢失率 0%

**影响范围**:
- `src/hooks/handlers/`
- `src/features/workflow-recommender/`
- `src/features/delegation-routing/`

### 任务6: 重构全局单例 (6天)

**问题**: MCP bridge/LSP client全局单例难以测试

**方案**: 依赖注入 + 工厂模式

**实施步骤**:
1. 创建 `MCPClientFactory`
2. 创建 `LSPClientFactory`
3. 通过构造函数注入
4. 更新所有使用点
5. Mock测试

**验收标准**:
- 零全局变量
- 可并发创建多实例
- 测试隔离性100%

**影响范围**:
- `src/mcp/client.ts`
- `src/tools/lsp/client.ts`
- `src/agents/wrapper.ts`

---

## 第三阶段: 可观测性提升 (5-6周)

**目标**: 优化2个P2建议（结构化日志、分布式追踪）

### 任务7: 引入结构化日志 (4天)

**问题**: 日志格式不统一，难以分析

**方案**: 使用pino实现结构化日志

**实施步骤**:
1. 安装pino依赖
2. 创建 `src/lib/logger.ts`
3. 定义日志schema
4. 替换console.log
5. 配置日志轮转

**验收标准**:
- 100% JSON格式
- 支持日志级别过滤
- 日志文件自动轮转

**日志schema**:
```typescript
{
  timestamp: ISO8601,
  level: 'info' | 'warn' | 'error',
  component: string,
  event: string,
  data: object,
  traceId?: string
}
```

### 任务8: 添加分布式追踪 (5天)

**问题**: Agent间调用链不可见

**方案**: 实现轻量级追踪系统

**实施步骤**:
1. 创建 `src/observability/tracer.ts`
2. 生成traceId/spanId
3. 在agent调用链传递
4. 输出到日志
5. 可视化工具

**验收标准**:
- 100%调用链可追踪
- 追踪开销 <5%
- 支持Jaeger格式导出

---

## 风险管理

### 高风险项

1. **状态管理迁移** (任务3)
   - 风险: 数据迁移失败
   - 缓解: 双写模式运行2周，逐步切换

2. **异步化改造** (任务2)
   - 风险: 破坏现有调用链
   - 缓解: 分4批渐进式改造，每批独立测试

3. **hooks拆分** (任务4)
   - 风险: 破坏向后兼容
   - 缓解: 保留旧导出，标记废弃

### 回滚策略

- 每个任务独立分支
- 完成后合并到dev
- 发现问题立即回滚
- 保留旧代码路径2个版本

---

## 验收标准

### 性能指标

- 并发agent数: 5 → 50
- 响应延迟: -60%
- 内存占用: 稳定在500MB以内
- 事件循环延迟: <10ms

### 质量指标

- 测试覆盖率: 保持100%
- 循环依赖: 0个
- 全局变量: 0个
- 同步IO: 0处

### 架构指标

- 模块内聚度: >0.8
- 模块耦合度: <0.3
- 抽象层次: 4层清晰
- 扩展性评分: 8.5/10

---

## 资源需求

### 人力

- 核心开发: 2人全职（从1人增加到2人）
- 代码审查: 1人兼职
- 测试验证: 1人全职（从兼职升级为全职）

### 时间

- 第一阶段: 3-4周 (并发安全，含任务0基线扫描)
- 第二阶段: 5-6周 (模块解耦)
- 第三阶段: 5-6周 (可观测性)
- 总计: 13-16周 (从原8周调整)

### 工具

- 锁管理: proper-lockfile
- 日志: pino
- 追踪: 自研轻量级
- 测试: vitest (现有)
- 循环依赖检测: madge
- AST搜索: ast-grep

---

## 后续计划

完成前3个阶段后，继续优化：

1. **性能优化** (第4阶段)
   - 引入缓存层
   - 优化热路径
   - 减少内存分配

2. **可靠性提升** (第5阶段)
   - 添加熔断器
   - 实现重试机制
   - 优雅降级

3. **开发体验** (第6阶段)
   - 改进错误提示
   - 完善文档
   - 提供调试工具

**注**: 根据code-reviewer建议，已取消任务7（features重组）和任务10（合并重叠功能），聚焦核心架构问题。

---

## 附录

### A. 依赖包清单

```json
{
  "dependencies": {
    "proper-lockfile": "^4.1.2",
    "pino": "^8.16.0",
    "pino-pretty": "^10.2.0"
  },
  "devDependencies": {
    "madge": "^6.1.0",
    "@ast-grep/cli": "^0.12.0"
  }
}
```

### B. 测试策略

- 单元测试: 每个任务独立测试
- 集成测试: 阶段完成后测试
- 性能测试: 第一阶段后基准测试
- 压力测试: 全部完成后50并发测试

### C. 文档更新清单

- `docs/ARCHITECTURE.md` - 更新架构图
- `docs/MIGRATION.md` - 迁移指南
- `src/*/AGENTS.md` - 模块文档
- `CHANGELOG.md` - 版本记录
