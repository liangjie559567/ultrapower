# Knowledge Base

## Patterns

### MCP 超时配置
**置信度：** 高（已验证）
**应用：** 在 .mcp.json 中设置 OMC_CODEX_TIMEOUT=25000 和 OMC_GEMINI_TIMEOUT=25000
**原因：** MCP 客户端默认超时小于 CLI 执行时间会导致 AbortError

### 退出码规范
**置信度：** 高（已验证）
**应用：** 诊断脚本正常退出使用 process.exit(0)
**原因：** process.exit() 默认返回 1（错误状态）

## Insights

### CCG 工作流诊断策略
**发现：** 使用 debugger agent 可以快速定位 MCP 和脚本问题
**应用：** 老项目 Bug 修复流程
