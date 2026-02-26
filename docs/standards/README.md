# ultrapower 全链路规范体系

> **ultrapower-version**: 5.0.21
> **状态**: 正式发布
> **最后更新**: 2026-02-26
> **真理之源**: `docs/standards/audit-report.md`

ultrapower v5.0.21 具备 49 个 agents、70 个 skills、35 个 hooks 的完整体系。本规范体系从现有代码反向提取，覆盖运行时防护、Hook 执行顺序、状态机、Agent 生命周期、用户使用指南和贡献规范，使 ultrapower 从"能用"升级为"可靠、易用、可扩展"。

---

## 快速导航

| 我是... | 从这里开始 |
|---------|-----------|
| **新用户**（首次使用） | [用户使用指南](./user-guide.md) — 5 分钟内选出正确 skill |
| **日常使用者**（遇到问题） | [反模式清单](./anti-patterns.md) — 10 条常见错误及修复方案 |
| **框架贡献者** | [贡献规范](./contribution-guide.md) — 统一模板和检查清单 |
| **框架维护者** | [运行时防护规范](./runtime-protection.md) — 并发保护和安全边界 |

---

## 规范文档索引

### P0 — 运行时防护（必须遵守）

| 文件 | 说明 | 状态 |
|------|------|------|
| [runtime-protection.md](./runtime-protection.md) | Hook 输入防护 + 状态文件读写规范（含安全边界） | ✅ |
| [hook-execution-order.md](./hook-execution-order.md) | 全部 15 类 HookType 枚举、路由规则、执行顺序与优先级 | ✅ |
| [state-machine.md](./state-machine.md) | Agent 完整状态机（含 TIMEOUT/ZOMBIE 死状态）+ Team Pipeline 转换矩阵 | ✅ |
| [agent-lifecycle.md](./agent-lifecycle.md) | Agent 边界情况矩阵（超时/孤儿/成本超限/死锁）+ SDK 限制说明 | ✅ |

### P0-并行 — 用户使用规范

| 文件 | 说明 | 状态 |
|------|------|------|
| [user-guide.md](./user-guide.md) | Skill 决策树（3 层，5 个意图分支）+ Agent 路由指南 | ✅ |

### P1 — 使用与贡献规范

| 文件 | 说明 | 状态 |
|------|------|------|
| [anti-patterns.md](./anti-patterns.md) | 10 条反模式清单（Bad vs Good 格式，根因可追溯） | ✅ |
| [contribution-guide.md](./contribution-guide.md) | 贡献者旅程 + 5 条必须项检查清单 + CI 门禁说明 | ✅ |

### P2 — 模板与集成

| 文件 | 说明 | 状态 |
|------|------|------|
| [templates/skill-template.md](./templates/skill-template.md) | Skill 标准模板（触发词、约束、输出格式、测试用例） | ✅ |
| [templates/agent-template.md](./templates/agent-template.md) | Agent 标准模板（角色定义、工具权限、输入输出契约） | ✅ |
| [templates/hook-template.md](./templates/hook-template.md) | Hook 标准模板（HookType 声明、必需字段、失败降级策略） | ✅ |

### 审计报告（真理之源）

| 文件 | 说明 |
|------|------|
| [audit-report.md](./audit-report.md) | T-01a/T-01b 现有实现审计报告 — 所有规范的真理之源，记录 9 个 PRD 与代码的差异点 |

---

## 安全边界（不可协商）

以下三条安全规则优先级最高，任何实现不得违反：

1. **路径遍历防护**：`mode` 参数必须通过 `validateMode()` 白名单校验，禁止直接拼接到文件路径。合法值：`autopilot`、`ultrapilot`、`team`、`pipeline`、`ralph`、`ultrawork`、`ultraqa`、`swarm`（共 8 个）。
2. **Hook 输入消毒**：所有 hook 输入必须经过 `bridge-normalize.ts` 白名单过滤。敏感 hook（`permission-request`、`setup-init`、`setup-maintenance`、`session-end`）的未知字段必须被丢弃。
3. **状态文件权限**：`agent-replay-*.jsonl` 等敏感文件权限必须为 `0o600`，且不得提交到 git（`.omc/` 已在 `.gitignore` 中）。

---

## 规范版本化

- 规范文档在文件头部声明 `ultrapower-version: x.y.z`
- 每次 minor 版本升级（如 v5.0.x → v5.1.0）必须更新规范 changelog
- 废弃的规范条目标记 `@deprecated`，保留 2 个 minor 版本后删除

---

## 相关入口

- 项目根 README：`../../README.md`
- 编排指令：`../CLAUDE.md`
- 任务清单：`../tasks/ultrapower-standards/manifest.md`
