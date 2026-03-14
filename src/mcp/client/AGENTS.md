<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/mcp/client/ - MCP 客户端

**用途：** MCP 客户端实现，与 MCP 服务器通信。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `MCPClient.ts` | MCP 客户端主类 |

## 面向 AI 智能体

### 在此目录中工作

1. **使用客户端**
   - 创建 MCP 客户端实例
   - 调用 MCP 工具
   - 处理响应

### 常见任务

```typescript
import { MCPClient } from './MCPClient';
const client = new MCPClient(config);
const result = await client.callTool(toolName, args);
```
