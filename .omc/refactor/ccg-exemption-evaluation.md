# CCG 模块豁免策略评估

**评估时间**: 2026-03-09
**当前状态**: 70 个同步 fs 错误待修复

## 关键发现

**CCG 模块无需豁免** - 经检查，CCG 模块（`src/features/ccg/`）中**没有 `no-restricted-syntax` 错误**。

## 剩余错误分布（7 个文件）

| 文件 | 类型 | 优先级 |
| ------ | ------ | -------- |
| src/hooks/preemptive-compaction/index.ts | Hook | 高 |
| src/hooks/recovery/context-window.ts | Hook | 高 |
| src/hooks/session-end/index.ts | Hook | 高 |
| src/lib/path-validator.ts | 工具库 | 中 |
| src/monitoring/metrics-collector.ts | 监控 | 中 |
| src/tools/python-repl/bridge-manager.ts | Python REPL | 低 |
| src/tools/python-repl/paths.ts | Python REPL | 低 |

## 建议策略

### 批次 6：Hooks 模块（3 个文件）

* preemptive-compaction

* recovery/context-window

* session-end

* 预计修复：~30 个错误

### 批次 7：工具库和监控（2 个文件）

* lib/path-validator

* monitoring/metrics-collector

* 预计修复：~20 个错误

### 批次 8：Python REPL（2 个文件）

* tools/python-repl/bridge-manager

* tools/python-repl/paths

* 预计修复：~20 个错误

* 或考虑豁免（CLI 工具特性）

## 结论

1. **CCG 模块无需处理** - 已经是异步的或已豁免
2. **剩余工作集中在 Hooks 和工具模块**
3. **预计 3 个批次完成全部重构**
