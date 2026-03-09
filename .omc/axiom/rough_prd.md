# Rough PRD: Claude-Codex 双模型协作工作流 v1.0

**状态**: 专家评审通过（平均分 6.9/10）
**创建时间**: 2026-03-08
**评审轮次**: 5 专家并行评审

---

## 1. 问题陈述

### 1.1 当前痛点

ultrapower 插件生成的代码存在严重质量问题：

* ❌ **语法/类型错误**: 无法通过编译

* ❌ **逻辑错误**: 功能不符合预期

* ❌ **代码质量差**: 不符合最佳实践

* ❌ **功能不完整**: 缺少错误处理、边界情况

### 1.2 根本原因

Agent 缺少完整的开发流程：
1. 不分析现有代码实现
2. 不搜索外部最佳实践
3. 不保证功能完整性
4. 不强制 CI 门禁验证

### 1.3 影响范围

* 自主执行模式（autopilot、ralph）

* 特定 agent（executor、deep-executor、designer）

* 复杂需求场景（多文件、架构变更）

* Axiom 工作流（ax-implement）

### 1.4 当前基线（待补充）

* CI 门禁通过率: ___% （需测量）

* 用户满意度: ___/5 （需调研）

* 平均修复时间: ___ 分钟

---

## 2. 解决方案概述

### 2.1 核心理念

**Claude（架构师/评审）+ Codex（执行工程师）双模型协作**

* **Claude**: 需求分析、架构设计、代码评审、测试规划

* **Codex**: 代码实现、文档生成、测试执行

### 2.2 关键改进（基于专家评审）

1. **强制上下文分析**: 先读现有代码再动手
2. **外部最佳实践**: 搜索相关项目对比
3. **功能完整性检查**: 错误处理、边界情况
4. **CI 门禁强制**: 编译/测试/lint 必须通过
5. **代码审查环节**: 生成后自动评审
6. **循环限制**: 最大 5 轮评审，10 次测试
7. **降级策略**: Codex 失败时回退到 Claude
8. **安全加固**: 路径校验 + 输入消毒

---

## 3. 工作流设计

### 3.1 统一入口: `/ccg`

**自动路由逻辑**:
```
用户执行 /ccg
  ↓
检测项目状态
  ├─ 无代码 → 新项目流程
  └─ 有代码 → 老项目流程
```

### 3.2 新项目开发流程

#### Phase 1: 需求阶段 (Claude)

```
[Phase 1/4] Claude 正在分析需求... 📋
输入: 用户需求描述
步骤:
1. 对话澄清需求 → 生成需求文档
2. 搜索网络相关项目 → 对比分析
3. 识别不足 → 功能完善
4. 生成技术实现文档
输出: requirements.md + tech-design.md
```

#### Phase 2: 开发阶段 (Codex)

```
[Phase 2/4] Codex 正在实现代码... 🔨
输入: requirements.md + tech-design.md
步骤:
1. 分解开发周期
2. 按周期逐步实现
3. 生成功能流程文档
输出: 可运行代码 + feature-flow.md
```

#### Phase 3: 评审优化循环 (Claude ↔ Codex)

```
[Phase 3/4] Claude 正在评审（第 X/5 轮）... 🔍
循环限制: 最多 5 轮
每轮:
  Claude: 评估 feature-flow.md vs requirements.md → optimization-list.md
  Codex: 按清单优化 → 更新 feature-flow.md
退出条件:
  - 无优化点
  - 达到 5 轮上限 → 询问用户是否继续
```

#### Phase 4: 测试阶段 (Claude ↔ Codex)

```
[Phase 4/4] 测试验证中... ✅
循环限制: 最多 10 次
每轮:
  Claude: 生成 test-checklist.md
  Codex: 按清单排查 → 输出结果
退出条件:
  - 测试通过
  - 达到 10 次上限 → BLOCKED 状态
```

### 3.3 老项目修改流程

#### Phase 1: 理解阶段 (Codex)

```
[Phase 1/4] Codex 正在分析项目... 📖
输入: 现有项目代码
步骤:
1. 按模块读取（避免 token 溢出）
2. 生成功能流程文档
3. 微服务: 每个服务单独生成 + 依赖图
输出: feature-flow.md + dependency-graph.md
```

#### Phase 2-4: 同新项目流程

---

## 4. 技术实现方案

### 4.1 新增 Skill: `/ccg`

```yaml
触发: 用户启动项目开发
功能:
  - 自动检测项目类型（新/老）
  - 路由到对应工作流
  - 管理文档传递
  - 协调评审循环
  - 实时进度反馈
```

### 4.2 Agent 提示词增强

#### executor/deep-executor 强制步骤

```markdown
1. 读取相关现有代码（使用 Read/Glob/Grep）
2. 使用 external-context 搜索最佳实践
3. 生成完整实现（含错误处理）
4. 运行 CI 门禁: tsc --noEmit && npm run build && npm test
5. 失败则自动修复（最多 3 次）
6. 3 次失败 → BLOCKED 状态
```

#### 自动 code-reviewer 触发

```markdown
触发时机: 代码生成完成后
检查项:
  - 逻辑正确性
  - 功能完整性
  - 最佳实践
  - CI 门禁通过
```

### 4.3 文档驱动机制

#### 标准文档模板

```
.omc/ccg/
├── requirements.md        # 需求文档
├── tech-design.md         # 技术实现文档
├── feature-flow.md        # 功能流程文档
├── optimization-list.md   # 优化清单
├── test-checklist.md      # 测试清单
└── dependency-graph.md    # 依赖图（老项目）
```

#### 文档路径安全校验

```typescript
import { assertValidMode } from './src/lib/validateMode';

const ALLOWED_DOC_TYPES = [
  'requirements', 'tech-design', 'feature-flow',
  'optimization-list', 'test-checklist', 'dependency-graph'
];

function getDocPath(type: string): string {
  if (!ALLOWED_DOC_TYPES.includes(type)) {
    throw new Error(`Invalid doc type: ${type}`);
  }
  return `.omc/ccg/${type}.md`;
}
```

#### 用户输入消毒

```typescript
import { normalizeInput } from './bridge-normalize';

const sanitizedInput = normalizeInput(userInput, {
  allowedFields: ['description', 'features', 'constraints'],
  maxLength: 10000
});
```

### 4.4 降级策略

#### MCP 工具失败处理

```yaml
Codex API 不可用:
  - 降级到 Claude 单模型执行
  - 保留强化的提示词
  - 性能下降但保证可用

Gemini API 不可用:
  - 跳过外部最佳实践搜索
  - 继续执行其他步骤

超时阈值:
  - 单次 MCP 调用 > 30s 触发降级
```

### 4.5 循环控制策略

```yaml
评审循环限制:
  MAX_REVIEW_CYCLES: 5
  行为:
    - 超过 3 轮: 降低优化标准（只修复 P0）
    - 超过 5 轮: 暂停并询问用户是否继续
    - 支持 Ctrl+C 中断并保存状态

测试循环限制:
  MAX_TEST_CYCLES: 10
  CYCLE_TIMEOUT: 10 分钟
  行为:
    - 超过 10 次: BLOCKED 状态
    - 保存现场到 .omc/ccg/recovery/
    - 生成诊断报告
```

---

## 5. 实施计划（MVP 优先）

### 5.1 Phase 1: MVP（Week 1-2）⭐

**目标**: 快速验证核心假设

* [ ] 增强 executor 提示词（强制上下文分析）

* [ ] 实现 CI 门禁强制验证

* [ ] 实现自动修复机制（最多 3 次）

* [ ] 测试目标: CI 通过率提升到 80%

### 5.2 Phase 2: 新项目流程（Week 3-6）

* [ ] 创建 `/ccg` skill 框架

* [ ] 实现文档模板系统

* [ ] 实现 Phase 1-4 完整流程

* [ ] 集成 external-context 搜索

* [ ] 增加实时进度反馈

### 5.3 Phase 3: 老项目流程（Week 7-10）

* [ ] 实现按模块读取策略

* [ ] 实现依赖图生成

* [ ] 微服务支持

* [ ] 用户验收测试

### 5.4 Phase 4: 优化迭代（Week 11-12）

* [ ] 性能优化

* [ ] 降级策略完善

* [ ] 文档版本控制

* [ ] 并发冲突处理

---

## 6. 验收标准

### 6.1 MVP 阶段（Week 2）

* ✅ CI 门禁通过率 > 80%

* ✅ 语法/类型错误率 < 10%

* ✅ 自动修复成功率 > 60%

### 6.2 完整版（Week 12）

* ✅ CI 门禁通过率 > 95%

* ✅ 语法/类型错误率 < 5%

* ✅ 逻辑错误率 < 10%

* ✅ 代码审查通过率 > 90%

* ✅ 用户满意度 > 4.5/5

### 6.3 工作流效率

* ✅ 新项目: 需求 → 可运行代码 < 2 小时

* ✅ 老项目: 单模块修改 < 1 小时

* ✅ 评审循环: 平均 < 3 轮收敛

---

## 7. 风险与依赖

### 7.1 技术风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
| ------ | ------ | ------ | --------- |
| Codex API 不可用 | 高 | 高 | 降级到 Claude 单模型 |
| 评审循环不收敛 | 中 | 高 | 限制最大 5 轮 + 用户中断 |
| 大项目 token 溢出 | 中 | 中 | 按模块读取 |
| 文档传递冲突 | 低 | 中 | 文件锁 + 版本控制 |

### 7.2 依赖项

* MCP 工具: `ask_codex`、`ask_gemini`（可选）

* 现有 skills: `external-context`、`code-reviewer`

* CI 环境: `tsc`、`npm`、`test`

---

## 8. 成功指标

### 8.1 短期（1 个月 - MVP）

* 用户报告 BUG 数量减少 30%

* CI 门禁通过率提升到 80%

### 8.2 中期（3 个月 - 完整版）

* 代码质量问题减少 80%

* 用户满意度 > 4.5/5

* 平均修复时间 < 10 分钟

### 8.3 长期（6 个月）

* 成为 ultrapower 默认工作流

* 社区贡献增加 2x

---

## 9. 专家评审结论

### 9.1 评审结果

* **Domain Expert**: 7.5/10 - 符合软件工程最佳实践

* **The Critic**: 6.5/10 - 需修复 P0 安全问题

* **Tech Lead**: 7.0/10 - 技术可行，需降级策略

* **Product Director**: 7.5/10 - 战略对齐，建议 MVP 优先

* **UX Director**: 6.0/10 - 需简化入口和进度反馈

**平均分**: 6.9/10 → **有条件通过**

### 9.2 已采纳的关键建议

1. ✅ 增加循环限制（MAX_REVIEW_CYCLES=5）
2. ✅ 增加降级策略（Codex → Claude）
3. ✅ 修复安全漏洞（路径校验 + 输入消毒）
4. ✅ 简化入口（单一 /ccg 命令）
5. ✅ 增加实时进度反馈
6. ✅ 采用 MVP 优先策略（2 周快速验证）

---

## 10. 附录

### 10.1 相关文档

* `docs/standards/runtime-protection.md` - 安全规范

* `docs/standards/hook-execution-order.md` - Hook 执行顺序

* `docs/standards/agent-lifecycle.md` - Agent 生命周期

* `skills/ccg/SKILL.md`（待创建）

### 10.2 评审文档

* `.omc/axiom/review_domain.md` - Domain Expert 评审

* `.omc/axiom/review_critic.md` - The Critic 评审

* `.omc/axiom/review_tech.md` - Tech Lead 评审

* `.omc/axiom/review_product.md` - Product Director 评审

* `.omc/axiom/review_ux.md` - UX Director 评审

* `.omc/axiom/review_summary.md` - 评审汇总

---

**Rough PRD 版本**: v1.0
**状态**: 专家评审通过，可进入实施阶段
**下一步**: 用户确认后执行 `/ax-decompose` 进行任务拆解
