# Tech Feasibility Review: ultrapower 全链路规范体系

**评审日期**: 2026-02-26
**评审人**: Tech Lead
**PRD 版本**: Draft v1
**项目版本**: ultrapower v5.0.21

---

## 1. Architecture Impact (架构影响)

- Schema Changes: No（纯文档工程，不涉及数据模型变更）
- API Changes: No（不修改任何运行时接口）
- Runtime Impact: No（仅新增 docs/ 文件，修改 README.md 和 CLAUDE.md）
- Build Pipeline Impact: No（无需修改 tsconfig.json、vitest.config.ts）

**关键发现**：本 PRD 的 Impact Scope 定义为"纯文档工程"，但存在一个隐性架构影响被忽略——CLAUDE.md 的修改会直接影响所有 agent 的运行时行为（CLAUDE.md 在每次会话启动时被注入为系统上下文）。这不是普通文档修改，属于**运行时配置变更**，需要单独的回归测试策略。

---

## 2. Risk Assessment (风险评估)

- Complexity Score (1-10): **3**
- POC Required: No
- Regression Risk: Medium（CLAUDE.md 修改影响 agent 行为）
- Consistency Risk: High（规范文档与现有代码实现存在潜在不一致）

### 风险明细

**R1 - 规范与实现不一致（High）**
代码库中已存在大量隐式规范（如 `bridge-normalize.ts` 中的 hook 字段白名单、`mode-registry/index.ts` 中的状态文件路径约定）。若文档规范与现有实现描述不符，会造成贡献者困惑。必须以代码为准反向提取规范，而非凭空撰写。

**R2 - CLAUDE.md 修改的运行时副作用（Medium）**
CLAUDE.md 在每次 Claude Code 会话启动时被注入。对其修改（如新增 Axiom 门禁规则、调整路由表）会立即影响所有 agent 的决策逻辑，无法通过单元测试覆盖，只能通过集成测试验证。PRD 未提及此风险。

**R3 - Impact Scope 遗漏（Medium）**
见第 3 节详述。

**R4 - 并发写入规范的可执行性（Low）**
PRD P0 提到"禁止并发写入同一状态文件"，但 `mode-registry/index.ts` 中已有 `STALE_MARKER_THRESHOLD` 机制处理崩溃场景，并未使用文件锁。规范文档需要明确：这是"应该"还是"必须"，以及违反时的降级策略。

---

---

## 3. Impact Scope 完整性分析

### PRD 已列出文件（合理）

| 文件 | 评估 |
|------|------|
| `docs/standards/runtime-protection.md` | 合理，对应 P0 Hook/状态规范 |
| `docs/standards/user-guide.md` | 合理，对应 P1 决策树/路由规范 |
| `docs/standards/contribution-guide.md` | 合理，对应 P2 贡献检查清单 |
| `docs/standards/templates/skill-template.md` | 合理，对应 P2 模板 |
| `docs/standards/templates/agent-template.md` | 合理，对应 P2 模板 |
| `docs/standards/templates/hook-template.md` | 合理，对应 P2 模板 |
| `README.md` | 合理，需更新指向新规范 |
| `CLAUDE.md` | 高风险，见 R2 |

### 遗漏文件（建议补充）

**遗漏 1 - `docs/standards/state-machine.md`（P0 级别）**
`src/hooks/mode-registry/index.ts` 中定义了完整的状态机（autopilot/ultrapilot/swarm/pipeline/team/ralph/ultrawork/ultraqa），包含状态转换规则、stale marker 阈值（1小时）、互斥模式检测。这是运行时保护规范的核心，必须有独立文档。

**遗漏 2 - `docs/standards/hook-execution-order.md`（P0 级别）**
PRD 提到"Hook执行顺序规范"，但未在 Impact Scope 中列出对应文件。`hooks/` 目录下存在 `session-start.sh`、`run-hook.cmd`，`src/hooks/` 下有 `bridge.ts`、`bridge-normalize.ts`、`guards/`、`keyword-detector/` 等多个 hook 类型。执行顺序规范应独立成文，而非合并进 `runtime-protection.md`。

**遗漏 3 - `docs/standards/agent-lifecycle.md`（P0 级别）**
PRD P0 包含"Agent生命周期规范"，但 Impact Scope 中没有对应文件。`src/agents/definitions.ts` 中已有 AgentConfig 类型定义，生命周期规范（创建/路由/执行/销毁）需要独立文档。

**遗漏 4 - `docs/standards/anti-patterns.md`（P1 级别）**
PRD P1 包含"常见反模式清单"，但 Impact Scope 中未列出对应文件。建议独立成文，而非合并进 `user-guide.md`，便于后续维护和搜索。

**遗漏 5 - `docs/standards/README.md`（P2 级别）**
新增 `docs/standards/` 目录后，需要一个索引文件说明各规范文档的用途和阅读顺序，否则贡献者无法快速定位。

---

## 4. Implementation Plan (大致实现计划)

### 阶段一：规范提取（3-4天）

从现有代码反向提取规范，确保文档与实现一致：

- 从 `src/hooks/bridge-normalize.ts` 提取 Hook 字段白名单规范
- 从 `src/hooks/mode-registry/index.ts` 提取状态机转换规则和 stale marker 阈值
- 从 `src/agents/definitions.ts` 提取 Agent 生命周期规范
- 从 `src/hooks/guards/pre-tool.ts`、`post-tool.ts` 提取 Hook 执行顺序

撰写文件：`runtime-protection.md`、`hook-execution-order.md`、`state-machine.md`、`agent-lifecycle.md`

### 阶段二：规范扩展（2-3天）

- 撰写 `user-guide.md`（Skill 调用决策树 + Agent 路由规范）
- 撰写 `anti-patterns.md`（常见反模式清单）
- 撰写 `contribution-guide.md`（贡献检查清单）
- 撰写 3 个模板文件（skill/agent/hook）
- 撰写 `docs/standards/README.md`（目录索引）

### 阶段三：集成与验证（1天）

- 更新 `README.md` 指向新规范
- 审慎修改 `CLAUDE.md`（仅追加，不删除现有规则）
- 人工验证：用新模板创建一个 demo skill，确认模板可用

---

## 5. 技术债务预规划

**TD-1：规范与代码的同步机制（中期）**
当前无机制保证文档规范与代码实现同步。建议在 CI 中加入检查，验证 `mode-registry/index.ts` 中的状态文件路径是否与 `state-machine.md` 描述一致。否则规范文档会随版本迭代快速过时。

**TD-2：CLAUDE.md 版本管理（短期）**
CLAUDE.md 目前通过 `<!-- OMC:VERSION:5.0.21 -->` 标记版本，但没有 changelog。修改前需建立变更记录机制，避免 agent 行为回归无法追溯。

**TD-3：模板的可测试性（中期）**
P2 的 skill/agent/hook 模板目前只是 Markdown 文档。建议后续将模板转为可执行的脚手架脚本，降低贡献者使用门槛，同时可通过 CI 验证模板生成的文件是否符合规范。

**TD-4：并发写入保护的实现层缺失（短期）**
P0 规范"禁止并发写入同一状态文件"目前仅靠约定，`mode-registry` 使用同步 `writeFileSync`，在 Team 模式多 worker 场景存在竞态条件。规范文档应明确推荐原子写入（write-to-temp + rename）模式，并在 `src/lib/` 中提供工具函数，确保规范与实现同步落地。

---

## Conclusion (结论)

- **结论**: Pass（条件通过）
- **Estimated Effort**: 6-8 天（1 名工程师）
- **综合评分**: 7/10

**通过理由**：技术可行性高，纯文档工程，无运行时风险，团队具备完整技术栈。

**通过条件**：
1. Impact Scope 补充遗漏的 5 个文件（`state-machine.md`、`hook-execution-order.md`、`agent-lifecycle.md`、`anti-patterns.md`、`docs/standards/README.md`）
2. CLAUDE.md 修改需单独制定回归验证方案
3. 规范内容必须从现有代码反向提取，禁止凭空撰写
4. TD-4（并发写入原子性）建议在本次迭代中一并解决，避免规范与实现脱节

**扣分项（-3分）**：
- Impact Scope 遗漏 5 个关键文件（-1.5）
- 未识别 CLAUDE.md 的运行时影响（-1）
- 未规划规范与代码的同步机制（-0.5）
