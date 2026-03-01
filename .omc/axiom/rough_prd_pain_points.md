# Rough PRD：ultrapower 项目全面痛点修复计划

**版本：** Rough v1（基于 Draft v1 经专家评审仲裁后修订）
**生成时间：** 2026-03-01
**修订说明：** 本文档根据 5 位专家评审（UX Director、Product Director、Domain Expert、Tech Lead、Critic）的 36 项差异点，经首席 PM 仲裁后生成。共接受 21 项差异点，拒绝/降级 8 项，新增 2 个 P0 问题（bridge-normalize fast path 安全绕过、Atomics.wait 主线程崩溃）。
**分析范围：** src/features, src/hooks, src/tools, src/mcp, src/lib, src/installer, scripts, skills, agents, commands

---

## 修订摘要（相对 Draft PRD 的变化）

| 变更类型 | 数量 | 说明 |
|---------|------|------|
| P0 降级为 P2 | 1 | P0-3（git push main）→ P2（分支策略规范修复） |
| P0 降级为 P1 | 1 | P0-5（prompt-injection）→ P1（功能降级，非安全漏洞） |
| 新增 P0 | 2 | bridge-normalize fast path 安全绕过、Atomics.wait 主线程 |
| 修复方案重写 | 3 | P0-1（外部接口层校验）、P0-4（默认 true 可配置）、P0-7（临时文件方案） |
| 修复路径更正 | 1 | P1-8（src/hooks/recovery/ 而非 src/features/session-recovery/） |
| 优先级提升 | 2 | P1-9（独立批次）、P2-8 atomic-write 测试提升至 P1 |
| 任务数量修订 | 全部批次 | Batch 1 从 2 个任务增至 8+ 个，总任务约 28-34 个 |
| 数字统一 | 1 | HIGH 问题统一为 31 项（表格统计值） |
| 新增横切规范 | 1 | 所有静默失败修复必须同步设计用户可见反馈 |

---

## 一、背景与目标

ultrapower 经过多轮快速迭代（v5.4.1~v5.4.8，2 周内 5 次生产紧急修复），积累了跨模块的技术债、平台兼容性缺陷、安全隐患和文档漂移问题。历史修复包括：plugin.json 验证修复（v5.4.1）、二次注入 bug（v5.4.5）、npm-cache 死锁（v5.4.6），反映了系统性防御不足的问题。本 PRD 定义优先级分级的修复方案，覆盖全部 10 个功能模块。

**目标：**
- 消除 HIGH 严重度安全与稳定性 Bug（共 **31 项**，与问题全景表一致）
- 修复 Windows 平台兼容性问题（用户主运行环境）
- 补全关键安全路径测试覆盖（atomic-write、validateMode，与 P0 修复同批）
- 修复命名空间迁移遗留（superpowers: → ultrapower:，执行前先全量确认）
- 纠正文档与实现漂移（AGENTS.md, skills 引用）

**发布策略：**
- Batch 1（P0 安全）→ v5.5.0（安全加固信号）
- Batch 2（P1 Windows + 功能）→ v5.5.1
- Batch 2.5（P1-9 delegation-enforcer 独立批次）→ v5.5.2
- Batch 3（P2 命名空间 + 文档 + 测试）→ v5.5.3
- Batch 4（P3 代码质量）→ v5.5.4 或合并至下一 minor

**横切用户反馈规范（新增）：**
所有静默失败修复项，必须同步定义用户可见的错误/降级提示文案，格式为 `[ultrapower] 等级：内容`，等级分为警告/错误/信息，展示位置在 CLI 输出。这是本次修复计划的强制性横切要求。

---

## 二、问题全景（按严重度汇总）

| 模块 | HIGH | MEDIUM | LOW | 合计 |
|------|------|--------|-----|------|
| src/features | 7 | 7 | 2 | 16 |
| src/hooks | 5 | 8 | 5 | 18 |
| src/tools | 4 | 10 | 6 | 20 |
| src/mcp | 7 | 10 | 9 | 26 |
| src/lib | 1 | 5 | 3 | 9 |
| src/installer | 1 | 4 | 2 | 7 |
| scripts | 2 | 3 | 4 | 9 |
| skills/commands | 4 | 6 | 3 | 13 |
| **总计** | **31** | **53** | **34** | **118** |

> 注：目标描述中"31项 HIGH"与此表格一致。Draft PRD 中"23项"为历史估算，已统一修正为 31 项。

---

## 三、P0 安全与稳定性问题（必须修复）

> 用户可见性标注：1 = 内部不可见，2 = 间接影响，3 = 用户直接报错/功能失效

### P0-1：state-manager 路径遍历防护缺失（违反 CLAUDE.md P0 规范）
- **位置：** `src/features/state-manager/index.ts:82`，`src/tools/state-tools.ts:50`（两处）
- **问题：** `getStatePath(name: string)` 直接将 name 拼接路径，未经白名单校验，违反 runtime-protection.md P0 安全规则
- **用户可见性：** 2（攻击面，用户侧不可见，但系统面临路径遍历风险）
- **修复方案（修订）：** 不修改 `getStatePath()` 函数签名。在上层调用链中对来自外部输入的 mode 参数做白名单校验：
  - 在 MCP tools 暴露的 `state_read`/`state_write` tool handler 入口添加 `assertValidMode()` 校验（仅对外部接口层，保留内部调用的灵活性）
  - 评估 `src/tools/state-tools.ts` 的 `StateToolMode` 类型是否覆盖所有合法路径
- **拆分为 2 个子任务：** 1a（外部接口层校验）+ 1b（state-tools 类型审查）

### P0-2：LSP servers.ts Shell 注入风险
- **位置：** `src/tools/lsp/servers.ts:155-163`
- **问题：** `execSync(\`${checkCommand} ${command}\`)` 拼接命令字符串，存在 shell 注入风险
- **用户可见性：** 2（若 command 来自用户配置则为真实向量）
- **补充分析（领域专家要求）：** 执行前需确认 `command` 参数来源（静态内置列表 vs 用户 settings.json 可配置），以评估实际利用难度
- **修复方案：** 改用 `execFileSync('which', [command])` / `execFileSync('where', [command])`，无论来源如何均为更安全做法

### P0-4：gemini-core.ts `--yolo` 标志硬编码（修订：可配置性缺失）
- **位置：** `src/mcp/gemini-core.ts:89`，`src/team/mcp-team-bridge.ts:347`（两处）
- **问题：** `--yolo` 标志（Gemini CLI 非交互模式的必需参数）硬编码无法配置，缺乏可配置性以应对未来 CLI 行为变更
- **用户可见性：** 1（当前无感知，但未来 CLI 行为变更时无法响应）
- **修复方案（修订）：** 引入 `OMC_GEMINI_YOLO` 环境变量，**默认值为 `true`**（维持现有行为，保证非交互环境可用）；CI 环境强制使用 true；同时修复两处硬编码；文档中说明 --yolo 的语义边界（非交互模式必需参数，非安全漏洞标志）
- **注意：** 默认值必须保持 true，防止在无 TTY 的 CI/hook 环境中 Gemini CLI 永久阻塞

### P0-6：daemon.ts Windows 路径 ESM import 失败
- **位置：** `src/features/rate-limit-wait/daemon.ts:424-430`
- **问题：** Windows 路径 `C:\Users\...` 插入 `import('...')` 字符串，Node.js ESM loader 拒绝 Win32 路径格式
- **用户可见性：** 3（Windows 用户 daemon 功能完全不可用）
- **修复方案：** 使用 `pathToFileURL(modulePath).href` 构建合法 file URL（项目 bridge.ts 中已有参考实现）
- **必要条件：** 必须先在真实 Windows 环境完成 POC 验证（import URL 修复不破坏懒加载模块链），才能合并
- **验收补充（领域专家要求）：** 在打包产物（dist/）上同步验证，不仅在源码层

### P0-7：daemon.ts 动态代码注入风险（修订：改为临时文件方案）
- **位置：** `src/features/rate-limit-wait/daemon.ts:425-430`
- **问题：** `config` 通过 `JSON.stringify` 注入到 JS 代码字符串中，含反引号/换行/特殊字符时可破坏语法，存在代码注入向量
- **用户可见性：** 2（config 字段异常时才触发）
- **修复方案（修订）：** 将 config 对象写入系统临时目录（`os.tmpdir()`）的随机文件（例如 `omc-daemon-cfg-{uuid}.json`），通过环境变量传递文件路径给子进程；子进程启动后读取并立即删除临时文件（原子清理）。**不采用 stdin 方案**（与 `stdio: 'ignore'` 架构冲突）。**不采用环境变量直接传 config 方案**（Windows 32KB 大小限制 + 安全暴露问题）
- **必要条件：** 必须先完成方案 POC 验证，确认临时文件方案不破坏 fire-and-forget daemon 设计

### P0-8（新增）：bridge-normalize.ts 快速路径安全绕过
- **位置：** `src/hooks/bridge-normalize.ts:117-130`
- **问题：** `isAlreadyCamelCase()` 快速路径判断：只要输入包含 `sessionId`/`toolName`/`directory` 中任意一个键且无下划线键，则跳过 Zod 验证直接返回原始对象。攻击者可构造含合法 camelCase 键的恶意输入，完全绕过白名单过滤
- **用户可见性：** 1（攻击面，用户侧不可见）
- **修复方案：** 在 `SENSITIVE_HOOKS` 类型上禁用 fast path；或确保 fast path 输出也经过 `KNOWN_FIELDS` 字段白名单过滤（拒绝未知字段透传）

### P0-9（新增）：Atomics.wait 主线程调用崩溃风险
- **位置：** `src/hooks/subagent-tracker/index.ts:164-170`，`src/notifications/session-registry.ts:100`
- **问题：** `Atomics.wait()` 在 Node.js 主线程（非 Worker）调用时抛出 `TypeError: Cannot use Atomics.wait() on the main thread`，导致整个 hook bridge 崩溃性失效
- **用户可见性：** 3（若在主线程，hook 系统完全失效）
- **修复方案：** 首先验证执行上下文（检查是否在 Worker 线程中调用）。若确认在主线程：替换为基于 `setTimeout` 的异步等待；若确认在 Worker 线程：标注为已知安全，不修改

---

## 四、P1 Windows 平台兼容性问题（保持不变）

### P1-1：auto-update.ts Windows 路径/shell 语法混用
- **位置：** `src/features/auto-update.ts:611-614`
- **修复：** 按 `process.platform` 分支调用 `which`/`where`，统一 `.trim()`

### P1-2：subagent-tracker Windows 路径替换失效
- **位置：** `src/hooks/subagent-tracker/index.ts:1128`
- **修复：** 改用 `path.relative(directory, filePath)`

### P1-3：pre-tool.ts 路径安全检查无规范化
- **位置：** `src/hooks/guards/pre-tool.ts:52-58`
- **修复：** 使用 `path.resolve()` 规范化后比较

### P1-4：ax-export skill 使用 `/tmp` 路径
- **位置：** `skills/ax-export/SKILL.md`
- **修复：** 改用 `os.tmpdir()` 路径，Windows 提供 PowerShell Compress-Archive 替代
- **用户体验要求（新增）：** Windows 用户调用时输出平台说明：`[ultrapower] ax-export：当前平台为 Windows，将使用 PowerShell Compress-Archive 替代 zip。`

---

## 五、P1 内存泄漏与资源问题（保持不变）

### P1-5：Python REPL executionCounters Map 内存泄漏
- **位置：** `src/tools/python-repl/tool.ts:102`
- **修复：** 在 `handleReset`/`killBridgeWithEscalation` 成功后调用 `executionCounters.delete(sessionId)`

### P1-6：LSP client disconnect 不清理 setTimeout
- **位置：** `src/tools/lsp/client.ts:191-207`
- **修复：** 遍历 Map 调用 `clearTimeout(item.timeout)` 后再 `clear()`

### P1-7：LSP client 缓冲区无上限
- **位置：** `src/tools/lsp/client.ts:121`
- **修复：** 添加 64MB 上限，超出时断开连接

---

## 六、P1 功能缺失与占位实现

### P1-8：session-recovery recoverToolResultMissing 占位实现（路径已修正）
- **位置（修正）：** `src/hooks/recovery/session-recovery.ts:184-189`（原 PRD 路径错误，实际在 src/hooks/recovery/）
- **问题：** 函数体是注释占位，仅返回 `true`，调用方误认为恢复成功，用户感知工作上下文丢失
- **修复：** 返回 `false` 或抛出"未实现"错误，明确区分"恢复成功"和"恢复跳过（未实现）"

### P1-9（提升为 P1 最高优先级）：delegation-enforcer 功能未集成（独立 Batch 2.5）
- **位置：** `src/features/delegation-enforcer.ts`（实现存在），`src/hooks/bridge.ts`（未集成）
- **业务影响（量化）：** enforcer 负责在 Task/Agent 调用未显式指定 `model` 参数时自动注入默认模型（haiku/sonnet/opus）。当前未集成导致所有 Task 调用使用会话默认模型，haiku 级任务被 sonnet/opus 执行，**成本放大 3-10x**。在高并行场景（ultrawork、team 模式）下损失尤为显著，CLAUDE.md 的 model_routing 规范形同虚设
- **技术复杂度：** 高，需要独立子 PRD + 至少 3 个任务（设计文档、实现、集成测试）
- **修复路径：**
  1. 设计文档：明确集成接口（hook type 范围、modifiedInput 协议、与 processOrchestratorPreTool 的关系）
  2. 在 bridge.ts 的 `processPreToolUse` 中实际集成 delegation-enforcer
  3. 解除 `src/__tests__/delegation-enforcer-integration.test.ts` 的 skip
- **验收：** 集成后验证 `Task({subagent_type: "ultrapower:explore"})` 在无 model 参数时实际使用 haiku

### P1-10：MCP job-management handleWaitForJob 阻塞事件循环
- **位置：** `src/mcp/job-management.ts`
- **修复：** 添加单次 wait_for_job 最长等待时间上限，强制客户端轮询

### P1-11：MCP handleKillJob 状态写入与进程终止顺序颠倒
- **位置：** `src/mcp/job-management.ts`
- **修复：** 先 `process.kill()`，成功后再更新状态文件

### P1-NEW（提升自 P2-8）：atomic-write 测试覆盖
- **原因：** 核心原子写入功能无单元测试，P0-1 修复后的路径遍历防护缺乏回归保障，行业标准要求安全关键路径测试与修复同批交付
- **修复：** 新增 `src/lib/__tests__/atomic-write.test.ts`，在 Batch 1 内交付

---

## 七、P2 命名空间迁移遗留问题

### 前置调查任务（必须在 Batch 3 前完成）
执行全量扫描：`grep -r "superpowers:" commands/ skills/ docs/ templates/ --include="*.md" --include="*.json"`
- 若结果为 0：关闭 P2-1/P2-2
- 若有残留：精确记录文件清单，按清单执行替换

### P2-1：3 个 commands 使用 superpowers: 旧命名空间
- **位置（待全量扫描确认）：** `commands/brainstorm.md`, `commands/execute-plan.md`, `commands/write-plan.md`
- **修复：** 全部替换为 `ultrapower:` 命名空间
- **用户引导（新增）：** 在旧命名空间的 skill/command 文档顶部添加废弃声明标记

### P2-2：6 个 skills 内残留 superpowers: 引用
- **位置（待全量扫描确认）：** executing-plans, subagent-driven-development, systematic-debugging, writing-plans, writing-skills, requesting-code-review
- **修复：** 批量替换为 `ultrapower:` 命名空间
- **用户引导（新增）：** 在 hook 层对 `superpowers:` 调用添加友好拦截提示（格式：`[ultrapower] 提示：此命令已迁移至 /ultrapower:xxx，请更新您的工作流。`）

### P2-3（原 P0-3 降级）：release-steps.mjs 发布流程违反分支策略
- **位置：** `scripts/release-steps.mjs`（行号需重新确认，约为 84 行附近）
- **降级原因：** CVSS ~3.1，触发受控（CI 脚本）、有 dryRun 保护，属于分支策略合规修复而非安全漏洞
- **修复方案（重写）：** 将 `git push origin main` 替换为 `git push origin dev && gh pr create --base main --head dev --title "Release vX.X.X"` 的 PR 流程；或在 CI YAML 中加 branch protection check。不得简单删除（删除后发布流程断裂）

### P2-4（原 P2-3）：ax-export 引用不存在的 .agent/ 目录
- **位置：** `skills/ax-export/SKILL.md`
- **修复：** 更新为实际路径（`.omc/axiom/`, `.omc/plans/` 等）

### P2-5（原 P2-4）：ax-status 引用不存在的状态文件
- **位置：** `skills/ax-status/SKILL.md`
- **修复：** Step 1 改为读取 `.omc/axiom/active_context.md`（实际存在的文件）

### P2-6（原 P2-5）：AGENTS.md 版本号滞后（5.2.2 vs 实际 5.4.8）
- **位置：** `/AGENTS.md:4`
- **修复：** 同步版本号，并将 AGENTS.md 版本同步纳入 release skill 的自动化检查清单（防止未来漂移）

### P2-7（原 P2-6）：src/agents/definitions.ts 声明 "48 Agents" 但实际超过
- **位置：** `src/agents/definitions.ts:592`
- **修复：** 更新为实际 agent 数量

### P2-8（原 P2-7）：bump-version.mjs 版本正则无结尾锚点
- **位置：** `scripts/bump-version.mjs:37`
- **修复：** 改为 `/^\d+\.\d+\.\d+$/`

---

## 八、P2 测试覆盖空白（仅剩余项，atomic-write 已提升至 P1）

### P2-9（原 P2-9）：version.ts 无测试文件
- **修复：** 新增 `src/lib/__tests__/version.test.ts`

### P2-10（原 P2-10）：installer/hooks.ts 无测试文件
- **修复：** 新增 `src/installer/__tests__/hooks.test.ts`

---

## 九、P3 代码质量改进（低优先级，保持不变）

- installer/index.ts：4 处 `writeFileSync` 改为 `atomicWriteJson`
- safeReadJson：区分"文件不存在"和"文件损坏"的错误处理
- rules-injector：添加最大向上遍历深度限制
- session-recovery.ts：修复 "preceeding" 拼写错误（应为 "preceding"）
- codex-core.ts/gemini-core.ts：`parseInt("0") || default` 改为 `isNaN(n) ? default : n`
- prompt-persistence.ts：generatePromptId 从 4 字节扩展到 8 字节
- notepads-tools.ts：catch 块统一返回 `isError: true`
- skills-tools.ts：ALLOWED_BOUNDARIES 改为动态计算
- Gemini prompt 参数大小上限（`executeGemini` 添加 4MB 上限）

---

## 十、实现优先级与分批计划（修订后）

### 批次间依赖关系（串行约束）

- P0-6 和 P0-7 **必须串行**（共同修改子进程通信路径，并行必产生合并冲突）
- P0-1 和 P1-2/P1-3 **可并行**（路径处理工具函数相对独立）
- P1-9 **必须后于 Batch 2 完成**（依赖 bridge.ts 的稳定状态）
- P2 测试文件 **必须在 P0/P1 修复稳定后**开发（避免测试依赖变动中的接口）

### Batch 1（P0 安全 + 稳定性）- 估计 8-10 个任务 - 对应 v5.5.0

**前置：** P0-6 和 P0-7 的 POC 验证（Windows ESM + 临时文件方案）通过后方可全量实施

| 任务 | 内容 |
|------|------|
| 1a | P0-1 外部接口层校验（state_read/state_write handler 入口） |
| 1b | P0-1 state-tools.ts 类型审查 + atomic-write 测试（P1-NEW） |
| 1c | P0-2 execSync 全量替换（补充 command 来源分析） |
| 1d | P0-4 OMC_GEMINI_YOLO 环境变量化（gemini-core + mcp-team-bridge） |
| 1e | P0-8 bridge-normalize fast path 安全修复 |
| 1f | P0-9 Atomics.wait 执行上下文验证 + 修复 |
| 1g | P0-6 POC 通过后全量实施（Windows ESM import URL） |
| 1h | P0-7 POC 通过后全量实施（临时文件方案） |
| 1i | P1-6/P1-7 LSP 计时器泄漏 + 缓冲区上限 |

**CI Gate：** tsc --noEmit + npm test（零回归）+ 人工安全验证 P0-8/P0-9 + Windows 真实环境验证 P0-6/P0-7

### Batch 2（P1 Windows + 功能）- 估计 7-8 个任务 - 对应 v5.5.1

| 任务 | 内容 |
|------|------|
| 2a | P1-1 auto-update.ts platform 分支 |
| 2b | P1-2/P1-3 path.relative + path.resolve |
| 2c | P1-4 ax-export os.tmpdir + Windows 提示 |
| 2d | P1-5 Python REPL executionCounters 泄漏 |
| 2e | P1-8 session-recovery 返回 false（路径已修正） |
| 2f | P1-10 wait_for_job 等待时间上限 |
| 2g | P1-11 先 kill 再写状态 |

**CI Gate：** tsc + npm test + Windows 11 真实环境端到端测试（auto-update、ax-export 完整流程）

### Batch 2.5（P1-9 delegation-enforcer - 独立批次）- 估计 3 个任务 - 对应 v5.5.2

| 任务 | 内容 |
|------|------|
| 2.5a | 设计文档：集成接口、hook type 范围、modifiedInput 协议 |
| 2.5b | 实现：bridge.ts processPreToolUse 集成 delegation-enforcer |
| 2.5c | 集成测试：解除 skip，验证 model 自动注入，验证 haiku 任务实际使用 haiku |

**CI Gate：** 设计文档经产品评审 → 实现通过集成测试 → 验证成本日志符合预期

### Batch 3（P2 命名空间 + 文档 + 测试）- 估计 6 个任务 - 对应 v5.5.3

| 任务 | 内容 |
|------|------|
| 3a | 全量扫描 superpowers: 残留（含 commands/skills/docs/templates） |
| 3b | P2-1/P2-2 命名空间替换 + 用户引导方案（据 3a 结果） |
| 3c | P2-3 release-steps.mjs 发布流程修复 + P2-4 ax-export 路径 |
| 3d | P2-5 ax-status 路径 + P2-6~P2-8 文档同步 |
| 3e | P2-9/P2-10 测试文件新增（具体场景见下） |
| 3f | Windows CI 矩阵配置（GitHub Actions windows-latest runner） |

**CI Gate：** tsc + npm test（含新增测试全部通过）+ grep 确认无 superpowers: 残留

### Batch 4（P3 代码质量）- 估计 2 个任务 - 对应 v5.5.4

- 全部 P3 项，code-reviewer 审查后合并

---

## 十一、测试场景要求

### P1-NEW atomic-write 测试（Batch 1 交付）

具体场景（不少于以下）：
1. 正常写入成功并验证文件内容一致
2. 目标路径无权限时返回错误而非部分写入
3. 写入期间进程中断（模拟）后目标文件不存在或不变（原子性保证）
4. 并发写入同一路径（竞争条件边界）
5. 大文件（>1MB）写入成功
6. 路径中含特殊字符（空格、中文）

### P2-9 version.ts 测试场景

具体场景（不少于以下）：
1. 正常路径：从 `i=1` 开始向上搜索，找到 package.json
2. 跳过当前目录（验证 i=1 的逻辑是否如设计）
3. 多层嵌套路径，验证正确返回包含版本号的根 package.json
4. 找不到 package.json 时的错误处理

---

## 十二、验收标准（修订后）

1. **零回归：** npm test 当前测试基线（执行 `npm test` 获取实际数字）全部通过。**不再使用"4698+"幻数**。
2. **P0 回归测试：** 每个 P0 修复项必须新增至少 1 个回归测试用例（特别是 P0-1 路径遍历防护、P0-8 fast path 绕过）
3. **安全门禁：** P0-8/P0-9 修复经安全评审确认，P0-1 外部接口层校验通过白名单覆盖测试
4. **Windows 测试：** P1-1/P1-2/P1-3/P1-4 在 Windows 11 真实环境端到端验证，能完整完成用户交互流程并给出成功/失败明确反馈
5. **Windows CI：** Batch 3 完成后，GitHub Actions 配置 `windows-latest` runner，P0-6 修复可自动化回归验证
6. **测试新增：** atomic-write（≥6 场景）、version.ts（≥4 场景）、hooks installer（≥5 场景）三个测试文件交付
7. **命名空间：** 全量扫描（含 commands/skills/docs/templates）无 `superpowers:` 残留（除明确的废弃说明注释外）
8. **文档同步：** AGENTS.md 版本号 = package.json 版本号
9. **delegation-enforcer：** Batch 2.5 完成后，`explore` 类型 Task 无 model 参数时实际使用 haiku（通过 MCP 日志或 mock 验证）
10. **用户可见性：** P1-4（Windows ax-export）、P2-1/P2-2（命名空间迁移）必须通过用户可感知的提示文案验收
