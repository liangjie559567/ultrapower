---
name: frontend-ui-ux
description: 负责 UI/UX 工作的设计开发者
---

# Frontend UI/UX 命令

路由到 designer agent 或 Gemini MCP 处理前端工作。

## 用法

```
/ultrapower:frontend-ui-ux <设计任务>
```

## 路由

### 首选：MCP 直接调用
首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具。
使用 `mcp__g__ask_gemini` 配合 `agent_role: "designer"` 处理设计任务。
若 ToolSearch 未找到 MCP 工具，使用下方的 Claude agent 回退。

### 回退：Claude Agent
```
Task(subagent_type="ultrapower:designer", model="sonnet", prompt="{{ARGUMENTS}}")
```

## 能力
- 组件设计与实现
- 响应式布局
- 设计系统一致性
- 无障碍合规

Task: {{ARGUMENTS}}
