# Learning Queue

## Pending

### [P1] MCP 超时配置模式
**来源：** Session 2026-03-09 CCG Bug 修复
**内容：** MCP 客户端超时需要小于 CLI 执行时间，建议配置 25s 超时
**应用场景：** 所有 MCP 工具配置
**置信度：** 已验证

### [P2] process.exit() 最佳实践
**来源：** Session 2026-03-09 omc-doctor 修复
**内容：** 正常退出必须使用 process.exit(0)，否则返回错误码 1
**应用场景：** 所有诊断脚本
**置信度：** 已验证
