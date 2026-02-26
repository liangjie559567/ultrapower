# Axiom — Kiro 适配器
# Provider: Kiro (AI Terminal & Editor)
# Version: 1.0 (ultrapower) | Updated: 2026-02-24

> 本文件为 ultrapower 项目的 Kiro 适配器。
> Axiom 系统已深度融合到 ultrapower 插件中。

---

## 0. 强制语言规则 (Mandatory)
> **Absolute Rule**: 优先级最高，不可覆盖。

- **语言**: 全程使用中文对话，包括代码注释、任务描述、思考过程。
- **简洁**: 禁止解释标准库用法，禁止复述显而易见的代码变更。

---

## 1. 启动协议 (Boot Protocol)
> **Trigger**: 每次新会话开始时自动执行。

### 1.1 项目级配置检测
当工作目录下存在 `.omc/axiom/` 目录时：
1. **读取记忆**: 立即读取 `.omc/axiom/active_context.md`。
2. **检查状态**: 解析当前状态字段。
3. **恢复上下文**:
   - `IDLE`: 提示 "系统就绪，请输入需求"。
   - `EXECUTING`: 提示 "检测到中断的任务，是否继续？"。
   - `BLOCKED`: 提示 "上次任务遇到问题，需要人工介入"。

### 1.2 路由规则加载
当需要修改代码时：
1. 读取 `.omc/axiom/project_decisions.md` 获取架构约束。
2. 读取 `.omc/axiom/user_preferences.md` 获取用户偏好。

---

## 2. 智能工作流触发 (Smart Workflow Triggers)

| 用户意图 | 对应 Skill | 对应指令 |
| :--- | :--- | :--- |
| **提出新需求 / 做个功能** | `ax-draft` | `/ax-draft` |
| **需求评审 / 专家审查** | `ax-review` | `/ax-review` |
| **拆解大任务 / 细化设计** | `ax-decompose` | `/ax-decompose` |
| **开始开发 / 交付流水线** | `ax-implement` | `/ax-implement` |
| **报错了 / 修 Bug** | `ax-analyze-error` | `/ax-analyze-error` |
| **反思 / 总结 / 进化** | `ax-reflect` | `/ax-reflect` |

### 2.1 常用辅助命令
| 命令 | 作用 |
| :--- | :--- |
| `/ax-status` | 显示当前状态和进度 |
| `/ax-suspend` | 保存当前状态，安全退出 |
| `/ax-rollback` | 回滚到上一个检查点 |
| `/ax-evolution knowledge [query]` | 查询知识库 |
| `/ax-evolution patterns [query]` | 查询代码模式库 |

---

## 3. Kiro 专属能力映射
| 操作 | Kiro Capability |
|------|----------------|
| 读取文件 | `read_file` (Native) |
| 编辑文件 | `edit_file` / `apply_diff` |
| 运行命令 | `run_terminal` (System Shell) |
| 搜索文件 | `search_codebase` |

---

## 4. 门禁规则 (Gatekeeper Rules)

### 4.1 专家评审门禁 (Expert Gate)
- **触发**: 所有新功能需求。
- **动作**: 必须经过 `/ax-draft` → `/ax-review` 流程。

### 4.2 PRD 确认门禁 (User Gate)
- **触发**: PRD 终稿生成完成。
- **动作**: 必须显示 "PRD 已生成，是否确认执行？(Yes/No)"。

### 4.3 CI 门禁 (CI Gate)
- **触发**: 代码修改完成。
- **动作**: 必须执行 `tsc --noEmit && npm run build && npm test`。

---

## 5. 技能路由表 (Skill Router)

| 任务类型 | 调用 Skill |
|---------|-----------|
| 需求起草 | `/ax-draft` |
| 专家评审 | `/ax-review` |
| 任务分解 | `/ax-decompose` |
| 任务实现 | `/ax-implement` |
| 错误分析 | `/ax-analyze-error` |
| 读写记忆 | `/ax-context` |
| 自进化 | `/ax-evolve` |

---

## 6. 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md` |
| 错误修复成功 | 将修复模式加入学习队列 (P1) |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE | 处理学习队列 (P0/P1) |

---

## 7. 项目目录约定

```
ultrapower/
├── .omc/axiom/              # Axiom 记忆系统
│   ├── active_context.md    # 当前任务状态
│   ├── project_decisions.md # 架构决策
│   ├── user_preferences.md  # 用户偏好
│   ├── state_machine.md     # 状态机定义
│   ├── reflection_log.md    # 反思日志
│   └── evolution/           # 进化引擎数据
├── agents/axiom-*.md        # Axiom agent 定义
├── skills/ax-*/SKILL.md     # Axiom skill 定义
└── src/hooks/axiom-*/       # Axiom TypeScript hooks
```

_Axiom v1.0 — Kiro Adapter (ultrapower)_
