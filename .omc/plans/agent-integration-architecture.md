# Agent 集成架构设计 - Sprint 0 (PoC)

**项目**: 零代码开发者全流程 AI 辅助系统 (ZeroDev)
**基线**: ultrapower v7.2.0 (49 agents + 71 skills)
**目标**: ultrapower v8.0.0 (54 agents + 5 新 agents)
**文档版本**: v1.0
**创建时间**: 2026-03-18

---

## 1. 架构概览

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户层 (User Layer)                           │
│  CLI: /zerodev:start | /zerodev:clarify | /zerodev:generate    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              ZeroDev 编排层 (Orchestration Layer)                │
│  - 工作流状态机 (.omc/zerodev/state/)                            │
│  - Agent 路由器 (基于 trigger 关键词)                            │
│  - 4 个门禁集成 (Expert/User/CI/Scope Gate)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                5 个新 Agent (ZeroDev Agents)                     │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ requirement-     │  │ code-generator   │  (P0 - Sprint 0)    │
│  │ clarifier        │  │                  │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ tech-selector    │  │ deployment-      │  │ opensource-   │ │
│  │                  │  │ manager          │  │ analyzer      │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                        (P1/P2 - 接口占位符)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           现有 49 Agents (ultrapower v7.2.0 基础设施)            │
│  analyst | planner | executor | architect | verifier | ...     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   共享基础设施 (Shared Infrastructure)            │
│  - 状态管理: .omc/state/ + .omc/zerodev/state/                  │
│  - 代码模板库: .omc/zerodev/code-templates/                      │
│  - 技术栈知识库: .omc/zerodev/tech-stacks/                       │
│  - 项目记忆: .omc/project-memory.json                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 集成策略

**核心原则**: 最小化侵入，最大化复用

1. **继承现有 Agents**: 5 个新 Agent 都继承自现有 agents，复用其能力
2. **独立状态空间**: 使用 `.omc/zerodev/` 目录隔离 ZeroDev 状态
3. **统一注册机制**: 通过 `src/agents/definitions.ts` 统一注册
4. **渐进式实现**: Sprint 0 仅实现 2 个核心 Agent，其他 3 个提供接口占位符

---

## 2. requirement-clarifier Agent（优先级 P0）

### 2.1 集成接口

**注册路径**: `src/agents/definitions.ts`

```typescript
export const requirementClarifierAgent: AgentConfig = {
  name: 'requirement-clarifier',
  description: 'Multi-round dialogue engine for requirement clarification (Sonnet). Extends analyst.',
  prompt: loadAgentPrompt('requirement-clarifier'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

**系统提示词路径**: `agents/requirement-clarifier.md`

**路由规则**:
```typescript
{
  trigger: ['clarify', 'requirements', 'what do you need', 'zerodev:clarify'],
  priority: 'high',
  autoActivate: true  // 在 /zerodev:start 时自动激活
}
```

### 2.2 能力定义

**继承自**: `analyst` agent

**扩展能力**:
- `multiRoundDialogue`: 支持多轮对话（最多 10 轮）
- `contextMemory`: 记忆对话历史和用户偏好
- `platformDetection`: 自动识别 5 种平台类型（Web/Mobile/API/插件/桌面）
- `requirementStructuring`: 将自然语言转化为结构化需求

**工具访问**:
- 允许: Read, Write, Bash (受限), Grep, Glob
- 禁止: Edit (避免直接修改代码)

### 2.3 状态管理

**状态文件**: `.omc/zerodev/state/requirement-clarifier-state.json`

**状态 Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sessionId", "platformType", "clarificationRound"],
  "properties": {
    "sessionId": { "type": "string" },
    "platformType": { 
      "type": "string", 
      "enum": ["web", "mobile", "api", "plugin", "desktop", "unknown"] 
    },
    "clarificationRound": { "type": "integer", "minimum": 0, "maximum": 10 },
    "conversationHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "role": { "enum": ["user", "agent"] },
          "content": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" }
        }
      }
    },
    "requirements": {
      "type": "object",
      "properties": {
        "functional": { "type": "array", "items": { "type": "string" } },
        "nonFunctional": { "type": "array", "items": { "type": "string" } },
        "constraints": { "type": "array", "items": { "type": "string" } }
      }
    },
    "userPreferences": {
      "type": "object",
      "properties": {
        "techStack": { "type": "array", "items": { "type": "string" } },
        "deploymentTarget": { "type": "string" }
      }
    }
  }
}
```

**状态生命周期**:
1. **创建**: 用户执行 `/zerodev:start` 时创建
2. **更新**: 每轮对话后更新 `conversationHistory` 和 `requirements`
3. **清理**: 需求澄清完成后保留 7 天（用于审计）

### 2.4 与现有系统集成

**继承 analyst 能力**:
- 需求分析框架
- 隐性约束识别
- 验收标准生成

**扩展点**:
- 平台识别逻辑（新增）
- 多轮对话管理（新增）
- 结构化需求输出（增强）

**集成 Axiom 工作流**:
- 通过 Expert Gate: 需求完整性检查
- 通过 User Gate: 用户确认需求
- 输出到 `.omc/zerodev/requirements/{sessionId}.md`

---

## 3. code-generator Agent（优先级 P0）

### 3.1 集成接口

**注册路径**: `src/agents/definitions.ts`

```typescript
export const codeGeneratorAgent: AgentConfig = {
  name: 'code-generator',
  description: 'Context-aware code generation with AST manipulation (Sonnet). Extends executor.',
  prompt: loadAgentPrompt('code-generator'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

**系统提示词路径**: `agents/code-generator.md`

**路由规则**:
```typescript
{
  trigger: ['generate code', 'create function', 'implement feature', 'zerodev:generate'],
  priority: 'high',
  autoActivate: false  // 需显式调用
}
```

### 3.2 能力定义

**继承自**: `executor` agent

**扩展能力**:
- `contextAwareGeneration`: 基于项目上下文生成代码
- `astManipulation`: 使用 AST 工具精确修改代码
- `codeQualityCheck`: 生成后自动质量检查（ESLint/Prettier）
- `templateMatching`: 从模板库匹配最佳模板

**工具访问**:
- 允许: Read, Write, Edit, Bash, ast_grep_search, ast_grep_replace, lsp_diagnostics
- 禁止: 无（executor 拥有完整工具访问权限）

### 3.3 代码模板库

**存储路径**: `.omc/zerodev/code-templates/`

**目录结构**:
```
.omc/zerodev/code-templates/
├── auth/
│   ├── jwt-auth.ts.template
│   ├── oauth2.ts.template
│   └── session-auth.ts.template
├── crud/
│   ├── rest-crud.ts.template
│   ├── graphql-crud.ts.template
│   └── prisma-crud.ts.template
├── upload/
│   ├── s3-upload.ts.template
│   ├── local-upload.ts.template
│   └── cloudinary-upload.ts.template
├── payment/
│   ├── stripe-payment.ts.template
│   └── paypal-payment.ts.template
└── notification/
    ├── email-notification.ts.template
    ├── sms-notification.ts.template
    └── push-notification.ts.template
```

**模板格式**:
```typescript
// Template: {{templateName}}
// Platform: {{platform}}
// Dependencies: {{dependencies}}

{{imports}}

export class {{className}} {
  {{methods}}
}
```

### 3.4 状态管理

**状态文件**: `.omc/zerodev/state/code-generator-state.json`

**状态 Schema**:
```json
{
  "sessionId": "string",
  "generationTasks": [
    {
      "taskId": "string",
      "feature": "string",
      "template": "string",
      "status": "pending | generating | completed | failed",
      "outputPath": "string",
      "qualityScore": "number (0-100)"
    }
  ],
  "generatedFiles": ["string"],
  "totalLinesGenerated": "number"
}
```

### 3.5 与现有系统集成

**继承 executor 能力**:
- 代码实现能力
- 文件操作能力
- 测试执行能力

**扩展点**:
- 模板匹配引擎（新增）
- AST 精确修改（增强）
- 质量自动检查（新增）

**集成 CI Gate**:
- 生成后自动执行 `tsc --noEmit`
- 自动执行 `npm run lint`
- 质量分数 <85 分触发警告

---

## 4. 其他 3 个 Agent（优先级 P1-P2）

### 4.1 tech-selector Agent（接口占位符）

**注册路径**: `src/agents/definitions.ts`

```typescript
export const techSelectorAgent: AgentConfig = {
  name: 'tech-selector',
  description: 'Technology stack decision engine (Sonnet). Extends dependency-expert. [PLACEHOLDER]',
  prompt: loadAgentPrompt('tech-selector'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

**系统提示词**: `agents/tech-selector.md`（最小化实现）

**状态文件**: `.omc/zerodev/state/tech-selector-state.json`

**实施时间**: Sprint 2 (Week 5-6)

### 4.2 deployment-manager Agent（接口占位符）

**注册路径**: `src/agents/definitions.ts`

```typescript
export const deploymentManagerAgent: AgentConfig = {
  name: 'deployment-manager',
  description: 'One-click deployment manager (Sonnet). Extends devops-engineer. [PLACEHOLDER]',
  prompt: loadAgentPrompt('deployment-manager'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

**系统提示词**: `agents/deployment-manager.md`（最小化实现）

**状态文件**: `.omc/zerodev/state/deployment-manager-state.json`

**实施时间**: Sprint 5 (Week 11-12)

### 4.3 opensource-analyzer Agent（接口占位符）

**注册路径**: `src/agents/definitions.ts`

```typescript
export const opensourceAnalyzerAgent: AgentConfig = {
  name: 'opensource-analyzer',
  description: 'Open-source project research engine (Sonnet). Extends architect + explore. [PLACEHOLDER]',
  prompt: loadAgentPrompt('opensource-analyzer'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

**系统提示词**: `agents/opensource-analyzer.md`（最小化实现）

**状态文件**: `.omc/zerodev/state/opensource-analyzer-state.json`

**实施时间**: Sprint 6 (Week 13-14)

---

## 5. 实施路线图

### Phase 1: 基础设施搭建（Week 1, Day 1-3）

**目标**: 创建 ZeroDev 目录结构和状态管理基础

**任务清单**:
- [ ] 创建目录结构 `.omc/zerodev/{state,code-templates,tech-stacks,requirements}`
- [ ] 实现状态管理工具函数 `src/lib/zerodev-state.ts`
- [ ] 创建 JSON Schema 文件 `src/schemas/zerodev/*.schema.json`
- [ ] 编写单元测试（覆盖率 ≥80%）

**交付物**:
- 完整的目录结构
- 状态管理 API（create/read/update/delete）
- 测试套件

**工时**: 24h

---

### Phase 2: requirement-clarifier Agent（Week 1, Day 4-7）

**目标**: 实现需求澄清对话引擎

**任务清单**:
- [ ] 编写系统提示词 `agents/requirement-clarifier.md`
- [ ] 在 `src/agents/definitions.ts` 注册 agent
- [ ] 实现对话引擎逻辑
- [ ] 实现平台识别算法
- [ ] 集成 Expert Gate 和 User Gate
- [ ] 编写集成测试

**交付物**:
- 可运行的 requirement-clarifier agent
- 支持 3 轮对话的 PoC
- 测试覆盖率 ≥80%

**工时**: 40h

**验收标准**:
- 用户输入"我想做一个待办事项应用"，系统能识别为 Web 平台
- 系统能提出至少 3 个澄清问题
- 生成结构化需求文档

---

### Phase 3: code-generator Agent（Week 2, Day 1-5）

**目标**: 实现自适应代码生成引擎

**任务清单**:
- [ ] 编写系统提示词 `agents/code-generator.md`
- [ ] 在 `src/agents/definitions.ts` 注册 agent
- [ ] 创建 5 个基础代码模板（auth/crud/upload/payment/notification）
- [ ] 实现模板匹配引擎
- [ ] 实现 AST 代码生成逻辑
- [ ] 集成 CI Gate（tsc + lint）
- [ ] 编写端到端测试

**交付物**:
- 可运行的 code-generator agent
- 5 个代码模板
- 测试覆盖率 ≥80%

**工时**: 56h

**验收标准**:
- 输入"生成 JWT 认证模块"，输出可编译的 TypeScript 代码
- 代码质量分数 ≥85 分
- 生成时间 <10s

---

### Phase 4: 集成测试与优化（Week 2, Day 6-7）

**目标**: 端到端测试和性能优化

**任务清单**:
- [ ] 场景 1 测试：需求澄清 → 代码生成（<10s）
- [ ] 场景 2 测试：多 Agent 协作（<30s）
- [ ] 场景 3 测试：100 并发负载（无失败）
- [ ] 性能优化（缓存、并行化）
- [ ] 编写 Go/No-Go 决策报告

**交付物**:
- 3 个 PoC 场景测试报告
- 性能基准测试报告
- Go/No-Go 决策文档

**工时**: 40h

**验收标准**:
- 所有 3 个场景通过
- 性能达标（需求澄清 <10s，完整流程 <5min）
- Go/No-Go 决策为 🟢 绿灯

---

## 6. 技术决策

### 6.1 为什么继承现有 agents？

**理由**:
1. **复用成熟能力**: 现有 49 agents 已经过充分测试，稳定可靠
2. **降低开发成本**: 继承可减少 60% 的开发工作量
3. **保持一致性**: 统一的 agent 接口和工具访问模式
4. **快速迭代**: 专注于扩展能力，而非重新实现基础功能

**权衡**:
- 优点: 开发速度快，质量有保障
- 缺点: 受限于父 agent 的设计约束

**决策**: 继承是最优选择，约束可通过扩展点解决

---

### 6.2 为什么使用 .omc/zerodev/ 目录？

**理由**:
1. **隔离性**: 避免与现有 49 agents 的状态文件冲突
2. **可维护性**: 清晰的目录结构便于管理和调试
3. **可扩展性**: 未来可独立部署 ZeroDev 模块
4. **符合规范**: 遵循 ultrapower 的状态存储约定（`.omc/` 目录）

**权衡**:
- 优点: 清晰隔离，易于管理
- 缺点: 需要额外的目录管理逻辑

**决策**: 独立目录是最佳实践

---

### 6.3 为什么需要独立状态管理？

**理由**:
1. **会话隔离**: 每个 ZeroDev 会话有独立的状态，避免冲突
2. **审计追踪**: 完整记录需求澄清和代码生成过程
3. **恢复能力**: 会话中断后可从状态文件恢复
4. **并发支持**: 多个用户可同时使用 ZeroDev

**权衡**:
- 优点: 健壮性强，支持并发
- 缺点: 增加状态管理复杂度

**决策**: 独立状态管理是必需的

---

### 6.4 为什么 Sprint 0 只实现 2 个 Agent？

**理由**:
1. **风险控制**: PoC 阶段聚焦核心假设验证
2. **快速反馈**: 2 周内完成，快速获得 Go/No-Go 决策
3. **资源优化**: 避免在未验证的方案上投入过多资源
4. **迭代优化**: 根据 PoC 结果调整后续 3 个 Agent 的设计

**权衡**:
- 优点: 风险低，反馈快
- 缺点: 功能不完整

**决策**: PoC 最小化是正确策略

---

## 7. 风险与缓解

### 7.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| Agent 集成复杂度高 | 高 | 中 | 复用现有基础设施，继承成熟 agents |
| 状态同步问题 | 中 | 中 | 使用文件锁机制，原子写入 |
| 性能不达标 | 高 | 中 | 缓存 + 并行优化 + 性能基准测试 |
| 代码生成质量不稳定 | 高 | 中 | 模板库 + 质量门禁 + 多轮审查 |
| 多轮对话上下文丢失 | 中 | 低 | 持久化对话历史到状态文件 |

### 7.2 集成风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| 与现有 49 agents 冲突 | 高 | 低 | 独立命名空间，独立状态目录 |
| 门禁集成失败 | 中 | 低 | 早期集成测试，遵循现有门禁规范 |
| 工具访问权限问题 | 中 | 低 | 明确定义 disallowedTools |
| 状态文件格式不兼容 | 低 | 低 | 使用 JSON Schema 验证 |

---

## 8. 验收标准

### 8.1 功能验收

- [ ] requirement-clarifier 能识别 5 种平台类型
- [ ] requirement-clarifier 支持至少 3 轮对话
- [ ] code-generator 能生成可编译的代码
- [ ] code-generator 质量分数 ≥85 分
- [ ] 5 个 Agent 全部在 definitions.ts 注册

### 8.2 性能验收

- [ ] 需求澄清响应时间 <10s（P95）
- [ ] 代码生成时间 <60s（P95）
- [ ] 多 Agent 协作 <30s
- [ ] 100 并发无失败

### 8.3 质量验收

- [ ] 单元测试覆盖率 ≥80%
- [ ] 集成测试覆盖核心流程
- [ ] 所有状态文件有 JSON Schema
- [ ] 文档完整（系统提示词 + 集成文档）

---

## 9. 附录

### 9.1 目录结构

```
ultrapower/
├── src/
│   ├── agents/
│   │   ├── definitions.ts          # 注册 5 个新 agents
│   │   ├── requirement-clarifier.ts
│   │   ├── code-generator.ts
│   │   ├── tech-selector.ts        # 占位符
│   │   ├── deployment-manager.ts   # 占位符
│   │   └── opensource-analyzer.ts  # 占位符
│   ├── lib/
│   │   └── zerodev-state.ts        # 状态管理工具
│   └── schemas/
│       └── zerodev/
│           ├── requirement-clarifier-state.schema.json
│           └── code-generator-state.schema.json
├── agents/
│   ├── requirement-clarifier.md    # 系统提示词
│   ├── code-generator.md
│   ├── tech-selector.md            # 占位符
│   ├── deployment-manager.md       # 占位符
│   └── opensource-analyzer.md      # 占位符
└── .omc/
    └── zerodev/
        ├── state/                  # 会话状态
        ├── code-templates/         # 代码模板库
        ├── tech-stacks/            # 技术栈知识库
        └── requirements/           # 需求文档
```

### 9.2 关键文件清单

**必须创建的文件**（Sprint 0）:
1. `src/agents/requirement-clarifier.ts`
2. `src/agents/code-generator.ts`
3. `agents/requirement-clarifier.md`
4. `agents/code-generator.md`
5. `src/lib/zerodev-state.ts`
6. `src/schemas/zerodev/requirement-clarifier-state.schema.json`
7. `src/schemas/zerodev/code-generator-state.schema.json`

**占位符文件**（Sprint 0）:
1. `src/agents/tech-selector.ts`（最小实现）
2. `src/agents/deployment-manager.ts`（最小实现）
3. `src/agents/opensource-analyzer.ts`（最小实现）
4. `agents/tech-selector.md`（最小提示词）
5. `agents/deployment-manager.md`（最小提示词）
6. `agents/opensource-analyzer.md`（最小提示词）

### 9.3 参考资料

- ultrapower v7.2.0 架构文档
- 现有 49 agents 实现（`src/agents/definitions.ts`）
- 状态管理规范（`docs/standards/state-machine.md`）
- Axiom 门禁规范（`CLAUDE.md`）
- Agent 生命周期规范（`docs/standards/agent-lifecycle.md`）

---

## 总结

本架构设计遵循 **最小化侵入、最大化复用** 原则，通过继承现有 agents 和独立状态空间，实现了 5 个新 Agent 与 ultrapower v7.2.0 的无缝集成。

**Sprint 0 (PoC) 聚焦**:
- 2 个核心 Agent：requirement-clarifier + code-generator
- 3 个 PoC 场景验证
- 2 周完成，快速获得 Go/No-Go 决策

**关键成功因素**:
1. 复用现有 49 agents 的成熟能力
2. 独立状态管理避免冲突
3. 渐进式实现降低风险
4. 完整的测试和验证机制

**下一步**:
1. 技术负责人审查本架构文档
2. 开发团队开始 Phase 1（基础设施搭建）
3. Week 2 结束前完成 Go/No-Go 决策

---

**文档状态**: ✅ 完成
**审查状态**: ⏳ 待审查
**批准状态**: ⏳ 待批准
