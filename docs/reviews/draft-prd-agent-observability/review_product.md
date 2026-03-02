# Product Strategy Review: Agent 可观测性平台

**评审日期：** 2026-03-02
**评审人：** Product Director
**PRD 状态：** Draft

---

## 1. Strategic Fit（战略匹配: Med）

**Alignment 分析：**

现有 trace skill（`trace_timeline` / `trace_summary`）已覆盖会话内的 agent 流程可视化，基于 JSONL 文件的 session-replay 机制。本 PRD 提出的"可观测性平台"本质上是对 trace 的持久化扩展，而非独立方向。

差异化评估：

| 能力 | 现有 trace skill | 本 PRD 新增 |
|------|-----------------|------------|
| 会话内时间线 | 已有 | 无新增 |
| 跨会话数据保留 | 无（JSONL 临时文件） | SQLite 持久化 |
| 成本/token 追踪 | 无 | 新增 |
| P95 工具调用分析 | 无 | 新增 |
| 独立 skill 入口 | /trace | /ax-observe（重复） |

差异化是真实的，但 `/ax-observe` 作为独立 skill 的必要性存疑——现有 `/trace` 完全可以扩展承载这些能力，新增 skill 会造成用户认知分裂。

**Roadmap Fit：**

当前 Q1 重心是 Axiom 进化引擎完整化（T-01~T-08 刚完成）和 Plugin 生态。可观测性属于"基础设施增强"，不在已确认的三个高价值方向主线上，属于支撑性需求。

---

## 2. Prioritization Matrix（优先级矩阵）

- Impact: **3 / 5**
  - 成本追踪对重度用户有价值，但 ultrapower 用户群目前以开发者为主，成本感知需求尚未成为痛点
  - P95 分析是高级运维需求，受众窄
  - 跨会话持久化有实际价值，但紧迫度低

- Effort: **4 / 5**
  - SQLite 引入新依赖（better-sqlite3 或 drizzle），需处理 Windows 路径、并发写入、schema 迁移
  - 成本估算需维护 token 定价表，随模型更新需持续维护
  - P95 统计需要足够的数据量才有意义

- Score: **3 × (5-4) / 5 = ROI 偏低**，投入产出比不理想。

---

## 3. Success Metrics（成功指标）

- Primary KPI：跨会话 trace 查询使用率（目标：活跃用户中 >20% 每周使用一次）
- Secondary KPI：成本追踪功能的用户留存影响（难以单独归因）
- 不做的风险：低。现有 trace skill 已满足核心调试需求，缺失持久化是体验缺口而非功能缺口。

---

## 4. 范围裁剪建议

当前 PRD 范围过大，建议按以下优先级拆分：

**保留（MVP）：**
- 跨会话 JSONL 归档（复用现有 file-lock + archiver 模式，无需 SQLite）
- 在现有 `/trace` skill 上扩展 `--session <id>` 参数支持历史查询

**延后（v2）：**
- 成本/token 追踪（需定价表维护机制成熟后再做）
- P95 工具调用分析（需积累足够数据量）

**拒绝：**
- `/ax-observe` 独立 skill——合并到 `/trace` 扩展，避免认知分裂

---

## Conclusion（结论）

**P2 - Nice to Have**（当前形态）/ **P1 - Should Have**（裁剪后 MVP）

**Note：** 本 PRD 的核心价值点（跨会话持久化）值得做，但实现路径应是扩展现有 trace skill，而非新建独立平台。SQLite + 成本追踪的完整方案在当前阶段 effort 过高，建议先用 JSONL 归档方案（与 Axiom 进化引擎的 archiver 模式一致）验证需求，再决定是否引入数据库层。优先级低于 Plugin 生态方向。
