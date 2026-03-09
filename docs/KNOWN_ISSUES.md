# Known Issues - v5.5.18

**最后更新**: 2026-03-06

## P0 - 立即修复（计划 v5.5.19）

### 1. State File Caching Missing

**优先级**: P0 - 性能
**影响**: 100+ sessions 时状态查询延迟 500ms
**位置**: `src/tools/state-tools.ts:150-198`
**描述**: 重复读取状态文件无缓存，O(N) 文件 I/O
**预期修复**: 内存缓存层（TTL: 5秒），减少 70-80% 文件 I/O
**目标版本**: v5.5.19

### 2. Hook Synchronous I/O Blocking

**优先级**: P0 - 性能
**影响**: Hook 执行延迟 5-15ms
**位置**: `src/hooks/bridge.ts:112,174,601-654`
**描述**: `readFileSync()` 阻塞事件循环
**预期修复**: 异步 + LRU 缓存，减少 60-70% 延迟
**目标版本**: v5.5.19

### 3. Database Missing Composite Indexes

**优先级**: P0 - 性能
**影响**: 查询时间 80-90% 可优化
**位置**: `src/mcp/job-state-db.ts:198-201`
**描述**: 查询无法使用现有索引
**预期修复**: 添加 `idx_jobs_status_spawned`, `idx_jobs_spawned_provider`
**目标版本**: v5.5.19

## P1 - 短期修复（1个月内）

### 4. Code Duplication in Path Resolution

**优先级**: P1 - 代码质量
**影响**: 维护性和可读性
**位置**: `src/tools/state-tools.ts`
**描述**: 路径解析逻辑重复 8+ 次
**预期修复**: 提取共享函数
**目标版本**: v5.5.20

### 5. Oversized definitions.ts

**优先级**: P1 - 代码质量
**影响**: 文件可维护性
**位置**: `src/agents/definitions.ts` (856 行)
**描述**: 单文件包含 49 个 agent 定义
**预期修复**: 按功能分组拆分
**目标版本**: v5.5.20

### 6. Incomplete API Contract Documentation

**优先级**: P1 - API 设计
**影响**: 开发者体验
**位置**: `src/tools/index.ts`, `src/hooks/bridge-types.ts`
**描述**: session_id 参数语义不清，缺少弃用警告
**预期修复**: 明确两种模式语义，添加弃用日志
**目标版本**: v5.5.20

## P2 - 中期改进（3个月）

### 7. Git Command Performance

**优先级**: P2 - 性能
**影响**: 大型仓库操作
**位置**: `src/tools/git-tools.ts`
**描述**: Git 命令缺少优化
**预期修复**: 批量操作、缓存
**目标版本**: v5.5.21+

### 8. String Concatenation in Hot Paths

**优先级**: P2 - 性能
**影响**: 高频操作延迟
**位置**: 多个文件
**描述**: 字符串拼接可优化为数组 join
**预期修复**: 使用数组 join 替代拼接
**目标版本**: v5.5.21+

### 9. JSON Repeated Parsing

**优先级**: P2 - 性能
**影响**: 内存和 CPU 使用
**描述**: 同一 JSON 多次解析
**预期修复**: 缓存解析结果
**目标版本**: v5.5.21+

### 10. Large File Streaming

**优先级**: P2 - 性能
**影响**: 大文件处理
**描述**: 缺少流式处理
**预期修复**: 实现流式读写
**目标版本**: v5.5.21+

## 环境特定问题

### Windows 平台

* 命令注入风险已在 v5.5.18 修复

* 路径分隔符处理已验证

### macOS/Linux

* 无已知平台特定问题

## 反馈和报告

如发现新问题，请提交 issue 并包含：

* 版本号

* 复现步骤

* 预期行为 vs 实际行为

* 环境信息（OS、Node 版本等）
