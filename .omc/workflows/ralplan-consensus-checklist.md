# Ralplan 共识流程检查清单

## 概述

Ralplan (`/plan --consensus`) 是多专家共识规划流程，适用于大型重构、架构变更等高风险任务。

**核心流程**: Planner → Architect/Critic 并行评审 → 修订计划 → 达成共识

## 执行步骤

### 1. 初始规划 (Planner)

```bash
# 触发 Ralplan
/ultrapower:ralplan "重构 hook 系统以支持异步执行"
```

**Planner 输出**:
- 任务分解
- 执行顺序
- 风险评估
- 资源估算

### 2. 并行评审

#### Architect 评审焦点
- [ ] 系统边界是否清晰
- [ ] 接口设计是否合理
- [ ] 扩展性考虑是否充分
- [ ] 技术债务处理策略
- [ ] 长期维护成本

#### Critic 评审焦点
- [ ] 计划假设是否成立
- [ ] 风险评估是否完整
- [ ] 回滚策略是否可行
- [ ] 边界条件是否覆盖
- [ ] 资源估算是否现实

### 3. 修订计划

根据评审反馈，Planner 修订计划：

```markdown
## 修订记录

### Round 1
- Architect 建议: 拆分 hook 注册和执行逻辑
- Critic 质疑: 异步执行可能导致状态竞争
- 修订: 添加状态锁机制，分阶段迁移

### Round 2
- Architect 确认: 接口设计合理
- Critic 确认: 风险可控
- 状态: **共识达成**
```

### 4. 共识标准

满足以下条件视为达成共识：

- [ ] Architect 无重大架构异议
- [ ] Critic 无阻塞性风险
- [ ] 计划包含回滚策略
- [ ] 所有评审意见已记录
- [ ] 修订后的计划已更新

## 适用场景

| 场景 | 优先级 | 说明 |
|------|--------|------|
| 架构重构 | P0 | 影响多个模块的结构性变更 |
| API 破坏性变更 | P0 | 需要评估兼容性影响 |
| 性能优化 | P1 | 涉及算法或数据结构调整 |
| 安全加固 | P0 | 需要多角度审查 |

## 流程模板

```markdown
# Ralplan: [任务名称]

## 初始计划 (Planner)
- 目标: ...
- 范围: ...
- 步骤: ...
- 风险: ...

## Architect 评审
- 架构影响: ...
- 建议: ...
- 状态: [APPROVED/NEEDS_REVISION]

## Critic 评审
- 风险分析: ...
- 质疑点: ...
- 状态: [APPROVED/NEEDS_REVISION]

## 修订计划 (Round N)
- 变更: ...
- 理由: ...

## 共识状态
- [ ] Architect 批准
- [ ] Critic 批准
- [ ] 回滚策略已定义
- 最终状态: [CONSENSUS_REACHED/IN_PROGRESS]
```

## 验证检查清单

执行前验证：
- [ ] 计划已通过 Architect 和 Critic 评审
- [ ] 所有评审意见已处理
- [ ] 回滚策略已测试
- [ ] 影响范围已明确
- [ ] 团队已知晓变更

执行中监控：
- [ ] 按计划步骤执行
- [ ] 偏差及时记录
- [ ] 阻塞问题升级

执行后复盘：
- [ ] 实际执行与计划对比
- [ ] 经验教训记录
- [ ] 流程改进建议

## 快速启动

```bash
# 1. 启动 Ralplan
/ultrapower:ralplan "描述你的大型任务"

# 2. 等待三方评审完成

# 3. 检查共识状态
cat .omc/plans/ralplan-*.md | grep "共识状态"

# 4. 共识达成后执行
/ultrapower:team "按照 Ralplan 执行重构"
```

## 参考

- 知识库: K004 (Ralplan 共识流程)
- 相关文档: `docs/standards/state-machine.md`
- Skill 定义: `src/features/builtin-skills/skills.ts` (ralplan)
