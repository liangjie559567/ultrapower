<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/mcp/config/ - MCP 配置管理

**用途：** MCP 服务器配置加载、验证、环境变量替换。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `config-loader.ts` | 配置加载器 |
| `loader.ts` | 加载逻辑 |
| `schema.ts` | 配置 Schema |
| `env-replacer.ts` | 环境变量替换 |

## 面向 AI 智能体

### 在此目录中工作

1. **加载配置**
   - 使用 `config-loader.ts` 加载 MCP 配置
   - 验证 Schema
   - 替换环境变量

2. **修改配置**
   - 编辑 `schema.ts` 更新配置结构
   - 运行测试验证

### 常见任务

```typescript
import { loadMCPConfig } from './config-loader';
const config = await loadMCPConfig();
```
