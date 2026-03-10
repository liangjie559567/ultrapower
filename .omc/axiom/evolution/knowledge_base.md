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

### Vitest 原生模块隔离
**置信度：** 高（已验证，100% 通过率）
**应用：** 使用 pool: 'forks' + isolate: true 避免原生模块线程池崩溃
**原因：** better-sqlite3、@ast-grep/napi 等原生模块在 threads 池中共享内存导致 Segmentation fault

### 全局测试清理
**置信度：** 高（已验证）
**应用：** 使用 tests/setup.ts 统一清理 mock 和定时器
**原因：** 避免测试间 mock 污染和状态泄漏

## Insights

### CCG 工作流诊断策略
**发现：** 使用 debugger agent 可以快速定位 MCP 和脚本问题
**应用：** 老项目 Bug 修复流程
