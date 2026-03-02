# Claude Code 插件验证器源码逻辑深度分析

**日期**: 2026-03-01
**目标**: 定位 `hooks: Invalid input, agents: Invalid input` 错误的根因

---

## 1. 核心发现总结

### [FINDING-1] 插件使用"自动组件发现"机制，不依赖 plugin.json 中的声明

Claude Code 的插件系统采用**目录扫描自动发现**机制：
- `agents/` 目录中的所有 `.md` 文件自动加载为 subagents
- `hooks/hooks.json` 自动加载为 hook 配置
- `skills/` 目录中包含 `SKILL.md` 的子目录自动发现
- `commands/` 目录中的 `.md` 文件自动加载为 slash commands
- `.mcp.json` 自动加载为 MCP 服务器配置

**关键点**: plugin.json 中的 `commands`、`agents`、`skills`、`hooks` 字段是**补充路径**（supplement），不是替代默认目录。即使 plugin.json 中不声明这些字段，验证器仍会扫描默认目录。

### [FINDING-2] ZodError 揭示了 hooks 验证的真实 schema 结构

来自 Issue #13927 的错误堆栈明确显示了 Zod 验证失败的路径：

```json
ZodError: [
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": ["hooks", "PreToolUse", 0, "hooks"],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": ["hooks", "PostToolUse", 0, "hooks"],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "array",
    "received": "undefined",
    "path": ["hooks", "UserPromptSubmit", 0, "hooks"],
    "message": "Required"
  }
]
```

**解读**: 验证器期望每个 hook 事件组内的每个 matcher 对象都包含一个 `hooks` 数组字段。
路径 `["hooks", "PreToolUse", 0, "hooks"]` 表示：`hooks.PreToolUse[0].hooks` 是 Required。
