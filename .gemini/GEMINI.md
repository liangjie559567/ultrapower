# Axiom — 全局规则 (GEMINI.md)
# 版本: v1.0 (ultrapower) | 更新时间: 2026-02-24

> 本文件为 ultrapower 项目的 Gemini 适配器。

---

## 0. 强制语言规则 (Mandatory)
- **语言**: 强制中文，包括对话、注释、Commit、Log。
- **简洁**: 禁止解释标准库用法，禁止复述显而易见的代码变更。

---

## 1. 启动与路由 (Boot & Router)

每次会话开始时：
1. 读取 `.omc/axiom/active_context.md`。
   - `IDLE` → 等待指令。
   - `EXECUTING` → 询问是否继续。
2. 读取 `.omc/axiom/project_decisions.md` 获取架构约束。
3. 读取 `.omc/axiom/user_preferences.md` 获取用户偏好。

---

## 2. 工作流触发器

| 用户意图 | 触发 Skill |
| :--- | :--- |
| 新需求 | `/ax-draft` |
| 评审 | `/ax-review` |
| 拆解 | `/ax-decompose` |
| 实施 | `/ax-implement` |
| 错误分析 | `/ax-analyze-error` |
| 反思进化 | `/ax-reflect` |

---

## 3. Gemini 能力映射
| 操作 | API |
| :--- | :--- |
| 读文件 | `view_file` |
| 写文件 | `write_to_file` / `replace_file_content` |
| 搜索 | `find_by_name` |
| 执行 | `run_command` |

---

## 4. 门禁系统

- **Expert Gate**: 新需求必须经过 `/ax-draft` → `/ax-review`。
- **User Gate**: PRD 确认后才能进入开发。
- **CI Gate**: 代码完成后执行 `tsc --noEmit && npm run build && npm test`。

---

## 5. 进化引擎

- 任务完成后同步学习素材到 `learning_queue.md`。
- 会话结束时更新 `active_context.md` 与相关指标。

_Axiom v1.0 — Gemini Adapter (ultrapower)_
