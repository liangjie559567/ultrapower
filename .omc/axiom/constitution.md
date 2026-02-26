# Axiom Constitution — 进化安全边界

> 本文件定义了进化引擎的不可逾越规则。
> 任何自动修改必须通过 constitution-checker 验证。
> **本文件本身不可被自动修改。**

版本：1.0 | 创建日期：2026-02-26

---

## 1. 不可修改文件（Immutable Files）

以下文件禁止被进化引擎自动修改：

- `constitution.md`（本文件）
- `src/hooks/bridge-normalize.ts`（安全消毒层）
- `src/lib/validateMode.ts`（路径遍历防护）
- `src/hooks/session-end/`（会话清理逻辑）
- `src/lib/atomic-write.ts`（原子写入保障）
- `package.json`、`tsconfig.json`（项目配置）
- `.claude/CLAUDE.md`、`CLAUDE.md`（用户指令）

---

## 2. 可修改范围（Mutable Scope）

进化引擎只允许修改以下范围：

| 层级 | 路径 | 修改方式 |
|------|------|---------|
| Layer 2（自由修改） | `.omc/axiom/evolution/*` | 自动，无需确认 |
| Layer 2（自由修改） | `.omc/axiom/reflection_log.md` | 自动，无需确认 |
| Layer 2（自由修改） | `.omc/project-memory.json` | 自动，无需确认 |
| Layer 1（受审查修改） | `agents/*.md` | 需用户确认 + multi-model review |
| Layer 1（受审查修改） | `skills/*/SKILL.md` | 需用户确认 + multi-model review |

---

## 3. 修改频率限制

- 每个 agent 提示词：最多每 **7 天**优化 1 次
- 每次会话：最多触发 **1 次**自动优化建议
- 每日全局上限：最多 **3 个**文件被自动修改
- 冷启动保护：至少 **10 个会话**后才启用自动优化建议

---

## 4. 回滚要求

所有 Layer 1 自动修改必须满足：

1. 修改前创建备份（git stash 或文件副本）
2. 修改后运行 CI Gate：`tsc --noEmit && npm run build && npm test`
3. CI 失败则自动回滚到备份版本
4. 回滚结果记录到 `reflection_log.md`

---

## 5. 审查要求

| 阶段 | 审查方式 |
|------|---------|
| Phase 1（当前）| 无自动修改，仅收集数据 |
| Phase 2 | 用户确认后才应用修改 |
| Phase 3 | multi-model review（Codex critic 角色）通过后才应用 |

---

## 6. 数据隐私边界

进化引擎**禁止**收集以下数据：

- 用户项目源代码内容
- 对话历史原文
- 任何 PII（个人身份信息）
- API 密钥或凭证

进化引擎**只允许**收集：

- agent/skill 调用频次和成功率
- 工作流执行时长
- 错误类型（不含错误详情中的用户数据）
- 用户显式提供的反馈

---

## 7. 跨项目隔离

- 项目知识存储在 `.omc/`（项目级，不跨项目共享）
- 全局知识存储在 `~/.claude/.omc/`（全局级，需用户显式启用共享）
- 默认不跨项目共享任何学习数据

---

## 修订历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-02-26 | 初始版本，Phase 1 被动学习边界 |
