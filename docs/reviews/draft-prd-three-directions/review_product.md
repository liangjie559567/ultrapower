# Product Strategy Review: Draft PRD 三方向高价值开发规划

**评审时间**：2026-03-02
**评审人**：Product Director (axiom-product-director)
**PRD 版本**：2026-01-21 Draft

---

## 1. Strategic Fit（战略匹配）

### 方向一：Axiom 进化引擎完整化

* Alignment: **High** — 直接强化 ultrapower 的核心差异化能力（自学习 AI 编排层）。Pattern Promotion Pipeline 和跨项目知识迁移是竞争对手（Cursor、Copilot）尚未提供的能力，属于护城河级功能。进化触发自动化将系统从"被动工具"升级为"主动学习伙伴"，与 Q1 目标（提升 agent 编排质量）高度一致。

### 方向二：Agent 可观测性平台

* Alignment: **Medium** — Token 成本透明化是用户高频痛点，但当前 ultrapower 已有基础 trace 工具。结构化 Trace/Span 和 SQLite 持久化属于基础设施投资，短期内对用户感知价值有限。与 Q1/Q2 路线图的契合度中等，更适合作为 Q2 的基础设施准备。

### 方向三：Plugin 生态系统完善

* Alignment: **Medium** — Plugin Marketplace 和沙箱验证对生态扩展有战略价值，但当前插件生态规模尚小，Marketplace 的网络效应尚未形成。在插件数量不足时，Marketplace 是"空货架"问题。安全验证（F3）是真实需求，但其余功能的战略时机尚未成熟。

---

## 2. Prioritization Matrix（优先级矩阵）

| 方向 | Impact (1-5) | Effort (1-5) | ROI Score | 推荐优先级 |
| ------ | ------------- | ------------- | ----------- | ----------- |
| 方向一：Axiom 进化引擎完整化 | 5 | 2 | **2.5** | P0 |
| 方向二：Agent 可观测性平台 | 3 | 4 | **0.75** | P2 |
| 方向三：Plugin 生态系统完善 | 3 | 4 | **0.75** | P1 |

> ROI Score = Impact / Effort，越高越优先。

**方向一**：Impact 5 — 直接提升核心产品能力，用户每次会话都能感知；Effort 2 — 纯新增逻辑，不触碰现有核心路径，风险极低。

**方向二**：Impact 3 — 解决真实痛点但属于"锦上添花"；Effort 4 — SQLite 集成、hook 埋点、跨会话查询涉及多层改动，风险中等。

**方向三**：Impact 3 — 生态价值依赖插件数量，当前规模下边际收益有限；Effort 4 — 依赖解析、沙箱验证、回滚机制均为复杂工程。F3（安全验证）单独拆出 Impact 可达 4，建议优先。

---

## 3. Success Metrics（成功指标）

### 方向一

* Primary KPI：知识库条目增长率（目标：每 10 次会话新增 ≥ 3 条 active 模式）

* Secondary KPI：ax-evolve 自动触发率（目标：≥ 80% 的 implement 完成后自动触发）

* 风险指标：pattern_library.md 中 active 模式占比（当前接近 0%，目标 Q1 末 ≥ 30%）

### 方向二

* Primary KPI：用户主动查询 `ax-status --cost` 的频率

* Secondary KPI：token 超限告警触发后用户调整行为的比例

* 注意：若无用户行为数据收集机制，此 KPI 难以度量

### 方向三

* Primary KPI：通过 Marketplace 安装的插件数量

* Secondary KPI：checksum 验证拦截率（安全价值证明）

* 风险：Marketplace 冷启动问题——插件数 < 10 时用户体验差

---

## 4. Risk Assessment（范围风险）

### 方向一风险

* **低风险**：F1/F2/F3 均为新增模块，不修改现有 hook 路径

* 潜在蔓延：F4 Dashboard 如果追求"增长曲线可视化"可能演变为复杂 UI 工程，建议 MVP 仅输出文本摘要，不做图形化

### 方向二风险

* **中风险**：PostToolUse hook 埋点覆盖所有 agent 调用，若实现不当会影响所有 agent 性能

* 功能蔓延警告：SQLite + P50/P95 + 跨会话查询 + 告警 = 实际上是一个完整的 APM 系统，远超"可观测性增强"的范畴

* 建议：MVP 仅做 F2（Token 成本聚合），F1/F3/F4 推迟

### 方向三风险

* **中风险**：依赖解析（拓扑排序）+ 沙箱验证 + 版本回滚 = 实际上是一个完整的包管理器

* 冷启动风险：Marketplace 在插件生态未成熟前是负担而非资产

* 建议：仅做 F3（沙箱安全验证）作为 MVP，F1/F2/F4 推迟至生态成熟后

---

## Conclusion（结论）

### 方向一：P0 - Must Have

**评分：8/10**
完整的进化引擎闭环是 ultrapower 的核心差异化能力，ROI 最高，风险最低，立即执行。唯一建议：F4 Dashboard 限制在文本输出 MVP，避免 UI 工程蔓延。

### 方向二：P2 - Nice to Have（MVP 降级）

**评分：5/10**
全量实现是过度投资。建议将 F2（Token 成本聚合）单独提取为 P1 小功能，其余 F1/F3/F4 推迟。Token 透明化是真实痛点，但不需要完整 APM 平台来解决。

### 方向三：P1 - Should Have（范围收窄）

**评分：6/10**
F3（沙箱安全验证：SHA-256 + 危险模式扫描）是真实安全需求，应优先实现。F1 Marketplace 推迟至插件数 ≥ 20 后再做。F2 依赖解析和 F4 版本回滚可作为后续迭代。

---

## 关键产品差异点

* [D-PD-01] HIGH: 方向二全量实现存在严重功能蔓延风险 → 建议仅提取 F2（Token 成本聚合）作为独立小功能，其余推迟；完整 APM 平台不是当前阶段的正确投资

* [D-PD-02] HIGH: 方向三 Marketplace 存在冷启动陷阱 → 建议将 F3（沙箱安全验证）单独提取为 P1，Marketplace（F1）推迟至生态成熟；安全是刚需，Marketplace 是时机问题

* [D-PD-03] MEDIUM: 方向一 F4 Dashboard 有 UI 工程蔓延风险 → MVP 限定为 `ax-status` 文本输出增强，明确禁止图形化 UI，避免范围膨胀

* [D-PD-04] MEDIUM: 三个方向的 PRD 均缺乏明确的"不做什么"边界定义 → 建议每个方向补充 Out of Scope 章节，防止实现阶段范围蔓延

* [D-PD-05] LOW: 方向二 F3 跨会话性能趋势依赖 SQLite，引入新的基础设施依赖 → 评估是否可用现有 JSON 文件替代，降低技术复杂度
