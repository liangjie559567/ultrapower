# Axiom — OpenCode CLI 适配器
# Provider: OpenCode CLI
# Version: 1.0 (ultrapower) | Updated: 2026-02-24

## 0. 强制规则
- 全程中文。
- 仅做必要变更，避免越界修改。
- 每个任务结束必须给出验证证据。

## 1. 启动协议
1. 读取 `.omc/axiom/active_context.md`。
2. 读取 `.omc/axiom/project_decisions.md` 与 `.omc/axiom/user_preferences.md`。
3. 根据用户意图匹配对应 Skill 执行。

## 2. 能力映射
- 文件读取: `read`
- 文件写入: `edit` / `write`
- 代码搜索: `glob` / `grep`
- 终端执行: `bash`

## 3. 运行策略
- 默认走 Agent Native Orchestration。
- 对需要长时执行的任务，按 manifest 原子化推进。
- 失败重试上限 3 次，超限标记 BLOCKED。

## 4. 质量门禁
- 代码变更后执行 `tsc --noEmit && npm run build && npm test`。
- 未通过门禁禁止宣告 DONE。

## 5. 工作流触发器
| 意图 | 指令 |
|------|------|
| 新需求 | `/ax-draft` |
| 评审 | `/ax-review` |
| 拆解 | `/ax-decompose` |
| 实施 | `/ax-implement` |
| 错误分析 | `/ax-analyze-error` |
| 反思 | `/ax-reflect` |
| 状态 | `/ax-status` |

_Axiom v1.0 — OpenCode CLI Adapter (ultrapower)_
