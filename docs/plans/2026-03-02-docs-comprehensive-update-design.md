# 全面文档整理更新设计文档

**日期：** 2026-03-02
**版本目标：** v5.5.5
**状态：** 已批准，待实施

---

## 1. 背景与目标

ultrapower 完成了 Batch 1~4 共 28 个痛点修复任务（v5.5.0~v5.5.5），但文档体系存在以下问题：

- `docs/standards/` 中 9 个文件版本号停留在 5.0.21，与项目版本 5.5.5 严重不一致
- `CHANGELOG.md` 缺少 v5.5.0~v5.5.4 的变更记录
- `REFERENCE.md`、`ARCHITECTURE.md`、`FEATURES.md` 内容未反映 v5.5.x 新功能和安全修复
- `docs/partials/` 与 `docs/shared/` 内容重复
- `docs/reviews/`、`docs/prd/` 中存在已过期的草稿文档

**目标：** 全面重组 — 版本对齐 + 内容更新 + 目录整理。

---

## 2. 执行方案：并行 Agent（方案 B）

### 并行组 1：三个主文档完整重写

| 文件 | 当前行数 | 重写目标 |
|------|---------|---------|
| `docs/REFERENCE.md` | 1078 行 | 基于 v5.5.5 完整重写，覆盖 49 agents、71 skills、35 tools、47 hooks、执行模式、MCP 路由 |
| `docs/ARCHITECTURE.md` | 232 行 | 更新架构图，新增 delegation-enforcer、bridge-normalize 安全修复、Axiom 状态机章节 |
| `docs/FEATURES.md` | 620 行 | 更新所有工具描述，新增 Axiom 集成章节、Windows 支持章节 |

### 并行组 2：版本对齐 + CHANGELOG + 清理

| 任务 | 范围 |
|------|------|
| CHANGELOG 补全 | 为 v5.5.0~v5.5.4 各添加 3~5 条精简摘要 |
| docs/standards/ 版本升级 | 9 个文件 5.0.21/5.0.22 → 5.5.5，updated 日期 → 2026-03-02 |
| 过期文件清理 | 删除 docs/reviews/ 中的旧版草稿、docs/prd/ 过期文档 |

### 串行收尾

1. 合并 `docs/shared/` → `docs/partials/`
2. 为三个主文档添加版本头注释
3. `npm run build && npm test` CI 验证
4. 创建 PR：`git checkout -b docs/v5.5.5-comprehensive-update dev`

---

## 3. 主文档内容大纲

### docs/REFERENCE.md 新结构

```
# ultrapower Reference — v5.5.5
## Installation & Quick Start
## Configuration
## Execution Modes (6 modes)
## Agents (49 个，按 Lane 分组)
  ### Build/Analysis Lane (8)
  ### Review Lane (6)
  ### Domain Specialists (16)
  ### Product Lane (4)
  ### Axiom Lane (14)
  ### Coordination (1)
## Skills (71 个)
  ### Workflow Skills
  ### Axiom Skills
  ### Superpowers Skills
  ### Agent Shortcuts
  ### Utility Skills
## Custom Tools (35 个，8 类)
  ### LSP Tools (12)
  ### AST Tools (2)
  ### Python REPL (1)
  ### Notepad Tools (6)
  ### State Tools (5)
  ### Project Memory Tools (4)
  ### Trace Tools (2)
  ### Skills Tools (3)
## Hooks System (47 个)
## MCP Integration
## Security & Safety Rules
```

### docs/ARCHITECTURE.md 新结构

```
# ultrapower Architecture — v5.5.5
## Overview
## Core Pipeline
  ### Hook Bridge (bridge-normalize, SENSITIVE_HOOKS 安全修复)
  ### Delegation Enforcer (model 自动注入)
  ### State Manager (assertValidMode 路径防护)
## Feature Layer
## Axiom System
  - 状态机: IDLE→PLANNING→CONFIRMING→EXECUTING→AUTO_FIX→BLOCKED→ARCHIVING
  - 记忆架构
## MCP Integration Layer
## Security Boundaries (v5.5.5 新增)
```

### docs/FEATURES.md 新结构

```
# ultrapower Features — v5.5.5
## Notepad System (6 tools)
## State Management (5 tools)
## Project Memory (4 tools)
## LSP / AST / Python REPL
## Delegation Enforcer (新增)
## Axiom Integration (14 agents, 14 skills, 2 hooks)
## Execution Modes Deep Dive
## Hook System
## Windows Support (v5.5.x 修复)
## MCP Routing
```

---

## 4. CHANGELOG 补全格式

```markdown
## [5.5.4] - 2026-03-02
### Code Quality
- Expand `generatePromptId` entropy from 4 to 8 bytes
- Add 4MB prompt size limit to `executeGemini`
- Unify catch blocks to return `isError: true` consistently
- Dynamic `ALLOWED_BOUNDARIES` calculation in skills-tools

## [5.5.3] - 2026-03-02
### Documentation & Namespace
- Replace all `superpowers:` prefix residuals with `ultrapower:`
- Add deprecation notice for legacy namespace with migration hints
- Sync AGENTS.md version and agent count with package.json
- Add `$` anchor to bump-version.mjs regex; fix ax-status/ax-export paths
- Add GitHub Actions windows-latest CI matrix

## [5.5.2] - 2026-03-02
### Feature
- Add delegation-enforcer: auto-inject model for Task/Agent calls
  (explore→haiku, executor→sonnet when model unspecified)

## [5.5.1] - 2026-03-02
### Fix (Windows & Features)
- Fix `which`/`where` platform branch in auto-update
- Fix path handling: use `path.relative()` + `path.resolve()` normalization
- Fix `wait_for_job` max wait timeout (60s cap)
- Fix `handleKillJob` order: kill process before writing status

## [5.5.0] - 2026-03-02
### Security
- Add `assertValidMode()` path traversal guard at state_read/state_write entry
- Replace `execSync` with `execFileSync` in LSP servers (shell injection fix)
- Disable fast path for SENSITIVE_HOOKS in bridge-normalize
- Fix `Atomics.wait()` main-thread crash: fall back to setTimeout
- Fix Windows ESM import: use `pathToFileURL()` for daemon module loading
- Replace config JSON.stringify injection with tmp-file + env-var pattern
- Add 64MB buffer cap + `clearTimeout` on disconnect in LSP client
```

---

## 5. 过期文件清理清单

**删除：**
- `docs/reviews/ultrapower-full-bugfix-plan/` — Batch 1~4 已完成，草稿无保留价值
- `docs/reviews/draft-prd-ultrapower-pain-fix/` — 已被 Rough PRD + Manifest 取代
- `docs/prd/` 中版本低于 v5.0 的草稿 PRD

**保留：**
- `docs/reviews/ultrapower-pain-points/` — 原始痛点记录，有历史价值
- `docs/plans/` 中 2026-02 之后的计划文档

---

## 6. 最终交付物

| 交付物 | 说明 |
|--------|------|
| `docs/REFERENCE.md` | 完整重写，~1200 行 |
| `docs/ARCHITECTURE.md` | 完整重写，~300 行 |
| `docs/FEATURES.md` | 完整重写，~700 行 |
| `CHANGELOG.md` | 补全 v5.5.0~v5.5.4 共 20 条记录 |
| `docs/standards/*.md` | 9 个文件版本号更新 |
| 已删除文件 | ~3 个过期目录 |
| PR to `dev` | `docs/v5.5.5-comprehensive-update` |
