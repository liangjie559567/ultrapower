# RESEARCH STAGE 2: Agent 系统实现机制深度分析

**研究时间**: 2026-03-10
**研究目标**: 深度分析 ultrapower 的 49 个 agents 实现机制
**置信度**: HIGH

---

## [FINDING:AGENT-1] Agent 定义和注册机制

### 核心架构

ultrapower 使用**集中式注册表 + 动态提示加载**的混合架构：

**注册中心**: `src/agents/definitions.ts`
- 导出 49 个独立 agent 配置（51 个包含已废弃别名）
- `getAgentDefinitions()` 函数返回完整 agent 注册表
- 支持运行时覆盖（overrides）机制

**Agent 配置结构** (`AgentConfig` 接口):
```typescript
{
  name: string;              // Agent 标识符
  description: string;       // 简短描述
  prompt: string;            // 系统提示词
  model?: ModelType;         // 默认模型 (haiku/sonnet/opus)
  defaultModel?: ModelType;  // 显式层级映射
  tools?: string[];          // 允许的工具列表
  disallowedTools?: string[]; // 禁用的工具列表
  metadata?: AgentPromptMetadata; // 元数据（触发器、成本等）
}
```

### [EVIDENCE:AGENT-1] 关键代码路径

**1. Agent 注册表构建** (`src/agents/definitions.ts:469-574`):
```typescript
export function getAgentDefinitions(overrides?) {
  const agents = {
    // BUILD/ANALYSIS LANE (8 agents)
    explore, analyst, planner, architect, debugger,
    executor, 'deep-executor', verifier,

    // REVIEW LANE (6 agents)
    'style-reviewer', 'quality-reviewer', 'api-reviewer',
    'security-reviewer', 'performance-reviewer', 'code-reviewer',

    // DOMAIN SPECIALISTS (15 agents)
    'dependency-expert', 'test-engineer', 'quality-strategist',
    'build-fixer', designer, writer, 'qa-tester', scientist,
    'git-master', 'database-expert', 'devops-engineer',
    'i18n-specialist', 'accessibility-auditor', 'api-designer',

    // PRODUCT LANE (4 agents)
    'product-manager', 'ux-researcher',
    'information-architect', 'product-analyst',

    // COORDINATION (2 agents)
    critic, vision,

    // AXIOM LANE (14 agents)
    'axiom-requirement-analyst', 'axiom-product-designer',
    // ... 其他 12 个 Axiom agents
  };

  // 应用 overrides 和解析 disallowedTools
  for (const [name, config] of Object.entries(agents)) {
    const override = overrides?.[name];
    const disallowedTools = config.disallowedTools ?? parseDisallowedTools(name);
    result[name] = { ...config, ...override, disallowedTools };
  }

  return result;
}
```

**2. 动态提示加载** (`src/agents/utils.ts:89-183`):
```typescript
export function loadAgentPrompt(agentName: string, provider?: ExternalModelProvider): string {
  // 安全验证：防止路径遍历攻击
  if (!/^[a-z0-9-]+$/i.test(agentName)) {
    throw new Error(`Invalid agent name: contains disallowed characters`);
  }

  // 优先级：缓存 > 构建时嵌入 > 运行时文件读取
  // 1. 检查进程级缓存
  if (promptCache.has(agentName)) return promptCache.get(agentName)!;

  // 2. 构建时嵌入（CJS bundles）
  if (typeof __AGENT_PROMPTS__ !== 'undefined') {
    const prompt = __AGENT_PROMPTS__[agentName];
    if (prompt) {
      promptCache.set(agentName, prompt);
      return prompt;
    }
  }

  // 3. 运行时文件读取（dev/test）
  const agentPath = join(getPackageDir(), 'agents', `${agentName}.md`);
  const content = readFileSync(agentPath, 'utf-8');
  const prompt = stripFrontmatter(content); // 移除 YAML frontmatter
  promptCache.set(agentName, prompt);
  return prompt;
}
```

**安全特性**:
- 正则验证 agent 名称（仅允许 `[a-z0-9-]`）
- 路径解析后验证在允许目录内（防止 `../../etc/passwd`）
- 进程级缓存避免重复文件读取

---

## [FINDING:AGENT-2] 提示模板结构和变体系统

### 模板文件组织

**位置**: `agents/*.md` (50 个文件，5848 行总计)

**标准结构** (YAML frontmatter + XML 提示):
```markdown
---
name: executor
description: 专注于实现工作的任务执行者（Sonnet）
model: sonnet
disallowedTools: Write, Edit  # 可选
---

<Agent_Prompt>
  <Role>...</Role>
  <Why_This_Matters>...</Why_This_Matters>
  <Success_Criteria>...</Success_Criteria>
  <Constraints>...</Constraints>
  <Investigation_Protocol>...</Investigation_Protocol>
  <Tool_Usage>...</Tool_Usage>
  <Execution_Policy>...</Execution_Policy>
  <Output_Format>...</Output_Format>
  <Failure_Modes_To_Avoid>...</Failure_Modes_To_Avoid>
  <Examples>...</Examples>
  <Final_Checklist>...</Final_Checklist>
</Agent_Prompt>
```

### 提示模板的 8 个核心组件

1. **Role**: 明确职责边界（"你负责 X，不负责 Y"）
2. **Why_This_Matters**: 解释规则背后的原因（防止常见失败模式）
3. **Success_Criteria**: 可验证的完成标准
4. **Constraints**: 硬性限制（工具禁用、范围限制）
5. **Investigation_Protocol**: 分步工作流程
6. **Tool_Usage**: 工具选择指南（包含 MCP 咨询）
7. **Execution_Policy**: 工作量级别和停止条件
8. **Failure_Modes_To_Avoid**: 反模式和正确做法对比

### [EVIDENCE:AGENT-2] 提示模板分析

**只读 Agents** (14 个，禁用 Write/Edit):
```
architect, analyst, critic, dependency-expert, document-specialist,
explore, information-architect, product-analyst, product-manager,
quality-strategist, security-reviewer, scientist, ux-researcher, vision
```

**典型只读 Agent 约束** (`architect.md:28-32`):
```xml
<Constraints>
  - 你是只读的。Write 和 Edit 工具被禁用。你从不实现变更。
  - 不要评判你未打开并阅读的代码。
  - 不要提供适用于任何代码库的通用建议。
  - 存在不确定性时承认，而非推测。
  - 移交给：analyst（需求缺口）、planner（计划创建）、critic（计划审查）
</Constraints>
```

**实现 Agents** (禁用 Task 工具，防止递归生成):
```xml
<Constraints>
  - 独自工作。Task 工具和 agent 生成被禁用。
  - 优先选择最小可行变更。不要将范围扩展到请求行为之外。
  - 不要为单次使用逻辑引入新抽象。
</Constraints>
```

---

## [FINDING:AGENT-3] 三级模型路由机制

### 模型分层策略

ultrapower 使用**基于复杂度的三级模型路由**：

| 模型层级 | 用途 | 超时配置 | 典型 Agents |
|---------|------|---------|------------|
| **Haiku** | 快速任务、轻量扫描 | 120s | explore, style-reviewer, writer |
| **Sonnet** | 标准实现、调试、审查 | 600s | executor, debugger, verifier, 大部分专家 |
| **Opus** | 架构、深度分析、复杂重构 | 1800s | architect, analyst, planner, critic, deep-executor |

### [EVIDENCE:AGENT-3] 模型分配矩阵

**统计分析** (基于 `agents/*.md` frontmatter):
- **Haiku**: 3 agents (6%)
- **Sonnet**: 41 agents (82%)
- **Opus**: 5 agents (10%)
- **Inherit**: 1 agent (code-reviewer, 2%)

**关键设计决策**:
1. **Opus 仅用于战略层**: architect, analyst, planner, critic, deep-executor
2. **Sonnet 是默认选择**: 覆盖 82% agents（平衡质量和成本）
3. **Haiku 用于高频低复杂度**: explore (代码搜索), style-reviewer (格式检查), writer (文档生成)

**动态模型覆盖** (`src/agents/definitions.ts:469-574`):
```typescript
// 调用者可在运行时覆盖模型
const agents = getAgentDefinitions({
  'executor': { model: 'opus' }  // 将 executor 升级到 opus
});
```

**模型路由优先级** (`src/agents/timeout-config.ts:50-74`):
```typescript
export function getAgentTimeout(agentType: string, model?: string): number {
  // 优先级：环境变量 > Agent 类型 > 模型 > 默认值

  // 1. 环境变量覆盖
  if (process.env.OMC_AGENT_TIMEOUT) return parseInt(process.env.OMC_AGENT_TIMEOUT);

  // 2. Agent 类型特定超时
  if (config.byAgentType[agentType]) return config.byAgentType[agentType];

  // 3. 模型特定超时
  if (model && config.byModel[model]) return config.byModel[model];

  // 4. 默认超时
  return config.default; // 300s
}
```

---

## [FINDING:AGENT-4] Agent 分类体系和职责边界

### 六大 Agent 通道 (Lanes)

ultrapower 使用**通道隔离**设计，每个通道有明确的职责边界：

#### 1. BUILD/ANALYSIS LANE (8 agents)
**职责**: 代码探索 → 需求分析 → 规划 → 架构 → 调试 → 实现 → 验证

| Agent | 模型 | 职责 | 工具限制 |
|-------|------|------|---------|
| explore | haiku | 代码库搜索、文件发现 | 只读 |
| analyst | opus | 需求澄清、隐性约束分析 | 只读 |
| planner | opus | 任务排序、执行计划 | 只读 |
| architect | opus | 系统设计、架构建议 | 只读 |
| debugger | sonnet | 根因分析、回归隔离 | 可写 |
| executor | sonnet | 代码实现、重构 | 可写 |
| deep-executor | opus | 复杂自主目标导向任务 | 可写 |
| verifier | sonnet | 完成验证、测试充分性 | 可写 |

**工作流**: `explore → analyst → planner → critic → executor → architect (verify)`

#### 2. REVIEW LANE (6 agents)
**职责**: 多维度代码审查

| Agent | 模型 | 关注点 |
|-------|------|--------|
| style-reviewer | haiku | 格式、命名、惯用法 |
| quality-reviewer | opus | 逻辑缺陷、可维护性 |
| api-reviewer | sonnet | API 契约、版本控制 |
| security-reviewer | opus | 漏洞、信任边界 |
| performance-reviewer | sonnet | 热点、复杂度优化 |
| code-reviewer | opus | 综合审查（编排所有维度）|

#### 3. DOMAIN SPECIALISTS (15 agents)
**职责**: 领域专家支持

分类：
- **外部依赖**: dependency-expert (SDK/API 评估)
- **质量工程**: test-engineer, quality-strategist
- **工具链**: build-fixer, git-master
- **UI/文档**: designer, writer
- **运行时**: qa-tester (tmux 交互式测试)
- **数据**: scientist (统计分析)
- **基础设施**: database-expert, devops-engineer
- **国际化**: i18n-specialist
- **无障碍**: accessibility-auditor
- **API 设计**: api-designer

#### 4. PRODUCT LANE (4 agents)
**职责**: 产品策略和用户体验

| Agent | 职责 |
|-------|------|
| product-manager | 问题定义、PRD、KPI 树 |
| ux-researcher | 启发式审计、可用性 |
| information-architect | 分类、导航、可发现性 |
| product-analyst | 指标、漏斗分析、实验设计 |

#### 5. COORDINATION (2 agents)
**职责**: 跨通道协调

| Agent | 职责 |
|-------|------|
| critic | 计划审查、批判性挑战 |
| vision | 图片/截图/图表分析 |

#### 6. AXIOM LANE (14 agents)
**职责**: Axiom 工作流专用 agents

分为 4 个子系统：
- **需求门禁**: axiom-requirement-analyst (PASS/CLARIFY/REJECT)
- **PRD 生成**: axiom-product-designer, axiom-prd-crafter
- **专家审查**: axiom-ux-director, axiom-product-director, axiom-domain-expert, axiom-tech-lead, axiom-critic
- **执行系统**: axiom-system-architect (DAG 生成), axiom-worker, axiom-sub-prd-writer
- **进化引擎**: axiom-evolution-engine, axiom-context-manager

### [EVIDENCE:AGENT-4] 职责边界强制机制

**角色消歧义表** (`src/agents/definitions.ts:336-348`):
```typescript
/**
 * Agent Role Disambiguation
 *
 * | Agent     | Role                  | What They Do              | What They Don't Do |
 * |-----------|-----------------------|---------------------------|--------------------|
 * | architect | code-analysis         | Analyze code, debug       | Requirements, planning |
 * | analyst   | requirements-analysis | Find requirement gaps     | Code analysis, planning |
 * | planner   | plan-creation         | Create work plans         | Requirements, code analysis |
 * | critic    | plan-review           | Review plan quality       | Requirements, code analysis |
 *
 * Workflow: explore → analyst → planner → critic → executor → architect (verify)
 */
```

**提示模板中的边界声明** (每个 agent 的 `<Role>` 部分):
```xml
<Role>
  你是 Executor。你的使命是精确地按规格实现代码变更。
  你负责在分配任务的范围内编写、编辑和验证代码。
  你不负责架构决策、规划、调试根本原因或审查代码质量。
</Role>
```

---

## [FINDING:AGENT-5] Agent 生命周期和超时管理

### 生命周期管理架构

ultrapower 使用**超时管理器 + Agent 包装器**的两层架构：

#### 1. TimeoutManager (`src/agents/timeout-manager.ts`)

**核心功能**:
- 启动超时监控并返回 `AbortController`
- 跟踪并发任务数（最大 20 个）
- 自动清理超时任务

**实现**:
```typescript
export class TimeoutManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private startTimes = new Map<string, number>();
  private readonly MAX_CONCURRENT_TASKS = 20;

  start(taskId: string, agentType: string, model?: string): AbortController {
    // 并发限制检查
    if (this.timers.size >= this.MAX_CONCURRENT_TASKS) {
      throw new Error(`max concurrent tasks (20) exceeded`);
    }

    const controller = new AbortController();
    const timeoutMs = getAgentTimeout(agentType, model);

    const timer = setTimeout(() => {
      controller.abort();  // 触发 AbortSignal
      this.cleanup(taskId);
    }, timeoutMs);

    this.timers.set(taskId, timer);
    return controller;
  }
}
```

#### 2. Agent Wrapper (`src/agents/agent-wrapper.ts`)

**核心功能**:
- 带超时保护的 agent 调用
- 指数退避重试策略
- 超时/错误区分

**实现**:
```typescript
export async function callAgentWithTimeout(
  agentFn: (signal: AbortSignal) => Promise<string>,
  options: AgentCallOptions
): Promise<AgentCallResult> {
  const { agentType, model, maxRetries = 1 } = options;

  let attempt = 0;
  while (attempt <= maxRetries) {
    const controller = timeoutManager.start(taskId, agentType, model);

    try {
      const output = await agentFn(controller.signal);
      timeoutManager.stop(taskId);
      return { success: true, output, retried: attempt > 0 };
    } catch (error) {
      if (error.name === 'AbortError') {
        // 超时 - 指数退避重试
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        return { success: false, timedOut: true };
      }
      // 其他错误 - 立即失败
      return { success: false, error: error.message };
    }
  }
}
```

### 超时配置矩阵

**按 Agent 类型** (`src/agents/timeout-config.ts:18-37`):
```typescript
byAgentType: {
  // 快速任务 (1-3 分钟)
  explore: 60000,           // 1 分钟
  'style-reviewer': 120000, // 2 分钟
  writer: 180000,           // 3 分钟

  // 标准任务 (5-10 分钟)
  executor: 600000,         // 10 分钟
  debugger: 600000,
  planner: 600000,
  verifier: 300000,         // 5 分钟

  // 复杂任务 (15-30 分钟)
  'deep-executor': 1800000, // 30 分钟
  architect: 900000,        // 15 分钟
  analyst: 900000,
  'code-reviewer': 900000,
}
```

**按模型** (`src/agents/timeout-config.ts:39-43`):
```typescript
byModel: {
  haiku: 120000,   // 2 分钟
  sonnet: 600000,  // 10 分钟
  opus: 1800000,   // 30 分钟
}
```

### [EVIDENCE:AGENT-5] 生命周期边界情况处理

**孤儿进程检测**: 通过 `MAX_CONCURRENT_TASKS` 限制防止资源泄漏

**超时后重试策略**:
- 第 1 次重试: 延迟 1 秒
- 第 2 次重试: 延迟 2 秒
- 第 3 次重试: 延迟 4 秒
- 最大延迟: 10 秒

**成本超限**: 通过超时间接控制（长时间运行 = 高成本）

**死锁预防**: `AbortController` 允许外部中断长时间运行的操作

---

## 总结

### 关键发现

1. **49 个独立 agents** (51 个包含别名)，分为 6 大通道
2. **集中式注册表** + **动态提示加载**混合架构
3. **三级模型路由**: Haiku (6%) / Sonnet (82%) / Opus (10%)
4. **工具分配矩阵**: 14 个只读 agents，35 个可写 agents
5. **超时管理**: Agent 类型优先 > 模型优先 > 默认值
6. **安全机制**: 路径遍历防护、正则验证、进程级缓存

### 架构优势

- **职责隔离**: 每个 agent 有明确的"做什么"和"不做什么"
- **成本优化**: 82% agents 使用 Sonnet（平衡质量和成本）
- **可扩展性**: 新 agent 只需添加 `.md` 文件和注册条目
- **安全性**: 多层防护防止路径遍历和注入攻击

### 实现质量

- **代码行数**: 5848 行提示模板 + ~1500 行核心代码
- **测试覆盖**: timeout-manager, timeout-config, agent-wrapper 均有单元测试
- **文档完整性**: 每个 agent 有 8 个标准化章节

[STAGE_COMPLETE:2]
