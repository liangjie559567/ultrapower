# Stage 1: Agent System Architecture Analysis

## 1. Agent 注册机制

### 核心入口
- **文件**: `src/agents/definitions.ts`
- **函数**: `getAgentDefinitions()` - 返回所有 agent 配置的注册表
- **类型**: `AgentConfig` (name, description, prompt, tools, model, defaultModel)

### 注册流程
1. 每个 agent 定义为独立的 `AgentConfig` 对象
2. 通过 `loadAgentPrompt(agentName, provider?)` 动态加载提示词
3. `getAgentDefinitions()` 聚合所有 agents 到统一注册表
4. 支持运行时覆盖 (overrides) 和工具限制 (disallowedTools)

### 安全机制
- Agent 名称验证: `/^[a-z0-9-]+$/i` (防止路径遍历)
- 路径解析验证: 确保文件在 `agents/` 目录内
- Frontmatter 剥离: `stripFrontmatter()` 清理 YAML 元数据

---

## 2. Agent 分类体系 (50 Agents)

### Build/Analysis Lane (8 agents)
| Agent | Model | 职责 |
|-------|-------|------|
| explore | haiku | 代码库发现、符号/文件映射 |
| analyst | opus | 需求澄清、隐性约束分析 |
| planner | opus | 任务排序、执行计划、风险标记 |
| architect | opus | 系统设计、边界、接口、权衡 |
| debugger | sonnet | 根因分析、回归隔离、故障诊断 |
| executor | sonnet | 代码实现、重构、功能开发 |
| deep-executor | opus | 复杂自主目标导向任务 |
| verifier | sonnet | 完成证据、声明验证、测试充分性 |

**角色消歧义**:
- architect: 代码分析、调试、验证 (不做需求/规划/审查)
- analyst: 需求分析、找差距 (不做代码/规划/审查)
- planner: 创建工作计划 (不做需求/代码/审查)
- critic: 审查计划质量 (不做需求/代码/规划)

**工作流**: explore → analyst → planner → critic → executor → architect (verify)

### Review Lane (6 agents)
| Agent | Model | 职责 |
|-------|-------|------|
| style-reviewer | haiku | 格式、命名、惯用法、lint 规范 |
| quality-reviewer | sonnet | 逻辑缺陷、可维护性、反模式 |
| api-reviewer | sonnet | API 契约、版本控制、向后兼容性 |
| security-reviewer | sonnet | 漏洞、信任边界、认证/授权 |
| performance-reviewer | sonnet | 热点、复杂度、内存/延迟优化 |
| code-reviewer | opus | 跨关注点的综合审查 |

### Domain Specialists (11 agents)
| Agent | Model | 职责 |
|-------|-------|------|
| dependency-expert | sonnet | 外部 SDK/API/包评估 |
| test-engineer | sonnet | 测试策略、覆盖率、不稳定测试加固 |
| quality-strategist | sonnet | 质量策略、发布就绪性、风险评估 |
| build-fixer | sonnet | 构建/工具链/类型失败 |
| designer | sonnet | UX/UI 架构、交互设计 |
| writer | haiku | 文档、迁移说明、用户指南 |
| qa-tester | sonnet | 交互式 CLI/服务运行时验证 |
| scientist | sonnet | 数据/统计分析 |
| git-master | sonnet | 提交策略、历史整洁 |
| database-expert | sonnet | 数据库设计、查询优化和迁移 |
| devops-engineer | sonnet | CI/CD、容器化、基础设施即代码 |
| i18n-specialist | sonnet | 国际化、本地化和多语言支持 |
| accessibility-auditor | sonnet | Web 无障碍审查和 WCAG 合规 |
| api-designer | sonnet | REST/GraphQL API 设计和契约定义 |

### Product Lane (4 agents)
| Agent | Model | 职责 |
|-------|-------|------|
| product-manager | sonnet | 问题定义、用户画像/JTBD、PRD |
| ux-researcher | sonnet | 启发式审计、可用性、无障碍 |
| information-architect | sonnet | 分类、导航、可发现性 |
| product-analyst | sonnet | 产品指标、漏斗分析、实验 |

### Coordination (2 agents)
| Agent | Model | 职责 |
|-------|-------|------|
| critic | opus | 计划/设计批判性挑战 |
| vision | sonnet | 图片/截图/图表分析 |

### Axiom Lane (14 agents)
专用于 Axiom 工作流的门禁式 agents:
- axiom-requirement-analyst (PASS/CLARIFY/REJECT 三态门禁)
- axiom-product-designer (Draft PRD + Mermaid 流程图)
- axiom-review-aggregator (5 专家并行审查聚合)
- axiom-prd-crafter (工程级 PRD + 门禁验证)
- axiom-system-architect (原子任务 DAG + Manifest 生成)
- axiom-evolution-engine (知识收割、模式检测、工作流优化)
- axiom-context-manager (7 操作记忆系统)
- axiom-worker (PM→Worker 协议，QUESTION/COMPLETE/BLOCKED 输出)
- axiom-ux-director, axiom-product-director, axiom-domain-expert, axiom-tech-lead, axiom-critic (5 专家审查)
- axiom-sub-prd-writer (Manifest 任务分解为可执行 Sub-PRD)

### 已废弃别名 (向后兼容)
- `researcher` → `document-specialist` (已弃用，使用 dependency-expert)
- `tdd-guide` → `test-engineer`

---

## 3. 模型路由逻辑

### 三层模型体系
```typescript
type ModelType = 'sonnet' | 'opus' | 'haiku' | 'inherit';
```

| 模型 | 用途 | 典型 Agents |
|------|------|-------------|
| **haiku** | 快速查找、轻量扫描、范围较窄的检查 | explore, style-reviewer, writer |
| **sonnet** | 标准实现、调试、审查 | executor, debugger, verifier, 大部分专家 |
| **opus** | 架构、深度分析、复杂重构 | analyst, planner, architect, critic, code-reviewer, deep-executor |

### 路由规则
1. **defaultModel**: Agent 定义中的默认模型
2. **model**: 可在调用时覆盖 (Task 调用传入 `model` 参数)
3. **inherit**: 继承父 agent 的模型选择

### 调用示例
```typescript
Task(subagent_type="ultrapower:architect", model="haiku", prompt="Summarize module boundary")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="Add input validation")
Task(subagent_type="ultrapower:executor", model="opus", prompt="Refactor auth layer")
```

### 智能路由配置 (PluginConfig.routing)
- `defaultTier`: LOW/MEDIUM/HIGH
- `escalationEnabled`: 失败时自动升级
- `tierModels`: 每层的模型映射
- `agentOverrides`: Agent 特定的层级覆盖
- `escalationKeywords`: 强制升级的关键词
- `simplificationKeywords`: 建议降级的关键词

---

## 4. 提示词加载和分层变体

### 加载机制
```typescript
loadAgentPrompt(agentName: string, provider?: ExternalModelProvider): string
```

### 三层加载策略
1. **Provider-specific prompts** (优先级最高)
   - 路径: `agents.{provider}/{agentName}.md`
   - 示例: `agents.codex/architect.md`
   - 用于外部模型 (Codex, Gemini) 的定制提示词

2. **Build-time embedded prompts** (CJS bundles)
   - 变量: `__AGENT_PROMPTS__`, `__AGENT_PROMPTS_CODEX__`
   - esbuild 在构建时注入，避免运行时文件读取

3. **Runtime file reads** (dev/test 环境)
   - 路径: `agents/{agentName}.md`
   - 开发时动态加载，支持热更新

### Frontmatter 支持
- YAML frontmatter 用于元数据 (disallowedTools, triggers, etc.)
- `stripFrontmatter()` 在加载时自动剥离
- `parseDisallowedTools()` 从 frontmatter 提取工具限制

### 外部模型提供商
```typescript
type ExternalModelProvider = 'codex' | 'gemini';
```

**Codex 擅长**: 架构审查、规划验证、批判性分析、代码审查、安全审查、测试策略
**Gemini 擅长**: UI/UX 设计审查、文档、视觉分析、大上下文任务 (1M token)

### 委派路由 (DelegationRoutingConfig)
- `roles`: 每个角色的路由配置 (provider, tool, model, fallback)
- `defaultProvider`: claude | codex | gemini
- `enabled`: 启用/禁用委派路由

---

## 5. 工具限制机制

### disallowedTools
- 在 agent markdown frontmatter 中定义: `disallowedTools: tool1, tool2`
- 通过 `parseDisallowedTools(agentName)` 解析
- 在 `getAgentDefinitions()` 中应用到 agent 配置

### 工具配置
- `tools`: 允许的工具列表 (可选，默认全部允许)
- `disallowedTools`: 明确禁止的工具列表
- `createAgentToolRestrictions()`: 生成工具限制配置

---

## 6. OMC 系统提示词

### omcSystemPrompt 核心原则
1. **RELENTLESS EXECUTION**: 绑定任务列表，不停止直到所有任务完成
2. **Delegate Aggressively**: 为专业任务启动 subagents
3. **Parallelize Ruthlessly**: 独立任务并发执行
4. **PERSIST RELENTLESSLY**: 验证完成前持续工作
5. **Verify Thoroughly**: 测试、检查、验证，再验证

### 完成检查清单
- [ ] 每个 todo 项标记为 'completed'
- [ ] 所有请求功能已实现
- [ ] 测试通过 (如适用)
- [ ] 无未解决的错误
- [ ] 用户原始请求完全满足

### Agent 组合模式
**Architect + QA-Tester (诊断→验证循环)**:
1. architect 诊断问题，提供根因分析
2. architect 输出测试计划 (命令 + 预期输出)
3. qa-tester 在 tmux 中执行测试计划，捕获实际输出
4. 如验证失败，反馈给 architect 重新诊断
5. 重复直到验证通过

### 验证优先级顺序
1. **现有测试** (运行项目测试命令) - 首选，最便宜
2. **直接命令** (curl, 简单 CLI) - 便宜
3. **QA-Tester** (tmux 会话) - 昂贵，谨慎使用

---

## 7. 架构洞察

### 设计模式
- **注册表模式**: 集中式 agent 注册表，支持动态查找
- **策略模式**: 每个 agent 是独立策略，可插拔
- **工厂模式**: `loadAgentPrompt()` 作为提示词工厂
- **装饰器模式**: `mergeAgentConfig()` 支持配置覆盖和增强

### 扩展性
- 新增 agent: 创建 `agents/{name}.md` + 在 `definitions.ts` 中注册
- Provider 变体: 创建 `agents.{provider}/{name}.md`
- 工具限制: 在 frontmatter 中添加 `disallowedTools`
- 模型覆盖: 在 `PluginConfig.agents` 中配置

### 性能优化
- Build-time embedding: 避免运行时文件 I/O
- 分层加载: Provider-specific → embedded → runtime
- 模型分层: haiku (快) → sonnet (标准) → opus (深度)

### 安全考量
- 路径遍历防护: 正则验证 + 相对路径检查
- 工具沙箱: disallowedTools 限制危险操作
- 输入验证: `validateAgentConfig()` 确保配置完整性

---

## 总结

ultrapower 的 Agent 系统是一个**高度模块化、分层路由、安全加固**的多 agent 编排架构:

- **50 个专业 agents** 覆盖 Build/Review/Domain/Product/Axiom 五大通道
- **三层模型路由** (haiku/sonnet/opus) 平衡成本与质量
- **分层提示词加载** 支持 provider 变体和构建时优化
- **严格的安全机制** 防止路径遍历和工具滥用
- **灵活的扩展性** 支持运行时覆盖和动态注册

核心设计哲学: **专业化分工 + 智能路由 + 持续验证**
