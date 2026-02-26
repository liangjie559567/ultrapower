# Ultrapower 集成设计

**目标：** 将 ultrapower（OMC）多 agent 编排合并到 superpowers 中，创建"ultrapower"——一个统一插件，将 superpowers 的严格工作流执行与 OMC 的多 agent 执行能力相结合。

**架构：** superpowers 作为纪律层（硬性门控、铁律）+ OMC 作为能力层（agents、执行模式、MCP 工具）。

---

## 合并内容

### 从 OMC → superpowers

| 类别 | 内容 | 操作 |
|---|---|---|
| TypeScript 源码 | `src/`、`package.json`、`tsconfig.json`、`scripts/`、`bridge/` | 整体复制 |
| Skills（41 个独特） | autopilot、ralph、ultrawork、team、pipeline 等 | 复制到 `skills/` |
| Agents（30 个） | executor、architect、debugger 等 | 复制到 `agents/` |
| Hooks | `scripts/*.mjs`、hook 模板 | 与现有 hooks 集成 |
| MCP 配置 | `.mcp.json` | 复制 |
| Codex agents | `agents.codex/` | 复制 |
| CLAUDE.md 内容 | OMC 编排说明 | 合并到 session-start hook |

### 重叠解决（superpowers 优先——更严格）

| OMC skill | superpowers 等效 | 解决方案 |
|---|---|---|
| `tdd` | `test-driven-development` | 保留 superpowers 版本；OMC `tdd` 成为别名 |
| `brainstorming`（OMC 中无） | `brainstorming` | 保留 superpowers 版本 |

### superpowers Skills——保持不变

所有 14 个 superpowers skills 保持不变（它们是纪律层）。

---

## 项目身份变更

- 插件名称：`ultrapower`
- 描述："有纪律的多 agent 编排：工作流执行 + 并行执行"
- 版本：`5.0.0`
- 前缀：skills 使用 `ultrapower:`

---

## Hook 集成策略

session-start hook 同时注入：
1. `using-superpowers` 内容（现有——skill 发现）
2. OMC CLAUDE.md 编排说明（新增——agent 委托规则）

两者都作为 `EXTREMELY_IMPORTANT` 上下文注入。
