# Learning Queue

## Pending

### [P0] 版本发布自动化最佳实践
**来源：** Session 2026-03-10 v7.0.1 发布
**内容：** 使用 changesets + GitHub Actions 实现完全自动化发布流程
**关键步骤：**
1. changesets 自动管理版本号和 changelog
2. CI 工作流验证代码质量（ESLint + 测试）
3. Release 工作流自动发布到 npm 和创建 GitHub Release
4. 避免手动推送 tag，让 CI 自动处理
**应用场景：** 所有 npm 包发布流程
**置信度：** 已验证（v7.0.1 成功发布）

### [P1] Git Tag 冲突解决方案
**来源：** Session 2026-03-10 v7.0.1 发布
**内容：** 当 changesets 尝试推送已存在的 tag 时会失败
**解决方案：** `git push origin :refs/tags/<tag>` 删除远程 tag，重新触发工作流
**应用场景：** 发布流程 tag 冲突
**置信度：** 已验证

### [P1] 版本文件同步检查清单
**来源：** Session 2026-03-10 v7.0.1 发布
**内容：** 发布前必须同步所有版本文件
**检查清单：**
- package.json
- marketplace.json
- src/installer/index.ts (VERSION 常量)
- docs/CLAUDE.md
- CLAUDE.md
- README.md
**应用场景：** 每次版本发布前
**置信度：** 已验证（marketplace.json 不同步导致工作流失败）

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

### [P0] Vitest 原生模块测试隔离
**来源：** Session 2026-03-10 测试修复（89→0 失败）
**内容：** 原生模块（better-sqlite3, @ast-grep/napi）在 threads 池中导致 Segmentation fault，必须使用 forks 池 + isolate: true
**应用场景：** 所有包含原生模块的测试套件
**置信度：** 已验证（100% 通过率）
**配置模式：**
```typescript
export default defineConfig({
  test: {
    pool: 'forks',
    isolate: true,
    maxConcurrency: 2,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### [P0] 全局测试清理机制
**来源：** Session 2026-03-10 测试修复
**内容：** 使用全局 setup 文件统一清理 mock 和定时器，避免测试间污染
**应用场景：** 所有 Vitest 测试套件
**置信度：** 已验证
**实现模式：**
```typescript
// tests/setup.ts
beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterEach(() => {
  setImmediate(() => vi.clearAllTimers());
});
```

### [P1] Windows 文件锁清理策略
**来源：** Session 2026-03-10 测试修复
**内容：** Windows 平台文件句柄释放延迟，需要增加重试次数和延迟
**应用场景：** 临时文件清理测试
**置信度：** 已验证
**配置：** maxRetries: 10, retryDelay: 500ms

### [P0] Claude Agent SDK tool() Zod Schema 要求
**来源：** Session 2026-03-11 v7.0.2 MCP 类型修复
**内容：** Claude Agent SDK 的 tool() 函数要求参数使用 Zod schemas，不接受 JSON Schema 格式
**关键转换：**
- `{ type: "string" }` → `z.string()`
- `{ type: "boolean" }` → `z.boolean().optional()`
- `{ type: "number" }` → `z.number().optional()`
- `{ type: "array", items: { type: "string" } }` → `z.array(z.string())`
- 枚举约束：`z.enum(['value1', 'value2'])`
**应用场景：** 所有 MCP server 工具定义
**置信度：** 已验证（修复 31 个类型错误）
**参考：** src/mcp/omc-tools-server.ts:100 注释

### [P1] 类型安全的枚举参数设计
**来源：** Session 2026-03-11 v7.0.2 代码审查
**内容：** 对于有限值集合的参数，使用 z.enum() 而非 z.string() 提供编译时类型检查
**示例：**
- `signal: z.enum(['SIGTERM', 'SIGINT'])`
- `status_filter: z.enum(['active', 'completed', 'failed', 'all'])`
**应用场景：** 所有工具参数定义
**置信度：** 已验证（代码审查建议）

### [P2] 发布流程中的工作目录清理
**来源：** Session 2026-03-11 v7.0.2 发布
**内容：** npm version 前必须清理工作目录，区分编译产物和临时文件
**清理策略：**
- 提交：dist/、bridge/、.tsbuildinfo（编译产物）
- 恢复：.omc/、src/（临时变更）、test-*（测试产物）
**应用场景：** 版本发布前准备
**置信度：** 已验证

### [P0] Claude Code 插件命名规范
**来源：** Session 2026-03-11 文档验证
**内容：** 插件安装使用插件名而非 marketplace@plugin 格式
**错误示例：** `/plugin install omc@ultrapower`
**正确示例：** `/plugin install ultrapower`
**应用场景：** 所有插件安装文档
**置信度：** 已验证（用户测试失败后修复）

### [P1] Git 测试环境初始化最佳实践
**来源：** Session 2026-03-11 测试修复
**内容：** Git 测试需要配置 init.defaultBranch 避免提交失败
**配置模式：**
```typescript
execSync('git init', execOpts);
execSync('git config user.email "test@test.com"', execOpts);
execSync('git config user.name "Test"', execOpts);
execSync('git config commit.gpgsign false', execOpts);
execSync('git config init.defaultBranch main', execOpts);
```
**应用场景：** 所有需要 Git 操作的测试
**置信度：** 已验证
