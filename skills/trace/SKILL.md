---
name: trace
description: 显示 agent 流程追踪时间线和摘要
---

# Agent 流程追踪

[TRACE MODE ACTIVATED]

## 目标

显示流程追踪，展示本 session 中 hook、关键词、skill、agent 和工具的交互情况。

## 说明

1. **使用 `trace_timeline` MCP 工具**显示按时间顺序排列的事件时间线
   - 不带参数调用以显示最新 session
   - 使用 `filter` 参数聚焦特定事件类型（hooks、skills、agents、keywords、tools、modes）
   - 使用 `last` 参数限制输出数量

2. **使用 `trace_summary` MCP 工具**显示聚合统计
   - Hook 触发次数
   - 检测到的关键词
   - 激活的 skill
   - 模式转换
   - 工具性能和瓶颈

## 输出格式

先展示时间线，再展示摘要。重点标注：
- **模式转换**（执行模式如何变化）
- **瓶颈**（慢速工具或 agent）
- **流程模式**（关键词 -> skill -> agent 链）
