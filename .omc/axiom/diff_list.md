# 差异点仲裁清单 — ultrapower 全面痛点修复计划

**生成时间：** 2026-03-01
**仲裁人：** axiom-review-aggregator（首席 PM）
**输入来源：** 5 位专家评审（UX Director、Product Director、Domain Expert、Tech Lead、Critic）
**差异点总数：** 36 项（UX×5 + PD×9 + DE×8 + TL×10 + CR×13，去重后实际独立冲突 7 项）

---

## 冲突仲裁层级

1. 安全与安全性（Critic）：不可协商
2. 技术可行性（Tech）：硬性约束
3. 战略对齐（Product Director）：P0/P1 范围
4. 业务价值（Domain）：逻辑正确性
5. 用户体验（UX Director）：优化建议

---

## 冲突仲裁决定

### 冲突 1：P0-3（git push origin main）是否存在 + 严重度

**冲突方：**

* Critic（D-CR-01/D-CR-12）：属实，release-steps.mjs:84 存在，修复方案不完整（删除后发布流程断裂）

* Domain Expert（D-DE-01）：即使存在，CVSS ~3.1，应降级为 P2（触发受控、dryRun 保护）

* Tech Lead（D-TL-02）：前 60 行未找到该代码，问题描述可能失效，需重新定位

**仲裁决定：降级为 P2，修复方案重写**

**理由：**

* 技术可行性层（层级 2）：Tech Lead 确认前 60 行无此代码，需重新定位行号。Critic 确认文件行 84 属实，两者不矛盾（行号在 60 行之后）。问题存在，但定位需精确化。

* 业务价值层（层级 4）：Domain Expert 的 CVSS 分析可靠——该行在 CI 脚本中、有 dryRun 保护、非权限提升场景，CVSS ~3.1 属于低严重度。将 P0 资源保留给真实安全向量（P0-1、P0-7）符合优先级原则。

* Critic 对修复方案的批评完全正确（D-CR-12）：简单删除会导致发布流程断裂，修复方案必须重写为 PR 流程。

**修订内容：**

* P0-3 降级为 P2-NEW（P2 分组新增）

* 修复方案改为：将 `git push origin main` 替换为通过 `gh pr create --base main --head dev --title "Release vX.X.X"` 的 PR 流程，并在 CLAUDE.md 中记录发布步骤

---

### 冲突 2：P0-1 修复方案（assertValidMode 全局注入）

**冲突方：**

* Critic（D-CR-02）：assertValidMode 全局注入会崩溃，必须重新设计——仅在外部接口层校验

* Tech Lead（D-TL-01）：确认存在两处独立 getStatePath 实现（state-manager + state-tools），工作量加倍

* Domain Expert：确认路径遍历防护需要修复，修复方向认可

**仲裁决定：接受 Critic 方案，同时接受 Tech Lead 的双实现修复要求**

**理由：**

* 安全层（层级 1）：Critic 的分析最高优先级。assertValidMode 白名单仅含 8 个模式，全局注入到 getStatePath() 会导致 analytics state、boulder state 等合法非模式调用在运行时崩溃——比原有漏洞危害更大。必须采用仅在外部接口层（MCP tool handler 的 state_read/state_write 入口）添加校验的方案。

* 技术可行性层（层级 2）：Tech Lead 确认两处实现，工作量加倍，PRD 必须更新估算。

**修订内容：**

* P0-1 修复方案改为：在 MCP tools 暴露的 `state_read`/`state_write` tool handler 入口添加 mode 参数白名单校验，不修改 `getStatePath()` 函数签名

* 在 `src/tools/state-tools.ts` 同步评估 StateToolMode 类型覆盖

* Batch 1 任务拆分：P0-1 分为两个子任务（state-manager 层审查 + state-tools 层审查）

---

### 冲突 3：P0-4（--yolo）修复方向

**冲突方：**

* Critic（D-CR-03）：禁用 --yolo 导致 Gemini 在 CI 环境永久阻塞，修复方向完全错误

* Domain Expert（D-DE-02）：同意 --yolo 是非交互必需参数，真实风险是"无法关闭"而非"标志本身"；修复方式应为命令白名单，不是禁用标志

* Tech Lead（D-TL 肯定点）：确认 gemini-core.ts 和 mcp-team-bridge.ts 两处硬编码，改为环境变量方案合理

**仲裁决定：接受，但修复目标从"安全开关"改为"可配置性"**

**理由：**

* 安全层（层级 1）：Critic 的技术判断不可忽视——默认禁用 --yolo 会导致所有非交互环境的 Gemini 调用死锁，是比原有硬编码更严重的问题。

* 技术可行性层（层级 2）：Tech Lead 确认环境变量方案可行，两处硬编码都需修复。

* 业务价值层（层级 4）：Domain Expert 的分析精确——风险是"未来 CLI 行为变更时无法响应"，而非当前安全漏洞。OMC_GEMINI_YOLO 环境变量的默认值必须为 true，并在文档中说明语义边界。

**修订内容：**

* P0-4 修复方案重写：`OMC_GEMINI_YOLO` 默认值 `true`（维持现有行为），设为 `false` 时仅在有 TTY 的交互式环境生效（CI 强制使用 true）

* 同步修复 gemini-core.ts 和 mcp-team-bridge.ts 两处

* PRD 描述从"安全风险"改为"可配置性缺失"

---

### 冲突 4：P0-7（JSON.stringify）修复方案

**冲突方：**

* Critic（D-CR-04）：stdin 方案与 daemon `stdio: 'ignore'` 架构冲突，会破坏 fire-and-forget 设计

* Tech Lead（D-TL-04）：确认 stdio:ignore 冲突，且环境变量有大小限制（Windows ~32KB）和安全问题（/proc 暴露）；stdin framing 与 prompt stdin 管道冲突

**仲裁决定：接受，修复方案改为临时文件方案**

**理由：**

* 技术可行性层（层级 2）：两位技术评审员一致确认 stdin 方案不可行（架构冲突），环境变量方案有大小限制和安全问题。

* Critic 提出的临时文件方案（写入后子进程读取，需要清理逻辑）是三者中最可行的，无架构冲突、无大小限制、安全性可控。

* 另一可行方案（保留 JSON.stringify 但严格转义）工作量更小，但存在字符集边界情况。优先采用临时文件方案。

**修订内容：**

* P0-7 修复方案改为：将 config 写入系统临时目录（`os.tmpdir()`）中的随机文件，通过环境变量传递文件路径给子进程；子进程启动后读取并删除临时文件（原子清理）

* 同步评估 config 字段中的敏感信息是否需要在临时文件中加密

---

### 冲突 5：P0-5（prompt-injection 静默失败）严重度

**冲突方：**

* Domain Expert（D-DE-03）：代码已有 console.error，"静默失败"描述不实，真实风险是功能降级，建议降级为 P1

* UX Director（D-UX-01）：同意需要用户可见反馈（console.warn 不够），但降级不是解决方案，需要 fallback 硬编码列表

* Critic：将 P0-5 列为 PRD 描述不准确的问题（D-CR-05 相关）

**仲裁决定：降级为 P1，同时接受 UX Director 的用户可见反馈要求**

**理由：**

* 业务价值层（层级 4）：Domain Expert 的事实分析正确——代码已有 console.error，"静默"描述有误；真实风险是功能降级（角色验证失效），不是安全漏洞。功能降级属于 P1 稳定性问题。

* 用户体验层（层级 5）：UX Director 的 fallback 设计要求合理，在 P1 内落实。

* P0 资源应保留给真实安全漏洞（路径遍历、代码注入）。

**修订内容：**

* P0-5 降级为 P1-NEW（P1 分组新增）

* 修复方案增加：用户可见的 CLI 警告输出（格式：`[ultrapower] 警告：角色列表加载失败，已使用默认角色列表。`）

* PRD 描述更正：非"静默失败"，而是"角色验证功能降级"

---

### 冲突 6：P2-1/P2-2（superpowers: 命名空间）是否存在

**冲突方：**

* Tech Lead（D-TL-08）：全代码库 src+scripts grep 结果为 0，可能已修复

* Critic（D-CR 肯定点）：代码确认 commands/ 和 skills/ 下存在引用

**仲裁决定：保留修复项，但降低优先级为调查确认前置条件**

**理由：**

* 技术可行性层（层级 2）：两个 grep 范围不同（src+scripts vs commands+skills），不矛盾。Critic 确认在 commands/ 和 skills/ 目录（非 src/）存在引用，Tech Lead 扫描了 src+scripts，可能遗漏了 commands/ 和 skills/ 目录。

* 在执行前必须做全量扫描（含 commands/、skills/、docs/、templates/），确认实际残留文件列表。

**修订内容：**

* P2-1/P2-2 保留，但添加前置调查任务：执行全量 grep（含 commands/、skills/、docs/）后确定实际工作量

* 如 grep 结果为 0，关闭此项；如有残留，精确列出文件清单

---

### 冲突 7：P1-9（delegation-enforcer）严重度

**冲突方：**

* Domain Expert（D-DE-05）：3-10x 成本放大，P1 最高优先级

* Critic（D-CR-06）：可能应升为 P0，因为是 OMC 核心编排功能死区

* Tech Lead（D-TL-06）：需独立子 PRD + 3 个任务，复杂度极度低估

* UX Director（D-UX-05）：隐形影响，对 AI 工作流质量有直接影响

**仲裁决定：保持 P1，但作为 P1 最高优先级，独立为单独 Batch，需子 PRD**

**理由：**

* 安全层（层级 1）：Critic 的"可能为 P0"未提供安全向量——这不是安全漏洞，而是功能缺失。维持在 P1 范畴内。

* 技术可行性层（层级 2）：Tech Lead 的分析明确——需要独立设计文档 + 3 个任务，不能以"一行调用"方式进入执行。

* 业务价值层（层级 4）：Domain Expert 的成本分析有效——3-10x 成本放大是持续业务损耗。P1 最高优先级合理。

**修订内容：**

* P1-9 单独提升为"P1 高优先级（独立批次）"

* 在 Batch 2.5（原 Batch 2 和 Batch 3 之间）单独执行

* 必须先完成设计文档（集成接口、hook type 范围、modifiedInput 协议）才能进入实现

---

## 已接受的差异点（对 PRD 进行修改）

### D-CR-01 / D-PD-03：HIGH 问题数量自相矛盾

* 来源：Critic（HIGH）、Product Director（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：统一使用表格统计值 31 项，目标描述改为"消除 HIGH 严重度 Bug（共 31 项）"

### D-CR-02：P0-1 修复方案崩溃风险

* 来源：Critic（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：P0-1 修复方案改为仅在外部接口层（state_read/state_write tool handler 入口）添加校验

### D-TL-01：P0-1 两处实现

* 来源：Tech Lead（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：P0-1 分为两个子任务，Batch 1 任务数量调整

### D-CR-03 / D-DE-02：P0-4 修复方向错误

* 来源：Critic（HIGH）、Domain Expert（MEDIUM）

* 仲裁决定：接受 Critic 方案

* 对 PRD 的修改：P0-4 修复方案重写，OMC_GEMINI_YOLO 默认 true，CI 强制 true

### D-CR-04 / D-TL-04：P0-7 修复方案架构冲突

* 来源：Critic（HIGH）、Tech Lead（HIGH）

* 仲裁决定：接受，改为临时文件方案

* 对 PRD 的修改：P0-7 修复方案改为临时文件传递 config

### D-DE-03：P0-5 描述不实 + 降级

* 来源：Domain Expert（HIGH）

* 仲裁决定：接受降级，同时接受 UX 反馈要求

* 对 PRD 的修改：P0-5 降级为 P1，描述更正，增加用户可见警告

### D-DE-01：P0-3 降级为 P2

* 来源：Domain Expert（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：P0-3 移至 P2，修复方案改为 PR 流程

### D-CR-09：bridge-normalize.ts 快速路径安全绕过（新 P0）

* 来源：Critic（HIGH，PRD 未出现）

* 仲裁决定：接受，新增为 P0

* 对 PRD 的修改：新增 P0-8（bridge-normalize fast path 对敏感 hook 禁用或输出白名单过滤）

### D-CR-10：Atomics.wait 主线程问题（新 P0）

* 来源：Critic（HIGH，PRD 未出现）

* 仲裁决定：接受，新增为 P0（需先验证执行上下文）

* 对 PRD 的修改：新增 P0-9（验证 Atomics.wait 调用是否在主线程，若是则替换为 setTimeout 异步等待）

### D-CR-07 / D-TL-05：Batch 1 任务数量严重低估

* 来源：Critic（HIGH）、Tech Lead（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：Batch 1 从"2 个任务"改为"至少 8 个任务"，按修复项 1:1 拆分

### D-CR-11：P1-8 路径错误

* 来源：Critic（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：P1-8 路径从 `src/features/session-recovery/` 改为 `src/hooks/recovery/`

### D-CR-08：验收标准"4698"幻数

* 来源：Critic（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：删除具体数字，改为"当前测试基线全部通过，且每个 P0 修复新增至少 1 个回归测试"

### D-CR-12：P0-3（已降级为 P2）修复方案不完整

* 来源：Critic（MEDIUM）

* 仲裁决定：接受（与 D-DE-01 合并处理）

* 对 PRD 的修改：已在 D-DE-01 仲裁中处理

### D-TL-06：P1-9 需独立子 PRD

* 来源：Tech Lead（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：P1-9 在 Batch 结构中独立为"Batch 2.5"，前置设计文档

### D-DE-05：P1-9 业务价值低估

* 来源：Domain Expert（HIGH）

* 仲裁决定：接受（与 D-TL-06 合并）

* 对 PRD 的修改：P1-9 补充成本影响量化（3-10x 模型成本放大）

### D-DE-06：atomic-write 测试提升至 P1

* 来源：Domain Expert（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：P2-8（atomic-write 测试）提升至 P1，与 P0-1 同批交付

### D-PD-01：缺少用户影响维度

* 来源：Product Director（HIGH）

* 仲裁决定：部分接受（为 HIGH 问题添加用户可见性标注，不要求完整量化）

* 对 PRD 的修改：P0 清单各项增加"用户可见性"标注（1-3 级）

### D-PD-07：绑定版本号

* 来源：Product Director（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：分批计划绑定版本号（Batch 1 对应 v5.5.0，以此类推）

### D-UX-01：静默失败需用户可见反馈

* 来源：UX Director（多项）

* 仲裁决定：接受，补充为 PRD 横切规范

* 对 PRD 的修改：新增"用户反馈规范"：所有静默失败修复项必须同步定义用户可见的错误/降级提示文案

### D-UX-02：命名空间迁移用户引导

* 来源：UX Director（HIGH）

* 仲裁决定：接受

* 对 PRD 的修改：P2-1/P2-2 补充用户引导方案（废弃声明 + hook 层友好拦截提示）

### D-TL-10：缺少依赖关系 DAG

* 来源：Tech Lead（MEDIUM）

* 仲裁决定：接受

* 对 PRD 的修改：分批计划增加"批次间依赖关系"说明，标注串行约束

---

## 已拒绝的差异点

### D-CR-06：P1-9 升为 P0

* 仲裁决定：拒绝

* 理由：没有安全向量，功能缺失不属于 P0 安全问题范畴。Domain Expert 和 Tech Lead 均建议保持 P1。

### D-TL-02：P0-3 不存在（代码无此行）

* 仲裁决定：拒绝（仅部分接受）

* 理由：Tech Lead 扫描范围为前 60 行，Critic 确认问题在行 84。问题存在，但已按 D-DE-01 降级为 P2。精确行号需在执行前重新确认。

### D-PD-02：补充生产紧急修复历史

* 仲裁决定：部分拒绝（缩减范围）

* 理由：背景完整性要求合理，但在 Rough PRD 层面添加 1-2 句历史说明即可，不需要完整的健康状态报告。

### D-DE-04：P0-6 打包产物验证要求

* 仲裁决定：接受（纳入验收标准，但不单独列为问题）

* 理由：技术建议合理（打包后 ESM 路径不同），作为 P0-6 验收标准的补充条件，不单独列为新问题。

### D-DE-08：Gemini prompt 大小上限

* 仲裁决定：拒绝（降为 P3）

* 理由：LOW 级别遗漏项，P2/P3 中另行处理，不影响核心修复计划。

### D-PD-04：批次间接口契约

* 仲裁决定：部分接受（以依赖 DAG 替代接口契约）

* 理由：D-TL-10 的依赖关系图已覆盖此需求，无需单独接口契约文档。

---

## 新增问题（评审过程中发现）

### P0-NEW-1（P0-8）：bridge-normalize.ts 快速路径安全绕过

* 来源：Critic（D-CR-09）

* 位置：`src/hooks/bridge-normalize.ts:117-130`

* 问题：isAlreadyCamelCase() 快速路径跳过 Zod 验证，攻击者可构造含合法 camelCase 键的恶意输入绕过白名单过滤

* 修复：敏感 hook 类型禁用 fast path；或确保 fast path 输出也经过字段白名单过滤

### P0-NEW-2（P0-9）：Atomics.wait 主线程调用风险

* 来源：Critic（D-CR-10）

* 位置：`src/hooks/subagent-tracker/index.ts:164-170`，`src/notifications/session-registry.ts:100`

* 问题：Atomics.wait() 在主线程调用会抛出 TypeError，导致 hook 系统崩溃性失效

* 修复：首先验证执行上下文（是否在 Worker 线程），若在主线程则替换为 setTimeout 基于的异步等待

---

*仲裁完成时间：2026-03-01*
