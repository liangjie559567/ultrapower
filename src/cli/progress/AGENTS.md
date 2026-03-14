<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/cli/progress/ - 进度显示系统

**用途：** CLI 进度条、加载动画、agent 状态显示。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `progress-bar.ts` | 进度条实现 |
| `spinner.ts` | 加载动画 |
| `agent-status.ts` | Agent 状态显示 |
| `index.ts` | 导出 |
| `examples.ts` | 使用示例 |

## 面向 AI 智能体

### 在此目录中工作

1. **显示进度**
   - 使用 `progress-bar.ts` 显示百分比
   - 使用 `spinner.ts` 显示加载状态

2. **显示 Agent 状态**
   - 使用 `agent-status.ts` 显示当前 agent
   - 更新状态信息

### 常见任务

```typescript
import { ProgressBar, Spinner } from './index';
const bar = new ProgressBar();
bar.update(50);
```
