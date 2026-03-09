# Tech Feasibility Review: Draft PRD 三方向高价值开发规划

**评审时间**: 2026-03-02
**评审人**: axiom-tech-lead
**基于代码库版本**: v5.5.9 (dev branch)

---

## 1. Architecture Impact (架构影响)

| 方向 | Schema Changes | API Changes | 新依赖 |
| ------ | --------------- | ------------- | -------- |
| 方向一：Axiom 进化引擎完整化 | No | No | No |
| 方向二：Agent 可观测性平台 | Yes (SQLite metrics.db) | Yes (trace-query 工具) | better-sqlite3 (已有) |
| 方向三：Plugin 生态系统完善 | Yes (plugin.json 新增 dependencies 字段) | Yes (omc plugin 子命令) | No |

---

## 2. 方向一：Axiom 进化引擎完整化

### 技术评分：8/10

**优势**：

* 纯新增模块，不触碰现有核心逻辑（hook pipeline、state machine）

* pattern-scanner.ts 本质是 markdown 文件解析 + 正则匹配，复杂度低

* knowledge-transfer.ts 是 JSON 序列化/反序列化，无外部依赖

* axiom-auto-evolve hook 可复用现有 PostToolUse hook 框架（参考 axiom-boot/）

**风险点**：

* pattern-scanner 扫描代码库时若项目较大（>1000 文件），同步 I/O 会阻塞 hook 执行

* ax-status Dashboard 的"增长曲线"需要历史数据，但 pattern_library.md 是纯文本，无时间序列存储，需要额外设计数据结构

* knowledge-transfer 的"合并去重"逻辑需要定义明确的冲突解决策略（同名条目以哪个为准）

**估算**：~8 个原子任务，评估合理。实际工作量约 3-4 天。

---

## 3. 方向二：Agent 可观测性平台

### 技术评分：6/10

**优势**：

* better-sqlite3 已在项目依赖中，无需引入新包

* 现有 trace-tools.ts 已有 session replay 基础，可复用 JSONL 读取逻辑

* span 数据结构（traceId/spanId/duration_ms）设计清晰

**风险点（HIGH）**：

* **PostToolUse hook 性能瓶颈**：trace-collector hook 在每次工具调用后触发，若写入 SQLite 是同步操作，会直接增加每次工具调用的延迟。需要异步写入或批量缓冲策略

* **traceId 注入问题**：Claude Code 的 hook 输入不携带 agent 层级信息，无法自动构建 orchestrator→subagent 的父子 span 树。需要通过状态文件传递 parentSpanId，增加实现复杂度

* **token 数据来源**：Claude Code hook 的 tool_response 不直接暴露 input_tokens/output_tokens，需要解析响应内容或依赖 Claude API 的 usage 字段——这在 hook 上下文中不一定可用

**估算**：~10 个原子任务，但实际难度被低估。token 数据获取问题可能需要 POC 验证，建议调整为 12-14 个任务，工期 5-7 天。

---

## 4. 方向三：Plugin 生态系统完善

### 技术评分：7/10

**优势**：

* plugin-registry.ts 已有完整的版本管理基础（installPath、version、gitCommitSha）

* plugin-rollback.ts 的备份逻辑可直接复用 atomic-write.ts 的原子写入模式

* plugin-dependency.ts 的拓扑排序是经典算法（Kahn's algorithm），实现稳定

**风险点**：

* **Marketplace 数据源**：marketplace.json 从哪里获取？若是远程 URL，需要处理网络超时、离线场景；若是本地文件，需要定义更新机制。PRD 未明确

* **SHA-256 checksum 验证链**：checksum 本身存储在哪里？若存在 marketplace.json 中，则 marketplace.json 本身的完整性如何保证？存在信任链缺口

* **危险模式扫描的误报率**：`rm -rf` 等模式扫描容易误报（如注释、文档中的示例），需要定义扫描范围（仅扫描 hook 脚本的可执行部分）

**估算**：~12 个原子任务，评估合理。实际工作量约 5-6 天。

---

## 5. Risk Assessment (风险评估)

| 方向 | Complexity Score (1-10) | POC Required | 主要风险 |
| ------ | ------------------------ | -------------- | --------- |
| 方向一 | 4 | No | pattern-scanner 大文件性能 |
| 方向二 | 7 | **Yes** | token 数据获取、hook 性能影响 |
| 方向三 | 5 | No | marketplace 数据源设计 |

---

## 6. 关键技术差异点

* [D-TL-01] HIGH: 方向二的 token 数据在 hook 上下文中不可直接获取 → 建议先做 POC，验证 Claude Code hook 的 tool_response 结构是否包含 usage 字段，再决定是否推进完整实现

* [D-TL-02] HIGH: trace-collector PostToolUse hook 同步写 SQLite 会增加每次工具调用延迟 → 建议使用内存缓冲 + 会话结束时批量写入（session-end hook 触发 flush）

* [D-TL-03] MEDIUM: 方向一的 ax-status Dashboard 需要时间序列数据，但 pattern_library.md 无历史快照 → 建议在 evolution/ 目录下新增 `snapshots/` 存储每次 ax-evolve 后的状态快照（JSON），Dashboard 读取快照生成曲线

* [D-TL-04] MEDIUM: 方向三的 marketplace.json 信任链未定义 → 建议明确数据源为 GitHub Release Asset（通过 HTTPS + 官方仓库 URL 保证来源可信），checksum 与 marketplace.json 分离存储

* [D-TL-05] MEDIUM: 方向一的 pattern-scanner 若使用同步 fs.readdirSync 遍历大型代码库会阻塞 → 建议限制扫描范围为 `.omc/` 和 `src/` 目录，或使用 glob 白名单

* [D-TL-06] LOW: 方向三的 plugin-dependency.ts 拓扑排序需处理循环依赖 → 建议在 Kahn's algorithm 中检测剩余节点（入度不为 0）并抛出明确错误信息

---

## 7. Implementation Plan (大致实现计划)

### 方向一（推荐 P0 执行）

* Backend: pattern-scanner.ts（glob 扫描 + 正则匹配）→ knowledge-transfer.ts（JSON 序列化 + 合并策略）→ axiom-auto-evolve hook（复用 PostToolUse 框架）

* Frontend: ax-status SKILL.md 增强（读取 snapshots/ 生成文本曲线）

### 方向二（建议先 POC）

* POC: 验证 hook tool_response 中 token 数据可用性（1 天）

* Backend: tracer.ts → cost-aggregator.ts → trace-query.ts（SQLite 查询）→ trace-collector hook（异步缓冲写入）

### 方向三（P1 执行）

* Backend: plugin-marketplace.ts（本地 JSON + 远程 fetch）→ plugin-dependency.ts（拓扑排序）→ plugin-sandbox.ts（SHA-256 + 模式扫描）→ plugin-rollback.ts（备份 + 恢复）

---

## 8. 测试策略

| 模块 | 测试重点 | 难点 |
| ------ | --------- | ------ |
| pattern-scanner | 模式匹配准确率、大文件性能 | mock 文件系统 |
| knowledge-transfer | 合并去重逻辑、冲突解决 | 边界条件覆盖 |
| tracer / cost-aggregator | SQLite 写入/读取、并发安全 | 需要 in-memory SQLite |
| plugin-dependency | 拓扑排序正确性、循环依赖检测 | 图结构 fixture |
| plugin-sandbox | checksum 验证、危险模式误报率 | 需要真实插件 fixture |

---

## Conclusion (结论)

| 方向 | 结论 | Estimated Effort |
| ------ | ------ | ----------------- |
| 方向一：Axiom 进化引擎完整化 | **Pass** | 3-4 天 |
| 方向二：Agent 可观测性平台 | **POC Required**（token 数据可用性验证） | 1 天 POC + 5-7 天实现 |
| 方向三：Plugin 生态系统完善 | **Pass**（需明确 marketplace 数据源） | 5-6 天 |

**执行建议**：方向一立即启动；方向二先用 1 天 POC 验证 token 数据可获取性，通过后再排期；方向三与方向二并行或串行均可。
