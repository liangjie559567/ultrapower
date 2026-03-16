<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/mcp/adapters/ - MCP 工具适配器

**用途：** 将内部工具适配为 MCP 工具接口。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `ast-adapter.ts` | AST 工具适配 |
| `lsp-adapter.ts` | LSP 工具适配 |
| `memory-adapter.ts` | 内存工具适配 |
| `notepad-adapter.ts` | Notepad 工具适配 |
| `python-adapter.ts` | Python REPL 适配 |
| `skills-adapter.ts` | Skills 工具适配 |
| `state-adapter.ts` | 状态工具适配 |
| `trace-adapter.ts` | 追踪工具适配 |

## 面向 AI 智能体

### 在此目录中工作

1. **添加新适配器**
   - 创建 `tool-adapter.ts`
   - 实现 MCP 接口
   - 注册到客户端

2. **修改适配器**
   - 编辑对应适配器文件
   - 运行测试验证

### 常见任务

```typescript
import { astAdapter } from './ast-adapter';
const tools = astAdapter.getTools();
```
