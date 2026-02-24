# Axiom — Gemini CLI 适配器
# Provider: Gemini CLI
# Version: 1.0 (ultrapower) | Updated: 2026-02-24

## 0. 强制规则
- 语言: 全程中文。
- 输出: 简洁、可执行。
- 代码改动后: 必须执行最小验证（tsc --noEmit && npm test）。

## 1. 启动协议
1. 读取 `.omc/axiom/active_context.md`。
2. 读取 `.omc/axiom/project_decisions.md` 与 `.omc/axiom/user_preferences.md`。
3. 根据用户意图匹配对应 Skill 执行。

## 2. 能力映射
- 读文件: `view_file`
- 写文件: `replace_file_content`
- 搜索: `find_by_name`
- 运行命令: `run_command`

## 3. 推荐命令
- 类型检查: `tsc --noEmit`
- 构建: `npm run build`
- 测试: `npm test`

## 4. 门禁
- 新需求先走 `/ax-draft` → `/ax-review` 门禁。
- 代码完成后必须通过 `tsc --noEmit && npm run build && npm test`。

## 5. 工作流触发器
| 意图 | 指令 |
|------|------|
| 新需求 | `/ax-draft` |
| 评审 | `/ax-review` |
| 拆解 | `/ax-decompose` |
| 实施 | `/ax-implement` |
| 错误分析 | `/ax-analyze-error` |
| 反思 | `/ax-reflect` |

_Axiom v1.0 — Gemini CLI Adapter (ultrapower)_
