# MCP 全面采用 - 原子任务清单

**日期：** 2026-03-05
**父计划：** docs/plans/2026-03-05-mcp-adoption-plan.md
**任务总数：** 42 个原子任务

---

## 阶段 1：MCP 服务器包装器（Week 1-2）

### 1.1.1 安装 MCP SDK 依赖
**父任务：** 1.1 搭建 MCP 服务器框架
**预计时间：** 30 分钟
**负责人：** executor (haiku)

**步骤：**
```bash
npm install @modelcontextprotocol/sdk
npm install --save-dev @types/node
```

**验收：**
- [ ] package.json 包含 `@modelcontextprotocol/sdk`
- [ ] `npm run build` 成功

**输出：** `package.json`, `package-lock.json`

---

### 1.1.2 创建 MCP 服务器入口文件
**父任务：** 1.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.1.1

**步骤：**
1. 创建 `src/mcp/ultrapower-mcp-server.ts`
2. 导入 Server 和 StdioServerTransport
3. 初始化 Server 实例（name: 'ultrapower', version: '5.6.0'）
4. 设置 capabilities: { tools: {} }

**验收：**
- [ ] 文件创建成功
- [ ] TypeScript 编译通过
- [ ] 导出 server 实例

**输出：** `src/mcp/ultrapower-mcp-server.ts`

---

### 1.1.3 实现 stdio 传输层
**父任务：** 1.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.1.2

**步骤：**
1. 创建 StdioServerTransport 实例
2. 连接 server 和 transport
3. 添加错误处理（process.on('uncaughtException')）
4. 添加优雅退出（process.on('SIGINT')）

**验收：**
- [ ] 可通过 `node dist/mcp/ultrapower-mcp-server.js` 启动
- [ ] 响应 stdin 输入
- [ ] 错误不导致进程崩溃

**输出：** `src/mcp/ultrapower-mcp-server.ts`（更新）

---

### 1.1.4 添加日志系统
**父任务：** 1.1
**预计时间：** 30 分钟
**负责人：** executor (haiku)
**依赖：** 1.1.3

**步骤：**
1. 创建 `src/mcp/logger.ts`
2. 实现 debug/info/warn/error 方法
3. 输出到 stderr（不干扰 stdio 协议）
4. 支持 `MCP_LOG_LEVEL` 环境变量

**验收：**
- [ ] 日志输出到 stderr
- [ ] 日志级别可配置
- [ ] 不影响 MCP 协议通信

**输出：** `src/mcp/logger.ts`

---

### 1.1.5 编写 MCP 服务器启动测试
**父任务：** 1.1
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.1.4

**步骤：**
1. 创建 `src/mcp/__tests__/server-startup.test.ts`
2. 测试 server 初始化
3. 测试 initialize 请求响应
4. 测试 capabilities 返回

**验收：**
- [ ] 测试通过
- [ ] 覆盖率 >80%

**输出：** `src/mcp/__tests__/server-startup.test.ts`

---

### 1.2.1 创建工具类型定义
**父任务：** 1.2 实现工具转换适配器
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.1.5

**步骤：**
1. 创建 `src/mcp/types.ts`
2. 定义 MCPTool 接口
3. 定义 ToolCategory 枚举（LSP/AST/Python/Notepad/State/ProjectMemory/Trace/Skills）
4. 定义转换函数签名

**验收：**
- [ ] 类型定义完整
- [ ] 符合 MCP 规范
- [ ] TypeScript 编译通过

**输出：** `src/mcp/types.ts`

---

### 1.2.2 实现 LSP 工具转换（12 个）
**父任务：** 1.2
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/lsp-adapter.ts`
2. 转换 lsp_hover, lsp_goto_definition, lsp_find_references
3. 转换 lsp_document_symbols, lsp_workspace_symbols
4. 转换 lsp_diagnostics, lsp_diagnostics_directory
5. 转换 lsp_servers, lsp_prepare_rename, lsp_rename
6. 转换 lsp_code_actions, lsp_code_action_resolve

**验收：**
- [ ] 12 个 LSP 工具全部转换
- [ ] inputSchema 符合 JSON Schema
- [ ] 保留原有参数结构

**输出：** `src/mcp/adapters/lsp-adapter.ts`

---

### 1.2.3 实现 AST 工具转换（2 个）
**父任务：** 1.2
**预计时间：** 30 分钟
**负责人：** executor (haiku)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/ast-adapter.ts`
2. 转换 ast_grep_search
3. 转换 ast_grep_replace

**验收：**
- [ ] 2 个 AST 工具转换完成
- [ ] 支持元变量语法

**输出：** `src/mcp/adapters/ast-adapter.ts`

---

### 1.2.4 实现 Python REPL 工具转换（1 个）
**父任务：** 1.2
**预计时间：** 20 分钟
**负责人：** executor (haiku)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/python-adapter.ts`
2. 转换 python_repl

**验收：**
- [ ] python_repl 转换完成

**输出：** `src/mcp/adapters/python-adapter.ts`

---

### 1.2.5 实现 Notepad 工具转换（6 个）
**父任务：** 1.2
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/notepad-adapter.ts`
2. 转换 notepad_read, notepad_write_priority
3. 转换 notepad_write_working, notepad_write_manual
4. 转换 notepad_prune, notepad_stats

**验收：**
- [ ] 6 个 Notepad 工具转换完成

**输出：** `src/mcp/adapters/notepad-adapter.ts`

---

### 1.2.6 实现 State 工具转换（5 个）
**父任务：** 1.2
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/state-adapter.ts`
2. 转换 state_read, state_write, state_clear
3. 转换 state_list_active, state_get_status

**验收：**
- [ ] 5 个 State 工具转换完成

**输出：** `src/mcp/adapters/state-adapter.ts`

---

### 1.2.7 实现 ProjectMemory 工具转换（4 个）
**父任务：** 1.2
**预计时间：** 45 分钟
**负责人：** executor (sonnet)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/memory-adapter.ts`
2. 转换 project_memory_read, project_memory_write
3. 转换 project_memory_add_note, project_memory_add_directive

**验收：**
- [ ] 4 个 ProjectMemory 工具转换完成

**输出：** `src/mcp/adapters/memory-adapter.ts`

---

### 1.2.8 实现 Trace 工具转换（2 个）
**父任务：** 1.2
**预计时间：** 30 分钟
**负责人：** executor (haiku)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/trace-adapter.ts`
2. 转换 trace_timeline, trace_summary

**验收：**
- [ ] 2 个 Trace 工具转换完成

**输出：** `src/mcp/adapters/trace-adapter.ts`

---

### 1.2.9 实现 Skills 工具转换（3 个）
**父任务：** 1.2
**预计时间：** 30 分钟
**负责人：** executor (haiku)
**依赖：** 1.2.1

**步骤：**
1. 创建 `src/mcp/adapters/skills-adapter.ts`
2. 转换 load_omc_skills_local, load_omc_skills_global
3. 转换 list_omc_skills

**验收：**
- [ ] 3 个 Skills 工具转换完成

**输出：** `src/mcp/adapters/skills-adapter.ts`

---

### 1.2.10 创建统一适配器入口
**父任务：** 1.2
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.2.2-1.2.9

**步骤：**
1. 创建 `src/mcp/tool-adapter.ts`
2. 导入所有分类适配器
3. 实现 `convertToMCPTool()` 函数
4. 实现 `getAllMCPTools()` 函数

**验收：**
- [ ] 返回 35 个工具
- [ ] 工具分类正确
- [ ] 无重复工具名

**输出：** `src/mcp/tool-adapter.ts`

---

### 1.2.11 编写工具转换单元测试
**父任务：** 1.2
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.2.10

**步骤：**
1. 创建 `src/mcp/__tests__/tool-adapter.test.ts`
2. 测试每类工具转换（8 类）
3. 测试 inputSchema 格式
4. 测试工具描述完整性

**验收：**
- [ ] 覆盖率 >80%
- [ ] 所有测试通过

**输出：** `src/mcp/__tests__/tool-adapter.test.ts`

---


### 1.3.1 实现工具名称解析器
**父任务：** 1.3 实现工具调用路由
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.2.11

**步骤：**
1. 创建 `src/mcp/tool-resolver.ts`
2. 实现 `resolveTool(name: string)` 函数
3. 支持带前缀：`mcp__plugin_ultrapower_t__lsp_hover`
4. 支持不带前缀：`lsp_hover`
5. 支持命名空间：`ultrapower:lsp_hover`

**验收：**
- [ ] 三种格式都能正确解析
- [ ] 返回统一的工具实现
- [ ] 未找到时返回明确错误

**输出：** `src/mcp/tool-resolver.ts`

---

### 1.3.2 实现工具调用处理器
**父任务：** 1.3
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 1.3.1

**步骤：**
1. 创建 `src/mcp/tool-router.ts`
2. 实现 `CallToolRequestSchema` 处理器
3. 解析工具名称和参数
4. 调用现有工具实现（`src/tools/index.ts`）
5. 格式化返回结果

**验收：**
- [ ] 成功调用现有工具
- [ ] 参数正确传递
- [ ] 返回格式符合 MCP 规范

**输出：** `src/mcp/tool-router.ts`

---

### 1.3.3 添加错误处理
**父任务：** 1.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.3.2

**步骤：**
1. 在 `tool-router.ts` 添加 try-catch
2. 处理工具未找到错误
3. 处理参数验证错误
4. 处理工具执行错误
5. 返回结构化错误信息

**验收：**
- [ ] 错误信息清晰可调试
- [ ] 包含错误类型和堆栈
- [ ] 不暴露敏感信息

**输出：** `src/mcp/tool-router.ts`（更新）

---

### 1.3.4 实现超时保护
**父任务：** 1.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.3.3

**步骤：**
1. 创建 `src/mcp/timeout.ts`
2. 实现 `withTimeout(fn, ms)` 包装器
3. 默认超时 30 秒
4. 支持 `MCP_TOOL_TIMEOUT` 环境变量

**验收：**
- [ ] 超时后抛出明确错误
- [ ] 不阻塞其他请求
- [ ] 超时时间可配置

**输出：** `src/mcp/timeout.ts`

---

### 1.3.5 集成到 MCP 服务器
**父任务：** 1.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 1.3.4

**步骤：**
1. 更新 `ultrapower-mcp-server.ts`
2. 注册 `tools/list` 处理器
3. 注册 `tools/call` 处理器
4. 添加请求日志

**验收：**
- [ ] 工具列表请求返回 35 个工具
- [ ] 工具调用请求正确路由
- [ ] 日志记录请求和响应

**输出：** `src/mcp/ultrapower-mcp-server.ts`（更新）

---

### 1.4.1 创建集成测试框架
**父任务：** 1.4 集成测试套件
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.3.5

**步骤：**
1. 创建 `src/mcp/__tests__/integration.test.ts`
2. 实现 MCP 客户端模拟器
3. 启动测试服务器
4. 实现请求/响应辅助函数

**验收：**
- [ ] 测试服务器可启动
- [ ] 可发送 MCP 请求
- [ ] 可接收 MCP 响应

**输出：** `src/mcp/__tests__/integration.test.ts`

---

### 1.4.2 测试 LSP 工具调用
**父任务：** 1.4
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.4.1

**步骤：**
1. 测试 `lsp_hover` 调用
2. 测试 `lsp_diagnostics` 调用
3. 验证参数传递正确
4. 验证返回结果格式

**验收：**
- [ ] LSP 工具调用成功
- [ ] 返回结果符合预期

**输出：** `src/mcp/__tests__/integration.test.ts`（更新）

---

### 1.4.3 测试其他 7 类工具
**父任务：** 1.4
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.4.2

**步骤：**
1. 测试 AST 工具（ast_grep_search）
2. 测试 Python REPL（python_repl）
3. 测试 Notepad 工具（notepad_read）
4. 测试 State 工具（state_read）
5. 测试 ProjectMemory 工具（project_memory_read）
6. 测试 Trace 工具（trace_timeline）
7. 测试 Skills 工具（list_omc_skills）

**验收：**
- [ ] 每类工具至少 1 个测试通过
- [ ] 覆盖率 >80%

**输出：** `src/mcp/__tests__/integration.test.ts`（更新）

---

### 1.4.4 测试向后兼容性
**父任务：** 1.4
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.4.3

**步骤：**
1. 使用旧前缀调用工具：`mcp__plugin_ultrapower_t__lsp_hover`
2. 使用新前缀调用工具：`ultrapower:lsp_hover`
3. 使用无前缀调用工具：`lsp_hover`
4. 验证三种方式都能成功

**验收：**
- [ ] 三种调用方式都通过
- [ ] 返回结果一致

**输出：** `src/mcp/__tests__/integration.test.ts`（更新）

---

### 1.4.5 配置 CI 流水线
**父任务：** 1.4
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 1.4.4

**步骤：**
1. 创建 `.github/workflows/mcp-tests.yml`
2. 配置测试环境（Node.js 18+）
3. 运行 MCP 集成测试
4. 上传测试报告

**验收：**
- [ ] CI 流水线运行成功
- [ ] 测试结果可见

**输出：** `.github/workflows/mcp-tests.yml`

---

### 1.5.1 更新 REFERENCE.md
**父任务：** 1.5 文档更新
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 1.4.5

**步骤：**
1. 打开 `docs/REFERENCE.md`
2. 添加 MCP 工具部分
3. 列出 35 个工具及其 MCP 名称
4. 添加使用示例

**验收：**
- [ ] 文档完整准确
- [ ] 包含所有工具

**输出：** `docs/REFERENCE.md`（更新）

---

### 1.5.2 创建 MCP 服务器使用指南
**父任务：** 1.5
**预计时间：** 2 小时
**负责人：** writer (haiku)
**依赖：** 1.5.1

**步骤：**
1. 创建 `docs/guides/mcp-server-usage.md`
2. 添加启动命令
3. 添加 Claude Desktop 配置示例
4. 添加 Cursor 配置示例
5. 添加故障排查指南

**验收：**
- [ ] 文档清晰易懂
- [ ] 包含完整配置示例

**输出：** `docs/guides/mcp-server-usage.md`

---

### 1.5.3 更新 README.md
**父任务：** 1.5
**预计时间：** 30 分钟
**负责人：** writer (haiku)
**依赖：** 1.5.2

**步骤：**
1. 打开 `README.md`
2. 添加 MCP 服务器部分
3. 添加快速开始示例
4. 链接到详细文档

**验收：**
- [ ] README 包含 MCP 信息
- [ ] 链接正确

**输出：** `README.md`（更新）

---

## 阶段 2：社区 MCP 服务器集成（Week 2-3）

### 2.1.1 创建 MCP 客户端基础类
**父任务：** 2.1 MCP 客户端实现
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 阶段 1 完成

**步骤：**
1. 创建 `src/mcp/client.ts`
2. 定义 MCPClient 类
3. 实现 connect() 方法（stdio 传输）
4. 实现 disconnect() 方法

**验收：**
- [ ] 可连接到外部 MCP 服务器
- [ ] 连接失败时抛出明确错误

**输出：** `src/mcp/client.ts`

---

### 2.1.2 实现工具发现
**父任务：** 2.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 2.1.1

**步骤：**
1. 实现 `listTools()` 方法
2. 发送 `tools/list` 请求
3. 解析响应
4. 缓存工具列表

**验收：**
- [ ] 成功获取外部工具列表
- [ ] 工具列表缓存生效

**输出：** `src/mcp/client.ts`（更新）

---

### 2.1.3 实现工具调用代理
**父任务：** 2.1
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 2.1.2

**步骤：**
1. 实现 `callTool(name, args)` 方法
2. 发送 `tools/call` 请求
3. 处理响应和错误
4. 添加超时保护

**验收：**
- [ ] 成功代理工具调用
- [ ] 错误处理正确

**输出：** `src/mcp/client.ts`（更新）

---

### 2.1.4 实现连接重试机制
**父任务：** 2.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 2.1.3

**步骤：**
1. 添加重试逻辑（最多 3 次）
2. 实现指数退避
3. 记录重试日志
4. 连接失败后标记服务器不可用

**验收：**
- [ ] 重试机制生效
- [ ] 不无限重试

**输出：** `src/mcp/client.ts`（更新）

---

### 2.1.5 编写客户端单元测试
**父任务：** 2.1
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.1.4

**步骤：**
1. 创建 `src/mcp/__tests__/client.test.ts`
2. 模拟外部 MCP 服务器
3. 测试连接、工具发现、工具调用
4. 测试错误场景

**验收：**
- [ ] 测试覆盖率 >80%
- [ ] 所有测试通过

**输出：** `src/mcp/__tests__/client.test.ts`

---


### 2.2.1 创建配置 schema
**父任务：** 2.2 配置系统实现
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 2.1.5

**步骤：**
1. 创建 `src/mcp/config-schema.ts`
2. 定义 MCPServerConfig 接口
3. 使用 Zod 定义验证 schema
4. 导出类型和验证函数

**验收：**
- [ ] Schema 完整（command, args, env, disabled）
- [ ] 验证函数正确工作

**输出：** `src/mcp/config-schema.ts`

---

### 2.2.2 实现配置加载器
**父任务：** 2.2
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 2.2.1

**步骤：**
1. 创建 `src/mcp/config-loader.ts`
2. 实现 `loadConfig()` 函数
3. 读取 `.omc/mcp-config.json` 和 `~/.omc/mcp-config.json`
4. 合并配置（项目级覆盖用户级）
5. 验证配置格式

**验收：**
- [ ] 正确加载两级配置
- [ ] 合并逻辑正确
- [ ] 无效配置抛出明确错误

**输出：** `src/mcp/config-loader.ts`

---

### 2.2.3 实现环境变量替换
**父任务：** 2.2
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 2.2.2

**步骤：**
1. 在 `config-loader.ts` 添加 `expandEnvVars()` 函数
2. 支持 `${VAR_NAME}` 语法
3. 支持默认值：`${VAR_NAME:-default}`
4. 处理未定义变量

**验收：**
- [ ] 环境变量正确替换
- [ ] 默认值生效
- [ ] 未定义变量有明确错误

**输出：** `src/mcp/config-loader.ts`（更新）

---

### 2.2.4 编写配置加载测试
**父任务：** 2.2
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.2.3

**步骤：**
1. 创建 `src/mcp/__tests__/config-loader.test.ts`
2. 测试配置加载和合并
3. 测试环境变量替换
4. 测试配置验证

**验收：**
- [ ] 测试覆盖率 >80%
- [ ] 所有测试通过

**输出：** `src/mcp/__tests__/config-loader.test.ts`

---

### 2.3.1 创建命名空间管理器
**父任务：** 2.3 工具命名空间系统
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 2.2.4

**步骤：**
1. 创建 `src/mcp/namespace.ts`
2. 实现 `NamespaceManager` 类
3. 实现 `registerTools(namespace, tools)` 方法
4. 实现 `resolveTool(name)` 方法（支持命名空间）
5. 实现冲突检测

**验收：**
- [ ] 工具注册成功
- [ ] 命名空间解析正确
- [ ] 冲突检测生效

**输出：** `src/mcp/namespace.ts`

---

### 2.3.2 集成到服务器和客户端
**父任务：** 2.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 2.3.1

**步骤：**
1. 更新 `ultrapower-mcp-server.ts` 使用命名空间
2. ultrapower 工具使用 `ultrapower:` 前缀
3. 更新 `client.ts` 使用命名空间
4. 外部工具使用 `<server-name>:` 前缀

**验收：**
- [ ] 所有工具有正确前缀
- [ ] 工具调用使用命名空间

**输出：** `src/mcp/ultrapower-mcp-server.ts`, `src/mcp/client.ts`（更新）

---

### 2.3.3 编写命名空间测试
**父任务：** 2.3
**预计时间：** 1 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.3.2

**步骤：**
1. 创建 `src/mcp/__tests__/namespace.test.ts`
2. 测试工具注册和解析
3. 测试冲突检测
4. 测试向后兼容（无前缀调用）

**验收：**
- [ ] 测试覆盖率 >80%
- [ ] 所有测试通过

**输出：** `src/mcp/__tests__/namespace.test.ts`

---

### 2.4.1 测试 filesystem 服务器
**父任务：** 2.4 社区服务器测试
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.3.3

**步骤：**
1. 安装 `@modelcontextprotocol/server-filesystem`
2. 创建测试配置
3. 测试连接和工具发现
4. 测试 read_file, write_file 调用
5. 记录兼容性问题

**验收：**
- [ ] 连接成功
- [ ] 工具调用成功率 >95%
- [ ] 问题已记录

**输出：** `src/mcp/__tests__/community-servers.test.ts`

---

### 2.4.2 测试 github 服务器
**父任务：** 2.4
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.4.1

**步骤：**
1. 安装 `@modelcontextprotocol/server-github`
2. 配置 GITHUB_TOKEN（测试环境）
3. 测试 create_issue, list_issues 调用
4. 记录兼容性问题

**验收：**
- [ ] 连接成功
- [ ] 工具调用成功率 >95%

**输出：** `src/mcp/__tests__/community-servers.test.ts`（更新）

---

### 2.4.3 测试 slack 服务器
**父任务：** 2.4
**预计时间：** 2 小时
**负责人：** test-engineer (sonnet)
**依赖：** 2.4.2

**步骤：**
1. 安装 `@modelcontextprotocol/server-slack`
2. 配置 SLACK_TOKEN（测试环境）
3. 测试 send_message 调用
4. 记录兼容性问题

**验收：**
- [ ] 连接成功
- [ ] 工具调用成功率 >95%

**输出：** `src/mcp/__tests__/community-servers.test.ts`（更新）

---

### 2.4.4 创建兼容性矩阵
**父任务：** 2.4
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 2.4.3

**步骤：**
1. 创建 `docs/compatibility-matrix.md`
2. 列出测试的社区服务器
3. 记录兼容性状态（✅/⚠️/❌）
4. 记录已知限制和解决方案

**验收：**
- [ ] 矩阵完整
- [ ] 包含所有测试服务器

**输出：** `docs/compatibility-matrix.md`

---

## 阶段 3：协议标准化（Week 3-4）

### 3.1.1 更新工具注册使用新前缀
**父任务：** 3.1 移除自定义前缀
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 阶段 2 完成

**步骤：**
1. 更新 `tool-adapter.ts`
2. 工具名称从 `mcp__plugin_ultrapower_t__lsp_hover` 改为 `ultrapower:lsp_hover`
3. 保留旧前缀映射（向后兼容）

**验收：**
- [ ] 新前缀正常工作
- [ ] 旧前缀仍可用

**输出：** `src/mcp/tool-adapter.ts`（更新）

---

### 3.1.2 添加废弃警告
**父任务：** 3.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.1.1

**步骤：**
1. 创建 `src/mcp/deprecation.ts`
2. 实现 `warnDeprecated(oldName, newName)` 函数
3. 在工具调用时检测旧前缀
4. 输出警告到 stderr

**验收：**
- [ ] 旧前缀触发警告
- [ ] 警告包含迁移指南链接
- [ ] 不影响功能

**输出：** `src/mcp/deprecation.ts`

---

### 3.1.3 创建迁移脚本
**父任务：** 3.1
**预计时间：** 2 小时
**负责人：** executor (sonnet)
**依赖：** 3.1.2

**步骤：**
1. 创建 `scripts/migrate-tool-names.ts`
2. 扫描项目文件查找旧前缀
3. 替换为新前缀
4. 生成迁移报告

**验收：**
- [ ] 脚本正确识别旧前缀
- [ ] 替换准确
- [ ] 生成详细报告

**输出：** `scripts/migrate-tool-names.ts`

---

### 3.1.4 更新内部引用
**父任务：** 3.1
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.1.3

**步骤：**
1. 运行迁移脚本
2. 更新测试文件
3. 更新文档示例
4. 验证所有引用

**验收：**
- [ ] 无旧前缀引用（除兼容层）
- [ ] 所有测试通过

**输出：** 多个文件更新

---

### 3.1.5 创建迁移指南
**父任务：** 3.1
**预计时间：** 2 小时
**负责人：** writer (haiku)
**依赖：** 3.1.4

**步骤：**
1. 创建 `docs/migration-guide.md`
2. 说明前缀变更
3. 提供迁移步骤
4. 列出常见问题

**验收：**
- [ ] 指南清晰完整
- [ ] 包含迁移脚本用法

**输出：** `docs/migration-guide.md`

---

### 3.2.1 创建独立包目录
**父任务：** 3.2 发布 npm 包
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.1.5

**步骤：**
1. 创建 `packages/mcp-server/` 目录
2. 创建 `package.json`（name: @ultrapower/mcp-server）
3. 配置入口点和 bin 脚本
4. 复制必要文件

**验收：**
- [ ] 目录结构正确
- [ ] package.json 配置完整

**输出：** `packages/mcp-server/package.json`

---

### 3.2.2 创建包 README
**父任务：** 3.2
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 3.2.1

**步骤：**
1. 创建 `packages/mcp-server/README.md`
2. 添加安装说明
3. 添加配置示例（Claude Desktop, Cursor）
4. 添加工具列表

**验收：**
- [ ] README 完整
- [ ] 示例可直接使用

**输出：** `packages/mcp-server/README.md`

---

### 3.2.3 配置构建流程
**父任务：** 3.2
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.2.2

**步骤：**
1. 添加构建脚本到 `packages/mcp-server/package.json`
2. 配置 TypeScript 编译
3. 测试本地构建

**验收：**
- [ ] `npm run build` 成功
- [ ] 生成可执行文件

**输出：** `packages/mcp-server/package.json`（更新）

---

### 3.2.4 发布到 npm
**父任务：** 3.2
**预计时间：** 30 分钟
**负责人：** executor (sonnet)
**依赖：** 3.2.3

**步骤：**
1. 验证包内容（`npm pack`）
2. 发布到 npm（`npm publish --access public`）
3. 验证安装（`npx @ultrapower/mcp-server --version`）

**验收：**
- [ ] 包发布成功
- [ ] 可通过 npx 运行

**输出：** npm 包

---

### 3.3.1 实现废弃时间戳检查
**父任务：** 3.3 向后兼容层
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.2.4

**步骤：**
1. 在 `deprecation.ts` 添加时间戳常量（2026-09-05）
2. 实现 `isDeprecationExpired()` 函数
3. 过期后抛出错误而非警告

**验收：**
- [ ] 时间戳检查正确
- [ ] 过期后行为符合预期

**输出：** `src/mcp/deprecation.ts`（更新）

---

### 3.3.2 实现自动迁移提示
**父任务：** 3.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.3.1

**步骤：**
1. 在警告中添加迁移脚本命令
2. 添加文档链接
3. 首次警告后记录到文件（避免重复）

**验收：**
- [ ] 提示清晰有用
- [ ] 不重复显示

**输出：** `src/mcp/deprecation.ts`（更新）

---

### 3.3.3 创建用户通知 hook
**父任务：** 3.3
**预计时间：** 1 小时
**负责人：** executor (sonnet)
**依赖：** 3.3.2

**步骤：**
1. 创建 `src/hooks/mcp-migration-notice/`
2. 首次启动时显示迁移通知
3. 记录已通知状态

**验收：**
- [ ] 首次启动显示通知
- [ ] 不重复通知

**输出：** `src/hooks/mcp-migration-notice/`

---

### 3.3.4 添加禁用警告选项
**父任务：** 3.3
**预计时间：** 30 分钟
**负责人：** executor (sonnet)
**依赖：** 3.3.3

**步骤：**
1. 支持 `MCP_DISABLE_DEPRECATION_WARNINGS` 环境变量
2. 更新文档说明

**验收：**
- [ ] 环境变量生效
- [ ] 文档已更新

**输出：** `src/mcp/deprecation.ts`（更新）

---


### 3.4.1 创建 MCP 总览文档
**父任务：** 3.4 生态系统文档
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 3.3.4

**步骤：**
1. 创建 `docs/mcp/README.md`
2. 说明 MCP 是什么
3. ultrapower MCP 集成概览
4. 链接到详细指南

**验收：**
- [ ] 文档清晰易懂
- [ ] 包含所有链接

**输出：** `docs/mcp/README.md`

---

### 3.4.2 创建服务器使用指南
**父任务：** 3.4
**预计时间：** 2 小时
**负责人：** writer (haiku)
**依赖：** 3.4.1

**步骤：**
1. 创建 `docs/mcp/server-guide.md`
2. 说明如何启动 ultrapower MCP 服务器
3. 配置 Claude Desktop
4. 配置 Cursor
5. 故障排查

**验收：**
- [ ] 指南完整
- [ ] 配置示例可用

**输出：** `docs/mcp/server-guide.md`

---

### 3.4.3 创建客户端集成指南
**父任务：** 3.4
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 3.4.2

**步骤：**
1. 创建 `docs/mcp/client-guide.md`
2. 说明如何使用社区 MCP 服务器
3. 配置示例
4. 工具命名空间说明

**验收：**
- [ ] 指南完整
- [ ] 示例可用

**输出：** `docs/mcp/client-guide.md`

---

### 3.4.4 创建配置示例集
**父任务：** 3.4
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 3.4.3

**步骤：**
1. 创建 `docs/mcp/examples/` 目录
2. Claude Desktop 配置示例
3. Cursor 配置示例
4. 常见社区服务器配置

**验收：**
- [ ] 至少 5 个示例
- [ ] 示例可直接使用

**输出：** `docs/mcp/examples/*.json`

---

### 3.5.1 创建基准测试框架
**父任务：** 3.5 性能基准测试
**预计时间：** 2 小时
**负责人：** performance-reviewer (sonnet)
**依赖：** 3.4.4

**步骤：**
1. 创建 `benchmark/mcp-performance.ts`
2. 实现工具调用延迟测试
3. 实现工具列表查询测试
4. 实现内存占用测试

**验收：**
- [ ] 测试框架可运行
- [ ] 输出结构化结果

**输出：** `benchmark/mcp-performance.ts`

---

### 3.5.2 运行基准测试
**父任务：** 3.5
**预计时间：** 1 小时
**负责人：** performance-reviewer (sonnet)
**依赖：** 3.5.1

**步骤：**
1. 运行 MCP 调用基准测试
2. 运行原生调用基准测试
3. 对比结果
4. 记录性能数据

**验收：**
- [ ] 延迟增加 <5%
- [ ] 内存增加 <10MB
- [ ] 数据已记录

**输出：** 性能数据

---

### 3.5.3 生成性能报告
**父任务：** 3.5
**预计时间：** 1 小时
**负责人：** writer (haiku)
**依赖：** 3.5.2

**步骤：**
1. 创建 `docs/performance-report.md`
2. 汇总性能数据
3. 生成对比图表
4. 添加结论和建议

**验收：**
- [ ] 报告完整
- [ ] 包含图表
- [ ] 结论明确

**输出：** `docs/performance-report.md`

---

## 任务统计

**总任务数：** 42 个原子任务

**按阶段分布：**
- 阶段 1（MCP 服务器包装器）：17 个任务
- 阶段 2（社区服务器集成）：14 个任务
- 阶段 3（协议标准化）：11 个任务

**按负责人分布：**
- executor (sonnet)：24 个任务
- test-engineer (sonnet)：10 个任务
- writer (haiku)：7 个任务
- performance-reviewer (sonnet)：1 个任务

**预计总工时：** 52 小时（约 6.5 个工作日）

---

## 依赖关系图（简化）

```
阶段 1：
1.1.1 → 1.1.2 → 1.1.3 → 1.1.4 → 1.1.5
                                  ↓
1.2.1 → [1.2.2-1.2.9 并行] → 1.2.10 → 1.2.11
                                        ↓
1.3.1 → 1.3.2 → 1.3.3 → 1.3.4 → 1.3.5
                                  ↓
1.4.1 → 1.4.2 → 1.4.3 → 1.4.4 → 1.4.5
                                  ↓
1.5.1 → 1.5.2 → 1.5.3

阶段 2：
2.1.1 → 2.1.2 → 2.1.3 → 2.1.4 → 2.1.5
                                  ↓
2.2.1 → 2.2.2 → 2.2.3 → 2.2.4
                          ↓
2.3.1 → 2.3.2 → 2.3.3
                  ↓
2.4.1 → 2.4.2 → 2.4.3 → 2.4.4

阶段 3：
3.1.1 → 3.1.2 → 3.1.3 → 3.1.4 → 3.1.5
                                  ↓
3.2.1 → 3.2.2 → 3.2.3 → 3.2.4
                          ↓
3.3.1 → 3.3.2 → 3.3.3 → 3.3.4
                          ↓
3.4.1 → 3.4.2 → 3.4.3 → 3.4.4
                          ↓
3.5.1 → 3.5.2 → 3.5.3
```

---

## 关键路径

**最长路径（关键路径）：**
1.1.1 → 1.1.2 → 1.1.3 → 1.1.4 → 1.1.5 → 1.2.1 → 1.2.10 → 1.2.11 → 1.3.1 → 1.3.2 → 1.3.3 → 1.3.4 → 1.3.5 → 1.4.1 → 1.4.2 → 1.4.3 → 1.4.4 → 1.4.5 → 1.5.1 → 1.5.2 → 1.5.3 → 2.1.1 → 2.1.2 → 2.1.3 → 2.1.4 → 2.1.5 → 2.2.1 → 2.2.2 → 2.2.3 → 2.2.4 → 2.3.1 → 2.3.2 → 2.3.3 → 2.4.1 → 2.4.2 → 2.4.3 → 2.4.4 → 3.1.1 → 3.1.2 → 3.1.3 → 3.1.4 → 3.1.5 → 3.2.1 → 3.2.2 → 3.2.3 → 3.2.4 → 3.3.1 → 3.3.2 → 3.3.3 → 3.3.4 → 3.4.1 → 3.4.2 → 3.4.3 → 3.4.4 → 3.5.1 → 3.5.2 → 3.5.3

**关键路径长度：** 52 小时

---

## 并行化机会

**可并行执行的任务组：**

1. **工具适配器（1.2.2-1.2.9）：** 8 个任务可并行
   - 预计节省：6 小时

2. **社区服务器测试（2.4.1-2.4.3）：** 3 个任务可并行
   - 预计节省：2 小时

**优化后总工时：** 44 小时（约 5.5 个工作日）

---

## 验收标准总览

**阶段 1 完成标准：**
- [ ] 所有 17 个任务验收通过
- [ ] MCP 服务器可独立启动
- [ ] 35 工具全部可通过 MCP 调用
- [ ] 集成测试通过率 100%

**阶段 2 完成标准：**
- [ ] 所有 14 个任务验收通过
- [ ] 成功连接 ≥3 个社区 MCP 服务器
- [ ] 工具命名空间无冲突
- [ ] 兼容性矩阵完成

**阶段 3 完成标准：**
- [ ] 所有 11 个任务验收通过
- [ ] 旧前缀废弃警告生效
- [ ] npm 包发布成功
- [ ] 性能下降 <5%

**整体完成标准：**
- [ ] 所有 42 个原子任务完成
- [ ] CI/CD 流水线全绿
- [ ] 文档完整
- [ ] 性能达标

---

**文档状态：** ✅ 原子任务清单已完成
**下一步：** 等待用户批准，然后开始执行
