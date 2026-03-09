# Rough PRD：三方向高价值开发规划

**版本**：v1.0（经专家评审仲裁）
**日期**：2026-03-02
**状态**：待用户确认

---

## 1. 执行范围（仲裁后最终范围）

### 方向1：Axiom 进化引擎完整化（P0）

**范围**：全量实现

* F1：知识单元结构化 Schema（含 namespace 字段）

* F2：跨项目知识导入（用户确认 + namespace 隔离）

* F3：模式置信度衰减机制

* F4：进化引擎自动触发优化

**排除**：无

---

### 方向3：Plugin 生态系统完善（P1）

**范围**：安全优先，Marketplace 条件触发

* F3：Plugin 安全验证（静态分析 + 运行时权限限制 + 递归依赖扫描）

* F4：版本回滚机制

* F2：依赖解析增强

* F1：Marketplace（条件触发：需 ≥5 个第三方插件时才启动）

**沙箱技术选型**：需先完成 POC（isolated-vm vs Worker Threads vs Deno），POC 结果决定 F3 实现方案。

---

### 方向2：Agent 可观测性平台（P2，POC 门控）

**范围**：POC 验证后仅实现轻量版

* POC（1天）：验证 token 数据可从 hook 上下文获取

* F2（POC通过后）：Token 成本聚合（会话级 + 日报）

* F3（轻量版）：跨会话趋势（仅统计，无可视化）

* F1/F4：降级 backlog

**硬性约束**：POC 未通过则方向2整体推迟。

---

## 2. 差异点最终决策

| ID | 差异点 | 仲裁层级 | 最终决策 |
| ---- | -------- | --------- | --------- |
| D-TL-01 | Token 数据不可直接获取 | 技术可行性（P2） | POC 验证，未通过则方向2推迟 |
| D-PD-01 | 方向2功能蔓延 | 战略对齐（P3） | 仅 F2+F3轻量版，F1/F4 backlog |
| D-PD-02 | Marketplace 冷启动陷阱 | 战略对齐（P3） | F1 条件触发（≥5个第三方插件） |
| D-DE-01 | 知识单元缺乏原子化 | 业务价值（P4） | 迁移为结构化 Schema，含 namespace |
| D-CR-01 | 跨项目知识污染风险 | 安全性（P1） | 导入确认 + namespace 隔离（与 D-DE-01 合并） |
| D-DE-02 | 沙箱技术选型空白 | 技术可行性（P2） | POC 先行，选型后实现 F3 |
| D-CR-02 | Plugin 沙箱验证可绕过 | 安全性（P1） | 静态分析 + 运行时权限双重防护 |
| D-CR-03 | 依赖链未纳入安全审查 | 安全性（P1） | 递归扫描依赖树 |
| D-TL-02 | trace-collector 同步写延迟 | 技术可行性（P2） | 异步写入队列（如方向2启动） |
| D-UX-01 | 模式晋升无感知 | 用户体验（P5） | ax-status 输出晋升通知 + 可选 hook |
| D-UX-02 | trace 噪音 | 用户体验（P5） | 默认隐藏，--verbose 时显示 |
| D-UX-03 | 告警打断输出流 | 用户体验（P5） | 会话结束后汇总告警 |
| D-DE-03 | Trace Context 传播缺失 | 业务价值（P4） | hook 输入注入 `_omc_trace_id`（方向2启动时实现） |

---

## 3. 执行顺序

### 阶段一：方向1（3-4天）

1. 设计知识单元 JSON Schema（含 id/title/content/tags/confidence/source_project/namespace）
2. 迁移现有 knowledge_base.md → 结构化格式
3. 实现跨项目导入（用户确认 + namespace 隔离）
4. 实现模式置信度衰减（基于使用频率 + 时间衰减）
5. 进化引擎自动触发优化（IDLE 状态处理 P0/P1 队列）
6. ax-status 增加模式晋升通知输出

### 阶段二：方向3（5-6天）

1. 沙箱技术 POC（isolated-vm vs Worker Threads vs Deno，1天）
2. F3：Plugin 安全验证
   - 静态分析（AST 扫描危险 API）
   - 运行时权限限制（基于 POC 选型）
   - 递归依赖树扫描
1. F4：版本回滚机制（快照 + restore 命令）
2. F2：依赖解析增强（版本锁定 + 冲突检测）
3. F1：Marketplace（条件：第三方插件 ≥5 时启动）

### 阶段三：方向2（1天POC + 5-7天，POC门控）

1. POC：验证 token 数据可获取性（hook 上下文 / 日志解析 / 估算）
2. （POC通过）F2：Token 成本聚合
   - 会话级 token 统计
   - 日报生成（ax-status 集成）
   - 异步写入队列（避免工具调用延迟）
1. （POC通过）F3轻量版：跨会话趋势统计
2. hook 输入注入 `_omc_trace_id` 实现 Trace Context 传播

---

## 4. 风险登记册

| 风险 | 概率 | 影响 | 缓解措施 |
| ------ | ------ | ------ | --------- |
| Token POC 失败（Claude Code 不暴露 token API） | 高 | 方向2整体推迟 | POC 探索日志解析/估算替代方案 |
| 沙箱 POC 性能不达标 | 中 | F3 实现方案变更 | 预留备选方案（Worker Threads 最保守） |
| Marketplace 冷启动（第三方插件不足） | 高 | F1 长期推迟 | 条件触发机制，不阻塞其他功能 |
| 知识库迁移数据丢失 | 低 | 历史知识损失 | 迁移前备份，增量迁移 |
| namespace 隔离实现复杂度超预期 | 中 | 方向1延期 | 先实现简单前缀隔离，后续优化 |

---

## 5. 验收标准

### 方向1

* [ ] knowledge_base.md 完全迁移为结构化 JSON/YAML，每条记录含全部 Schema 字段

* [ ] `ax-knowledge import <file>` 显示确认提示，导入后 namespace 隔离可验证

* [ ] 模式置信度在 30 天未使用后自动衰减（单元测试覆盖）

* [ ] `ax-status` 输出包含最近模式晋升记录

### 方向3

* [ ] 沙箱 POC 报告产出（技术选型决策文档）

* [ ] Plugin 安装时自动执行静态分析，危险 API 调用被拦截

* [ ] 递归依赖扫描覆盖至少 3 层深度

* [ ] `omc plugin rollback <name> <version>` 命令可用且有测试

* [ ] Marketplace 功能在插件数 <5 时不对用户暴露

### 方向2（POC通过后）

* [ ] POC 报告：token 数据获取方案可行性结论

* [ ] `ax-status --cost` 显示当前会话 token 消耗

* [ ] 日报文件生成（`.omc/reports/cost-YYYY-MM-DD.md`）

* [ ] 工具调用 P95 延迟增加 <10ms（异步写入验证）

* [ ] 跨会话趋势：最近 7 天 token 消耗趋势可查询
