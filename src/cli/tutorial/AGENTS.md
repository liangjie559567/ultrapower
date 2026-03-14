<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/cli/tutorial/ - 交互式教程

**用途：** 新用户入门教程和引导。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `index.ts` | 教程入口 |

## 面向 AI 智能体

### 在此目录中工作

1. **运行教程**
   - 调用 `index.ts` 中的教程函数
   - 引导用户完成基本操作

### 常见任务

```typescript
import { runTutorial } from './index';
await runTutorial();
```
