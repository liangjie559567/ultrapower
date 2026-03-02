# Draft PRD：三方向高价值开发规划

**生成时间**：2026-01-21
**状态**：待用户确认
**来源**：ax-draft 工作流（并行研究 + 架构分析）

---

## 方向一：Axiom 进化引擎完整化

### 背景与问题

当前 Axiom 进化引擎（ax-evolve）已具备基础的学习队列处理和知识入库能力，但存在以下缺口：

1. **Pattern Promotion Pipeline 缺失**：模式库中 P-002~P-012 长期停留在 `pending`，无自动晋升机制
2. **跨会话知识孤岛**：知识库仅在单项目内有效，无法跨项目复用
3. **进化触发被动**：仅在 ax-reflect 后手动触发，缺乏自动化触发点
4. **可视化缺失**：无 Axiom Dashboard，用户无法直观了解知识积累状态

### 目标

构建完整的 Axiom 进化引擎闭环：自动模式晋升 → 跨项目知识迁移 → 进化触发自动化 → Dashboard 可视化。

### 核心功能

#### F1：Pattern Promotion Pipeline（自动模式晋升）
- 扫描 pattern_library.md，统计各模式在代码库中的实际出现次数
- 出现次数 ≥ 3 且置信度 ≥ 0.9 → 自动从 `pending` 晋升为 `active`
- 晋升事件写入 reflection_log.md + 触发 LQ 入队

#### F2：跨项目知识迁移
- `ax-export --template` 导出可移植知识包（knowledge_base + pattern_library）
- `ax-import <path>` 导入外部知识包，合并去重
- 知识条目携带 `source_project` 字段，支持溯源

#### F3：进化触发自动化
- PostToolUse hook：检测 `ax-implement` 完成事件 → 自动触发 ax-evolve
- 阈值触发：learning_queue.md 中 P0/P1 条目 ≥ 5 → 自动触发
- 定时触发：会话结束时（session-end hook）自动处理 P0 条目

#### F4：Axiom Dashboard（ax-status 增强）
- 知识库增长曲线（按 cycle 统计）
- 模式晋升历史时间线
- 学习队列健康度（P0/P1/P2/P3 分布）
- 工作流成功率趋势

### 技术方案

```
src/hooks/axiom-boot/
  └── pattern-scanner.ts      # 扫描代码库统计模式出现次数
src/lib/
  └── knowledge-transfer.ts   # 跨项目知识导入/导出
src/hooks/
  └── axiom-auto-evolve/      # 自动触发 ax-evolve 的 hook
skills/ax-status/SKILL.md     # 增强 Dashboard 输出
```

### 验收标准

- [ ] `npm run test:run` 全部通过，新增测试覆盖 pattern-scanner 和 knowledge-transfer
- [ ] `ax-evolve` 执行后，符合条件的 pending 模式自动晋升
- [ ] `ax-export --template` 生成可移植 zip，`ax-import` 成功合并
- [ ] `ax-status` 输出包含知识库增长曲线和队列健康度

### 复杂度评估

- 开发量：中（~8 个原子任务）
- 风险：低（纯新增，不修改现有核心逻辑）
- 价值：高（完善现有系统，提升长期知识积累效率）

---

## 方向二：Agent 可观测性平台

### 背景与问题

ultrapower 已有 `trace` skill 和 `trace_timeline`/`trace_summary` 工具，但：

1. **结构化追踪缺失**：当前 trace 是文本日志，无 span/trace 层级结构
2. **Token 成本不透明**：无法按 agent/skill/会话聚合 token 消耗
3. **跨会话分析缺失**：性能趋势无法跨会话持久化
4. **无告警机制**：token 超限、agent 超时无主动通知

### 目标

构建结构化的 Agent 可观测性平台，参考 Langfuse OpenTelemetry 标准，实现 trace/span 追踪、token 成本聚合和跨会话性能分析。

### 核心功能

#### F1：结构化 Trace/Span 追踪
- 每次 agent 调用生成 `traceId` + `spanId`（UUID）
- Span 携带：agent_type、model、duration_ms、input_tokens、output_tokens、status
- 父子关系：orchestrator → subagent 形成 span 树
- 持久化到 `.omc/traces/{date}/{traceId}.json`

#### F2：Token 成本聚合
- 按 agent_type 聚合：每个 agent 类型的平均/总 token 消耗
- 按 skill 聚合：每个 skill 执行的 token 成本
- 按会话聚合：每次会话的总成本（Haiku/Sonnet/Opus 分别计价）
- 成本报告：`ax-status --cost` 输出成本摘要

#### F3：跨会话性能趋势
- SQLite 存储历史 trace 数据（`.omc/traces/metrics.db`）
- 查询接口：`trace_summary --since 7d`、`trace_summary --agent executor`
- 性能指标：P50/P95 延迟、成功率、平均 token/call

#### F4：告警与阈值
- Token 预算告警：单次调用超过阈值（可配置）时输出警告
- Agent 超时检测：span duration > 配置阈值时标记为 slow
- 成本日报：会话结束时输出当日成本摘要

### 技术方案

```
src/lib/
  └── tracer.ts               # Trace/Span 生成和持久化
  └── cost-aggregator.ts      # Token 成本聚合计算
src/tools/trace/
  └── trace-query.ts          # 跨会话查询接口
src/hooks/
  └── trace-collector/        # PostToolUse hook 收集 span 数据
```

### 验收标准

- [ ] 每次 agent 调用生成结构化 span，写入 `.omc/traces/`
- [ ] `ax-status --cost` 输出按 agent/skill 分类的 token 成本
- [ ] `trace_summary --since 7d` 返回跨会话性能趋势
- [ ] 单次调用超过 token 阈值时输出告警

### 复杂度评估

- 开发量：中高（~10 个原子任务）
- 风险：中（需要 hook 集成，可能影响性能）
- 价值：高（解决 token 成本黑盒问题，提升用户信任）

---

## 方向三：Plugin 生态系统完善

### 背景与问题

当前 ultrapower 插件系统（plugin-registry.ts）已支持基础安装/更新，但：

1. **Plugin Marketplace 缺失**：无法浏览/搜索第三方插件
2. **依赖解析缺失**：插件间依赖关系无自动解析
3. **沙箱验证缺失**：第三方插件无安全验证机制
4. **版本回滚缺失**：插件更新失败后无法自动回滚

### 目标

构建完整的 Plugin 生态系统：Marketplace 浏览 → 依赖自动解析 → 沙箱安全验证 → 版本回滚保障。

### 核心功能

#### F1：Plugin Marketplace
- `omc plugin search <keyword>` 搜索 marketplace.json 中的插件
- `omc plugin info <name>` 查看插件详情（描述、版本、依赖、评分）
- `omc plugin list --installed` 列出已安装插件及版本状态
- marketplace.json 支持 `tags`、`rating`、`downloads` 字段

#### F2：依赖自动解析
- 插件 plugin.json 支持 `dependencies` 字段（其他插件名+版本范围）
- 安装时自动解析依赖树，按拓扑顺序安装
- 冲突检测：版本不兼容时提示用户选择

#### F3：沙箱安全验证
- 安装前校验插件 checksum（SHA-256）
- 扫描插件 hooks 中的危险命令模式（rm -rf、curl | sh 等）
- 可疑插件标记为 `unverified`，安装时需用户二次确认

#### F4：版本回滚
- 安装/更新前自动备份当前版本到 `.claude/plugins/backup/`
- `omc plugin rollback <name>` 回滚到上一个版本
- 更新失败时自动触发回滚，输出回滚报告

### 技术方案

```
src/lib/
  └── plugin-marketplace.ts   # Marketplace 搜索和浏览
  └── plugin-dependency.ts    # 依赖解析（拓扑排序）
  └── plugin-sandbox.ts       # 安全验证（checksum + 危险模式扫描）
  └── plugin-rollback.ts      # 版本备份和回滚
src/__tests__/
  └── plugin-marketplace.test.ts
  └── plugin-dependency.test.ts
```

### 验收标准

- [ ] `omc plugin search` 返回匹配插件列表
- [ ] 安装带依赖的插件时自动安装依赖
- [ ] checksum 不匹配的插件安装被拒绝
- [ ] `omc plugin rollback` 成功恢复上一版本

### 复杂度评估

- 开发量：中高（~12 个原子任务）
- 风险：中（涉及文件系统操作，需充分测试）
- 价值：高（扩展生态，降低第三方插件风险）

---

## 综合建议

| 方向 | 价值 | 复杂度 | 推荐优先级 |
|------|------|--------|-----------|
| 方向1：Axiom 进化引擎完整化 | ★★★★★ | 低 | **P0（立即执行）** |
| 方向2：Agent 可观测性平台 | ★★★★☆ | 中高 | P1（下一迭代）|
| 方向3：Plugin 生态系统完善 | ★★★★☆ | 中高 | P1（下一迭代）|

**推荐执行顺序**：方向1 → 方向2 → 方向3（串行），或方向2+3 并行（需要两个独立 worktree）。

---

## User Gate

**请确认：是否批准以上 Draft PRD 进入下一阶段？**

选项：
- **A. 全部批准** → 进入 `/ax-review`（5专家并行评审）
- **B. 仅批准方向1** → 方向1 进入 `/ax-review`，2+3 暂缓
- **C. 调整后批准** → 请说明需要调整的内容
- **D. 取消** → 返回 IDLE
