# Critic Review: ultrapower 项目全面痛点修复计划 Draft PRD

**评审时间：** 2026-03-01
**评审人：** The Critic（安全漏洞 / 边缘情况 / 逻辑一致性审核）
**被评审文件：** `.omc/axiom/draft_prd_pain_points.md`
**代码基版本：** v5.4.8（branch: main）

---

## 整体评分：3 / 10

PRD 识别出了真实存在的问题，但在数字自洽性、修复方案可行性、关键安全遗漏和实施可行性四个维度上存在严重缺陷。以当前状态不可直接进入实施阶段。

---

## 肯定点

1. **问题识别覆盖面广**：10 个模块全量扫描，118 个问题的分类框架是有价值的起点。
2. **P0-3 确认属实**：`scripts/release-steps.mjs:84` 的 `git push origin main` 确实存在，违反 CLAUDE.md 分支策略，是真实的规则违反。
3. **P0-6 确认属实**：daemon.ts Windows 路径 ESM import 失败问题已在代码中确认（第424行 `__filename.replace`，在 Windows 路径下确实存在问题）。
4. **P2 命名空间问题属实**：经代码确认，`commands/` 下3个文件和 `skills/` 下多个文件确实存在 `superpowers:` 旧命名空间引用。
5. **P1-8 占位实现属实**：`src/hooks/recovery/session-recovery.ts:184-189` 确认存在占位注释并返回 `true`。

---

## 差异点 / 问题

### D-CR-01：顶层目标数字自相矛盾（内部一致性崩溃）

* **严重度：** HIGH

* **描述：** PRD 第一节"背景与目标"明确写"消除 HIGH 严重度安全与稳定性 Bug（共 **23 项**）"，但第二节问题汇总表中 HIGH 列合计为 **31 项**（7+5+4+7+1+1+2+4=31）。这两个数字出现在同一份文档的相邻章节，差值 8 项，不存在解释性脚注。这暴露出 PRD 由多个片段拼合而成，未经整体一致性校验。任何依赖该数字进行工作量估算或进度追踪的下游 agent / 人员都会得到错误基线。

* **建议：** 在 PRD 定稿前，必须选择一个数字并对齐全文所有引用。优先使用表格统计值（31）并修正目标描述。

---

### D-CR-02：P0-1 修复方案的类型不匹配——assertValidMode 与 state-manager 的语义冲突

* **严重度：** HIGH

* **描述：** PRD 声称修复方案是"在 `getStatePath()` 入口添加 `assertValidMode(name)` 调用"。经代码核实：
  - `assertValidMode()` 的白名单（`validateMode.ts:18-27`）仅包含 8 个值：`autopilot, ultrapilot, team, pipeline, ralph, ultrawork, ultraqa, swarm`。
  - 但 `state-manager` 的调用者并不只传入这 8 个模式名。实际代码中存在大量合法的非模式 state name，例如：`LEGACY_LOCATIONS` 的键包含 `boulder, hud-state, prd, ralph-verification` 等；MCP 工具中还会传入会话 ID、analytics 等任意 name。
  - 如果直接在 `getStatePath()` 加入 `assertValidMode()`，将导致所有非模式 state 操作（analytics、daemon state、boulder state 等）在运行时抛出异常，造成比修复前更严重的功能破坏。
  - 正确做法应该是区分"模式 state 路径"和"通用 state 路径"，只对前者做白名单校验；或者为 MCP tool 暴露的 `state_read/write` 接口单独加校验层。

* **建议：** 修复方案必须重新设计。不能在 `getStatePath()` 全局添加 `assertValidMode()`，而应在上层调用链中对来自外部输入的 `mode` 参数做校验，保留内部调用的灵活性。

---

### D-CR-03：P0-4 的"修复"会直接导致 Gemini CLI 挂起

* **严重度：** HIGH

* **描述：** PRD 声称通过 `OMC_GEMINI_YOLO=false` 环境变量使 `--yolo` 可配置，以解决"生产环境安全风险"。但代码现实是：
  - Gemini CLI 的 `--yolo` 标志是"跳过所有交互式确认"的必需参数。在无终端（non-interactive）、无 TTY 的 CI 和 hook 执行环境下，去掉 `--yolo` 后 Gemini CLI 会停在确认提示处等待用户输入，导致进程永久阻塞。
  - 这意味着默认禁用 `--yolo` 会把所有 Gemini MCP 调用变成死锁。PRD 把一个影响运行时可用性的决策降级为"可配置项"，但没有说明默认值，也没有说明 CI 环境如何处理。
  - 安全风险（`--yolo` 禁用确认）和可用性风险（无 `--yolo` 导致阻塞）在 PRD 中被当作单一维度处理，实则是两个相互对立的约束。

* **建议：** 此问题需要在 PRD 中明确说明：默认值必须保持 `--yolo=true` 以保证非交互环境可用；同时应通过限制 Gemini 执行的命令范围（scope 白名单）而非禁用 `--yolo` 来控制安全风险。修复方向写反了。

---

### D-CR-04：P0-7 的"修复方案"会破坏现有 daemon 架构

* **严重度：** HIGH

* **描述：** PRD 建议"通过 stdin / 环境变量传递 config"来取代 `JSON.stringify` 插入代码字符串。但 daemon 的当前架构是：
  - `spawn('node', ['-e', daemonScript])` 使用 `-e` 执行内联脚本（第435行）。
  - `stdio: 'ignore'` 已明确设置（第437行），即子进程的 stdin/stdout/stderr 全部关闭。
  - 修改为 stdin 传递意味着必须将 `stdio` 从 `'ignore'` 改为 `['pipe', 'ignore', 'ignore']`，但这会影响 `child.unref()` 的行为——保持 stdin pipe 开启会阻止父进程在部分 Node.js 版本中正常退出，破坏"fire and forget"的 daemon 设计意图。
  - PRD 没有说明如何处理这个架构性矛盾。"通过环境变量"是更可行的替代，但 config 中可能含路径等大型字符串，环境变量有长度限制（Windows 上约 32KB）。

* **建议：** 必须在 PRD 中明确选择一种方案并分析副作用：(A) 使用临时文件传递 config（写入后由子进程读取，需要清理逻辑）；(B) 保留 JSON.stringify 但对 config 字段做严格转义校验（更小改动）。不能只写"通过 stdin"就结束。

---

### D-CR-05：P0-2 的修复方案被实际代码否定——问题已部分存在但形式不同

* **严重度：** MEDIUM

* **描述：** PRD 声称 `execSync(\`${checkCommand} ${command}\`)` 存在 shell 注入风险，建议改为 `execFileSync('which', [command])`。经代码核实（`src/tools/lsp/servers.ts:157-158`）：
  - 实际代码已经做了平台分支：`const checkCommand = process.platform === 'win32' ? 'where' : 'which'`。
  - 但 `command` 变量的来源和是否经过校验仍未在 PRD 中说明。如果 `command` 来自 LSP server 配置文件（用户可控），才是真实注入风险；如果来自内部硬编码列表，风险可忽略。
  - PRD 省略了这个关键的"威胁来源"分析，使得修复的必要性和紧迫性无法被独立验证。

* **建议：** 必须补充 `command` 变量的数据流分析（从哪里来，是否用户可控），才能正确评估此问题的严重度。

---

### D-CR-06：P1-9 delegation-enforcer"功能死区"的真实原因被模糊化

* **严重度：** MEDIUM

* **描述：** PRD 描述 delegation-enforcer 是"功能死区"，建议"在 `bridge.ts` 的 `processHook` 中实际集成"。经代码核实：
  - `src/features/delegation-enforcer.ts` 确实存在完整的 `enforceModel()` 实现。
  - `src/__tests__/delegation-enforcer-integration.test.ts:13` 的注释明确说明原因："these tests are SKIPPED because the delegation enforcer is not yet wired into the hooks bridge"。
  - 但 `bridge.ts` 中完全没有任何 `import` 或调用 `delegation-enforcer` 的痕迹（已通过 grep 确认零匹配）。
  - PRD 把这个问题归类为 P1（中等）是否合理？`enforceModel` 的作用是确保每个 Task 调用都有正确的 model 参数。如果 enforcer 从未被调用，那么所有 Task 调用中 model 参数的自动注入功能都是死代码，这可能是一个影响整个多 Agent 编排核心功能的 P0 问题，而非 P1。

* **建议：** 重新评估此问题严重度。同时 PRD 需要说明：集成 enforcer 到 `processHook` 的性能影响（每次 hook 调用都会执行 enforcer），以及是否应该只在 `pre-tool-use` 中对 Task 类型调用执行。

---

### D-CR-07：Batch 1 任务数量与覆盖项目数严重不匹配

* **严重度：** HIGH

* **描述：** PRD 第十一节："Batch 1（P0 安全 + 稳定性）- 估计 **2 个任务**"，但覆盖范围是 P0-1 至 P0-7（7项）加 P1-6/P1-7（2项），共 **9 个独立修复点**，横跨 4 个不同文件（`state-manager/index.ts`, `lsp/servers.ts`, `release-steps.mjs`, `gemini-core.ts`, `daemon.ts`, `lsp/client.ts`）。"2 个任务"严重低估了工作量。这不是措辞问题，而是会导致 executor agent 在 2 个任务预算内试图完成 9 项修复，进而走捷径或遗漏验证。同样的问题存在于 Batch 2（"3个任务"覆盖 9 项修复）和 Batch 3（"2个任务"覆盖 10 项修复）。

* **建议：** 按照 1 个任务最多覆盖 2-3 个相关修复的原则重新拆分。Batch 1 至少需要 4 个任务。

---

### D-CR-08：验收标准"4698+ 测试全部通过"是不可验证的幻数

* **严重度：** MEDIUM

* **描述：** PRD 第十二节声明"npm test 中 4698+ 测试全部通过"。经代码核实：
  - 项目中存在 210 个 `.test.ts` 文件（已通过 `find` 确认）。
  - 但实际测试用例总数需要运行 `npm test` 才能确认，PRD 中的"4698"数字来源不明，可能是某次历史运行的结果，当前版本可能已变化。
  - 更关键的问题是：此验收标准对新增修复没有增量要求。验收标准只说"不新增失败"，但没有要求 P0 修复必须有对应的回归测试覆盖。一个修复了但没有测试保护的安全补丁，在下次重构时可能被无意撤销。

* **建议：** 删除具体数字"4698"，改为"当前测试基线数量（执行 `npm test` 获取）全部通过，且每个 P0 修复必须新增至少 1 个回归测试用例"。

---

### D-CR-09：严重安全问题遗漏——bridge-normalize.ts 快速路径绕过安全校验

* **严重度：** HIGH（应为 P0，PRD 中未出现）

* **描述：** 经代码核实，`src/hooks/bridge-normalize.ts:117-130` 的快速路径（fast path）逻辑存在安全风险：
  - `isAlreadyCamelCase()` 函数判断：只要输入对象包含 `sessionId`、`toolName`、`directory` 中任意一个键，且没有下划线键，就直接跳过 Zod 验证，以原始对象直接返回。
  - 这意味着攻击者可以构造一个包含 `sessionId: "anything"` 的恶意输入，同时附加任意未知字段，完全绕过 Zod schema 验证（包括 `KNOWN_FIELDS` 白名单过滤）。
  - 快速路径的返回值中确实只选取了已知字段（第152-168行），但返回对象包含 `...rest` 展开（需要进一步确认），或者下游代码直接操作原始 `toolInput` 时，未知字段可能泄漏。
  - CLAUDE.md 的安全规范明确要求"所有 hook 输入经 bridge-normalize.ts 白名单过滤"，但快速路径实际上跳过了这个保证。

* **建议：** 此问题应升级为 P0。快速路径必须对敏感 hook 类型（`SENSITIVE_HOOKS`）禁用，或者快速路径的输出也必须经过字段白名单过滤。

---

### D-CR-10：严重安全问题遗漏——Atomics.wait 在主线程使用

* **严重度：** HIGH（应为 P0，PRD 中未出现）

* **描述：** 经代码核实，`src/hooks/subagent-tracker/index.ts:164-170` 和 `src/notifications/session-registry.ts:100` 中存在 `Atomics.wait()` 调用：
  ```
  Atomics.wait(view, 0, 0, ms);
  ```
  - `Atomics.wait()` 在 Node.js 主线程（非 Worker）中调用时，会抛出 `TypeError: Cannot use Atomics.wait() on the main thread`，导致整个 hook bridge 崩溃。
  - 这取决于这些函数是否在 Worker 上下文中调用。但 hook bridge 的执行模型是单进程 Node.js，没有 Worker 线程的证据。如果确实在主线程调用，这是一个会导致 hook 系统完全失效的崩溃性 bug。
  - PRD 的 4 个并行 Explore Agent 扫描中没有任何人发现这个问题，说明扫描质量存疑。

* **建议：** 此问题应立即升级为 P0 并验证实际执行上下文。如果在主线程，必须替换为 `setTimeout` 基于的异步等待。

---

### D-CR-11：P1-8 路径错误——PRD 指向不存在的文件路径

* **严重度：** MEDIUM

* **描述：** PRD P1-8 声称问题位于 `src/features/session-recovery/session-recovery.ts:183-189`。但经文件系统核实，实际文件路径是 `src/hooks/recovery/session-recovery.ts`（`src/features/session-recovery/` 目录根本不存在）。PRD 中的路径是错误的。虽然问题本身属实（占位实现已确认），但错误的路径会导致 executor agent 找不到文件。这类路径错误可能在所有 118 个问题中普遍存在，因为 PRD 没有说明路径是如何获取和验证的。

* **建议：** 所有"位置"字段必须通过 `find` 或 grep 实际验证后才能写入 PRD。

---

### D-CR-12：P0-3 修复方案不完整——删除 git push 后发布流程断裂

* **严重度：** MEDIUM

* **描述：** PRD 对 P0-3 的修复是"删除此行或改为走 PR 流程"。但 `release-steps.mjs` 是一个自动化发布脚本，`git push origin main` 是其中一个必要步骤。删除该行后：
  - 版本 tag 推送到哪里？
  - `main` 分支如何保持与发布版本同步？
  - CLAUDE.md 规范要求"所有 PR 以 dev 为目标"，但这不意味着 `main` 永远不能有新提交——发布流程通常是 `dev -> main` 的合并。
  - PRD 没有提供完整的替代发布流程，只是删除一行并说"走 PR 流程"，但自动化脚本如何创建 PR？

* **建议：** 修复方案应重写为：将 `git push origin main` 替换为 `git push origin dev && gh pr create --base main --head dev --title "Release vX.X.X"`，或者明确说明人工步骤。不能简单删除。

---

### D-CR-13：验收标准"Windows 真实验证"没有可执行的 CI 方案

* **严重度：** MEDIUM

* **描述：** PRD 第十二节第3条："P1-1/P1-2/P1-3 在 Windows 11 真实环境验证"。但：
  - 没有说明如何在 CI 中执行（GitHub Actions `windows-latest` runner？本地手动？）。
  - 没有说明验证通过的具体标准（什么命令，什么输出算成功）。
  - "真实验证"作为验收标准如果没有自动化，就只能依赖人工，这在快速迭代中极易被跳过。

* **建议：** 验收标准必须包含具体的 CI 配置（如在 `.github/workflows/` 中添加 Windows runner）或具体的手动测试步骤（具体命令、期望输出）。

---

## 总体建议

**结论：Reject（拒绝）**

**严重阻碍（Major Blockers）：**

1. **D-CR-01**：文档内部数字矛盾（23 vs 31 HIGH项），基线数字必须统一后才能进入实施。
2. **D-CR-02**：P0-1 修复方案（assertValidMode 全局注入）会导致运行时功能性崩溃，比原有安全漏洞危害更大，必须重新设计。
3. **D-CR-03**：P0-4 修复方向错误（禁用 --yolo 导致 Gemini 阻塞），会把 MCP Gemini 功能变为死锁。
4. **D-CR-04**：P0-7 修复方案（stdin 传递 config）与 daemon 现有架构冲突（stdio: 'ignore'），需重新选择方案。
5. **D-CR-07**：Batch 1 估计"2个任务"覆盖9项修复，工作量估算失真会导致实施质量下降。
6. **D-CR-09**：bridge-normalize.ts 快速路径安全绕过未进入 P0，是比 PRD 已列出问题更严重的安全漏洞。
7. **D-CR-10**：Atomics.wait 主线程问题未出现在 PRD 中，可能导致 hook 系统崩溃性失效。

**必要的修订步骤：**

* 统一全文数字（HIGH 项统一为 31）。

* P0-1 修复方案改为：仅在 MCP tool 暴露的外部接口层（`state_read`/`state_write` tool handler）添加 mode 白名单校验，不修改 `getStatePath()` 函数签名。

* P0-4 修复方案改为：维持 `--yolo` 默认开启，改为通过命令白名单限制 Gemini 可执行的操作范围。

* P0-7 修复方案改为：使用临时文件传递 config，或对 JSON.stringify 输出进行反斜杠和引号的字符级转义校验。

* 新增 P0-NEW-1：bridge-normalize.ts 快速路径对敏感 hook 禁用 fast path。

* 新增 P0-NEW-2：验证并修复 Atomics.wait 主线程调用问题。

* 修正所有文件路径引用（至少 P1-8 路径错误已确认）。

* 重新估算分批任务数量，Batch 1 拆分为至少 4 个任务。

* 验收标准补充：每个 P0 修复要求对应回归测试；Windows 验证要求具体 CI 配置或手动测试命令。
