# 评审摘要: Axiom 记忆与进化系统 Token 使用效率优化

> **聚合时间**: 2026-03-02
> **Rough PRD 路径**: `docs/prd/memory-evolution-optimize-rough.md`
> **聚合者**: axiom-review-aggregator

---

## 1. 关键决策

### 冲突仲裁结果

| 冲突 | 涉及专家 | 仲裁层级 | 决策结果 |
|------|---------|---------|---------|
| T4 字段名 `auto_evolve` vs `auto_evolve_done` | Critic vs 草稿 | 1-安全（Critic 最高优先级） | 统一为 `auto_evolve_done: true`，两处必须一致 |
| `stop_hook_active` 守卫描述与实现不符 | Critic vs 草稿 | 1-安全（Critic 最高优先级） | 删除守卫，改为校验 `hook_event_name === 'SessionEnd'` |
| T4 中途崩溃无数据一致性保障 | Critic vs 草稿 | 1-安全（Critic 最高优先级） | 增加 `processing` 中间状态，三步原子化处理 |
| MiniSearch `--filter` 正则注入 | Critic vs 草稿 | 1-安全（Critic 最高优先级） | T3-v2 强制引用 k-034 模式；T3-v1 增加 256 字符上限 |
| T1/T2 并发归档无保护 | Critic vs 草稿 | 1-安全（Critic 最高优先级） | 强制使用 `.archive.lock` 文件锁 |
| `learning_queue.md` 格式：表格 vs 块格式 | Tech Lead vs 现有代码 | 2-技术可行性（Tech 硬性约束） | 选择路径 A：重写解析器支持多行块格式 |
| 保留 20 条反思（~800 行）vs 目标 ~400 行 | Tech Lead vs 草稿 | 2-技术可行性（Tech 硬性约束） | 窗口降为 10 条（~380 行），修正降幅估算 |
| T3-v2 MiniSearch content 字段来源 | Tech Lead vs 草稿 | 2-技术可行性（Tech 硬性约束） | content = `Title + " " + Category` 组合，明确标注检索价值有限 |
| T4 进入 MVP 的必要性 | Product Director（HIGH） vs 草稿 | 3-战略对齐 | T4 降为 P1-Should Have，移至 v1.1 |
| T3 v1/v2 双方案并存无选择机制 | Product Director（HIGH） vs 草稿 | 3-战略对齐 | T3-v1 和 T3-v2 拆为独立任务；v2 延期至知识库 > 200 条 |
| 归档文件无增长监控 | Product Director（HIGH） vs 草稿 | 3-战略对齐（轻量版） | 归档文件 > 5000 行时输出 warning（不自动清理） |
| T1 触发与 ax-evolve 强耦合 | Domain Expert（HIGH） vs 草稿 | 4-业务逻辑 | 新增 `--archive-queue` 手动触发入口，解除强耦合 |
| 归档操作静默 | UX Director（HIGH） vs 草稿 | 5-用户体验（轻量采纳） | 每次归档输出一行摘要 |
| MiniSearch 降级无通知 | UX Director（HIGH） vs 草稿 | 5-用户体验 | T3-v2 约束中增加降级通知 |
| T4 超时后条目状态未定义 | UX Director（HIGH） vs 草稿 | 5-用户体验 | 明确：超时后 processing 回滚至 pending |

### 同一问题多专家覆盖

| 问题 | 覆盖专家 | 仲裁结果 |
|------|---------|---------|
| T4 字段名不一致 | Critic D-C01（HIGH/BLOCKER）+ Domain Expert D-01（HIGH） | Critic 优先，结论一致：统一字段名 |
| 归档操作原子性 | Tech Lead D-06（MEDIUM）+ UX Director D-02（HIGH）+ Critic D-C07（MEDIUM） | Tech Lead 方案（write-to-tmp-then-rename）为技术实现；UX Director 和 Critic 的关注已包含在内 |
| T3 v1/v2 分拆 | Product Director D-01（HIGH）+ Critic D-C06（MEDIUM）+ UX Director D-09（MEDIUM） | Product Director 战略层决定分拆；Critic 和 UX 的相关要求分别在各自任务约束中体现 |

---

## 2. 范围变更

### 移除（相比草稿 v0.2）

- T4 从 MVP（P0）移除，降为 P1-Should Have，延期至 v1.1（须 POC 验证 30 秒预算）
- T3-v2（MiniSearch）从 MVP 移除，延期至 v1.1，触发条件：知识库 > 200 条
- `stop_hook_active` 守卫描述从 T4 规格中移除
- 反思滚动窗口从"20 条"修正为"10 条"

### 新增（相比草稿 v0.2）

- T1 手动触发入口：`--archive-queue` 参数（解除与 ax-evolve 强耦合）
- 归档文件增长监控：> 5000 行时 warning
- T1/T2 文件锁机制（`.archive.lock`）
- T1/T2 归档时用户输出摘要
- T4 约束：processing 中间状态（三步原子化）
- T4 约束：`.evolve.lock` 并发互斥
- T4 约束：超时后 processing 状态回滚至 pending
- T3-v1 查询结果统计（显示 X/Y 条）
- T3-v2 约束（预留）：k-034 正则转义、降级通知、YAML 宽松解析

### 修正（相比草稿 v0.2）

- T2 滚动窗口：20 条 → 10 条（行数估算修正）
- T4 字段名：`auto_evolve: true` → `auto_evolve_done: true`（两处统一）
- T3 验收标准：v1 和 v2 分别定义独立验收标准，不再混用
- Token 降幅估算：改为"典型场景/最优场景"区间，移除单一乐观值
- 实现顺序：T2 → T3-v1 → T1 → T4(POC) → T3-v2（延期）

---

## 3. 放弃项（未采纳的建议）

| 来源 | 建议内容 | 放弃原因 |
|------|---------|---------|
| UX Director D-05 | 新增 `/ax-archive --dry-run` 命令 | 延期至 v1.1，MVP 阶段一次性清理可人工确认 |
| UX Director D-06 | 调整保留规则为"最近一批 + 最近 N 天" | 复杂度超出 MVP，10 条固定窗口更简单可预测 |
| UX Director D-07 | 文件头部维护元数据注释 | 延期至 v1.1，用户反馈后评估 |
| UX Director D-12 | 跨主文件+归档的联合查询 | 延期至 v2 |
| Product Director D-04 | 补充业务层 KPI（处理速度不退化等） | 延期补充；MVP 以技术指标为主要验收依据 |
| Product Director D-08 | 精确 Title 去重守卫（知识库写入时） | 延期至 v1.1，非阻断需求 |
| Domain Expert D-03 | Token 降幅改为三值区间 | 已在 Rough PRD 5.1 节以注释形式补充说明，不改变核心验收标准 |
| Domain Expert D-07 | 引入 knowledge_type 区分 evergreen vs temporal | 延期至 v2（与时间衰减一同）；MVP 无 MiniSearch |
| Tech Lead D-09 | 单元测试覆盖率要求补充到验收标准 | 已在实现约束中补充，但未细化到行级覆盖率数字（工程实现时决定） |

---

## 4. 不确定性记录

| 不确定性 | 影响 | 解决时机 |
|---------|------|---------|
| T4 30 秒预算实测结果 | 若实测超时，T4 需要更激进的批量限制（1 条而非 3 条） | v1.1 POC 阶段 |
| T2 空条目数量（当前是否为零） | 若确认为零，T2 的一次性清理步骤可简化为仅建立滚动窗口机制 | 实现前实测验证 |
| T3-v2 knowledge_base 迁移工作量 | content 仅含 Title+Category 时检索价值有限，可能需要后续补充实体内容 | v1.1 实现时决策 |
