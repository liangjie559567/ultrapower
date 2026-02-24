# 开发者 API 参考

> ultrapower 开发者和贡献者的内部 API 文档。

## 目录
1. [Notepad Wisdom System](#notepad-wisdom-system)
2. [Delegation Categories](#delegation-categories)
3. [Directory Diagnostics](#directory-diagnostics)
4. [Dynamic Prompt Generation](#dynamic-prompt-generation)
5. [Agent Templates](#agent-templates)
6. [Session Resume](#session-resume)
7. [Autopilot](#autopilot)
8. [MCP Integration](#mcp-integration)

---

## Notepad Wisdom System

面向执行任务的 agent 的计划范围知识捕获系统。每个计划在 `.omc/notepads/{plan-name}/` 下拥有独立的 notepad 目录，包含四个 markdown 文件：

- **learnings.md**：模式、约定、成功方法
- **decisions.md**：架构选择及其理由
- **issues.md**：问题和阻塞项
- **problems.md**：技术债务和注意事项

所有条目均自动添加时间戳。

### 核心函数

```typescript
// 初始化 notepad 目录
initPlanNotepad(planName: string, directory?: string): boolean

// 添加条目
addLearning(planName: string, content: string, directory?: string): boolean
addDecision(planName: string, content: string, directory?: string): boolean
addIssue(planName: string, content: string, directory?: string): boolean
addProblem(planName: string, content: string, directory?: string): boolean

// 读取知识
readPlanWisdom(planName: string, directory?: string): PlanWisdom
getWisdomSummary(planName: string, directory?: string): string
```

### 类型

```typescript
export interface WisdomEntry {
  timestamp: string;  // ISO 8601: "YYYY-MM-DD HH:MM:SS"
  content: string;
}

export type WisdomCategory = 'learnings' | 'decisions' | 'issues' | 'problems';

export interface PlanWisdom {
  planName: string;
  learnings: WisdomEntry[];
  decisions: WisdomEntry[];
  issues: WisdomEntry[];
  problems: WisdomEntry[];
}
```

### 使用示例

```typescript
import { initPlanNotepad, addLearning, readPlanWisdom } from '@/features/notepad-wisdom';

// 初始化并记录
initPlanNotepad('api-v2-migration');
addLearning('api-v2-migration', 'API routes use Express Router pattern in src/routes/');

// 读取
const wisdom = readPlanWisdom('api-v2-migration');
console.log(wisdom.learnings[0].content);
```

---

## Delegation Categories

语义任务分类，自动确定模型层级、温度和思考预算。

### 可用类别

| 类别 | 层级 | 温度 | 思考预算 | 适用场景 |
|----------|------|------|----------|---------|
| `visual-engineering` | HIGH | 0.7 | high | UI/UX、前端、设计系统 |
| `ultrabrain` | HIGH | 0.3 | max | 复杂推理、架构、调试 |
| `artistry` | MEDIUM | 0.9 | medium | 创意方案、头脑风暴 |
| `quick` | LOW | 0.1 | low | 简单查询、基本操作 |
| `writing` | MEDIUM | 0.5 | medium | 文档、技术写作 |
| `unspecified-low` | LOW | 0.1 | low | 简单任务的默认值 |
| `unspecified-high` | HIGH | 0.5 | high | 复杂任务的默认值 |

### 核心函数

```typescript
// 解析类别配置
resolveCategory(category: DelegationCategory): ResolvedCategory

// 从提示词自动检测
detectCategoryFromPrompt(taskPrompt: string): DelegationCategory | null

// 获取带上下文的类别
getCategoryForTask(context: CategoryContext): ResolvedCategory

// 用类别指导增强提示词
enhancePromptWithCategory(taskPrompt: string, category: DelegationCategory): string

// 单独访问器
getCategoryTier(category: DelegationCategory): ComplexityTier
getCategoryTemperature(category: DelegationCategory): number
getCategoryThinkingBudget(category: DelegationCategory): ThinkingBudget
getCategoryThinkingBudgetTokens(category: DelegationCategory): number
getCategoryPromptAppend(category: DelegationCategory): string
```

### 类型

```typescript
export type DelegationCategory =
  | 'visual-engineering'
  | 'ultrabrain'
  | 'artistry'
  | 'quick'
  | 'writing'
  | 'unspecified-low'
  | 'unspecified-high';

export type ThinkingBudget = 'low' | 'medium' | 'high' | 'max';

export interface ResolvedCategory {
  category: DelegationCategory;
  tier: ComplexityTier;
  temperature: number;
  thinkingBudget: ThinkingBudget;
  description: string;
  promptAppend?: string;
}

export interface CategoryContext {
  taskPrompt: string;
  agentType?: string;
  explicitCategory?: DelegationCategory;
  explicitTier?: ComplexityTier;
}
```

### 使用示例

```typescript
import { getCategoryForTask, enhancePromptWithCategory } from '@/features/delegation-categories';

const userRequest = 'Debug the race condition in payment processor';

const resolved = getCategoryForTask({ taskPrompt: userRequest });
// resolved.category === 'ultrabrain'
// resolved.temperature === 0.3

const enhancedPrompt = enhancePromptWithCategory(userRequest, resolved.category);
// 追加："Think deeply and systematically. Consider all edge cases..."
```

---

## Directory Diagnostics

使用双策略方法进行项目级 TypeScript/JavaScript 质量检查。

### 策略

- **`tsc`**：通过 `tsc --noEmit` 进行快速 TypeScript 编译检查
- **`lsp`**：逐文件 Language Server Protocol 诊断
- **`auto`**：自动选择最佳策略（默认，有 tsc 时优先使用）

### API

```typescript
runDirectoryDiagnostics(directory: string, strategy?: DiagnosticsStrategy): Promise<DirectoryDiagnosticResult>
```

### 类型

```typescript
export type DiagnosticsStrategy = 'tsc' | 'lsp' | 'auto';

export interface DirectoryDiagnosticResult {
  strategy: 'tsc' | 'lsp';
  success: boolean;
  errorCount: number;
  warningCount: number;
  diagnostics: string;
  summary: string;
}
```

### 使用示例

```typescript
import { runDirectoryDiagnostics } from '@/tools/diagnostics';

const result = await runDirectoryDiagnostics(process.cwd());

if (!result.success) {
  console.error(`Found ${result.errorCount} errors:`);
  console.error(result.diagnostics);
  process.exit(1);
}

console.log('Build quality check passed!');
```

---

## Dynamic Prompt Generation

从 agent 元数据动态生成编排器提示词。向 `definitions.ts` 添加新 agent 后，生成的提示词会自动包含该 agent。

### 核心函数

```typescript
// 生成完整编排器提示词
generateOrchestratorPrompt(agents: AgentConfig[], options?: GeneratorOptions): string

// 将定义转换为配置
convertDefinitionsToConfigs(definitions: Record<string, {...}>): AgentConfig[]

// 各节构建器
buildHeader(): string
buildAgentRegistry(agents: AgentConfig[]): string
buildTriggerTable(agents: AgentConfig[]): string
buildToolSelectionSection(agents: AgentConfig[]): string
buildDelegationMatrix(agents: AgentConfig[]): string
buildOrchestrationPrinciples(): string
buildWorkflow(): string
buildCriticalRules(): string
buildCompletionChecklist(): string
```

### 类型

```typescript
export interface GeneratorOptions {
  includeAgents?: boolean;
  includeTriggers?: boolean;
  includeTools?: boolean;
  includeDelegationTable?: boolean;
  includePrinciples?: boolean;
  includeWorkflow?: boolean;
  includeRules?: boolean;
  includeChecklist?: boolean;
}
```

### 使用示例

```typescript
import { getAgentDefinitions } from '@/agents/definitions';
import { generateOrchestratorPrompt, convertDefinitionsToConfigs } from '@/agents/prompt-generator';

const definitions = getAgentDefinitions();
const agents = convertDefinitionsToConfigs(definitions);
const prompt = generateOrchestratorPrompt(agents);
```

---

## Agent Templates

常见任务类型的标准化提示词结构。

### Exploration Template

用于探索、研究或搜索任务。

**各节：**
- **TASK**：需要探索的内容
- **EXPECTED OUTCOME**：编排器期望的返回结果
- **CONTEXT**：背景信息
- **MUST DO**：必须执行的操作
- **MUST NOT DO**：约束条件
- **REQUIRED SKILLS**：所需 skill
- **REQUIRED TOOLS**：所需工具

**位置：** `src/agents/templates/exploration-template.md`

### Implementation Template

用于代码实现、重构或修改任务。

**各节：**
- **TASK**：实现目标
- **EXPECTED OUTCOME**：交付物
- **CONTEXT**：项目背景
- **MUST DO**：必须执行的操作
- **MUST NOT DO**：约束条件
- **REQUIRED SKILLS**：所需 skill
- **REQUIRED TOOLS**：所需工具
- **VERIFICATION CHECKLIST**：完成前检查项

**位置：** `src/agents/templates/implementation-template.md`

---

## Session Resume

用于恢复带完整上下文的后台 agent 会话的封装器。

### API

```typescript
resumeSession(input: ResumeSessionInput): ResumeSessionOutput
```

### 类型

```typescript
export interface ResumeSessionInput {
  sessionId: string;
}

export interface ResumeSessionOutput {
  success: boolean;
  context?: {
    previousPrompt: string;
    toolCallCount: number;
    lastToolUsed?: string;
    lastOutputSummary?: string;
    continuationPrompt: string;
  };
  error?: string;
}
```

### 使用示例

```typescript
import { resumeSession } from '@/tools/resume-session';

const result = resumeSession({ sessionId: 'ses_abc123' });

if (result.success && result.context) {
  console.log(`Resuming session with ${result.context.toolCallCount} prior tool calls`);

  // 继续 Task 委派
  Task({
    subagent_type: "ultrapower:executor",
    model: "sonnet",
    prompt: result.context.continuationPrompt
  });
}
```

---

## Autopilot

通过 5 阶段开发生命周期，从想法到经过验证的可运行代码的自主执行。

### 5 阶段工作流

1. **Expansion** - analyst + architect 将想法扩展为需求和技术规格
2. **Planning** - architect 创建执行计划（由 critic 验证）
3. **Execution** - ralph + ultrawork 并行实现计划任务
4. **QA** - ultraQA 通过修复循环确保构建/lint/测试通过
5. **Validation** - 专业 architect 执行功能、安全和质量审查

### 核心类型

```typescript
export type AutopilotPhase =
  | 'expansion'
  | 'planning'
  | 'execution'
  | 'qa'
  | 'validation'
  | 'complete'
  | 'failed';

export interface AutopilotState {
  active: boolean;
  phase: AutopilotPhase;
  iteration: number;
  max_iterations: number;
  originalIdea: string;

  expansion: AutopilotExpansion;
  planning: AutopilotPlanning;
  execution: AutopilotExecution;
  qa: AutopilotQA;
  validation: AutopilotValidation;

  started_at: string;
  completed_at: string | null;
  phase_durations: Record<string, number>;
  total_agents_spawned: number;
  wisdom_entries: number;
  session_id?: string;
}

export interface AutopilotConfig {
  maxIterations?: number;              // 默认：10
  maxExpansionIterations?: number;     // 默认：2
  maxArchitectIterations?: number;     // 默认：5
  maxQaCycles?: number;                // 默认：5
  maxValidationRounds?: number;        // 默认：3
  parallelExecutors?: number;          // 默认：5
  pauseAfterExpansion?: boolean;       // 默认：false
  pauseAfterPlanning?: boolean;        // 默认：false
  skipQa?: boolean;                    // 默认：false
  skipValidation?: boolean;            // 默认：false
  autoCommit?: boolean;                // 默认：false
  validationArchitects?: ValidationVerdictType[];
}
```

### 状态管理

```typescript
// 初始化会话
initAutopilot(directory: string, idea: string, sessionId?: string, config?: Partial<AutopilotConfig>): AutopilotState

// 读写状态
readAutopilotState(directory: string): AutopilotState | null
writeAutopilotState(directory: string, state: AutopilotState): boolean
clearAutopilotState(directory: string): boolean

// 检查状态
isAutopilotActive(directory: string): boolean

// 阶段转换
transitionPhase(directory: string, newPhase: AutopilotPhase): AutopilotState | null
transitionRalphToUltraQA(directory: string, sessionId: string): TransitionResult
transitionUltraQAToValidation(directory: string): TransitionResult
transitionToComplete(directory: string): TransitionResult
transitionToFailed(directory: string, error: string): TransitionResult

// 更新阶段数据
updateExpansion(directory: string, updates: Partial<AutopilotExpansion>): boolean
updatePlanning(directory: string, updates: Partial<AutopilotPlanning>): boolean
updateExecution(directory: string, updates: Partial<AutopilotExecution>): boolean
updateQA(directory: string, updates: Partial<AutopilotQA>): boolean
updateValidation(directory: string, updates: Partial<AutopilotValidation>): boolean

// 指标
incrementAgentCount(directory: string, count?: number): boolean

// 路径
getSpecPath(directory: string): string  // .omc/autopilot/spec.md
getPlanPath(directory: string): string  // .omc/plans/autopilot-impl.md
```

### 提示词生成

```typescript
// 各阶段专用提示词
getExpansionPrompt(idea: string): string
getDirectPlanningPrompt(specPath: string): string
getExecutionPrompt(planPath: string): string
getQAPrompt(): string
getValidationPrompt(specPath: string): string

// 通用阶段提示词
getPhasePrompt(phase: string, context: object): string

// 转换提示词
getTransitionPrompt(fromPhase: string, toPhase: string): string
```

### 验证协调

```typescript
export type ValidationVerdictType = 'functional' | 'security' | 'quality';
export type ValidationVerdict = 'APPROVED' | 'REJECTED' | 'NEEDS_FIX';

// 记录裁决
recordValidationVerdict(directory: string, type: ValidationVerdictType, verdict: ValidationVerdict, issues?: string[]): boolean

// 获取状态
getValidationStatus(directory: string): ValidationCoordinatorResult | null

// 控制验证轮次
startValidationRound(directory: string): boolean
shouldRetryValidation(directory: string, maxRounds?: number): boolean
getIssuesToFix(directory: string): string[]

// 提示词和展示
getValidationSpawnPrompt(specPath: string): string
formatValidationResults(state: AutopilotState): string
```

### 摘要

```typescript
// 生成摘要
generateSummary(directory: string): AutopilotSummary | null

// 格式化摘要
formatSummary(summary: AutopilotSummary): string
formatCompactSummary(state: AutopilotState): string
formatFailureSummary(state: AutopilotState, error?: string): string
formatFileList(files: string[], title: string, maxFiles?: number): string
```

### 取消与恢复

```typescript
// 取消并保留进度
cancelAutopilot(directory: string): CancelResult
clearAutopilot(directory: string): CancelResult

// 恢复
canResumeAutopilot(directory: string): { canResume: boolean; state?: AutopilotState; resumePhase?: string }
resumeAutopilot(directory: string): { success: boolean; message: string; state?: AutopilotState }

// 展示
formatCancelMessage(result: CancelResult): string
```

### 使用示例

```typescript
import {
  initAutopilot,
  getPhasePrompt,
  readAutopilotState,
  transitionRalphToUltraQA,
  getValidationStatus,
  generateSummary,
  formatSummary
} from '@/hooks/autopilot';

// 初始化会话
const idea = 'Create a REST API for todo management with authentication';
const state = initAutopilot(process.cwd(), idea, 'ses_abc123');

// 获取 expansion 阶段提示词
const prompt = getPhasePrompt('expansion', { idea });

// 监控进度
const currentState = readAutopilotState(process.cwd());
console.log(`Phase: ${currentState?.phase}`);
console.log(`Agents spawned: ${currentState?.total_agents_spawned}`);

// 阶段转换
if (currentState?.phase === 'execution' && currentState.execution.ralph_completed_at) {
  const result = transitionRalphToUltraQA(process.cwd(), 'ses_abc123');
  if (result.success) {
    console.log('Transitioned to QA phase');
  }
}

// 检查验证
const validationStatus = getValidationStatus(process.cwd());
if (validationStatus?.allApproved) {
  const summary = generateSummary(process.cwd());
  if (summary) {
    console.log(formatSummary(summary));
  }
}
```

### 状态持久化

所有状态持久化到 `.omc/state/autopilot-state.json`，包含：

- 活跃状态和当前阶段
- 用户原始想法
- 各阶段进度（expansion、planning、execution、qa、validation）
- 已创建和修改的文件
- agent 生成数量和指标
- 阶段耗时追踪
- 会话绑定

---

## MCP Integration

ultrapower 通过 4 个 MCP 服务器提供外部 AI 模型集成。

### 服务器列表

| 服务器文件 | 模型 | 用途 |
|-----------|------|------|
| `bridge/codex-server.cjs` | gpt-5.3-codex | 代码分析、规划验证、架构审查 |
| `bridge/gemini-server.cjs` | gemini-3-pro-preview | 大上下文任务（1M tokens）、UI/UX 设计 |
| `bridge/mcp-server.cjs` | - | 通用 MCP 工具服务 |
| `bridge/team-bridge.cjs` | - | 团队协调桥接 |

### 调用方式

```typescript
// Codex (GPT)
mcp__plugin_smart-dev-flow_x__ask_codex({
  agent_role: 'architect',  // 任意 OMC agent 角色
  prompt: '...',
  context_files: ['src/foo.ts']
})

// Gemini
mcp__plugin_smart-dev-flow_g__ask_gemini({
  agent_role: 'designer',
  prompt: '...',
  files: ['src/components/Foo.tsx']
})
```

### 路径边界规则

`prompt_file` 和 `output_file` 均相对于 `working_directory` 解析，受 `OMC_MCP_OUTPUT_PATH_POLICY` 控制（`strict` 默认 / `redirect_output`）。详见 [REFERENCE.md](./REFERENCE.md#mcp-path-boundary-rules)。

---

## 参见

- [CHANGELOG.md](../CHANGELOG.md) - 版本历史
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 系统架构
- [MIGRATION.md](./MIGRATION.md) - 迁移指南
- [Agent Definitions](../src/agents/definitions.ts) - Agent 配置
