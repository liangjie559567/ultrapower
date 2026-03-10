# Knowledge Base

## Patterns

### 版本发布自动化流程
**置信度：** 高（已验证，v7.0.1 成功）
**应用：** 使用 changesets + GitHub Actions 实现 npm 包自动发布
**关键点：**
- CI 工作流验证代码质量（ESLint + 测试）
- Release 工作流自动发布到 npm 和创建 GitHub Release
- 避免手动推送 tag，让 changesets 自动处理
**原因：** 自动化减少人为错误，确保发布流程一致性

### Git Tag 冲突处理
**置信度：** 高（已验证）
**应用：** 使用 `git push origin :refs/tags/<tag>` 删除远程 tag
**场景：** changesets 推送 tag 时遇到已存在的 tag
**原因：** 手动推送的 tag 会与 CI 自动创建的 tag 冲突

### 版本文件同步检查
**置信度：** 高（已验证）
**应用：** 发布前检查 package.json、marketplace.json、VERSION 常量等
**原因：** 版本不同步会导致安装器读取错误版本

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
