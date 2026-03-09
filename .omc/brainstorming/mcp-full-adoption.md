# Brainstorming: MCP 全面采用

**日期：** 2026-03-05
**目标：** 将 ultrapower 迁移到标准 MCP 协议，提升生态兼容性

---

## 1. 问题陈述

**当前状态：**

* ultrapower 使用自定义工具协议（35 个工具通过 `mcp__plugin_ultrapower_t__` 前缀暴露）

* 部分 MCP 集成（Codex/Gemini 作为外部 workers）

* 与行业标准 MCP 不完全兼容

**行业趋势（2026）：**

* MCP 已成为 AI agent 工具集成的事实标准

* OpenAI 废弃 Assistants API，转向 MCP

* 标准化协议：工具调用、上下文共享、agent 间通信

**问题：**

* 生态隔离：无法直接使用社区 MCP 服务器

* 重复工作：自定义协议需要维护和文档

* 互操作性差：难以与其他 MCP 兼容工具集成

---

## 2. 用户需求

**核心需求：**
1. 使用社区 MCP 服务器（filesystem, github, slack 等）
2. 发布 ultrapower 工具为标准 MCP 服务器
3. 保持现有功能不变（35 工具 + 50 agents）

**次要需求：**
1. 简化工具发现和注册
2. 支持动态工具加载
3. 提升跨平台兼容性

---

## 3. 约束条件

**技术约束：**

* 必须保持向后兼容（现有用户不受影响）

* 不能破坏现有 35 工具的功能

* 需要支持 Claude Code 的工具调用机制

**资源约束：**

* 开发时间：2-4 周

* 测试覆盖：需要完整的集成测试

* 文档更新：用户迁移指南

**兼容性约束：**

* 支持 MCP 1.0 规范

* 兼容 Claude Code、Cursor、其他 MCP 客户端

* 保持 Windows/macOS/Linux 跨平台支持

---

## 4. 解决方案探索

### 方案 A：渐进式迁移（推荐）

**阶段 1：MCP 服务器包装器**

* 将现有 35 工具包装为标准 MCP 服务器

* 保持现有 `mcp__plugin_ultrapower_t__` 前缀（向后兼容）

* 新增标准 MCP 端点

**阶段 2：工具注册重构**

* 统一工具注册机制

* 支持动态加载社区 MCP 服务器

* 工具发现和能力协商

**阶段 3：协议标准化**

* 移除自定义前缀

* 完全符合 MCP 1.0 规范

* 发布到 MCP 生态系统

**优势：**

* 风险低，逐步验证

* 向后兼容，用户无感知

* 可以提前获得社区反馈

**劣势：**

* 开发周期较长（3-4 周）

* 需要维护两套协议（过渡期）

---

### 方案 B：一次性重写

**实施：**

* 直接重写为标准 MCP 服务器

* 移除所有自定义协议

* 强制用户升级

**优势：**

* 代码简洁，无历史包袱

* 完全符合标准

**劣势：**

* 破坏性变更，用户体验差

* 风险高，难以回滚

* 需要大量测试

**结论：** ❌ 不推荐

---

### 方案 C：双协议并行

**实施：**

* 同时支持自定义协议和 MCP

* 用户可选择使用哪种协议

* 长期维护两套系统

**优势：**

* 最大兼容性

* 用户自主选择

**劣势：**

* 维护成本高

* 代码复杂度增加

* 长期技术债务

**结论：** ❌ 不推荐

---

## 5. 推荐方案详细设计

**选择：方案 A - 渐进式迁移**

### 阶段 1：MCP 服务器包装器（Week 1-2）

**目标：** 将 35 工具暴露为标准 MCP 服务器

**实施步骤：**

1. **创建 MCP 服务器入口**
   ```typescript
   // src/mcp/ultrapower-mcp-server.ts
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

   const server = new Server({
     name: 'ultrapower',
     version: '5.5.14'
   }, {
     capabilities: {
       tools: {}
     }
   });
   ```

1. **工具适配器**
   ```typescript
   // 将现有工具转换为 MCP 格式
   import { lspTools, astTools, stateTools } from '../tools';

   for (const tool of [...lspTools, ...astTools, ...stateTools]) {
     server.setRequestHandler(ListToolsRequestSchema, async () => ({
       tools: [convertToMCPTool(tool)]
     }));
   }
   ```

1. **保持向后兼容**
   - 现有 `mcp__plugin_ultrapower_t__` 前缀继续工作
   - 新增标准 MCP 调用路径
   - 内部统一路由到相同实现

**交付物：**

* `src/mcp/ultrapower-mcp-server.ts`

* 集成测试套件

* 用户文档更新

---

### 阶段 2：社区 MCP 服务器集成（Week 2-3）

**目标：** 支持加载和使用社区 MCP 服务器

**实施步骤：**

1. **MCP 客户端实现**
   - 连接到外部 MCP 服务器（stdio/SSE）
   - 工具发现和能力协商
   - 请求路由和响应处理

1. **配置系统**
   ```json
   // .omc/mcp-config.json
   {
     "servers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]
       },
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": { "GITHUB_TOKEN": "..." }
       }
     }
   }
   ```

1. **工具命名空间**
   - ultrapower 工具：`ultrapower:lsp_hover`
   - 社区工具：`filesystem:read_file`, `github:create_issue`
   - 避免命名冲突

**交付物：**

* MCP 客户端实现

* 配置加载器

* 工具命名空间系统

---

### 阶段 3：协议标准化（Week 3-4）

**目标：** 完全符合 MCP 1.0 规范

**实施步骤：**

1. **移除自定义前缀**
   - 废弃 `mcp__plugin_ultrapower_t__` 前缀
   - 迁移到标准命名：`ultrapower:tool_name`
   - 提供迁移脚本

1. **发布到生态系统**
   - npm 包：`@ultrapower/mcp-server`
   - 文档：MCP 服务器使用指南
   - 示例：集成到 Claude Desktop/Cursor

1. **向后兼容层**
   - 保留旧前缀 6 个月（废弃警告）
   - 自动迁移工具
   - 用户通知机制

**交付物：**

* 标准 MCP 服务器包

* 迁移指南和工具

* 生态系统文档

---

## 6. 技术实现细节

### 工具转换示例

**现有格式：**
```typescript
{
  name: 'mcp__plugin_ultrapower_t__lsp_hover',
  description: 'Get type information at position',
  inputSchema: { ... }
}
```

**MCP 标准格式：**
```typescript
{
  name: 'lsp_hover',
  description: 'Get type information at position',
  inputSchema: {
    type: 'object',
    properties: { ... },
    required: [...]
  }
}
```

### 命名空间设计

```
ultrapower:lsp_hover          # LSP 工具
ultrapower:ast_grep_search    # AST 工具
ultrapower:state_read         # 状态工具
filesystem:read_file          # 社区工具
github:create_issue           # 社区工具
```

### 配置优先级

```
1. 项目级：.omc/mcp-config.json
2. 用户级：~/.omc/mcp-config.json
3. 默认：内置 ultrapower 工具
```

---

## 7. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
| ------ | ------ | ------ | ---------- |
| 破坏现有功能 | 高 | 中 | 完整回归测试，向后兼容层 |
| MCP 规范变更 | 中 | 低 | 跟踪规范更新，版本锁定 |
| 性能下降 | 中 | 低 | 性能基准测试，优化热路径 |
| 用户迁移困难 | 中 | 中 | 详细文档，自动迁移工具 |
| 社区工具兼容性 | 低 | 中 | 测试主流 MCP 服务器 |

---

## 8. 成功指标

**技术指标：**

* ✅ 35 工具全部转换为 MCP 格式

* ✅ 支持 ≥5 个社区 MCP 服务器

* ✅ 向后兼容率 100%

* ✅ 性能下降 <5%

**用户指标：**

* ✅ 迁移文档完成度 100%

* ✅ 用户反馈满意度 >80%

* ✅ 社区采用率（npm 下载）>100/周

**生态指标：**

* ✅ 发布到 MCP 官方目录

* ✅ 至少 3 个社区集成案例

* ✅ 文档被其他项目引用

---

## 9. 时间线

**Week 1-2：阶段 1**

* Day 1-3: MCP 服务器框架

* Day 4-7: 工具适配器（LSP/AST/State）

* Day 8-10: 集成测试

**Week 2-3：阶段 2**

* Day 11-14: MCP 客户端实现

* Day 15-17: 配置系统和命名空间

* Day 18-21: 社区服务器测试

**Week 3-4：阶段 3**

* Day 22-24: 协议标准化

* Day 25-27: 迁移工具和文档

* Day 28-30: 发布和推广

---

## 10. 下一步行动

**立即行动：**
1. ✅ 完成 brainstorming 文档
2. ⏳ 创建技术设计文档（TDD）
3. ⏳ 搭建 MCP 服务器框架原型
4. ⏳ 编写第一个工具适配器（lsp_hover）

**需要决策：**

* 是否在 v5.6.0 开始实施？

* 向后兼容层保留多久？（建议 6 个月）

* 是否需要 breaking change 警告？

**需要资源：**

* 开发时间：3-4 周全职

* 测试资源：集成测试环境

* 文档编写：用户迁移指南

---

## 11. 参考资料

**MCP 规范：**

* [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)

* [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

**社区服务器：**

* [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)

* [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

* [@modelcontextprotocol/server-slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack)

**行业案例：**

* OpenAI 废弃 Assistants API 转向 MCP

* Anthropic Claude Desktop MCP 集成

* Cursor MCP 支持

---

**文档状态：** ✅ Brainstorming 完成
**下一步：** 等待用户确认方向，然后进入 writing-plans 阶段

