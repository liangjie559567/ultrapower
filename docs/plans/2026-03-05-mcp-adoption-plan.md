# MCP 全面采用实施计划

**日期：** 2026-03-05
**版本：** v1.0
**目标版本：** ultrapower v5.6.0
**预计工期：** 3-4 周

---

## 执行摘要

将 ultrapower 从自定义工具协议迁移到标准 MCP 协议，采用渐进式 3 阶段方案：
1. MCP 服务器包装器（Week 1-2）
2. 社区 MCP 服务器集成（Week 2-3）
3. 协议标准化（Week 3-4）

**关键约束：**

* 100% 向后兼容

* 性能下降 <5%

* 保留旧前缀 6 个月

---

## 阶段 1：MCP 服务器包装器（Week 1-2）

### 任务 1.1：搭建 MCP 服务器框架

**优先级：** P0
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
创建标准 MCP 服务器入口点，支持 stdio 传输。

**实施步骤：**
1. 安装依赖：`@modelcontextprotocol/sdk`
2. 创建 `src/mcp/ultrapower-mcp-server.ts`
3. 实现 Server 初始化和 StdioServerTransport
4. 添加基础错误处理和日志

**验收标准：**

* [ ] MCP 服务器可通过 stdio 启动

* [ ] 响应 `initialize` 请求

* [ ] 返回正确的 capabilities

* [ ] 通过 `npm run build` 编译

**依赖：** 无

**输出文件：**

* `src/mcp/ultrapower-mcp-server.ts`

* `package.json`（新增依赖）

---

### 任务 1.2：实现工具转换适配器

**优先级：** P0
**预计时间：** 3 天
**负责人：** executor (sonnet)

**目标：**
将现有 35 工具转换为 MCP 标准格式。

**实施步骤：**
1. 创建 `src/mcp/tool-adapter.ts`
2. 实现 `convertToMCPTool()` 函数
3. 处理 8 类工具：LSP(12)、AST(2)、Python(1)、Notepad(6)、State(5)、ProjectMemory(4)、Trace(2)、Skills(3)
4. 保留原有 `mcp__plugin_ultrapower_t__` 前缀路由

**验收标准：**

* [ ] 所有 35 工具成功转换

* [ ] inputSchema 符合 JSON Schema 规范

* [ ] 工具描述完整且准确

* [ ] 通过单元测试（覆盖率 >80%）

**依赖：** 任务 1.1

**输出文件：**

* `src/mcp/tool-adapter.ts`

* `src/mcp/__tests__/tool-adapter.test.ts`

---

### 任务 1.3：实现工具调用路由

**优先级：** P0
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
处理 `tools/call` 请求，路由到现有工具实现。

**实施步骤：**
1. 在 `ultrapower-mcp-server.ts` 添加 `CallToolRequestSchema` 处理器
2. 实现工具名称解析（支持带/不带前缀）
3. 调用现有工具实现（`src/tools/index.ts`）
4. 处理错误和超时

**验收标准：**

* [ ] 支持标准 MCP 工具调用

* [ ] 向后兼容旧前缀调用

* [ ] 错误信息清晰可调试

* [ ] 超时保护（默认 30s）

**依赖：** 任务 1.2

**输出文件：**

* `src/mcp/ultrapower-mcp-server.ts`（更新）

* `src/mcp/tool-router.ts`

---

### 任务 1.4：集成测试套件

**优先级：** P1
**预计时间：** 2 天
**负责人：** test-engineer (sonnet)

**目标：**
验证 MCP 服务器与 Claude Code 集成正常。

**实施步骤：**
1. 创建 `src/mcp/__tests__/integration.test.ts`
2. 测试工具列表请求
3. 测试工具调用（每类工具至少 1 个）
4. 测试错误场景（无效工具名、参数错误）

**验收标准：**

* [ ] 所有集成测试通过

* [ ] 覆盖 8 类工具

* [ ] 测试向后兼容性

* [ ] CI 流水线集成

**依赖：** 任务 1.3

**输出文件：**

* `src/mcp/__tests__/integration.test.ts`

* `.github/workflows/mcp-tests.yml`

---

### 任务 1.5：文档更新

**优先级：** P1
**预计时间：** 1 天
**负责人：** writer (haiku)

**目标：**
更新用户文档，说明 MCP 服务器用法。

**实施步骤：**
1. 更新 `docs/REFERENCE.md`（MCP 工具部分）
2. 创建 `docs/guides/mcp-server-usage.md`
3. 添加配置示例到 `README.md`

**验收标准：**

* [ ] 文档包含启动命令

* [ ] 包含 Claude Desktop 配置示例

* [ ] 包含 Cursor 配置示例

* [ ] 包含故障排查指南

**依赖：** 任务 1.4

**输出文件：**

* `docs/REFERENCE.md`（更新）

* `docs/guides/mcp-server-usage.md`

* `README.md`（更新）

---

## 阶段 2：社区 MCP 服务器集成（Week 2-3）

### 任务 2.1：MCP 客户端实现

**优先级：** P0
**预计时间：** 3 天
**负责人：** executor (sonnet)

**目标：**
实现 MCP 客户端，连接外部 MCP 服务器。

**实施步骤：**
1. 创建 `src/mcp/client.ts`
2. 实现 stdio 传输连接
3. 实现工具发现（`tools/list`）
4. 实现工具调用代理

**验收标准：**

* [ ] 成功连接到测试 MCP 服务器

* [ ] 正确发现外部工具

* [ ] 代理工具调用到外部服务器

* [ ] 处理连接失败和重试

**依赖：** 阶段 1 完成

**输出文件：**

* `src/mcp/client.ts`

* `src/mcp/__tests__/client.test.ts`

---

### 任务 2.2：配置系统实现

**优先级：** P0
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
支持从配置文件加载 MCP 服务器。

**实施步骤：**
1. 创建 `src/mcp/config-loader.ts`
2. 支持 `.omc/mcp-config.json` 和 `~/.omc/mcp-config.json`
3. 实现配置合并（项目级覆盖用户级）
4. 验证配置格式

**验收标准：**

* [ ] 正确加载配置文件

* [ ] 配置优先级正确

* [ ] 验证必需字段（command, args）

* [ ] 支持环境变量替换

**依赖：** 任务 2.1

**输出文件：**

* `src/mcp/config-loader.ts`

* `src/mcp/config-schema.ts`

---

### 任务 2.3：工具命名空间系统

**优先级：** P0
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
实现工具命名空间，避免冲突。

**实施步骤：**
1. 创建 `src/mcp/namespace.ts`
2. ultrapower 工具使用 `ultrapower:` 前缀
3. 外部工具使用 `<server-name>:` 前缀
4. 实现命名空间解析和路由

**验收标准：**

* [ ] 工具名称唯一

* [ ] 支持命名空间查询

* [ ] 冲突检测和警告

* [ ] 向后兼容无前缀调用

**依赖：** 任务 2.2

**输出文件：**

* `src/mcp/namespace.ts`

* `src/mcp/__tests__/namespace.test.ts`

---

### 任务 2.4：社区服务器测试

**优先级：** P1
**预计时间：** 3 天
**负责人：** test-engineer (sonnet)

**目标：**
验证与主流社区 MCP 服务器的兼容性。

**实施步骤：**
1. 测试 `@modelcontextprotocol/server-filesystem`
2. 测试 `@modelcontextprotocol/server-github`
3. 测试 `@modelcontextprotocol/server-slack`
4. 记录兼容性问题

**验收标准：**

* [ ] 至少 3 个社区服务器测试通过

* [ ] 工具调用成功率 >95%

* [ ] 记录已知限制

* [ ] 创建兼容性矩阵

**依赖：** 任务 2.3

**输出文件：**

* `docs/compatibility-matrix.md`

* `src/mcp/__tests__/community-servers.test.ts`

---

## 阶段 3：协议标准化（Week 3-4）

### 任务 3.1：移除自定义前缀

**优先级：** P0
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
废弃 `mcp__plugin_ultrapower_t__` 前缀，迁移到标准命名。

**实施步骤：**
1. 更新工具注册，使用 `ultrapower:` 前缀
2. 添加废弃警告到旧前缀调用
3. 创建迁移脚本 `scripts/migrate-tool-names.ts`
4. 更新所有内部引用

**验收标准：**

* [ ] 新前缀正常工作

* [ ] 旧前缀触发废弃警告

* [ ] 迁移脚本测试通过

* [ ] 文档更新完成

**依赖：** 阶段 2 完成

**输出文件：**

* `src/mcp/tool-adapter.ts`（更新）

* `scripts/migrate-tool-names.ts`

* `docs/migration-guide.md`

---

### 任务 3.2：发布 npm 包

**优先级：** P0
**预计时间：** 1 天
**负责人：** executor (sonnet)

**目标：**
发布 `@ultrapower/mcp-server` 到 npm。

**实施步骤：**
1. 创建独立包目录 `packages/mcp-server/`
2. 配置 `package.json`（入口点、bin 脚本）
3. 添加 README 和使用示例
4. 发布到 npm

**验收标准：**

* [ ] 包可通过 `npx @ultrapower/mcp-server` 启动

* [ ] README 包含完整配置示例

* [ ] 版本号与 ultrapower 主版本同步

* [ ] npm 发布成功

**依赖：** 任务 3.1

**输出文件：**

* `packages/mcp-server/package.json`

* `packages/mcp-server/README.md`

* `packages/mcp-server/index.ts`

---

### 任务 3.3：向后兼容层

**优先级：** P1
**预计时间：** 2 天
**负责人：** executor (sonnet)

**目标：**
实现 6 个月向后兼容期。

**实施步骤：**
1. 添加废弃警告日志
2. 实现自动迁移提示
3. 创建用户通知机制（首次启动）
4. 设置废弃时间戳（2026-09-05）

**验收标准：**

* [ ] 旧前缀调用显示警告

* [ ] 警告包含迁移指南链接

* [ ] 不影响功能正常使用

* [ ] 可通过环境变量禁用警告

**依赖：** 任务 3.1

**输出文件：**

* `src/mcp/deprecation.ts`

* `src/hooks/mcp-migration-notice/`

---

### 任务 3.4：生态系统文档

**优先级：** P1
**预计时间：** 2 天
**负责人：** writer (haiku)

**目标：**
创建完整的 MCP 生态系统文档。

**实施步骤：**
1. 创建 `docs/mcp/README.md`（总览）
2. 创建 `docs/mcp/server-guide.md`（服务器使用）
3. 创建 `docs/mcp/client-guide.md`（客户端集成）
4. 创建 `docs/mcp/examples/`（配置示例）

**验收标准：**

* [ ] 文档覆盖所有使用场景

* [ ] 包含 Claude Desktop 配置

* [ ] 包含 Cursor 配置

* [ ] 包含故障排查指南

**依赖：** 任务 3.2, 3.3

**输出文件：**

* `docs/mcp/README.md`

* `docs/mcp/server-guide.md`

* `docs/mcp/client-guide.md`

* `docs/mcp/examples/`

---

### 任务 3.5：性能基准测试

**优先级：** P1
**预计时间：** 2 天
**负责人：** performance-reviewer (sonnet)

**目标：**
验证性能下降 <5%。

**实施步骤：**
1. 创建基准测试套件 `benchmark/mcp-performance.ts`
2. 测试工具调用延迟
3. 测试工具列表查询性能
4. 对比 MCP vs 原生调用

**验收标准：**

* [ ] 工具调用延迟增加 <5%

* [ ] 工具列表查询 <100ms

* [ ] 内存占用增加 <10MB

* [ ] 生成性能报告

**依赖：** 任务 3.1

**输出文件：**

* `benchmark/mcp-performance.ts`

* `docs/performance-report.md`

---

## 依赖关系图

```
阶段 1：
1.1 (MCP 框架) → 1.2 (工具适配器) → 1.3 (工具路由) → 1.4 (集成测试) → 1.5 (文档)

阶段 2：
阶段1完成 → 2.1 (MCP 客户端) → 2.2 (配置系统) → 2.3 (命名空间) → 2.4 (社区测试)

阶段 3：
阶段2完成 → 3.1 (移除前缀) → 3.2 (npm 包) → 3.4 (文档)
                              → 3.3 (兼容层) → 3.4 (文档)
                              → 3.5 (性能测试)
```

---

## 风险缓解计划

### 风险 1：破坏现有功能

**缓解措施：**

* 任务 1.4：完整回归测试

* 任务 3.3：6 个月向后兼容层

* 每个阶段后运行完整测试套件

### 风险 2：性能下降

**缓解措施：**

* 任务 3.5：性能基准测试

* 优化热路径（工具调用、命名空间解析）

* 使用缓存减少重复计算

### 风险 3：用户迁移困难

**缓解措施：**

* 任务 3.1：自动迁移脚本

* 任务 3.4：详细迁移指南

* 任务 3.3：废弃警告和通知

### 风险 4：社区工具兼容性

**缓解措施：**

* 任务 2.4：测试主流 MCP 服务器

* 创建兼容性矩阵

* 记录已知限制和解决方案

---

## 验收标准总览

**阶段 1 完成标准：**

* [ ] MCP 服务器可独立启动

* [ ] 35 工具全部可通过 MCP 调用

* [ ] 集成测试通过率 100%

* [ ] 文档更新完成

**阶段 2 完成标准：**

* [ ] 成功加载 ≥3 个社区 MCP 服务器

* [ ] 工具命名空间无冲突

* [ ] 社区服务器测试通过率 >95%

* [ ] 兼容性矩阵完成

**阶段 3 完成标准：**

* [ ] 旧前缀废弃警告生效

* [ ] npm 包发布成功

* [ ] 性能下降 <5%

* [ ] 迁移文档完成

**整体完成标准：**

* [ ] 所有任务验收标准达成

* [ ] CI/CD 流水线全绿

* [ ] 用户迁移指南发布

* [ ] 发布到 MCP 官方目录

---

## 资源分配

**开发资源：**

* executor (sonnet)：15 天

* test-engineer (sonnet)：5 天

* writer (haiku)：3 天

* performance-reviewer (sonnet)：2 天

**总工时：** 25 人天（约 3-4 周）

**关键路径：**
1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2

---

## 发布计划

**v5.6.0-alpha.1**（Week 2 结束）

* 阶段 1 完成

* 内部测试版本

**v5.6.0-beta.1**（Week 3 结束）

* 阶段 2 完成

* 公开测试版本

**v5.6.0**（Week 4 结束）

* 阶段 3 完成

* 正式发布

---

**计划状态：** ✅ 已完成
**下一步：** 等待用户批准，然后开始阶段 1 实施
