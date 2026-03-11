# Learning Queue

## Pending

### [P0] 版本发布自动化最佳实践
**来源：** Session 2026-03-10 v7.0.1 发布
**状态：** ✅ 已整合到 PAT-001
**内容：** 使用 changesets + GitHub Actions 实现完全自动化发布流程

### [P1] Git Tag 冲突解决方案
**来源：** Session 2026-03-10 v7.0.1 发布
**状态：** ✅ 已整合到 PAT-013
**内容：** 当 changesets 尝试推送已存在的 tag 时会失败

### [P1] 版本文件同步检查清单
**来源：** Session 2026-03-10 v7.0.1 发布
**状态：** ✅ 已整合到 PAT-014
**内容：** 发布前必须同步所有版本文件

### [P1] MCP 超时配置模式
**来源：** Session 2026-03-09 CCG Bug 修复
**状态：** ✅ 已整合到知识库
**内容：** MCP 客户端超时需要小于 CLI 执行时间，建议配置 25s 超时

### [P2] process.exit() 最佳实践
**来源：** Session 2026-03-09 omc-doctor 修复
**状态：** ✅ 已整合到知识库
**内容：** 正常退出必须使用 process.exit(0)，否则返回错误码 1

### [P0] Vitest 原生模块测试隔离
**来源：** Session 2026-03-10 测试修复（89→0 失败）
**状态：** ✅ 已整合到 PAT-011 和知识库
**内容：** 原生模块（better-sqlite3, @ast-grep/napi）在 threads 池中导致 Segmentation fault

### [P0] 全局测试清理机制
**来源：** Session 2026-03-10 测试修复
**状态：** ✅ 已整合到知识库
**内容：** 使用全局 setup 文件统一清理 mock 和定时器，避免测试间污染

### [P1] Windows 文件锁清理策略
**来源：** Session 2026-03-10 测试修复
**状态：** ✅ 已整合到知识库
**内容：** Windows 平台文件句柄释放延迟，需要增加重试次数和延迟

### [P0] Claude Agent SDK tool() Zod Schema 要求
**来源：** Session 2026-03-11 v7.0.2 MCP 类型修复
**状态：** ✅ 已整合到 PAT-015 和知识库
**内容：** Claude Agent SDK 的 tool() 函数要求参数使用 Zod schemas

### [P1] 类型安全的枚举参数设计
**来源：** Session 2026-03-11 v7.0.2 代码审查
**状态：** ✅ 已整合到知识库
**内容：** 对于有限值集合的参数，使用 z.enum() 而非 z.string()

### [P2] 发布流程中的工作目录清理
**来源：** Session 2026-03-11 v7.0.2 发布
**状态：** ✅ 已整合到 PAT-016 和知识库
**内容：** npm version 前必须清理工作目录，区分编译产物和临时文件

### [P0] Claude Code 插件命名规范
**来源：** Session 2026-03-11 文档验证
**状态：** ✅ 已整合到知识库
**内容：** 插件安装使用插件名而非 marketplace@plugin 格式

### [P1] Git 测试环境初始化最佳实践
**来源：** Session 2026-03-11 测试修复
**状态：** ✅ 已整合到知识库
**内容：** Git 测试需要配置 init.defaultBranch 避免提交失败

### [P1] WebFetch GitHub Raw 内容访问限制
**来源：** Session 2026-03-11 错误分析
**状态：** ✅ 已整合到知识库
**内容：** WebFetch 工具无法访问 raw.githubusercontent.com

### [P0] 插件缓存 HUD 编译产物缺失
**来源：** Session 2026-03-11 HUD 不显示问题
**状态：** ⚠️ 已被 PAT-018 替代（真实原因是路径格式问题）
**内容：** 最初怀疑是插件缓存问题，实际是 Windows 路径格式错误

### [P0] Windows 路径格式规范
**来源：** Session 2026-03-11 HUD 诊断
**状态：** ✅ 已整合到 PAT-018 和知识库
**内容：** Claude Code settings.json 必须使用 Unix 正斜杠格式

## Processed (已处理)

本次进化处理了 **15 个学习项目**：
- ✅ 13 个已整合到知识库/模式库
- ⚠️ 1 个被更准确的发现替代
- 📊 新增模式：PAT-018 (Windows 路径格式)
- 📊 更新知识库：Windows 路径格式规范
