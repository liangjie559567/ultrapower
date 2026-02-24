# Axiom — GitHub Copilot 适配器
# Provider: Copilot / GPT (OpenAI)
# Version: 1.0 (ultrapower) | Updated: 2026-02-24

---

## 0. 强制语言规则 (Mandatory)
- **语言**: 全程使用中文对话，包括代码注释、任务描述、思考过程。
- **简洁**: 禁止解释标准库用法，禁止复述显而易见的代码变更。

---

## 1. 启动协议 (Boot Protocol)

当工作目录下存在 `.omc/axiom/` 目录时：
1. 读取 `.omc/axiom/active_context.md`，解析当前状态。
2. 读取 `.omc/axiom/project_decisions.md` 获取架构约束。
3. 读取 `.omc/axiom/user_preferences.md` 获取用户偏好。

状态恢复：
- `IDLE`: 提示 "系统就绪，请输入需求"。
- `EXECUTING`: 提示 "检测到中断的任务，是否继续？"。
- `BLOCKED`: 提示 "上次任务遇到问题，需要人工介入"。

---

## 2. 工作流触发器

| 用户意图 | 对应指令 |
| :--- | :--- |
| 提出新需求 / 做个功能 | `/ax-draft` |
| 需求评审 / 专家审查 | `/ax-review` |
| 拆解大任务 / 细化设计 | `/ax-decompose` |
| 开始开发 / 交付流水线 | `/ax-implement` |
| 报错了 / 修 Bug | `/ax-analyze-error` |
| 反思 / 总结 / 进化 | `/ax-reflect` |
| 查看状态 | `/ax-status` |
| 保存退出 | `/ax-suspend` |
| 回滚 | `/ax-rollback` |

---

## 3. Copilot 专属能力映射
| 操作 | Copilot API |
|------|------------|
| 读取文件 | `read_file` |
| 编辑文件 | `replace_string_in_file` |
| 创建文件 | `create_file` |
| 运行命令 | `run_in_terminal` |
| 搜索文件 | `semantic_search` / `grep_search` |

---

## 4. 门禁规则

### Expert Gate
- 所有新功能需求必须经过 `/ax-draft` → `/ax-review` 流程。

### User Gate
- PRD 终稿生成后必须显示确认提示，用户确认后才能进入开发。

### CI Gate
- 代码修改完成后必须执行：`tsc --noEmit && npm run build && npm test`。
- 未通过禁止宣告完成。

---

## 5. 技术栈
- 语言: TypeScript/Node.js
- 构建: `npm run build`
- 类型检查: `tsc --noEmit`
- 测试: `npm test`
- 分支: 默认基础分支 `dev`，PR 使用 `gh pr create --base dev`

---

## 6. 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md` |
| 错误修复成功 | 将修复模式加入学习队列 (P1) |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |

_Axiom v1.0 — Copilot/GPT Adapter (ultrapower)_
