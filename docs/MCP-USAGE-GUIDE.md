# MCP 工具使用指南

## 问题说明

Codex 和 Gemini MCP 工具可能因客户端超时而失败（AbortError）。

## 解决方案

### 方案 1：使用后台模式（推荐）

```typescript
// ❌ 错误：同步调用可能超时
ask_codex({
  prompt: "分析代码...",
  agent_role: "architect"
})

// ✅ 正确：使用后台模式
ask_codex({
  prompt_file: ".claude/prompt.md",
  output_file: ".claude/response.md",
  agent_role: "architect",
  background: true
})

// 检查状态
check_job_status({ job_id: "..." })

// 等待完成
wait_for_job({ job_id: "...", timeout_ms: 60000 })
```

### 方案 2：超时配置

**默认超时**（v5.6.10+）：
- Codex: 5 分钟（300000ms）
- Gemini: 5 分钟（300000ms）

**自定义超时**（可选）：
在 `.mcp.json` 中配置：
- `OMC_CODEX_TIMEOUT=25000`（25秒）
- `OMC_GEMINI_TIMEOUT=25000`（25秒）

## 最佳实践

1. **复杂任务**：始终使用后台模式
2. **简单查询**：可尝试同步模式
3. **首次调用**：预期较慢，使用后台模式
