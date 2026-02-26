# PRD: ultrapower 全链路规范体系 - Rough

> **状态**: ROUGH（经专家评审聚合）
> **版本**: 0.2
> **日期**: 2026-02-26
> **项目**: ultrapower v5.0.21
> **前置文档**: docs/prd/ultrapower-standards-draft.md
> **评审摘要**: docs/reviews/ultrapower-standards/summary.md

---

## 1. 背景与目标

### 1.1 背景

ultrapower（OMC）v5.0.21 已具备 49 个 agents、70 个 skills、35 个 hooks 的完整体系。从 CHANGELOG 可见，v5.0.9 至 v5.0.21 的主要修复集中在文档不一致、数量对不上、缓存嵌套等"规范缺失"导致的问题，系统已到达"规范真空"临界点。

三类系统性问题已在生产环境中显现：

- **运行时 BUG**：Hook 执行顺序不确定、状态文件并发读写冲突（2026-02-12 Race Condition）、Agent 生命周期管理缺失
- **使用混乱**：用户面对 70 个 skills 无导航，不清楚何时用 skill、何时用 agent、何时用 MCP
- **贡献无序**：新增 skill/agent/hook 缺乏统一模板，agents/ 目录下 .md 文件格式不统一（部分有 YAML frontmatter，部分没有）

### 1.2 目标

建立覆盖全链路的规范体系，使 ultrapower 从"能用"升级为"可靠、易用、可扩展"。规范必须从现有代码反向提取，不得凭空撰写。

### 1.3 成功指标

| 指标 | 当前状态 | 目标 | 验证方式 |
| --- | --- | --- | --- |
| 新增 skill/agent/hook 检查清单覆盖率 | 0% | 100% | CI 自动验证（Primary KPI） |
| 新用户首次选出正确 skill 的时间 | 未测量（基线待建立） | 建立基线后降低 50% | 用户测试（Secondary KPI） |
| P0 规范覆盖已知 BUG 场景数 | 0/N | 100% | 逐一映射 BUG 列表 |
| 所有 skill 执行有标准化状态提示 | 无 | 100% | 代码审查 |

---

## 2. 用户故事

| 角色 | 目标 | 收益 | 旅程入口 |
| --- | --- | --- | --- |
| 新用户（首次使用） | 5 分钟内选出正确 skill | 不走弯路，首次成功率 ≥ 80% | docs/standards/README.md |
| 日常使用者 | 在并发/复杂场景下得到明确操作指引 | 避免状态冲突和运行时错误 | docs/standards/user-guide.md |
| 框架贡献者 | 按统一模板新增 skill/agent/hook | 一次通过代码审查 | docs/standards/contribution-guide.md |
| 框架维护者 | 快速定位 BUG 根因并有规范可依 | 减少排查时间，修复有据可查 | docs/standards/runtime-protection.md |

---

## 3. 用户旅程地图

### 3.1 新用户旅程

```
入口: docs/standards/README.md（单一入口）
  |
  v
Step 1: 阅读"我应该用什么？"决策树（目标：30 秒定位类别）
  |
  v
Step 2: 按意图关键词查找对应 skill（目标：2 分钟）
  |
  v
Step 3: 查看 skill 示例命令（目标：1 分钟）
  |
  v
Step 4: 执行，观察标准化状态提示（进度/成功/错误）
  |
  v
退出: 任务完成 或 查看 anti-patterns.md 排查问题
```

### 3.2 贡献者旅程

```
入口: docs/standards/contribution-guide.md
  |
  v
Step 1: 确认新增类型（skill / agent / hook）
  |
  v
Step 2: 复制对应标准模板
  |
  v
Step 3: 按检查清单（必须项 ≤ 5 条）逐项完成
  |
  v
Step 4: 提交 PR，CI 自动验证检查清单覆盖率
  |
  v
退出: CI 通过 或 按 CI 报错修复
```

### 3.3 维护者旅程

```
入口: 收到 BUG 报告 或 运行时异常
  |
  v
Step 1: 查看 docs/standards/anti-patterns.md 匹配已知模式
  |
  v
Step 2: 查看 docs/standards/runtime-protection.md 定位规范
  |
  v
Step 3: 查看 docs/standards/state-machine.md 确认状态转换
  |
  v
退出: 修复完成，更新对应规范文档
```

---

## 4. 高层需求

### 前置任务 P-1（阻塞所有 P0 任务）

**现有实现审计**

在编写任何规范之前，必须完成对现有实现的全面审计，确保规范从代码反向提取而非凭空撰写。

审计范围：
- `src/hooks/bridge.ts`：提取完整 HookType 定义（已知 15 类）
- `src/hooks/mode-registry/index.ts`：提取状态机转换规则、stale marker 阈值（1 小时）、互斥模式检测
- `src/agents/definitions.ts`：提取 AgentConfig 类型定义和生命周期约束
- `src/hooks/subagent-tracker/index.ts`：提取并发保护机制（debounce、flushInProgress、mergeTrackerStates）
- `src/lib/atomic-write.ts`：提取原子写入实现细节
- `src/hooks/guards/pre-tool.ts`、`post-tool.ts`：提取 hook 执行顺序
- `src/hooks/persistent-mode/index.ts`：提取 Stop 阶段优先级规则

审计产出：`docs/standards/audit-report.md`（临时文件，审计完成后归档）

验收条件：审计报告列出所有与 Draft PRD 描述不符的差异点，差异点数量 ≥ 0（即使无差异也需明确记录）

---

### P0 - 运行时防护规范（必须交付，与 Skill 决策树并行）

#### P0-1：Hook 执行顺序规范

**核心规则草稿（至少 3 条可执行规则）：**

规则 1 — Hook 类型完整分类（来自 `src/hooks/bridge.ts`）：

规范必须覆盖以下全部 15 个 HookType，不得遗漏：

```
UserPromptSubmit 阶段：
  - keyword-detector

Stop 阶段（优先级从高到低）：
  - ralph（最高优先级）
  - persistent-mode（含 ultrawork，次优先级）
  - stop-continuation（最低优先级）

Session 生命周期：
  - session-start
  - session-end

工具调用生命周期：
  - pre-tool-use
  - post-tool-use

Agent 生命周期：
  - subagent-start
  - subagent-stop
  - autopilot

系统维护：
  - pre-compact
  - setup-init
  - setup-maintenance
  - permission-request
```

规则 2 — Stop 阶段优先级链（来自 `src/hooks/persistent-mode/index.ts` 第 11 行注释）：

Stop 阶段有三个 hook 竞争处理权，优先级为：`Ralph > Ultrawork > Todo-Continuation`。高优先级 hook 处理后，低优先级 hook 不得重复处理同一 Stop 事件。

规则 3 — Hook 失败降级策略：

大多数 hook 失败时返回 `{ continue: true }`（静默降级），这是设计选择而非疏漏，理由是 hook 不应阻塞用户工作流。以下 hook 类型例外，失败时必须阻塞：`permission-request`（安全边界，不可静默降级）。

规则 4 — Hook 输入消毒（安全边界，不可协商）：

所有 hook 输入必须经过 `bridge-normalize.ts` 的白名单过滤。当前白名单覆盖 `permission-request`、`setup`、`session-end` 三类，规范要求扩展至全部 15 类 HookType。未在白名单中的字段必须被丢弃，不得透传。

规则 5 — Hook 超时处理：

当前代码未见明确超时限制，规范要求：PreToolUse hook 超时（默认 5s）时，Claude 继续执行工具调用（不阻塞）；PostToolUse hook 超时时，状态写入标记为"待重试"，不回滚已执行的工具调用。

#### P0-2：状态文件读写规范

**核心规则草稿：**

规则 1 — 原子写入强制要求（来自 `src/lib/atomic-write.ts`）：

所有状态文件写入必须使用 `atomicWriteJsonSync` 或 `atomicWriteJson`，禁止直接使用 `fs.writeFileSync`。原子写入流程：独占创建临时文件（`wx` 标志）→ `fsync` 落盘 → `rename` 替换。

规则 2 — 各状态文件并发保护级别（不一致性说明）：

| 状态文件 | 并发保护机制 | 说明 |
|---------|------------|------|
| `subagent-tracking.json` | debounce（100ms）+ flushInProgress + mergeTrackerStates | 最高保护级别 |
| `team-state.json` | atomicWriteJsonSync | 无 debounce 层 |
| `ralph-state.json` | atomicWriteJsonSync | 无 debounce 层 |
| 其他 `*-state.json` | atomicWriteJsonSync | 无 debounce 层 |

规范目标：v1 明确记录此不一致性；v2 统一为 debounce + atomic 双层保护。

规则 3 — Windows 平台差异（来自代码注释）：

Windows 上 `fs.rename` 使用 `MoveFileExW with MOVEFILE_REPLACE_EXISTING`，当目标文件被其他进程持有时会失败（不同于 POSIX 的原子替换语义）。`src/lib/atomic-write.ts` 已处理此情况（rename 后尝试目录级 fsync，Windows 上可能失败，代码已捕获异常）。规范必须明确记录此平台差异，实现者不得假设 Windows 和 POSIX 行为一致。

规则 4 — 路径安全（安全边界，不可协商）：

`mode` 参数必须通过白名单校验，禁止直接拼接到文件路径。合法 mode 值白名单：`autopilot`、`ultrapilot`、`team`、`pipeline`、`ralph`、`ultrawork`、`ultraqa`。任何不在白名单中的 mode 值必须被拒绝，返回错误，不得写入文件系统。

规则 5 — 状态文件损坏恢复：

检测到损坏 JSON 时的恢复流程：尝试读取 → JSON.parse 失败 → 记录错误到 `last-tool-error.json` → 使用空状态初始化（不崩溃）。部分写入检测：文件大小为 0 或 JSON 不完整时，视为损坏。

规则 6 — 敏感数据处理：

`agent-replay-*.jsonl` 文件包含完整 agent 对话历史，可能含有代码、密钥片段。规范要求：文件权限设置为 600（仅所有者可读写）；数据保留期限 7 天，超期自动清理；不得将此类文件提交到 git（`.gitignore` 已覆盖 `.omc/` 目录，需验证）。

#### P0-3：Agent 生命周期规范

**核心规则草稿：**

规则 1 — 完整状态机定义（修正 Draft 中的死状态）：

```
[*] --> SPAWNED : Task() 调用
SPAWNED --> RUNNING : 工具调用开始
RUNNING --> WAITING : 等待用户输入
WAITING --> RUNNING : 收到输入（超时 5min 后强制转 TIMEOUT）
WAITING --> TIMEOUT : 等待超时（5 分钟）
TIMEOUT --> SHUTDOWN : 超时强制退出
RUNNING --> IDLE : 当前 turn 结束
IDLE --> RUNNING : 收到新消息
IDLE --> SHUTDOWN : shutdown_request 或 最大存活时间到期
RUNNING --> ERROR : 异常/超时
ERROR --> SHUTDOWN : 错误处理完成（超时 30s 后强制转 ZOMBIE）
ERROR --> ZOMBIE : 错误处理超时（30 秒）
ZOMBIE --> [*] : 状态文件清理完成
SHUTDOWN --> [*]
```

规则 2 — SDK 平台限制（来自 `src/hooks/subagent-tracker/index.ts` 第 102 行）：

`SubagentStopInput.success` 字段已废弃（`@deprecated`），Claude Code SDK 不提供 agent 是否成功完成的直接信号。当前实现依赖推断（inferred status）。规范实现者不得假设可以直接读取成功/失败状态，必须使用推断机制。

规则 3 — Agent 边界情况矩阵（来自 `src/hooks/subagent-tracker/index.ts`）：

| 边界情况 | 触发条件 | 处理策略 |
|---------|---------|---------|
| 超时 | `STALE_THRESHOLD_MS = 5 * 60 * 1000`（5 分钟） | 标记为 stale，触发清理 |
| 孤儿状态 | 父 session 结束但 agent 仍在运行 | session-end hook 触发孤儿检测，强制 SHUTDOWN |
| 成本超限 | `COST_LIMIT_USD = 1.0` | 触发强制终止，记录到 last-tool-error.json |
| 死锁检测 | `DEADLOCK_CHECK_THRESHOLD = 3`（连续 3 次相同工具调用） | 触发 AgentIntervention，中断执行 |

---

### P0-并行：Skill 调用决策树（与 P0 同优先级）

**决策树原型设计（3 层结构，第一层基于用户意图）：**

```
第一层：用户意图分类（5 个分支）
  |
  +-- A. 我想从零构建一个功能/项目
  |     -> 第二层：规模判断
  |         |-- 单文件/简单 -> executor (sonnet)
  |         |-- 多文件/复杂 -> autopilot 或 team
  |         +-- 需要持续执行不中断 -> ralph
  |
  +-- B. 我想分析/调试/排查问题
  |     -> 第二层：问题类型
  |         |-- 代码 BUG/根因 -> debugger
  |         |-- 构建/类型错误 -> build-fixer
  |         +-- 数据分析 -> scientist
  |
  +-- C. 我想规划/设计/评审
  |     -> 第二层：输出类型
  |         |-- 执行计划 -> planner
  |         |-- 架构设计 -> architect
  |         |-- 批判性评审 -> critic 或 plan --review
  |         +-- 需要多方共识 -> ralplan
  |
  +-- D. 我想查找信息/文档
  |     -> 第二层：信息来源
  |         |-- 代码库内部 -> explore
  |         |-- 外部 SDK/API 文档 -> dependency-expert 或 Context7 MCP
  |         +-- 网络搜索 -> external-context
  |
  +-- E. 我想执行特定专业任务
        -> 第二层：任务类型
            |-- 代码审查 -> code-reviewer
            |-- 安全审查 -> security-reviewer
            |-- 测试策略 -> test-engineer
            |-- UI/UX 设计 -> designer
            |-- 数据库 -> database-expert
            +-- 其他专业角色 -> 查阅 agent 目录

第三层（仅在第二层仍有歧义时）：
  - autopilot vs team：单次完成用 autopilot，需要多 agent 协作用 team
  - executor vs deep-executor：标准实现用 executor，复杂自主任务用 deep-executor
  - ask_codex vs ask_gemini：代码分析/架构用 codex，UI/大上下文用 gemini
```

**决策树呈现形式**：以"意图关键词 -> skill 名称"对照表形式呈现，配合示例命令，嵌入 `docs/standards/user-guide.md`。

**歧义输入处理规则**：
- 用户输入同时匹配多个 skill 触发词时，按 CLAUDE.md 中的冲突解决规则处理（显式模式关键词覆盖默认值）
- 用户输入不匹配任何分支时，fallback 到 orchestrator 直接处理（简单澄清/快速状态检查）
- `autopilot` 和 `ultrapilot` 互斥，决策树中明确标注

---

### P1 - 用户使用规范

#### P1-1：Agent 路由规范

明确各 agent 角色的适用场景边界，包含第四个选择路径：orchestrator 直接处理。

四个路由选项：
1. **直接处理**（orchestrator 自身）：简单澄清、快速状态检查、单命令顺序操作
2. **skill**：有明确触发词的标准化工作流
3. **agent**：需要专业提示词的工作（实现、分析、审查等）
4. **MCP 工具**：只读分析任务（文档查找、架构分析、UI 设计）

#### P1-2：常见反模式清单

每条反模式格式：错误现象描述 + 根因 + 正确做法 + 示例对比（Bad vs Good）。

至少覆盖以下 10 个反模式（从 CHANGELOG 和已知 BUG 反推）：
1. 用 executor 做分析任务（应用 debugger/analyst）
2. 用 autopilot 做简单单步操作（应直接处理）
3. 并发写入同一状态文件（应使用 atomicWriteJsonSync）
4. mode 参数未校验直接拼接路径（路径遍历风险）
5. 忽略 hook 失败直接继续（permission-request 类型不可静默降级）
6. 假设 SubagentStopInput.success 可用（SDK 已废弃）
7. 在 Windows 上假设 rename 是原子操作（平台差异）
8. 修改 CLAUDE.md 不做回归验证（影响所有 agent 运行时行为）
9. 新增 skill 不写触发词（导致 skill 无法被检测到）
10. 在 Team 模式下跳过 team-prd 阶段（缺少验收标准导致 team-exec 无法验证完成）

#### P1-3：系统反馈标准

所有 skill 执行必须有标准化状态提示，格式如下：

```
进度提示：[skill名称] 正在执行：[当前步骤描述]
成功提示：[skill名称] 完成：[结果摘要]
错误提示：[skill名称] 失败：[错误描述] | 建议：[恢复操作]
等待提示：[skill名称] 等待：[等待原因] | 超时：[N 分钟]
```

---

### P2 - 开发贡献规范

#### P2-1：Skill 标准模板

包含：触发词列表、约束条件、输出格式、测试用例（至少 2 个）、版本兼容性声明。

#### P2-2：Agent 标准模板

包含：角色定义、工具权限列表、输入契约、输出契约、错误处理策略。

#### P2-3：Hook 标准模板

包含：HookType 声明、必需字段（来自白名单）、可选字段、失败降级策略（静默 or 阻塞）。

#### P2-4：贡献检查清单

分为"必须项"（≤ 5 条，CI 自动验证）和"建议项"：

**必须项（CI 门禁）：**
1. 触发词已在 CLAUDE.md 中注册
2. 有至少 1 个测试用例
3. 版本兼容性已声明（支持的最低 ultrapower 版本）
4. 使用了对应标准模板
5. Impact Scope 已在 manifest.md 中声明

**建议项（人工审查）：**
- 有 Bad vs Good 示例对比
- 有错误恢复路径说明
- 有性能影响说明（如涉及并发）

---

## 5. 安全边界（不可协商）

### 5.1 路径遍历防护

`mode` 参数白名单：`autopilot`、`ultrapilot`、`team`、`pipeline`、`ralph`、`ultrawork`、`ultraqa`。

实现要求：在 `src/lib/` 中提供 `validateMode(mode: string): boolean` 工具函数，所有状态文件路径构建必须经过此函数校验。

### 5.2 Hook 输入消毒

`bridge-normalize.ts` 的白名单过滤必须扩展至全部 15 类 HookType。每类 HookType 的必需字段和禁止字段必须在规范中明确列出。

### 5.3 状态文件权限

`agent-replay-*.jsonl` 等包含敏感上下文的文件，创建时权限设置为 600。`.omc/` 目录已在 `.gitignore` 中，需在 CI 中验证此配置未被覆盖。

---

## 6. 非功能需求

| 类别 | 要求 |
| --- | --- |
| 可读性 | 所有规范文档使用中文，代码示例使用英文 |
| 可维护性 | 规范文档与代码同仓库，随版本迭代更新 |
| 向后兼容 | P0/P1 规范不得破坏现有 v5.0.x 用户的使用习惯；若修复并发 BUG 导致时序变化，必须在 CHANGELOG 中明确说明 |
| 可发现性 | 规范入口在 README 和 CLAUDE.md 中有明确链接，单一入口为 docs/standards/README.md |
| Windows 兼容性 | 所有涉及文件操作的规范必须说明 Windows 平台行为差异（rename 语义、文件锁、路径分隔符） |
| 规范执行机制 | 明确哪些规范通过 CI 自动强制，哪些通过 review 流程保障（见第 8 节） |
| 规范版本化 | 规范文档版本号与 npm 版本号绑定，每次 minor 版本升级必须更新规范 changelog |
| CLAUDE.md 修改策略 | 仅追加，不删除现有规则；修改后必须进行集成测试回归验证 |

---

## 7. 验收标准（重写版）

| 编号 | 验收项 | 通过条件 | 验证方法 |
| --- | --- | --- | --- |
| AC-01 | P0 规范覆盖已知 BUG 场景 | 规范条目与 BUG 列表逐一映射，覆盖率 = 已知 BUG 数量 / 规范覆盖数量 ≥ 100% | 人工映射检查，BUG 列表来自 CHANGELOG v5.0.9~v5.0.21 |
| AC-02 | 新用户首次选出正确 skill 的时间 | 建立基线后，使用决策树的用户比无决策树的用户快 ≥ 50%；准确率 ≥ 80% | 用户测试：3 个典型场景（简单实现/复杂分析/贡献新 skill），新用户定义为"从未使用过 ultrapower v5.x" |
| AC-03 | 新增 skill 检查清单覆盖率 | CI 验证通过率 = 100%（必须项全部满足） | CI 自动验证（Primary KPI） |
| AC-04 | Hook 类型规范完整性 | 规范覆盖的 HookType 数量 = bridge.ts 中定义的 HookType 数量（当前 15 个） | 自动化脚本：从 bridge.ts 提取 HookType 列表，与规范文档对比 |
| AC-05 | 系统反馈标准化 | 所有 skill 执行均有标准化状态提示（进度/成功/错误/等待四种格式） | 代码审查：检查所有 skill 实现是否使用标准提示格式 |
| AC-06 | 规范执行机制 | CI 门禁覆盖贡献检查清单的全部 5 个必须项；CI 通过率可在 PR 中可见 | CI 配置审查 + 实际 PR 验证 |

---

## 8. 规范执行机制

### 8.1 自动化强制（CI 门禁）

以下规范通过 CI 自动强制执行（v1 必交付）：

| 规范项 | CI 检查内容 |
|--------|-----------|
| 贡献检查清单必须项 | 新增 skill/agent/hook 的 PR 必须包含触发词注册、测试用例、版本声明 |
| mode 参数白名单 | 静态分析：检查是否有未经 validateMode 校验的 mode 参数路径拼接 |
| .omc/ gitignore | 验证 .gitignore 包含 .omc/ 目录，防止敏感文件提交 |
| HookType 完整性 | 自动对比 bridge.ts 中的 HookType 定义与规范文档，检测遗漏 |

### 8.2 人工审查保障

以下规范通过 PR review 流程保障：

- CLAUDE.md 修改（需要集成测试回归验证）
- 规范文档内容质量（Bad vs Good 示例、错误恢复路径）
- 跨平台兼容性说明

### 8.3 规范版本化策略

- 规范文档在文件头部声明 `ultrapower-version: x.y.z`
- 每次 minor 版本升级（如 v5.0.x -> v5.1.0）必须更新规范 changelog
- 废弃的规范条目标记 `@deprecated`，保留 2 个 minor 版本后删除

---

## 9. Impact Scope（影响文件范围）

**新增文件（规范文档）：**

| 文件 | 优先级 | 说明 |
|------|--------|------|
| `docs/standards/README.md` | P0 | 规范体系单一入口，索引所有规范文档 |
| `docs/standards/audit-report.md` | P-1（前置） | 现有实现审计报告（临时文件） |
| `docs/standards/runtime-protection.md` | P0 | 运行时防护规范（含安全边界） |
| `docs/standards/hook-execution-order.md` | P0 | Hook 执行顺序规范（15 类 HookType） |
| `docs/standards/state-machine.md` | P0 | 状态机规范（含 Team Pipeline 转换矩阵） |
| `docs/standards/agent-lifecycle.md` | P0 | Agent 生命周期规范（含边界情况矩阵） |
| `docs/standards/user-guide.md` | P0-并行 | 用户使用规范（含 Skill 决策树） |
| `docs/standards/anti-patterns.md` | P1 | 常见反模式清单（10 条，Bad vs Good 格式） |
| `docs/standards/contribution-guide.md` | P1 | 开发贡献规范（含 CI 门禁说明） |
| `docs/standards/templates/skill-template.md` | P2 | Skill 标准模板 |
| `docs/standards/templates/agent-template.md` | P2 | Agent 标准模板 |
| `docs/standards/templates/hook-template.md` | P2 | Hook 标准模板 |

**修改文件：**

| 文件 | 修改内容 | 风险 |
|------|---------|------|
| `README.md` | 添加规范文档入口链接 | 低 |
| `CLAUDE.md` | 添加规范引用（仅追加，不删除） | 高（影响所有 agent 运行时行为，需集成测试回归） |
| `src/lib/validateMode.ts` | 新增 mode 参数白名单校验工具函数 | 低（新增文件） |

**不在范围内（v2 延期）：**
- 自动化规范检查 lint 插件
- 英文版规范文档
- 视频教程/交互式引导
- 规范覆盖率度量仪表盘
- 历史 BUG 的规范回溯标注
- 模板转为可执行脚手架脚本（技术债务 TD-3）

---

## 10. 实现计划

### 阶段 0：现有实现审计（2 天，阻塞后续所有阶段）

- 审计 `src/hooks/bridge.ts`、`mode-registry/index.ts`、`agents/definitions.ts`、`subagent-tracker/index.ts`、`atomic-write.ts`
- 产出 `docs/standards/audit-report.md`
- 验收：差异点列表完整，与 Draft PRD 的不符项全部记录

### 阶段 1：P0 规范提取（3-4 天，与阶段 2 并行）

- 从代码反向提取，撰写：`runtime-protection.md`、`hook-execution-order.md`、`state-machine.md`、`agent-lifecycle.md`
- 同步实现 `src/lib/validateMode.ts`（mode 参数白名单）

### 阶段 2：Skill 决策树（2-3 天，与阶段 1 并行）

- 撰写 `user-guide.md`（含决策树原型、意图关键词对照表）
- 撰写 `anti-patterns.md`（10 条反模式，Bad vs Good 格式）

### 阶段 3：贡献规范与模板（2 天）

- 撰写 `contribution-guide.md`（含 CI 门禁说明）
- 撰写 3 个模板文件（skill/agent/hook）
- 撰写 `docs/standards/README.md`（目录索引）

### 阶段 4：集成与验证（1-2 天）

- 更新 `README.md` 指向新规范
- 审慎修改 `CLAUDE.md`（仅追加）
- 配置 CI 门禁（贡献检查清单 5 个必须项）
- 人工验证：用新模板创建 demo skill，确认模板可用
- 集成测试：验证 CLAUDE.md 修改未破坏现有 agent 行为

**总估算工时**：8-11 天（1 名工程师）

---

## 11. 技术债务预规划

| 编号 | 内容 | 优先级 | 建议处理时机 |
|------|------|--------|------------|
| TD-1 | 规范与代码同步机制（CI 检查 mode-registry 路径与 state-machine.md 一致性） | 中 | v1 CI 门禁阶段一并处理 |
| TD-2 | CLAUDE.md 变更记录机制（当前无 changelog） | 短期 | 阶段 4 前建立 |
| TD-3 | 模板转为可执行脚手架脚本 | 中 | v2 |
| TD-4 | 并发写入统一为 debounce + atomic 双层保护 | 短期 | v1 阶段 1 一并处理 |

---

## 12. 暂不包含（v2 延期）

- 自动化规范合规检查 lint 插件
- 英文版规范文档
- 视频教程或交互式引导
- 规范覆盖率度量仪表盘
- 历史 BUG 的规范回溯标注
- 模板脚手架脚本化（TD-3）
