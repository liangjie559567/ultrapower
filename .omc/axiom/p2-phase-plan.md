# P2 阶段实施计划

**项目**: ultrapower v5.5.18 中期优化
**时间范围**: 1个月
**状态**: 📋 规划中

---

## 目标概览

基于 P1 阶段建立的基础设施，实现以下中期目标：
1. 反馈循环系统
2. 知识库扩展
3. 推荐引擎权重调整

---

## Phase 1: 反馈循环系统（1-2周）

### 目标

建立自动化反馈机制，根据推荐结果的成功/失败自动调整置信度。

### 交付物

#### 1.1 反馈收集模块

**文件**: `src/features/feedback/collector.ts`

功能：

* 记录推荐引擎的推荐结果

* 追踪用户选择（接受/拒绝）

* 记录任务执行结果（成功/失败）

* 存储到 `.omc/axiom/feedback/feedback_log.jsonl`

数据结构：
```typescript
interface FeedbackEntry {
  timestamp: string;
  recommendationId: string;
  workflow: string;
  confidence: number;
  userAccepted: boolean;
  taskSuccess: boolean | null;
  context: {
    taskCount?: number;
    taskType?: string;
    keywords?: string[];
  };
}
```

#### 1.2 权重调整引擎

**文件**: `src/features/feedback/weight-adjuster.ts`

功能：

* 分析反馈日志

* 计算成功率（成功次数 / 总次数）

* 调整推荐规则的置信度

* 更新 `workflow_recommender.json`

调整规则：

* 成功 → confidence += 0.02（最高0.98）

* 失败 → confidence -= 0.05（最低0.50）

* 连续3次成功 → confidence += 0.05

* 连续2次失败 → 标记为需要审查

#### 1.3 反馈报告生成器

**文件**: `src/features/feedback/report-generator.ts`

功能：

* 生成每周反馈报告

* 统计推荐准确率

* 识别表现最好/最差的推荐规则

* 输出到 `.omc/axiom/feedback/weekly_report_YYYY-MM-DD.md`

### 集成点

* 在 `next-step-router` 中记录推荐和用户选择

* 在任务完成时记录执行结果

* 每周自动生成报告（通过 cron 或手动触发）

---

## Phase 2: 知识库扩展（2-3周）

### 目标

新增 5+ 个最佳实践文档，覆盖更多场景。

### 新增文档列表

#### 2.1 错误处理最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/error_handling.md`

内容：

* 错误分类（语法/运行时/逻辑）

* 自动修复策略

* 重试机制

* 降级方案

#### 2.2 代码审查最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/code_review.md`

内容：

* 审查清单（5个维度）

* 常见问题模式

* 审查优先级

* 反馈模板

#### 2.3 测试策略最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/testing_strategy.md`

内容：

* 测试金字塔

* 单元/集成/E2E 选择

* 测试覆盖率目标

* Mock 策略

#### 2.4 文档同步最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/documentation_sync.md`

内容：

* 代码注释规范

* 文档生成自动化

* 版本同步策略

* 文档审查流程

#### 2.5 依赖管理最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/dependency_management.md`

内容：

* 依赖选择标准

* 版本锁定策略

* 安全漏洞扫描

* 依赖更新流程

#### 2.6 Git 工作流最佳实践

**文件**: `.omc/axiom/knowledge/best_practices/git_workflow.md`

内容：

* 分支策略

* 提交信息规范

* PR 流程

* 冲突解决

### 数据来源

* P0/P1 阶段的实战经验

* 现有代码库的模式分析

* 外部最佳实践参考

---

## Phase 3: 推荐引擎优化（1周）

### 目标

基于反馈数据，优化推荐引擎的准确性。

### 优化内容

#### 3.1 权重调整

根据 Phase 1 收集的反馈数据：

* 调整现有3个推荐规则的置信度

* 识别并移除低效规则（成功率<60%）

* 添加新的推荐规则（基于高频场景）

#### 3.2 上下文分析增强

**文件**: `src/features/workflow-recommender/context-analyzer.ts`

新增分析维度：

* 文件类型分布（.ts/.test.ts/.md）

* 变更范围（单文件/多文件/跨模块）

* 历史成功率（该类型任务的历史表现）

#### 3.3 推荐规则扩展

新增推荐规则：

* 重构任务 → architect + quality-reviewer

* 文档更新 → writer + doc-sync tool

* 依赖升级 → dependency-expert + test-engineer

---

## 验收标准

### Phase 1

* [ ] 反馈收集模块可记录推荐和结果

* [ ] 权重调整引擎可自动更新置信度

* [ ] 每周报告可生成并包含准确率统计

### Phase 2

* [ ] 6个新最佳实践文档已创建

* [ ] 每个文档包含实战案例

* [ ] 文档已集成到推荐引擎

### Phase 3

* [ ] 推荐准确率提升至 85%+

* [ ] 新增 3+ 个推荐规则

* [ ] 上下文分析维度增加至 8+

---

## 时间估算

| Phase | 预计工时 | 依赖 |
| ------- | --------- | ------ |
| Phase 1 | 8-12 小时 | 无 |
| Phase 2 | 12-16 小时 | 无 |
| Phase 3 | 4-6 小时 | Phase 1 |
| **总计** | **24-34 小时** | - |

---

## 风险评估

### 高风险

* 反馈数据不足：需要至少 20+ 个样本才能有效调整权重

* 缓解：先使用模拟数据测试，再用真实数据

### 中风险

* 知识库内容质量：新文档可能缺乏实战验证

* 缓解：基于 P0/P1 的真实案例编写

### 低风险

* 推荐引擎性能：规则增加可能影响响应速度

* 缓解：使用索引和缓存优化

---

## 下一步行动

1. **立即执行**：
   - [ ] 用户确认 P2 计划
   - [ ] 创建 Phase 1 任务清单

1. **Phase 1 启动**：
   - [ ] 实现反馈收集模块
   - [ ] 实现权重调整引擎
   - [ ] 集成到 next-step-router

1. **并行执行**：
   - [ ] Phase 2 可与 Phase 1 并行
   - [ ] Phase 3 需等待 Phase 1 完成

---

**生成时间**: 2026-03-05
**生成者**: Claude Sonnet 4.6
**状态**: 待用户确认
