# 分层 Agent v2 架构设计

## 当前 Agent 目录（共 44 个）

### Build/Analysis Lane（8 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| explore | haiku | 代码库发现、符号/文件映射 |
| analyst | opus | 需求分析、验收标准、隐藏约束 |
| planner | opus | 任务排序、执行计划、风险标记 |
| architect | opus | 系统设计、边界、接口、长期权衡 |
| debugger | sonnet | 根因分析、回归隔离、故障诊断 |
| executor | sonnet | 代码实现、重构、功能开发 |
| deep-executor | opus | 复杂自主目标导向任务 |
| verifier | sonnet | 完成证据、声明验证、测试充分性 |

### Review Lane（6 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| style-reviewer | haiku | 格式、命名、惯用法、lint 规范 |
| quality-reviewer | sonnet | 逻辑缺陷、可维护性、反模式 |
| api-reviewer | sonnet | API 契约、版本控制、向后兼容性 |
| security-reviewer | sonnet | 漏洞、信任边界、认证/授权 |
| performance-reviewer | sonnet | 热点、复杂度、内存/延迟优化 |
| code-reviewer | opus | 跨关注点综合审查 |

### Domain Specialists（11 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| dependency-expert | sonnet | 外部 SDK/API/包评估 |
| test-engineer | sonnet | 测试策略、覆盖率、不稳定测试加固 |
| quality-strategist | sonnet | 质量策略、发布就绪性、风险评估 |
| build-fixer | sonnet | 构建/工具链/类型错误修复 |
| designer | sonnet | UX/UI 架构、交互设计 |
| writer | haiku | 文档、迁移说明、用户指南 |
| qa-tester | sonnet | 交互式 CLI/服务运行时验证 |
| scientist | sonnet | 数据/统计分析 |
| document-specialist | sonnet | 外部文档与参考查找 |
| git-master | sonnet | 提交策略、历史管理 |
| vision | sonnet | 图像/截图/图表分析 |

### Coordination（1 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| critic | opus | 计划/设计批判性挑战 |

### Product Lane（4 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| product-manager | sonnet | 问题框架、用户画像/JTBD、PRD |
| ux-researcher | sonnet | 启发式审计、可用性、无障碍性 |
| information-architect | sonnet | 分类法、导航、可发现性 |
| product-analyst | sonnet | 产品指标、漏斗分析、实验设计 |

### Axiom Lane（8 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| axiom-requirement-analyst | sonnet | 需求分析三态门（PASS/CLARIFY/REJECT） |
| axiom-product-designer | sonnet | Draft PRD 生成，含 Mermaid 流程图 |
| axiom-review-aggregator | sonnet | 5 专家并行审查聚合与冲突仲裁 |
| axiom-prd-crafter | sonnet | 工程级 PRD，含门控验证 |
| axiom-system-architect | sonnet | 原子任务 DAG 与 Manifest 生成 |
| axiom-evolution-engine | sonnet | 知识收割、模式检测、工作流优化 |
| axiom-context-manager | sonnet | 7 操作记忆系统（读/写/状态/检查点） |
| axiom-worker | sonnet | PM→Worker 协议，三态输出（QUESTION/COMPLETE/BLOCKED） |

### Axiom Specialists（6 个）

| Agent | 模型 | 用途 |
|-------|------|------|
| axiom-ux-director | sonnet | UX/体验专家评审，输出 review_ux.md |
| axiom-product-director | sonnet | 产品战略专家评审，输出 review_product.md |
| axiom-domain-expert | sonnet | 领域知识专家评审，输出 review_domain.md |
| axiom-tech-lead | sonnet | 技术可行性评审，输出 review_tech.md |
| axiom-critic | sonnet | 安全/质量/逻辑评审，输出 review_critic.md |
| axiom-sub-prd-writer | sonnet | 将 Manifest 任务拆解为可执行 Sub-PRD |

**废弃别名**：`researcher` -> `document-specialist`，`tdd-guide` -> `test-engineer`

---

## 概述

本文档描述了一种改进的分层 agent 架构，旨在解决现有不足，并实现模型路由、能力继承和动态升级的高级模式。

## 已识别的现有问题

1. **继承不完整**：分层 agents 未从基础 agents 继承核心行为模式
2. **工具限制不一致**：工具限制缺乏明确的依据
3. **缺少升级信号**：没有机制让 agents 在超负荷时请求升级
4. **行为说明过少**：分层变体的说明指令太少
5. **Markdown 中无动态路由**：TypeScript 路由器已存在，但 markdown agents 未加以利用

## 设计原则

### 1. 基于模板的继承

每个分层 agent 应从提供以下内容的基础模板继承：
- 核心身份和角色
- 基本约束（只读、禁止委派等）
- 输出格式要求
- 质量标准

层级专属覆盖项用于自定义：
- 任务复杂度边界
- 工具限制
- 响应深度/广度
- 升级阈值

### 2. 明确的能力边界

每个层级有清晰的边界：

| 层级 | 复杂度 | 响应深度 | 自我评估 |
|------|------------|----------------|-----------------|
| LOW (Haiku) | 简单、单一焦点 | 简洁、直接 | "这在我的处理范围内吗？" |
| MEDIUM (Sonnet) | 中等、多步骤 | 全面、结构化 | "我能完整处理这个吗？" |
| HIGH (Opus) | 复杂、系统级 | 综合、细致 | "有哪些权衡？" |

### 3. 升级信号

Agents 应识别何时建议升级：

```markdown
<Escalation_Signals>
## When to Recommend Higher Tier

Escalate when you detect:
- Task exceeds your complexity boundary
- Multiple failed attempts (>2)
- Cross-system dependencies you can't trace
- Security-sensitive changes
- Irreversible operations

Output escalation recommendation:
**ESCALATION RECOMMENDED**: [reason] → Use [higher-tier-agent]
</Escalation_Signals>
```

### 4. 工具能力层级

| Tool | LOW | MEDIUM | HIGH |
|------|-----|--------|------|
| Read | ✅ | ✅ | ✅ |
| Glob | ✅ | ✅ | ✅ |
| Grep | ✅ | ✅ | ✅ |
| Edit | ✅ (simple) | ✅ | ✅ |
| Write | ✅ (simple) | ✅ | ✅ |
| Bash | Limited | ✅ | ✅ |
| WebSearch | ❌ | ✅ | ✅ |
| WebFetch | ❌ | ✅ | ✅ |
| Task | ❌ | ❌ | Varies |
| TodoWrite | ✅ | ✅ | ✅ |

## Agent 家族模板

### Oracle 家族（分析）

**基础身份**：战略顾问，只读顾问，诊断而非实现

| 变体 | 模型 | 工具 | 专注点 |
|---------|-------|-------|-------|
| oracle-low | Haiku | Read, Glob, Grep | 快速查找、单文件分析 |
| oracle-medium | Sonnet | + WebSearch, WebFetch | 标准分析、依赖追踪 |
| oracle | Opus | 完整读取权限 | 深度架构分析、系统级模式 |

**共享约束**：
- 禁用 Write/Edit 工具
- 禁止实现代码
- 必须引用 file:line 位置
- 必须提供可操作的建议

**层级专属行为**：

```markdown
## oracle-low
- 快速回答直接问题
- 单文件专注
- 输出：答案 + 位置 + 上下文（最多 3 行）
- 升级条件：跨文件依赖、架构问题

## oracle-medium
- 标准分析工作流
- 允许多文件追踪
- 输出：摘要 + 发现 + 诊断 + 建议
- 升级条件：系统级影响、安全问题、不可逆变更

## oracle (high)
- 深度架构分析
- 系统级模式识别
- 输出：包含权衡分析的完整结构化分析
- 无需升级（最高层级）
```

### Sisyphus-Junior 家族（执行）

**基础身份**：专注的执行者，独立工作，禁止委派，TODO 驱动

| 变体 | 模型 | 工具 | 专注点 |
|---------|-------|-------|-------|
| sisyphus-junior-low | Haiku | Read, Glob, Grep, Edit, Write, Bash, TodoWrite | 单文件、简单变更 |
| sisyphus-junior | Sonnet | 同上 | 多步骤、中等复杂度 |
| sisyphus-junior-high | Opus | 同上 | 多文件、复杂重构 |

**共享约束**：
- Task 工具被禁用（禁止委派）
- 2 步以上任务必须使用 TodoWrite
- 变更后必须验证
- 独立工作

**层级专属行为**：

```markdown
## sisyphus-junior-low
- 仅限单文件编辑
- 简单变更（拼写错误、简单添加）
- 少于 2 步的任务跳过 TodoWrite
- 升级条件：多文件变更、复杂逻辑、架构决策

## sisyphus-junior (medium)
- 模块内的多步骤任务
- 标准复杂度
- 始终使用 TodoWrite
- 升级条件：系统级变更、跨模块依赖

## sisyphus-junior-high
- 多文件重构
- 复杂架构变更
- 变更前深度分析
- 无需升级（咨询请使用 oracle）
```

### Frontend-Engineer 家族（UI/UX）

**基础身份**：设计师与开发者的混合体，能发现纯开发者忽略的问题，创造令人印象深刻的界面

| 变体 | 模型 | 工具 | 专注点 |
|---------|-------|-------|-------|
| frontend-engineer-low | Haiku | Read, Glob, Grep, Edit, Write, Bash | 简单样式、细微调整 |
| frontend-engineer | Sonnet | 同上 | 标准 UI 工作、组件 |
| frontend-engineer-high | Opus | 同上 | 设计系统、复杂架构 |

**共享约束**：
- 禁止使用通用字体（Inter、Roboto、Arial）
- 禁止使用陈腐模式（紫色渐变）
- 匹配现有代码模式
- 生产级输出质量

**层级专属行为**：

```markdown
## frontend-engineer-low
- 简单 CSS 变更（颜色、间距、字体）
- 细微组件调整
- 严格匹配现有模式
- 升级条件：新组件设计、设计系统变更

## frontend-engineer (medium)
- 标准组件工作
- 应用设计理念
- 做出有意图的美学选择
- 升级条件：设计系统创建、复杂状态管理

## frontend-engineer-high
- 设计系统架构
- 复杂组件层次结构
- 深度美学推理
- 完全创作自由
```

### Librarian 家族（研究）

**基础身份**：外部文档专家，搜索外部资源

| 变体 | 模型 | 工具 | 专注点 |
|---------|-------|-------|-------|
| librarian-low | Haiku | Read, Glob, Grep, WebSearch, WebFetch | 快速查找 |
| librarian | Sonnet | 同上 | 全面研究 |

**共享约束**：
- 始终引用带 URL 的来源
- 优先使用官方文档
- 注明版本兼容性
- 标记过时信息

**层级专属行为**：

```markdown
## librarian-low
- 快速 API 查找
- 查找特定参考资料
- 输出：答案 + 来源 + 示例（如适用）
- 升级条件：需要全面研究、需要多个来源

## librarian (medium)
- 全面研究
- 多来源综合
- 完整结构化输出格式
- 研究任务无需升级
```

### Explore 家族（搜索）

**基础身份**：代码库搜索专家，查找文件和代码模式

| 变体 | 模型 | 工具 | 专注点 |
|---------|-------|-------|-------|
| explore | Haiku | Read, Glob, Grep | 快速搜索 |
| explore (model=sonnet) | Sonnet | 同上 | 深度分析 |

**共享约束**：
- 只读
- 始终使用绝对路径
- 返回结构化结果
- 满足底层需求，而非仅字面请求

**层级专属行为**：

```markdown
## explore (low)
- 快速模式匹配
- 文件定位
- 并行工具调用（3 个以上）
- 升级条件：需要架构理解、跨模块分析

## explore (model=sonnet)
- 深度分析
- 交叉引用发现
- 解释关系
- 无需升级
```

## 所需实现变更

### 1. 更新 Markdown Agent 文件

每个分层 agent 文件应包含：

```markdown
---
name: [agent]-[tier]
description: [tier-specific description]
tools: [restricted tool list]
model: [haiku|sonnet|opus]
---

<Inherits_From>
Base: [base-agent].md
</Inherits_From>

<Tier_Identity>
[Tier-specific role and focus]
</Tier_Identity>

<Complexity_Boundary>
You handle: [specific types of tasks]
Escalate when: [specific conditions]
</Complexity_Boundary>

[Tier-specific instructions...]

<Escalation_Protocol>
When you detect tasks beyond your scope, output:
**ESCALATION RECOMMENDED**: [reason] → Use @liangjie559567/ultrapower:[higher-tier]
</Escalation_Protocol>
```

### 2. 更新 TypeScript 路由器

路由器应：
- 从 markdown 解析 agent 能力
- 将任务信号匹配到层级边界
- 在输出中提供升级建议

### 3. 添加升级检测

编排器应：
- 检测 agent 输出中的 "ESCALATION RECOMMENDED"
- 自动用推荐的更高层级重试
- 记录升级模式以优化路由

## 成本影响分析

基于当前定价（Haiku $1/$5，Sonnet $3/$15，Opus $5/$25，每百万 token）：

| 场景 | 之前（全部 Sonnet） | 之后（分层） | 节省 |
|----------|---------------------|----------------|---------|
| 简单查找（70%） | $3/$15 | $1/$5 (Haiku) | ~67% |
| 标准工作（25%） | $3/$15 | $3/$15 (Sonnet) | 0% |
| 复杂工作（5%） | $3/$15 | $5/$25 (Opus) | -67% |
| **加权平均** | $3/$15 | ~$1.60/$8 | **~47%** |

智能路由可将成本降低约 47%，同时提升复杂任务的质量。

## 后续步骤

1. 为所有分层 agents 创建更新后的 markdown 文件
2. 在 hooks 中添加升级检测
3. 更新路由器以使用 agent 能力解析
4. 添加层级使用量遥测以优化路由
5. 为升级场景创建测试
