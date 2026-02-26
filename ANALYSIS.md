# Hephaestus 与 Deep-Executor：全面对比

## 执行摘要

**Hephaestus**（oh-my-opencode）和 **Deep-Executor**（ultrapower）都是为复杂、目标导向的软件工程任务设计的自主深度工作智能体。Deep-Executor 明确从 Hephaestus 移植而来（PR #1287），但已适配 ultrapower 框架。

**核心发现：** Deep-Executor 成功捕捉了 Hephaestus 的核心理念，但在委托架构、工具生态系统和验证协议方面存在显著差异。

---

## 1. 核心身份与理念

### Hephaestus（OMO）
- **身份**："高级工程师" - 神圣工匠（希腊神话）
- **理念**："精准、最小化、恰到好处" - 铁匠大师的精确
- **方式**：受 AmpCode 深度模式启发的目标导向自主执行
- **标语**："合法的工匠"

### Deep-Executor（OMC）
- **身份**："自包含的深度工作者" - 熔炉本身
- **理念**："原材料进去，成品出来"
- **方式**：探索优先行为，100% 完成保证
- **标语**："熔炉"

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **隐喻** | 工匠/铁匠 | 熔炉（工具本身） |
| **主体性** | 做决策的高级工程师 | 使用工具执行的工作者 |
| **侧重点** | 精确性和工艺 | 自给自足和完成度 |

**分析：** 两者共享相同的哲学基础，但框架不同。Hephaestus 强调**工匠主体性**，而 Deep-Executor 强调**工具自主性**。

---

## 2. 委托与智能体编排

### Hephaestus（OMO）
- **可以委托**给专业智能体（explore、librarian）
- **委托模板**：6 节强制结构（TASK、EXPECTED OUTCOME、REQUIRED TOOLS、MUST DO、MUST NOT DO、CONTEXT）
- **并行探索**：在执行前启动 2-5 个后台探索智能体
- **会话连续性**：跨多轮委托复用会话 ID
- **工具限制**：不能使用 `task` 或 `delegate_task` 工具
- **权限**：允许提问；拒绝 OMO 智能体调用

**委托理念：**
```
"Vague prompts = rejected. Be exhaustive."
"Never block on exploration results - fire and continue"
"Verify delegated work independently - don't trust self-reports"
```

### Deep-Executor（OMC）
- **不能委托** - 完全阻止生成智能体
- **仅自执行**：广泛使用自身工具
- **无后台智能体**：所有探索使用自身工具同步完成
- **被阻止的工具**：Task 工具被阻止，智能体生成被阻止

**执行理念：**
```
"You work ALONE. You are the forge."
"Use YOUR OWN tools extensively."
```

### 对比
| 能力 | Hephaestus | Deep-Executor |
|------------|------------|---------------|
| **委托** | 是（通过 6 节模板） | 否（硬性阻止） |
| **并行智能体** | 2-5 个后台 explore/librarian | 无 |
| **会话连续性** | 是（会话 ID 复用） | 不适用（无委托） |
| **工具生态** | 可调用专业智能体 | 仅使用自身工具 |

**关键差异：** 这是**最大的**架构分歧。Hephaestus 编排后台探索，而 Deep-Executor 是自包含的工作者。

**为何重要：**
- Hephaestus 可以跨多个更便宜的模型扩展探索
- Deep-Executor 心智模型更简单，但 token 成本更高
- Hephaestus = "编排者-执行者混合体"
- Deep-Executor = "纯执行者"

---

## 3. 意图分类与门控

### Hephaestus（OMO）
**5 类分类（阶段 0）：**
1. **Trivial** - 快速、明显，<10 行
2. **Explicit** - 清晰指令，具体目标
3. **Exploratory** - "X 是如何工作的？"，调查性
4. **Open-ended** - "改进"、"增强"，模糊需求
5. **Ambiguous** - 多种解释

**探索优先协议：**
- 歧义触发调查，而非澄清问题
- 问题是"最后手段"，在穷尽所有工具后才使用

### Deep-Executor（OMC）
**3 类分类（意图门控）：**
1. **Trivial** - 单文件，明显修复 → 最小探索
2. **Scoped** - 清晰边界，2-5 个文件 → 定向探索
3. **Complex** - 多系统，范围不清 → 完整周期

**探索深度：**
- 分类决定探索深度
- 非简单任务仍采用探索优先

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **类别数** | 5（更细粒度） | 3（简化） |
| **门控执行** | 阶段 0 强制分类 | 意图门控第一步 |
| **提问策略** | 穷尽所有工具后的最后手段 | 类似（隐含） |

**分析：** Deep-Executor 简化了分类方案，同时保留了核心的探索优先理念。从 5 类减少到 3 类使决策更快，但可能不够细致。

---

## 4. 执行循环与工作流

### Hephaestus（OMO）
**EXPLORE → PLAN → DECIDE → EXECUTE**

1. **EXPLORE**：启动 2-5 个并行后台智能体（explore/librarian）
2. **PLAN**：创建明确的工作计划，识别所有文件/依赖
3. **DECIDE**：确定直接执行还是委托
4. **EXECUTE**：实现或委托并验证

**特点：**
- 并行探索（非阻塞）
- 明确的规划阶段
- 委托决策点
- 独立验证委托工作

### Deep-Executor（OMC）
**EXPLORE → PLAN → EXECUTE → VERIFY**

1. **EXPLORE**：使用自身工具（Glob、Grep、Read、ast_grep_search）
2. **PLAN**：创建心智模型 + 多步骤的 TodoWrite
3. **EXECUTE**：使用 Edit/Write/Bash 直接实现
4. **VERIFY**：每次变更后（lsp_diagnostics、构建、测试）

**特点：**
- 顺序工具使用（阻塞）
- 心智模型 + todos
- 仅直接执行
- 每次变更的验证循环

### 对比
| 阶段 | Hephaestus | Deep-Executor |
|-------|------------|---------------|
| **探索** | 并行后台智能体 | 顺序自身工具 |
| **规划** | 明确计划文档 | 心智模型 + todos |
| **决策** | 执行策略选择 | 不适用（始终自执行） |
| **执行** | 直接或委托 | 仅直接 |
| **验证** | 最终 + 委托工作 | 每次变更 + 最终 |

**关键洞察：** Hephaestus 有**决策分支**（执行 vs 委托），而 Deep-Executor 有**线性流水线**。

---

## 5. 探索工具与策略

### Hephaestus（OMO）
**探索智能体：**
- **Explore agent**（gpt-5-nano）：快速 grep 内部代码库
- **Librarian agent**（big-pickle）：外部文档、GitHub、OSS 研究
- **执行方式**：后台并行（2-5 个智能体）
- **框架**："Grep，而非顾问"

**工具策略：**
```
"Fire 2-5 parallel exploration tasks using faster, cheaper models"
"Never block on results - gather context while planning"
```

### Deep-Executor（OMC）
**自身工具：**
- `Glob` - 按模式查找文件
- `Grep` - 按正则表达式搜索内容
- `Read` - 读取文件内容
- `ast_grep_search` - 结构化代码搜索
- `lsp_diagnostics` - 检查文件健康状态

**探索问题（全部回答）：**
1. 此功能在哪里实现？
2. 此代码库使用什么模式？
3. 此区域存在哪些测试？
4. 依赖关系是什么？
5. 如果我们修改此处，什么可能会出错？

**工具策略：**
```
1. Start with Glob to map file landscape
2. Use Grep to find patterns, imports, usages
3. Read the most relevant files thoroughly
4. Use ast_grep_search for structural patterns
5. Synthesize findings before proceeding
```

### 对比
| 能力 | Hephaestus | Deep-Executor |
|------------|------------|---------------|
| **探索方式** | 委托给专业智能体 | 直接使用自身工具 |
| **并行性** | 2-5 个后台智能体 | 顺序工具调用 |
| **模型效率** | 探索使用更便宜的模型 | 始终使用昂贵模型 |
| **外部研究** | Librarian 用于文档/OSS | 无外部研究能力 |
| **工具框架** | "Grep 而非顾问" | 结构化探索问题 |

**成本影响：**
- Hephaestus：将探索卸载到更便宜的模型（gpt-5-nano、big-pickle）
- Deep-Executor：所有探索使用昂贵的 Opus 模型
- **结论**：Hephaestus 在探索密集型任务中 token 效率更高

---

## 6. MCP 工具与语言服务器集成

### Hephaestus（OMO）
**LSP 工具：**
- 可用，但在提示中强调较少
- 是项目描述中"精心设计的 LSP/AST 工具"的一部分
- 集成到验证工作流中

**AST 工具：**
- `ast_grep` 可用于结构化搜索/替换
- 强调用于精准重构

### Deep-Executor（OMC）
**LSP 工具（明确策略）：**
- `lsp_diagnostics` - 单文件错误/警告
- `lsp_diagnostics_directory` - 项目级类型检查
- 在"MCP 工具策略"部分重点强调
- 明确指导何时使用各工具

**AST 工具（明确工作流）：**
- `ast_grep_search` - 按形状查找代码
- `ast_grep_replace` - 转换模式
- **强制工作流**：dryRun=true → 审查 → dryRun=false → 验证

### 对比
| 工具 | Hephaestus | Deep-Executor |
|------|------------|---------------|
| **LSP 诊断** | 可用 | 明确策略 + 指导 |
| **LSP 目录检查** | 可用 | 多文件变更时强制 |
| **AST 搜索** | 可用 | 集成到探索阶段 |
| **AST 替换** | 可用 | 强制 dryRun 工作流 |
| **文档** | 隐含 | 明确表格 + 工作流 |

**分析：** Deep-Executor 提供了**更明确的 MCP 工具使用指导**，使模型更容易正确应用它们。`ast_grep_replace` 的强制 dryRun 工作流是 Hephaestus 中未明确说明的宝贵安全模式。

---

## 7. 验证与完成协议

### Hephaestus（OMO）
**完成标准（所有条件必须为真）：**
1. 所有请求的功能完全按规格实现
2. `lsp_diagnostics` 对所有修改文件返回零错误
3. 构建命令以代码 0 退出（如适用）
4. 测试通过（或记录已有失败）
5. 无临时/调试代码残留
6. 代码与现有代码库模式匹配（通过探索验证）
7. 为每个验证步骤提供证据

**证据格式：**
```
Evidence documented for each verification step
```

**验证理念：**
```
"NEVER trust 'I'm done'—verify outputs"
"Verify delegated work independently - don't trust self-reports"
```

### Deep-Executor（OMC）
**验证协议：**

**每次变更后：**
1. 对修改文件运行 `lsp_diagnostics`
2. 检查损坏的导入/引用

**声明完成前：**
1. 所有 TODO 完成（零 pending/in_progress）
2. 测试通过（通过 Bash 获取新鲜测试输出）
3. 构建成功（通过 Bash 获取新鲜构建输出）
4. `lsp_diagnostics_directory` 干净

**证据格式：**
```
VERIFICATION EVIDENCE:
- Build: [command] -> [pass/fail]
- Tests: [command] -> [X passed, Y failed]
- Diagnostics: [N errors, M warnings]
```

**完成摘要模板：**
```markdown
## Completion Summary

### What Was Done
- [Concrete deliverable 1]
- [Concrete deliverable 2]

### Files Modified
- `/absolute/path/to/file1.ts` - [what changed]
- `/absolute/path/to/file2.ts` - [what changed]

### Verification Evidence
- Build: [command] -> SUCCESS
- Tests: [command] -> 42 passed, 0 failed
- Diagnostics: 0 errors, 0 warnings

### Definition of Done
[X] All requirements met
[X] Tests pass
[X] Build succeeds
[X] No regressions
```

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **完成标准** | 7 条（全面） | 4 条（聚焦） |
| **证据格式** | 有描述但无模板 | 明确的 markdown 模板 |
| **每次变更验证** | 未明确要求 | 每次变更后必须执行 |
| **Todo 集成** | 未提及 | 明确的 todo 完成检查 |
| **模板结构** | 无模板 | 4 节完成摘要 |

**关键差异：** Deep-Executor 有**更结构化的输出预期**，带有明确的 markdown 模板，而 Hephaestus 更抽象地描述要求。

**Deep-Executor 的优势：** 明确的完成摘要模板使验证智能体是否完成了全面工作变得更容易。

**Hephaestus 的优势：** 7 条标准检查清单更全面（包括模式匹配验证和临时代码清理）。

---

## 8. TODO 纪律与任务管理

### Hephaestus（OMO）
**提示中未明确提及**

重点在于验证和完成，但没有关于 TODO 管理或任务分解的具体指导。

### Deep-Executor（OMC）
**TODO 纪律（不可妥协）：**
- 2+ 步骤 → 首先创建 TodoWrite 并进行原子分解
- 开始前标记 `in_progress`（每次一个）
- 每步完成后立即标记 `completed`
- 绝不批量完成
- 结束前重新验证 todo 列表

**与验证的集成：**
- "所有 TODO 完成（零 pending/in_progress）"是声明完成前的必要标准

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **TODO 使用** | 未提及 | 2+ 步骤时强制 |
| **TODO 纪律** | 不适用 | 明确规则（每次一个，立即完成） |
| **验证集成** | 不适用 | Todo 完成是验证标准 |

**分析：** 这是 Deep-Executor 中的**重要补充**，提供了更好的进度跟踪和用户可见性。Hephaestus 依赖隐式任务管理，而 Deep-Executor 使其明确且强制执行。

**为何重要：** TODO 提供：
1. **用户可见性** - 用户可以实时看到进度
2. **智能体专注** - 强制原子化思考
3. **完成验证** - 声明完成前的清晰检查点

---

## 9. 失败恢复与错误处理

### Hephaestus（OMO）
**失败恢复协议：**
- 咨询 Oracle 前最多 3 次迭代
- 连续 3 次失败后：
  1. 立即停止所有编辑
  2. 回退到最后已知的工作状态
  3. 记录尝试和失败
  4. 携带完整上下文咨询 Oracle
  5. 继续前询问用户

**理念：**
```
"Never leave code broken; never shotgun debug"
```

### Deep-Executor（OMC）
**失败恢复：**
当被阻塞时：
1. **诊断**：具体是什么阻碍了进度？
2. **转向**：使用自身工具尝试替代方案
3. **报告**：如果真的卡住，解释尝试了什么以及什么失败了

**理念：**
```
"NEVER silently fail. NEVER claim completion when blocked."
```

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **最大尝试次数** | 升级前 3 次迭代 | 无明确限制 |
| **升级路径** | 咨询 Oracle（委托） | 向用户报告 |
| **回退策略** | 明确回退到最后工作状态 | 未提及 |
| **文档记录** | 记录所有尝试 | 解释尝试了什么 |

**关键差异：** Hephaestus 有**结构化的升级路径**（Oracle 咨询），而 Deep-Executor 只能向用户报告。

**Hephaestus 的优势：**
- 自动升级防止无限循环
- Oracle 咨询可以在无需用户干预的情况下解除阻塞
- 明确的回退策略防止代码处于损坏状态

**Deep-Executor 的优势：**
- 更简单的心智模型（无委托复杂性）
- 用户保留完全控制权

---

## 10. 代码质量标准与模式

### Hephaestus（OMO）
**代码质量要求：**
- **编写前搜索模式**：必须在现有代码库中搜索模式
- **最小化变更**："精准、最小化、恰到好处"
- **风格匹配**：代码必须与现有代码无法区分
- **ASCII 默认**：优先选择简单方案
- **先读后写**：编辑前始终读取文件
- **补丁应用**：使用足够的上下文进行唯一匹配

**理念：**
```
"Your code should be indistinguishable from a senior engineer's"
"No AI slop"
"Match existing project aesthetics"
```

### Deep-Executor（OMC）
**代码质量（反模式形式）：**
- 非简单任务不要跳过探索
- 不要在没有验证证据的情况下声明完成
- 不要为了"更快完成"而缩减范围
- 不要删除测试来让其通过
- 不要忽略错误或警告
- 不要在未验证的情况下使用"should"、"probably"、"seems to"

**理念（隐含）：**
```
"Explore extensively before acting"
"100% completion guarantee"
```

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **模式匹配** | 明确要求搜索 | 隐含在探索中 |
| **风格指导** | 详细（ASCII、最小化、匹配） | 未明确说明 |
| **质量框架** | 正面（应该做什么） | 负面（反模式） |
| **代码美学** | 强调 | 未提及 |

**分析：** Hephaestus 提供了**更明确的代码质量指导**，特别是在风格匹配和最小化变更方面。Deep-Executor 更注重**过程质量**（验证、完成），而非**代码美学**。

**Deep-Executor 的缺口：** 缺少以下明确指导：
- 如何匹配现有代码风格
- 最小化变更的偏好
- ASCII 默认值
- 实现前的模式搜索

---

## 11. 沟通风格与用户交互

### Hephaestus（OMO）
**沟通风格（硬性规则）：**
- **无状态更新**：立即开始工作，不说"我将处理..."
- **无奉承**：跳过对用户输入的赞美
- **简洁**：直接回答，无前言
- **尊重地挑战**：陈述顾虑 + 替代方案，询问是否继续

**主体性：**
```
"Judicious Initiative: Makes implementation decisions independently"
"May only ask questions after exhausting: direct tools, exploration agents,
librarian agents, context inference, technical problem-solving"
```

**角色：**
```
"Keep going until the query is completely resolved"
"Prohibited: intermediate checkpoints, asking permission to proceed,
stopping after partial implementation"
```

### Deep-Executor（OMC）
**沟通风格：**
- 提示中未明确定义
- 从理念中隐含：直接执行，最少交流

**完成输出：**
- 完成摘要的明确 markdown 模板
- 结构化证据呈现

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **风格规则** | 明确（4 条硬性规则） | 未定义 |
| **状态更新** | 禁止 | 未提及 |
| **提问策略** | 最后手段（先尝试 5 种替代方案） | 隐含探索优先 |
| **完成格式** | 无模板 | 明确的 markdown 模板 |

**分析：** Hephaestus 有**更有主见的沟通风格**，以优化效率并减少 token 浪费。Deep-Executor 注重**结构化输出**，而非对话风格。

**Deep-Executor 的缺口：** 缺少以下指导：
- 何时提问 vs 行动
- 沟通效率
- 状态更新策略

---

## 12. 模型配置与性能

### Hephaestus（OMO）
**模型：** GPT 5.2 Codex Medium
**推理力度：** 中等（复杂多文件重构时升级为高）
**最大 Token：** 32,000
**温度：** 0.1
**回退链：** 无（需要指定模型）

**颜色：** #FF4500（岩浆橙）
**模式：** 主要

### Deep-Executor（OMC）
**模型：** Opus（Claude Opus 4.6）
**默认模型：** Opus
**工具：** 11 个工具（Read、Write、Edit、Glob、Grep、Bash、TodoWrite、lsp_diagnostics、lsp_diagnostics_directory、ast_grep_search、ast_grep_replace）
**成本类别：** 昂贵

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **模型** | GPT 5.2 Codex Medium | Claude Opus 4.6 |
| **回退** | 无 | 默认为 Opus |
| **推理** | 中等 → 高自适应 | 不可配置 |
| **Token 限制** | 32k | （模型默认） |
| **温度** | 0.1（确定性） | （模型默认） |

**分析：** 不同的模型生态系统（OpenAI vs Anthropic）。Hephaestus 有**自适应推理**力度，而 Deep-Executor 使用固定的高能力模型。

---

## 13. 会话连续性与记忆

### Hephaestus（OMO）
**会话连续性：**
- 存储智能体委托的会话 ID
- 跨多轮委托复用会话 ID
- 跨委托工作维护上下文

**记忆：** 提示中未明确提及

### Deep-Executor（OMC）
**会话连续性：**
```markdown
<remember>
- Architecture decision: [X]
- Pattern discovered: [Y]
- Gotcha encountered: [Z]
</remember>
```

**记忆策略：**
- 使用 `<remember>` 标签保存关键上下文
- 在对话压缩后仍然存在（根据 CLAUDE.md）
- 专注于决策、模式、陷阱

### 对比
| 方面 | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **会话管理** | 委托会话 ID | 不适用（无委托） |
| **记忆机制** | 未定义 | `<remember>` 标签 |
| **上下文保留** | 跨委托智能体 | 跨对话轮次 |

**分析：** 由于架构不同，记忆需求也不同。Hephaestus 需要会话连续性用于**委托**，而 Deep-Executor 需要记忆用于**长时间独立工作**。

---

## 14. 框架集成

### Hephaestus（OMO - oh-my-opencode）
**框架：** OpenCode 插件
**生态系统：**
- 多智能体编排系统的一部分
- Sisyphus/Atlas 作为主要编排者
- 专业智能体：Oracle、Librarian、Explore、Prometheus、Metis、Momus
- 可被编排者调用执行深度工作

**集成：**
- 接收来自 Sisyphus/Atlas 的委托任务
- 与其他专业智能体协同工作
- 更大工作流编排的一部分

### Deep-Executor（OMC - ultrapower）
**框架：** Claude Code 插件
**生态系统：**
- 32 智能体分层系统的一部分（low/medium/high 变体）
- 独立智能体或由编排模式调用
- 可用于：autopilot、ralph、ultrawork、ultrapilot 模式

**集成：**
- 可直接调用或由编排者调用
- 独立工作（不委托给其他智能体）
- 分层智能体选择策略的一部分

### 对比
| 方面 | Hephaestus（OMO） | Deep-Executor（OMC） |
|--------|------------------|---------------------|
| **主要用途** | 委托深度工作 | 直接或委托 |
| **编排** | Sisyphus/Atlas 调用 | 多种模式可调用 |
| **智能体协作** | 可委托给 explore/librarian | 完全隔离 |
| **框架范围** | OpenCode 生态系统的一部分 | Claude Code 生态系统的一部分 |

**关键洞察：** Hephaestus 被设计为多智能体系统中的**委托专家**，而 Deep-Executor 既可作为**独立智能体**，也可作为**委托专家**。

---

## 15. 功能差距分析

### Hephaestus 中有而 Deep-Executor 缺少的功能

1. **并行后台探索**
   - **影响：** 高 token 成本，探索速度较慢
   - **建议：** 添加 explore/researcher 委托能力

2. **外部研究（Librarian）**
   - **影响：** 无法获取官方文档、GitHub 示例、Stack Overflow
   - **建议：** 添加 researcher 智能体委托以获取外部上下文

3. **结构化升级（Oracle 咨询）**
   - **影响：** 可能卡住且无法自动解除阻塞
   - **建议：** 3 次失败后添加 architect 咨询

4. **自适应推理力度**
   - **影响：** 始终使用昂贵的高推理
   - **建议：** 添加复杂度检测 → 调整推理预算

5. **明确的代码风格指导**
   - **影响：** 可能产生不一致的代码风格
   - **建议：** 在编写前添加模式匹配要求

6. **沟通风格规则**
   - **影响：** 可能冗长或浪费 token
   - **建议：** 添加简洁沟通规则

7. **委托的会话管理**
   - **影响：** 不适用（无委托）
   - **建议：** 除非添加委托，否则不需要

### Deep-Executor 中有而 Hephaestus 缺少的功能

1. **明确的 TODO 纪律**
   - **影响：** 更好的进度可见性和跟踪
   - **建议：** 添加到 Hephaestus 以提高用户透明度

2. **结构化完成摘要模板**
   - **影响：** 更容易验证全面工作
   - **建议：** 添加到 Hephaestus 以保持一致性

3. **每次变更验证协议**
   - **影响：** 更早发现错误
   - **建议：** 添加到 Hephaestus 以加快错误检测

4. **明确的 MCP 工具使用指导**
   - **影响：** 更一致和正确的工具使用
   - **建议：** 添加 LSP/AST 工具策略部分

5. **AST 转换的强制 dryRun 工作流**
   - **影响：** 更安全的结构化重构
   - **建议：** 作为安全模式添加到 Hephaestus

6. **通过 `<remember>` 标签实现会话记忆**
   - **影响：** 跨轮次更好的上下文保留
   - **建议：** 为长会话添加到 Hephaestus

---

## 16. 建议改进

### 针对 Deep-Executor（OMC）

#### 优先级 1：关键缺口

1. **添加并行探索能力**
   ```
   BEFORE executing complex tasks:
   - Delegate to explore for internal codebase search
   - Delegate to researcher for external documentation
   - Use run_in_background=true for parallelism
   - Synthesize results before planning
   ```

   **原因：** 降低 token 成本，加快探索阶段

2. **添加结构化升级路径**
   ```
   FAILURE RECOVERY (after 3 failed attempts):
   1. STOP all edits immediately
   2. REVERT to last known working state
   3. DELEGATE to architect-medium with full context
   4. WAIT for guidance before proceeding
   5. If still blocked, report to user
   ```

   **原因：** 防止无限循环并提供自动解除阻塞

3. **添加明确的代码风格指导**
   ```
   BEFORE writing ANY code:
   1. Search for similar patterns in codebase (Grep/ast_grep_search)
   2. Read 2-3 examples of existing code
   3. Match style: indentation, naming, structure
   4. Prefer minimal changes (surgical edits)
   5. Use ASCII defaults unless codebase uses otherwise
   ```

   **原因：** 确保代码质量和代码库一致性

#### 优先级 2：生活质量

4. **添加沟通效率规则**
   ```
   COMMUNICATION STYLE:
   - No status updates ("I'll work on...")
   - No flattery or preamble
   - Be concise and direct
   - Challenge respectfully when needed
   - Only ask questions after exhausting all tools
   ```

   **原因：** 减少 token 浪费，提高效率

5. **添加自适应推理指导**
   ```
   TASK COMPLEXITY DETECTION:
   - Trivial (1-2 files, clear fix) → Use executor-low (haiku)
   - Scoped (3-5 files, clear plan) → Use executor (sonnet)
   - Complex (multi-system, unclear) → Use deep-executor (opus)

   BEFORE invoking deep-executor, verify it's truly needed.
   ```

   **原因：** 通过将简单工作路由到更便宜的智能体来优化成本

6. **扩展验证检查清单**
   ```
   Add to completion criteria:
   5. No temporary/debug code remains (console.log, commented blocks)
   6. Code matches existing codebase patterns (verified via exploration)
   7. All imports are used and necessary
   ```

   **原因：** 更全面的质量保证

### 针对 Hephaestus（OMO）

#### 优先级 1：用户体验

1. **添加明确的 TODO 纪律**
   ```
   TODO MANAGEMENT:
   - Create TodoWrite for tasks with 2+ steps
   - Mark ONE task in_progress before starting
   - Mark completed IMMEDIATELY after each step
   - Re-verify zero pending/in_progress before completion
   ```

   **原因：** 提高用户可见性和进度跟踪

2. **添加结构化完成摘要模板**
   ```markdown
   ## Completion Summary

   ### What Was Done
   - [Concrete deliverable 1]

   ### Files Modified
   - `/path/file.ts` - [changes]

   ### Verification Evidence
   - Build: [command] -> SUCCESS
   - Tests: [command] -> X passed
   - Diagnostics: 0 errors

   ### Definition of Done
   [X] All requirements met
   [X] Tests pass
   [X] Build succeeds
   ```

   **原因：** 标准化输出，使验证更容易

3. **添加每次变更验证**
   ```
   AFTER EVERY EDIT:
   1. Run lsp_diagnostics on modified file
   2. Check for broken imports/references
   3. Fix immediately if issues found
   4. Only proceed when clean
   ```

   **原因：** 更早发现错误，减少调试时间

#### 优先级 2：安全与质量

4. **为 AST 转换添加强制 dryRun**
   ```
   ast_grep_replace WORKFLOW:
   1. ALWAYS use dryRun=true first
   2. Review proposed changes
   3. If approved, apply with dryRun=false
   4. Run lsp_diagnostics_directory to verify
   ```

   **原因：** 防止破坏性转换

5. **添加明确的 MCP 工具策略**
   ```
   MCP TOOL USAGE:
   | Tool | When to Use |
   |------|-------------|
   | lsp_diagnostics | After editing single file |
   | lsp_diagnostics_directory | After multi-file changes |
   | ast_grep_search | Finding code patterns by structure |
   | ast_grep_replace | Refactoring patterns (dryRun first!) |
   ```

   **原因：** 更一致和正确的工具应用

6. **添加会话记忆机制**
   ```
   <remember priority>
   - Architecture decision: [X]
   - Pattern discovered: [Y]
   - Gotcha encountered: [Z]
   </remember>
   ```

   **原因：** 跨长会话更好地保留上下文

---

## 17. 架构建议

### 针对 Oh-My-Claudecode (OMC) 团队

**方案 A：混合 Deep-Executor（推荐）**

创建 deep-executor 的**支持委托的变体**：

```typescript
export const deepExecutorHybridAgent: AgentConfig = {
  name: 'deep-executor-hybrid',
  description: 'Deep executor with parallel exploration capability',
  prompt: loadAgentPrompt('deep-executor-hybrid'),
  tools: [
    ...deepExecutorAgent.tools,
    'Task' // Enable delegation to explore/researcher only
  ],
  model: 'opus',
  metadata: {
    ...DEEP_EXECUTOR_PROMPT_METADATA,
    promptDescription: 'Deep executor that can delegate exploration to cheaper agents for token efficiency'
  }
};
```

**优势：**
- Token 高效的并行探索（类似 Hephaestus）
- 保持实现阶段的自执行理念
- 两全其美

**方案 B：保留纯 Deep-Executor + 添加编排模式**

保持 deep-executor 不变（纯自执行），但创建一个新的**编排模式**：
1. 并行委托探索给 explore/researcher
2. 综合结果
3. 委托实现给 deep-executor
4. 验证结果

**优势：**
- 保留纯 deep-executor 供直接使用
- 提供高效的编排路径
- 遵循现有 OMC 模式（ultrawork、pipeline）

### 针对 Oh-My-Opencode (OMO) 团队

**建议：添加 TODO 纪律层**

为 Hephaestus 添加明确的任务分解和进度跟踪：

```typescript
// Add TodoWrite tool to Hephaestus
// Update prompt with TODO discipline section
```

**优势：**
- 更好的用户可见性
- 更清晰的进度跟踪
- 更容易验证完成情况

**建议：添加结构化输出模板**

使用 markdown 模板标准化 Hephaestus 完成输出：

```markdown
## Completion Summary
[Template from Deep-Executor]
```

**优势：**
- 一致的输出格式
- 更容易验证
- 更好的用户体验

---

## 18. Token 成本分析

### Hephaestus (OMO)
**探索阶段：**
- 启动 2-5 个并行智能体（explore 使用 gpt-5-nano，librarian 使用 big-pickle）
- 主智能体（GPT 5.2 Codex Medium）等待或继续规划
- **成本**：低（探索使用廉价模型）

**执行阶段：**
- GPT 5.2 Codex Medium，中等推理
- 复杂重构时升级为高推理
- **成本**：中高（自适应）

**典型总成本：** 中等（优化的探索，自适应推理）

### Deep-Executor (OMC)
**探索阶段：**
- 使用自身工具（Glob、Grep、Read、ast_grep_search）
- 所有探索由 Claude Opus 4.6 完成
- **成本**：高（所有探索使用昂贵模型）

**执行阶段：**
- Claude Opus 4.6 完成所有实现
- **成本**：高（始终使用昂贵模型）

**典型总成本：** 高（无模型路由优化）

### 典型任务成本对比

**场景：** "为认证流程添加错误处理"

| Phase | Hephaestus | Deep-Executor |
|-------|------------|---------------|
| **Explore files** | 2 explore agents (nano) | Opus Glob + Grep + Read |
| **Research patterns** | 1 librarian (big-pickle) | N/A (no external research) |
| **Plan** | Codex Medium | Opus |
| **Implement** | Codex Medium | Opus |
| **Verify** | Codex Medium | Opus |

**估算 Token 比率：** Hephaestus 约为 Deep-Executor 成本的 60%

**Deep-Executor 更便宜的情况：**
- 探索量极少的简单任务
- 不需要外部研究的任务
- 单文件专注工作

**Hephaestus 更便宜的情况：**
- 需要大量探索的复杂任务
- 需要外部文档研究的任务
- 带模式搜索的多文件重构

---

## 19. 使用场景建议

### 何时使用 Hephaestus (OMO)

**理想场景：**
1. **复杂的多文件重构** - 受益于并行探索
2. **不熟悉的代码库** - Librarian 可获取外部上下文
3. **架构密集型任务** - Oracle 咨询可用于解除阻塞
4. **Token 预算受限** - 高效的模型路由
5. **需要外部研究的任务** - Librarian 智能体能力

**示例任务：**
- "按最佳实践实现 OAuth2 认证"
- "重构整个 API 层的错误处理"
- "从 REST 迁移到 GraphQL"
- "添加全面的日志系统"

### 何时使用 Deep-Executor (OMC)

**理想场景：**
1. **范围明确的实现任务** - 受益于专注的自执行
2. **需求清晰的任务** - 探索量较少
3. **成本不是主要考虑因素** - 接受 Opus 成本换取简单性
4. **需要进度可见性** - TODO 纪律提供跟踪
5. **偏好更简单的心智模型** - 无委托复杂性

**示例任务：**
- "修复支付处理逻辑中的 bug"
- "为用户注册表单添加验证"
- "为新 UI 组件实现功能开关"
- "为 auth 模块编写全面测试"

### 何时同时使用（顺序委托）

**场景：** 大型复杂项目

1. **阶段 1**：Hephaestus 用于探索和架构
   - 映射代码库
   - 研究外部模式
   - 创建详细计划

2. **阶段 2**：Deep-Executor 用于专注实现
   - 使用 TODO 跟踪执行计划
   - 每次变更验证
   - 结构化完成摘要

---

## 20. 总结与结论

### Deep-Executor 做得更好的地方（对比 Hephaestus）

1. ✅ **明确的 TODO 纪律** - 更好的进度跟踪
2. ✅ **结构化完成摘要模板** - 更容易验证
3. ✅ **每次变更验证** - 更快的错误检测
4. ✅ **MCP 工具使用指导** - 更一致的应用
5. ✅ **AST 强制 dryRun** - 更安全的转换
6. ✅ **会话记忆机制** - 更好的上下文保留
7. ✅ **更简单的心智模型** - 更容易理解（无委托复杂性）

### Hephaestus 做得更好的地方（对比 Deep-Executor）

1. ✅ **并行探索** - Token 高效，速度更快
2. ✅ **外部研究** - Librarian 用于文档/示例
3. ✅ **结构化升级** - Oracle 咨询用于解除阻塞
4. ✅ **自适应推理** - 成本优化
5. ✅ **明确的代码风格指导** - 更好的质量
6. ✅ **沟通效率规则** - 减少 token 浪费
7. ✅ **委托架构** - 可扩展的复杂工作流

### 核心权衡

| Aspect | Hephaestus | Deep-Executor |
|--------|------------|---------------|
| **Architecture** | Orchestrator-executor hybrid | Pure executor |
| **Complexity** | Higher (delegation logic) | Lower (self-contained) |
| **Token Efficiency** | Better (model routing) | Worse (always Opus) |
| **Parallelism** | Yes (2-5 background agents) | No (sequential tools) |
| **User Visibility** | Lower (no TODOs) | Higher (TODO tracking) |
| **Scalability** | Better (delegation) | Limited (solo work) |
| **Simplicity** | Lower | Higher |

### 结论

**针对 OMC 团队：**
- **保留** deep-executor 作为纯自执行变体
- **添加** 带 explore/researcher 委托的 deep-executor-hybrid
- **实施** 优先级 1 改进（并行探索、升级路径、风格指导）

**针对 OMO 团队：**
- **增强** Hephaestus，添加 TODO 纪律和结构化输出
- **保留** 委托架构（这是竞争优势）
- **实施** 来自 Deep-Executor 的优先级 1 用户体验改进

### 理想智能体（综合）

```
BEST OF BOTH WORLDS:

1. Parallel exploration (Hephaestus) + TODO tracking (Deep-Executor)
2. External research (Hephaestus) + Structured templates (Deep-Executor)
3. Escalation (Hephaestus) + Per-change verification (Deep-Executor)
4. Model routing (Hephaestus) + MCP tool guidance (Deep-Executor)
5. Communication rules (Hephaestus) + Memory tags (Deep-Executor)
```

---

## 附录 A：OMC 实施检查清单

### 阶段 1：关键修复（第 1 周）

- [ ] 添加并行探索委托（explore、researcher）
- [ ] 添加 3 次失败后的结构化升级（architect 咨询）
- [ ] 添加明确的代码风格指导部分
- [ ] 添加沟通效率规则

### 阶段 2：质量改进（第 2 周）

- [ ] 扩展验证检查清单（临时代码、模式匹配）
- [ ] 添加自适应推理指导（任务复杂度检测）
- [ ] 记录何时使用 deep-executor vs executor 层级

### 阶段 3：混合变体（第 3 周）

- [ ] 创建 deep-executor-hybrid 智能体定义
- [ ] 仅为探索添加委托能力
- [ ] 测试并行探索性能
- [ ] 记录成本节省

### 阶段 4：文档（第 4 周）

- [ ] 更新 AGENTS.md，添加使用指导
- [ ] 添加理想使用场景示例
- [ ] 记录与其他智能体的成本对比
- [ ] 为 Hephaestus 用户创建迁移指南

---

## 附录 B：完整提示对比

### 关键章节对比

| 章节 | Hephaestus | Deep-Executor |
|---------|------------|---------------|
| **身份** | Senior Staff Engineer, craftsman | Self-contained deep worker, the forge |
| **约束** | No task/delegate_task tools | Task/agent spawning BLOCKED |
| **意图门控** | 5 categories (Phase 0) | 3 categories (Intent Gate) |
| **探索** | 2-5 parallel background agents | Sequential own tools |
| **规划** | Explicit work plan document | Mental model + TodoWrite |
| **执行** | Direct or delegate decision | Direct only |
| **验证** | 7-criteria checklist | 4-criteria + per-change |
| **完成** | Evidence described | Markdown template |
| **TODO** | Not mentioned | NON-NEGOTIABLE discipline |
| **失败** | 3 max → Oracle | Diagnose → Pivot → Report |
| **代码质量** | Pattern search, minimal, style matching | Anti-patterns list |
| **沟通** | 4 hard rules (concise, no flattery) | Not defined |
| **记忆** | Session IDs for delegation | `<remember>` tags |
| **MCP 工具** | Available, less documented | Explicit strategy tables |

### 提示长度对比

| 智能体 | 大约行数 | 章节数 | 详细程度 |
|-------|-------------------|----------|--------------|
| **Hephaestus** | ~450 lines | 12 major sections | Very detailed |
| **Deep-Executor** | ~194 lines | 11 major sections | Detailed |

**分析：** Hephaestus 更全面（长 2.3 倍），在委托、沟通和代码质量方面有更明确的指导。Deep-Executor 更专注简洁，在验证和 TODO 管理方面结构更好。

---

## 附录 C：工具权限矩阵

### Hephaestus (OMO)

| 工具类别 | 允许 | 禁止 |
|---------------|---------|---------|
| **读/写** | Read, Write, Edit, Glob, Grep | - |
| **执行** | Bash | - |
| **LSP** | lsp_diagnostics, lsp_diagnostics_directory | - |
| **AST** | ast_grep_search, ast_grep_replace | - |
| **委托** | (Can delegate to explore/librarian) | task, delegate_task |
| **TODO** | - | TodoWrite (not mentioned) |
| **提问** | Allowed (last resort) | - |

### Deep-Executor (OMC)

| 工具类别 | 允许 | 禁止 |
|---------------|---------|---------|
| **读/写** | Read, Write, Edit, Glob, Grep | - |
| **执行** | Bash | - |
| **LSP** | lsp_diagnostics, lsp_diagnostics_directory | - |
| **AST** | ast_grep_search, ast_grep_replace | - |
| **委托** | - | Task (BLOCKED), agent spawning (BLOCKED) |
| **TODO** | TodoWrite | - |
| **提问** | Allowed (implied explore-first) | - |

### 关键差异

1. **委托**：Hephaestus 可以（通过专用语法），Deep-Executor 不能（硬性阻止）
2. **TODO**：Deep-Executor 有 TodoWrite，Hephaestus 未提及
3. **探索**：Hephaestus 委托，Deep-Executor 使用自身工具

---

## 附录 D：研究来源

### Hephaestus 研究来源

1. **主要来源**：oh-my-opencode GitHub 仓库（dev 分支）
   - URL: https://github.com/code-yeongyu/oh-my-opencode/blob/dev/src/agents/hephaestus.ts
   - 文件：`src/agents/hephaestus.ts`（19,375 字节）
   - 文档：`src/agents/AGENTS.md`

2. **辅助文档**：
   - README.md - 项目概述和理念
   - Sisyphus prompt - 编排者模式
   - AGENTS.md - 智能体定义和关系

3. **关键洞察**：
   - 受 AmpCode 深度模式启发
   - 以希腊工艺之神命名
   - 设计为多智能体系统中的委托专家
   - 使用 GPT 5.2 Codex Medium，具有自适应推理

### Deep-Executor 研究来源

1. **主要来源**：ultrapower 本地代码库
   - 文件：`/home/bellman/Workspace/omc-omo-deepexec-comparsion/agents/deep-executor.md`
   - 文件：`/home/bellman/Workspace/omc-omo-deepexec-comparsion/src/agents/deep-executor.ts`

2. **辅助上下文**：
   - 智能体工具和类型
   - Oh-my-claudecode 框架文档（CLAUDE.md）
   - 智能体定义和编排模式

3. **关键洞察**：
   - 明确从 Hephaestus 移植（PR #1287）
   - 适配 Claude Code 生态系统
   - 设计为独立或委托智能体
   - 专用 Claude Opus 4.6

---

**END OF ANALYSIS**
